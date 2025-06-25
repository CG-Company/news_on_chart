"use client";
import { useRef, useEffect, useMemo, useState } from "react";
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
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import * as ReactDOM from 'react-dom/client';
import NewsTooltip from '../components/NewsTooltip';

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

function StockChart({ ticker, tickerName, stockData, onShowNews }) {
  const chartRef = useRef();
  const [tooltipLocked, setTooltipLocked] = useState(false);
  const [lockedTooltipData, setLockedTooltipData] = useState(null);
  const lastTooltipRef = useRef(null); // 마지막 툴팁 데이터 추적

  useEffect(() => {
    // 차트 외부 클릭 시 툴팁 고정 해제
    function handleDocumentClick(e) {
      const tooltipEl = document.querySelector('.custom-tooltip');
      if (tooltipLocked && tooltipEl && !tooltipEl.contains(e.target)) {
        setTooltipLocked(false);
        setLockedTooltipData(null);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [tooltipLocked]);

  const chartData = useMemo(() => ({
    labels: stockData.map(d => d.date),
    datasets: [{
      label: "종가",
      data: stockData.map(d => ({
        x: d.date,
        y: d.close,
        companyNews: d.companyNews || [],
        macroNews: d.macroNews || []
      })),
      borderColor: "#6366f1",      // 선 색상 (보라)
      backgroundColor: "#6366f1",  // 점 색상
      borderWidth: 3,               // 선 두께
      pointRadius: 0,               // 점 크기(항상 숨김)
      pointHoverRadius: 5,          // hover 시 점 크기
      pointBackgroundColor: "#6366f1", // 점 색상
      tension: 0,                   // 각진(직선) 선
      fill: false,                  // 영역 채우기 여부(false: 라인차트)
    }]
  }), [stockData]);

  function externalTooltipHandler(context) {
    const { chart, tooltip } = context;
    let tooltipEl = chart.canvas.parentNode.querySelector('.custom-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'custom-tooltip';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.pointerEvents = 'auto';
      chart.canvas.parentNode.appendChild(tooltipEl);
    }

    // 툴팁 고정 상태면 lockedTooltipData로 렌더링
    if (tooltipLocked && lockedTooltipData) {
      tooltipEl.style.opacity = 1;
      tooltipEl.style.left = lockedTooltipData.left;
      tooltipEl.style.top = lockedTooltipData.top;
      if (!tooltipEl._root) {
        tooltipEl._root = ReactDOM.createRoot(tooltipEl);
      }
      tooltipEl._root.render(
        <NewsTooltip
          data={lockedTooltipData.data}
          companyNews={lockedTooltipData.companyNews}
          macroNews={lockedTooltipData.macroNews}
          onShowNews={lockedTooltipData.onShowNews}
          date={lockedTooltipData.date}
          onLock={null}
        />
      );
      return;
    }

    if (tooltip.opacity === 0) {
      tooltipEl.style.opacity = 0;
      lastTooltipRef.current = null;
      return;
    }
    tooltipEl.style.opacity = 1;
    tooltipEl.style.left = chart.canvas.offsetLeft + tooltip.caretX + 'px';
    tooltipEl.style.top = chart.canvas.offsetTop + tooltip.caretY + 'px';

    if (!tooltipEl._root) {
      tooltipEl._root = ReactDOM.createRoot(tooltipEl);
    }
    const dataIndex = tooltip.dataPoints[0]?.dataIndex;
    const dataItem = chart.data.datasets[0].data[dataIndex];
    const companyNews = dataItem?.companyNews || [];
    const macroNews = dataItem?.macroNews || [];
    const date = tooltip.dataPoints[0]?.label;

    // 마지막 툴팁 데이터 추적
    lastTooltipRef.current = {
      data: tooltip.dataPoints,
      companyNews,
      macroNews,
      date,
      left: tooltipEl.style.left,
      top: tooltipEl.style.top,
      onShowNews: () => onShowNews(dataItem)
    };

    tooltipEl._root.render(
      <NewsTooltip
        data={tooltip.dataPoints}
        companyNews={companyNews}
        macroNews={macroNews}
        onShowNews={() => onShowNews(dataItem)}
        date={date}
        onLock={null}
      />
    );
  }

  // 차트(canvas) 클릭 시 툴팁 고정
  useEffect(() => {
    const chart = chartRef.current && chartRef.current.canvas ? chartRef.current : null;
    function handleChartClick(e) {
      if (lastTooltipRef.current) {
        setTooltipLocked(true);
        setLockedTooltipData({ ...lastTooltipRef.current });
      }
    }
    if (chartRef.current && chartRef.current.canvas) {
      chartRef.current.canvas.addEventListener('click', handleChartClick);
    }
    return () => {
      if (chartRef.current && chartRef.current.canvas) {
        chartRef.current.canvas.removeEventListener('click', handleChartClick);
      }
    };
  }, []);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
        external: externalTooltipHandler,
        mode: "nearest",
        intersect: false,
      },
      zoom: {
        pan: {
          enabled: true,
          mode: "x",
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: "x",
        },
        limits: {
          x: { minRange: 1 },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          tooltipFormat: "yyyy-MM-dd",
          displayFormats: {
            day: "yyyy-MM-dd",
          },
        },
        grid: {
          display: false,
        },
        ticks: {
          color: "#6366f1",
          font: { size: 14, family: "inherit" },
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: "#e5e7eb",
        },
        ticks: {
          color: "#6366f1",
          font: { size: 14, family: "inherit" },
          callback: function(value) {
            return value.toLocaleString();
          },
        },
      },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
  }), [onShowNews, externalTooltipHandler]);

  useEffect(() => {
    return () => {
      const tooltipEl = document.getElementById("chartjs-tooltip");
      if (tooltipEl) tooltipEl.remove();
    };
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
      {/* 종목 정보 표시 */}
      {ticker && tickerName && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 font-mono tracking-widest">{ticker} · KRX</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{tickerName}</div>
        </div>
      )}
      <div style={{ width: "100%", height: 350, position: "relative" }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}

export default StockChart; 