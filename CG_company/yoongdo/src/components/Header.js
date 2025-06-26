// components/Header.js
import React from "react";
import SearchBar from "./SearchBar";

const Header = ({ ticker, setTicker, tickerName }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 ml-52">
      <div className="flex items-center justify-between">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Stock Analysis
          </h1>
        </div>

        {/* 중앙 검색바 */}
        <div className="flex-1 max-w-lg mx-8">
          <SearchBar ticker={ticker} setTicker={setTicker} />
        </div>

        {/* 우측 아이콘들 */}
        <div className="flex items-center space-x-4">
          {/* 알림 아이콘 */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5.5-5.5V9a6.5 6.5 0 00-13 0v2.5L7 17h5m3 0v1a3 3 0 11-6 0v-1"
              />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* 사용자 프로필 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <span className="text-sm font-medium text-gray-700">User</span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
