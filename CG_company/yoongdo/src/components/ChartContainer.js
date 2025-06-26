// components/ChartContainer.js (통합된 차트 컨테이너)
"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import ApexChart from "react-apexcharts";
import { createPortal } from "react-dom";
import NewsTooltip from "./NewsTooltip";
import { fetchStock } from "../utils/api";
import CandleChartClient from "./CandleChartClient";
import { getElementAtEvent } from "react-chartjs-2";

// Chart.js imports
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "chartjs-adapter-date-fns";
import * as ReactDOM from "react-dom/client";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  Filler,
  CategoryScale,
  zoomPlugin
);

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

const ChartContainer = ({ ticker, tickerName, onShowNews, newsData }) => {
  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("1M");
  const [data, setData] = useState([]);

  // Line Chart 상태
  const chartRef = useRef();
  const lastTooltipRef = useRef(null);

  // Candle Chart 상태
  const wrapperRef = useRef();
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const timeRanges = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "All"];

  // 현재가 및 변동률 계산
  const currentData = useMemo(() => {
    if (!data || data.length === 0) return null;
    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : latest;
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;
    return { latest, change, changePercent };
  }, [data]);

  // === LINE CHART 로직 ===
  const chartData = useMemo(
    () => ({
      labels: data.map((d) => d.date),
      datasets: [
        {
          label: "종가",
          data: data.map((d) => ({
            x: d.date,
            y: d.close,
            companyNews: d.companyNews || [],
            macroNews: d.macroNews || [],
          })),
          borderColor: "#06b6d4",
          backgroundColor: "#06b6d4",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#06b6d4",
          tension: 0.1,
          fill: false,
        },
      ],
    }),
    [data]
  );

  function externalTooltipHandler(context) {
    const { chart, tooltip } = context;
    let tooltipEl = chart.canvas.parentNode.querySelector(".custom-tooltip");
    if (!tooltipEl) {
      tooltipEl = document.createElement("div");
      tooltipEl.className = "custom-tooltip";
      tooltipEl.style.position = "absolute";
      tooltipEl.style.pointerEvents = "auto";
      tooltipEl.style.zIndex = "1000";
      chart.canvas.parentNode.appendChild(tooltipEl);
    }

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      lastTooltipRef.current = null;
      return;
    }

    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = chart.canvas.offsetLeft + tooltip.caretX + "px";
    tooltipEl.style.top = chart.canvas.offsetTop + tooltip.caretY - 20 + "px";

    if (!tooltipEl._root) {
      tooltipEl._root = ReactDOM.createRoot(tooltipEl);
    }
    const dataIndex = tooltip.dataPoints[0]?.dataIndex;
    const dataItem = chart.data.datasets[0].data[dataIndex];
    const date = tooltip.dataPoints[0]?.label;

    // 날짜별 뉴스 추출
    let companyNews = [];
    let macroNews = [];
    if (newsData && Array.isArray(newsData)) {
      const newsForDate = newsData.filter(
        (n) => (n.published_at || "").slice(0, 10) === date
      );
      companyNews = newsForDate.map((n) => n.title); // 또는 n.summary 등 원하는 필드
      // macroNews는 별도 분류가 없으므로 빈 배열로 둠
    } else {
      companyNews = dataItem?.companyNews || [];
      macroNews = dataItem?.macroNews || [];
    }

    lastTooltipRef.current = {
      data: tooltip.dataPoints,
      companyNews,
      macroNews,
      date,
      left: tooltipEl.style.left,
      top: tooltipEl.style.top,
      onShowNews: () => onShowNews(dataItem.x),
    };

    tooltipEl._root.render(
      <NewsTooltip
        data={tooltip.dataPoints}
        companyNews={companyNews}
        macroNews={macroNews}
        onShowNews={() => onShowNews(dataItem.x)}
        date={date}
      />
    );
  }

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: externalTooltipHandler,
          mode: "nearest",
          intersect: false,
        },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
          limits: { x: { minRange: 1 } },
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
            tooltipFormat: "yyyy-MM-dd",
            displayFormats: { day: "yyyy-MM-dd" },
          },
          grid: { display: false },
          ticks: {
            color: "#64748b",
            font: { size: 12, family: "inherit" },
          },
        },
        y: {
          beginAtZero: false,
          grid: { color: "#f1f5f9" },
          ticks: {
            color: "#64748b",
            font: { size: 12, family: "inherit" },
            callback: function (value) {
              return value.toLocaleString();
            },
          },
        },
      },
      interaction: { mode: "nearest", intersect: false },
    }),
    [onShowNews]
  );

  // === CANDLE CHART 로직 ===
  const candleData = useMemo(
    () =>
      data.map((d) => ({
        x: d.date,
        y: [d.open, d.high, d.low, d.close],
        companyNews: d.companyNews || [],
        macroNews: d.macroNews || [],
      })),
    [data]
  );

  const candleOptions = useMemo(
    () => ({
      chart: {
        type: "candlestick",
        height: 400,
        toolbar: { show: false },
        zoom: { enabled: true, type: "x", autoScaleYaxis: true },
        events: {
          dataPointMouseEnter: (event, _, config) => {
            setTimeout(() => setHoverIndex(config.dataPointIndex), 0);
          },
          dataPointMouseLeave: () => {
            setTimeout(() => setHoverIndex(null), 0);
          },
          mouseMove: (event) => {
            setMousePos({ x: event.clientX, y: event.clientY });
          },
          doubleClick: () => {
            if (hoverIndex !== null) {
              const d = candleData[hoverIndex];
              if (d) onShowNews(d.x);
            }
          },
          mouseLeave: () => {
            setHoverIndex(null);
          },
        },
      },
      xaxis: {
        type: "category",
        labels: {
          style: { colors: "#64748b", fontSize: "12px", fontFamily: "inherit" },
          formatter: (val) => formatDate(val),
        },
      },
      yaxis: {
        labels: {
          style: { colors: "#64748b", fontSize: "12px", fontFamily: "inherit" },
          formatter: (val) => val.toLocaleString(),
        },
        tooltip: { enabled: false },
      },
      tooltip: { enabled: false },
      grid: { borderColor: "#f1f5f9", strokeDashArray: 2 },
      colors: ["#06b6d4"],
    }),
    [candleData]
  );

  // 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chartType === "line") {
        const tooltipEl = document.querySelector(".custom-tooltip");
        // 툴크 고정 관련 코드 제거
      } else {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
          setHoverIndex(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chartType]);

  // Line Chart 더블클릭 처리
  useEffect(() => {
    if (chartType === "line") {
      function handleChartDoubleClick(e) {
        if (
          lastTooltipRef.current &&
          lastTooltipRef.current.data &&
          lastTooltipRef.current.data[0]
        ) {
          onShowNews(lastTooltipRef.current.data[0].x);
        }
      }
      if (chartRef.current && chartRef.current.canvas) {
        chartRef.current.canvas.addEventListener(
          "dblclick",
          handleChartDoubleClick
        );
      }
      return () => {
        if (chartRef.current && chartRef.current.canvas) {
          chartRef.current.canvas.removeEventListener(
            "dblclick",
            handleChartDoubleClick
          );
        }
      };
    }
  }, [chartType]);

  // 캔들차트 더블클릭: 캔들 위에서만 뉴스패널 업데이트
  useEffect(() => {
    if (chartType === "candle" && wrapperRef.current) {
      const handleDoubleClick = () => {
        if (hoverIndex !== null) {
          const d = candleData[hoverIndex];
          if (d) onShowNews(d.x);
        }
      };
      const el = wrapperRef.current;
      el.addEventListener("dblclick", handleDoubleClick);
      return () => el.removeEventListener("dblclick", handleDoubleClick);
    }
  }, [chartType, hoverIndex, candleData, onShowNews]);

  // Candle Chart 툴크 렌더링
  const tooltipIndex = hoverIndex;
  const tooltipPos = mousePos;
  let candleTooltipPortal = null;

  // 캔들차트 호버 시 해당 날짜의 뉴스 전달
  useEffect(() => {
    if (
      chartType === "candle" &&
      hoverIndex !== null &&
      candleData[hoverIndex]
    ) {
      const d = candleData[hoverIndex];
      if (d && d.x) {
        onShowNews(d.x);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, hoverIndex]);

  if (chartType === "candle") {
    const d =
      tooltipIndex !== null && candleData[tooltipIndex]
        ? candleData[tooltipIndex]
        : null;
    if (
      hoverIndex !== null &&
      d &&
      tooltipPos &&
      typeof window !== "undefined" &&
      document.body
    ) {
      // 날짜별 뉴스 추출
      let companyNews = [];
      let macroNews = [];
      if (newsData && Array.isArray(newsData)) {
        const newsForDate = newsData.filter(
          (n) => (n.published_at || "").slice(0, 10) === d.x
        );
        companyNews = newsForDate.map((n) => n.title);
      } else {
        companyNews = d.companyNews || [];
        macroNews = d.macroNews || [];
      }
      candleTooltipPortal = createPortal(
        <div
          style={{
            position: "fixed",
            left: tooltipPos.x + 16,
            top: tooltipPos.y - 40,
            zIndex: 1000,
            pointerEvents: "auto",
          }}
        >
          <NewsTooltip
            data={[{ raw: { y: d.y[3] } }]}
            companyNews={companyNews}
            macroNews={macroNews}
            onShowNews={() => onShowNews(d.x)}
            date={d.x}
          />
        </div>,
        document.body
      );
    }
  }

  useEffect(() => {
    if (ticker) fetchStock(ticker).then(setData);
  }, [ticker]);

  // 차트 호버 시 해당 날짜를 상위로 전달 (getElementAtEvent 사용)
  const handleLineChartHover = (event) => {
    if (!chartRef.current) return;
    const elements = getElementAtEvent(chartRef.current, event);
    if (elements && elements.length > 0) {
      const index = elements[0].index;
      const date = chartData.labels[index];
      console.log("Line chart hovered date:", date);
      onShowNews(date);
    }
  };

  if (!data || data.length === 0) return <div>Loading...</div>;
  return (
    <div
      ref={wrapperRef}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      {/* 차트 헤더 */}
      <div className="flex items-center justify-between mb-6">
        {/* 종목 정보 */}
        <div>
          <div className="text-xs text-gray-500 font-medium tracking-wide">
            {ticker} · KRX
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {tickerName}
          </div>
          {currentData && (
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xl font-semibold text-gray-900">
                {currentData.latest.close.toLocaleString()}원
              </span>
              <span
                className={`text-sm font-medium ${
                  currentData.change >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {currentData.change >= 0 ? "+" : ""}
                {currentData.changePercent.toFixed(2)}% (
                {currentData.change >= 0 ? "+" : ""}
                {currentData.change.toLocaleString()}원)
              </span>
            </div>
          )}
        </div>

        {/* 차트 타입 토글 */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType("line")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === "line"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === "candle"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Candle
            </button>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="relative" style={{ height: "400px" }}>
        {data.length > 0 && (
          <>
            {chartType === "line" ? (
              <Line
                ref={chartRef}
                data={chartData}
                options={lineOptions}
                onMouseMove={handleLineChartHover}
              />
            ) : (
              <ApexChart
                options={candleOptions}
                series={[{ data: candleData }]}
                type="candlestick"
                height={400}
              />
            )}
            {chartType === "candle" && candleTooltipPortal}
          </>
        )}
      </div>

      {/* 차트 하단 컨트롤 */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        {/* 기간 선택 탭 */}
        <div className="flex items-center space-x-1">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* 추가 컨트롤들 */}
        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Export"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;
