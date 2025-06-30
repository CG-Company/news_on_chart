// components/NewsTooltip.js (더블클릭 지원 버전)
import React from "react";

const NewsTooltip = ({ data, companyNews, macroNews, onShowNews, date }) => {
  // 더블클릭 핸들러
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    console.log('🎯 NewsTooltip에서 더블클릭 감지!', { date, companyNews, macroNews });
    if (onShowNews) {
      onShowNews();
    }
  };

  // 뉴스 항목 렌더링 함수
  const renderNewsItem = (news, index) => {
    // news가 문자열인 경우와 객체인 경우를 모두 처리
    const title = typeof news === 'string' ? news : news.title || news.content || '';
    const url = typeof news === 'object' ? news.url : null;
    
    const displayText = title.length > 60 ? `${title.substring(0, 60)}...` : title;
    
    if (url) {
      return (
        <div key={index} className="text-xs text-gray-600 leading-relaxed">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 hover:underline transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            • {displayText}
          </a>
        </div>
      );
    } else {
      return (
        <div key={index} className="text-xs text-gray-600 leading-relaxed">
          • {displayText}
        </div>
      );
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 max-w-sm cursor-pointer hover:shadow-2xl transition-shadow duration-200"
      onDoubleClick={handleDoubleClick}
      title="더블클릭하여 전체 뉴스 보기"
    >
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
            {companyNews && companyNews.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                {companyNews.length}
              </span>
            )}
          </div>
          {companyNews && companyNews.length > 0 ? (
            <div className="space-y-1">
              {companyNews.slice(0, 2).map((news, i) => renderNewsItem(news, i))}
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
            {macroNews && macroNews.length > 0 && (
              <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                {macroNews.length}
              </span>
            )}
          </div>
          {macroNews && macroNews.length > 0 ? (
            <div className="space-y-1">
              {macroNews.slice(0, 2).map((news, i) => renderNewsItem(news, i))}
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

      {/* 더블클릭 안내 */}
      {(companyNews?.length > 0 || macroNews?.length > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
            </svg>
            <span className="font-medium">더블클릭하여 전체 뉴스 보기</span>
            <div className="animate-pulse">
              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* 툴팁 화살표 */}
      <div className="absolute -bottom-1 left-4 w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
    </div>
  );
};

export default NewsTooltip;