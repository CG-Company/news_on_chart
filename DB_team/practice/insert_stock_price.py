# upsert_stock_price.py

from datetime import date, timedelta
import pandas as pd
from pykrx import stock
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# —————————————————————————————
# ① 날짜 범위 설정 (오늘 기준 1개월 전 ~ 오늘)
# —————————————————————————————
end_date   = date.today()
start_date = end_date - timedelta(days=2*365)

start_str = start_date.strftime("%Y%m%d")
end_str   = end_date.strftime("%Y%m%d")

# —————————————————————————————
# ② 코스피200 구성 종목 코드 가져오기
# —————————————————————————————
kospi200_tickers = stock.get_index_portfolio_deposit_file("1028")
# 예시: 특정 티커만 가져오고 싶을 때 (예: 삼성전자 '005930'만)
kospi200_tickers = ["278470"]

# 여러 티커를 직접 지정하고 싶을 때:
# kospi200_tickers = ["005930", "000660", "035420"]

# 위의 두 줄 중 하나를 주석 해제해서 사용하세요.


print("✅ 주가 가져오기 완료")

# —————————————————————————————
# ③ 종목별 OHLCV 수집 & DataFrame 결합
# —————————————————————————————
price_data_list = []

for ticker in kospi200_tickers:
    df = stock.get_market_ohlcv(start_str, end_str, ticker)
    df = df.reset_index()[["날짜", "시가", "고가", "저가", "종가", "거래량", "등락률"]]
    df.columns = [
        "price_date",
        "open_price",
        "high_price",
        "low_price",
        "close_price",
        "volume",
        "change_rate"
    ]
    df["adj_close"] = df["close_price"]
    df["ticker"]   = ticker
    price_data_list.append(df)

price_df = pd.concat(price_data_list, ignore_index=True)
price_df["price_date"] = pd.to_datetime(price_df["price_date"]).dt.date
print("✅ 종목별 OHLCV 수집 & DataFrame 결합")

# —————————————————————————————
# ④ .env 로드 & DB 연결
# —————————————————————————————
load_dotenv(".env", override=True)  # 프로젝트 루트의 .env 파일을 읽어옵니다.

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(db_url, echo=False)

# —————————————————————————————
# ⑤ Upsert(INSERT … ON CONFLICT) 로직
# —————————————————————————————
upsert_sql = """
INSERT INTO stock_price (
    ticker, price_date,
    open_price, high_price, low_price,
    close_price, volume, adj_close, change_rate
)
VALUES (
    :ticker, :price_date,
    :open_price, :high_price, :low_price,
    :close_price, :volume, :adj_close, :change_rate
)
ON CONFLICT (ticker, price_date)
DO UPDATE SET
    open_price  = EXCLUDED.open_price,
    high_price  = EXCLUDED.high_price,
    low_price   = EXCLUDED.low_price,
    close_price = EXCLUDED.close_price,
    volume      = EXCLUDED.volume,
    adj_close   = EXCLUDED.adj_close,
    change_rate = EXCLUDED.change_rate;
"""

with engine.begin() as conn:
    records = price_df.to_dict(orient="records")
    conn.execute(text(upsert_sql), records)

    # 추가: open/high/low/volume이 0이고 close_price만 0이 아닌 행 보정
    fix_sql = """
    UPDATE stock_price
    SET
        open_price = close_price,
        high_price = close_price,
        low_price  = close_price
    WHERE
        open_price = 0
        AND high_price = 0
        AND low_price = 0
        AND volume = 0
        AND close_price != 0;
    """
    conn.execute(text(fix_sql))

print("✅ 중복 방지 upsert를 이용해 stock_price 테이블에 데이터 반영 완료")
