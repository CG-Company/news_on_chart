"use client";
import { useRef, useEffect, useMemo, useState } from "react";
import ApexChart from "react-apexcharts";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function CandleChart({ ticker, tickerName, stockData, onShowNews }) {
  const wrapperRef = useRef();
  const lastTooltipIndexRef = useRef(null); // 마지막 툴팁 인덱스 추적

  const candleData = useMemo(() => stockData.map(d => ({
    x: d.date,
    y: [d.open, d.high, d.low, d.close],
    companyNews: d.companyNews || [],
    macroNews: d.macroNews || [],
  })), [stockData]);

  // Tab 키로 뉴스 상세 패널 이동
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab' && lastTooltipIndexRef.current !== null) {
        const d = candleData[lastTooltipIndexRef.current];
        if (d) {
          e.preventDefault(); // Tab 이동 방지
          onShowNews(d);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [candleData, onShowNews]);

  // 커스텀 툴팁에서 window 이벤트로 상세 패널 띄우기
  useEffect(() => {
    const handler = (e) => {
      onShowNews(e.detail);
    };
    window.addEventListener('showNewsPanel', handler);
    return () => window.removeEventListener('showNewsPanel', handler);
  }, [onShowNews]);

  const chartOptions = useMemo(() => ({
    chart: {
      type: "candlestick",
      height: 350,
      toolbar: { show: false },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
    },
    xaxis: {
      type: "category",
      labels: {
        style: { colors: "#6366f1", fontSize: "14px", fontFamily: "inherit" },
        formatter: (val) => formatDate(val),
      },
    },
    yaxis: {
      labels: {
        style: { colors: "#6366f1", fontSize: "14px", fontFamily: "inherit" },
        formatter: (val) => val.toLocaleString(),
      },
      tooltip: { enabled: false },
    },
    tooltip: {
      enabled: true,
      custom: function({ series, seriesIndex, dataPointIndex, w }) {
        // 마지막 툴팁 인덱스 추적
        if (typeof dataPointIndex === 'number') {
          lastTooltipIndexRef.current = dataPointIndex;
        }
        if (seriesIndex === undefined || dataPointIndex === undefined) return '';
        const d = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
        if (!d) return '';
        return `
          <div style="padding:12px;min-width:200px;max-width:300px;background:#fff;border-radius:8px;box-shadow:0 2px 8px #0001;">
            <div style="font-weight:bold;font-size:16px;margin-bottom:4px;">${d.x}</div>
            <div style="font-size:13px;margin-bottom:8px;">종가: ${d.y[3].toLocaleString()}</div>
            <div style="font-size:12px;margin-bottom:4px;color:#2563eb;font-weight:bold;">[기업 뉴스]</div>
            <div style="font-size:12px;margin-bottom:8px;">${d.companyNews.length > 0 ? d.companyNews.map(n => `<div>${n}</div>`).join('') : '기업 뉴스 없음'}</div>
            <div style="font-size:12px;margin-bottom:4px;color:#2563eb;font-weight:bold;">[거시 뉴스]</div>
            <div style="font-size:12px;margin-bottom:8px;">${d.macroNews.length > 0 ? d.macroNews.map(n => `<div>${n}</div>`).join('') : '거시 뉴스 없음'}</div>
            <button style="width:100%;padding:6px 0;background:#2563eb;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:bold;cursor:pointer;" onclick="window.dispatchEvent(new CustomEvent('showNewsPanel', { detail: ${JSON.stringify(d)} }))">뉴스 더보기</button>
          </div>
        `;
      }
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 2,
    },
    colors: ["#6366f1"],
  }), [candleData, onShowNews]);

  return (
    <div ref={wrapperRef} className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6" style={{ position: "relative" }}>
      {/* 종목 정보 표시 */}
      {ticker && tickerName && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 font-mono tracking-widest">{ticker} · KRX</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{tickerName}</div>
        </div>
      )}
      <div style={{ width: "100%", height: 350, position: "relative" }}>
        {candleData.length > 0 && (
          <ApexChart
            options={chartOptions}
            series={[{ data: candleData }]}
            type="candlestick"
            height={350}
          />
        )}
      </div>
    </div>
  );
}

export default CandleChart; 