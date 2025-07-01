# DB_team/api_server.py - 완전 수정 버전
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from utils import get_stock_data, get_ticker_map, get_news_data, get_news_by_ticker_and_day, get_selected_news_by_ticker, summarize_news_for_period, get_popular_keywords
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    try:
        news = get_selected_news_by_ticker(ticker)
        return {"ticker": ticker, "news": news}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/news_day")
def get_news_day(ticker: str, day: str):
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

@app.get("/api/news_panel_data")
def get_news_panel_data(ticker: str, date: str):
    from utils import get_panel_news_data
    return get_panel_news_data(ticker, date)

@app.get("/api/news_summary")
def news_summary(
    ticker: str = Query(..., min_length=6, max_length=6, description="종목 코드"),
    period: str = Query("3m", regex="^(1d|1m|3m|1y)$", description="기간 (1d, 1m, 3m, 1y)")
):
    """
    ticker와 period를 받아 해당 기간 동안의 뉴스 요약을 반환합니다.
    요청 예시: GET /api/news_summary?ticker=000660&period=3m
    """
    try:
        result = summarize_news_for_period(ticker, period)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/popular_keywords")
def get_popular_keywords_api(
    days: int = Query(7, ge=1, le=30, description="최근 며칠간의 데이터를 분석할지"),
    limit: int = Query(20, ge=5, le=100, description="반환할 키워드 개수")
):
    """
    최근 N일간의 뉴스에서 인기 키워드 추출
    """
    try:
        keywords = get_popular_keywords(days, limit)
        return {
            "period": f"{days}일",
            "total_keywords": len(keywords),
            "keywords": keywords
        }
    except Exception as e:
        raise HTTPException(500, detail=f"키워드 조회 중 오류가 발생했습니다: {str(e)}")