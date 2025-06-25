import React from "react";
import SearchBar from "./SearchBar";

const FinanceHeader = ({ ticker, setTicker, tickerName, setTickerName }) => {
  return (
    <header className="bg-white shadow-sm px-4 sm:px-6 py-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <div className="mr-4 transform transition-transform hover:scale-110 cursor-pointer">
          <svg
            width="28"
            height="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="4" y1="7" x2="24" y2="7" />
            <line x1="4" y1="14" x2="24" y2="14" />
            <line x1="4" y1="21" x2="24" y2="21" />
          </svg>
        </div>
        <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-gray-900 mr-auto">
          CG finance
        </span>
        <div className="w-full sm:w-96">
          <SearchBar ticker={ticker} setTicker={setTicker} setTickerName={setTickerName} />
        </div>
      </div>
      <div className="h-1 w-full bg-gradient-to-r from-tossBlue to-blue-400 mt-4 rounded" />
    </header>
  );
};

export default FinanceHeader;
