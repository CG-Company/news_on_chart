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

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

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
    최근 N일간의 뉴스에서 인기 키워드 추출 (개선된 필터링 적용)
    """
    sql = f'''
    SELECT keyword, published_at, ticker
    FROM news
    WHERE keyword IS NOT NULL 
      AND keyword != ''
      AND keyword != 'None'
      AND keyword != 'null'
      AND keyword NOT LIKE '%{{}}%'
      AND keyword NOT LIKE '%[]%'
      AND keyword NOT LIKE '%()%' 
      AND published_at >= CURRENT_DATE - INTERVAL '{days} days'
      AND ticker != '000000'  -- 거시경제뉴스 제외
    ORDER BY published_at DESC
    '''
    df = pd.read_sql(text(sql), engine)
    if df.empty:
        return []
    all_keywords = []
    for keywords_str in df['keyword'].dropna():
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
    popular_keywords = []
    for i, (keyword, count) in enumerate(Counter(filtered_counts).most_common(limit), 1):
        popular_keywords.append({
            "rank": i,
            "keyword": keyword,
            "count": count
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
        "total_mentions": int(df['mention_count'].sum()),
        "total_tickers": len(df[df['ticker_count'] > 0]),
        "avg_daily_mentions": round(df['mention_count'].mean(), 1)
    }
