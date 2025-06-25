"use client";
import { useRef, useEffect, useMemo, useState } from "react";
import ApexChart from "react-apexcharts";
import { createPortal } from 'react-dom';
import NewsTooltip from './NewsTooltip';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function CandleChart({ ticker, tickerName, stockData, onShowNews }) {
  const wrapperRef = useRef();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [fixedIndex, setFixedIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [fixedTooltipPos, setFixedTooltipPos] = useState(null);

  // 외부 클릭 시 고정 해제
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFixedIndex(null);
        setFixedTooltipPos(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const candleData = useMemo(() => stockData.map(d => ({
    x: d.date,
    y: [d.open, d.high, d.low, d.close],
    companyNews: d.companyNews || [],
    macroNews: d.macroNews || [],
  })), [stockData]);

  const tooltipIndex = fixedIndex ?? hoverIndex;
  const tooltipPos = fixedTooltipPos ?? mousePos;

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
      events: {
        dataPointMouseEnter: (event, _, config) => {
          if (fixedIndex === null) {
            setTimeout(() => setHoverIndex(config.dataPointIndex), 0);
          }
        },
        dataPointMouseLeave: () => {
          if (fixedIndex === null) {
            setTimeout(() => setHoverIndex(null), 0);
          }
        },
        mouseMove: (event) => {
          setMousePos({ x: event.clientX, y: event.clientY });
        },
        dataPointSelection: (_, __, config) => {
          setTimeout(() => {
            setFixedIndex(config.dataPointIndex);
            setHoverIndex(null);
            setFixedTooltipPos({ x: mousePos.x, y: mousePos.y });
          }, 0);
        },
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
      enabled: false,
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 2,
    },
    colors: ["#6366f1"],
  }), [candleData, fixedIndex]);

  // 툴팁 포탈 렌더링
  let tooltipPortal = null;
  const d = tooltipIndex !== null && candleData[tooltipIndex] ? candleData[tooltipIndex] : null;
  if ((hoverIndex !== null || fixedIndex !== null) && d && tooltipPos && typeof window !== 'undefined' && document.body) {
    tooltipPortal = createPortal(
      <div style={{ position: "fixed", left: tooltipPos.x + 16, top: tooltipPos.y - 40, zIndex: 20, pointerEvents: "auto" }}>
        <NewsTooltip
          data={[{ raw: { y: d.y[3] } }]}
          companyNews={d.companyNews}
          macroNews={d.macroNews}
          onShowNews={() => onShowNews(d)}
          date={d.x}
          onLock={null}
        />
      </div>,
      document.body
    );
  }

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
        {candleData.length > 0 && tooltipPortal}
      </div>
    </div>
  );
}

export default CandleChart; 