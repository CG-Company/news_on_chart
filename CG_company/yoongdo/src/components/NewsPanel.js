// components/NewsPanel.js (업데이트됨)
import React, { useState, useMemo, useEffect } from "react";
import { fetchMacroNews } from "../utils/api";

const PAGE_SIZE_COMPANY = 5;
const PAGE_SIZE_MACRO = 4;

const TABS = [
  { key: 'company', label: '기업뉴스' },
  { key: 'macro', label: '거시경제' },
];

const NewsPanel = ({ date, news, loading, mainNews }) => {
  const [activeTab, setActiveTab] = useState('company');
  const [page, setPage] = useState(1);
  const [macroNewsList, setMacroNewsList] = useState([]);
  const [macroLoading, setMacroLoading] = useState(false);
  const [macroError, setMacroError] = useState(null);

  // 거시경제 탭 선택 시 거시경제 뉴스 fetch
  useEffect(() => {
    if (activeTab === 'macro') {
      setMacroLoading(true);
      setMacroError(null);
      fetchMacroNews()
        .then((data) => {
          setMacroNewsList(data);
          setMacroLoading(false);
        })
        .catch((err) => {
          setMacroError('거시경제 뉴스 로딩 실패');
          setMacroNewsList([]);
          setMacroLoading(false);
        });
    }
  }, [activeTab]);

  // 뉴스 아이템 컴포넌트
  const NewsItem = ({ title, source, time, summary, sentiment, url }) => {
    const handleClick = (e) => {
      if (url) {
        e.preventDefault();
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }
    };

    return (
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
                <a
                  href={url}
                  onClick={handleClick}
                  className="hover:underline cursor-pointer"
                  title="새창에서 열기"
                >
                  {title}
                </a>
              ) : (
                title
              )}
            </h4>
            <div className="flex items-center space-x-2 mt-1">
              {source && (
                <span className="text-xs text-gray-500">{source}</span>
              )}
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
  };

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
    const companyNews = news.companyNews || [];
    const macroNews = news.macroNews || [];

    console.log("🔍 NewsPanel 뉴스 데이터:", { companyNews, macroNews });

    // 뉴스 데이터가 객체인지 문자열인지 확인하여 처리
    const processNews = (newsItem) => {
      if (typeof newsItem === "string") {
        return { title: newsItem, source: "Company News" };
      } else if (typeof newsItem === "object" && newsItem.title) {
        const processed = {
          title: newsItem.title,
          url: newsItem.url,
          published_at: newsItem.published_at,
          summary: newsItem.summary,
          source: "Company News",
        };
        console.log("🔗 처리된 뉴스 (기업):", processed);
        return processed;
      }
      return newsItem;
    };

    const processMacroNews = (newsItem) => {
      if (typeof newsItem === "string") {
        return { title: newsItem, source: "Economic News" };
      } else if (typeof newsItem === "object" && newsItem.title) {
        const processed = {
          title: newsItem.title,
          url: newsItem.url,
          published_at: newsItem.published_at,
          summary: newsItem.summary,
          source: "Economic News",
        };
        console.log("🔗 처리된 뉴스 (거시):", processed);
        return processed;
      }
      return newsItem;
    };

    newsList = [
      ...companyNews.map(processNews),
      ...macroNews.map(processMacroNews),
    ];

    console.log("📋 최종 뉴스 리스트:", newsList);
  }

  // 탭별 뉴스 데이터
  const companyNewsList = newsList;
  const filteredMacroNews = useMemo(() => {
    if (!date) return macroNewsList;
    return macroNewsList.filter((item) => item.published_at === date || item.date === date);
  }, [macroNewsList, date]);
  const newsListByTab = activeTab === 'company' ? companyNewsList : filteredMacroNews;
  const pageSize = activeTab === 'company' ? PAGE_SIZE_COMPANY : PAGE_SIZE_MACRO;
  const totalPages = Math.ceil(newsListByTab.length / pageSize);
  const pagedNews = useMemo(() => {
    const start = (page - 1) * pageSize;
    return newsListByTab.slice(start, start + pageSize);
  }, [newsListByTab, page, pageSize]);

  // 페이지 이동
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  // 탭 변경 시 페이지 초기화
  const handleTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xl mx-auto min-h-[420px] h-full relative">
      {/* 탭 */}
      <div className="flex border-b mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors duration-150 ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => handleTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 메인뉴스 강조 card 완전 제거, 리스트 내에서만 메인 pill+title+summary+날짜로 통일 */}
      <ul className="divide-y divide-gray-100 mb-4">
        {activeTab === 'company' && mainNews && page === 1 && (
          <li className="py-3">
            <a
              href={mainNews.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-gray-50 rounded px-2 py-1"
            >
              <div className="flex items-center mb-1 gap-2 flex-nowrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 shrink-0">메인</span>
                <div className="font-semibold text-gray-900 text-sm flex-1 min-w-0 truncate">{mainNews.title}</div>
              </div>
              {mainNews.summary && (
                <div className="text-xs text-gray-600 mt-1">{mainNews.summary}</div>
              )}
              <div className="flex justify-end">
                <span className="text-xs text-gray-400 font-medium mt-1">{mainNews.published_at || mainNews.date}</span>
              </div>
            </a>
          </li>
        )}
        {activeTab === 'macro' && filteredMacroNews.length > 0 && page === 1 && (
          <li className="py-3">
            <a
              href={filteredMacroNews[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-gray-50 rounded px-2 py-1"
            >
              <div className="flex items-center mb-1 gap-2 flex-nowrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 shrink-0">메인</span>
                <div className="font-semibold text-gray-900 text-sm flex-1 min-w-0 truncate">{filteredMacroNews[0].title}</div>
              </div>
              {filteredMacroNews[0].summary && (
                <div className="text-xs text-gray-600 mt-1">{filteredMacroNews[0].summary}</div>
              )}
              <div className="flex justify-end">
                <span className="text-xs text-gray-400 font-medium mt-1">{filteredMacroNews[0].published_at || filteredMacroNews[0].date}</span>
              </div>
            </a>
          </li>
        )}
        {/* 일반 뉴스 리스트 (메인뉴스와 중복 제거, summary 없으면 아무것도 표시 X) */}
        {pagedNews
          .filter(news => !((activeTab === 'company' && mainNews && page === 1 && news.title === mainNews.title) || (activeTab === 'macro' && filteredMacroNews.length > 0 && page === 1 && news.title === filteredMacroNews[0].title)))
          .map((news, idx) => (
            <li key={idx} className="py-3">
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-gray-50 rounded px-2 py-1"
              >
                <div className="font-semibold text-gray-900 text-sm mb-1">{news.title}</div>
                {news.summary && news.summary !== 'None' && (
                  <div className="text-xs text-gray-600 mb-1">{news.summary}</div>
                )}
                <div className="flex justify-end">
                  <span className="text-xs text-gray-400">{news.published_at || news.date}</span>
                </div>
              </a>
            </li>
          ))}
      </ul>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="absolute bottom-4 left-0 w-full flex justify-center items-center gap-2">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="px-2 py-1 text-sm rounded border border-gray-200 bg-gray-50 disabled:opacity-40"
          >
            &lt;
          </button>
          <span className="text-xs text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="px-2 py-1 text-sm rounded border border-gray-200 bg-gray-50 disabled:opacity-40"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsPanel;
