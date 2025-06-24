import React from "react";

const NewsPanel = ({ date, news }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
      <h3 className="text-lg font-bold mb-2">뉴스 상세</h3>
      {date ? (
        <>
          <div className="mb-2 text-gray-600">날짜: {date}</div>
          <div className="mb-3">
            <b className="text-indigo-600">[기업 뉴스]</b>
            {news.companyNews && news.companyNews.length > 0 ? (
              <ul className="list-disc ml-5 mt-1">
                {news.companyNews.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            ) : (
              <div className="text-gray-400">해당일 기업 뉴스 없음</div>
            )}
          </div>
          <div>
            <b className="text-indigo-600">[거시 뉴스]</b>
            {news.macroNews && news.macroNews.length > 0 ? (
              <ul className="list-disc ml-5 mt-1">
                {news.macroNews.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            ) : (
              <div className="text-gray-400">해당일 거시 뉴스 없음</div>
            )}
          </div>
        </>
      ) : (
        <div className="text-gray-400">오른쪽에서 날짜를 선택하거나, 차트에서 '뉴스 더보기'를 클릭하세요.</div>
      )}
    </div>
  );
};

export default NewsPanel; 