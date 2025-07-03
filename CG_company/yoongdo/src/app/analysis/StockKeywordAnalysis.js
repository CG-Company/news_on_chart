"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { fetchTickerMap, fetchStock } from "../../utils/api";
import { validateTickerMap } from "../../utils/dataValidation";
import { SearchLoadingSpinner } from "../../components/LoadingSpinner";
import {
  Search,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  DollarSign,
  Activity,
  Newspaper,
  ExternalLink,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";

const StockKeywordAnalysis = ({ onClose, selectedStock }) => {
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tickerMap, setTickerMap] = useState([]);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("7"); // 7일, 30일, 90일
  const [newsList, setNewsList] = useState([]);
  const keywordInputRef = useRef(null);
  const suggestionRefs = useRef([]);

  // 티커 맵 로딩
  useEffect(() => {
    const loadTickerMap = async () => {
      try {
        setError(null);
        const data = await fetchTickerMap();
        const validation = validateTickerMap(data);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
        setTickerMap(data);
      } catch (err) {
        console.error("티커 맵 로딩 실패:", err);
        setError("검색 데이터를 불러올 수 없습니다.");
      }
    };
    loadTickerMap();
  }, []);

  // 키워드 제안 목록 (실제 키워드 데이터가 있다면 API에서 가져와야 함)
  const keywordSuggestions = useMemo(() => {
    const commonKeywords = [
      "환율",
      "금리",
      "원유",
      "반도체",
      "AI",
      "전기차",
      "바이오",
      "게임",
      "부동산",
      "금",
      "달러",
      "엔화",
      "유로",
      "중국",
      "미국",
      "한국",
      "인플레이션",
      "경기침체",
      "성장",
      "수출",
      "수입",
      "무역수지",
      "GDP",
      "고용",
      "실업률",
      "소비자물가지수",
      "생산자물가지수",
      "기업실적",
      "배당",
      "M&A",
      "IPO",
      "벤처캐피탈",
      "스타트업",
      "블록체인",
      "메타버스",
    ];

    if (!keyword.trim()) return [];

    const query = keyword.toLowerCase().trim();
    return commonKeywords
      .filter((kw) => kw.toLowerCase().includes(query))
      .slice(0, 8);
  }, [keyword]);

  // 키워드 분석 실행
  const handleKeywordAnalysis = async () => {
    const searchKeyword = keyword.trim();
    if (!searchKeyword) {
      setError("키워드를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResults(null);
    setNewsList([]);

    try {
      // 1. 주가 데이터 fetch
      const stockData = await fetchStock(selectedStock.ticker);
      // 2. 뉴스 fetch (키워드별)
      const newsRes = await fetch(
        `${API_BASE}/api/keyword_news_return?keyword=${encodeURIComponent(
          searchKeyword
        )}&days=${selectedPeriod}&limit=100`
      );
      const newsJson = await newsRes.json();
      const newsArr = Array.isArray(newsJson.news) ? newsJson.news : [];
      setNewsList(newsArr);
      // 3. 기간 필터링 (최근 N일)
      const days = parseInt(selectedPeriod);
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days);
      // 4. 일별 데이터 생성
      const dailyMap = {};
      stockData.forEach((item) => {
        if (!item.date) return;
        if (new Date(item.date) < startDate) return;
        dailyMap[item.date] = {
          date: item.date,
          stockPrice: item.close,
          stockReturn: item.change_rate || 0,
          keywordMentions: 0,
          correlation: null, // 추후 계산
        };
      });
      // 뉴스 날짜별 카운트
      newsArr.forEach((news) => {
        const d = news.date ? news.date.slice(0, 10) : null;
        if (d && dailyMap[d]) dailyMap[d].keywordMentions += 1;
      });
      // 상관계수 계산 (주가변동률 vs 키워드 언급)
      const dailyList = Object.values(dailyMap).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      const priceArr = dailyList.map((d) => d.stockReturn);
      const kwArr = dailyList.map((d) => d.keywordMentions);
      const correlation = calcCorrelation(priceArr, kwArr);
      // 영향도/수익률 등 임의 계산
      const impact = Math.abs(correlation) * 100;
      const stockReturn =
        priceArr.reduce((a, b) => a + b, 0) / (priceArr.length || 1);
      const keywordMentions = kwArr.reduce((a, b) => a + b, 0);
      setAnalysisResults({
        keyword: searchKeyword,
        stock: selectedStock.name,
        ticker: selectedStock.ticker,
        period: `${selectedPeriod}일`,
        correlation,
        impact,
        stockReturn,
        keywordMentions,
        dailyData: dailyList,
        analysis: {
          summary: `${searchKeyword} 키워드는 ${selectedStock.name} 주가에 ${
            correlation > 0 ? "긍정적" : "부정적"
          }인 영향을 미치고 있습니다.`,
          correlationStrength:
            Math.abs(correlation) > 0.7
              ? "강함"
              : Math.abs(correlation) > 0.4
              ? "보통"
              : "약함",
          recommendation:
            correlation > 0.3
              ? "매수 고려"
              : correlation < -0.3
              ? "매도 고려"
              : "관망",
          riskLevel:
            Math.abs(correlation) > 0.8
              ? "높음"
              : Math.abs(correlation) > 0.5
              ? "보통"
              : "낮음",
        },
      });
    } catch (err) {
      console.error("키워드 분석 중 오류:", err);
      setError("실제 데이터 분석 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 피어슨 상관계수 계산
  function calcCorrelation(arr1, arr2) {
    if (!arr1.length || !arr2.length || arr1.length !== arr2.length) return 0;
    const n = arr1.length;
    const avg1 = arr1.reduce((a, b) => a + b, 0) / n;
    const avg2 = arr2.reduce((a, b) => a + b, 0) / n;
    let num = 0,
      den1 = 0,
      den2 = 0;
    for (let i = 0; i < n; i++) {
      num += (arr1[i] - avg1) * (arr2[i] - avg2);
      den1 += (arr1[i] - avg1) ** 2;
      den2 += (arr2[i] - avg2) ** 2;
    }
    return den1 && den2 ? num / Math.sqrt(den1 * den2) : 0;
  }

  // 키보드 이벤트 처리
  const handleKeyDown = (e) => {
    if (!showKeywordSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleKeywordAnalysis();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < keywordSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && keywordSuggestions[selectedIndex]) {
          setKeyword(keywordSuggestions[selectedIndex]);
          setShowKeywordSuggestions(false);
          setSelectedIndex(-1);
          handleKeywordAnalysis();
        } else {
          handleKeywordAnalysis();
        }
        break;
      case "Escape":
        setShowKeywordSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 입력 변경 처리
  const handleInputChange = (e) => {
    const value = e.target.value;
    setKeyword(value);
    setShowKeywordSuggestions(value.trim().length > 0);
    setError(null);
    setSelectedIndex(-1);
  };

  // 제안 클릭 처리
  const handleSuggestionClick = (suggestion) => {
    setKeyword(suggestion);
    setShowKeywordSuggestions(false);
    setSelectedIndex(-1);
    handleKeywordAnalysis();
  };

  // 클리어 처리
  const handleClear = () => {
    setKeyword("");
    setAnalysisResults(null);
    keywordInputRef.current?.focus();
    setError(null);
  };

  // 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        keywordInputRef.current &&
        !keywordInputRef.current.contains(event.target)
      ) {
        setShowKeywordSuggestions(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedStock?.name} 키워드 분석
                </h2>
                <p className="text-sm text-gray-600">
                  키워드와 주가 상관관계 분석
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 키워드 검색 */}
          <div className="relative">
            <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <div className="flex-shrink-0 pl-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={keywordInputRef}
                type="text"
                value={keyword}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="분석할 키워드를 입력하세요 (예: 환율, 금리, 원유...)"
                className="flex-1 px-3 py-3 text-gray-900 placeholder-gray-500 bg-transparent border-0 focus:outline-none focus:ring-0"
              />
              {keyword && (
                <button
                  onClick={handleClear}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-5 w-5"
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
              )}
              <button
                onClick={handleKeywordAnalysis}
                disabled={isLoading || !keyword.trim()}
                className="flex-shrink-0 px-4 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <SearchLoadingSpinner /> : "분석"}
              </button>
            </div>

            {/* 키워드 제안 목록 */}
            {showKeywordSuggestions && keywordSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {keywordSuggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    ref={(el) => (suggestionRefs.current[index] = el)}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                      index === selectedIndex
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : ""
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 기간 선택 */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              분석 기간:
            </span>
            <div className="flex gap-2">
              {[
                { value: "7", label: "7일" },
                { value: "30", label: "30일" },
                { value: "90", label: "90일" },
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedPeriod === period.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* 분석 결과 */}
          {analysisResults && (
            <div className="space-y-6">
              {/* 요약 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      상관계수
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {analysisResults.correlation.toFixed(3)}
                  </div>
                  <div className="text-xs text-blue-600">
                    {analysisResults.analysis.correlationStrength}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      영향도
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {analysisResults.impact.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-600">키워드 영향력</div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                      주가 수익률
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      analysisResults.stockReturn >= 0
                        ? "text-green-900"
                        : "text-red-900"
                    }`}
                  >
                    {analysisResults.stockReturn >= 0 ? "+" : ""}
                    {analysisResults.stockReturn.toFixed(2)}%
                  </div>
                  <div className="text-xs text-purple-600">기간 내 수익률</div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">
                      키워드 언급
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-orange-900">
                    {analysisResults.keywordMentions.toLocaleString()}
                  </div>
                  <div className="text-xs text-orange-600">총 언급 횟수</div>
                </div>
              </div>

              {/* 분석 요약 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  분석 요약
                </h3>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    {analysisResults.analysis.summary}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      상관관계: {analysisResults.analysis.correlationStrength}
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                      추천: {analysisResults.analysis.recommendation}
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      위험도: {analysisResults.analysis.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* 차트 영역 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  일별 추이
                </h3>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>차트 영역 (실제 구현 시 Chart.js 또는 Recharts 사용)</p>
                    <p className="text-sm mt-1">
                      주가와 키워드 언급 추이를 시각화
                    </p>
                  </div>
                </div>
              </div>

              {/* 상세 데이터 테이블 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  상세 데이터
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3">날짜</th>
                        <th className="text-right py-2 px-3">주가</th>
                        <th className="text-right py-2 px-3">수익률(%)</th>
                        <th className="text-right py-2 px-3">키워드 언급</th>
                        <th className="text-right py-2 px-3">상관계수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResults.dailyData
                        .slice(-10)
                        .map((data, index) => (
                          <tr
                            key={index}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-2 px-3 text-gray-600">
                              {data.date}
                            </td>
                            <td className="py-2 px-3 text-right font-medium">
                              {data.stockPrice.toLocaleString()}원
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-medium ${
                                data.stockReturn >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {data.stockReturn >= 0 ? "+" : ""}
                              {data.stockReturn.toFixed(2)}%
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {data.keywordMentions.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-600">
                              {data.correlation !== null &&
                              data.correlation !== undefined
                                ? data.correlation.toFixed(3)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 사용법 안내 */}
          {!analysisResults && (
            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <div className="font-medium mb-1">사용법:</div>
              <div>1. 분석할 키워드(예: "환율", "금리")를 입력</div>
              <div>2. 분석 기간을 선택 (7일, 30일, 90일)</div>
              <div>3. "분석" 버튼을 클릭하여 상관관계 및 영향도 확인</div>
              <div>4. 차트와 상세 데이터로 키워드와 주가의 관계 분석</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockKeywordAnalysis;
