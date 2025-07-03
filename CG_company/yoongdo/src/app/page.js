// app/page.js - 백엔드 통합 버전
"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useMemo } from "react";
import LandingPage from "../components/LandingPage";

// 백엔드 연동 API 및 유틸리티
import {
  fetchStockWithNews,
  fetchTickerMapCached,
  checkApiHealth,
  clearCache,
  getApiDebugInfo,
  fetchMainNews,
  fetchStock,
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
import NewsSummaryPanel from "../components/NewsSummaryPanel";
import DeveloperStats from "../components/DeveloperStats";
import AINewsSummaryBanner from "../components/AINewsSummaryBanner";

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
  // 랜딩 페이지 상태
  const [showLanding, setShowLanding] = useState(true);
  
  // 기본 상태
  const [ticker, setTicker] = useState("000660");
  const [tickerName, setTickerName] = useState("SK하이닉스");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [selectedPage, setSelectedPage] = useState("dashboard");
  const [mainNews, setMainNews] = useState(null);
  const [keywordMarker, setKeywordMarker] = useState("");

  // 데이터 상태
  const [stockData, setStockData] = useState([]);
  const [newsData, setNewsData] = useState([]);
  const [tickerMap, setTickerMap] = useState([]);
  const [sectorStocks, setSectorStocks] = useState([]);

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

  // 입력한 키워드가 포함된 뉴스 날짜 추출
  const keywordMarkerDates = useMemo(() => {
    if (!keywordMarker.trim()) return [];
    return newsData
      .filter((news) => news.keyword && news.keyword.includes(keywordMarker))
      .map((news) => news.published_at || news.date);
  }, [newsData, keywordMarker]);

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

  // 티커 변경 또는 tickerMap 변경 시 sector 종목 정보 갱신
  useEffect(() => {
    if (!ticker || tickerMap.length === 0) return;
    const current = tickerMap.find((item) => item.ticker === ticker);
    if (!current || !current.sector) {
      // sector 정보가 없으면 단일 종목만
      setSectorStocks([current]);
      return;
    }
    // 같은 sector의 종목 리스트
    const sameSector = tickerMap.filter(
      (item) => item.sector === current.sector
    );
    // 가격/변동률 정보 fetch (병렬)
    Promise.all(
      sameSector.map(async (item) => {
        try {
          const stockArr = await fetchStock(item.ticker);
          // 최신 데이터(마지막 값) 기준
          const last = Array.isArray(stockArr)
            ? stockArr[stockArr.length - 1]
            : null;
          return {
            ...item,
            price: last ? last.close : null,
            change_rate: last ? last.change_rate : null,
          };
        } catch {
          return { ...item, price: null, change_rate: null };
        }
      })
    ).then(setSectorStocks);
  }, [ticker, tickerMap]);

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
        if (
          date &&
          selectedPage !== "news" &&
          window?.__activeTab === "macro"
        ) {
          let macroMain = null;
          if (
            newsData &&
            newsData.macroNews &&
            Array.isArray(newsData.macroNews)
          ) {
            macroMain = newsData.macroNews.find(
              (item) => item.published_at === date || item.date === date
            );
          }
          if (!macroMain && newsData && newsData.published_at === date)
            macroMain = newsData;
          if (macroMain) {
            setMainNews(macroMain);
          } else {
            setMainNews(null);
          }
        } else if (date && ticker) {
          const mainList = await fetchMainNews(ticker);
          const matched = Array.isArray(mainList)
            ? mainList.find(
                (item) => item.published_at === date || item.date === date
              )
            : null;
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
          const dateStr = new Date(newsData.time * 1000)
            .toISOString()
            .split("T")[0];
          const found = stockData.find((d) => d.date === dateStr);
          setSelectedNews(found || newsData);
        } else {
          setSelectedNews(newsData);
        }
        // 반드시 선택한 날짜를 저장
        setSelectedDate(date);
      } catch (error) {
        setMainNews(null);
        setSelectedNews(null);
        setSelectedDate(null);
      }
    },
    [stockData, ticker, selectedPage]
  );

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

  // 랜딩 페이지 진입 핸들러
  const handleEnterApp = useCallback(() => {
    setShowLanding(false);
  }, []);

  // 네비게이션 핸들러
  const handleNavigate = useCallback((page) => {
    setShowLanding(false);
    if (page === 'chart' || page === 'home') {
      setSelectedPage('dashboard');
    } else if (page === 'keyword') {
      setSelectedPage('keyword');
    } else if (page === 'analysis') {
      setSelectedPage('analysis');
    } else if (page === 'demo') {
      // 데모 페이지로 이동 (일단 메인 앱으로)
      setSelectedPage('dashboard');
    }
  }, []);

  // 랜딩 페이지 표시
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} onNavigate={handleNavigate} />;
  }

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
    <div className="flex overflow-x-hidden">
      <Sidebar currentPage="news" />
      <div className="flex-1 ml-52 min-w-0">
        <Header ticker={ticker} setTicker={setTicker} />
        <main className="p-8 bg-gray-50 min-w-0">
          {selectedPage === "news" ? (
            <NewsPanel
              news={newsData}
              date={selectedDate}
              loading={isLoadingStock}
              mainNews={mainNews}
              ticker={ticker}
              key={selectedDate ? `news-${selectedDate}` : "news-empty"}
            />
          ) : selectedPage === "analysis" ? (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">키워드 분석</h1>
                <p className="text-gray-600">키워드 분석 페이지입니다. 개발 중입니다.</p>
              </div>
            </div>
          ) : selectedPage === "keyword" ? (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">키워드 검색</h1>
                <p className="text-gray-600">키워드 검색 페이지입니다. 개발 중입니다.</p>
              </div>
            </div>
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

              {/* 종목 카드들 */}
              <ErrorBoundary name="StockCards">
                {isLoadingStock ? (
                  <StockCardsSkeleton />
                ) : (
                  <StockCards
                    sectorStocks={sectorStocks}
                    selectedTicker={ticker}
                    onSelectStock={setTicker}
                  />
                )}
              </ErrorBoundary>

              {/* 차트와 뉴스 패널 */}
              <div
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                style={{ minHeight: "600px" }}
              >
                {/* 차트 영역 (2/3) */}
                <div className="lg:col-span-2" style={{ height: "450px" }}>
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
                    ) : !ticker ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">🔍</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            종목을 선택해주세요
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            검색창에서 종목명 또는 코드를 입력하세요
                          </p>
                        </div>
                      </div>
                    ) : !stockData || stockData.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-6xl mb-4">📊</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            차트 데이터를 로딩 중입니다...
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            {ticker} ({tickerName}) 데이터를 가져오는 중
                          </p>
                          <button
                            onClick={handleRetryStock}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                          >
                            다시 시도
                          </button>
                        </div>
                      </div>
                    ) : (
                      <CleanChartContainer
                        ticker={ticker}
                        tickerName={tickerName}
                        stockData={stockData}
                        onShowNews={handleShowNews}
                        keywordMarker={keywordMarker}
                        setKeywordMarker={setKeywordMarker}
                        keywordMarkerDates={keywordMarkerDates}
                        key={`chart-${ticker}-${stockData.length}`}
                      />
                    )}
                  </ErrorBoundary>
                </div>

                {/* 뉴스 패널 + AI 요약 배너 영역 (1/3) */}
                <div
                  className="lg:col-span-1 flex flex-col"
                  style={{ height: "600px" }}
                >
                  {/* 뉴스 패널 */}
                  <div className="flex-1" style={{ height: "500px" }}>
                    <ErrorBoundary
                      name="NewsPanel"
                      fallback={(error, retry) => (
                        <NewsErrorFallback error={error} onRetry={retry} />
                      )}
                    >
                      <NewsPanel
                        news={newsData}
                        date={selectedDate}
                        loading={isLoadingStock}
                        mainNews={mainNews}
                        ticker={ticker}
                        key={selectedDate ? `news-${selectedDate}` : "news-empty"}
                      />
                    </ErrorBoundary>
                  </div>

                  {/* AI 뉴스 요약 배너 - 뉴스패널 바로 아래 */}
                  <div className="mt-6" style={{ height: "100px" }}>
                    <AINewsSummaryBanner ticker={ticker} />
                  </div>
                </div>
              </div>

              {/* 개발자 배너 */}
              <DeveloperStats
                apiHealthy={apiHealthy}
                ticker={ticker}
                tickerName={tickerName}
                stockData={stockData}
                newsData={newsData}
                errors={errors}
                selectedNews={selectedNews}
                lastUpdateTime={lastUpdateTime}
                handleManualRefresh={handleManualRefresh}
                isLoadingStock={isLoadingStock}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
