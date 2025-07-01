# DB_team/utils.py
import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from collections import Counter
import re

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

def clean_keyword(keyword):
    """
    키워드를 정리하는 함수
    """
    if not keyword:
        return None
    
    # 앞뒤 공백 제거
    keyword = keyword.strip()
    
    # 빈 문자열 제거
    if not keyword:
        return None
    
    # 중괄호, 대괄호, 소괄호, 따옴표 제거
    keyword = re.sub(r'^[\{\[\(\'\"]+|[\}\]\)\'\"]+$', '', keyword)
    keyword = keyword.strip()
    
    # 다시 빈 문자열 체크
    if not keyword:
        return None
    
    return keyword

def is_valid_keyword(keyword):
    """
    유효한 키워드인지 검사하는 함수 (더 강화된 버전)
    """
    if not keyword:
        return False
    
    # 길이 체크 (1글자 이하 제외)
    if len(keyword) <= 1:
        return False
    
    # None 값들 제외
    none_patterns = ['none', 'null', 'nan', 'n/a', 'na', '없음', '무', '-']
    if keyword.lower() in none_patterns:
        return False
    
    # 특수문자만으로 구성된 키워드 제외
    if re.fullmatch(r'^[^\w가-힣]+$', keyword):
        return False
    
    # 중괄호, 대괄호, 소괄호, 따옴표만 있는 경우 제외
    if re.fullmatch(r'^[\{\}\[\]\(\)\'\"\s`~!@#$%^&*\-_=+|\\:;<,>.?/]+$', keyword):
        return False
    
    # 완전히 특수문자로 감싸진 경우 제외 (예: {기아}, "주가", [삼성])
    if re.fullmatch(r'^[\{\[\(\'\"]+.*[\}\]\)\'\"]+$', keyword):
        return False
    
    # 한글, 영문, 숫자가 하나도 없는 경우 제외
    if not re.search(r'[가-힣a-zA-Z0-9]', keyword):
        return False
    
    # 너무 짧은 특수문자 조합 제외
    if len(keyword) <= 3 and re.search(r'[^\w가-힣]', keyword):
        return False
    
    # URL이나 이메일 같은 패턴 제외
    if re.search(r'https?://|www\.|@.*\.', keyword):
        return False
    
    # 연속된 특수문자가 많은 경우 제외
    if len(re.findall(r'[^\w가-힣]', keyword)) > len(keyword) // 2:
        return False
    
    return True

def get_popular_keywords(days: int = 7, limit: int = 20):
    """
    최근 N일간의 뉴스에서 인기 키워드 추출 (개선된 필터링 적용)
    """
    sql = """
    SELECT keyword, published_at, ticker
    FROM news
    WHERE keyword IS NOT NULL 
      AND keyword != ''
      AND keyword != 'None'
      AND keyword != 'null'
      AND keyword NOT LIKE '%{}%'
      AND keyword NOT LIKE '%[]%'
      AND keyword NOT LIKE '%()%'
      AND published_at >= CURRENT_DATE - INTERVAL '%s days'
      AND ticker != '000000'  -- 거시경제뉴스 제외
    ORDER BY published_at DESC
    """ % days
    
    df = pd.read_sql(text(sql), engine)
    
    if df.empty:
        return []
    
    # 모든 키워드를 합치고 개별 키워드로 분리
    all_keywords = []
    
    for keywords_str in df['keyword'].dropna():
        if not keywords_str or keywords_str.strip() == '':
            continue
            
        # 다양한 구분자로 키워드 분리
        separators = [',', ';', '/', '\\', '|', '\n', '\t']
        keywords = [keywords_str]
        
        for sep in separators:
            temp_keywords = []
            for kw in keywords:
                temp_keywords.extend(kw.split(sep))
            keywords = temp_keywords
        
        # 각 키워드 처리
        for keyword in keywords:
            # 키워드 정리
            cleaned_keyword = clean_keyword(keyword)
            if not cleaned_keyword:
                continue
            
            # 유효성 검사
            if not is_valid_keyword(cleaned_keyword):
                continue
            
            # 최종 길이 체크 (너무 긴 키워드 제외)
            if len(cleaned_keyword) > 50:
                continue
            
            all_keywords.append(cleaned_keyword)
    
    # 키워드 빈도수 계산
    keyword_counts = Counter(all_keywords)
    
    # 빈도수가 1인 키워드들 중에서 의미있는 것들만 필터링
    filtered_counts = {}
    for keyword, count in keyword_counts.items():
        # 빈도수가 2 이상이거나, 빈도수가 1이더라도 의미있는 키워드인 경우
        if count >= 2 or (count == 1 and len(keyword) >= 3 and not re.search(r'[^\w가-힣\s]', keyword)):
            filtered_counts[keyword] = count
    
    # 상위 N개 키워드 반환
    popular_keywords = []
    for i, (keyword, count) in enumerate(Counter(filtered_counts).most_common(limit), 1):
        popular_keywords.append({
            "rank": i,
            "keyword": keyword,
            "count": count
        })
    
    return popular_keywords

def get_sector_stocks(ticker: str):
    """
    ticker: 종목코드 (예: '005930')
    같은 섹터에 속한 종목 리스트 반환
    """
    sql = """
    SELECT t2.ticker, t2.company_name, t2.sector
    FROM ticker t1
    JOIN ticker t2 ON t1.sector = t2.sector
    WHERE t1.ticker = :ticker
      AND t2.ticker != :ticker
    ORDER BY t2.ticker
    """
    df = pd.read_sql(text(sql), engine, params={"ticker": ticker})
    return [{"ticker": r["ticker"], "name": r["company_name"], "sector": r["sector"]} for r in df.to_dict(orient="records")]

def get_news_by_keyword(keyword: str, days: int = 7, limit: int = 50):
    """
    특정 키워드가 포함된 뉴스 조회
    """
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

def get_keyword_statistics(keyword: str, days: int = 30):
    """
    키워드의 시간별 언급 통계
    """
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
    
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    df = df.fillna({'avg_sentiment': 0})
    
    return {
        "keyword": keyword,
        "period": f"{days}일",
        "daily_stats": df.to_dict(orient="records"),
        "total_mentions": int(df['mention_count'].sum()),
        "total_tickers": len(df[df['ticker_count'] > 0]),
        "avg_daily_mentions": round(df['mention_count'].mean(), 1)
    }