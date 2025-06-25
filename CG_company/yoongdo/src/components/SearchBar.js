import React, { useState } from "react";

const SearchBar = ({ ticker, setTicker, setTickerName }) => {
  const [input, setInput] = useState(ticker);

  const handleSearch = async () => {
    if (!input.trim()) return;
    // 숫자만 입력된 경우(티커)
    if (/^\d+$/.test(input.trim())) {
      try {
        const res = await fetch("/ticker_map.json");
        const map = await res.json();
        const found = map.find(item => item.ticker === input.trim());
        if (found) {
          setTicker(found.ticker);
          setTickerName(found.name);
        } else {
          setTicker(input.trim());
          setTickerName("");
        }
      } catch {
        setTicker(input.trim());
        setTickerName("");
      }
      return;
    }
    // 종목명 검색
    try {
      const res = await fetch("/ticker_map.json");
      const map = await res.json();
      const found = map.find(item => item.name === input.trim());
      if (found) {
        setTicker(found.ticker);
        setTickerName(found.name);
      } else {
        alert("해당 종목명을 찾을 수 없습니다.");
      }
    } catch (e) {
      alert("종목명 검색 중 오류 발생");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <div className="flex items-center bg-[#f5f6f5] rounded-lg py-2 px-3 min-w-[320px] max-w-[400px] h-[40px] shadow-inner">
      <input
        className="flex-1 outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400 font-sans"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="티커(종목코드) 또는 종목명 입력 (예: 000660, 삼성전자)"
      />
      {input && (
        <button
          className="ml-2 flex items-center"
          onClick={handleClear}
          tabIndex={-1}
          type="button"
        >
          <svg
            className="w-4 h-4 text-gray-400"
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
      <button
        className="ml-3 px-3 py-1 rounded-md bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-medium"
        onClick={handleSearch}
      >
        검색
      </button>
    </div>
  );
};

export default SearchBar;
