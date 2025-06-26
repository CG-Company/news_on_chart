"use client";
import React, { useEffect, useState } from "react";
import ApexChart from "react-apexcharts";

console.log("🎬 StockChartClient mounted");

function StockChart({ ticker, tickerName, onShowNews }) {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(`🚀 Fetching /api/stock?ticker=${ticker}`); // ← 추가
    fetch(`/api/stock?ticker=${ticker}`)
      .then((res) => {
        console.log("↩️ response status:", res.status); // ← 추가
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("📊 stock data:", data); // ← 추가
        const series = data.prices.map((d) => ({
          x: new Date(d.price_date),
          y: d.close_price,
        }));
        setStockData(series);
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) return <div>Loading chart…</div>;

  return (
    <ApexChart
      type="candlestick"
      series={[{ data: stockData }]}
      options={{
        chart: {
          id: "stock-chart",
          events: {
            dataPointMouseEnter: (_, __, { dataPointIndex }) => {
              const date = stockData[dataPointIndex].x
                .toISOString()
                .slice(0, 10);
              onShowNews(ticker, date);
            },
          },
        },
        xaxis: { type: "datetime" },
      }}
      height={350}
    />
  );
}

export default StockChart;
