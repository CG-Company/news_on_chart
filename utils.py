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
    # 종목별 뉴스(companyNews)와 macro 뉴스(macroNews)를 날짜별로 묶어서 반환
    sql = """
    SELECT n.price_date AS date, n.title, n.url, n.summary, n.content, p.name AS publisher, n.ticker
    FROM news n
    JOIN publisher p ON n.publisher_id = p.publisher_id
    WHERE n.ticker = :ticker OR n.ticker = 'macro'
    ORDER BY n.price_date, n.ticker
    """
    df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
    # 날짜별로 companyNews, macroNews 분리
    result = {}
    for _, row in df.iterrows():
        date = row['date'].strftime('%Y-%m-%d') if hasattr(row['date'], 'strftime') else str(row['date'])
        if date not in result:
            result[date] = {"date": date, "companyNews": [], "macroNews": []}
        news_item = {
            "title": row["title"],
            "url": row["url"],
            "summary": row["summary"],
            "content": row["content"],
            "publisher": row["publisher"]
        }
        if row["ticker"] == ticker:
            result[date]["companyNews"].append(news_item)
        elif row["ticker"] == "macro":
            result[date]["macroNews"].append(news_item)
    return list(result.values())
