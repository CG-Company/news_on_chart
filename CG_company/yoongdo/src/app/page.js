// app/page.js (업데이트됨)
"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// CG Finance 스타일 컴포넌트들
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StockCards from "../components/StockCards";

// 동적 import로 차트 컴포넌트들 불러오기
const ChartContainer = dynamic(() => import("../components/ChartContainer"), {
  ssr: false,
});
const NewsPanel = dynamic(() => import("../components/NewsPanel"), {
  ssr: false,
});

export default function Page() {
  const [ticker, setTicker] = useState("000660");
  const [tickerName, setTickerName] = useState("SK하이닉스");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  // 종목명 조회
  useEffect(() => {
    async function fetchName() {
      try {
        const res = await fetch("/ticker_map.json");
        const map = await res.json();
        const found = map.find((item) => item.ticker === ticker);
        setTickerName(found ? found.name : "");
      } catch {
        setTickerName("");
      }
    }
    fetchName();
  }, [ticker]);

  // 뉴스 더보기 클릭 핸들러
  const handleShowNews = (newsData) => {
    setSelectedNews(newsData || null);
    setSelectedDate(null);
  };

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
          <StockCards currentStock={{ ticker, tickerName }} />

          {/* 차트와 뉴스 패널 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 차트 영역 (2/3) */}
            <div className="lg:col-span-2">
              <ChartContainer
                ticker={ticker}
                tickerName={tickerName}
                onShowNews={handleShowNews}
              />
            </div>

            {/* 뉴스 패널 (1/3) */}
            <div className="lg:col-span-1">
              <NewsPanel news={selectedNews} date={selectedDate} />
            </div>
          </div>

          {/* 추가 정보 섹션 (옵션) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 시장 지표 카드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                시장 지표
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KOSPI</span>
                  <span className="text-sm font-medium text-gray-900">
                    2,520.45
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">KOSDAQ</span>
                  <span className="text-sm font-medium text-gray-900">
                    785.23
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">USD/KRW</span>
                  <span className="text-sm font-medium text-gray-900">
                    1,345.50
                  </span>
                </div>
              </div>
            </div>

            {/* 거래량 정보 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                거래 정보
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">거래량</span>
                  <span className="text-sm font-medium text-gray-900">
                    1,234,567
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                기술적 지표
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">RSI (14)</span>
                  <span className="text-sm font-medium text-orange-500">
                    65.4
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">MACD</span>
                  <span className="text-sm font-medium text-green-500">
                    +1.23
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">볼린저 밴드</span>
                  <span className="text-sm font-medium text-blue-500">
                    중립
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
