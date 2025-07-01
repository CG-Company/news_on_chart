# DB_team/utils.py
import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

engine = create_engine(
    f"postgresql+psycopg2://"
    f"{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@"
    f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/"
    f"{os.getenv('DB_NAME')}"
)

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

def get_panel_news_data(ticker: str, date: str):
    """
    ticker: 종목코드 (예: '005930')
    date: 'YYYY-MM-DD' 형식의 날짜 문자열
    기업뉴스, 메인뉴스, 거시경제뉴스를 한 번에 반환
    """
    # 기업뉴스
    sql_company = """
    SELECT title, summary, url, published_at, sentiment_score
    FROM news
    WHERE ticker = :ticker AND TO_CHAR(published_at, 'YYYY-MM-DD') = :date
    ORDER BY published_at DESC
    """
    df_company = pd.read_sql(text(sql_company), engine, params={"ticker": ticker, "date": date})

    # 메인뉴스 (is_selected = true)
    sql_main = """
    SELECT title, summary, url, published_at, sentiment_score
    FROM news
    WHERE ticker = :ticker AND TO_CHAR(published_at, 'YYYY-MM-DD') = :date AND is_selected = true
    ORDER BY published_at DESC LIMIT 1
    """
    df_main = pd.read_sql(text(sql_main), engine, params={"ticker": ticker, "date": date})

    # 거시경제뉴스 (ticker = '000000')
    sql_macro = """
    SELECT title, summary, url, published_at
    FROM news
    WHERE ticker = '000000' AND TO_CHAR(published_at, 'YYYY-MM-DD') = :date
    ORDER BY published_at DESC
    """
    df_macro = pd.read_sql(text(sql_macro), engine, params={"date": date})

    return {
        "companyNews": df_company.to_dict(orient="records"),
        "mainNews": df_main.to_dict(orient="records")[0] if not df_main.empty else None,
        "macroNews": df_macro.to_dict(orient="records"),
    }

