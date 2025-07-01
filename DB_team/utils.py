# DB_team/utils.py
import os
import logging
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import openai
from fastapi import HTTPException
from collections import Counter
import re

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env.supabase"))

openai.api_key = os.getenv('OPENAI_API_KEY')  # 또는 'YOUR_OPENAI_API_KEY'

engine = create_engine(
    f"postgresql+psycopg2://"
    f"{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@"
    f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/"
    f"{os.getenv('DB_NAME')}"
)

PERIOD_DAYS = {
    "1d": 1,
    "1m": 30,
    "3m": 90,
    "1y": 365,
}

# period 문자열 → 한글 매핑 (프롬프트용)
PERIOD_KR = {
    "1d": "1일",
    "1m": "1개월",
    "3m": "3개월",
    "1y": "1년",
}

def get_stock_data(ticker: str):
    sql = """
    SELECT
        price_date  AS date,
        open_price  AS open,
        high_price  AS high,
        low_price   AS low,
        close_price AS close,
        change_rate AS change_rate
       
    FROM stock_price
    WHERE ticker = :ticker
      AND close_price != 0
    ORDER BY price_date
    """
    df = pd.read_sql(text(sql), engine, params={"ticker": ticker})

    return df.to_dict(orient="records")

def get_ticker_map():
    sql = """
    SELECT ticker, company_name, sector
    FROM ticker
    ORDER BY ticker
    """
    df = pd.read_sql(text(sql), engine)
    # { ticker: "005930", name: "삼성전자" } 형태로 내려주려면:
    return [{"ticker": r["ticker"], "name": r["company_name"], "sector": r["sector"]} for r in df.to_dict(orient="records")]

def get_news_data(ticker: str):
    sql = """
    SELECT
        ticker,
        published_at,
        title,
        summary,
        keyword,
        url
    FROM news
    WHERE ticker = :ticker
    ORDER BY published_at DESC
    """
    df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
    df = df.fillna('')
    df['published_at'] = pd.to_datetime(df['published_at']).dt.strftime('%Y-%m-%d')
    return df.to_dict(orient="records")

def get_selected_news_by_ticker(ticker: str):
    """
    ticker: 종목코드 (예: '005930')
    is_selected가 True인 뉴스만 반환
    """
    sql = """
    SELECT
        ticker,
        published_at,
        title,
        summary,
        keyword,
        url
    FROM news
    WHERE ticker = :ticker
      AND is_selected = true
    ORDER BY published_at DESC
    """
    df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
    df = df.fillna('')
    df['published_at'] = pd.to_datetime(df['published_at']).dt.strftime('%Y-%m-%d')
    return df.to_dict(orient="records")

def get_news_by_ticker_and_day(ticker: str, day: str):
    """
    ticker: 종목코드 (예: '005930')
    day: 'yymmdd' 또는 'yyyymmdd' 형식의 날짜 문자열
    """
    # day를 yyyymmdd로 변환
    if len(day) == 6:
        # yymmdd -> yyyymmdd (20xx 기준)
        day_fmt = f"20{day}"
    elif len(day) == 8:
        day_fmt = day
    else:
        raise ValueError("day는 yymmdd 또는 yyyymmdd 형식이어야 합니다.")
    
    sql = """
    SELECT
        ticker,
        published_at,
        title,
        summary,
        keyword,
        url
    FROM news
    WHERE ticker = :ticker
      AND TO_CHAR(published_at, 'YYYYMMDD') = :day
    ORDER BY published_at DESC
    """
    df = pd.read_sql(text(sql), engine, params={"ticker": ticker, "day": day_fmt})
    df = df.fillna('')
    df['published_at'] = pd.to_datetime(df['published_at']).dt.strftime('%Y-%m-%d')
    return df.to_dict(orient="records")

def get_panel_news_data(ticker: str, date_str: str) -> dict:
    """
    ticker: '005930' 등 종목코드
    date_str: 'YYYY-MM-DD' 형식
    → companyNews, mainNews, macroNews 를 dict 리스트로 반환
    """
    sql_common = """
    SELECT title, summary, url, published_at
    FROM news
    WHERE {where_clause}
      AND DATE(published_at) = :date
    ORDER BY published_at DESC
    """

    # 3-1) 기업뉴스
    df_company = pd.read_sql(
        text(sql_common.format(where_clause="ticker = :ticker")),
        engine,
        params={"ticker": ticker, "date": date_str},
    )

    # 3-2) 메인뉴스 (is_selected = true) — 단건만
    df_main = pd.read_sql(
        text(sql_common.format(where_clause="ticker = :ticker AND is_selected = true") + " LIMIT 1"),
        engine,
        params={"ticker": ticker, "date": date_str},
    )

    # 3-3) 거시경제뉴스 (ticker = '000000')
    df_macro = pd.read_sql(
        text(sql_common.format(where_clause="ticker = '000000'")),
        engine,
        params={"date": date_str},
    )

    return {
        "companyNews": df_company.to_dict(orient="records"),
        # mainNews를 단일 dict 또는 None 반환
        "mainNews": df_main.to_dict(orient="records")[0] if not df_main.empty else None,
        "macroNews": df_macro.to_dict(orient="records"),
    }


# ─── 4) LLM 요약 함수 (기간 기반) ───────────────────────────────────
def summarize_news_for_period(ticker: str, period: str = "1d") -> dict:
    """
    ticker: '005930' 등
    period: '1d','1m','3m','1y'
    → 지정된 기간 내 모든 날짜별 패널 뉴스에서 summary 추출 후, LLM 요약 실행
    반환: {
       "summary": "...",
       "period": period,
       "news_count": 총추출개수
    }
    """
    # 4-1) 기간 → 날짜 리스트 생성
    days = PERIOD_DAYS.get(period, 1)
    end_dt = datetime.today()
    start_dt = end_dt - timedelta(days=days - 1)
    date_list = [
        (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
        for i in range(days)
    ]

    # 4-2) 각 날짜별로 패널 데이터 조회 → summary 리스트로 축합
    raw_summaries = []
    for date_str in date_list:
        panel = get_panel_news_data(ticker, date_str)
        # main, company, macro 모두에서 summary만 추출
        if panel["mainNews"] and panel["mainNews"].get("summary"):
            raw_summaries.append(panel["mainNews"]["summary"])
        for item in panel["companyNews"] + panel["macroNews"]:
            if item.get("summary"):
                raw_summaries.append(item["summary"])

    if not raw_summaries:
        raise ValueError(f"최근 {PERIOD_KR.get(period, period)}간 ({start_dt.strftime('%Y-%m-%d')}~{end_dt.strftime('%Y-%m-%d')}) 뉴스가 없습니다.")

    # 4-3) 최대 30개, 총 문자수 6000자 제한
    cleaned = []
    total_len = 0
    for s in raw_summaries[:30]:
        txt = s.strip()
        if not txt:
            continue
        if total_len + len(txt) > 6000:
            break
        cleaned.append(txt)
        total_len += len(txt)

    # 4-4) 프롬프트 생성
    joined = "\n".join(cleaned)
    prompt = f"""
다음은 최근 {PERIOD_KR.get(period, period)}간 종목코드 {ticker}의 뉴스 요약문들입니다.

이 내용들을 바탕으로 다음 조건에 맞춰 요약해주세요:
1. 4-6문장으로 간결하게
2. 주요 이슈 중심
3. 투자자 관점 중요 내용 위주
4. 긍정/부정 요소 균형 반영

---
{joined}
---

전체 요약:"""

    # 4-5) OpenAI 호출
    try:
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "당신은 금융 뉴스 분석 전문가입니다."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=500,
            temperature=0.3,
            top_p=0.9,
        )
        choice = resp.choices[0]
        # v0.27+ 형식 vs 구버전 호환
        if hasattr(choice, "message"):
            summary = choice.message.content.strip()
        else:
            summary = choice.text.strip()
    except openai.error.OpenAIError as e:
        raise RuntimeError(f"OpenAI API 호출 실패: {e}")

    return {
        "summary": summary,
        "period": period,
        "news_count": len(cleaned),
    }



def get_popular_keywords(days: int = 7, limit: int = 20):
    """
    최근 N일간의 뉴스에서 인기 키워드 추출
    """
    sql = """
    SELECT keyword, published_at, ticker
    FROM news
    WHERE keyword IS NOT NULL 
      AND keyword != ''
      AND published_at >= CURRENT_DATE - INTERVAL '%s days'
      AND ticker != '000000'  -- 거시경제뉴스 제외
    ORDER BY published_at DESC
    """ % days
    
    df = pd.read_sql(text(sql), engine)
    
    if df.empty:
        return []
    
    # 모든 키워드를 합치고 개별 키워드로 분리
    all_keywords = []
    for keywords_str in df['keyword'].dropna():
        if keywords_str.strip():
            keywords = re.split(r'[,;/\\|]', keywords_str)
            for keyword in keywords:
                keyword = keyword.strip()
                if keyword and len(keyword) > 1:  # 1글자 키워드 제외
                    all_keywords.append(keyword)
    # 키워드 빈도수 계산
    keyword_counts = Counter(all_keywords)
    # 상위 N개 키워드 반환
    popular_keywords = []
    for i, (keyword, count) in enumerate(keyword_counts.most_common(limit), 1):
        popular_keywords.append({
            "rank": i,
            "keyword": keyword,
            "count": count
        })
    return popular_keywords