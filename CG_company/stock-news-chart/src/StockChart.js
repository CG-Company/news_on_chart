import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// 날짜 포맷 함수
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

// 커스텀 툴팁
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const news = payload[0].payload.news;
    return (
      <div className="bg-white border rounded shadow p-3 min-w-[220px]">
        <div className="font-bold mb-2">{formatDate(label)}</div>
        <div>종가: <b>{payload[0].value}</b></div>
        <div className="mt-2">
          <div className="font-semibold">뉴스 요약</div>
          {news && news.length > 0 ? (
            news.map((item, idx) => (
              <div key={idx} className="mb-1">
                <span className="font-medium">{item.title}</span>: {item.summary}
              </div>
            ))
          ) : (
            <div className="text-gray-400">뉴스 없음</div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// 더미 데이터
const chartData = [
  {
    date: "2025-06-20",
    close: 12000,
    news: [
      { title: "실적 발표", summary: "2분기 실적이 시장 기대치 상회" },
      { title: "신제품 출시", summary: "신제품 스마트폰 공개" },
    ],
  },
  {
    date: "2025-06-21",
    close: 12300,
    news: [
      { title: "업계 동향", summary: "경쟁사 주가 하락 소식" },
    ],
  },
  {
    date: "2025-06-22",
    close: 11950,
    news: [],
  },
  {
    date: "2025-06-23",
    close: 12500,
    news: [
      { title: "투자 유치", summary: "100억 투자 유치 성공" },
    ],
  },
];

function StockChart() {
  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded shadow p-6">
      <h2 className="text-xl font-bold mb-4">주가 차트 & 뉴스 요약</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData} margin={{ top: 16, right: 32, left: 0, bottom: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            minTickGap={20}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default StockChart;
