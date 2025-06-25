import React from "react";

const NewsTooltip = ({
  data,
  companyNews = [],
  macroNews = [],
  onShowNews,
  date,
  onLock,
}) => {
  // data는 tooltip.dataPoints 등에서 전달받은 값
  if (!data || data.length === 0) return null;
  // 예시 렌더링
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        minWidth: 200,
        fontSize: 14,
        zIndex: 9999,
      }}
      onClick={
        onLock
          ? (e) => {
              e.stopPropagation();
              onLock();
            }
          : undefined
      }
      onContextMenu={(e) => e.preventDefault()}
    >
      <div>
        <b>날짜:</b> {data[0].label}
      </div>
      <div>
        <b>종가:</b> {data[0].formattedValue}
      </div>
      <div style={{ marginTop: 8 }}>
        <b>[기업 뉴스]</b>
        {companyNews.length === 0 ? (
          <div style={{ color: "#aaa" }}>해당일 기업 뉴스 없음</div>
        ) : (
          companyNews.map((news, i) => <div key={i}>{news}</div>)
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <b>[거시 뉴스]</b>
        {macroNews.length === 0 ? (
          <div style={{ color: "#aaa" }}>해당일 거시 뉴스 없음</div>
        ) : (
          macroNews.map((news, i) => <div key={i}>{news}</div>)
        )}
      </div>
      {onShowNews && date && (
        <button
          style={{
            marginTop: 12,
            padding: "4px 12px",
            borderRadius: 6,
            background: "#6366f1",
            color: "white",
            fontSize: 12,
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => onShowNews(date)}
        >
          뉴스 더보기
        </button>
      )}
    </div>
  );
};

export default NewsTooltip;
