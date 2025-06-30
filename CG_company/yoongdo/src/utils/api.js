// utils/api.js - 백엔드 FastAPI 연동 버전
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const REQUEST_TIMEOUT = 30000; // 15초 (DB 쿼리 시간 고려)

// 공통 fetch 래퍼 함수
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // FastAPI 에러 응답 파싱
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // JSON 파싱 실패시 기본 메시지 사용
      }
      throw new Error(errorMessage);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
    }

    // 네트워크 에러 처리
    if (
      error.message.includes("Failed to fetch") ||
      error.message.includes("ERR_NETWORK")
    ) {
      throw new Error(
        "서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요."
      );
    }

    throw error;
  }
}

// 재시도 로직이 포함된 fetch
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      console.warn(
        `API 요청 실패 (시도 ${attempt}/${maxRetries}):`,
        error.message
      );

      // 404나 422 같은 클라이언트 에러는 재시도하지 않음
      if (
        error.message.includes("404") ||
        error.message.includes("422") ||
        error.message.includes("400")
      ) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // 지수 백오프 (1초, 2초, 4초...)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// 주식 데이터 가져오기 (PostgreSQL에서)
export async function fetchStock(ticker) {
  try {
    if (!ticker || typeof ticker !== "string") {
      throw new Error("유효하지 않은 티커 코드입니다.");
    }

    // 티커 형식 검증 (6자리 숫자)
    if (!/^\d{6}$/.test(ticker)) {
      throw new Error("티커 코드는 6자리 숫자여야 합니다. (예: 005930)");
    }

    console.log(`🔍 주식 데이터 조회: ${ticker}`);
    const response = await fetchWithRetry(
      `${API_BASE}/api/stock?ticker=${encodeURIComponent(ticker)}`
    );

    const data = await response.json();

    // 데이터 검증: { stockData: [...] } 구조만 허용
    if (data && Array.isArray(data.stockData)) {
      if (data.stockData.length === 0) {
        throw new Error("해당 종목의 주가 데이터가 없습니다.");
      }
      // 데이터 후처리 (날짜 형식 통일)
      const processedData = data.stockData.map((item) => ({
        ...item,
        date: item.date, // 이미 YYYY-MM-DD 형식으로 온다고 가정
        companyNews: item.companyNews || [],
        macroNews: item.macroNews || [],
      }));
      console.log(`✅ 주식 데이터 로딩 완료: ${processedData.length}개 항목`);
      return processedData;
    } else {
      throw new Error("서버에서 유효하지 않은 데이터 형식을 반환했습니다.");
    }
  } catch (error) {
    console.error("주식 데이터 조회 실패:", error);

    // 사용자 친화적 에러 메시지
    if (error.message.includes("404")) {
      throw new Error(
        `종목 코드 '${ticker}'를 찾을 수 없습니다. 올바른 6자리 코드인지 확인해주세요.`
      );
    } else if (error.message.includes("422")) {
      throw new Error(
        "종목 코드 형식이 올바르지 않습니다. 6자리 숫자를 입력해주세요."
      );
    } else {
      throw new Error(
        `주식 데이터 조회 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }
}

// 티커 맵 가져오기 (PostgreSQL에서)
export async function fetchTickerMap() {
  try {
    console.log("🔍 티커 맵 조회 중...");
    const response = await fetchWithRetry(`${API_BASE}/api/ticker_map`);
    const data = await response.json();

    // 데이터 검증
    if (!Array.isArray(data)) {
      throw new Error("티커 맵 데이터 형식이 올바르지 않습니다.");
    }

    // 데이터 구조 확인
    const validData = data.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.ticker &&
        item.name &&
        typeof item.ticker === "string" &&
        typeof item.name === "string"
    );

    if (validData.length === 0) {
      throw new Error("유효한 티커 맵 데이터가 없습니다.");
    }

    console.log(`✅ 티커 맵 로딩 완료: ${validData.length}개 종목`);
    return validData;
  } catch (error) {
    console.error("티커 맵 조회 실패:", error);

    // 로컬 백업 데이터 시도
    try {
      console.log("🔄 로컬 백업 데이터 시도...");
      const backupResponse = await fetch("/ticker_map.json");
      if (backupResponse.ok) {
        const backupData = await backupResponse.json();
        console.warn("⚠️ 로컬 백업 데이터를 사용합니다.");
        return backupData;
      }
    } catch (backupError) {
      console.error("백업 데이터도 사용할 수 없습니다:", backupError);
    }

    throw new Error(`티커 맵 조회 실패: ${error.message}`);
  }
}

// 뉴스 데이터 가져오기 (PostgreSQL에서)
export async function fetchNews(ticker) {
  try {
    if (!ticker || typeof ticker !== "string") {
      throw new Error("유효하지 않은 티커 코드입니다.");
    }

    if (!/^\d{6}$/.test(ticker)) {
      throw new Error("티커 코드는 6자리 숫자여야 합니다.");
    }

    console.log(`🔍 뉴스 데이터 조회: ${ticker}`);
    const response = await fetchWithRetry(
      `${API_BASE}/api/news?ticker=${encodeURIComponent(ticker)}`
    );

    const data = await response.json();

    // 데이터 검증
    if (!Array.isArray(data)) {
      throw new Error("서버에서 유효하지 않은 뉴스 데이터를 반환했습니다.");
    }

    console.log(`✅ 뉴스 데이터 로딩 완료: ${data.length}개 뉴스`);
    return data;
  } catch (error) {
    console.error("뉴스 데이터 조회 실패:", error);

    if (error.message.includes("404")) {
      throw new Error(`종목 '${ticker}'의 뉴스를 찾을 수 없습니다.`);
    } else {
      throw new Error(
        `뉴스 데이터 조회 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }
}

// API 상태 확인 (PostgreSQL 연결 상태 포함)
export async function checkApiHealth() {
  try {
    console.log("🔍 API 서버 상태 확인...");

    // 먼저 health 엔드포인트 시도
    try {
      const healthResponse = await fetchWithTimeout(
        `${API_BASE}/api/health`,
        {},
        3000
      );
      if (healthResponse.ok) {
        const data = await healthResponse.json();
        const isHealthy = data.status === "ok";
        console.log(
          `${isHealthy ? "✅" : "❌"} API 서버 상태: ${
            isHealthy ? "정상" : "비정상"
          }`
        );
        return isHealthy;
      }
    } catch (healthError) {
      console.log("⚠️ Health 엔드포인트 없음, 실제 API 테스트로 대체...");
    }

    // Health 엔드포인트가 없으면 실제 API 호출로 테스트
    try {
      const testResponse = await fetchWithTimeout(
        `${API_BASE}/api/ticker_map`,
        {},
        5000
      );
      const isHealthy = testResponse.ok;
      console.log(
        `${isHealthy ? "✅" : "❌"} API 서버 상태: ${
          isHealthy ? "정상" : "비정상"
        } (실제 API 테스트)`
      );
      return isHealthy;
    } catch (testError) {
      console.log("⚠️ API 테스트 실패, 서버 연결 확인 필요");
      return false;
    }
  } catch (error) {
    console.error("❌ API 상태 확인 실패:", error);
    return false;
  }
}

// 캐시 관리를 위한 유틸리티
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분 (DB 데이터는 상대적으로 오래 캐시)

export function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 캐시된 데이터 사용: ${key}`);
    return cached.data;
  }
  cache.delete(key);
  return null;
}

export function setCachedData(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
  console.log(`💾 데이터 캐시 저장: ${key}`);
}

// 캐시가 포함된 주식 데이터 가져오기
export async function fetchStockCached(ticker) {
  const cacheKey = `stock_${ticker}`;
  const cached = getCachedData(cacheKey);

  if (cached) {
    return cached;
  }

  const data = await fetchStock(ticker);
  setCachedData(cacheKey, data);

  return data;
}

// 캐시가 포함된 티커 맵 가져오기
export async function fetchTickerMapCached() {
  const cacheKey = "ticker_map";
  const cached = getCachedData(cacheKey);

  if (cached) {
    return cached;
  }

  const data = await fetchTickerMap();
  setCachedData(cacheKey, data);

  return data;
}

// 뉴스와 주식 데이터를 합쳐서 반환하는 함수
export async function fetchStockWithNews(ticker) {
  try {
    console.log(`🔍 ${ticker} 종목의 주식 데이터와 뉴스를 함께 조회...`);

    // 병렬로 요청
    const [stockData, newsData] = await Promise.all([
      fetchStockCached(ticker),
      fetchNews(ticker).catch((error) => {
        console.warn("뉴스 조회 실패, 빈 배열 반환:", error.message);
        return [];
      }),
    ]);

    // 뉴스를 날짜별로 그룹핑 (URL 정보 보존)
    const newsByDate = {};
    newsData.forEach((news) => {
      const date = news.published_at;
      if (!newsByDate[date]) {
        newsByDate[date] = { companyNews: [], macroNews: [] };
      }
      // 뉴스 분류 로직 (제목에 따라 분류) - URL 정보 포함
      const newsItem = {
        title: news.title,
        url: news.url,
        published_at: news.published_at,
        summary: news.summary,
        keyword: news.keyword,
      };

      if (news.title.includes(ticker) || news.title.includes("기업")) {
        newsByDate[date].companyNews.push(newsItem);
      } else {
        newsByDate[date].macroNews.push(newsItem);
      }
    });

    // 주식 데이터에 뉴스 정보 추가
    const enrichedStockData = stockData.map((item) => ({
      ...item,
      companyNews: newsByDate[item.date]?.companyNews || [],
      macroNews: newsByDate[item.date]?.macroNews || [],
    }));

    console.log(
      `✅ 통합 데이터 생성 완료: 주식 ${enrichedStockData.length}개, 뉴스 ${newsData.length}개`
    );

    return {
      stockData: enrichedStockData,
      newsData: newsData,
      summary: {
        stockPoints: enrichedStockData.length,
        newsCount: newsData.length,
        dateRange: {
          start: enrichedStockData[0]?.date,
          end: enrichedStockData[enrichedStockData.length - 1]?.date,
        },
      },
    };
  } catch (error) {
    console.error("통합 데이터 조회 실패:", error);
    throw error;
  }
}

// 캐시 초기화 (새로고침 등에 사용)
export function clearCache() {
  cache.clear();
  console.log("🗑️ 모든 캐시 데이터가 삭제되었습니다.");
}

// 개발용 디버깅 함수
export function getApiDebugInfo() {
  return {
    apiBase: API_BASE,
    cacheSize: cache.size,
    cachedKeys: Array.from(cache.keys()),
    environment: process.env.NODE_ENV,
  };
}
