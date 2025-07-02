import { useState, useEffect, useCallback, useRef } from "react";
import { fetchStock, fetchNews } from "../utils/api";

// 메모리 캐시 구현
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// 임시 더미 데이터 (API 연결 문제 시 사용)
const dummyStockData = [
  {
    date: "2025-01-01",
    open: 50000,
    high: 52000,
    low: 49000,
    close: 51000,
    companyNews: ["삼성전자 신제품 출시"],
    macroNews: ["금리 동결 소식"],
  },
  {
    date: "2025-01-02",
    open: 51000,
    high: 53000,
    low: 50000,
    close: 52500,
    companyNews: ["실적 발표 예정"],
    macroNews: [],
  },
  {
    date: "2025-01-03",
    open: 52500,
    high: 54000,
    low: 51500,
    close: 53500,
    companyNews: ["신규 계약 체결"],
    macroNews: ["환율 변동"],
  },
  {
    date: "2025-01-06",
    open: 53500,
    high: 55000,
    low: 53000,
    close: 54500,
    companyNews: ["주주총회 개최"],
    macroNews: ["유가 상승"],
  },
  {
    date: "2025-01-07",
    open: 54500,
    high: 56000,
    low: 54000,
    close: 55500,
    companyNews: ["배당금 발표"],
    macroNews: [],
  },
];

const dummyNewsData = [
  {
    published_at: "2025-01-01",
    title: "삼성전자 신제품 출시",
    summary: "새로운 스마트폰 라인업 공개",
    publisher: "경제일보",
  },
  {
    published_at: "2025-01-02",
    title: "실적 발표 예정",
    summary: "4분기 실적 발표 예정",
    publisher: "증권일보",
  },
  {
    published_at: "2025-01-03",
    title: "신규 계약 체결",
    summary: "해외 기업과 대형 계약 체결",
    publisher: "비즈니스뉴스",
  },
];

export function useStockData(ticker) {
  const [stockData, setStockData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (tickerCode) => {
    if (!tickerCode) return;

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const cacheKey = `stock_${tickerCode}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setStockData(cached.stockData);
      setNewsData(cached.newsData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching data for ticker:", tickerCode);

      // 병렬로 데이터 페칭
      const [stockResult, newsResult] = await Promise.allSettled([
        fetchStock(tickerCode),
        fetchNews(tickerCode),
      ]);

      console.log("API Results:", {
        stock: stockResult.status,
        news: newsResult.status,
        stockData:
          stockResult.status === "fulfilled"
            ? stockResult.value?.slice(0, 2)
            : null,
        newsData:
          newsResult.status === "fulfilled"
            ? newsResult.value?.slice(0, 2)
            : null,
      });

      let stockData =
        stockResult.status === "fulfilled" ? stockResult.value : [];
      let newsData = newsResult.status === "fulfilled" ? newsResult.value : [];

      // API 실패 시 더미 데이터 사용
      if (stockResult.status === "rejected" || stockData.length === 0) {
        console.log("Using dummy stock data due to API failure");
        stockData = dummyStockData;
      }

      if (newsResult.status === "rejected" || newsData.length === 0) {
        console.log("Using dummy news data due to API failure");
        newsData = dummyNewsData;
      }

      // 캐시에 저장
      cache.set(cacheKey, {
        stockData,
        newsData,
        timestamp: Date.now(),
      });

      setStockData(stockData);
      setNewsData(newsData);

      console.log("Final data set:", {
        stockDataLength: stockData.length,
        newsDataLength: newsData.length,
      });
    } catch (err) {
      console.error("Fetch error:", err);
      if (err.name !== "AbortError") {
        setError(err.message);
        // 에러 시에도 더미 데이터 사용
        setStockData(dummyStockData);
        setNewsData(dummyNewsData);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(ticker);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [ticker, fetchData]);

  // 캐시 무효화 함수
  const invalidateCache = useCallback((tickerCode) => {
    const cacheKey = `stock_${tickerCode}`;
    cache.delete(cacheKey);
  }, []);

  return {
    stockData,
    newsData,
    loading,
    error,
    refetch: () => {
      invalidateCache(ticker);
      fetchData(ticker);
    },
  };
}
