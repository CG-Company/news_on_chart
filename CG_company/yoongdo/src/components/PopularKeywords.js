import React, { useState, useEffect } from 'react';
import { TrendingUp, Hash, Calendar, Users, RefreshCw } from 'lucide-react';
import KeywordDetailModal from './KeywordDetailModal';

const PopularKeywords = () => {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(7);
  const [limit, setLimit] = useState(20);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/popular_keywords?days=${period}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error('키워드 데이터를 불러오는데 실패했습니다.');
      }
      const data = await response.json();
      setKeywords(data.keywords || []);
      setLastUpdated(new Date().toLocaleString('ko-KR'));
    } catch (err) {
      setError(err.message);
      console.error('키워드 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeywords();
    // eslint-disable-next-line
  }, [period, limit]);

  const getKeywordColor = (rank) => {
    if (rank <= 3) return 'text-red-600 bg-red-50 border-red-200';
    if (rank <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (rank <= 15) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🔥';
    return '📈';
  };

  const handleKeywordClick = (keyword) => {
    setSelectedKeyword(keyword);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedKeyword(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            데이터 로드 실패
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchKeywords}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              실시간 인기 키워드
            </h2>
            <p className="text-sm text-gray-600">
              최근 {period}일간 전 종목 뉴스 키워드 분석
            </p>
          </div>
        </div>
        <button
          onClick={fetchKeywords}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>새로고침</span>
        </button>
      </div>
      {/* 필터 옵션 */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">분석 기간:</label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1일</option>
            <option value={3}>3일</option>
            <option value={7}>7일</option>
            <option value={14}>14일</option>
            <option value={30}>30일</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Hash className="w-4 h-4 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">표시 개수:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
        {lastUpdated && (
          <div className="ml-auto text-xs text-gray-500">
            마지막 업데이트: {lastUpdated}
          </div>
        )}
      </div>
      {/* 키워드 목록 */}
      {keywords.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            키워드 데이터가 없습니다
          </h3>
          <p className="text-gray-500">
            선택한 기간 동안의 뉴스 키워드를 찾을 수 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keywords.map((item) => (
            <div
              key={`${item.rank}-${item.keyword}`}
              onClick={() => handleKeywordClick(item.keyword)}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${getKeywordColor(item.rank)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getRankIcon(item.rank)}</span>
                  <span className="text-sm font-bold">#{item.rank}</span>
                </div>
                <div className="flex items-center space-x-1 text-xs">
                  <Users className="w-3 h-3" />
                  <span>{item.count}회</span>
                </div>
              </div>
              <div className="font-semibold text-lg mb-1 truncate" title={item.keyword}>
                {item.keyword}
              </div>
              <div className="text-xs opacity-75">
                언급 빈도: {item.count}회
              </div>
              {/* 진행률 바 */}
              <div className="mt-3 bg-white bg-opacity-50 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((item.count / (keywords[0]?.count || 1)) * 100, 100)}%`,
                    backgroundColor: 'currentColor',
                    opacity: 0.6
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* 통계 요약 */}
      {keywords.length > 0 && (
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-gray-800 mb-2">📈 키워드 분석 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg text-blue-600">{keywords.length}</div>
              <div className="text-gray-600">총 키워드</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-green-600">{keywords[0]?.count || 0}</div>
              <div className="text-gray-600">최고 언급</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-orange-600">
                {Math.round(keywords.reduce((sum, k) => sum + k.count, 0) / keywords.length) || 0}
              </div>
              <div className="text-gray-600">평균 언급</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-purple-600">{period}일</div>
              <div className="text-gray-600">분석 기간</div>
            </div>
          </div>
        </div>
      )}
      {/* 키워드 상세 모달 */}
      <KeywordDetailModal
        keyword={selectedKeyword}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default PopularKeywords; 