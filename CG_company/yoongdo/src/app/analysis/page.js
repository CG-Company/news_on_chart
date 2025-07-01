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
import PopularKeywords from "../../components/PopularKeywords";

export default function AnalysisPage() {
  const [currentPage, setCurrentPage] = useState("analysis");
  const [isLoading, setIsLoading] = useState(true);
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
        // 코스피 200 종목만 불러오기 (예시: 목업)
        const mockKospi200 = Array.from({ length: 20 }, (_, i) => ({
          ticker: `00${(i + 1).toString().padStart(4, '0')}`,
          name: `종목${i + 1}`,
          price: Math.floor(Math.random() * 200000) + 50000,
          change: (Math.random() - 0.5) * 10,
          marketCap: Math.floor(Math.random() * 50) + 10,
          volume: Math.floor(Math.random() * 1000000),
        }));
        setKospi200Stocks(mockKospi200);
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
    if (!searchKeyword.trim()) return [];
    return [];
  }, [searchKeyword]);

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
      <div className="flex">
        <Sidebar currentPage="analysis" />
        <div className="flex-1 ml-52">
          <Header />
          <main className="p-8 bg-gray-50 min-h-screen">
            <AnalysisHeader totalStocks={0} activeKeywords={0} onRefresh={handleRefresh} />
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
            totalStocks={kospi200Stocks.length} 
            activeKeywords={0}
            onRefresh={handleRefresh}
          />

          <main className="p-6 space-y-6">
            {/* 인기 키워드 영역을 PopularKeywords 컴포넌트로 대체 */}
            <PopularKeywords />
            {/* 기존의 키워드 분석, 종목, 뉴스 등은 필요시 별도 구현 */}
          </main>
        </main>
      </div>
    </div>
  );
}