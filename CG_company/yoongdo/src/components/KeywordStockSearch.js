import React, { useState } from "react";

const KeywordStockSearch = ({ onSearch }) => {
  const [ticker, setTicker] = useState("");
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticker && keyword) {
      onSearch(ticker.trim(), keyword.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-center">
      <input
        type="text"
        placeholder="종목 티커 (예: 005930)"
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-32"
      />
      <input
        type="text"
        placeholder="키워드 (예: AI, 반도체)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-40"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600"
      >
        검색
      </button>
    </form>
  );
};

export default KeywordStockSearch;
