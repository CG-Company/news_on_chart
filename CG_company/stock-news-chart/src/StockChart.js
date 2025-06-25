import React from "react";
import ApexChart from "react-apexcharts";

// 캔들차트용 더미 데이터 (시가, 고가, 저가, 종가)
const chartData = [
  {
    x: "2025-06-20",
    y: [11800, 12200, 11700, 12000],
    news: [
      { title: "실적 발표", summary: "2분기 실적이 시장 기대치 상회" },
      { title: "신제품 출시", summary: "신제품 스마트폰 공개" },
    ],
  },
  {
    x: "2025-06-21",
    y: [12000, 12400, 11900, 12300],
    news: [{ title: "업계 동향", summary: "경쟁사 주가 하락 소식" }],
  },
  {
    x: "2025-06-22",
    y: [12300, 12400, 11800, 11950],
    news: [],
  },
  {
    x: "2025-06-23",
    y: [11950, 12600, 11900, 12500],
    news: [{ title: "투자 유치", summary: "100억 투자 유치 성공" }],
  },
];

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
      const d = chartData[dataPointIndex];
      let newsHtml = "";
      if (d.news && d.news.length > 0) {
        newsHtml =
          `<div style='margin-top:8px;font-weight:bold;'>뉴스 요약</div>` +
          d.news
            .map(
              (item) =>
                `<div style='margin-bottom:4px;'><span style='font-weight:600;'>${item.title}</span>: ${item.summary}</div>`
            )
            .join("");
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

function StockChart() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded shadow p-6">
      <ApexChart
        options={options}
        series={[{ data: chartData }]}
        type="candlestick"
        height={350}
      />
    </div>
  );
}

export default StockChart;
