import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Newspaper, BarChart3, ExternalLink, Calendar, Hash } from 'lucide-react';

const KeywordDetailModal = ({ keyword, isOpen, onClose }) => {
  const [keywordNews, setKeywordNews] = useState([]);
  const [keywordStats, setKeywordStats] = useState(null);
  const [relatedKeywords, setRelatedKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('news');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";

  useEffect(() => {
    if (isOpen && keyword) {
      fetchKeywordData();
    }
  }, [isOpen, keyword]);

  const fetchKeywordData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 데이터 요청
      const [newsResponse, statsResponse, relatedResponse] = await Promise.all([
        fetch(`${API_BASE}/api/keyword_news?keyword=${encodeURIComponent(keyword)}&days=7&limit=20`),
        fetch(`${API_BASE}/api/keyword_stats?keyword=${encodeURIComponent(keyword)}&days=30`),
        fetch(`${API_BASE}/api/related_keywords?keyword=${encodeURIComponent(keyword)}&days=7&limit=10`)
      ]);

      const newsData = await newsResponse.json();
      const statsData = await statsResponse.json();
      const relatedData = await relatedResponse.json();

      setKeywordNews(newsData.news || []);
      setKeywordStats(statsData);
      setRelatedKeywords(relatedData.related_keywords || []);
    } catch (error) {
      console.error('키워드 상세 데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 키워드 정제 함수 (특수문자, None 등 제거)
  function cleanKeywords(raw) {
    if (!raw) return [];
    const cleaned = raw.replace(/[{}\[\]"'`]/g, '');
    return cleaned
      .split(',')
      .map(k => k.trim())
      .filter(k => k && k.length > 1 && !['none', 'null', 'nan', '{}', '[]', '""', "''", 'None'].includes(k.toLowerCase()));
  }

  if (!isOpen) return null;

  const tabs = [
    { id: 'news', label: '관련 뉴스', icon: Newspaper },
    { id: 'stats', label: '통계', icon: BarChart3 },
    { id: 'related', label: '관련 키워드', icon: Hash }
  ];

  const renderNewsTab = () => (
    <div className="space-y-4">
      {keywordNews.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>관련 뉴스가 없습니다.</p>
        </div>
      ) : (
        keywordNews.map((news, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg text-gray-800 leading-tight">
                {news.title}
              </h3>
              {news.url && (
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
              {news.summary}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {news.published_at}
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {news.ticker}
                </span>
              </div>
              
              {news.sentiment_score && (
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  news.sentiment_score > 0 
                    ? 'bg-green-100 text-green-800' 
                    : news.sentiment_score < 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  감정: {news.sentiment_score > 0 ? '긍정' : news.sentiment_score < 0 ? '부정' : '중립'}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      {keywordStats ? (
        <>
          {/* 통계 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {keywordStats.total_mentions}
              </div>
              <div className="text-sm text-gray-600">총 언급</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {keywordStats.total_tickers}
              </div>
              <div className="text-sm text-gray-600">관련 종목</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {keywordStats.avg_daily_mentions}
              </div>
              <div className="text-sm text-gray-600">일평균 언급</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">
                {keywordStats.period}
              </div>
              <div className="text-sm text-gray-600">분석 기간</div>
            </div>
          </div>

          {/* 일별 통계 */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">일별 언급 추이</h4>
            <div className="space-y-2">
              {keywordStats.daily_stats.slice(0, 10).map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{stat.date}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {stat.mention_count}회 언급
                    </span>
                    <span className="text-sm text-gray-600">
                      {stat.ticker_count}개 종목
                    </span>
                    {stat.avg_sentiment !== 0 && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        stat.avg_sentiment > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stat.avg_sentiment > 0 ? '긍정' : '부정'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>통계 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );

  const renderRelatedTab = () => (
    <div className="space-y-4">
      {relatedKeywords.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Hash className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>관련 키워드가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {relatedKeywords.map((related, index) => {
            const cleaned = cleanKeywords(related.keyword);
            if (cleaned.length === 0) return null;
            return (
              <div key={index} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {cleaned[0]}
                  </span>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{related.relevance}회</span>
                    <span>•</span>
                    <span>{related.ticker_count}개 종목</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              키워드 상세 분석: &quot;{cleanKeywords(keyword)[0] || ''}&quot;
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">데이터 로딩 중...</span>
            </div>
          ) : (
            <>
              {activeTab === 'news' && renderNewsTab()}
              {activeTab === 'stats' && renderStatsTab()}
              {activeTab === 'related' && renderRelatedTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KeywordDetailModal;