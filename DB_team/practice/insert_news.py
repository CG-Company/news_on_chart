import os
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# 1) 환경 변수 로드
load_dotenv('.env.supabase', override=True)

# 2) DB 연결 함수
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        port=os.getenv("DB_PORT"),
        sslmode='require'
    )

# 4) 단일 Parquet 파일 파이프라인 함수 (최적화)
def pipeline_load_one(file_path: str):
    conn = get_db_connection()
    cur = conn.cursor()
    print(f"\n▶ Processing {file_path}")

    # ────────────────────────────────
    # a) Parquet 읽기 (published_at은 원본 dtype 유지)
    df = pd.read_parquet(file_path)

    # published_at 컬럼이 없고 date 컬럼이 있으면 published_at으로 복사
    if 'published_at' not in df.columns and 'date' in df.columns:
        df['published_at'] = df['date']

    # b) published_at이 문자열(YYYYMMDD)일 때만 파싱
    if not pd.api.types.is_datetime64_any_dtype(df['published_at']):
        df['published_at'] = pd.to_datetime(
            df['published_at'], format='%Y%m%d', errors='raise'
        )

    # c) price_date 생성 (datetime → date)
    df['price_date'] = df['published_at'].dt.date

    # ────────────────────────────────
    # d) 컬럼명 통일: 'publisher' → 'publisher_name', 'keywords' → 'keyword'
    if 'publisher' in df.columns:
        df.rename(columns={'publisher': 'publisher_name'}, inplace=True)
    if 'keywords' in df.columns:
        df.rename(columns={'keywords': 'keyword'}, inplace=True)

    # e) 문자열로 처리할 열만 명시적 변환
    text_cols = ['ticker', 'publisher_name', 'title', 'url', 'summary', 'keyword']
    for col in text_cols:
        if col in df.columns:
            df[col] = df[col].astype(str)
        else:
            df[col] = ''

    # keyword를 배열로 변환 (쉼표 구분 문자열 → 리스트)
    if 'keyword' in df.columns:
        df['keyword'] = df['keyword'].apply(lambda x: [k.strip() for k in x.split(',')] if x else [])

    # f) boolean 처리: is_selected
    if 'is_selected' in df.columns:
        if df['is_selected'].dtype != bool:
            df['is_selected'] = df['is_selected'].astype(bool)
    else:
        df['is_selected'] = False

    # g) ticker 정제
    df['ticker'] = df['ticker'].str.replace("'", "").str.strip()

    # ────────────────────────────────
    # 1. ticker 유효성 체크 (DB에서 한 번에)
    cur.execute("SELECT ticker FROM ticker")
    valid_tickers = set(row[0] for row in cur.fetchall())
    df = df[df['ticker'].isin(valid_tickers)]

    # 2. publisher 매핑 (DB에서 한 번에)
    cur.execute("SELECT name, publisher_id FROM publisher")
    publisher_map = {row[0]: row[1] for row in cur.fetchall()}
    new_publishers = set(df['publisher_name']) - set(publisher_map.keys())
    if new_publishers:
        execute_values(
            cur,
            "INSERT INTO publisher (name) VALUES %s ON CONFLICT (name) DO NOTHING",
            [(name,) for name in new_publishers]
        )
        cur.execute("SELECT name, publisher_id FROM publisher")
        publisher_map = {row[0]: row[1] for row in cur.fetchall()}
    df['publisher_id'] = df['publisher_name'].map(lambda x: publisher_map.get(x, publisher_map.get('Unknown')))

    # 3. stock_price 더미 (필요한 조합만)
    stock_price_keys = set(zip(df['ticker'], df['price_date']))
    if stock_price_keys:
        # psycopg2는 튜플의 튜플로 넘겨야 함
        cur.execute("SELECT ticker, price_date FROM stock_price WHERE (ticker, price_date) IN %s", (tuple(stock_price_keys),))
        existing_keys = set(cur.fetchall())
        to_insert = stock_price_keys - existing_keys
        if to_insert:
            execute_values(
                cur,
                "INSERT INTO stock_price (ticker, price_date, open_price, high_price, low_price, close_price, adj_close, volume) VALUES %s ON CONFLICT (ticker, price_date) DO NOTHING",
                [(t, d, 0, 0, 0, 0, 0, 0) for t, d in to_insert]
            )

    # 4. news bulk insert
    news_tuples = [
        (
            row['ticker'], row['price_date'], row['publisher_id'],
            row['title'], row['summary'], row['keyword'],
            row['url'], row['published_at'], row['is_selected']
        )
        for _, row in df.iterrows()
    ]
    if news_tuples:
        execute_values(
            cur,
            """
            INSERT INTO news (
                ticker, price_date, publisher_id,
                title, summary, keyword,
                url, published_at, is_selected
            ) VALUES %s
            ON CONFLICT (url) DO NOTHING
            """,
            news_tuples
        )

    conn.commit()
    cur.close()
    conn.close()
    print(f"✅ Inserted {len(news_tuples)} rows from {os.path.basename(file_path)}")

# 5) 지정 폴더 내 모든 Parquet 파일 처리
if __name__ == '__main__':
    folder = Path(r"C:\news_on_chart-practice\NEWS_team\macro_news_data")
    for parquet_file in folder.glob("*.parquet"):
        pipeline_load_one(str(parquet_file))
