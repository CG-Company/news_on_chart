# DB_team/api_server.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from utils import get_stock_data, get_ticker_map, get_news_data, get_news_by_ticker_and_day, get_selected_news_by_ticker

app = FastAPI()

# CORS 설정: Next.js 개발 서버 (3000) 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 또는 ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stock")
def read_stock(ticker: str = Query(..., min_length=6, max_length=6)):
    data = get_stock_data(ticker)
    if not data:
        raise HTTPException(404, detail="Ticker not found")
    return {"stockData": data}

@app.get("/api/ticker_map")
def read_ticker_map():
    return get_ticker_map()

@app.get("/api/news")
def read_news(ticker: str = Query(..., min_length=6, max_length=6)):
    data = get_news_data(ticker)
    if not data:
        raise HTTPException(404, detail="No news found for this ticker")
    return data

@app.get("/api/news_is_selected")
def get_news_is_selected(ticker: str):
    """
    ticker: 종목코드 (예: '005930')
    is_selected가 True인 뉴스만 반환
    """
    try:
        news = get_selected_news_by_ticker(ticker)
        return {"ticker": ticker, "news": news}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/news_day")
def get_news_day(ticker: str, day: str):
    """
    ticker: 종목코드 (예: '005930')
    day: 'yymmdd' 또는 'yyyymmdd' 형식의 날짜 문자열
    """
    try:
        news = get_news_by_ticker_and_day(ticker, day)
        return {"ticker": ticker, "day": day, "news": news}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/macro_news")
def get_macro_news():
    data = get_news_data('000000')
    if not data:
        raise HTTPException(404, detail="No macro news found")
    return data