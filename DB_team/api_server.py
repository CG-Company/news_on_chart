# DB_team/api_server.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from utils import (
    get_stock_data, 
    get_ticker_map, 
    get_news_data, 
    get_news_by_ticker_and_day, 
    get_selected_news_by_ticker,
    get_sector_stocks,
    get_panel_news_data,
    get_popular_keywords,
    get_news_by_keyword,
    get_keyword_statistics,
    stream_summarize_news_for_period,
    get_latest_reports,
    engine
)
import re
from sqlalchemy import text
import logging
import json
import time
import traceback
import math

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stock Analysis API", version="1.0.0")
app = FastAPI(title="Stock Analysis API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_json(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: safe_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [safe_json(x) for x in obj]
    else:
        return obj

@app.get("/")
def read_root():
    return {"message": "Stock Analysis API", "status": "running"}

@app.get("/health")
def health_check():
    """헬스 체크 엔드포인트"""
    try:
        if engine:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return {"status": "healthy", "database": "connected"}
        else:
            return {"status": "unhealthy", "database": "disconnected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.get("/api/stock")
def read_stock(ticker: str = Query(..., min_length=6, max_length=6)):
    """주식 데이터 조회"""
    try:
        data = get_stock_data(ticker)
        if not data:
            raise HTTPException(404, detail="Ticker not found")
        return safe_json({"stockData": data})
    except Exception as e:
        logger.error(f"Error in read_stock: {e}")
        raise HTTPException(500, detail=str(e))

@app.get("/api/ticker_map")
def read_ticker_map():
    """티커 맵 조회"""
    try:
        data = get_ticker_map()
        logger.info(f"Returning {len(data)} tickers")
        return safe_json(data)
    except Exception as e:
        logger.error(f"Error in read_ticker_map: {e}")
        raise HTTPException(500, detail=f"티커 맵 조회 중 오류: {str(e)}")

@app.get("/api/news")
def read_news(ticker: str = Query(..., min_length=6, max_length=6)):
    """뉴스 데이터 조회"""
    try:
        data = get_news_data(ticker)
        return safe_json(data)
    except Exception as e:
        logger.error(f"Error in read_news: {e}")
        raise HTTPException(500, detail=str(e))

@app.get("/api/news_is_selected")
def get_news_is_selected(ticker: str):
    """is_selected가 True인 뉴스만 반환"""
    """is_selected가 True인 뉴스만 반환"""
    try:
        news = get_selected_news_by_ticker(ticker)
        return safe_json({"ticker": ticker, "news": news})
    except Exception as e:
        logger.error(f"Error in get_news_is_selected: {e}")
        return safe_json({"ticker": ticker, "news": [], "error": str(e)})

@app.get("/api/news_day")
def get_news_day(ticker: str, day: str):
    """특정 날짜 뉴스 조회"""
    """특정 날짜 뉴스 조회"""
    try:
        news = get_news_by_ticker_and_day(ticker, day)
        return safe_json({"ticker": ticker, "day": day, "news": news})
    except Exception as e:
        logger.error(f"Error in get_news_day: {e}")
        return safe_json({"ticker": ticker, "day": day, "news": [], "error": str(e)})

@app.get("/api/macro_news")
def get_macro_news():
    """거시경제 뉴스 조회"""
    try:
        data = get_news_data('000000')
        return safe_json(data)
    except Exception as e:
        logger.error(f"Error in get_macro_news: {e}")
        raise HTTPException(500, detail=str(e))

@app.get("/api/sector_stocks")
def get_sector_stocks_api(ticker: str):
    """같은 섹터 종목 조회"""
    """같은 섹터 종목 조회"""
    try:
        stocks = get_sector_stocks(ticker)
        return safe_json({"ticker": ticker, "sectorStocks": stocks})
    except Exception as e:
        logger.error(f"Error in get_sector_stocks_api: {e}")
        return safe_json({"ticker": ticker, "sectorStocks": [], "error": str(e)})

@app.get("/api/news_panel_data")
def get_news_panel_data_api(ticker: str, date: str):
    """패널용 뉴스 데이터 조회"""
    try:
        data = get_panel_news_data(ticker, date)
        return safe_json(data)
    except Exception as e:
        logger.error(f"Error in get_news_panel_data_api: {e}")
        return safe_json({"mainNews": None, "macroNews": [], "error": str(e)})

@app.get("/api/popular_keywords")
def get_popular_keywords_api(
    days: int = Query(7, ge=1, le=30, description="최근 며칠간의 데이터를 분석할지"),
    limit: int = Query(20, ge=5, le=100, description="반환할 키워드 개수")
):
    """인기 키워드 조회"""
    try:
        logger.info(f"Getting popular keywords for {days} days, limit {limit}")
        keywords = get_popular_keywords(days, limit)
        response_keywords = []
        for k in keywords:
            safe_keyword = {
                "rank": k.get("rank", 0),
                "keyword": k.get("keyword", ""),
                "count": k.get("count", 0),
                "tickers": k.get("tickers", []),
                "sentiment": k.get("sentiment", "neutral"),
                "is_hot": k.get("is_hot", False)
            }
            response_keywords.append(safe_json(safe_keyword))
        response = {
            "period": f"{days}일",
            "total_keywords": len(response_keywords),
            "keywords": response_keywords
        }
        logger.info(f"Returning {len(response_keywords)} keywords")
        return safe_json(response)
    except Exception as e:
        logger.error(f"Error in get_popular_keywords_api: {e}")
        logger.error(traceback.format_exc())
        return safe_json({
            "period": f"{days}일",
            "total_keywords": 0,
            "keywords": [],
            "error": str(e)
        })

@app.get("/api/keyword_news")
def get_keyword_news_api(
    keyword: str = Query(..., min_length=1, description="검색할 키워드"),
    days: int = Query(7, ge=1, le=30, description="검색할 기간(일)"),
    limit: int = Query(50, ge=1, le=200, description="최대 뉴스 개수")
):
    """키워드 관련 뉴스 조회"""
    try:
        news_list = get_news_by_keyword(keyword, days, limit)
        return safe_json({
            "keyword": keyword,
            "period": f"{days}일",
            "total_news": len(news_list),
            "news": news_list
        })
    except Exception as e:
        logger.error(f"Error in get_keyword_news_api: {e}")
        return safe_json({
            "keyword": keyword,
            "period": f"{days}일",
            "total_news": 0,
            "news": [],
            "error": str(e)
        })

@app.get("/api/keyword_stats")
def get_keyword_stats_api(
    keyword: str = Query(..., min_length=1, description="분석할 키워드"),
    days: int = Query(30, ge=7, le=90, description="분석할 기간(일)")
):
    """키워드 통계 조회"""
    try:
        stats = get_keyword_statistics(keyword, days)
        return safe_json(stats)
    except Exception as e:
        logger.error(f"Error in get_keyword_stats_api: {e}")
        return safe_json({
            "keyword": keyword,
            "period": f"{days}일",
            "daily_stats": [],
            "total_mentions": 0,
            "total_tickers": 0,
            "avg_daily_mentions": 0.0,
            "error": str(e)
        })

@app.get("/api/related_keywords")
def get_related_keywords_api(
    keyword: str = Query(..., min_length=1, description="기준 키워드"),
    days: int = Query(7, ge=1, le=30, description="분석할 기간(일)"),
    limit: int = Query(10, ge=5, le=50, description="관련 키워드 개수")
):
    """관련 키워드 조회"""
    try:
        if not engine:
            return safe_json({
                "base_keyword": keyword,
                "period": f"{days}일",
                "related_keywords": [],
                "error": "Database connection not available"
            })
        sql = """
        SELECT 
            keyword,
            COUNT(*) as co_occurrence,
            COUNT(DISTINCT ticker) as ticker_count
        FROM news
        WHERE (keyword ILIKE :keyword OR title ILIKE :keyword_title OR summary ILIKE :keyword_summary)
          AND published_at >= CURRENT_DATE - INTERVAL '%s days'
          AND ticker != '000000'
          AND keyword IS NOT NULL
          AND keyword != ''
          AND keyword != 'None'
          AND keyword != 'null'
        GROUP BY keyword
        HAVING COUNT(*) >= 2
        ORDER BY co_occurrence DESC
        LIMIT :limit
        """ % days
        keyword_pattern = f"%{keyword}%"
        import pandas as pd
        df = pd.read_sql(text(sql), engine, params={
            "keyword": keyword_pattern,
            "keyword_title": keyword_pattern,
            "keyword_summary": keyword_pattern,
            "limit": limit * 3
        })
        related_keywords = []
        for _, row in df.iterrows():
            keywords_str = row['keyword']
            if keywords_str:
                separators = [',', ';', '/', '\\', '|']
                keywords = [keywords_str]
                for sep in separators:
                    temp_keywords = []
                    for kw in keywords:
                        temp_keywords.extend(str(kw).split(sep))
                    keywords = temp_keywords
                for kw in keywords:
                    kw = str(kw).strip()
                    kw = re.sub(r'^[\{\[\(''\"]+|[\}\]\)''\"]+$', '', kw).strip()
                    if (kw and len(kw) > 1 and 
                        kw.lower() != keyword.lower() and
                        not re.fullmatch(r'^[^\w가-힣]+$', kw) and
                        kw.lower() not in ['none', 'null', 'nan']):
                        related_keywords.append({
                            "keyword": kw,
                            "relevance": row['co_occurrence'],
                            "ticker_count": row['ticker_count']
                        })
        unique_keywords = {}
        for item in related_keywords:
            kw = item["keyword"]
            if kw in unique_keywords:
                unique_keywords[kw]["relevance"] += item["relevance"]
            else:
                unique_keywords[kw] = item
        sorted_keywords = sorted(unique_keywords.values(), 
                               key=lambda x: x["relevance"], reverse=True)[:limit]
        return safe_json({
            "base_keyword": keyword,
            "period": f"{days}일",
            "related_keywords": sorted_keywords
        })
    except Exception as e:
        logger.error(f"Error in get_related_keywords_api: {e}")
        return safe_json({
            "base_keyword": keyword,
            "period": f"{days}일",
            "related_keywords": [],
            "error": str(e)
        })

@app.get("/api/news_summary/stream")
def news_summary_stream(
    ticker: str = Query(...), period: str = Query("1d")
):
    """뉴스 요약 스트리밍 (SSE)"""
    try:
        def event_stream():
            for chunk in stream_summarize_news_for_period(ticker, period):
                if chunk:
                    yield f"data: {json.dumps(safe_json({'content': chunk}), ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        logger.error(f"Error in news_summary_stream: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(500, str(e))

@app.get("/api/report")
def get_report(ticker: str):
    try:
        reports = get_latest_reports(ticker)
        return {"ticker": ticker, "reports": reports}
    except Exception as e:
        return {"error": str(e)}