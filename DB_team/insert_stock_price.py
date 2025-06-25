from datetime import date, timedelta
import pandas as pd
from pykrx import stock
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# —————————————————————————————
# ① 날짜 범위 설정 (오늘 기준 1개월 전 ~ 오늘)
# —————————————————————————————
end_date   = date.today()
start_date = end_date - timedelta(days=30)

start_str = start_date.strftime("%Y%m%d")
end_str   = end_date.strftime("%Y%m%d")

# —————————————————————————————
# ② 코스피200 구성 종목 코드 가져오기
#    (인덱스 코드 "1028"이 코스피200에 해당)
# —————————————————————————————
kospi200_tickers = stock.get_index_portfolio_deposit_file("1028")

# —————————————————————————————
# ③ 종목별 OHLCV 수집 & DataFrame 결합
# —————————————————————————————
price_data_list = []

for ticker in kospi200_tickers:
    # YYYYMMDD ~ YYYYMMDD 기간의 일별 시가·고가·저가·종가·거래량 조회
    df = stock.get_market_ohlcv(start_str, end_str, ticker)
    df = df.reset_index()  # index 에 날짜가 들어있으므로 컬럼으로
    df = df[["날짜", "시가", "고가", "저가", "종가", "거래량"]]

    # 컬럼명 영어로 변경
    df.columns = [
        "price_date",
        "open_price",
        "high_price",
        "low_price",
        "close_price",
        "volume"
    ]

    # adj_close (보정 종가)가 없다면 일단 종가로 채우기
    df["adj_close"] = df["close_price"]

    # 티커 컬럼 추가
    df["ticker"] = ticker

    price_data_list.append(df)

# 모든 종목 합치기
price_df = pd.concat(price_data_list, ignore_index=True)

# 날짜 컬럼을 datetime.date 타입으로 변환 (SQLAlchemy가 DATE로 인식)
price_df["price_date"] = pd.to_datetime(price_df["price_date"]).dt.date

# —————————————————————————————
# ④ DB에 적재
#    (PostgreSQL 예시; 접속 문자열은 환경에 맞게 수정)
# —————————————————————————————

# ① .env 로드
load_dotenv()  

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# ② SQLAlchemy 접속 URL 구성
db_url = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(db_url, echo=False)

# — 이하 생략 (앞서 작성한 데이터 조회 및 to_sql 삽입 로직) —

# db_url = "postgresql+psycopg2://USERNAME:PASSWORD@HOST:PORT/DBNAME"
# engine = create_engine(db_url, echo=False)

# stock_price 테이블에 append 모드로 삽입
price_df.to_sql(
    "stock_price",
    con=engine,
    if_exists="append",     # 이미 있으면 뒤에 이어 붙이기
    index=False,
    method="multi",         # 빠른 대량 삽입
    chunksize=500           # 500행씩 분할 삽입
)

print("✅ 1개월치 코스피200 주가 데이터를 stock_price 테이블에 저장했습니다.")
