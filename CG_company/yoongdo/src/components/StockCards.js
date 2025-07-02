// components/StockCards.js
import React, { useRef } from "react";

const StockCards = ({ sectorStocks = [], selectedTicker, onSelectStock }) => {
  const scrollRef = useRef(null);

  // 부드러운 스크롤 함수
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320; // 카드 한 개 너비 + 여백
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };
  // 임시 데이터 - 실제 구현시 props나 API에서 가져와야 함
  const stockCards = [
    {
      symbol: "SMSN",
      name: "Samsung",
      price: "71,400",
      change: "+1.10%",
      trend: "up",
      logo: "📱",
    },
    {
      symbol: "SK",
      name: "SK Hynix",
      price: "124,500",
      change: "-0.10%",
      trend: "down",
      logo: "💾",
    },
    {
      symbol: "NAVER",
      name: "NAVER",
      price: "185,000",
      change: "+0.85%",
      trend: "up",
      logo: "🌐",
    },
    {
      symbol: "KAKAO",
      name: "Kakao",
      price: "89,200",
      change: "-0.94%",
      trend: "down",
      logo: "💬",
    },
  ];

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
    <div
      className="mb-6 overflow-x-hidden"
      style={{ maxWidth: "100%", width: "100%" }}
    >
      <div className="text-sm font-medium text-gray-700 mb-3 px-1">
        검색 결과 ({sectorStocks.length}개)
      </div>

      {/* 고정 너비와 높이 컨테이너 - 절대 전체 화면을 넘지 않도록 */}
      <div className="w-full overflow-hidden" style={{ maxWidth: "100%" }}>
        <div
          className="h-32 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
          style={{ maxWidth: "100%" }}
        >
          <div className="relative h-full w-full overflow-hidden">
            {/* 왼쪽 화살표 버튼 */}
            {sectorStocks.length > 3 && (
              <button
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full shadow-md p-1.5 transition-all duration-200 hover:shadow-lg"
                onClick={() => scroll("left")}
              >
                <svg
                  className="w-4 h-4 text-gray-600"
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
            )}

            {/* 가로 스크롤 컨테이너 */}
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto h-full p-4 scrollbar-hide scroll-smooth"
              style={{
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // IE/Edge
                WebkitScrollbar: {
                  display: "none", // Chrome/Safari
                },
                scrollSnapType: "x mandatory",
                maxWidth: "100%",
                width: "100%",
              }}
            >
              {sectorStocks.map((stock) => (
                <div
                  key={stock.ticker}
                  className={`flex-shrink-0 bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer ${
                    selectedTicker === stock.ticker
                      ? "ring-2 ring-blue-400 shadow-lg"
                      : ""
                  }`}
                  onClick={() => onSelectStock && onSelectStock(stock.ticker)}
                  style={{
                    minWidth: "288px", // w-72 = 288px
                    maxWidth: "288px", // 고정 너비 보장
                    scrollSnapAlign: "start",
                    flexShrink: 0,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    {/* 좌측: 로고 + 정보 */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{stock.logo}</span>
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
                      <MiniChart trend={stock.trend} />
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

            {/* 오른쪽 화살표 버튼 */}
            {sectorStocks.length > 3 && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full shadow-md p-1.5 transition-all duration-200 hover:shadow-lg"
                onClick={() => scroll("right")}
              >
                <svg
                  className="w-4 h-4 text-gray-600"
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
            )}

            {/* 스크롤 힌트 (카드가 많을 때만 표시) */}
            {sectorStocks.length > 3 && (
              <>
                {/* 왼쪽 그라데이션 */}
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                {/* 오른쪽 그라데이션 */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCards;
