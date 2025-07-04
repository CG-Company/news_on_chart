import React, { useEffect, useState } from "react";

function KeywordPanel({ ticker }) {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    const url = `http://192.168.1.138:8000/api/latest_keywords?ticker=${ticker}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const arr = data.latest_keywords;
        if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0].keywords)) {
          setKeywords(arr[0].keywords.slice(0, 10)); // 10개만
        } else {
          setKeywords([]);
        }
      })
      .catch(() => setKeywords([]))
      .finally(() => setLoading(false));
  }, [ticker]);

  return (
    <div className="bg-white rounded-xl shadow p-4 w-72 min-h-[200px]">
      {!ticker ? (
        <div className="text-gray-400 text-xs">상단의 종목을 검색해주세요.</div>
      ) : loading ? (
        <div>로딩 중...</div>
      ) : (
        <ol className="space-y-4">
          {keywords.length > 0 ? (
            keywords.map((kw, idx) => (
              <li
                key={idx}
                className="flex items-center border-b last:border-b-0 pt-2 pb-2 last:pb-0"
              >
                <span className="font-bold text-gray-300 mr-2 w-7 text-right text-base leading-none h-6 flex items-center justify-end">{idx + 1}</span>
                <span className="flex-1 text-gray-600 text-base leading-none h-6 flex items-center">{kw}</span>
              </li>
            ))
          ) : (
            <div className="text-gray-400 text-xs">키워드 없음</div>
          )}
        </ol>
      )}
    </div>
  );
}

export default KeywordPanel;
