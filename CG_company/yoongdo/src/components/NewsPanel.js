// components/NewsPanel.js (업데이트됨)
import React from "react";

const NewsPanel = ({ date, news, loading }) => {
  // 뉴스 아이템 컴포넌트
  const NewsItem = ({ title, source, time, summary, sentiment, url }) => (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0">
      <div className="flex items-start space-x-3">
        {/* 뉴스 아이콘 */}
        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg
            className="w-4 h-4 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        {/* 뉴스 내용 */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-5">
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer">
                {title}
              </a>
            ) : (
              title
            )}
          </h4>
          <div className="flex items-center space-x-2 mt-1">
            {source && <span className="text-xs text-gray-500">{source}</span>}
            {time && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{time}</span>
              </>
            )}
            {sentiment && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    sentiment === "positive"
                      ? "bg-green-100 text-green-600"
                      : sentiment === "negative"
                      ? "bg-red-100 text-red-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {sentiment === "positive"
                    ? "긍정"
                    : sentiment === "negative"
                    ? "부정"
                    : "중립"}
                </span>
              </>
            )}
          </div>
          {summary && (
            <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-4">
              {summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  // 로딩 스켈레톤
  const LoadingSkeleton = () => (
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    </div>
  );

  // 뉴스 데이터 파싱
  let newsList = [];
  if (Array.isArray(news)) {
    newsList = news;
  } else if (news && (news.companyNews || news.macroNews)) {
    const allNews = [...(news.companyNews || []), ...(news.macroNews || [])];
    newsList = allNews.map((n) => ({ title: n, source: "Company News" }));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">News</h3>
          {(date || news?.x || news?.date) && (
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              + 더보기
            </button>
          )}
        </div>
        {(date || news?.x || news?.date) && (
          <div className="text-sm text-gray-500 mt-1">
            {date || news?.x || news?.date}
          </div>
        )}
      </div>

      {/* 뉴스 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : newsList.length > 0 ? (
          <div>
            {newsList.map((item, i) => (
              <NewsItem
                key={item.id || i}
                title={item.title}
                source={item.source}
                time={item.published_at || item.date}
                summary={item.summary}
                url={item.url}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
                />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              뉴스 없음
            </h4>
            <p className="text-sm text-gray-500">
              해당 날짜에 관련 뉴스가 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPanel;
