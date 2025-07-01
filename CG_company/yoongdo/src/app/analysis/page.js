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

export default function AnalysisPage() {
  const [currentPage, setCurrentPage] = useState("analysis");
  const [isLoading, setIsLoading] = useState(true);
  const [popularKeywords, setPopularKeywords] = useState([]);
  const [kospi200Stocks, setKospi200Stocks] = useState([]);
  const [relatedStocks, setRelatedStocks] = useState({});
  const [relatedNews, setRelatedNews] = useState({});
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showAllStocks, setShowAllStocks] = useState(false);
  const [correlationData, setCorrelationData] = useState({});
  const [correlationPeriod, setCorrelationPeriod] = useState('1M');
  const [newsPanelData, setNewsPanelData] = useState(null);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // 모의 데이터
        const mockKeywords = [
          { keyword: "AI", count: 156, sentiment: 0.3 },
          { keyword: "반도체", count: 142, sentiment: 0.2 },
          { keyword: "전기차", count: 98, sentiment: -0.1 },
          { keyword: "바이오", count: 87, sentiment: 0.4 },
          { keyword: "게임", count: 76, sentiment: 0.1 },
        ];

        const mockKospi200 = Array.from({ length: 20 }, (_, i) => ({
          ticker: `00${(i + 1).toString().padStart(4, '0')}`,
          name: `종목${i + 1}`,
          price: Math.floor(Math.random() * 200000) + 50000,
          change: (Math.random() - 0.5) * 10,
          marketCap: Math.floor(Math.random() * 50) + 10,
          volume: Math.floor(Math.random() * 1000000),
        }));

        const mockStocks = {
          AI: [
            { ticker: "000660", name: "SK하이닉스", price: 185000, change: 2.5, mentions: 15 },
            { ticker: "005930", name: "삼성전자", price: 75000, change: 1.8, mentions: 12 },
            { ticker: "035420", name: "NAVER", price: 220000, change: 3.2, mentions: 8 },
          ],
          반도체: [
            { ticker: "000660", name: "SK하이닉스", price: 185000, change: 2.5, mentions: 18 },
            { ticker: "005930", name: "삼성전자", price: 75000, change: 1.8, mentions: 22 },
          ],
          전기차: [
            { ticker: "005380", name: "현대차", price: 185000, change: -0.8, mentions: 14 },
            { ticker: "000270", name: "기아", price: 85000, change: 1.5, mentions: 11 },
          ],
          바이오: [
            { ticker: "068270", name: "셀트리온", price: 180000, change: 4.2, mentions: 13 },
            { ticker: "207940", name: "삼성바이오로직스", price: 850000, change: 1.8, mentions: 8 },
          ],
          게임: [
            { ticker: "035420", name: "NAVER", price: 220000, change: 3.2, mentions: 8 },
            { ticker: "035720", name: "카카오", price: 45000, change: -1.2, mentions: 6 },
          ],
        };

        const mockNews = {
          AI: [
            {
              title: "AI 기술 발전으로 반도체 수요 급증",
              summary: "인공지능 기술의 급속한 발전으로 고성능 반도체 수요가 크게 증가하고 있습니다.",
              date: "2024-01-15",
              sentiment: 1,
              is_main_news: true,
            },
            {
              title: "AI 기반 자율주행 기술 혁신으로 모빌리티 산업 변화",
              summary: "자율주행 기술에 AI가 접목되어 새로운 혁신이 일어나고 있습니다.",
              date: "2024-01-15",
              sentiment: 1,
              is_main_news: false,
            },
          ],
          반도체: [
            {
              title: "글로벌 반도체 공급망 재편, 국내 기업 수혜 전망",
              summary: "글로벌 반도체 공급망이 재편되면서 국내 반도체 기업들의 기회가 확대되고 있습니다.",
              date: "2024-01-15",
              sentiment: 1,
              is_main_news: true,
            },
          ],
          전기차: [
            {
              title: "전기차 시장 성장세 둔화 우려",
              summary: "전기차 시장의 성장세가 다소 둔화되고 있으나 장기적으로는 여전히 유망한 시장입니다.",
              date: "2024-01-15",
              sentiment: -1,
              is_main_news: false,
            },
          ],
          바이오: [
            {
              title: "바이오 신약 개발 성과 발표",
              summary: "국내 바이오 기업들의 신약 개발 성과가 두드러지고 있습니다.",
              date: "2024-01-15",
              sentiment: 1,
              is_main_news: true,
            },
          ],
          게임: [
            {
              title: "게임 산업 디지털 전환 가속화",
              summary: "게임 산업의 디지털 전환이 가속화되어 새로운 비즈니스 모델이 등장하고 있습니다.",
              date: "2024-01-15",
              sentiment: 0,
              is_main_news: false,
            },
          ],
        };

        const mockCorrelationData = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          price: 180000 + Math.sin(i / 5) * 20000 + Math.random() * 10000,
          keyword_mentions: Math.floor(Math.random() * 10) + (i % 7 === 0 ? 15 : 0),
        }));

        setPopularKeywords(mockKeywords);
        setKospi200Stocks(mockKospi200);
        setRelatedStocks(mockStocks);
        setRelatedNews(mockNews);
        setCorrelationData({ 
          AI: mockCorrelationData, 
          반도체: mockCorrelationData,
          전기차: mockCorrelationData,
          바이오: mockCorrelationData,
          게임: mockCorrelationData 
        });
        setSelectedKeyword(mockKeywords[0]);

      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }

      setIsLoading(false);
    };

    loadData();
  }, [today]);

  // 선택된 키워드/날짜가 바뀔 때마다 뉴스 패널 데이터 fetch
  useEffect(() => {
    if (!selectedKeyword || !selectedKeyword.keyword) return;
    fetchNewsPanelData(selectedKeyword.keyword, today)
      .then(setNewsPanelData)
      .catch((e) => setNewsPanelData(null));
  }, [selectedKeyword, today]);

  const filteredKeywords = useMemo(() => {
    if (!searchKeyword.trim()) return popularKeywords;
    return popularKeywords.filter(k => 
      k.keyword.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [popularKeywords, searchKeyword]);

  const handleKeywordClick = (keyword) => {
    setSelectedKeyword(keyword);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim() && filteredKeywords.length > 0) {
      setSelectedKeyword(filteredKeywords[0]);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar currentPage={currentPage} />
        <div className="flex-1 ml-52">
          <AnalysisHeader totalStocks={0} activeKeywords={0} onRefresh={handleRefresh} />
          <div className="p-6 flex items-center justify-center h-64">
            <LoadingSpinner message="키워드 분석 데이터를 로딩 중입니다..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPage={currentPage} />
      
      <div className="flex-1 ml-52">
        <AnalysisHeader 
          totalStocks={kospi200Stocks.length} 
          activeKeywords={popularKeywords.length}
          onRefresh={handleRefresh}
        />

        <main className="p-6 space-y-6">
          {/* 검색 섹션 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">키워드 검색</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAllStocks(!showAllStocks)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showAllStocks 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showAllStocks ? '키워드 분석' : '전체 종목'}
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="키워드를 검색하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-900 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                검색
              </button>
            </form>
          </div>

          {!showAllStocks ? (
            <>
              {/* 인기 키워드 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  오늘의 인기 키워드
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {filteredKeywords.map((keyword, index) => (
                    <KeywordCard
                      key={keyword.keyword}
                      keyword={keyword}
                      rank={index + 1}
                      onClick={handleKeywordClick}
                      isSelected={selectedKeyword?.keyword === keyword.keyword}
                      stockCount={relatedStocks[keyword.keyword]?.length || 0}
                    />
                  ))}
                </div>
              </div>

              {/* 선택된 키워드 분석 */}
              {selectedKeyword && (
                <>
                  {/* 상관관계 차트 */}
                  <CorrelationChart
                    keyword={selectedKeyword.keyword}
                    ticker="000660"
                    data={correlationData[selectedKeyword.keyword] || []}
                    period={correlationPeriod}
                    onPeriodChange={setCorrelationPeriod}
                  />

                  {/* 관련 종목 & 뉴스 */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* 관련 종목 */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        관련 종목
                      </h3>
                      <div className="space-y-3">
                        {relatedStocks[selectedKeyword.keyword]?.map((stock) => (
                          <StockCard 
                            key={stock.ticker} 
                            stock={stock} 
                            keywordMentions={stock.mentions}
                          />
                        ))}
                      </div>
                    </div>

                    {/* 관련 뉴스 */}
                    <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        관련 뉴스
                      </h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {relatedNews[selectedKeyword.keyword]?.map((news, index) => (
                          <NewsCard 
                            key={index} 
                            news={news} 
                            keyword={selectedKeyword.keyword}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            /* 코스피 200 전체 보기 */
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* 오늘의 키워드 사이드바 */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">오늘의 키워드</h3>
                <div className="space-y-2">
                  {popularKeywords.slice(0, 8).map((keyword, index) => (
                    <div 
                      key={keyword.keyword}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedKeyword(keyword);
                        setShowAllStocks(false);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-sm font-medium">{keyword.keyword}</span>
                      </div>
                      <div className="text-xs text-gray-500">{keyword.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 코스피 200 종목 */}
              <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">코스피 200</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {kospi200Stocks.map((stock) => (
                    <div key={stock.ticker} className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">{stock.name}</h4>
                          <p className="text-xs text-gray-500">{stock.ticker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{stock.price.toLocaleString()}원</p>
                          <p className={`text-xs ${stock.change >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>시총 {stock.marketCap}조</span>
                        <span>거래량 {(stock.volume / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}