import React, { useState } from "react";

const SearchBar = ({ ticker, setTicker }) => {
  const [input, setInput] = useState(ticker);

  const handleSearch = () => {
    if (input.trim()) setTicker(input.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <div className="flex items-center bg-white rounded-xl shadow px-4 py-2 min-w-[320px] max-w-[400px] h-12">
      <input
        className="flex-1 outline-none text-base bg-transparent placeholder-gray-400"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="티커(종목코드) 입력 (예: 000660)"
      />
      {input && (
        <button
          className="ml-2"
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
        className="ml-3 px-3 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600 text-sm font-medium"
        onClick={handleSearch}
      >
        검색
      </button>
    </div>
  );
};

export default SearchBar;
