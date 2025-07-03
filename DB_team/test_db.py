from utils import engine
import pandas as pd
from sqlalchemy import text

print("=== DB 연결 테스트 ===")
try:
    # 전체 뉴스 개수 확인
    df_total = pd.read_sql(text("SELECT COUNT(*) as total FROM news"), engine)
    print(f"전체 뉴스 개수: {df_total.iloc[0]['total']}")
    
    # 005930 종목 뉴스 개수 확인
    df_005930 = pd.read_sql(text("SELECT COUNT(*) as total FROM news WHERE ticker = '005930'"), engine)
    print(f"005930 종목 뉴스 개수: {df_005930.iloc[0]['total']}")
    
    # 005930 종목의 is_selected별 개수 확인
    df_selected = pd.read_sql(text("""
        SELECT is_selected, COUNT(*) as count 
        FROM news 
        WHERE ticker = '005930' 
        GROUP BY is_selected
    """), engine)
    print(f"005930 종목 is_selected별 개수:\n{df_selected}")
    
    # 005930 종목의 최근 5개 뉴스 확인
    df_recent = pd.read_sql(text("""
        SELECT ticker, is_selected, published_at, title 
        FROM news 
        WHERE ticker = '005930' 
        ORDER BY published_at DESC 
        LIMIT 5
    """), engine)
    print(f"005930 종목 최근 5개 뉴스:\n{df_recent}")
    
    # 2024-12-20 날짜의 005930 뉴스 확인
    df_date = pd.read_sql(text("""
        SELECT ticker, is_selected, published_at, title 
        FROM news 
        WHERE ticker = '005930' 
          AND DATE(published_at) = '2024-12-20'
        ORDER BY published_at DESC
    """), engine)
    print(f"2024-12-20 날짜의 005930 뉴스:\n{df_date}")
    
    # is_selected=false인 005930 뉴스 확인
    df_not_selected = pd.read_sql(text("""
        SELECT ticker, is_selected, published_at, title 
        FROM news 
        WHERE ticker = '005930' 
          AND is_selected = false
        ORDER BY published_at DESC 
        LIMIT 5
    """), engine)
    print(f"is_selected=false인 005930 뉴스:\n{df_not_selected}")
    
except Exception as e:
    print(f"오류 발생: {e}") 