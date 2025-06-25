# DB_team/generate_ticker_map.py

import os
import json
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv

# 1) .env 파일에서 DB 접속 정보 로드
dotenv_path = os.path.join(os.path.dirname(__file__), os.pardir, ".env")
load_dotenv(dotenv_path)

DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# 2) SQLAlchemy 엔진 생성
engine = create_engine(
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

def generate_ticker_map(output_path: str):
    # 3) ticker 테이블에서 데이터 읽기
    sql = "SELECT ticker, company_name FROM ticker ORDER BY ticker"
    df = pd.read_sql(sql, engine)
    
    # 4) 원하는 포맷으로 리스트 변환
    records = [
        {"ticker": row["ticker"], "name": row["company_name"]}
        for _, row in df.iterrows()
    ]
    
    # 5) JSON 파일로 저장 (ensure_ascii=False → 한글 깨짐 방지)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {output_path} 생성 완료 ({len(records)}개 레코드)")

if __name__ == "__main__":
    # Next.js public 폴더로 출력 경로 지정
    out_file = os.path.abspath(
        os.path.join(os.path.dirname(__file__),
                     "../../CG_company/yoongdo/public/ticker_map.json")
    )
    generate_ticker_map(out_file)
