# DB_team/api_server.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from utils import get_stock_data, get_ticker_map, get_news_data

app = FastAPI()

# CORS 설정: Next.js 개발 서버 (3000) 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

@app.get("/api/stock")
def read_stock(ticker: str = Query(..., min_length=6, max_length=6)):
    data = get_stock_data(ticker)
    if not data:
        raise HTTPException(404, detail="Ticker not found")
    return data

@app.get("/api/ticker_map")
def read_ticker_map():
    return get_ticker_map()

@app.get("/api/news")
def read_news(ticker: str = Query(..., min_length=6, max_length=6)):
    data = get_news_data(ticker)
    if not data:
        raise HTTPException(404, detail="No news found for this ticker")
    return data

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
