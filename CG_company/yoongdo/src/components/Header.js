// components/Header.js
import React from "react";
import SearchBar from "./SearchBar";
import { Bell, Mail, User } from "lucide-react";

const Header = ({ ticker, setTicker, tickerName, setTickerName }) => {
  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 relative z-50">
      <div className="flex items-center justify-between">
        {/* 검색창 */}
        <div className="flex-1 max-w-md">
          <SearchBar
            ticker={ticker}
            setTicker={setTicker}
            setTickerName={setTickerName}
          />
        </div>

        {/* 우측 아이콘들 */}
        <div className="flex items-center space-x-4">
          {/* 메일 아이콘 */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Mail className="w-5 h-5 text-gray-600" />
          </button>

          {/* 알림 아이콘 */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* 구분선 */}
          <div className="w-px h-6 bg-gray-200"></div>

          {/* 프로필 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-gray-900">Aurobindo Gill</div>
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
