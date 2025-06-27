// utils/api.js - 개선된 버전
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api";
const REQUEST_TIMEOUT = 10000; // 10초

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
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다.");
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

      if (attempt === maxRetries) {
        throw error;
      }

      // 지수 백오프 (1초, 2초, 4초...)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// 주식 데이터 가져오기
export async function fetchStock(ticker) {
  try {
    if (!ticker || typeof ticker !== "string") {
      throw new Error("유효하지 않은 티커 코드입니다.");
    }

    const response = await fetchWithRetry(
      `${API_BASE}/stock?ticker=${encodeURIComponent(ticker)}`
    );

    // 서버 원본 응답 출력 (디버깅용)
    const text = await response.text();
    console.log("서버 원본 응답:", text);
    const data = JSON.parse(text);

    // 데이터 검증
    if (!data || !Array.isArray(data.stockData)) {
      throw new Error("서버에서 유효하지 않은 데이터를 반환했습니다.");
    }

    return data;
  } catch (error) {
    console.error("주식 데이터 조회 실패:", error);
    throw new Error(
      error.message.includes("404")
        ? "해당 종목을 찾을 수 없습니다."
        : `주식 데이터 조회 중 오류가 발생했습니다: ${error.message}`
    );
  }
}

// 티커 맵 가져오기
export async function fetchTickerMap() {
  try {
    const response = await fetchWithRetry(`${API_BASE}/ticker_map`);
    const data = await response.json();

    // 데이터 검증
    if (!Array.isArray(data)) {
      throw new Error("티커 맵 데이터 형식이 올바르지 않습니다.");
    }

    return data;
  } catch (error) {
    console.error("티커 맵 조회 실패:", error);

    // 로컬 백업 데이터 시도
    try {
      const backupResponse = await fetch("/ticker_map.json");
      if (backupResponse.ok) {
        console.warn("로컬 백업 데이터를 사용합니다.");
        return await backupResponse.json();
      }
    } catch (backupError) {
      console.error("백업 데이터도 사용할 수 없습니다:", backupError);
    }

    throw new Error(`티커 맵 조회 실패: ${error.message}`);
  }
}

// 뉴스 데이터 가져오기
export async function fetchNews(ticker, dateRange = "1M") {
  try {
    if (!ticker || typeof ticker !== "string") {
      throw new Error("유효하지 않은 티커 코드입니다.");
    }

    const params = new URLSearchParams({
      ticker: ticker,
      range: dateRange,
    });

    const response = await fetchWithRetry(
      `${API_BASE}/news?${params.toString()}`
    );

    const data = await response.json();

    // 데이터 검증
    if (!data || typeof data !== "object") {
      throw new Error("서버에서 유효하지 않은 뉴스 데이터를 반환했습니다.");
    }

    return data;
  } catch (error) {
    console.error("뉴스 데이터 조회 실패:", error);
    throw new Error(
      error.message.includes("404")
        ? "해당 종목의 뉴스를 찾을 수 없습니다."
        : `뉴스 데이터 조회 중 오류가 발생했습니다: ${error.message}`
    );
  }
}

// API 상태 확인
export async function checkApiHealth() {
  try {
    const response = await fetchWithTimeout(`${API_BASE}/health`);
    return response.ok;
  } catch (error) {
    console.error("API 상태 확인 실패:", error);
    return false;
  }
}

// 캐시 관리를 위한 유틸리티
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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
}

// 캐시가 포함된 주식 데이터 가져오기
export async function fetchStockCached(ticker) {
  const cacheKey = `stock_${ticker}`;
  const cached = getCachedData(cacheKey);

  if (cached) {
    console.log("캐시된 데이터 사용:", ticker);
    return cached;
  }

  const data = await fetchStock(ticker);
  setCachedData(cacheKey, data);

  return data;
}
