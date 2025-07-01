"use client";
import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import LoadingSpinner from "../../components/LoadingSpinner";

// Analysis 페이지용 간단한 헤더 컴포넌트
const AnalysisHeader = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 ml-52">
      <div className="flex items-center justify-between">
        {/* 페이지 제목 */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Stock Analysis
          </h1>
        </div>

        {/* 우측 아이콘들 */}
        <div className="flex items-center space-x-4">
          {/* 알림 아이콘 */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-5.5-5.5V9a6.5 6.5 0 00-13 0v2.5L7 17h5m3 0v1a3 3 0 11-6 0v-1"
              />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* 사용자 프로필 */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
            <span className="text-sm font-medium text-gray-700">User</span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default function AnalysisPage() {
  const [currentPage, setCurrentPage] = useState("analysis");
  const [isLoading, setIsLoading] = useState(true);
  const [popularKeywords, setPopularKeywords] = useState([]);
  const [relatedStocks, setRelatedStocks] = useState({});
  const [relatedNews, setRelatedNews] = useState({});
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  // 오늘 날짜
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    // 시뮬레이션 데이터 로딩
    const loadData = async () => {
      setIsLoading(true);

      // 인기 키워드 데이터 (실제로는 API에서 가져올 예정)
      const mockKeywords = [
        { keyword: "AI", count: 156, trend: "up" },
        { keyword: "반도체", count: 142, trend: "up" },
        { keyword: "전기차", count: 98, trend: "down" },
        { keyword: "바이오", count: 87, trend: "up" },
        { keyword: "게임", count: 76, trend: "stable" },
      ];

      // 관련 종목 데이터
      const mockStocks = {
        AI: [
          { ticker: "000660", name: "SK하이닉스", price: 185000, change: 2.5 },
          { ticker: "005930", name: "삼성전자", price: 75000, change: 1.8 },
          { ticker: "035420", name: "NAVER", price: 220000, change: 3.2 },
        ],
        반도체: [
          { ticker: "000660", name: "SK하이닉스", price: 185000, change: 2.5 },
          { ticker: "005930", name: "삼성전자", price: 75000, change: 1.8 },
          { ticker: "035720", name: "카카오", price: 45000, change: -1.2 },
        ],
        전기차: [
          { ticker: "005380", name: "현대차", price: 185000, change: -0.8 },
          { ticker: "000270", name: "기아", price: 85000, change: 1.5 },
          { ticker: "051910", name: "LG화학", price: 450000, change: 2.1 },
        ],
        바이오: [
          { ticker: "068270", name: "셀트리온", price: 180000, change: 4.2 },
          {
            ticker: "207940",
            name: "삼성바이오로직스",
            price: 850000,
            change: 1.8,
          },
          { ticker: "006280", name: "녹십자", price: 450000, change: 2.5 },
        ],
        게임: [
          { ticker: "035420", name: "NAVER", price: 220000, change: 3.2 },
          { ticker: "035720", name: "카카오", price: 45000, change: -1.2 },
          { ticker: "051900", name: "LG생활건강", price: 850000, change: 0.8 },
        ],
      };

      // 관련 뉴스 데이터
      const mockNews = {
        AI: [
          {
            title: "AI 기술 발전으로 반도체 수요 급증",
            summary:
              "인공지능 기술의 급속한 발전으로 고성능 반도체 수요가 크게 증가하고 있습니다.",
            date: "2024-01-15",
          },
          {
            title: "AI 기반 자율주행 기술 혁신",
            summary:
              "자율주행 기술에 AI가 접목되어 새로운 혁신이 일어나고 있습니다.",
            date: "2024-01-15",
          },
        ],
        반도체: [
          {
            title: "글로벌 반도체 공급망 재편",
            summary:
              "글로벌 반도체 공급망이 재편되면서 국내 반도체 기업들의 기회가 확대되고 있습니다.",
            date: "2024-01-15",
          },
          {
            title: "차세대 반도체 기술 개발 가속화",
            summary:
              "차세대 반도체 기술 개발이 가속화되어 관련 기업들의 투자가 활발해지고 있습니다.",
            date: "2024-01-15",
          },
        ],
        전기차: [
          {
            title: "전기차 시장 성장세 둔화",
            summary:
              "전기차 시장의 성장세가 다소 둔화되고 있으나 장기적으로는 여전히 유망한 시장입니다.",
            date: "2024-01-15",
          },
          {
            title: "전기차 배터리 기술 혁신",
            summary:
              "전기차 배터리 기술의 혁신으로 주행거리와 충전 속도가 크게 개선되고 있습니다.",
            date: "2024-01-15",
          },
        ],
        바이오: [
          {
            title: "바이오 신약 개발 성과",
            summary:
              "국내 바이오 기업들의 신약 개발 성과가 두드러지고 있습니다.",
            date: "2024-01-15",
          },
          {
            title: "바이오 기술 투자 확대",
            summary:
              "바이오 기술에 대한 투자가 확대되어 관련 기업들의 성장이 기대됩니다.",
            date: "2024-01-15",
          },
        ],
        게임: [
          {
            title: "게임 산업 디지털 전환",
            summary:
              "게임 산업의 디지털 전환이 가속화되어 새로운 비즈니스 모델이 등장하고 있습니다.",
            date: "2024-01-15",
          },
          {
            title: "메타버스 게임 시장 확대",
            summary:
              "메타버스 게임 시장이 확대되어 관련 기업들의 성장이 기대됩니다.",
            date: "2024-01-15",
          },
        ],
      };

      // 데이터 설정
      setPopularKeywords(mockKeywords);
      setRelatedStocks(mockStocks);
      setRelatedNews(mockNews);

      // 기본 키워드 설정 (AI)
      setSelectedKeyword(mockKeywords[0]);

      setIsLoading(false);
    };

    loadData();
  }, []);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return "📈";
      case "down":
        return "📉";
      case "stable":
        return "➡️";
      default:
        return "➡️";
    }
  };

  const getChangeColor = (change) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const handleKeywordClick = (keyword) => {
    setSelectedKeyword(keyword);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      // 검색된 키워드가 있는지 확인
      const foundKeyword = popularKeywords.find((k) =>
        k.keyword.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      if (foundKeyword) {
        setSelectedKeyword(foundKeyword);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar currentPage={currentPage} />
        <div className="flex-1 ml-52">
          <AnalysisHeader />
          <div className="p-6">
            <LoadingSpinner message="주식 분석 데이터를 로딩 중입니다..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <Sidebar currentPage={currentPage} />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 ml-52">
        {/* 헤더 */}
        <AnalysisHeader />

        {/* 메인 컨텐츠 영역 */}
        <main className="p-6">
          {/* 페이지 제목 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Stock Analysis</h1>
            <p className="text-gray-600">오늘의 인기 키워드와 관련 종목 분석</p>
          </div>

          {/* 인기 키워드 섹션 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📊 {today} 인기 키워드 TOP 5
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {popularKeywords.map((keyword, index) => (
                <button
                  key={keyword.keyword}
                  onClick={() => handleKeywordClick(keyword)}
                  className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border transition-all duration-200 hover:shadow-md hover:scale-105 ${
                    selectedKeyword?.keyword === keyword.keyword
                      ? "border-blue-500 shadow-lg scale-105"
                      : "border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      #{index + 1}
                    </span>
                    <span className="text-lg">
                      {getTrendIcon(keyword.trend)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {keyword.keyword}
                  </h3>
                  <p className="text-sm text-gray-600">
                    언급 {keyword.count}회
                  </p>
                </button>
              ))}
            </div>

            {/* 키워드 검색 */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-3">
                🔍 키워드 검색
              </h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="키워드를 입력하세요..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  검색
                </button>
              </form>
            </div>
          </div>

          {/* 분석 결과 섹션 */}
          {selectedKeyword && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 관련 종목 창 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📈</span>
                  {selectedKeyword.keyword} 관련 종목
                </h3>
                <div className="space-y-3">
                  {relatedStocks[selectedKeyword.keyword]?.map((stock) => (
                    <div
                      key={stock.ticker}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {stock.name}
                        </p>
                        <p className="text-sm text-gray-600">{stock.ticker}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {stock.price.toLocaleString()}원
                        </p>
                        <p
                          className={`text-sm font-medium ${getChangeColor(
                            stock.change
                          )}`}
                        >
                          {stock.change > 0 ? "+" : ""}
                          {stock.change}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 관련 뉴스 창 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📰</span>
                  {selectedKeyword.keyword} 관련 뉴스
                </h3>
                <div className="space-y-3">
                  {relatedNews[selectedKeyword.keyword]?.map((news, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h5 className="font-medium text-gray-900 text-sm mb-1 overflow-hidden">
                        {news.title}
                      </h5>
                      <p className="text-xs text-gray-600 mb-2 overflow-hidden">
                        {news.summary}
                      </p>
                      <p className="text-xs text-gray-500">{news.date}</p>
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
