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

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env.supabase"))

openai.api_key = os.getenv('OPENAI_API_KEY')

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    engine = create_engine(
        f"postgresql+psycopg2://"
        f"{os.getenv('DB_USER')}:{os.getenv('DB_PASS')}@"
        f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/"
        f"{os.getenv('DB_NAME')}?sslmode=require"
    )
    # 연결 테스트
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    engine = None

PERIOD_DAYS = {
    "1d": 1,
    "1m": 30,
    "3m": 90,
    "1y": 365,
}

PERIOD_KR = {
    "1d": "1일",
    "1m": "1개월", 
    "3m": "3개월",
    "1y": "1년",
}

def get_stock_data(ticker: str):
    """주식 데이터 조회"""
    if not engine:
        raise HTTPException(500, "Database connection not available")
    
    try:
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
    except Exception as e:
        logger.error(f"Error in get_stock_data: {e}")
        return []

def get_ticker_map():
    """티커 맵 조회"""
    if not engine:
        logger.warning("Database connection not available, returning empty list")
        return []
    
    try:
        sql = """
        SELECT ticker, company_name, sector
        FROM ticker
        ORDER BY ticker
        """
        df = pd.read_sql(text(sql), engine)
        result = []
        for _, row in df.iterrows():
            result.append({
                "ticker": row["ticker"] or "",
                "name": row["company_name"] or f"종목 {row['ticker']}",
                "sector": row["sector"] or "기타"
            })
        logger.info(f"Retrieved {len(result)} tickers")
        return result
    except Exception as e:
        logger.error(f"Error in get_ticker_map: {e}")
        return []

def get_news_data(ticker: str):
    """뉴스 데이터 조회"""
    if not engine:
        raise HTTPException(500, "Database connection not available")
    
    try:
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
        LIMIT 100
        """
        df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
        df = df.fillna('')
        df['published_at'] = pd.to_datetime(df['published_at']).dt.strftime('%Y-%m-%d')
        return df.to_dict(orient="records")
    except Exception as e:
        logger.error(f"Error in get_news_data: {e}")
        return []

def clean_keyword(keyword):
    """키워드 정리"""
    if not keyword:
        return None
    keyword = str(keyword).strip()
    if not keyword:
        return None
    # 중괄호, 대괄호, 소괄호, 따옴표 제거
    keyword = re.sub(r'^[\{\[\(\'\"]+|[\}\]\)\'\"]+$', '', keyword)
    keyword = keyword.strip()
    if not keyword:
        return None
    return keyword

def is_valid_keyword(keyword):
    """유효한 키워드 검사"""
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
    """인기 키워드 조회"""
    if not engine:
        logger.warning("Database connection not available, returning empty list")
        return []
    
    try:
        # 안전한 쿼리 실행
        sql = """
        SELECT keyword, published_at 
        FROM news 
        WHERE is_selected = true 
          AND keyword IS NOT NULL 
          AND keyword != '' 
          AND keyword != 'None' 
          AND keyword != 'null' 
          AND keyword NOT LIKE '%{{}}%' 
          AND keyword NOT LIKE '%[]%' 
          AND keyword NOT LIKE '%()%' 
          AND published_at >= CURRENT_DATE - INTERVAL '%s days' 
          AND ticker IS NOT NULL 
          AND ticker != '' 
          AND ticker != '000000' 
        ORDER BY published_at DESC
        """ % days
        
        df = pd.read_sql(text(sql), engine)
        
        if df.empty:
            logger.info("No keywords found in database")
            return []

        # 키워드 처리
        all_keywords = []
        for _, row in df.iterrows():
            keywords_str = row['keyword']
            if not keywords_str or str(keywords_str).strip() == '':
                continue
            
            # 키워드 분리
            separators = [',', ';', '/', '\\', '|', '\n', '\t']
            keywords = [keywords_str]
            for sep in separators:
                temp_keywords = []
                for kw in keywords:
                    temp_keywords.extend(str(kw).split(sep))
                keywords = temp_keywords
            
            for keyword in keywords:
                cleaned_keyword = clean_keyword(keyword)
                if not cleaned_keyword or not is_valid_keyword(cleaned_keyword):
                    continue
                if len(cleaned_keyword) > 50:
                    continue
                all_keywords.append(cleaned_keyword)

        keyword_counts = Counter(all_keywords)
        
        # 필터링
        filtered_counts = {}
        for keyword, count in keyword_counts.items():
            if count >= 2 or (count == 1 and len(keyword) >= 3 and not re.search(r'[^\w가-힣\s]', keyword)):
                filtered_counts[keyword] = count

        # 각 키워드별 관련 티커 조회
        popular_keywords = []
        for i, (keyword, count) in enumerate(Counter(filtered_counts).most_common(limit), 1):
            try:
                ticker_sql = """
                SELECT DISTINCT ticker 
                FROM news 
                WHERE is_selected = true 
                  AND (keyword ILIKE :kw OR title ILIKE :kw OR summary ILIKE :kw) 
                  AND published_at >= CURRENT_DATE - INTERVAL '%s days' 
                  AND ticker IS NOT NULL 
                  AND ticker != '' 
                  AND ticker != '000000'
                """ % days
                
                kw_pattern = f"%{keyword}%"
                ticker_df = pd.read_sql(text(ticker_sql), engine, params={"kw": kw_pattern})
                tickers = sorted([t for t in set(ticker_df['ticker'].tolist()) if t != '000000'])
                
                popular_keywords.append({
                    "rank": i,
                    "keyword": keyword,
                    "count": count,
                    "tickers": tickers,
                    "sentiment": "neutral",  # 기본값
                    "is_hot": count > 10  # count가 10 이상이면 HOT
                })
            except Exception as e:
                logger.warning(f"Error processing keyword {keyword}: {e}")
                continue

        logger.info(f"Retrieved {len(popular_keywords)} popular keywords")
        return popular_keywords
        
    except Exception as e:
        logger.error(f"Error in get_popular_keywords: {e}")
        return []

def get_news_by_keyword(keyword: str, days: int = 7, limit: int = 50):
    """특정 키워드가 포함된 뉴스 조회"""
    if not engine:
        logger.warning("Database connection not available, returning empty list")
        return []
    
    try:
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
    except Exception as e:
        logger.error(f"Error in get_news_by_keyword: {e}")
        return []

def get_keyword_statistics(keyword: str, days: int = 30):
    """키워드의 시간별 언급 통계"""
    if not engine:
        logger.warning("Database connection not available, returning empty stats")
        return {
            "keyword": keyword,
            "period": f"{days}일",
            "daily_stats": [],
            "total_mentions": 0,
            "total_tickers": 0,
            "avg_daily_mentions": 0.0
        }
    
    try:
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
        
        if df.empty:
            return {
                "keyword": keyword,
                "period": f"{days}일",
                "daily_stats": [],
                "total_mentions": 0,
                "total_tickers": 0,
                "avg_daily_mentions": 0.0
            }
        
        df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
        df = df.fillna({'avg_sentiment': 0})
        
        return {
            "keyword": keyword,
            "period": f"{days}일",
            "daily_stats": df.to_dict(orient="records"),
            "total_mentions": int(df['mention_count'].sum() or 0),
            "total_tickers": len(df[df['ticker_count'] > 0]),
            "avg_daily_mentions": round(df['mention_count'].mean(), 1)
        }
    except Exception as e:
        logger.error(f"Error in get_keyword_statistics: {e}")
        return {
            "keyword": keyword,
            "period": f"{days}일",
            "daily_stats": [],
            "total_mentions": 0,
            "total_tickers": 0,
            "avg_daily_mentions": 0.0
        }

def get_selected_news_by_ticker(ticker: str):
    """is_selected가 True인 뉴스만 반환"""
    if not engine:
        return []
    
    try:
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
        LIMIT 50
        """
        df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
        df = df.fillna('')
        df['published_at'] = pd.to_datetime(df['published_at']).dt.strftime('%Y-%m-%d')
        return df.to_dict(orient="records")
    except Exception as e:
        logger.error(f"Error in get_selected_news_by_ticker: {e}")
        return []

def get_news_by_ticker_and_day(ticker: str, day: str):
    """특정 날짜의 뉴스 조회"""
    if not engine:
        return []
    
    try:
        # day를 yyyymmdd로 변환
        if len(day) == 6:
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
    except Exception as e:
        logger.error(f"Error in get_news_by_ticker_and_day: {e}")
        return []

def get_panel_news_data(ticker: str, date_str: str) -> dict:
    """패널용 뉴스 데이터 조회"""
    if not engine:
        return {
            "mainNews": None,
            "macroNews": []
        }
    
    try:
        sql_common = """
        SELECT title, summary, url, published_at
        FROM news
        WHERE {where_clause}
          AND DATE(published_at) = :date
        ORDER BY published_at DESC
        """

        # 메인뉴스 (is_selected = true) — 단건만
        df_main = pd.read_sql(
            text(sql_common.format(where_clause="ticker = :ticker AND is_selected = true") + " LIMIT 1"),
            engine,
            params={"ticker": ticker, "date": date_str},
        )

        # 거시경제뉴스 (ticker = '000000')
        df_macro = pd.read_sql(
            text(sql_common.format(where_clause="ticker = '000000'")),
            engine,
            params={"date": date_str},
        )

        return {
            "mainNews": df_main.to_dict(orient="records")[0] if not df_main.empty else None,
            "macroNews": df_macro.to_dict(orient="records"),
        }
    except Exception as e:
        logger.error(f"Error in get_panel_news_data: {e}")
        return {
            "mainNews": None,
            "macroNews": []
        }

def get_sector_stocks(ticker: str):
    """같은 섹터 종목 조회"""
    if not engine:
        return []
    
    try:
        sql = """
        SELECT t2.ticker, t2.company_name, t2.sector
        FROM ticker t1
        JOIN ticker t2 ON t1.sector = t2.sector
        WHERE t1.ticker = :ticker
          AND t2.ticker != :ticker
        ORDER BY t2.ticker
        LIMIT 20
        """
        df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
        return [{"ticker": r["ticker"], "name": r["company_name"], "sector": r["sector"]} for r in df.to_dict(orient="records")]
    except Exception as e:
        logger.error(f"Error in get_sector_stocks: {e}")
        return []

def _build_full_prompt(cleaned: list[str], ticker: str, period: str) -> str:
    """프롬프트 생성"""
    joined = "\n".join(cleaned)
    return f"""
다음은 최근 {PERIOD_KR.get(period, period)}간 종목코드 {ticker}의 뉴스 요약문들입니다.

이 내용들을 바탕으로 다음 조건에 맞춰 요약해주세요:
1. 4-6문장으로 간결하게
2. 주요 이슈 중심
3. 투자자 관점 중요 내용 위주
4. 긍정/부정 요소 균형 반영
5. 티커를 직접 얘기하지 말고 종목명으로 얘기할 것

---
{joined}
---

전체 요약:"""

def stream_summarize_news_for_period(ticker: str, period: str = "1d"):
    """뉴스 요약 스트리밍"""
    if not engine:
        raise ValueError("데이터베이스 연결이 없습니다.")
    
    try:
        # 날짜 리스트, raw_summaries 만들기
        days = PERIOD_DAYS.get(period, 1)
        end_dt = datetime.today()
        start_dt = end_dt - timedelta(days=days - 1)
        date_list = [(start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
                     for i in range(days)]

        raw_summaries = []
        for date_str in date_list:
            try:
                panel = get_panel_news_data(ticker, date_str)
                if panel["mainNews"] and panel["mainNews"].get("summary"):
                    raw_summaries.append(panel["mainNews"]["summary"])
                for item in panel["macroNews"]:
                    if item.get("summary"):
                        raw_summaries.append(item["summary"])
            except Exception as e:
                logger.warning(f"Error getting news for {date_str}: {e}")
                continue

        if not raw_summaries:
            raise ValueError(f"최근 {PERIOD_KR.get(period,period)}간 뉴스가 없습니다.")

        # cleaned 리스트 (최대 1200개)
        cleaned = [s.strip() for s in raw_summaries[:1200] if s and s.strip()]

        if not cleaned:
            raise ValueError(f"유효한 뉴스 요약이 없습니다.")

        # full prompt
        prompt = _build_full_prompt(cleaned, ticker, period)

        # OpenAI stream 호출
        resp = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 금융 뉴스 분석 전문가입니다."},
                {"role": "user",   "content": prompt},
            ],
            max_tokens=500,
            temperature=0.3,
            top_p=0.9,
            stream=True,
        )

        for chunk in resp:
            if delta := chunk.choices[0].delta.get("content"):
                yield delta
                
    except Exception as e:
        logger.error(f"Error in stream_summarize_news_for_period: {e}")
        yield f"요약 생성 중 오류가 발생했습니다: {str(e)}"