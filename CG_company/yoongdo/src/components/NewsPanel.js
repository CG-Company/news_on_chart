import React from "react";

const NewsPanel = ({ date, news }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-3">뉴스 상세</h3>
      {(date || news?.x) ? (
        <>
          <div className="text-sm text-gray-600 mb-3">날짜: {date || news?.x || news?.date}</div>
          <div className="mb-4">
            <b className="text-sm font-semibold text-tossBlue">[기업 뉴스]</b>
            {news && news.companyNews && news.companyNews.length > 0 ? (
              <ul className="list-disc ml-5 mt-1">
                {news.companyNews.map((n, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 hover:text-tossBlue transition-colors"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 mt-1">
                해당일 기업 뉴스 없음
              </div>
            )}
          </div>
          <div>
            <b className="text-sm font-semibold text-tossBlue">[거시 뉴스]</b>
            {news && news.macroNews && news.macroNews.length > 0 ? (
              <ul className="list-disc ml-5 mt-1">
                {news.macroNews.map((n, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-700 hover:text-tossBlue transition-colors"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 mt-1">
                해당일 거시 뉴스 없음
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500 text-center mt-4">
          오른쪽에서 날짜를 선택하거나, 차트에서 &apos;뉴스 더보기&apos;를 클릭하세요.
        </div>
      )}
    </div>
  );
};

export default NewsPanel;
