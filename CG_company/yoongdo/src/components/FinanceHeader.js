import React from "react";
import SearchBar from "./SearchBar";

const FinanceHeader = ({ ticker, setTicker }) => {
  return (
    <header className="bg-[#D9D9D9] px-0 py-6">
      <div className="max-w-6xl mx-auto flex items-center">
        {/* 햄버거 아이콘 */}
        <div className="mr-4">
          <svg width="28" height="28" fill="none" stroke="#333" strokeWidth="2">
            <line x1="4" y1="7" x2="24" y2="7" />
            <line x1="4" y1="14" x2="24" y2="14" />
            <line x1="4" y1="21" x2="24" y2="21" />
          </svg>
        </div>
        {/* 타이틀 */}
        <span className="font-extrabold text-3xl tracking-tight mr-auto">CG finance</span>
        {/* SearchBar */}
        <div className="ml-4">
          <SearchBar ticker={ticker} setTicker={setTicker} />
        </div>
      </div>
      {/* 파란 구분선 */}
      <div className="h-1 w-full bg-[#2196F3] mt-4" />
    </header>
  );
};

export default FinanceHeader; 