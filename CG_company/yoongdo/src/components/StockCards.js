// components/StockCards.js
import React, { useRef } from "react";

const StockCards = ({ sectorStocks = [], selectedTicker, onSelectStock }) => {
  const scrollRef = useRef(null);

  // 부드러운 스크롤 함수
  const scroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = 260; // 카드 너비
      const gap = 12; // gap-3 = 12px
      const scrollAmount = cardWidth + gap; // 카드 한 개 너비 + 여백
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const MiniChart = ({ trend }) => (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
      <path
        d="M2 20 L15 12 L30 8 L45 15 L58 4"
        stroke={trend === "up" ? "#22c55e" : "#ef4444"}
        strokeWidth="2"
        fill="none"
      />
      {trend === "up" && (
        <defs>
          <linearGradient id="upGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {trend === "up" && (
        <path
          d="M2 20 L15 12 L30 8 L45 15 L58 4 L58 20 L2 20 Z"
          fill="url(#upGradient)"
        />
      )}
    </svg>
  );

  return (
    <div className="mb-6 w-full min-w-0">
      <div className="text-sm font-medium text-gray-700 mb-3 px-1">
        검색 결과 ({sectorStocks ? sectorStocks.length : 0}개)
      </div>

      {/* 완전 고정된 컨테이너 */}
      <div className="relative w-full h-32 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 왼쪽 화살표 버튼 */}
        <button
          className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full shadow-lg p-2 transition-all duration-200 hover:shadow-xl border border-gray-200"
          onClick={() => scroll("left")}
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* 오른쪽 화살표 버튼 */}
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 hover:bg-white rounded-full shadow-lg p-2 transition-all duration-200 hover:shadow-xl border border-gray-200"
          onClick={() => scroll("right")}
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        {/* 스크롤 컨테이너 - 절대 외부로 넘지 않음 */}
        <div
          ref={scrollRef}
          className="absolute inset-0 flex gap-3 overflow-x-auto py-4 px-12 scroll-smooth"
          style={{
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
            scrollSnapType: "x mandatory",
          }}
        >
          {sectorStocks &&
            sectorStocks.map((stock) => (
              <div
                key={stock.ticker}
                className={`flex-shrink-0 bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer ${
                  selectedTicker === stock.ticker
                    ? "ring-2 ring-blue-400 shadow-lg"
                    : ""
                }`}
                onClick={() => onSelectStock && onSelectStock(stock.ticker)}
                style={{
                  width: "260px", // 고정 너비
                  scrollSnapAlign: "start",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  {/* 좌측: 로고 + 정보 */}
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">{stock.logo || "📈"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 font-medium truncate">
                        {stock.ticker}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {stock.name}
                      </div>
                    </div>
                  </div>

                  {/* 우측: 미니 차트 */}
                  <div className="flex-shrink-0 ml-2">
                    <MiniChart
                      trend={
                        stock.trend ||
                        (stock.change_rate && stock.change_rate > 0
                          ? "up"
                          : "down")
                      }
                    />
                  </div>
                </div>

                {/* 하단: 가격 정보 */}
                <div className="flex items-center justify-between">
                  <div className="text-base font-bold text-gray-900">
                    {stock.price !== null
                      ? stock.price.toLocaleString()
                      : "-"}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      stock.change_rate > 0
                        ? "text-green-500"
                        : stock.change_rate < 0
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {stock.change_rate > 0 ? "+" : ""}
                    {stock.change_rate !== null
                      ? stock.change_rate.toFixed(2) + "%"
                      : "-"}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* 스크롤 힌트 그라데이션 */}
        {sectorStocks && sectorStocks.length > 2 && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white via-white/50 to-transparent pointer-events-none z-20" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none z-20" />
          </>
        )}
      </div>

      {/* CSS로 스크롤바 숨김 */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StockCards;
