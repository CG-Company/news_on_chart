# DB_team/api_server.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from utils import get_stock_data, get_ticker_map, get_news_data, get_news_by_ticker_and_day, get_selected_news_by_ticker
import os
from datetime import datetime, timedelta
try:
    import redis
except ImportError:
    redis = None
import openai

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

@app.get("/api/sector_stocks")
def get_sector_stocks_api(ticker: str):
    """
    ticker: 종목코드 (예: '005930')
    같은 섹터에 속한 종목 리스트 반환
    """
    try:
        stocks = get_sector_stocks(ticker)
        return {"ticker": ticker, "sectorStocks": stocks}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/news_panel_data")
def get_news_panel_data(ticker: str, date: str):
    """
    ticker: 종목코드 (예: '005930')
    date: 'YYYY-MM-DD' 형식의 날짜 문자열
    기업뉴스, 메인뉴스, 거시경제뉴스를 한 번에 반환
    """
    from utils import get_panel_news_data
    return get_panel_news_data(ticker, date)

# LLM 요약 함수 (OpenAI 실제 연동)
def get_llm_summary(summaries, period, ticker):
    openai.api_key = os.getenv("OPENAI_API_KEY")
    joined = '\n'.join(summaries[:30])  # 너무 많으면 30개만 사용
    prompt = f"""
아래는 최근 {period}간 {ticker} 뉴스 요약문입니다.\n이 내용을 바탕으로 전체 흐름을 5줄 이내로 요약해줘.\n---\n{joined}
"""
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "너는 금융 뉴스 요약 전문가야."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=500,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()

@app.get("/api/news_summary")
def news_summary(ticker: str, period: str = '1m'):
    """
    ticker: 종목코드 (예: '005930')
    period: '1m', '3m', '1y' 등
    """
    # Redis 연결 (환경에 맞게 수정)
    r = None
    if redis:
        r = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=int(os.getenv('REDIS_PORT', 6379)), db=0)
    # 캐시 키 생성
    today = datetime.today().strftime('%Y-%m-%d')
    cache_key = f"summary:{ticker}:{period}:{today}"
    if r:
        cached = r.get(cache_key)
        if cached:
            return {"summary": cached.decode()}
    # 기간 계산
    end = datetime.today()
    if period == "1m":
        start = end - timedelta(days=30)
    elif period == "3m":
        start = end - timedelta(days=90)
    elif period == "1y":
        start = end - timedelta(days=365)
    else:
        start = end - timedelta(days=30)
    # DB에서 summary만 추출
    from utils import get_news_data
    news_list = get_news_data(ticker)
    summaries = [n['summary'] for n in news_list if n['summary'] and start.strftime('%Y-%m-%d') <= n['published_at'] <= end.strftime('%Y-%m-%d')]
    if not summaries:
        return {"summary": "해당 기간에 뉴스 요약 데이터가 없습니다."}
    # LLM 요약 생성
    summary = get_llm_summary(summaries, period, ticker)
    # Redis에 캐싱 (6시간)
    if r:
        r.setex(cache_key, 60*60*6, summary)
    return {"summary": summary}