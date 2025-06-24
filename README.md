# news_on_chart

# package 설명(제작 목표)

```
news_chart_project/
│
├── app.py                   # Flask 메인 파일
├── templates/
│   └── chart.html           # 차트 페이지
├── static/
│   └── style.css            # (옵션) 스타일 시트
├── db/
│   └── finance.db           # SQLite DB 파일
├── models.py                # SQLAlchemy 모델 정의
├── utils/
│   ├── news_api.py          # 뉴스 수집 모듈
│   └── sentiment.py         # 감정 분석 모듈 (선택)
├── requirements.txt         # 설치환경 고정
└── README.md
```


# 작업 흐름
1. 반드시 브랜치를 따서 작업: news_chart_project/기능이름 => ex) news_chart_project/app
   브랜치 = 임시 폴더. push안하면 팀원들 전부 해당 코드를 볼 수 없습니다.
2. dev 브랜치로 Pull Request (PR) 생성
3. 팀원 1명 이상 코드 리뷰 후 병합
4. main 브랜치는 직접 작업 ❌

# 브랜치 규칙
- 기능 개발 시, dev에서 브랜치를 따세요.
- 브랜치 이름: news_chart_project/기능이름 (예: news_chart_project/app)
- 기능 완료되면 dev 브랜치로 PR(Pull Request)을 보내세요.

# cmd / Powershell 에 작업 시작하는 코드
1. git checkout dev               # dev 기준으로 작업 시작
2. git pull origin dev            # dev 최신 내용 가져오기
3. git checkout -b news_chart_project/app   # 자기 브랜치 만들기

# 수정/추가 후 커밋(저장)
4. git push origin news_chart_project/app   # 자기 브랜치 푸시
