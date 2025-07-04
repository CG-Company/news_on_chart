// KOSPI200Grid.js
"use client";
import React, { useEffect, useState } from "react";
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import StockDetailPanel from "./StockDetailPanel";
import StockKeywordAnalysis from "./StockKeywordAnalysis";

const KOSPI200Grid = ({ search = "" }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showKeywordAnalysis, setShowKeywordAnalysis] = useState(false);
  const [keywordAnalysisStock, setKeywordAnalysisStock] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('종목 목록을 가져오는 중...');
  const [loadingMore, setLoadingMore] = useState(false);
  const [allTickers, setAllTickers] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";

  useEffect(() => {
    const fetchStocksWithPrices = async () => {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingMessage('종목 목록을 가져오는 중...');

      try {
        // 1. 종목 리스트 가져오기
        const tickerResponse = await fetch(`${API_BASE}/api/ticker_map`);
        if (!tickerResponse.ok) {
          throw new Error(`Ticker API error! status: ${tickerResponse.status}`);
        }

        const tickerData = await tickerResponse.json();
        console.log("Ticker Map Response:", tickerData);
        setLoadingProgress(20);
        setLoadingMessage('종목 목록 로딩 완료! 주가 데이터 수집 중...');

        const rawTickerList = Array.isArray(tickerData)
          ? tickerData
          : tickerData.stocks || [];

        // 000000 티커(거시뉴스) 제외
        const filteredTickers = rawTickerList.filter(
          (ticker) => ticker.ticker !== "000000"
        );
        
        // 전체 티커 목록 저장
        setAllTickers(filteredTickers);
        
        // 처음에는 30개만 로딩
        const tickerList = filteredTickers.slice(0, 30);

        // 2. 배치로 나누어 순차적으로 처리 (서버 부하 줄임)
        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < tickerList.length; i += batchSize) {
          batches.push(tickerList.slice(i, i + batchSize));
        }

        let allStocks = [];

        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          setLoadingMessage(`배치 ${batchIndex + 1}/${batches.length} 처리 중... (${batch.length}개 종목)`);
          
          const stockPromises = batch.map(async (ticker) => {
            try {
              // 주식 데이터와 뉴스 데이터를 병렬로 가져오기
              const [stockResponse, newsResponse] = await Promise.allSettled([
                fetch(`${API_BASE}/api/stock?ticker=${ticker.ticker}`),
                fetch(`${API_BASE}/api/news_is_selected?ticker=${ticker.ticker}`)
              ]);

              // 주식 데이터 처리
              let latestStock = null;
              if (stockResponse.status === 'fulfilled' && stockResponse.value.ok) {
                const stockData = await stockResponse.value.json();
                const stockArray = stockData.stockData || [];
                latestStock = stockArray.length > 0 ? stockArray[stockArray.length - 1] : null;
              }

              // 뉴스 키워드 처리
              let keywords = [];
              if (newsResponse.status === 'fulfilled' && newsResponse.value.ok) {
                try {
                  const newsData = await newsResponse.value.json();
                  const newsList = newsData.news || [];

                  if (newsList.length > 0) {
                    const latestNews = newsList[newsList.length - 1];
                    if (latestNews.keyword && latestNews.keyword.trim()) {
                      keywords = latestNews.keyword
                        .split(",")
                        .map((k) => k.trim())
                        .map((k) => k.replace(/[^\w\s가-힣]/g, ""))
                        .filter((k) => k.length > 0)
                        .slice(0, 3);
                    }
                  }
                } catch (newsError) {
                  console.warn(`Error parsing news for ${ticker.ticker}:`, newsError);
                }
              }

              return {
                ticker: ticker.ticker,
                name: ticker.name || ticker.company_name,
                sector: ticker.sector || "기타",
                price: latestStock ? latestStock.close : null,
                change: latestStock ? latestStock.change_rate : null,
                date: latestStock ? latestStock.date : null,
                keywords: keywords,
                trend: latestStock && latestStock.change_rate >= 0 ? "up" : "down",
              };
            } catch (error) {
              console.warn(`Error fetching data for ${ticker.ticker}:`, error);
              return {
                ticker: ticker.ticker,
                name: ticker.name || ticker.company_name,
                sector: ticker.sector || "기타",
                price: null,
                change: null,
                date: null,
                keywords: [],
                trend: "down",
              };
            }
          });

          const batchResults = await Promise.all(stockPromises);
          allStocks = [...allStocks, ...batchResults];
          
          // 진행률 업데이트
          const progress = 20 + ((batchIndex + 1) / batches.length) * 70;
          setLoadingProgress(progress);
          
          // 중간 결과 표시 (점진적 로딩)
          if (allStocks.length > 0) {
            const sortedStocks = allStocks.sort((a, b) => {
              if (a.price && !b.price) return -1;
              if (!a.price && b.price) return 1;
              if (a.price && b.price) return b.price - a.price;
              return a.ticker.localeCompare(b.ticker);
            });
            setStocks(sortedStocks);
            setLoadingMessage(`${allStocks.length}개 종목 로딩 완료! 키워드 분석 중...`);
          }
        }
        
        setLoadingProgress(100);
        setLoadingMessage('모든 데이터 로딩 완료!');
        
        // 더 불러올 데이터가 있는지 확인
        setHasMore(allStocks.length < filteredTickers.length);

        console.log(`✅ ${allStocks.length}개 종목 데이터 로딩 완료 (전체: ${filteredTickers.length}개)`);
      } catch (err) {
        console.error("Error fetching stocks:", err);
        setError(err.message);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStocksWithPrices();
  }, []);

  // 더 많은 종목 로딩 함수
  const loadMoreStocks = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      const currentCount = stocks.length;
      const nextBatch = allTickers.slice(currentCount, currentCount + 30); // 30개씩 추가 로딩
      
      if (nextBatch.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      console.log(`추가 로딩: ${nextBatch.length}개 종목`);
      
      // 배치로 나누어 처리
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < nextBatch.length; i += batchSize) {
        batches.push(nextBatch.slice(i, i + batchSize));
      }
      
      let newStocks = [];
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        const stockPromises = batch.map(async (ticker) => {
          try {
            const [stockResponse, newsResponse] = await Promise.allSettled([
              fetch(`${API_BASE}/api/stock?ticker=${ticker.ticker}`),
              fetch(`${API_BASE}/api/news_is_selected?ticker=${ticker.ticker}`)
            ]);

            // 주식 데이터 처리
            let latestStock = null;
            if (stockResponse.status === 'fulfilled' && stockResponse.value.ok) {
              const stockData = await stockResponse.value.json();
              const stockArray = stockData.stockData || [];
              latestStock = stockArray.length > 0 ? stockArray[stockArray.length - 1] : null;
            }

            // 뉴스 키워드 처리
            let keywords = [];
            if (newsResponse.status === 'fulfilled' && newsResponse.value.ok) {
              try {
                const newsData = await newsResponse.value.json();
                const newsList = newsData.news || [];

                if (newsList.length > 0) {
                  const latestNews = newsList[newsList.length - 1];
                  if (latestNews.keyword && latestNews.keyword.trim()) {
                    keywords = latestNews.keyword
                      .split(",")
                      .map((k) => k.trim())
                      .map((k) => k.replace(/[^\w\s가-힣]/g, ""))
                      .filter((k) => k.length > 0)
                      .slice(0, 3);
                  }
                }
              } catch (newsError) {
                console.warn(`Error parsing news for ${ticker.ticker}:`, newsError);
              }
            }

            return {
              ticker: ticker.ticker,
              name: ticker.name || ticker.company_name,
              sector: ticker.sector || "기타",
              price: latestStock ? latestStock.close : null,
              change: latestStock ? latestStock.change_rate : null,
              date: latestStock ? latestStock.date : null,
              keywords: keywords,
              trend: latestStock && latestStock.change_rate >= 0 ? "up" : "down",
            };
          } catch (error) {
            console.warn(`Error fetching data for ${ticker.ticker}:`, error);
            return {
              ticker: ticker.ticker,
              name: ticker.name || ticker.company_name,
              sector: ticker.sector || "기타",
              price: null,
              change: null,
              date: null,
              keywords: [],
              trend: "down",
            };
          }
        });

        const batchResults = await Promise.all(stockPromises);
        newStocks = [...newStocks, ...batchResults];
      }
      
      // 기존 데이터와 새 데이터 합치기
      const updatedStocks = [...stocks, ...newStocks];
      
      // 정렬
      const sortedStocks = updatedStocks.sort((a, b) => {
        if (a.price && !b.price) return -1;
        if (!a.price && b.price) return 1;
        if (a.price && b.price) return b.price - a.price;
        return a.ticker.localeCompare(b.ticker);
      });
      
      setStocks(sortedStocks);
      setHasMore(updatedStocks.length < allTickers.length);
      
      console.log(`✅ 추가 로딩 완료: ${newStocks.length}개 (총 ${updatedStocks.length}/${allTickers.length})`);
    } catch (error) {
      console.error('Error loading more stocks:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // 검색 필터링
  const filteredStocks = stocks.filter(
    (stock) =>
      search === "" ||
      (stock.name && stock.name.toLowerCase().includes(search.toLowerCase())) ||
      (stock.ticker && stock.ticker.includes(search.toUpperCase())) ||
      (stock.sector &&
        stock.sector.toLowerCase().includes(search.toLowerCase()))
  );

  const displayedStocks = showAll
    ? filteredStocks
    : filteredStocks.slice(0, 12);

  // 로딩 상태
  if (loading) {
    return (
      <div className="mt-12">
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg border p-8 relative overflow-hidden">
          {/* 배경 애니메이션 */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400 rounded-full animate-pulse"></div>
            <div className="absolute top-32 right-20 w-16 h-16 bg-purple-400 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-20 left-32 w-12 h-12 bg-green-400 rounded-full animate-pulse delay-700"></div>
            <div className="absolute bottom-32 right-10 w-14 h-14 bg-yellow-400 rounded-full animate-pulse delay-500"></div>
          </div>

          {/* 메인 로딩 컨텐츠 */}
          <div className="relative z-10">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 animate-spin">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                📊 시장 데이터 분석 중...
              </h2>
              <p className="text-gray-600">
                실시간 종목 정보와 키워드를 수집하고 있습니다
              </p>
            </div>

            {/* 진행 단계 표시 */}
            <div className="mb-8">
              <div className="flex justify-center space-x-8 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">종목 목록</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                  <span className="text-sm text-gray-700">주가 데이터</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-700"></div>
                  <span className="text-sm text-gray-700">뉴스 키워드</span>
                </div>
              </div>
              
              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{width: `${loadingProgress}%`}}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600 mb-4">
                {Math.round(loadingProgress)}% 완료
              </div>
            </div>

            {/* 스켈레톤 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="p-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur-sm hover:shadow-md transition-all duration-300"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className="space-y-3">
                    {/* 키워드 영역 */}
                    <div className="flex space-x-2">
                      <div className="h-3 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full w-16 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-purple-200 to-purple-300 rounded-full w-12 animate-pulse delay-200"></div>
                    </div>
                    
                    {/* 종목명 */}
                    <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse delay-300"></div>
                    
                    {/* 가격 */}
                    <div className="h-6 bg-gradient-to-r from-green-200 to-green-300 rounded w-1/2 animate-pulse delay-500"></div>
                    
                    {/* 기타 정보 */}
                    <div className="flex justify-between">
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/4 animate-pulse delay-700"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 animate-pulse delay-900"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 로딩 메시지들 */}
            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600 animate-pulse">
                🔍 {loadingMessage}
              </div>
              <div className="text-xs text-gray-500">
                💡 잠시만 기다려주세요. 더 정확한 데이터를 위해 실시간으로 수집하고 있습니다.
              </div>
              {stocks.length > 0 && (
                <div className="text-xs text-green-600 font-medium">
                  ✅ {stocks.length}개 종목 데이터 준비 완료
                </div>
              )}
            </div>
          </div>

          {/* CSS 애니메이션 */}
          <style jsx>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mt-12">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
          <div className="flex items-center justify-center text-red-500">
            <AlertCircle className="w-8 h-8 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">
                종목 데이터를 불러올 수 없습니다
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                서버 연결을 확인해주세요: {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 없음 상태
  if (filteredStocks.length === 0) {
    return (
      <div className="mt-12">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center text-gray-500">
            <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">종목이 없습니다</h3>
            <p className="text-sm">
              {search
                ? `"${search}"에 대한 검색 결과가 없습니다`
                : "종목 데이터가 없습니다"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PieChart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">전체 종목</h2>
                <p className="text-sm text-gray-600">
                  실시간 종목 현황 및 키워드 분석
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                총 {filteredStocks.length.toLocaleString()}개 종목
                {allTickers.length > 0 && (
                  <span className="text-gray-400 ml-1">
                    / {allTickers.length.toLocaleString()}개 전체
                  </span>
                )}
              </div>
              {filteredStocks.length > 12 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {showAll ? "접기" : "전체 보기"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedStocks.map((stock, index) => (
              <div
                key={stock.ticker}
                className="group relative p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 cursor-pointer"
                onClick={() => setSelectedStock(stock)}
              >
                {/* 키워드 분석 버튼 */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setKeywordAnalysisStock(stock);
                      setShowKeywordAnalysis(true);
                    }}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                    title="키워드 분석"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div
                      className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                        stock.trend === "up" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <div className="flex flex-wrap gap-1 min-h-[20px]">
                      {stock.keywords && stock.keywords.length > 0 ? (
                        stock.keywords.map((keyword, keywordIndex) => (
                          <span
                            key={keywordIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium whitespace-nowrap"
                          >
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          키워드 없음
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`p-1 rounded flex-shrink-0 ${
                      (stock.change || 0) >= 0 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {(stock.change || 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {stock.name || `종목 ${stock.ticker}`}
                    </h3>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {stock.sector}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-900">
                        {stock.price !== null
                          ? `${stock.price.toLocaleString()}원`
                          : "데이터 없음"}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          (stock.change || 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stock.change !== null
                          ? `${(stock.change || 0) >= 0 ? "+" : ""}${(
                              stock.change || 0
                            ).toFixed(2)}%`
                          : "-"}
                      </div>
                    </div>
                    {stock.date && (
                      <div className="text-right text-xs text-gray-400">
                        {stock.date}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!showAll && filteredStocks.length > 12 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAll(true)}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                {filteredStocks.length - 12}개 더 보기
              </button>
            </div>
          )}
          
          {/* 더 많은 종목 로딩 버튼 */}
          {hasMore && !loading && (
            <div className="mt-6 text-center">
              <button
                onClick={loadMoreStocks}
                disabled={loadingMore}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    추가 로딩 중...
                  </>
                ) : (
                  <>
                    📈 더 많은 종목 보기
                    <span className="text-sm opacity-80">
                      (+30개)
                    </span>
                  </>
                )}
              </button>
              <div className="text-sm text-gray-500 mt-2">
                {stocks.length}/{allTickers.length} 종목 로딩됨
              </div>
            </div>
          )}
        </div>

        {/* 선택된 종목 상세 패널 */}
        {selectedStock && (
          <StockDetailPanel
            ticker={selectedStock.ticker}
            name={selectedStock.name}
            onClose={() => setSelectedStock(null)}
          />
        )}

        {/* 키워드 분석 모달 */}
        {showKeywordAnalysis && keywordAnalysisStock && (
          <StockKeywordAnalysis
            selectedStock={keywordAnalysisStock}
            onClose={() => {
              setShowKeywordAnalysis(false);
              setKeywordAnalysisStock(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default KOSPI200Grid;
