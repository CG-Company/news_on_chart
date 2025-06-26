import React from "react";

const NewsTooltip = ({ data, companyNews, macroNews, onShowNews, date }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-64">
      {data && (
        <>
          <div className="text-sm font-semibold text-gray-900 mb-2">
            {data[0]?.raw?.y?.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 mb-4">{date}</div>
        </>
      )}
      <div className="mb-4">
        <b className="text-xs font-semibold text-tossBlue">[기업 뉴스]</b>
        {companyNews.length > 0 ? (
          <ul className="list-disc ml-4 text-xs text-gray-700">
            {companyNews.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-gray-500">기업 뉴스 없음</div>
        )}
      </div>
      <div className="mb-4">
        <b className="text-xs font-semibold text-tossBlue">[거시 뉴스]</b>
        {macroNews.length > 0 ? (
          <ul className="list-disc ml-4 text-xs text-gray-700">
            {macroNews.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-gray-500">거시 뉴스 없음</div>
        )}
      </div>
      <button
        onClick={() => onShowNews && onShowNews(date)}
        className="w-full px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold border border-blue-700 hover:bg-blue-800 transition-colors"
      >
        뉴스 더보기
      </button>
    </div>
  );
};

export default NewsTooltip;
