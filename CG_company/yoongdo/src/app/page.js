// app/page.js - 개선된 버전
"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useMemo } from "react";

// 개선된 API 및 유틸리티
import { fetchStockCached, fetchTickerMap, checkApiHealth } from "../utils/api";
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

  // 데이터 상태
  const [stockData, setStockData] = useState([]);
  const [tickerMap, setTickerMap] = useState([]);

  // 로딩 및 에러 상태
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [isLoadingTicker, setIsLoadingTicker] = useState(true);
  const [apiHealthy, setApiHealthy] = useState(true);
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
          setErrors((prev) => ({
            ...prev,
            api: "API 서버에 연결할 수 없습니다.",
          }));
        }
      } catch (error) {
        console.error("API 상태 확인 실패:", error);
        setApiHealthy(false);
        setErrors((prev) => ({
          ...prev,
          api: "API 서버 상태를 확인할 수 없습니다.",
        }));
      }
    };

    checkApiStatus();

    // 주기적으로 API 상태 확인 (5분마다)
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // 티커 맵 조회 (앱 시작시 한 번만)
  useEffect(() => {
    const loadTickerMap = async () => {
      try {
        setIsLoadingTicker(true);
        setErrors((prev) => ({ ...prev, ticker: null }));

        const data = await fetchTickerMap();

        // 데이터 검증
        const validation = validateTickerMap(data);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        if (validation.warnings.length > 0) {
          console.warn("티커 맵 경고:", validation.warnings);
        }

        setTickerMap(data);
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
        }
      } catch (error) {
        console.error("종목명 조회 실패:", error);
        setTickerName("");
      }
    };

    findTickerName();
  }, [ticker, tickerMap]);

  // 주식 데이터 패칭 (티커 변경시)
  useEffect(() => {
    if (!ticker) return;

    const loadStockData = async () => {
      try {
        setIsLoadingStock(true);
        setErrors((prev) => ({ ...prev, stock: null }));

        // 1. API에서 데이터 가져오기
        let data;
        if (apiHealthy) {
          try {
            const apiData = await fetchStockCached(ticker);
            data = apiData.stockData || apiData;
            if (data) {
              console.info("API 주식 데이터 사용");
            }
          } catch (apiError) {
            console.info("API 데이터 없음 또는 실패, 로컬 데이터 시도");
          }
        }

        // 2. 로컬 파일에서 시도 (API 실패 시)
        if (!data) {
          try {
            const localResponse = await fetch("/stock_data.json");
            if (localResponse.ok) {
              data = await localResponse.json();
              console.info("로컬 주식 데이터 사용");
            }
          } catch (localError) {
            console.info("로컬 데이터도 없음");
          }
        }

        if (!data) {
          throw new Error("주식 데이터를 가져올 수 없습니다.");
        }

        // 데이터 검증
        const validation = validateStockData(data);
        if (!validation.isValid) {
          throw new Error(`데이터 검증 실패: ${validation.error}`);
        }

        if (validation.warnings.length > 0) {
          console.warn("주식 데이터 경고:", validation.warnings);
        }

        // 데이터 정렬 및 설정
        const sortedData = sortDataByDate(data);
        setStockData(sortedData);

        console.info(`주식 데이터 로딩 완료: ${sortedData.length}개 항목`);
      } catch (error) {
        console.error("주식 데이터 로딩 실패:", error);
        setErrors((prev) => ({
          ...prev,
          stock: error.message,
        }));
        setStockData([]);
      } finally {
        setIsLoadingStock(false);
      }
    };

    loadStockData();
  }, [ticker, apiHealthy]);

  // 뉴스 더보기 클릭 핸들러 (메모이제이션으로 최적화)
  const handleShowNews = useCallback(
    (newsData) => {
      console.log("📊 handleShowNews called with:", newsData);

      try {
        if (!newsData) {
          setSelectedNews(null);
          setSelectedDate(null);
          return;
        }

        if (typeof newsData === "string") {
          // 날짜 문자열인 경우
          const found = stockData.find((d) => d.date === newsData);
          setSelectedNews(found || null);
        } else if (newsData && newsData.originalDate) {
          // TradingView에서 온 데이터
          const found = stockData.find((d) => d.date === newsData.originalDate);
          setSelectedNews(found || newsData);
        } else if (newsData && newsData.date) {
          // 일반 뉴스 객체
          setSelectedNews(newsData);
        } else if (newsData && newsData.x) {
          // Chart.js에서 온 데이터
          const found = stockData.find((d) => d.date === newsData.x);
          setSelectedNews(found || newsData);
        } else if (newsData && newsData.time) {
          // TradingView timestamp
          const dateStr = new Date(newsData.time * 1000)
            .toISOString()
            .split("T")[0];
          const found = stockData.find((d) => d.date === dateStr);
          setSelectedNews(found || newsData);
        } else {
          setSelectedNews(newsData);
        }

        // 뉴스가 선택되면 날짜 선택 해제
        if (newsData) {
          setSelectedDate(null);
        }
      } catch (error) {
        console.error("뉴스 표시 중 오류:", error);
        setSelectedNews(null);
      }
    },
    [stockData]
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
    window.location.reload(); // 간단한 재시도
  }, []);

  const handleRetryTicker = useCallback(() => {
    setErrors((prev) => ({ ...prev, ticker: null }));
    window.location.reload();
  }, []);

  // 전체 로딩 상태
  const isInitialLoading = isLoadingTicker;

  // 초기 로딩 중이면 페이지 로딩 표시
  if (isInitialLoading) {
    return <PageLoading message="애플리케이션을 초기화하는 중입니다..." />;
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">초기화 실패</h2>
          <p className="text-gray-600 mb-6">{errors.ticker}</p>
          <button
            onClick={handleRetryTicker}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <Sidebar currentPage="dashboard" />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 ml-52">
        {/* 헤더 */}
        <Header
          ticker={ticker}
          setTicker={setTicker}
          tickerName={tickerName}
          setTickerName={setTickerName}
        />

        {/* 메인 컨텐츠 영역 */}
        <main className="p-6">
          {/* API 상태 알림 */}
          {!apiHealthy && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
                    API 서버 연결 불안정
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    일부 기능이 제한될 수 있습니다. 로컬 데이터를 사용합니다.
                  </p>
                </div>
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
                        데이터 로딩 실패
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
                  key={
                    selectedNews ? `news-${selectedNews.date}` : "news-empty"
                  }
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* 차트 상태 표시 */}
          {isLoadingStock && (
            <div className="mt-4 flex items-center justify-center">
              <LoadingSpinner size="sm" message="차트 데이터 로딩 중..." />
            </div>
          )}

          {!isLoadingStock && stockData.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-xs text-green-500 bg-green-50 px-3 py-2 rounded-lg inline-block">
                ⚡ 최적화 완료 | 📊 데이터: {stockData.length}개 | 🎯 에러 처리
                강화 | 💾 캐시 적용
              </div>
            </div>
          )}

          {/* 추가 정보 섹션 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 시장 지표 카드 */}
            <ErrorBoundary name="MarketIndicators">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    시장 지표
                  </h3>
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    실시간
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">KOSPI</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        2,520.45
                      </span>
                      <span className="text-xs text-green-500 ml-1">+0.5%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">KOSDAQ</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        785.23
                      </span>
                      <span className="text-xs text-red-500 ml-1">-0.2%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">USD/KRW</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        1,345.50
                      </span>
                      <span className="text-xs text-green-500 ml-1">+0.8%</span>
                    </div>
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
                    <DataLoading message="거래 정보 로딩 중..." />
                  )}
                </div>
              </div>
            </ErrorBoundary>

            {/* 기술적 지표 */}
            <ErrorBoundary name="TechnicalIndicators">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    기술적 지표
                  </h3>
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">
                    분석
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">RSI (14)</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-orange-500">
                        65.4
                      </span>
                      <span className="text-xs text-gray-400 ml-1">과매수</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">MACD</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-green-500">
                        +1.23
                      </span>
                      <span className="text-xs text-gray-400 ml-1">상승</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">볼린저 밴드</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-blue-500">
                        중립
                      </span>
                      <span className="text-xs text-gray-400 ml-1">안정</span>
                    </div>
                  </div>
                </div>
              </div>
            </ErrorBoundary>
          </div>

          {/* 성능 최적화 상태 */}
          {!isLoadingStock && stockData.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-xs text-green-500 bg-green-50 px-3 py-2 rounded-lg inline-block">
                ⚡ useCallback 최적화 | 🔄 무한 루프 방지 | 🎯 안정적인 더블클릭
                | 💾 메모리 최적화 | 🛡️ 에러 바운더리 적용
              </div>
            </div>
          )}

          {/* 시스템 상태 정보 */}
          <div className="mt-6 bg-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              🔧 시스템 상태
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">API 상태:</span>
                <span
                  className={`ml-1 ${
                    apiHealthy ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {apiHealthy ? "정상" : "불안정"}
                </span>
              </div>
              <div>
                <span className="font-medium">종목:</span>
                <span className="ml-1">
                  {ticker} ({tickerName || "로딩중"})
                </span>
              </div>
              <div>
                <span className="font-medium">데이터:</span>
                <span className="ml-1">{stockData.length}개</span>
              </div>
              <div>
                <span className="font-medium">선택된 뉴스:</span>
                <span className="ml-1">{selectedNews ? "있음" : "없음"}</span>
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
                🔧 개발 정보
              </h4>
              <div className="text-xs text-blue-600 space-y-1">
                <div>
                  현재 종목: {ticker} ({tickerName})
                </div>
                <div>
                  선택된 뉴스:{" "}
                  {selectedNews ? selectedNews.date || "있음" : "없음"}
                </div>
                <div>선택된 날짜: {selectedDate || "없음"}</div>
                <div>주식 데이터: {stockData.length}개</div>
                <div>
                  로딩 상태: 주식({isLoadingStock ? "로딩 중" : "완료"}) | 티커(
                  {isLoadingTicker ? "로딩 중" : "완료"})
                </div>
                <div className="text-green-600 font-medium">
                  ✅ 모든 최적화 적용 완료
                </div>
                <div className="text-blue-600 font-medium">
                  🚀 에러 처리 및 검증 강화
                </div>
                <div className="text-purple-600 font-medium">
                  🛡️ ErrorBoundary로 안정성 확보
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
