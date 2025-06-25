"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import FinanceHeader from "../components/FinanceHeader";

const StockChart = dynamic(() => import("../components/StockChartClient"), { ssr: false });
const CandleChart = dynamic(() => import("../components/CandleChartClient"), { ssr: false });
const SearchBar = dynamic(() => import("../components/SearchBar"), { ssr: false });
const NewsPanel = dynamic(() => import("../components/NewsPanel"), { ssr: false });

export default function Page() {
  const [ticker, setTicker] = useState("000660");
  const [tickerName, setTickerName] = useState("SK하이닉스");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [chartType, setChartType] = useState("line"); // "line" or "candle"
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    // ticker가 바뀔 때마다 ticker_map.json에서 종목명 조회
    async function fetchName() {
      try {
        const res = await fetch("/ticker_map.json");
        const map = await res.json();
        const found = map.find(item => item.ticker === ticker);
        setTickerName(found ? found.name : "");
      } catch {
        setTickerName("");
      }
    }
    fetchName();
  }, [ticker]);

  useEffect(() => {
    fetch("/stock_data.json")
      .then(res => res.json())
      .then(data => setStockData(data));
  }, [ticker]);

  // 뉴스 데이터는 임의 더미로, 실제 구현시 API 연동
  const getNewsForDate = (date) => {
    if (!date) return { companyNews: [], macroNews: [] };
    // 임의 더미
    return {
      companyNews: ["임의 기업 뉴스 상세"],
      macroNews: ["임의 거시 뉴스 상세"]
    };
  };

  // 뉴스 더보기 클릭 시 뉴스 객체를 찾아서 넘기는 핸들러
  const handleShowNews = (date) => {
    const found = stockData.find(d => d.date === date);
    setSelectedNews(found || null);
    setSelectedDate(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FinanceHeader ticker={ticker} setTicker={setTicker} tickerName={tickerName} />
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* 차트 타입 선택 UI */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setChartType("line")}
            className={`px-4 py-2 rounded-md font-semibold border transition-colors ${chartType === "line" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
          >
            선차트
          </button>
          <button
            onClick={() => setChartType("candle")}
            className={`px-4 py-2 rounded-md font-semibold border transition-colors ${chartType === "candle" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"}`}
          >
            캔들차트
          </button>
        </div>
        <div className="flex gap-6 mt-6">
          <div className="flex-1">
            {chartType === "line" ? (
              <StockChart ticker={ticker} tickerName={tickerName} stockData={stockData} onShowNews={handleShowNews} />
            ) : (
              <CandleChart ticker={ticker} tickerName={tickerName} stockData={stockData} onShowNews={d => { setSelectedNews(d); setSelectedDate(null); }} />
            )}
          </div>
          <div className="w-96">
            <NewsPanel news={selectedNews} />
          </div>
        </div>
      </div>
    </div>
  );
}
