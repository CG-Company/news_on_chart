import os
import json
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

# 1) 환경변수 로드
load_dotenv()
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# 2) SQLAlchemy 엔진 생성
db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(db_url, echo=False)

# 3) 데이터베이스에서 테이블 읽기
with engine.connect() as conn:
    # 원하는 컬럼만 골라서 읽어옵니다.
    df = pd.read_sql(
        "SELECT ticker, company_name, exchange, sector FROM ticker",
        conn
    )

# 4) pandas DataFrame → Python 객체(list of dict)
records = df.to_dict(orient="records")

# 5) JSON 문자열로 변환 (한글 깨짐 방지)
json_str = json.dumps(records, ensure_ascii=False)

# 6) 출력 혹은 함수 반환
print(json_str)
# → [{"ticker":"005930","company_name":"삼성전자","exchange":"KRX","sector":"전기전자"}, … ]
