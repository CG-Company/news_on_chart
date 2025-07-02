import { useMemo, useCallback, useRef } from "react";

// 시간 범위별 데이터 필터링
function filterDataByTimeRange(data, timeRange) {
  if (!data || data.length === 0) return data;

  const now = new Date();
  const ranges = {
    "1D": 1,
    "1W": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825,
    All: Infinity,
  };

  const days = ranges[timeRange] || 30;
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return data.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate >= cutoffDate;
  });
}

export function useChartOptimization(data, chartType, timeRange = "1M") {
  // 시간 범위별 데이터 필터링
  const filteredData = useMemo(() => {
    return filterDataByTimeRange(data, timeRange);
  }, [data, timeRange]);

  // 차트 데이터 메모이제이션 (성능 최적화)
  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    if (chartType === "line") {
      // 라인 차트는 모든 데이터 사용 (Chart.js가 자동으로 최적화)
      return {
        labels: filteredData.map((d) => d.date),
        datasets: [
          {
            label: "종가",
            data: filteredData.map((d) => ({
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
      };
    } else {
      // 캔들 차트는 모든 데이터 사용하되 렌더링 최적화
      return filteredData.map((d) => ({
        x: d.date,
        y: [d.open, d.high, d.low, d.close],
        companyNews: d.companyNews || [],
        macroNews: d.macroNews || [],
      }));
    }
  }, [filteredData, chartType]);

  // 현재가 및 변동률 계산 메모이제이션
  const currentData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const latest = data[data.length - 1];
    const previous = data.length > 1 ? data[data.length - 2] : latest;
    const change = latest.close - previous.close;
    const changePercent = (change / previous.close) * 100;

    return { latest, change, changePercent };
  }, [data]);

  // 차트 옵션 메모이제이션 (성능 최적화)
  const chartOptions = useMemo(() => {
    if (chartType === "line") {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
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
              maxTicksLimit: 10, // x축 라벨 수 제한
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
        elements: {
          point: {
            radius: 0, // 기본 포인트 숨김
            hoverRadius: 6, // 호버 시에만 표시
          },
        },
      };
    } else {
      return {
        chart: {
          type: "candlestick",
          height: 400,
          toolbar: {
            show: true, // 툴바 활성화로 줌 컨트롤 제공
            tools: {
              download: false,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true, // 리셋 버튼 활성화
            },
          },
          zoom: {
            enabled: true,
            type: "x",
            autoScaleYaxis: true,
            zoomedArea: {
              fill: {
                color: "#90CAF9",
                opacity: 0.4,
              },
              stroke: {
                color: "#0D47A1",
                opacity: 0.4,
                width: 1,
              },
            },
          },
          animations: {
            enabled: false, // 애니메이션 비활성화로 성능 향상
            dynamicAnimation: {
              enabled: false,
            },
          },
          redrawOnWindowResize: false, // 리사이즈 시 재렌더링 비활성화
          redrawOnParentResize: false,
          selection: {
            enabled: true, // 선택 기능 활성화
          },
          brush: {
            enabled: false, // 브러시 기능 비활성화
          },
        },
        xaxis: {
          type: "category",
          labels: {
            style: {
              colors: "#64748b",
              fontSize: "12px",
              fontFamily: "inherit",
            },
            formatter: (val) => {
              const d = new Date(val);
              return `${d.getFullYear()}-${(d.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
            },
            maxItems: 10, // x축 라벨 수 제한
            rotate: -45, // 라벨 회전으로 겹침 방지
            rotateAlways: false,
          },
          tickAmount: 10, // 틱 수 제한
        },
        yaxis: {
          labels: {
            style: {
              colors: "#64748b",
              fontSize: "12px",
              fontFamily: "inherit",
            },
            formatter: (val) => val.toLocaleString(),
          },
          tooltip: { enabled: false },
        },
        tooltip: { enabled: false },
        grid: {
          borderColor: "#f1f5f9",
          strokeDashArray: 2,
          show: true,
          xaxis: {
            lines: {
              show: false, // x축 그리드 라인 숨김
            },
          },
          yaxis: {
            lines: {
              show: true,
            },
          },
        },
        colors: ["#06b6d4"],
        stroke: {
          width: 1, // 캔들 두께 줄임
          curve: "straight",
        },
        plotOptions: {
          candlestick: {
            colors: {
              upward: "#22c55e",
              downward: "#ef4444",
            },
            wick: {
              useFillColor: true,
            },
          },
        },
        dataLabels: {
          enabled: false, // 데이터 라벨 비활성화
        },
        markers: {
          size: 0, // 마커 크기 0으로 설정
        },
      };
    }
  }, [chartType]);

  // 디바운스된 툴팁 업데이트
  const tooltipTimeoutRef = useRef(null);
  const debouncedTooltipUpdate = useCallback((callback, delay = 100) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(callback, delay);
  }, []);

  // 날짜별 뉴스 필터링 최적화
  const getNewsForDate = useCallback((date, newsData) => {
    if (!newsData || !Array.isArray(newsData))
      return { companyNews: [], macroNews: [] };

    const dateStr = date.slice(0, 10);
    const newsForDate = newsData.filter(
      (n) => (n.published_at || "").slice(0, 10) === dateStr
    );

    return {
      companyNews: newsForDate.map((n) => n.title),
      macroNews: [],
    };
  }, []);

  // 데이터 통계 정보
  const dataStats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    return {
      totalPoints: data?.length || 0,
      displayedPoints: filteredData.length,
      timeRange,
    };
  }, [data, filteredData, timeRange]);

  return {
    chartData,
    currentData,
    chartOptions,
    debouncedTooltipUpdate,
    getNewsForDate,
    dataStats,
    filteredData,
  };
}
