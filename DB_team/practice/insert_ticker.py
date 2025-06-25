import pandas as pd
import requests
from pykrx import stock
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# 1) KRX “엑셀” 다운로드 (실제론 HTML 테이블)
url  = "http://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13"
resp = requests.get(url)
resp.raise_for_status()

# 2) HTML 테이블 파싱 (첫 번째 테이블 사용)
tables = pd.read_html(resp.text, header=0)
df = tables[0]

# 3) 컬럼 추출 및 타입 변환
df = df[["종목코드", "회사명", "업종"]]
df.columns = ["ticker", "company_name", "industry"]

# 종목코드를 6자리 문자열로 zero-fill
df["ticker"] = df["ticker"].astype(str).str.zfill(6)

# 4) 코스피200 종목만 필터링
kospi200 = stock.get_index_portfolio_deposit_file("1028")
kospi200_df = pd.DataFrame({"ticker": kospi200})

ticker_df = kospi200_df.merge(df, on="ticker", how="left")

print(ticker_df.head())



# 1) 환경변수 로드 (.env 파일 필요)
load_dotenv()
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# 2) SQLAlchemy 엔진 생성 (PostgreSQL 기준)
db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(db_url, echo=False)

# 3) 예시로 앞서 만든 DataFrame을 가져옵니다.

# 4) DB에 upsert(INSERT ... ON CONFLICT)로 반영
with engine.begin() as conn:
    for _, row in ticker_df.iterrows():
        conn.execute(text("""
            INSERT INTO ticker (ticker, company_name, exchange, sector)
            VALUES (:ticker, :company_name, :exchange, :sector)
            ON CONFLICT (ticker)
            DO UPDATE SET
                company_name = EXCLUDED.company_name,
                exchange     = EXCLUDED.exchange,
                sector       = EXCLUDED.sector;
        """), {
            "ticker":        row["ticker"],
            "company_name":  row["company_name"],
            "exchange":      row.get("exchange", "KRX"),
            "sector":        row.get("industry") or row.get("sector")
        })

print("✅ ticker 테이블에 데이터가 반영되었습니다!")
