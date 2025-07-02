# DB_team/api_server.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
<<<<<<< HEAD
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
    get_keyword_statistics
)
import re
from sqlalchemy import text
from utils import engine
=======
from utils import get_stock_data, get_ticker_map, get_news_data, get_news_by_ticker_and_day, get_selected_news_by_ticker, summarize_news_for_period, get_popular_keywords
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

>>>>>>> f44095b8aa4b251d1fea24c36c34c34ae01f41b3

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
def get_news_panel_data_api(ticker: str, date: str):
    """
    ticker: 종목코드 (예: '005930')
    date: 'YYYY-MM-DD' 형식의 날짜 문자열
    기업뉴스, 메인뉴스, 거시경제뉴스를 한 번에 반환
    """
    return get_panel_news_data(ticker, date)

<<<<<<< HEAD
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

@app.get("/api/keyword_news")
def get_keyword_news_api(
    keyword: str = Query(..., min_length=1, description="검색할 키워드"),
    days: int = Query(7, ge=1, le=30, description="검색할 기간(일)"),
    limit: int = Query(50, ge=1, le=200, description="최대 뉴스 개수")
):
    """
    특정 키워드가 포함된 뉴스 조회
    """
    try:
        news_list = get_news_by_keyword(keyword, days, limit)
        return {
            "keyword": keyword,
            "period": f"{days}일",
            "total_news": len(news_list),
            "news": news_list
        }
    except Exception as e:
        raise HTTPException(500, detail=f"키워드 뉴스 조회 중 오류가 발생했습니다: {str(e)}")

@app.get("/api/keyword_stats")
def get_keyword_stats_api(
    keyword: str = Query(..., min_length=1, description="분석할 키워드"),
    days: int = Query(30, ge=7, le=90, description="분석할 기간(일)")
):
    """
    키워드의 시간별 언급 통계 및 트렌드 분석
    """
    try:
        stats = get_keyword_statistics(keyword, days)
        return stats
    except Exception as e:
        raise HTTPException(500, detail=f"키워드 통계 조회 중 오류가 발생했습니다: {str(e)}")

@app.get("/api/related_keywords")
def get_related_keywords_api(
    keyword: str = Query(..., min_length=1, description="기준 키워드"),
    days: int = Query(7, ge=1, le=30, description="분석할 기간(일)"),
    limit: int = Query(10, ge=5, le=50, description="관련 키워드 개수")
):
    """
    특정 키워드와 함께 언급되는 관련 키워드 찾기
    """
    try:
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
            "limit": limit * 3  # 더 많이 가져와서 필터링
        })
        
        # 키워드 파싱 및 관련 키워드 추출
        related_keywords = []
        for _, row in df.iterrows():
            keywords_str = row['keyword']
            if keywords_str:
                # 키워드 분리
                separators = [',', ';', '/', '\\', '|']
                keywords = [keywords_str]
                
                for sep in separators:
                    temp_keywords = []
                    for kw in keywords:
                        temp_keywords.extend(kw.split(sep))
                    keywords = temp_keywords
                
                for kw in keywords:
                    kw = kw.strip()
                    # 중괄호, 따옴표 제거
                    kw = re.sub(r'^[\{\[\(\'\"]+|[\}\]\)\'\"]+$', '', kw).strip()
                    
                    if (kw and len(kw) > 1 and 
                        kw.lower() != keyword.lower() and
                        not re.fullmatch(r'^[^\w가-힣]+$', kw) and
                        kw.lower() not in ['none', 'null', 'nan']):
                        
                        related_keywords.append({
                            "keyword": kw,
                            "relevance": row['co_occurrence'],
                            "ticker_count": row['ticker_count']
                        })
        
        # 중복 제거 및 정렬
        unique_keywords = {}
        for item in related_keywords:
            kw = item["keyword"]
            if kw in unique_keywords:
                unique_keywords[kw]["relevance"] += item["relevance"]
            else:
                unique_keywords[kw] = item
        
        sorted_keywords = sorted(unique_keywords.values(), 
                               key=lambda x: x["relevance"], reverse=True)[:limit]
        
        return {
            "base_keyword": keyword,
            "period": f"{days}일",
            "related_keywords": sorted_keywords
        }
        
    except Exception as e:
        raise HTTPException(500, detail=f"관련 키워드 조회 중 오류가 발생했습니다: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
=======
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
>>>>>>> f44095b8aa4b251d1fea24c36c34c34ae01f41b3
