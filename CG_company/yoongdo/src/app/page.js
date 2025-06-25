"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import FinanceHeader from "../components/FinanceHeader";

const StockChart = dynamic(() => import("../components/StockChartClient"), {
  ssr: false,
});
const SearchBar = dynamic(() => import("../components/SearchBar"), {
  ssr: false,
});
const NewsPanel = dynamic(() => import("../components/NewsPanel"), {
  ssr: false,
});

export default function Page() {
  const [ticker, setTicker] = useState("000660");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  // 뉴스 데이터는 임의 더미로, 실제 구현시 API 연동
  const getNewsForDate = (date) => {
    if (!date) return { companyNews: [], macroNews: [] };
    // 임의 더미
    return {
      companyNews: ["임의 기업 뉴스 상세"],
      macroNews: ["임의 거시 뉴스 상세"],
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <FinanceHeader ticker={ticker} setTicker={setTicker} />
        <div className="flex gap-6 mt-6">
          <div className="flex-1">
            <StockChart ticker={ticker} onShowNews={setSelectedDate} />
          </div>
          <div className="w-96">
            <NewsPanel
              date={selectedDate}
              news={getNewsForDate(selectedDate)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
