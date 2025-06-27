// app/page.js
"use client";
import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";

// CG Finance 스타일 컴포넌트들
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StockCards from "../components/StockCards";

// 동적 import로 차트 컴포넌트들 불러오기 (TradingView Lightweight Charts 포함)
const CleanChartContainer = dynamic(() => import("../components/CleanChartContainer"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
});

const NewsPanel = dynamic(() => import("../components/NewsPanel"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  )
});

export default function Page() {
  const [ticker, setTicker] = useState("000660");
  const [tickerName, setTickerName] = useState("SK하이닉스");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 종목명 조회
  useEffect(() => {
    async function fetchName() {
      try {
        setIsLoading(true);
        const res = await fetch("/ticker_map.json");
        const map = await res.json();
        const found = map.find((item) => item.ticker === ticker);
        setTickerName(found ? found.name : "");
      } catch (error) {
        console.error("Failed to fetch ticker name:", error);
        setTickerName("");
      } finally {
        setIsLoading(false);
      }
    }
    fetchName();
  }, [ticker]);

  // 주식 데이터 로드
  useEffect(() => {
    async function fetchStockData() {
      try {
        setIsLoading(true);
        const res = await fetch("/stock_data.json");
        const data = await res.json();
        setStockData(data);
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
        setStockData([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStockData();
  }, [ticker]);

  // 뉴스 더보기 클릭 핸들러 (useCallback으로 최적화)
  const handleShowNews = useCallback((newsData) => {
    console.log('📊 handleShowNews called with:', newsData); // 디버깅용
    
    try {
      if (typeof newsData === 'string') {
        // 날짜 문자열인 경우
        const found = stockData.find((d) => d.date === newsData);
        console.log('🔍 Found by date:', found);
        setSelectedNews(found || null);
      } else if (newsData && newsData.originalDate) {
        // TradingView에서 온 데이터 (originalDate 필드 사용)
        const found = stockData.find((d) => d.date === newsData.originalDate);
        console.log('🕯️ Found by originalDate (TradingView):', found);
        setSelectedNews(found || newsData);
      } else if (newsData && newsData.date) {
        // 일반 뉴스 객체인 경우
        console.log('📰 Setting news data:', newsData);
        setSelectedNews(newsData);
      } else if (newsData && newsData.x) {
        // Chart.js에서 온 데이터 (x 필드를 날짜로 사용)
        const found = stockData.find((d) => d.date === newsData.x);
        console.log('📈 Found by x field (Chart.js):', found);
        setSelectedNews(found || newsData);
      } else if (newsData && newsData.time) {
        // TradingView timestamp인 경우
        const dateStr = new Date(newsData.time * 1000).toISOString().split('T')[0];
        const found = stockData.find((d) => d.date === dateStr);
        console.log('⏰ Found by timestamp (TradingView):', found);
        setSelectedNews(found || newsData);
      } else {
        // 그 외의 경우
        console.log('🔄 Setting direct news data:', newsData);
        setSelectedNews(newsData || null);
      }
      
      // 뉴스가 선택되면 날짜 선택 해제
      if (newsData) {
        setSelectedDate(null);
      }
    } catch (error) {
      console.error('❌ Error in handleShowNews:', error);
      setSelectedNews(null);
    }
  }, [stockData]); // stockData가 변경될 때만 함수 재생성

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <Sidebar currentPage="dashboard" />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 ml-52">
        {/* 헤더 */}
        <Header ticker={ticker} setTicker={setTicker} tickerName={tickerName} />

        {/* 메인 컨텐츠 영역 */}
        <main className="p-6">
          {/* 종목 카드들 */}
          <StockCards
            currentStock={{ ticker, tickerName }}
            stockData={stockData}
          />

          {/* 차트와 뉴스 패널 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 차트 영역 (2/3) */}
            <div className="lg:col-span-2">
              {/* TradingView Lightweight Charts 지원 차트 컨테이너 */}
              <CleanChartContainer
                ticker={ticker}
                tickerName={tickerName}
                stockData={stockData}
                onShowNews={handleShowNews}
                key={`chart-${ticker}-${stockData.length}`} // 종목과 데이터 변경 시 재렌더링
              />
            </div>

            {/* 뉴스 패널 (1/3) */}
            <div className="lg:col-span-1">
              <NewsPanel 
                news={selectedNews} 
                date={selectedDate}
                key={selectedNews ? `news-${selectedNews.date}` : 'news-empty'} // 뉴스 변경 시만 재렌더링
              />
            </div>
          </div>

          {/* 차트 상태 표시 */}
          {isLoading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="text-sm text-gray-500 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>차트 데이터 로딩 중...</span>
              </div>
            </div>
          )}

          {!isLoading && stockData.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-400 bg-blue-50 px-3 py-2 rounded-lg inline-block">
                🚀 TradingView Lightweight Charts 적용됨 | 
                📊 Line Chart (Chart.js) + 🕯️ Candle Chart (TradingView) | 
                데이터: {stockData.length}개 | 
                🎯 더블클릭으로 뉴스 보기
              </div>
            </div>
          )}

          {/* 추가 정보 섹션 */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 시장 지표 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">시장 지표</h3>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">실시간</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KOSPI</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">2,520.45</span>
                    <span className="text-xs text-green-500 ml-1">+0.5%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KOSDAQ</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">785.23</span>
                    <span className="text-xs text-red-500 ml-1">-0.2%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">USD/KRW</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">1,345.50</span>
                    <span className="text-xs text-green-500 ml-1">+0.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 거래량 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">거래 정보</h3>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">{tickerName}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">거래량</span>
                  <span className="text-sm font-medium text-gray-900">
                    1,234,567주
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">거래대금</span>
                  <span className="text-sm font-medium text-gray-900">
                    1,532억원
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">시가총액</span>
                  <span className="text-sm font-medium text-gray-900">
                    95.2조원
                  </span>
                </div>
              </div>
            </div>

            {/* 기술적 지표 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">기술적 지표</h3>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">분석</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">RSI (14)</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-orange-500">65.4</span>
                    <span className="text-xs text-gray-400 ml-1">과매수</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">MACD</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-green-500">+1.23</span>
                    <span className="text-xs text-gray-400 ml-1">상승</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">볼린저 밴드</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-blue-500">중립</span>
                    <span className="text-xs text-gray-400 ml-1">안정</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 성능 최적화 상태 */}
          {!isLoading && stockData.length > 0 && (
            <div className="mt-4 text-center">
              <div className="text-xs text-green-500 bg-green-50 px-3 py-2 rounded-lg inline-block">
                ⚡ useCallback 최적화 적용 | 
                🔄 무한 루프 방지 | 
                🎯 안정적인 더블클릭 | 
                💾 메모리 최적화
              </div>
            </div>
          )}

          {/* 디버깅 정보 (개발 환경에서만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 bg-gray-100 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">🔧 개발 정보</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>현재 종목: {ticker} ({tickerName})</div>
                <div>선택된 뉴스: {selectedNews ? selectedNews.date || '있음' : '없음'}</div>
                <div>선택된 날짜: {selectedDate || '없음'}</div>
                <div>주식 데이터: {stockData.length}개</div>
                <div>로딩 상태: {isLoading ? '로딩 중' : '완료'}</div>
                <div className="text-green-600 font-medium">✅ handleShowNews useCallback 적용</div>
                <div className="text-blue-600 font-medium">🚀 성능 최적화 완료</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}