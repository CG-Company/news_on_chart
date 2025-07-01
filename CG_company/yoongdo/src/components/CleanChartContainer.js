// components/CleanChartContainer.js - 뉴스 요약 부분만 수정
"use client";
import { useRef, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { createChart } from "lightweight-charts";
import { createPortal } from "react-dom";
import NewsTooltip from "./NewsTooltip";
import {
  subDays,
  subWeeks,
  subMonths,
  subYears,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";

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
  keywordMarkerDates = [],
  keywordMarker = "",
  setKeywordMarker,
}) {
  const wrapperRef = useRef();
  const chartRef = useRef();
  const tradingViewRef = useRef(); // TradingView 차트용
  const tradingViewChart = useRef(null); // TradingView 차트 인스턴스

  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("1D");

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
    let prevClose = null;
    return stockData
      .filter((item) => {
        const date = new Date(item.date);
        const day = date.getDay();
        // 주말 제외
        return !(day === 0 || day === 6);
      })
      .map((item) => {
        const isAllZero = [item.open, item.close, item.high, item.low].every(
          (v) => v === 0 || v === 0.0
        );
        if (isAllZero && prevClose !== null) {
          // 0값이면 이전 종가로 대체 + 플래그 추가
          const newItem = {
            ...item,
            open: prevClose,
            high: prevClose,
            low: prevClose,
            close: prevClose,
            isFilled: true,
          };
          prevClose = newItem.close;
          return newItem;
        } else {
          prevClose = item.close;
          return { ...item, isFilled: false };
        }
      });
  }, [stockData]);

  // 봉 단위 매핑 함수
  const getAggregationType = (range) => {
    if (range === "1D") return "day";
    if (range === "1W") return "week";
    if (range === "1M") return "month";
    if (range === "3M") return "3month";
    if (range === "6M") return "6month";
    if (range === "1Y") return "year";
    if (range === "5Y") return "5year";
    if (range === "All") return "year";
    return "day";
  };

  // 봉 타입에 따라 데이터 집계 함수
  const getAggregatedData = (data, range) => {
    if (!Array.isArray(data) || data.length === 0) return [];
    const aggregationType = getAggregationType(range);
    if (aggregationType === "day") return data;

    let grouped = {};
    data.forEach((item) => {
      let key;
      const date = new Date(item.date);
      if (aggregationType === "week") {
        key = startOfWeek(date, { weekStartsOn: 1 }).toISOString().slice(0, 10);
      } else if (aggregationType === "month") {
        key = startOfMonth(date).toISOString().slice(0, 7);
      } else if (aggregationType === "3month") {
        const year = date.getFullYear();
        const month = date.getMonth();
        const groupMonth = Math.floor(month / 3) * 3;
        key = `${year}-${(groupMonth + 1).toString().padStart(2, "0")}`;
      } else if (aggregationType === "6month") {
        const year = date.getFullYear();
        const month = date.getMonth();
        const groupMonth = Math.floor(month / 6) * 6;
        key = `${year}-${(groupMonth + 1).toString().padStart(2, "0")}`;
      } else if (aggregationType === "year") {
        key = startOfYear(date).getFullYear().toString();
      } else if (aggregationType === "5year") {
        const year = date.getFullYear();
        const groupYear = Math.floor(year / 5) * 5;
        key = `${groupYear}-${groupYear + 4}`;
      }
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    return Object.values(grouped).map((group) => {
      const sorted = group.sort((a, b) => new Date(a.date) - new Date(b.date));
      return {
        date: sorted[0].date,
        open: sorted[0].open,
        high: Math.max(...group.map((d) => d.high)),
        low: Math.min(...group.map((d) => d.low)),
        close: sorted[sorted.length - 1].close,
        companyNews: sorted[sorted.length - 1].companyNews,
        macroNews: sorted[sorted.length - 1].macroNews,
        isFilled: sorted[sorted.length - 1].isFilled,
      };
    });
  };

  // 기존 rangeFilteredData → aggregation 적용
  const aggregatedData = useMemo(
    () => getAggregatedData(filteredStockData, timeRange),
    [filteredStockData, timeRange]
  );

  // currentData도 aggregation 기준으로 계산
  const currentData = useMemo(() => {
    if (!aggregatedData || aggregatedData.length === 0) return null;
    const latest = aggregatedData[aggregatedData.length - 1];
    if (!latest || typeof latest.close !== "number") return null;
    const previous =
      aggregatedData.length > 1
        ? aggregatedData[aggregatedData.length - 2]
        : latest;
    if (!previous || typeof previous.close !== "number") return null;
    const change = latest.close - previous.close;
    const changePercent =
      previous.close !== 0 ? (change / previous.close) * 100 : 0;
    return { latest, change, changePercent };
  }, [aggregatedData]);

  // === LINE CHART 로직 (안전성 강화) ===
  const chartData = useMemo(() => {
    if (!aggregatedData || aggregatedData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }
    const labels = aggregatedData.map((d) => d.date);
    const lineData = aggregatedData.map((d) => d.close);
    // 키워드 마커 데이터
    const markerPoints = labels.map((date, i) =>
      keywordMarkerDates.includes(date)
        ? { x: date, y: lineData[i] }
        : null
    ).filter(Boolean);
    return {
      labels,
      datasets: [
        {
          label: tickerName || ticker,
          data: lineData,
          borderColor: "#06b6d4", // 파란색 선
          backgroundColor: "rgba(6,182,212,0.1)",
          pointRadius: 0, // 선차트 점 안 보이게
          pointHoverRadius: 6,
          tension: 0.2,
          borderWidth: 1.5, // 선 두께 살짝 두껍게
        },
        // 키워드 마커용 scatter dataset (검색어 있을 때만)
        keywordMarker && markerPoints.length > 0
          ? {
              type: "scatter",
              label: `${keywordMarker} 키워드 등장`,
              data: markerPoints,
              pointBackgroundColor: "#a855f7",
              pointBorderColor: "#a855f7",
              pointRadius: 2.5, // 마커 더 작게
              pointStyle: "arrowDown",
              showLine: false,
              order: 10,
            }
          : null,
      ].filter(Boolean),
    };
  }, [aggregatedData, ticker, tickerName, keywordMarkerDates, keywordMarker]);

  function externalTooltipHandler(context) {
    const { chart, tooltip } = context;
    let tooltipEl = chart.canvas.parentNode.querySelector('.custom-tooltip');
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'custom-tooltip';
      tooltipEl.style.position = 'absolute';
      tooltipEl.style.pointerEvents = 'auto';
      tooltipEl.style.zIndex = '1000';
      chart.canvas.parentNode.appendChild(tooltipEl);
    }

    if (tooltipLocked && lockedTooltipData) {
      tooltipEl.style.opacity = 1;
      tooltipEl.style.left = lockedTooltipData.left;
      tooltipEl.style.top = lockedTooltipData.top;
      if (!tooltipEl._root) {
        tooltipEl._root = ReactDOM.createRoot(tooltipEl);
      }
      // 날짜별 메인뉴스/거시뉴스 추출
      const date = lockedTooltipData.date;
      const mainCompanyNews = (lockedTooltipData.companyNews && lockedTooltipData.companyNews[0]) || null;
      const macroNews = macroNewsByDate[date] || null;
      tooltipEl._root.render(
        <NewsTooltip
          data={lockedTooltipData.data}
          companyNews={mainCompanyNews ? [mainCompanyNews] : []}
          macroNews={macroNews ? [macroNews] : []}
          onShowNews={lockedTooltipData.onShowNews}
          date={lockedTooltipData.date}
          ticker={ticker}
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
    // 메인뉴스/거시뉴스 추출
    const mainCompanyNews = companyNews[0] || null;
    const macroNewsItem = macroNewsByDate[date] || null;
    // 가격/변동률 계산
    const price = aggregatedData[dataIndex]?.close;
    const prevPrice = aggregatedData[dataIndex - 1]?.close;
    const diff = price && prevPrice ? price - prevPrice : 0;
    const rate = price && prevPrice ? (diff / prevPrice) * 100 : 0;
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
        companyNews={mainCompanyNews ? [mainCompanyNews] : []}
        macroNews={macroNewsItem ? [macroNewsItem] : []}
        onShowNews={() => onShowNews(dataItem)}
        date={date}
        ticker={ticker}
        price={price}
        change_rate={rate}
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
            onDblClick: false,
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
    [externalTooltipHandler]
  );

  // === TRADINGVIEW CANDLESTICK CHART 로직 ===
  useEffect(() => {
    if (
      chartType === "candle" &&
      tradingViewRef.current &&
      aggregatedData &&
      Array.isArray(aggregatedData) &&
      aggregatedData.length > 0
    ) {
      // 기존 차트 
      if (tradingViewChart.current) {
        tradingViewChart.current.remove();
      }

      // TradingView 데이터 변환 (안전성 체크 추가)
      const candleData = aggregatedData
        .filter((d) => !d.isFilled) // 휴면 구간 제외
        .filter(
          (d) =>
            d &&
            typeof d.open === "number" &&
            typeof d.close === "number" &&
            typeof d.high === "number" &&
            typeof d.low === "number" &&
            d.date &&
            !(d.open === 0 && d.high === 0 && d.low === 0 && d.close === 0) // 0값 완전 제외
        )
        .map((d, idx, arr) => {
          // change_rate 계산
          const prev = idx > 0 ? arr[idx - 1] : null;
          const prevClose = prev ? prev.close : d.close;
          const change_rate = prevClose !== 0 ? ((d.close - prevClose) / prevClose) * 100 : 0;
          return {
            time: Math.floor(new Date(d.date).getTime() / 1000), // Unix timestamp
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            companyNews: d.companyNews || [],
            macroNews: d.macroNews || [],
            originalDate: d.date,
            change_rate,
          };
        });

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

      // === 키워드 마커 표시 ===
      if (keywordMarker && keywordMarkerDates && keywordMarkerDates.length > 0) {
        const markerData = candleData
          .filter(d => keywordMarkerDates.includes(d.originalDate))
          .map(d => ({
            time: d.time,
            position: 'aboveBar',
            color: '#a855f7',
            shape: 'circle',
            size: 1, // lightweight-charts v4: 1=작음, 2=중간, 3=큼
            text: '📰', // 이모티콘 표시
          }));
        candlestickSeries.setMarkers(markerData);
      }
      // === // ===

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
                change_rate: originalData.change_rate,
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
  }, [chartType, aggregatedData, onShowNews]);

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
          const dataItem = aggregatedData.find(
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
  }, [chartType, aggregatedData, onShowNews]);

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
            companyNews={[
              ...(tvTooltipData.companyNews || []),
              ...(tvTooltipData.macroNews || []),
            ]}
            onShowNews={() => {
              if (
                currentTooltipRef.current &&
                currentTooltipRef.current.originalData
              ) {
                onShowNews(currentTooltipRef.current.originalData);
              }
            }}
            date={tvTooltipData.date}
            ticker={ticker}
            change_rate={tvTooltipData.change_rate}
          />
        </div>,
        document.body
      )
    : null;

  // 거시경제 뉴스 상태
  const [macroNewsByDate, setMacroNewsByDate] = useState({});

  // 마운트 시 거시경제 뉴스 fetch
  useEffect(() => {
    async function fetchMacroNews() {
      try {
        const res = await fetch('/api/macro_news');
        const data = await res.json();
        // 날짜별로 매핑
        const byDate = {};
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.published_at) {
              byDate[item.published_at] = item;
            }
          });
        }
        setMacroNewsByDate(byDate);
      } catch (e) {
        setMacroNewsByDate({});
      }
    }
    fetchMacroNews();
  }, []);

  // === 뉴스 요약 박스 상태 (개선된 버전) ===
  const [summaryPeriod, setSummaryPeriod] = useState("3m"); // 기본 3개월
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null); // 디버깅 정보 추가

  // 개선된 뉴스 요약 useEffect
  useEffect(() => {
    if (!ticker) return;
    
    console.log(`🤖 뉴스 요약 요청 시작: ticker=${ticker}, period=${summaryPeriod}`);
    
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryText("");
    setDebugInfo(null);
    
    const startTime = Date.now();
    
    fetch(`/api/news_summary?ticker=${ticker}&period=${summaryPeriod}`)
      .then((res) => {
        console.log(`📡 응답 받음: status=${res.status}, ok=${res.ok}`);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        return res.json();
      })
      .then((data) => {
        const responseTime = Date.now() - startTime;
        console.log('📊 응답 데이터:', {
          data,
          responseTime: `${responseTime}ms`,
          hasSummary: !!data.summary,
          summaryLength: data.summary?.length || 0
        });
        
        // 디버깅 정보 저장
        setDebugInfo({
          newsCount: data.news_count || 0,
          cached: data.cached || false,
          responseTime,
          period: data.period || summaryPeriod
        });
        
        if (data.summary) {
          // 문제가 있는 요약문 체크
          const problematicTexts = [
            "LLM 요약 결과",
            "973건 뉴스 기반",
            "예시",
            "요약 생성 중 오류",
            "API 키가 설정되지",
            "OpenAI"
          ];
          
          const hasProblems = problematicTexts.some(text => 
            data.summary.includes(text)
          );
          
          if (hasProblems) {
            console.warn('⚠️ 문제가 있는 요약문 감지:', data.summary);
            setSummaryError("요약 생성에 실패했습니다. 다시 시도해주세요.");
          } else {
            setSummaryText(data.summary);
          }
        } else {
          setSummaryError("요약 결과를 받을 수 없습니다.");
        }
        
        setSummaryLoading(false);
      })
      .catch((err) => {
        const responseTime = Date.now() - startTime;
        console.error('❌ 요약 요청 실패:', {
          error: err.message,
          responseTime: `${responseTime}ms`,
          ticker,
          period: summaryPeriod
        });
        
        setSummaryError(`요약을 불러오는 중 오류가 발생했습니다: ${err.message}`);
        setSummaryLoading(false);
      });
  }, [ticker, summaryPeriod]);

  // 요약 재시도 함수
  const retrySummary = () => {
    console.log('🔄 요약 재시도');
    setSummaryPeriod(prev => prev); // useEffect 트리거
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6" ref={wrapperRef}>
      {/* 차트 상단 컨트롤 바: 차트 타입 선택 + 키워드 검색 */}
      <div className="flex items-center justify-between mb-4">
        {/* 차트 타입 선택 (왼쪽) */}
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${chartType === "line" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            onClick={() => setChartType("line")}
          >
            Line
          </button>
          <button
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${chartType === "candle" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            onClick={() => setChartType("candle")}
          >
            Candle
          </button>
        </div>
        {/* 키워드 검색창 (오른쪽) */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={keywordMarker}
            onChange={e => setKeywordMarker && setKeywordMarker(e.target.value)}
            placeholder="키워드 입력 (예: 반도체)"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            style={{ width: 180 }}
          />
          {keywordMarker && (
            <button onClick={() => setKeywordMarker && setKeywordMarker("")} className="text-xs text-gray-400 hover:text-gray-700">지우기</button>
          )}
        </div>
      </div>

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
      </div>

      {/* 차트 영역 */}
      <div className="relative" style={{ height: "400px" }}>
        {aggregatedData &&
        Array.isArray(aggregatedData) &&
        aggregatedData.length > 0 ? (
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
            {aggregatedData && Array.isArray(aggregatedData)
              ? aggregatedData.length
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

      {/* 차트 하단 뉴스 요약 박스 - 개선된 버전 */}
      <div style={{
        marginTop: 24,
        maxWidth: 700,
        background: "#f9fafb",
        border: "1.5px solid #e5e7eb",
        borderRadius: 16,
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
        padding: 0,
        overflow: "hidden"
      }}>
        {/* 상단 강조 바 */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ede9fe",
          padding: "10px 20px 8px 20px",
          borderBottom: "1px solid #e5e7eb"
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 20, marginRight: 10 }}>🤖</span>
            <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: 15 }}>
              AI가 최근 뉴스를 요약했어요
            </span>
          </div>
          
          {/* 디버깅 정보 (개발 환경에서만 표시) */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div style={{ 
              fontSize: 10, 
              color: "#666",
              background: "#fff",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #ddd"
            }}>
              뉴스: {debugInfo.newsCount}건 | 
              {debugInfo.cached ? ' 캐시됨' : ' 실시간'} | 
              {debugInfo.responseTime}ms
            </div>
          )}
        </div>
        
        {/* 타이틀 */}
        <div style={{
          padding: "12px 20px 0 20px",
          fontWeight: 600,
          fontSize: 15,
          color: "#22223b"
        }}>
          지난 {summaryPeriod === "1m" ? "1개월" : summaryPeriod === "3m" ? "3개월" : "1년"} 뉴스 요약
        </div>
        
        {/* 기간 버튼 */}
        <div style={{ 
          padding: "6px 20px 0 20px",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <button 
            onClick={() => setSummaryPeriod("1m")}
            disabled={summaryLoading}
            style={{
              fontWeight: summaryPeriod === "1m" ? 700 : 400,
              fontStyle: summaryPeriod === "1m" ? "italic" : "normal",
              color: summaryPeriod === "1m" ? "#7c3aed" : "#666",
              background: "none", 
              border: "none", 
              cursor: summaryLoading ? "not-allowed" : "pointer",
              opacity: summaryLoading ? 0.5 : 1
            }}
          >
            1개월
          </button>
          <button 
            onClick={() => setSummaryPeriod("3m")}
            disabled={summaryLoading}
            style={{
              fontWeight: summaryPeriod === "3m" ? 700 : 400,
              fontStyle: summaryPeriod === "3m" ? "italic" : "normal",
              color: summaryPeriod === "3m" ? "#7c3aed" : "#666",
              background: "none", 
              border: "none", 
              cursor: summaryLoading ? "not-allowed" : "pointer",
              opacity: summaryLoading ? 0.5 : 1
            }}
          >
            3개월
          </button>
          <button 
            onClick={() => setSummaryPeriod("1y")}
            disabled={summaryLoading}
            style={{
              fontWeight: summaryPeriod === "1y" ? 700 : 400,
              fontStyle: summaryPeriod === "1y" ? "italic" : "normal",
              color: summaryPeriod === "1y" ? "#7c3aed" : "#666",
              background: "none", 
              border: "none", 
              cursor: summaryLoading ? "not-allowed" : "pointer",
              opacity: summaryLoading ? 0.5 : 1
            }}
          >
            1년
          </button>
          
          {/* 에러 시 재시도 버튼 */}
          {summaryError && (
            <button
              onClick={retrySummary}
              style={{
                marginLeft: 16,
                padding: "2px 8px",
                fontSize: 11,
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              재시도
            </button>
          )}
        </div>
        
        {/* 요약문 카드 */}
        <div style={{
          margin: "12px 20px 14px 20px",
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 10,
          minHeight: 48,
          padding: 14,
          fontSize: 14,
          fontStyle: "italic",
          color: "#22223b",
          boxShadow: "0 1px 4px 0 rgba(0,0,0,0.03)",
          position: "relative"
        }}>
          {summaryLoading && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#888"
            }}>
              <div style={{
                width: 16,
                height: 16,
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #7c3aed",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
              요약을 생성하고 있습니다...
            </div>
          )}
          
          {summaryError && (
            <div style={{ 
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <span>⚠️</span>
              {summaryError}
            </div>
          )}
          
          {!summaryLoading && !summaryError && summaryText && (
            <div>
              {summaryText}
              {debugInfo && debugInfo.newsCount > 0 && (
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 11, 
                  color: "#666",
                  fontStyle: "normal"
                }}>
                  📊 {debugInfo.newsCount}건의 뉴스를 분석했습니다
                </div>
              )}
            </div>
          )}
          
          {!summaryLoading && !summaryError && !summaryText && (
            <div style={{ color: "#888" }}>
              요약할 뉴스가 없습니다.
            </div>
          )}
        </div>
        
        {/* 하단 안내 */}
        <div style={{
          borderTop: "1px solid #f3f4f6",
          background: "#f4f3ff",
          color: "#7c3aed",
          fontSize: 12,
          padding: "7px 20px",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>※ AI가 제공하는 요약 정보는 참고용입니다.</span>
          {/* API 상태 체크 버튼 (개발 환경) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                fetch('/api/health')
                  .then(res => res.json())
                  .then(data => {
                    console.log('🏥 API Health Check:', data);
                    alert(`API 상태:\n- OpenAI 설정: ${data.openai_configured ? '✅' : '❌'}\n- Redis 사용 가능: ${data.redis_available ? '✅' : '❌'}`);
                  })
                  .catch(err => {
                    console.error('Health check 실패:', err);
                    alert('Health check 실패');
                  });
              }}
              style={{
                fontSize: 10,
                padding: "2px 6px",
                background: "#7c3aed",
                color: "white",
                border: "none",
                borderRadius: 3,
                cursor: "pointer"
              }}
            >
              API 상태
            </button>
          )}
        </div>
      </div>
      
      {/* CSS 애니메이션 추가 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CleanChartContainer;