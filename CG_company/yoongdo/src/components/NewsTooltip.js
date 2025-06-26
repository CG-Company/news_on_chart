// components/NewsTooltip.js (업데이트됨)
import React from "react";

const NewsTooltip = ({ data, companyNews, macroNews, onShowNews, date }) => {
  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 max-w-sm">
      {/* 가격 정보 */}
      {data && data[0] && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gray-900">
              {data[0]?.raw?.y?.toLocaleString()}원
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
              {date}
            </div>
          </div>
          <div className="text-xs text-green-600 font-medium mt-1">
            +2.1% (+2,600원) {/* 실제 변동률로 교체 필요 */}
          </div>
        </div>
      )}

      {/* 뉴스 섹션 */}
      <div className="space-y-3">
        {/* 기업 뉴스 */}
        <div>
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              기업 뉴스
            </span>
          </div>
          {companyNews && companyNews.length > 0 ? (
            <div className="space-y-1">
              {companyNews.slice(0, 2).map((news, i) => (
                <div key={i} className="text-xs text-gray-600 leading-relaxed">
                  • {news.length > 60 ? `${news.substring(0, 60)}...` : news}
                </div>
              ))}
              {companyNews.length > 2 && (
                <div className="text-xs text-blue-600 font-medium">
                  +{companyNews.length - 2}개 더
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">뉴스 없음</div>
          )}
        </div>

        {/* 거시 뉴스 */}
        <div>
          <div className="flex items-center mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              거시경제
            </span>
          </div>
          {macroNews && macroNews.length > 0 ? (
            <div className="space-y-1">
              {macroNews.slice(0, 2).map((news, i) => (
                <div key={i} className="text-xs text-gray-600 leading-relaxed">
                  • {news.length > 60 ? `${news.substring(0, 60)}...` : news}
                </div>
              ))}
              {macroNews.length > 2 && (
                <div className="text-xs text-blue-600 font-medium">
                  +{macroNews.length - 2}개 더
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">뉴스 없음</div>
          )}
        </div>
      </div>

      {/* 더보기 버튼 */}
      {(companyNews?.length > 0 || macroNews?.length > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onShowNews && onShowNews(date)}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors flex items-center justify-center space-x-1"
          >
            <span>전체 뉴스 보기</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-400">
              또는 차트를 더블클릭하세요
            </span>
          </div>
        </div>
      )}

      {/* 툴팁 화살표 */}
      <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
    </div>
  );
};

export default NewsTooltip;