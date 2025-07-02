import pandas as pd
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# 1) 환경변수 로드
load_dotenv(".env.supabase", override=True)
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
engine = create_engine(db_url, echo=False)

# 2) 엑셀 파일 읽기
excel_path = "종목별 섹터.xlsx"
df = pd.read_excel(excel_path)

# 3) 티커 전처리: "'000660" → "000660"
df['티커'] = df['티커'].astype(str).str.replace("'", "").str.zfill(6)

# 4) DB 업데이트
with engine.begin() as conn:
    for _, row in df.iterrows():
        ticker = row['티커']
        sector = row['섹터']
        conn.execute(
            text("""
                UPDATE ticker
                SET sector = :sector
                WHERE ticker = :ticker
            """),
            {"sector": sector, "ticker": ticker}
        )

print("✅ ticker 테이블의 sector 정보가 엑셀 기준으로 업데이트되었습니다!")
