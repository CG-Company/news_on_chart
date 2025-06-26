import os
from datetime import date
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv('stock.env')

# DB 연결 헬퍼
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT"),
        cursor_factory=RealDictCursor
    )

# FastAPI 앱 초기화
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요약 조회 엔드포인트
@app.get("/summary/")
def get_summary(ticker: str, date_str: str):
    """
    ticker: 종목 코드 (예: '000660')
    date_str: YYYY-MM-DD 형식의 날짜 문자열
    """
    # 날짜 파싱
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT summary FROM news WHERE ticker = %s AND price_date = %s",
            (ticker, target_date)
        )
        rows = cur.fetchall()
        if not rows:
            return {"ticker": ticker, "date": date_str, "summaries": []}
        summaries = [row['summary'] for row in rows if row.get('summary')]
        print({"ticker": ticker, "date": date_str, "summaries": summaries}) 
        return {"ticker": ticker, "date": date_str, "summaries": summaries}
    finally:
        cur.close()
        conn.close()

# 전체 뉴스 조회 예시 엔드포인트
@app.get("/news/")
def get_news(ticker: str, date_str: str = None):
    """
    ticker: 종목 코드
    date_str: 선택적, YYYY-MM-DD 날짜 필터
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        if date_str:
            try:
                target_date = date.fromisoformat(date_str)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
            cur.execute(
                "SELECT title, url, published_at, summary FROM news WHERE ticker = %s AND price_date = %s ORDER BY published_at DESC",
                (ticker, target_date)
            )
        else:
            cur.execute(
                "SELECT title, url, published_at, summary FROM news WHERE ticker = %s ORDER BY published_at DESC LIMIT 20",
                (ticker,)
            )

        print({"ticker": ticker, "news": cur.fetchall()})
        return {"ticker": ticker, "news": cur.fetchall()}
    finally:
        cur.close()
        conn.close()

@app.get("/stock")
def get_stock(ticker: str):
    """
    ticker: 종목 코드
    반환: 종목의 주가 기록 배열
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT price_date, close_price FROM stock_price WHERE ticker = %s ORDER BY price_date",
            (ticker,),
        )
        rows = cur.fetchall()
        result = [
            {"price_date": r["price_date"].isoformat(), "close_price": float(r["close_price"])}
            for r in rows
        ]
        return {"ticker": ticker, "prices": result}
    finally:
        cur.close()
        conn.close()



        