"use client";
import React, { useEffect, useState } from "react";
import {
  Newspaper,
  ExternalLink,
  Calendar,
  AlertCircle,
  Search,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

const StockDetailPanel = ({ ticker, name, onClose }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [relationNews, setRelationNews] = useState([]);
  const [relationLoading, setRelationLoading] = useState(false);
  const [relationError, setRelationError] = useState(null);
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    setError(null);
    fetch(
      `${API_BASE}/api/ticker_news_return?ticker=${ticker}&days=30&limit=20`
    )
      .then((res) => res.json())
      .then((data) => {
        setNews(data.news || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("데이터를 불러올 수 없습니다.");
        setLoading(false);
      });
  }, [ticker]);

  // 키워드-종목 관계 뉴스 fetch
  const fetchRelationNews = async (kw) => {
    if (!kw) return;
    setRelationLoading(true);
    setRelationError(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/keyword_news_return?keyword=${encodeURIComponent(
          kw
        )}&days=30&limit=20`
      );
      const data = await res.json();
      setRelationNews(data.news || []);
    } catch (err) {
      setRelationError("데이터를 불러올 수 없습니다.");
      setRelationNews([]);
    } finally {
      setRelationLoading(false);
    }
  };

  // 키워드 입력 핸들러
  const handleKeywordSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      fetchRelationNews(keyword.trim());
    }
  };

  if (!ticker) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {error}
            </h3>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {name || ticker}
            </h2>
            <div className="text-gray-500 text-sm mt-1">
              최근 뉴스 및 1주일 후 수익률
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="sr-only">닫기</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* 키워드 입력창 */}
        <form onSubmit={handleKeywordSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="키워드(예: 금리, 환율 등)를 입력하세요..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            검색
          </button>
        </form>
        {/* 키워드-종목 관계 뉴스 */}
        {relationLoading ? (
          <div className="text-center py-8 text-gray-500">
            키워드 관련 뉴스를 불러오는 중...
          </div>
        ) : relationError ? (
          <div className="text-center py-8 text-red-500">{relationError}</div>
        ) : keyword.trim() ? (
          <div className="space-y-4 mb-8">
            {relationNews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>해당 키워드 관련 뉴스가 없습니다.</p>
              </div>
            ) : (
              relationNews.map((article, index) => (
                <div
                  key={index}
                  className="p-4 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-blue-50 to-white"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {article.ticker === "000000" ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              거시뉴스
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                              종목뉴스
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {article.ticker}
                          </span>
                        </div>
                        <h4 className="font-semibold text-blue-900 leading-tight">
                          {article.title}
                        </h4>
                      </div>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 text-blue-400" />
                      </a>
                    </div>
                    {/* summary */}
                    {article.summary && article.summary !== "None" ? (
                      <p className="text-sm text-gray-700">{article.summary}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">요약 없음</p>
                    )}
                    {/* keyword */}
                    <div className="flex items-center gap-2 text-xs text-blue-700 mt-1">
                      <span className="font-semibold">키워드:</span>
                      {article.keyword &&
                      article.keyword !== "{None}" &&
                      article.keyword !== "None" ? (
                        article.keyword
                      ) : (
                        <span className="text-gray-400">키워드 없음</span>
                      )}
                    </div>
                    {/* sentiment */}
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="font-semibold text-purple-700">
                        감성:
                      </span>
                      {article.sentiment && article.sentiment !== "None" ? (
                        <span
                          className={
                            article.sentiment === "positive"
                              ? "text-green-600"
                              : article.sentiment === "negative"
                              ? "text-red-600"
                              : "text-gray-600"
                          }
                        >
                          {article.sentiment === "positive"
                            ? "긍정"
                            : article.sentiment === "negative"
                            ? "부정"
                            : article.sentiment}
                        </span>
                      ) : (
                        <span className="text-gray-400">감성 정보 없음</span>
                      )}
                      <span className="ml-2 font-semibold text-gray-500">
                        점수:
                      </span>
                      {article.sentiment_score !== null &&
                      article.sentiment_score !== undefined ? (
                        <span>{article.sentiment_score}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.published_at}</span>
                      {typeof article.return_7d === "number" && (
                        <span
                          className={`font-bold ${
                            article.return_7d > 0
                              ? "text-green-600"
                              : article.return_7d < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          1주일 후 수익률: {article.return_7d > 0 ? "+" : ""}
                          {article.return_7d}%
                        </span>
                      )}
                    </div>
                    {Array.isArray(article.price_series) &&
                      article.price_series.length > 1 && (
                        <div style={{ width: 160, height: 40 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={article.price_series}
                              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                            >
                              <Area
                                type="monotone"
                                dataKey="close"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.15}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
        {/* 기존 뉴스(키워드 미입력 시) */}
        {!keyword.trim() && (
          <div className="space-y-4">
            {news.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>관련 뉴스가 없습니다.</p>
              </div>
            ) : (
              news.map((article, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-semibold text-gray-900 leading-tight">
                        {article.title}
                      </h4>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    </div>
                    {/* summary */}
                    {article.summary && article.summary !== "None" ? (
                      <p className="text-sm text-gray-600">{article.summary}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">요약 없음</p>
                    )}
                    {/* keyword */}
                    <div className="flex items-center gap-2 text-xs text-blue-700 mt-1">
                      <span className="font-semibold">키워드:</span>
                      {article.keyword &&
                      article.keyword !== "{None}" &&
                      article.keyword !== "None" ? (
                        article.keyword
                      ) : (
                        <span className="text-gray-400">키워드 없음</span>
                      )}
                    </div>
                    {/* sentiment */}
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="font-semibold text-purple-700">
                        감성:
                      </span>
                      {article.sentiment && article.sentiment !== "None" ? (
                        <span
                          className={
                            article.sentiment === "positive"
                              ? "text-green-600"
                              : article.sentiment === "negative"
                              ? "text-red-600"
                              : "text-gray-600"
                          }
                        >
                          {article.sentiment === "positive"
                            ? "긍정"
                            : article.sentiment === "negative"
                            ? "부정"
                            : article.sentiment}
                        </span>
                      ) : (
                        <span className="text-gray-400">감성 정보 없음</span>
                      )}
                      <span className="ml-2 font-semibold text-gray-500">
                        점수:
                      </span>
                      {article.sentiment_score !== null &&
                      article.sentiment_score !== undefined ? (
                        <span>{article.sentiment_score}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.published_at}</span>
                      {typeof article.return_7d === "number" && (
                        <span
                          className={`font-bold ${
                            article.return_7d > 0
                              ? "text-green-600"
                              : article.return_7d < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          1주일 후 수익률: {article.return_7d > 0 ? "+" : ""}
                          {article.return_7d}%
                        </span>
                      )}
                    </div>
                    {Array.isArray(article.price_series) &&
                      article.price_series.length > 1 && (
                        <div style={{ width: 160, height: 40 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={article.price_series}
                              margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                            >
                              <Area
                                type="monotone"
                                dataKey="close"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.15}
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetailPanel;
