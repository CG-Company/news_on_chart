import os
import sys
import requests
from urllib.parse import quote

# # 1) 환경 변수로 키 관리 (권장)
# #    Windows: set NAVER_CLIENT_ID=발급받은_ID
# #            set NAVER_CLIENT_SECRET=발급받은_SECRET
# #    Linux/Mac: export NAVER_CLIENT_ID=발급받은_ID
# #               export NAVER_CLIENT_SECRET=발급받은_SECRET
# CLIENT_ID     = os.getenv("NAVER_CLIENT_ID",     "YOUR_CLIENT_ID")
# CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET", "YOUR_CLIENT_SECRET")


CLIENT_ID = "EKlpIaXxYjpE9YVg7qr8"
CLIENT_SECRET = "SSEMCOTZcC"

def fetch_naver_news(query, display=10, start=1, sort="date"):
    """
    네이버 뉴스 검색 결과를 JSON으로 반환합니다.
    :param query: 검색 키워드 (문자열)
    :param display: 가져올 결과 수 (1~100)
    :param start: 시작 위치 (1~1000)
    :param sort: 정렬 기준 ("sim" 또는 "date")
    :return: dict (JSON 파싱 결과)
    """
    # 1. 쿼리 인코딩
    encoded_query = quote(query)

    # 2. 요청 URL 조립
    url = (
        f"https://openapi.naver.com/v1/search/news.json"
        f"?query={encoded_query}"
        f"&display={display}"
        f"&start={start}"
        f"&sort={sort}"
    )

    # 3. API 호출
    headers = {
        "X-Naver-Client-Id":     CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
    }
    resp = requests.get(url, headers=headers)
    
    # 4. 상태 확인
    if resp.status_code != 200:
        print(f"Error Code: {resp.status_code}", file=sys.stderr)
        return None

    # 5. JSON 파싱 후 반환
    return resp.json()

if __name__ == "__main__":
    # 예시: "인공지능" 키워드로 최신 뉴스 5건 가져오기
    result = fetch_naver_news("인공지능", display=5, sort="date")
    if result:
        for item in result.get("items", []):
            print(f"- {item['title']} ({item['originallink']})")
