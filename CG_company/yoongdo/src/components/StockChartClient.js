"use client";
import React, { useEffect, useState } from "react";
import ApexChart from "react-apexcharts";

function StockChart({ ticker, tickerName, onShowNews }) {
  const [stockData, setStockData] = useState([]);

  useEffect(() => {
    fetch(`http://192.168.1.136:8000/api/stock?ticker=${ticker}`)
      .then((res) => res.json())
      .then((data) => setStockData(data));
  }, [ticker]);

  // ApexCharts용 캔들차트 데이터 변환
  const candleData = stockData.map((d) => ({
    x: d.date,
    y: [d.open, d.high, d.low, d.close],
    companyNews: d.companyNews || [],
    macroNews: d.macroNews || [],
  }));

  const options = {
    chart: {
      type: "candlestick",
      height: 350,
      toolbar: { show: false },
    },
    title: {
      text: "주가 캔들차트 & 뉴스 요약",
      align: "left",
      style: { fontSize: "18px", fontWeight: "bold" },
    },
    xaxis: {
      type: "category",
      labels: {
        rotate: -45,
        style: { fontSize: "13px" },
      },
    },
    yaxis: {
      tooltip: { enabled: true },
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const d = candleData[dataPointIndex];
        let newsHtml = "";
        if (
          (d.companyNews && d.companyNews.length > 0) ||
          (d.macroNews && d.macroNews.length > 0)
        ) {
          newsHtml = `<div style='margin-top:8px;font-weight:bold;'>뉴스 요약</div>`;
          if (d.companyNews && d.companyNews.length > 0) {
            newsHtml += d.companyNews
              .map(
                (item) =>
                  `<div style='margin-bottom:4px;'><span style='font-weight:600;'>기업</span>: ${item}</div>`
              )
              .join("");
          }
          if (d.macroNews && d.macroNews.length > 0) {
            newsHtml += d.macroNews
              .map(
                (item) =>
                  `<div style='margin-bottom:4px;'><span style='font-weight:600;'>거시</span>: ${item}</div>`
              )
              .join("");
          }
        } else {
          newsHtml = `<div style='color:#888;margin-top:8px;'>뉴스 없음</div>`;
        }
        return `<div style='padding:8px 12px;'>
          <div style='font-weight:bold;margin-bottom:4px;'>${d.x}</div>
          <div>시가: <b>${d.y[0]}</b></div>
          <div>고가: <b>${d.y[1]}</b></div>
          <div>저가: <b>${d.y[2]}</b></div>
          <div>종가: <b>${d.y[3]}</b></div>
          ${newsHtml}
        </div>`;
      },
    },
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
      {/* 종목 정보 표시 */}
      {ticker && tickerName && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 font-mono tracking-widest">
            {ticker} · KRX
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {tickerName}
          </div>
        </div>
      )}
      <ApexChart
        options={options}
        series={[{ data: candleData }]}
        type="candlestick"
        height={350}
      />
    </div>
  );
}

export default StockChart;
