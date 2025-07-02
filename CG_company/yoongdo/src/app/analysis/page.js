"use client";
import { useState, useEffect, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";
import AnalysisHeader from "../../components/AnalysisHeader";
import KeywordCard from "../../components/KeywordCard";
import StockCard from "../../components/StockCard2";
import NewsCard from "../../components/NewsCard";
import CorrelationChart from "../../components/CorrelationChart";
import { fetchNewsPanelData } from "../../utils/api";
import Header from "../../components/Header";
import KeywordDetailModal from "../../components/KeywordDetailModal";
import { TrendingUp, Hash, Calendar, Users, RefreshCw, Search } from 'lucide-react';

export default function AnalysisPage() {
  const [currentPage, setCurrentPage] = useState("analysis");
  const [isLoading, setIsLoading] = useState(true);
  
  // 키워드 관련 상태
  const [keywords, setKeywords] = useState([]);
  const [keywordLoading, setKeywordLoading] = useState(true);
  const [keywordError, setKeywordError] = useState(null);
  const [period, setPeriod] = useState(7);
  const [limit, setLimit] = useState(5); // 기본 5개로 설정
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 종목 관련 상태
  const [allStocks, setAllStocks] = useState([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockError, setStockError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllStocks, setShowAllStocks] = useState(false);
  
  // 기타 상태
  const [relatedStocks, setRelatedStocks] = useState({});
  const [relatedNews, setRelatedNews] = useState({});
  const [searchKeyword, setSearchKeyword] = useState("");
  const [correlationData, setCorrelationData] = useState({});
  const [correlationPeriod, setCorrelationPeriod] = useState('1M');
  const [newsPanelData, setNewsPanelData] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  // 키워드 데이터 로딩
  const fetchKeywords = async () => {
    try {
      setKeywordLoading(true);
      setKeywordError(null);
      
      const response = await fetch(
        `http://192.168.1.105:8000/api/popular_keywords?days=${period}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('키워드 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setKeywords(data.keywords || []);
      setLastUpdated(new Date().toLocaleString('ko-KR'));
    } catch (err) {
      setKeywordError(err.message);
      console.error('키워드 조회 오류:', err);
    } finally {
      setKeywordLoading(false);
    }
  };

  // 종목 데이터 로딩
  const fetchStocks = async () => {
    try {
      setStockLoading(true);
      setStockError(null);
      
      const response = await fetch('http://192.168.1.105:8000/api/ticker_map');
      
      if (!response.ok) {
        throw new Error('종목 데이터를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      // 주가 정보를 위한 목업 데이터 추가
      const stocksWithPriceInfo = data.map(stock => ({
        ...stock,
        price: Math.floor(Math.random() * 200000) + 50000,
        change: (Math.random() - 0.5) * 10,
        marketCap: Math.floor(Math.random() * 50) + 10,
        volume: Math.floor(Math.random() * 1000000),
      }));
      
      setAllStocks(stocksWithPriceInfo);
    } catch (err) {
      setStockError(err.message);
      console.error('종목 조회 오류:', err);
    } finally {
      setStockLoading(false);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchKeywords(), fetchStocks()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // 키워드 필터 변경 시 재로딩
  useEffect(() => {
    fetchKeywords();
  }, [period, limit]);

  // 선택된 키워드/날짜가 바뀔 때마다 뉴스 패널 데이터 fetch
  useEffect(() => {
    if (!selectedKeyword || !selectedKeyword.keyword) return;
    fetchNewsPanelData(selectedKeyword.keyword, today)
      .then(setNewsPanelData)
      .catch((e) => setNewsPanelData(null));
  }, [selectedKeyword, today]);

  // 키워드 관련 함수들
  const handleKeywordClick = (keywordData) => {
    setSelectedKeyword({ keyword: keywordData.keyword });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedKeyword(null);
  };

  const handleKeywordRefresh = () => {
    fetchKeywords();
  };

  // 종목 검색 필터링
  const filteredStocks = useMemo(() => {
    if (!searchTerm.trim()) return allStocks;
    
    return allStocks.filter(stock => 
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.ticker.includes(searchTerm) ||
      stock.sector.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allStocks, searchTerm]);

  // 표시할 종목 수 결정
  const displayedStocks = showAllStocks ? filteredStocks : filteredStocks.slice(0, 12);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim() && keywords.length > 0) {
      const foundKeyword = keywords.find(k => 
        k.keyword.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      if (foundKeyword) {
        setSelectedKeyword({ keyword: foundKeyword.keyword });
        setIsModalOpen(true);
      }
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    Promise.all([fetchKeywords(), fetchStocks()]).then(() => {
      setIsLoading(false);
    });
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

  if (isLoading) {
    return (
      <div className="flex">
        <Sidebar currentPage="analysis" />
        <div className="flex-1 ml-52">
          <Header />
          <main className="p-8 bg-gray-50 min-h-screen">
            <AnalysisHeader 
              totalStocks={0} 
              activeKeywords={0} 
              onRefresh={handleRefresh} 
            />
            <div className="p-6 flex items-center justify-center h-64">
              <LoadingSpinner message="키워드 분석 데이터를 로딩 중입니다..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar currentPage="analysis" />
      <div className="flex-1 ml-52">
        <Header />
        <main className="p-8 bg-gray-50 min-h-screen">
          <AnalysisHeader 
            totalStocks={allStocks.length} 
            activeKeywords={keywords.length}
            onRefresh={handleRefresh}
          />

          <div className="grid grid-cols-12 gap-6 mb-8">
            {/* 키워드 검색 */}
            <div className="col-span-12">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">키워드 검색</h2>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="키워드를 검색하세요"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    검색
                  </button>
                </form>
              </div>
            </div>

            {/* 오늘의 인기 키워드 */}
            <div className="col-span-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">오늘의 인기 키워드</h2>
                  <button
                    onClick={handleKeywordRefresh}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>새로고침</span>
                  </button>
                </div>

                {/* 키워드 필터 */}
                <div className="mb-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">분석 기간:</label>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1일</option>
                      <option value={3}>3일</option>
                      <option value={7}>7일</option>
                      <option value={14}>14일</option>
                      <option value={30}>30일</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">표시 개수:</label>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5개</option>
                      <option value={10}>10개</option>
                      <option value={20}>20개</option>
                      <option value={50}>50개</option>
                    </select>
                  </div>
                </div>

                {lastUpdated && (
                  <div className="mb-4 text-xs text-gray-500">
                    마지막 업데이트: {lastUpdated}
                  </div>
                )}

                {/* 키워드 목록 */}
                <div className="space-y-3">
                  {keywordLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner size="sm" message="키워드 로딩 중..." />
                    </div>
                  ) : keywordError ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 text-sm">{keywordError}</p>
                      <button
                        onClick={handleKeywordRefresh}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : keywords.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">키워드 데이터가 없습니다</p>
                    </div>
                  ) : (
                    keywords.map((keyword, index) => {
                      const cleanedKeywords = cleanKeywords(keyword.keyword);
                      if (cleanedKeywords.length === 0) return null;
                      return (
                        <div
                          key={`${keyword.rank}-${keyword.keyword}`}
                          onClick={() => handleKeywordClick(keyword)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-bold text-gray-500">#{keyword.rank}</span>
                            <span className="font-medium text-gray-900">{cleanedKeywords[0]}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Users className="w-3 h-3" />
                            <span>{keyword.count}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 코스피 200 */}
            <div className="col-span-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">코스피 200</h2>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="종목명 또는 코드 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => setShowAllStocks(!showAllStocks)}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      {showAllStocks ? '접기' : '전체 보기'}
                    </button>
                  </div>
                </div>

                {stockLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner message="종목 데이터를 로딩 중입니다..." />
                  </div>
                ) : stockError ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 mb-4">{stockError}</p>
                    <button
                      onClick={fetchStocks}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedStocks.map((stock) => (
                        <div key={stock.ticker} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{stock.name}</h3>
                              <p className="text-sm text-gray-600">{stock.ticker}</p>
                              <p className="text-xs text-gray-500">{stock.sector}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">{stock.price?.toLocaleString()}원</p>
                              <p className={`text-sm font-medium ${stock.change >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                                {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {filteredStocks.length > 12 && !showAllStocks && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setShowAllStocks(true)}
                          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {filteredStocks.length - 12}개 더 보기
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 키워드 상세 모달 */}
          <KeywordDetailModal
            keyword={selectedKeyword?.keyword}
            isOpen={isModalOpen}
            onClose={closeModal}
          />
        </main>
      </div>
    </div>
  );
}