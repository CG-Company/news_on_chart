// components/StockCards.js
import React from "react";

const StockCards = ({ currentStock, stockData }) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stockCards.map((stock, index) => (
        <div
          key={stock.symbol}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            {/* 좌측: 로고 + 정보 */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg">{stock.logo}</span>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">
                  {stock.symbol}
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  {stock.name}
                </div>
              </div>
            </div>

            {/* 우측: 미니 차트 */}
            <div className="text-right">
              <MiniChart trend={stock.trend} />
            </div>
          </div>

          {/* 하단: 가격 정보 */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-lg font-bold text-gray-900">{stock.price}</div>
            <div
              className={`text-sm font-medium ${
                stock.trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {stock.change}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockCards;
