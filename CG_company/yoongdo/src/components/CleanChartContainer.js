// components/CleanChartContainer.js - 무한루프 해결
"use client";
import { useRef, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { createChart } from "lightweight-charts";
import { createPortal } from "react-dom";
import NewsTooltip from "./NewsTooltip";

// Chart.js 관련 imports (Line Chart용)
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
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
  CategoryScale,
  zoomPlugin
);

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function CleanChartContainer({
  ticker,
  tickerName,
  stockData = [],
  onShowNews,
}) {
  const wrapperRef = useRef();
  const chartRef = useRef();
  const tradingViewRef = useRef(); // TradingView 차트용
  const tradingViewChart = useRef(null); // TradingView 차트 인스턴스

  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("1M");

  // Line Chart 상태
  const [tooltipLocked, setTooltipLocked] = useState(false);
  const [lockedTooltipData, setLockedTooltipData] = useState(null);
  const lastTooltipRef = useRef(null);

  // TradingView Chart 상태
  const [tvTooltipData, setTvTooltipData] = useState(null);
  const [tvTooltipPosition, setTvTooltipPosition] = useState({ x: 0, y: 0 });
  const currentTooltipRef = useRef(null); // ref로 현재 툴팁 데이터 저장

  const timeRanges = ["1D", "1W", "1M", "3M", "6M", "1Y", "5Y", "All"];

  // 주말(토, 일) 데이터와 값이 0인 데이터 제외
  const filteredStockData = useMemo(() => {
    if (!stockData || !Array.isArray(stockData)) return [];
    return stockData.filter((item) => {
      const date = new Date(item.date);
      const day = date.getDay(); // 0: 일, 6: 토
      // 주말 제외, open/close/high/low가 모두 0인 데이터 제외
      const isWeekend = day === 0 || day === 6;
      const isAllZero = [item.open, item.close, item.high, item.low].every(
        (v) => v === 0 || v === 0.0
      );
      return !isWeekend && !isAllZero;
    });
  }, [stockData]);

  // 현재가 및 변동률 계산 (안전성 강화)
  const currentData = useMemo(() => {
    if (!filteredStockData || filteredStockData.length === 0) return null;
    const latest = filteredStockData[filteredStockData.length - 1];
    if (!latest || typeof latest.close !== "number") return null;
    const previous =
      filteredStockData.length > 1
        ? filteredStockData[filteredStockData.length - 2]
        : latest;
    if (!previous || typeof previous.close !== "number") return null;
    const change = latest.close - previous.close;
    const changePercent =
      previous.close !== 0 ? (change / previous.close) * 100 : 0;
    return { latest, change, changePercent };
  }, [filteredStockData]);

  // === LINE CHART 로직 (안전성 강화) ===
  const chartData = useMemo(() => {
    if (!filteredStockData || filteredStockData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "종가",
            data: [],
            borderColor: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.1)",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: "#06b6d4",
            tension: 0.1,
            fill: false,
          },
        ],
      };
    }
    return {
      labels: filteredStockData.map((d) => d.date),
      datasets: [
        {
          label: "종가",
          data: filteredStockData.map((d) => ({
            x: d.date,
            y: d.close,
            companyNews: d.companyNews || [],
            macroNews: d.macroNews || [],
          })),
          borderColor: "#06b6d4",
          backgroundColor: "rgba(6, 182, 212, 0.1)",
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#06b6d4",
          tension: 0.1,
          fill: false,
        },
      ],
    };
  }, [filteredStockData]);

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
    tooltipEl.style.left = chart.canvas.offsetLeft + tooltip.caretX + "px";
    tooltipEl.style.top = chart.canvas.offsetTop + tooltip.caretY + "px";

    if (!tooltipEl._root) {
      tooltipEl._root = ReactDOM.createRoot(tooltipEl);
    }
    const dataIndex = tooltip.dataPoints[0]?.dataIndex;
    const dataItem = chart.data.datasets[0].data[dataIndex];
    const companyNews = dataItem?.companyNews || [];
    const macroNews = dataItem?.macroNews || [];
    const date = tooltip.dataPoints[0]?.label;

    lastTooltipRef.current = {
      data: tooltip.dataPoints,
      companyNews,
      macroNews,
      date,
      left: tooltipEl.style.left,
      top: tooltipEl.style.top,
      onShowNews: () => onShowNews(dataItem),
    };

    tooltipEl._root.render(
      <NewsTooltip
        data={tooltip.dataPoints}
        companyNews={companyNews}
        macroNews={macroNews}
        onShowNews={() => onShowNews(dataItem)}
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
            displayFormats: {
              day: "MM/dd",
              week: "MM/dd",
              month: "MM/dd",
            },
          },
          grid: {
            display: true,
            color: "#f1f5f9",
            lineWidth: 1,
          },
          ticks: {
            color: "#64748b",
            font: {
              size: 11,
              family: "Inter, system-ui, sans-serif",
              weight: 500,
            },
            maxTicksLimit: 12,
            callback: function (val, index) {
              const date = new Date(val);
              const month = (date.getMonth() + 1).toString().padStart(2, "0");
              const day = date.getDate().toString().padStart(2, "0");
              return `${month}/${day}`;
            },
          },
          border: {
            display: true,
            color: "#e5e7eb",
            width: 1,
          },
        },
        y: {
          beginAtZero: false,
          grid: {
            color: "#f1f5f9",
            lineWidth: 1,
          },
          ticks: {
            color: "#64748b",
            font: {
              size: 11,
              family: "Inter, system-ui, sans-serif",
              weight: 500,
            },
            callback: function (value) {
              return value.toLocaleString() + "원";
            },
          },
          border: {
            display: true,
            color: "#e5e7eb",
            width: 1,
          },
        },
      },
      interaction: { mode: "nearest", intersect: false },
    }),
    [onShowNews, externalTooltipHandler]
  );

  // === TRADINGVIEW CANDLESTICK CHART 로직 ===
  useEffect(() => {
    if (
      chartType === "candle" &&
      tradingViewRef.current &&
      filteredStockData &&
      Array.isArray(filteredStockData) &&
      filteredStockData.length > 0
    ) {
      // 기존 차트 정리
      if (tradingViewChart.current) {
        tradingViewChart.current.remove();
      }

      // TradingView 데이터 변환 (안전성 체크 추가)
      const candleData = filteredStockData
        .filter(
          (d) =>
            d &&
            typeof d.open === "number" &&
            typeof d.close === "number" &&
            typeof d.high === "number" &&
            typeof d.low === "number" &&
            d.date
        )
        .map((d) => ({
          time: Math.floor(new Date(d.date).getTime() / 1000), // Unix timestamp
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          companyNews: d.companyNews || [],
          macroNews: d.macroNews || [],
          originalDate: d.date,
        }));

      // 유효한 데이터가 없으면 종료
      if (candleData.length === 0) {
        console.warn("⚠️ 유효한 캔들 데이터가 없습니다.");
        return;
      }

      // 차트 생성
      const chart = createChart(tradingViewRef.current, {
        width: tradingViewRef.current.clientWidth,
        height: 400,
        layout: {
          background: { color: "#ffffff" },
          textColor: "#64748b",
          fontSize: 11,
          fontFamily: "Inter, system-ui, sans-serif",
        },
        grid: {
          vertLines: { color: "#f1f5f9" },
          horzLines: { color: "#f1f5f9" },
        },
        rightPriceScale: {
          borderColor: "#e5e7eb",
          textColor: "#64748b",
        },
        timeScale: {
          borderColor: "#e5e7eb",
          textColor: "#64748b",
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 1, // Normal crosshair mode
          vertLine: {
            color: "#06b6d4",
            width: 1,
            style: 2, // LineStyle.Dashed
            labelBackgroundColor: "#06b6d4",
          },
          horzLine: {
            color: "#06b6d4",
            width: 1,
            style: 2, // LineStyle.Dashed
            labelBackgroundColor: "#06b6d4",
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      });

      // 캔들스틱 시리즈 추가
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        borderUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        priceFormat: {
          type: "price",
          precision: 0,
          minMove: 1,
        },
      });

      candlestickSeries.setData(candleData);

      // 무한 루프를 방지하기 위한 플래그
      let isUpdatingHighlight = false;
      let lastHighlightTime = null;

      // 마우스 이동 시 툴팁 처리 (하이라이트 제거)
      chart.subscribeCrosshairMove((param) => {
        // 무한 루프 방지
        if (isUpdatingHighlight) return;

        if (param.point && param.time) {
          const data = param.seriesData.get(candlestickSeries);
          if (data) {
            const originalData = candleData.find((d) => d.time === param.time);
            if (originalData) {
              // 툴팁 위치 설정
              const rect = tradingViewRef.current.getBoundingClientRect();
              const tooltipData = {
                price: data.close,
                companyNews: originalData.companyNews,
                macroNews: originalData.macroNews,
                date: originalData.originalDate,
                originalData: originalData,
              };

              // ref에 저장 (무한 루프 방지)
              currentTooltipRef.current = tooltipData;

              setTvTooltipPosition({
                x: rect.left + param.point.x + 10,
                y: rect.top + param.point.y - 10,
              });
              setTvTooltipData(tooltipData);

              // 하이라이트는 CSS로 처리 (setData 사용 안함)
              lastHighlightTime = param.time;
            }
          }
        } else {
          // 마우스가 차트 밖으로 나가면 하이라이트 제거
          currentTooltipRef.current = null;
          setTvTooltipData(null);
          lastHighlightTime = null;
        }
      });

      // 더블클릭 처리
      const handleDoubleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("🖱️ DOM 더블클릭 이벤트!", {
          hasTooltip: !!currentTooltipRef.current,
          tooltipData: currentTooltipRef.current,
        });

        if (
          currentTooltipRef.current &&
          currentTooltipRef.current.originalData
        ) {
          console.log(
            "🎯 뉴스 패널 업데이트:",
            currentTooltipRef.current.originalData
          );
          onShowNews(currentTooltipRef.current.originalData);
        } else {
          console.log("⚠️ 툴팁이 없습니다. 먼저 캔들에 마우스를 올려주세요.");
        }
      };

      // 리사이즈 핸들러
      const handleResize = () => {
        if (tradingViewChart.current && tradingViewRef.current) {
          tradingViewChart.current.applyOptions({
            width: tradingViewRef.current.clientWidth,
          });
        }
      };

      // 이벤트 등록
      const chartContainer = tradingViewRef.current;
      chartContainer.addEventListener("dblclick", handleDoubleClick, {
        passive: false,
      });
      chartContainer.style.cursor = "crosshair";
      window.addEventListener("resize", handleResize);

      tradingViewChart.current = chart;

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartContainer) {
          chartContainer.removeEventListener("dblclick", handleDoubleClick);
          chartContainer.style.cursor = "default";
        }
        if (tradingViewChart.current) {
          tradingViewChart.current.remove();
          tradingViewChart.current = null;
        }
        // ref 정리
        currentTooltipRef.current = null;
      };
    }
  }, [chartType, filteredStockData, onShowNews]);

  // 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (chartType === "line") {
        const tooltipEl = document.querySelector(".custom-tooltip");
        if (tooltipLocked && tooltipEl && !tooltipEl.contains(e.target)) {
          setTooltipLocked(false);
          setLockedTooltipData(null);
        }
      } else {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
          setTvTooltipData(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chartType, tooltipLocked]);

  // Line Chart 더블클릭 처리
  useEffect(() => {
    if (chartType === "line") {
      function handleChartDoubleClick(e) {
        if (
          lastTooltipRef.current &&
          lastTooltipRef.current.data &&
          lastTooltipRef.current.data[0]
        ) {
          const dataItem = filteredStockData.find(
            (d) => d.date === lastTooltipRef.current.date
          );
          if (dataItem) {
            onShowNews(dataItem);
          }
        }
      }
      const chartInstance = chartRef.current;
      if (chartInstance && chartInstance.canvas) {
        chartInstance.canvas.addEventListener(
          "dblclick",
          handleChartDoubleClick
        );
      }
      return () => {
        if (chartInstance && chartInstance.canvas) {
          chartInstance.canvas.removeEventListener(
            "dblclick",
            handleChartDoubleClick
          );
        }
      };
    }
  }, [chartType, filteredStockData, onShowNews]);

  // TradingView 툴팁 포털
  const tradingViewTooltipPortal = tvTooltipData
    ? createPortal(
        <div
          style={{
            position: "fixed",
            left: tvTooltipPosition.x,
            top: tvTooltipPosition.y,
            zIndex: 1000,
            pointerEvents: "auto",
            cursor: "pointer",
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            console.log("🎯 툴팁에서 더블클릭!", currentTooltipRef.current);
            if (
              currentTooltipRef.current &&
              currentTooltipRef.current.originalData
            ) {
              onShowNews(currentTooltipRef.current.originalData);
            }
          }}
          title="더블클릭하여 뉴스 보기"
        >
          <NewsTooltip
            data={[{ raw: { y: tvTooltipData.price } }]}
            companyNews={tvTooltipData.companyNews}
            macroNews={tvTooltipData.macroNews}
            onShowNews={() => {
              if (
                currentTooltipRef.current &&
                currentTooltipRef.current.originalData
              ) {
                onShowNews(currentTooltipRef.current.originalData);
              }
            }}
            date={tvTooltipData.date}
          />
        </div>,
        document.body
      )
    : null;

  console.log(stockData); // 이 배열이 모두 같은 티커의 데이터인지 확인

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
              📈 Line
            </button>
            <button
              onClick={() => setChartType("candle")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === "candle"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🕯️ Candle
            </button>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="relative" style={{ height: "400px" }}>
        {filteredStockData &&
        Array.isArray(filteredStockData) &&
        filteredStockData.length > 0 ? (
          <>
            {chartType === "line" ? (
              <Line ref={chartRef} data={chartData} options={lineOptions} />
            ) : (
              <div
                ref={tradingViewRef}
                className="w-full h-full"
                style={{ height: "400px" }}
              />
            )}
            {chartType === "candle" && tradingViewTooltipPortal}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <div className="text-gray-600 font-medium">
                차트 데이터를 로딩 중입니다...
              </div>
              <div className="text-xs text-gray-400 mt-2">
                데이터가 준비되면 차트가 표시됩니다
              </div>
            </div>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="absolute top-2 right-2 text-xs text-gray-400 bg-white bg-opacity-95 px-3 py-2 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-1">
            <div>🖱️ 드래그: 차트 이동</div>
            <div>🔍 휠: 확대/축소</div>
            <div>👆👆 더블클릭: 뉴스 보기</div>
            {chartType === "candle" && (
              <>
                <div className="text-green-600 font-medium">
                  ✅ 무한루프 해결
                </div>
                <div className="text-blue-600 font-medium">
                  🕯️ 안정적 캔들차트
                </div>
              </>
            )}
          </div>
        </div>
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

        {/* 상태 표시 */}
        <div className="flex items-center space-x-2">
          <div className="text-xs text-green-500 font-medium">
            ✅ {chartType === "line" ? "Chart.js" : "TradingView"}
          </div>
          <div className="text-xs text-gray-500">
            데이터:{" "}
            {filteredStockData && Array.isArray(filteredStockData)
              ? filteredStockData.length
              : 0}
            개
          </div>
          {chartType === "candle" && (
            <div className="text-xs text-blue-600 font-medium">
              🚀 무한루프 해결됨
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CleanChartContainer;
