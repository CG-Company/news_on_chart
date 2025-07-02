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
    f"{os.getenv('DB_NAME')}?sslmode=require"
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

    # # 3-1) 기업뉴스
    # df_company = pd.read_sql(
    #     text(sql_common.format(where_clause="ticker = :ticker")),
    #     engine,
    #     params={"ticker": ticker, "date": date_str},
    # )

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
        # "companyNews": df_company.to_dict(orient="records"),
        # mainNews를 단일 dict 또는 None 반환
        "mainNews": df_main.to_dict(orient="records")[0] if not df_main.empty else None,
        "macroNews": df_macro.to_dict(orient="records"),
    }


def _build_full_prompt(cleaned: list[str], ticker: str, period: str) -> str:
    joined = "\n".join(cleaned)
    return f"""
다음은 최근 {PERIOD_KR.get(period, period)}간 종목코드 {ticker}의 뉴스 요약문들입니다.

이 내용들을 바탕으로 다음 조건에 맞춰 요약해주세요:
1. 4-6문장으로 간결하게
2. 주요 이슈 중심
3. 투자자 관점 중요 내용 위주
4. 긍정/부정 요소 균형 반영
5. 티커를 직접 얘기하지 말고 종목명으로 얘기할 것

---
{joined}
---

전체 요약:"""

def stream_summarize_news_for_period(ticker: str, period: str = "1d"):
    """
    ticker/period 에 맞춰 get_panel_news_data → cleaned 리스트 구성 후,
    OpenAI stream=True 로 떠오는 청크를 바로 yield 해 주는 제너레이터.
    """
    # 1) 날짜 리스트, raw_summaries 만들기 (기존 summarize_news_for_period 로직과 동일)
    days = PERIOD_DAYS.get(period, 1)
    end_dt = datetime.today()
    start_dt = end_dt - timedelta(days=days - 1)
    date_list = [(start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
                 for i in range(days)]

    raw_summaries = []
    for date_str in date_list:
        panel = get_panel_news_data(ticker, date_str)
        if panel["mainNews"] and panel["mainNews"].get("summary"):
            raw_summaries.append(panel["mainNews"]["summary"])
        for item in panel["macroNews"]:
            if item.get("summary"):
                raw_summaries.append(item["summary"])

    if not raw_summaries:
        raise ValueError(f"최근 {PERIOD_KR.get(period,period)}간 뉴스가 없습니다.")

    # 2) cleaned 리스트 (최대 1200개, 글자수 제한 없이)
    cleaned = [s.strip() for s in raw_summaries[:1200]]

    # 3) full prompt
    prompt = _build_full_prompt(cleaned, ticker, period)

    # 4) OpenAI stream 호출
    resp = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "당신은 금융 뉴스 분석 전문가입니다."},
            {"role": "user",   "content": prompt},
        ],
        max_tokens=500,
        temperature=0.3,
        top_p=0.9,
        stream=True,
    )

    for chunk in resp:
        if delta := chunk.choices[0].delta.get("content"):
            # ❌ 절대 붙이지 마세요: "data: "
            yield delta


def clean_keyword(keyword):
    """
    키워드를 정리하는 함수
    """
    if not keyword:
        return None
    keyword = keyword.strip()
    if not keyword:
        return None
    # 중괄호, 대괄호, 소괄호, 따옴표 제거
    keyword = re.sub(r'^[\{\[\(\'\"]+|[\}\]\)\'\"]+$', '', keyword)
    keyword = keyword.strip()
    if not keyword:
        return None
    return keyword

def is_valid_keyword(keyword):
    """
    유효한 키워드인지 검사하는 함수 (더 강화된 버전)
    """
    if not keyword:
        return False
    if len(keyword) <= 1:
        return False
    none_patterns = ['none', 'null', 'nan', 'n/a', 'na', '없음', '무', '-']
    if keyword.lower() in none_patterns:
        return False
    if re.fullmatch(r'^[^\w가-힣]+$', keyword):
        return False
    if re.fullmatch(r'^[\{\}\[\]\(\)\'\"\s`~!@#$%^&*\-_=+|\\:;<,>.?/]+$', keyword):
        return False
    if re.fullmatch(r'^[\{\[\(\'\"]+.*[\}\]\)\'\"]+$', keyword):
        return False
    if not re.search(r'[가-힣a-zA-Z0-9]', keyword):
        return False
    if len(keyword) <= 3 and re.search(r'[^\w가-힣]', keyword):
        return False
    if re.search(r'https?://|www\.|@.*\.', keyword):
        return False
    if len(re.findall(r'[^\w가-힣]', keyword)) > len(keyword) // 2:
        return False
    return True

def get_popular_keywords(days: int = 7, limit: int = 20):
    """
    최근 N일간의 뉴스에서 인기 키워드 추출 (키워드별 관련 종목 티커 리스트 포함, 메인뉴스만 집계, 000000 티커 완전 제외)
    """
    # 1. 키워드별 count 집계 (split/clean 방식)
    sql = (
        "SELECT keyword, published_at "
        "FROM news "
        "WHERE keyword IS NOT NULL "
        "  AND keyword != '' "
        "  AND keyword != 'None' "
        "  AND keyword != 'null' "
        "  AND keyword NOT LIKE '%{{}}%' "
        "  AND keyword NOT LIKE '%[]%' "
        "  AND keyword NOT LIKE '%()%' "
        f"  AND published_at >= CURRENT_DATE - INTERVAL '{days} days' "
        "  AND ticker IS NOT NULL "
        "  AND ticker != '' "
        "  AND ticker != '000000' "
        "  AND ((summary IS NOT NULL AND summary != '') OR (keyword IS NOT NULL AND keyword != '' AND keyword != '{{}}' AND keyword != '[]')) "
        "ORDER BY published_at DESC"
    )
    df = pd.read_sql(text(sql), engine)
    if df.empty:
        return []
    all_keywords = []
    for _, row in df.iterrows():
        keywords_str = row['keyword']
        if not keywords_str or keywords_str.strip() == '':
            continue
        separators = [',', ';', '/', '\\', '|', '\n', '\t']
        keywords = [keywords_str]
        for sep in separators:
            temp_keywords = []
            for kw in keywords:
                temp_keywords.extend(kw.split(sep))
            keywords = temp_keywords
        for keyword in keywords:
            cleaned_keyword = clean_keyword(keyword)
            if not cleaned_keyword:
                continue
            if not is_valid_keyword(cleaned_keyword):
                continue
            if len(cleaned_keyword) > 50:
                continue
            all_keywords.append(cleaned_keyword)
    keyword_counts = Counter(all_keywords)
    filtered_counts = {}
    for keyword, count in keyword_counts.items():
        if count >= 2 or (count == 1 and len(keyword) >= 3 and not re.search(r'[^\w가-힣\s]', keyword)):
            filtered_counts[keyword] = count

    # 2. 각 키워드별로 메인뉴스에서만 LIKE 검색으로 ticker 집계 (000000 완전 제외)
    popular_keywords = []
    for i, (keyword, count) in enumerate(Counter(filtered_counts).most_common(limit), 1):
        ticker_sql = (
            "SELECT DISTINCT ticker "
            "FROM news "
            "WHERE (keyword ILIKE :kw OR title ILIKE :kw OR summary ILIKE :kw) "
            f"  AND published_at >= CURRENT_DATE - INTERVAL '{days} days' "
            "  AND ticker IS NOT NULL "
            "  AND ticker != '' "
            "  AND ticker != '000000' "
            "  AND ((summary IS NOT NULL AND summary != '') OR (keyword IS NOT NULL AND keyword != '' AND keyword != '{{}}' AND keyword != '[]')) "
        )
        kw_pattern = f"%{keyword}%"
        ticker_df = pd.read_sql(text(ticker_sql), engine, params={"kw": kw_pattern})
        tickers = sorted([t for t in set(ticker_df['ticker'].tolist()) if t != '000000'])
        popular_keywords.append({
            "rank": i,
            "keyword": keyword,
            "count": count,
            "tickers": tickers
        })
    return popular_keywords

def get_sector_stocks(ticker: str):
    """
    ticker: 종목코드 (예: '005930')
    같은 섹터에 속한 종목 리스트 반환
    """
    sql = """
    SELECT t2.ticker, t2.company_name, t2.sector
    FROM ticker t1
    JOIN ticker t2 ON t1.sector = t2.sector
    WHERE t1.ticker = :ticker
      AND t2.ticker != :ticker
    ORDER BY t2.ticker
    """
    df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
    return [{"ticker": r["ticker"], "name": r["company_name"], "sector": r["sector"]} for r in df.to_dict(orient="records")]

def get_news_by_keyword(keyword: str, days: int = 7, limit: int = 50):
    """
    특정 키워드가 포함된 뉴스 조회
    """
    sql = """
    SELECT 
        ticker,
        published_at,
        title,
        summary,
        keyword,
        url,
        sentiment_score
    FROM news
    WHERE (keyword ILIKE :keyword OR title ILIKE :keyword_title OR summary ILIKE :keyword_summary)
      AND published_at >= CURRENT_DATE - INTERVAL '%s days'
      AND ticker != '000000'
    ORDER BY published_at DESC
    LIMIT :limit
    """ % days
    
    keyword_pattern = f"%{keyword}%"
    df = pd.read_sql(text(sql), engine, params={
        "keyword": keyword_pattern,
        "keyword_title": keyword_pattern,
        "keyword_summary": keyword_pattern,
        "limit": limit
    })
    
    df = df.fillna('')
    df['published_at'] = pd.to_datetime(df['published_at']).dt.strftime('%Y-%m-%d %H:%M')
    
    return df.to_dict(orient="records")

def get_keyword_statistics(keyword: str, days: int = 30):
    """
    키워드의 시간별 언급 통계
    """
    sql = """
    SELECT 
        DATE(published_at) as date,
        COUNT(*) as mention_count,
        COUNT(DISTINCT ticker) as ticker_count,
        AVG(CASE WHEN sentiment_score IS NOT NULL THEN sentiment_score END) as avg_sentiment
    FROM news
    WHERE (keyword ILIKE :keyword OR title ILIKE :keyword_title OR summary ILIKE :keyword_summary)
      AND published_at >= CURRENT_DATE - INTERVAL '%s days'
      AND ticker != '000000'
    GROUP BY DATE(published_at)
    ORDER BY date DESC
    """ % days
    
    keyword_pattern = f"%{keyword}%"
    df = pd.read_sql(text(sql), engine, params={
        "keyword": keyword_pattern,
        "keyword_title": keyword_pattern,
        "keyword_summary": keyword_pattern
    })
    
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    df = df.fillna({'avg_sentiment': 0})
    
    return {
        "keyword": keyword,
        "period": f"{days}일",
        "daily_stats": df.to_dict(orient="records"),
        "total_mentions": int(df['mention_count'].sum() or 0),
        "total_tickers": len(df[df['ticker_count'] > 0]),
        "avg_daily_mentions": round(df['mention_count'].mean(), 1)
    }
