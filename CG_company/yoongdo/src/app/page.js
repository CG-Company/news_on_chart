// app/page.js - 백엔드 통합 버전
"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useMemo } from "react";

// 백엔드 연동 API 및 유틸리티
import {
  fetchStockWithNews,
  fetchTickerMapCached,
  checkApiHealth,
  clearCache,
  getApiDebugInfo,
  fetchMainNews,
} from "../utils/api";
import {
  validateStockData,
  validateTickerMap,
  sortDataByDate,
} from "../utils/dataValidation";

// 에러 바운더리 및 로딩 컴포넌트
import ErrorBoundary, {
  ChartErrorFallback,
  NewsErrorFallback,
} from "../components/ErrorBoundary";
import {
  LoadingSpinner,
  ChartLoadingSkeleton,
  NewsLoadingSkeleton,
  StockCardsSkeleton,
  PageLoading,
  DataLoading,
} from "../components/LoadingSpinner";

// 기존 컴포넌트들
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StockCards from "../components/StockCards";

// 동적 import로 차트 컴포넌트들 불러오기
const CleanChartContainer = dynamic(
  () => import("../components/CleanChartContainer"),
  {
    ssr: false,
    loading: () => <ChartLoadingSkeleton />,
  }
);

const NewsPanel = dynamic(() => import("../components/NewsPanel"), {
  ssr: false,
  loading: () => <NewsLoadingSkeleton />,
});

export default function Page() {
  // 기본 상태
  const [ticker, setTicker] = useState("000660");
  const [tickerName, setTickerName] = useState("SK하이닉스");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedPage, setSelectedPage] = useState("dashboard");
  const [mainNews, setMainNews] = useState(null);

  // 데이터 상태
  const [stockData, setStockData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [tickerMap, setTickerMap] = useState([]);

  // 로딩 및 에러 상태
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [isLoadingTicker, setIsLoadingTicker] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [errors, setErrors] = useState({
    stock: null,
    ticker: null,
    api: null,
  });

  // API 상태 확인
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const healthy = await checkApiHealth();
        setApiHealthy(healthy);
        if (!healthy) {
          // Health check 실패해도 실제 데이터 로딩이 성공하면 경고만 표시
          setErrors((prev) => ({
            ...prev,
            api: "API 서버 상태를 확인할 수 없지만, 데이터 로딩은 계속 시도합니다.",
          }));
        } else {
          setErrors((prev) => ({ ...prev, api: null }));
        }
      } catch (error) {
        console.error("API 상태 확인 실패:", error);
        // Health check 실패해도 실제 데이터 로딩은 계속 시도
        setApiHealthy(true); // 실제 데이터 로딩으로 판단
        setErrors((prev) => ({
          ...prev,
          api: null, // 에러 제거
        }));
      }
    };

    checkApiStatus();

    // 주기적으로 API 상태 확인 (2분마다로 변경)
    const interval = setInterval(checkApiStatus, 120 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 티커 맵 조회 (앱 시작시 한 번만)
  useEffect(() => {
    const loadTickerMap = async () => {
      try {
        setIsLoadingTicker(true);
        setErrors((prev) => ({ ...prev, ticker: null }));

        console.log("🔍 PostgreSQL에서 티커 맵 로딩...");
        const data = await fetchTickerMapCached();

        // 데이터 검증
        const validation = validateTickerMap(data);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        if (validation.warnings.length > 0) {
          console.warn("티커 맵 경고:", validation.warnings);
        }

        setTickerMap(data);
        console.log(`✅ 티커 맵 로딩 완료: ${data.length}개 종목`);
      } catch (error) {
        console.error("티커 맵 로딩 실패:", error);
        setErrors((prev) => ({
          ...prev,
          ticker: error.message,
        }));
      } finally {
        setIsLoadingTicker(false);
      }
    };

    loadTickerMap();
  }, []);

  // 종목명 조회 (티커 변경시)
  useEffect(() => {
    if (!ticker || tickerMap.length === 0) return;

    const findTickerName = () => {
      try {
        const found = tickerMap.find((item) => item.ticker === ticker);
        const name = found ? found.name : "";
        setTickerName(name);

        if (!found) {
          console.warn(`티커 ${ticker}에 대한 종목명을 찾을 수 없습니다.`);
        } else {
          console.log(`📌 종목 선택: ${ticker} - ${name}`);
        }
      } catch (error) {
        console.error("종목명 조회 실패:", error);
        setTickerName("");
      }
    };

    findTickerName();
  }, [ticker, tickerMap]);

  // 주식 데이터 + 뉴스 데이터 패칭 (티커 변경시)
  useEffect(() => {
    if (!ticker) return;

    const loadStockWithNewsData = async () => {
      try {
        setIsLoadingStock(true);
        setErrors((prev) => ({ ...prev, stock: null }));

        console.log(`🔍 PostgreSQL에서 ${ticker} 데이터 로딩...`);

        // 백엔드에서 주식 데이터와 뉴스를 함께 가져오기
        const result = await fetchStockWithNews(ticker);

        // 데이터 검증
        const validation = validateStockData(result.stockData);
        if (!validation.isValid) {
          throw new Error(`주식 데이터 검증 실패: ${validation.error}`);
        }

        if (validation.warnings.length > 0) {
          console.warn("주식 데이터 경고:", validation.warnings);
        }

        // 데이터 정렬 및 설정
        const sortedStockData = sortDataByDate(result.stockData);
        setStockData(sortedStockData);
        setNewsData(result.newsData);
        setLastUpdateTime(new Date());

        console.log(`✅ 데이터 로딩 완료:`, result.summary);

        // 데이터 로딩 성공 시 API 상태를 정상으로 설정
        setApiHealthy(true);
        setErrors((prev) => ({ ...prev, api: null }));
      } catch (error) {
        console.error("주식 데이터 로딩 실패:", error);
        setErrors((prev) => ({
          ...prev,
          stock: error.message,
        }));
        setStockData([]);
        setNewsData([]);
      } finally {
        setIsLoadingStock(false);
      }
    };

    loadStockWithNewsData();
  }, [ticker]);

  // 뉴스 더보기 클릭 핸들러 (더블클릭 등)
  const handleShowNews = useCallback(
    async (newsData) => {
      try {
        let date = null;
        if (!newsData) {
          setSelectedNews(null);
          setSelectedDate(null);
          setMainNews(null);
          return;
        }
        if (typeof newsData === "string") {
          date = newsData;
        } else if (newsData.originalDate) {
          date = newsData.originalDate;
        } else if (newsData.date) {
          date = newsData.date;
        } else if (newsData.x) {
          date = newsData.x;
        } else if (newsData.time) {
          date = new Date(newsData.time * 1000).toISOString().split("T")[0];
        }
        // macro 탭에서 거시경제 메인뉴스 올리기
        if (date && selectedPage !== "news" && window?.__activeTab === 'macro') {
          // macroNewsList는 NewsPanel 내부에서 관리되므로, selectedNews에서 macroNews 추출
          let macroMain = null;
          if (newsData && newsData.macroNews && Array.isArray(newsData.macroNews)) {
            macroMain = newsData.macroNews.find(item => item.published_at === date || item.date === date);
          }
          if (!macroMain && newsData && newsData.published_at === date) macroMain = newsData;
          if (macroMain) {
            setMainNews(macroMain);
          } else {
            setMainNews(null);
          }
        } else if (date && ticker) {
          const mainList = await fetchMainNews(ticker);
          const matched = Array.isArray(mainList) ? mainList.find(item => item.published_at === date || item.date === date) : null;
          setMainNews(matched || null);
        } else {
          setMainNews(null);
        }
        // 기존 selectedNews 처리
        if (typeof newsData === "string") {
          const found = stockData.find((d) => d.date === newsData);
          setSelectedNews(found || null);
        } else if (newsData && newsData.originalDate) {
          const found = stockData.find((d) => d.date === newsData.originalDate);
          setSelectedNews(found || newsData);
        } else if (newsData && newsData.date) {
          setSelectedNews(newsData);
        } else if (newsData && newsData.x) {
          const found = stockData.find((d) => d.date === newsData.x);
          setSelectedNews(found || newsData);
        } else if (newsData && newsData.time) {
          const dateStr = new Date(newsData.time * 1000).toISOString().split("T")[0];
          const found = stockData.find((d) => d.date === dateStr);
          setSelectedNews(found || newsData);
        } else {
          setSelectedNews(newsData);
        }
        if (newsData) setSelectedDate(null);
      } catch (error) {
        setMainNews(null);
        setSelectedNews(null);
      }
    },
    [stockData, ticker, selectedPage]
  );

  // 현재가 및 변동률 계산 (메모이제이션)
  const currentData = useMemo(() => {
    if (!stockData || stockData.length === 0) return null;

    try {
      const latest = stockData[stockData.length - 1];
      if (!latest || typeof latest.close !== "number") return null;

      const previous =
        stockData.length > 1 ? stockData[stockData.length - 2] : latest;
      if (!previous || typeof previous.close !== "number") return null;

      const change = latest.close - previous.close;
      const changePercent =
        previous.close !== 0 ? (change / previous.close) * 100 : 0;

      return { latest, change, changePercent };
    } catch (error) {
      console.error("현재가 계산 오류:", error);
      return null;
    }
  }, [stockData]);

  // 에러 재시도 핸들러
  const handleRetryStock = useCallback(() => {
    setErrors((prev) => ({ ...prev, stock: null }));
    // 캐시 초기화 후 재시도
    clearCache();
    window.location.reload();
  }, []);

  const handleRetryTicker = useCallback(() => {
    setErrors((prev) => ({ ...prev, ticker: null }));
    clearCache();
    window.location.reload();
  }, []);

  // 수동 새로고침 핸들러
  const handleManualRefresh = useCallback(async () => {
    setIsLoadingStock(true);
    clearCache();

    try {
      const result = await fetchStockWithNews(ticker);
      const sortedStockData = sortDataByDate(result.stockData);
      setStockData(sortedStockData);
      setNewsData(result.newsData);
      setLastUpdateTime(new Date());
      setErrors((prev) => ({ ...prev, stock: null }));
    } catch (error) {
      setErrors((prev) => ({ ...prev, stock: error.message }));
    } finally {
      setIsLoadingStock(false);
    }
  }, [ticker]);

  // 전체 로딩 상태
  const isInitialLoading = isLoadingTicker;

  // 초기 로딩 중이면 페이지 로딩 표시
  if (isInitialLoading) {
    return (
      <PageLoading message="PostgreSQL 데이터베이스에서 종목 정보를 가져오는 중입니다..." />
    );
  }

  // 심각한 에러가 있으면 에러 페이지 표시
  if (errors.ticker && tickerMap.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            데이터베이스 연결 실패
          </h2>
          <p className="text-gray-600 mb-6">{errors.ticker}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetryTicker}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              다시 시도
            </button>
            <div className="text-xs text-gray-500">
              <p>FastAPI 서버가 실행 중인지 확인해주세요:</p>
              <code className="bg-gray-100 px-2 py-1 rounded mt-1 block">
                python api_server.py
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <Sidebar
        currentPage={selectedPage}
        onMenuSelect={setSelectedPage}
      />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 ml-52">
        <Header ticker={ticker} setTicker={setTicker} tickerName={tickerName} />

        <main className="p-6">
          {/* News 탭 클릭 시 NewsPanel만 보여주기 */}
          {selectedPage === "news" ? (
            <NewsPanel
              news={newsData}
              loading={isLoadingStock}
              mainNews={mainNews}
              ticker={ticker}
              key={selectedNews ? `news-${selectedNews.date}` : "news-empty"}
            />
          ) : (
            // 기졸 메인 컨텐츠 영역 (차트, 카드 등)
            <>
              {/* API 상태 알림 */}
              {!apiHealthy && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-yellow-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          FastAPI 서버 연결 불안정
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          PostgreSQL 데이터베이스 연결을 확인하고 있습니다.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-lg transition-colors"
                    >
                      새로고침
                    </button>
                  </div>
                </div>
              )}

              {/* 데이터 업데이트 정보 */}
              {lastUpdateTime && apiHealthy && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-green-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          PostgreSQL 데이터 연결 완료
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          마지막 업데이트: {lastUpdateTime.toLocaleString("ko-KR")}{" "}
                          | 주식 데이터: {stockData.length}개 | 뉴스:{" "}
                          {newsData.length}개
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleManualRefresh}
                      disabled={isLoadingStock}
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoadingStock ? "업데이트 중..." : "새로고침"}
                    </button>
                  </div>
                </div>
              )}

              {/* 종목 카드들 */}
              <ErrorBoundary name="StockCards">
                {isLoadingStock ? (
                  <StockCardsSkeleton />
                ) : (
                  <StockCards
                    currentStock={{ ticker, tickerName }}
                    stockData={stockData}
                    currentData={currentData}
                  />
                )}
              </ErrorBoundary>

              {/* 차트와 뉴스 패널 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 차트 영역 (2/3) */}
                <div className="lg:col-span-2">
                  <ErrorBoundary
                    name="ChartContainer"
                    fallback={(error, retry) => (
                      <ChartErrorFallback error={error} onRetry={retry} />
                    )}
                  >
                    {errors.stock ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg
                              className="w-6 h-6 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            데이터베이스 연결 실패
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            {errors.stock}
                          </p>
                          <button
                            onClick={handleRetryStock}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            다시 시도
                          </button>
                        </div>
                      </div>
                    ) : isLoadingStock ? (
                      <ChartLoadingSkeleton />
                    ) : (
                      <CleanChartContainer
                        ticker={ticker}
                        tickerName={tickerName}
                        stockData={stockData}
                        onShowNews={handleShowNews}
                        key={`chart-${ticker}-${stockData.length}`}
                      />
                    )}
                  </ErrorBoundary>
                </div>

                {/* 뉴스 패널 (1/3) */}
                <div className="lg:col-span-1">
                  <ErrorBoundary
                    name="NewsPanel"
                    fallback={(error, retry) => (
                      <NewsErrorFallback error={error} onRetry={retry} />
                    )}
                  >
                    <NewsPanel
                      news={selectedNews}
                      date={selectedDate}
                      loading={isLoadingStock}
                      mainNews={mainNews}
                      ticker={ticker}
                      key={selectedNews ? `news-${selectedNews.date}` : "news-empty"}
                    />
                  </ErrorBoundary>
                </div>
              </div>

              {/* 차트 상태 표시 */}
              {isLoadingStock && (
                <div className="mt-4 flex items-center justify-center">
                  <LoadingSpinner
                    size="sm"
                    message="PostgreSQL에서 차트 데이터 로딩 중..."
                  />
                </div>
              )}

              {!isLoadingStock && stockData.length > 0 && (
                <div className="mt-4 text-center">
                  <div className="text-xs text-green-500 bg-green-50 px-3 py-2 rounded-lg inline-block">
                    🐘 PostgreSQL 연동 | 📊 주식 데이터: {stockData.length}개 | 📰
                    뉴스: {newsData.length}개 | 🎯 실시간 DB 연결
                  </div>
                </div>
              )}

              {/* 데이터베이스 정보 섹션 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* DB 연결 상태 */}
                <ErrorBoundary name="DatabaseStatus">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        데이터베이스
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          apiHealthy
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {apiHealthy ? "PostgreSQL 연결됨" : "연결 실패"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">DB 테이블</span>
                        <span className="text-sm font-medium text-gray-900">
                          stock_price, news, ticker
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">API 상태</span>
                        <span
                          className={`text-sm font-medium ${
                            apiHealthy ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {apiHealthy ? "정상" : "오류"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          마지막 업데이트
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {lastUpdateTime
                            ? lastUpdateTime.toLocaleTimeString("ko-KR")
                            : "없음"}
                        </span>
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>

                {/* 거래량 정보 */}
                <ErrorBoundary name="TradingInfo">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        거래 정보
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {tickerName || "종목"}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {currentData ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">현재가</span>
                            <span className="text-sm font-medium text-gray-900">
                              {currentData.latest.close.toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">전일대비</span>
                            <span
                              className={`text-sm font-medium ${
                                currentData.change >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {currentData.change >= 0 ? "+" : ""}
                              {currentData.change.toLocaleString()}원
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">등락률</span>
                            <span
                              className={`text-sm font-medium ${
                                currentData.changePercent >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {currentData.changePercent >= 0 ? "+" : ""}
                              {currentData.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <DataLoading message="PostgreSQL에서 거래 정보 로딩 중..." />
                      )}
                    </div>
                  </div>
                </ErrorBoundary>

                {/* 뉴스 통계 */}
                <ErrorBoundary name="NewsStats">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        뉴스 통계
                      </h3>
                      <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                        실시간
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">총 뉴스</span>
                        <span className="text-sm font-medium text-gray-900">
                          {newsData.length}개
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">기업 뉴스</span>
                        <span className="text-sm font-medium text-blue-500">
                          {stockData.reduce(
                            (sum, item) => sum + (item.companyNews?.length || 0),
                            0
                          )}
                          개
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">거시경제</span>
                        <span className="text-sm font-medium text-orange-500">
                          {stockData.reduce(
                            (sum, item) => sum + (item.macroNews?.length || 0),
                            0
                          )}
                          개
                        </span>
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>
              </div>

              {/* 시스템 상태 정보 */}
              <div className="mt-6 bg-gray-100 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  🔧 시스템 상태 (PostgreSQL 연동)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">DB 상태:</span>
                    <span
                      className={`ml-1 ${
                        apiHealthy ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {apiHealthy ? "PostgreSQL 연결됨" : "연결 실패"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">종목:</span>
                    <span className="ml-1">
                      {ticker} ({tickerName || "로딩중"})
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">주식 데이터:</span>
                    <span className="ml-1">
                      {stockData.length}개 (DB에서 실시간)
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">뉴스 데이터:</span>
                    <span className="ml-1">{newsData.length}개</span>
                  </div>
                </div>

                {/* 에러 상태 표시 */}
                {(errors.stock || errors.api) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-red-600 mb-1">
                      ⚠️ 현재 오류:
                    </p>
                    <div className="space-y-1">
                      {errors.stock && (
                        <p className="text-xs text-red-500">
                          • 주식 데이터: {errors.stock}
                        </p>
                      )}
                      {errors.api && (
                        <p className="text-xs text-red-500">
                          • API 연결: {errors.api}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 개발 환경에서만 보이는 디버깅 정보 */}
              {process.env.NODE_ENV === "development" && (
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-700 mb-2">
                    🔧 개발 정보 (PostgreSQL)
                  </h4>
                  <div className="text-xs text-blue-600 space-y-1">
                    <div>
                      현재 종목: {ticker} ({tickerName})
                    </div>
                    <div>
                      DB 테이블: stock_price ({stockData.length}행), news (
                      {newsData.length}행)
                    </div>
                    <div>
                      선택된 뉴스:{" "}
                      {selectedNews ? selectedNews.date || "있음" : "없음"}
                    </div>
                    <div>API 베이스: {getApiDebugInfo().apiBase}</div>
                    <div>
                      캐시 키: {getApiDebugInfo().cachedKeys.join(", ") || "없음"}
                    </div>
                    <div className="text-green-600 font-medium">
                      ✅ PostgreSQL + FastAPI 연동 완료
                    </div>
                    <div className="text-blue-600 font-medium">
                      🚀 실시간 데이터베이스 연결
                    </div>
                    <div className="text-purple-600 font-medium">
                      🛡️ 전체 에러 처리 시스템 적용
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
