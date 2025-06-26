// components/SearchBar.js (업데이트됨)
import React, { useState, useEffect } from "react";
import { fetchTickerMap } from "../utils/api";

const SearchBar = ({ ticker, setTicker }) => {
  const [input, setInput] = useState(ticker);
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState({});

  useEffect(() => {
    fetchTickerMap().then(setMap);
  }, []);

  const handleSearch = async () => {
    if (!input.trim()) return;

    setIsLoading(true);

    try {
      // 숫자만 입력된 경우(티커)
      if (/^\d+$/.test(input.trim())) {
        setTicker(input.trim());
        setIsLoading(false);
        return;
      }

      // 종목명 검색
      const found = map.find((item) => item.name === input.trim());

      if (found) {
        setTicker(found.ticker);
      } else {
        alert("해당 종목명을 찾을 수 없습니다.");
      }
    } catch (e) {
      alert("종목명 검색 중 오류 발생");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <div className="relative max-w-md mx-auto">
      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
        {/* 검색 아이콘 */}
        <div className="pl-3">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 입력 필드 */}
        <input
          className="flex-1 outline-none bg-transparent py-2.5 px-3 text-sm text-gray-900 placeholder-gray-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="종목명 또는 코드 검색 (예: 삼성전자, 005930)"
          disabled={isLoading}
        />

        {/* 클리어 버튼 */}
        {input && !isLoading && (
          <button
            className="p-1 mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={handleClear}
            type="button"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* 로딩 스피너 */}
        {isLoading && (
          <div className="p-2 mr-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* 검색 버튼 */}
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSearch}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? "검색중..." : "검색"}
        </button>
      </div>

      {/* 최근 검색어 또는 인기 종목 드롭다운 (옵션) */}
      {false && ( // 필요시 true로 변경
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-2">
            <div className="text-xs text-gray-500 font-medium px-2 py-1">
              인기 종목
            </div>
            {["삼성전자", "SK하이닉스", "NAVER", "Kakao"].map((stock) => (
              <button
                key={stock}
                className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded"
                onClick={() => {
                  setInput(stock);
                  handleSearch();
                }}
              >
                {stock}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
