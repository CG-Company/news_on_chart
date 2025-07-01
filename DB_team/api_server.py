# DB_team/api_server.py - 완전 수정 버전
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from utils import get_stock_data, get_ticker_map, get_news_data, get_news_by_ticker_and_day, get_selected_news_by_ticker
import os
from datetime import datetime, timedelta
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import redis
except ImportError:
    redis = None

# OpenAI 설정 - 더 상세한 디버깅
openai_available = False
client = None

try:
    from openai import OpenAI
    
    api_key = os.getenv("OPENAI_API_KEY")
    logger.info(f"🔑 API 키 확인: {bool(api_key)}")
    
    if api_key:
        logger.info(f"🔑 API 키 길이: {len(api_key)}")
        logger.info(f"🔑 API 키 시작: {api_key[:7]}...")
        
        client = OpenAI(api_key=api_key)
        openai_available = True
        logger.info("✅ OpenAI 클라이언트 초기화 성공")
        
        # 간단한 테스트 호출
        try:
            test_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "안녕하세요"}],
                max_tokens=10
            )
            logger.info("✅ OpenAI API 테스트 호출 성공")
        except Exception as test_error:
            logger.error(f"❌ OpenAI API 테스트 실패: {test_error}")
            openai_available = False
    else:
        logger.error("❌ OPENAI_API_KEY 환경변수가 설정되지 않음")
        
except ImportError as e:
    logger.error(f"❌ OpenAI 라이브러리 import 실패: {e}")
except Exception as e:
    logger.error(f"❌ OpenAI 초기화 실패: {e}")

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/stock")
def read_stock(ticker: str = Query(..., min_length=6, max_length=6)):
    data = get_stock_data(ticker)
    if not data:
        raise HTTPException(404, detail="Ticker not found")
    return {"stockData": data}

@app.get("/api/ticker_map")
def read_ticker_map():
    return get_ticker_map()

@app.get("/api/news")
def read_news(ticker: str = Query(..., min_length=6, max_length=6)):
    data = get_news_data(ticker)
    if not data:
        raise HTTPException(404, detail="No news found for this ticker")
    return data

@app.get("/api/news_is_selected")
def get_news_is_selected(ticker: str):
    try:
        news = get_selected_news_by_ticker(ticker)
        return {"ticker": ticker, "news": news}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/news_day")
def get_news_day(ticker: str, day: str):
    try:
        news = get_news_by_ticker_and_day(ticker, day)
        return {"ticker": ticker, "day": day, "news": news}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/macro_news")
def get_macro_news():
    data = get_news_data('000000')
    if not data:
        raise HTTPException(404, detail="No macro news found")
    return data

@app.get("/api/news_panel_data")
def get_news_panel_data(ticker: str, date: str):
    from utils import get_panel_news_data
    return get_panel_news_data(ticker, date)

# 완전히 새로운 LLM 요약 함수
def get_llm_summary(summaries, period, ticker):
    """OpenAI GPT를 사용하여 뉴스 요약문들을 재요약"""
    
    # OpenAI 사용 불가능한 경우
    if not openai_available or not client:
        logger.error("❌ OpenAI를 사용할 수 없음")
        return "OpenAI API를 사용할 수 없습니다. API 키를 확인해주세요."
    
    # 요약문이 없는 경우
    if not summaries or len(summaries) == 0:
        logger.warning("⚠️ 요약할 뉴스가 없음")
        return "해당 기간에 뉴스가 없습니다."
    
    try:
        # 요약문 전처리
        cleaned_summaries = []
        total_length = 0
        max_length = 6000  # 토큰 제한을 고려해 줄임
        
        logger.info(f"📝 전체 요약문 개수: {len(summaries)}")
        
        for i, summary in enumerate(summaries[:30]):  # 최대 30개만
            if summary and summary.strip():
                summary_clean = summary.strip()
                if total_length + len(summary_clean) < max_length:
                    cleaned_summaries.append(summary_clean)
                    total_length += len(summary_clean)
                else:
                    logger.info(f"📝 길이 제한으로 {i}번째에서 중단")
                    break
        
        if not cleaned_summaries:
            return "유효한 뉴스 요약문이 없습니다."
        
        logger.info(f"📝 사용할 요약문: {len(cleaned_summaries)}개, 총 길이: {total_length}")
        
        # 한국어 기간 매핑
        period_map = {
            "1m": "1개월",
            "3m": "3개월", 
            "1y": "1년"
        }
        period_kr = period_map.get(period, period)
        
        # 요약문들 결합
        joined_summaries = '\n'.join(cleaned_summaries)
        
        # 프롬프트 구성
        prompt = f"""다음은 최근 {period_kr}간 종목코드 {ticker}의 뉴스 요약문들입니다.

이 내용들을 바탕으로 다음 조건에 맞춰 전체적인 흐름을 요약해주세요:
1. 4-6문장으로 간결하게 요약
2. 주요 이슈나 변화점을 중심으로 정리
3. 투자자 관점에서 중요한 내용 위주로 구성
4. 긍정적/부정적 요소를 균형있게 반영

뉴스 요약문들:
---
{joined_summaries}
---

위 내용을 바탕으로 한 전체 요약:"""

        logger.info("🤖 OpenAI API 호출 시작")
        
        # OpenAI API 호출
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system", 
                    "content": "당신은 금융 뉴스 분석 전문가입니다. 주어진 뉴스 요약문들을 바탕으로 핵심 내용을 간결하고 정확하게 요약해주세요."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=500,
            temperature=0.3,
            top_p=0.9
        )
        
        summary_result = response.choices[0].message.content.strip()
        logger.info(f"✅ OpenAI API 호출 성공 - 응답 길이: {len(summary_result)}")
        
        return summary_result
        
    except Exception as e:
        logger.error(f"❌ LLM 요약 중 오류: {str(e)}")
        # 구체적인 오류 메시지 반환
        if "rate limit" in str(e).lower():
            return "OpenAI API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
        elif "insufficient_quota" in str(e).lower():
            return "OpenAI API 크레딧이 부족합니다. 계정을 확인해주세요."
        elif "invalid_api_key" in str(e).lower():
            return "OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요."
        else:
            return f"요약 생성 중 오류가 발생했습니다: {str(e)}"

@app.get("/api/news_summary")
def news_summary(ticker: str, period: str = '3m'):
    """개선된 뉴스 요약 엔드포인트"""
    try:
        logger.info(f"📊 뉴스 요약 요청: ticker={ticker}, period={period}")
        
        # Redis 연결 시도 (선택사항)
        r = None
        if redis:
            try:
                r = redis.Redis(
                    host=os.getenv('REDIS_HOST', 'localhost'), 
                    port=int(os.getenv('REDIS_PORT', 6379)), 
                    db=0,
                    socket_timeout=5,
                    socket_connect_timeout=5
                )
                r.ping()
            except Exception as e:
                logger.warning(f"Redis 연결 실패: {e}")
                r = None
        
        # 캐시 확인
        today = datetime.today().strftime('%Y-%m-%d')
        cache_key = f"summary:{ticker}:{period}:{today}"
        
        if r:
            try:
                cached = r.get(cache_key)
                if cached:
                    logger.info(f"📋 캐시에서 요약 반환: {cache_key}")
                    return {
                        "summary": cached.decode(),
                        "cached": True,
                        "period": period,
                        "news_count": 0
                    }
            except Exception as e:
                logger.warning(f"캐시 읽기 실패: {e}")
        
        # 기간 계산
        end = datetime.today()
        if period == "1m":
            start = end - timedelta(days=30)
        elif period == "3m":
            start = end - timedelta(days=90)
        elif period == "1y":
            start = end - timedelta(days=365)
        else:
            start = end - timedelta(days=90)
        
        start_str = start.strftime('%Y-%m-%d')
        end_str = end.strftime('%Y-%m-%d')
        
        logger.info(f"📅 조회 기간: {start_str} ~ {end_str}")
        
        # DB에서 뉴스 데이터 조회
        news_list = get_news_data(ticker)
        logger.info(f"📰 전체 뉴스 개수: {len(news_list)}")
        
        if not news_list:
            return {
                "summary": "해당 종목의 뉴스 데이터가 없습니다.",
                "period": period,
                "news_count": 0,
                "cached": False
            }
        
        # 기간 필터링 및 요약문 추출
        summaries = []
        for news in news_list:
            if news.get('published_at') and news.get('summary'):
                news_date = news['published_at']
                if start_str <= news_date <= end_str:
                    summaries.append(news['summary'])
        
        logger.info(f"📰 기간 내 뉴스: {len(summaries)}개")
        
        if not summaries:
            return {
                "summary": f"최근 {period}간 뉴스가 없습니다.",
                "period": period,
                "news_count": 0,
                "cached": False
            }
        
        # LLM 요약 생성
        summary = get_llm_summary(summaries, period, ticker)
        
        # Redis에 캐싱 (성공적인 요약만)
        if r and not any(error_word in summary for error_word in ["오류", "실패", "없습니다", "확인해주세요"]):
            try:
                r.setex(cache_key, 60*60*6, summary)  # 6시간 캐싱
                logger.info(f"💾 캐시에 저장: {cache_key}")
            except Exception as e:
                logger.warning(f"캐시 저장 실패: {e}")
        
        return {
            "summary": summary,
            "period": period,
            "news_count": len(summaries),
            "cached": False
        }
        
    except Exception as e:
        logger.error(f"❌ 뉴스 요약 API 오류: {str(e)}")
        return {
            "summary": f"요약 서비스에 일시적인 문제가 발생했습니다: {str(e)}",
            "period": period,
            "news_count": 0,
            "cached": False
        }

# 헬스체크 엔드포인트
@app.get("/api/health")
def health_check():
    """API 상태 확인"""
    return {
        "status": "healthy",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "openai_available": openai_available,
        "redis_available": redis is not None,
        "timestamp": datetime.now().isoformat()
    }