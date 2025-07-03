import { useState, useEffect } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";

export default function NewsSummaryPanel({ ticker }) {
  const [summaryPeriod, setSummaryPeriod] = useState("3m");
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryText("");
    const url = `${API_BASE}/api/news_summary/stream?ticker=${ticker}&period=${summaryPeriod}`;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const stream = res.body;
        if (!stream) throw new Error("서버 응답에 스트림 바디가 없습니다.");
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let done = false;
        while (!done && !cancelled) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            let parts = buffer.split("\n\n");
            buffer = parts.pop();
            for (const part of parts) {
              if (part.startsWith("data:")) {
                const dataStr = part.replace(/^data:\s*/, "");
                if (dataStr === "[DONE]") {
                  done = true;
                  break;
                }
                try {
                  const json = JSON.parse(dataStr);
                  if (json.content) {
                    setSummaryText((prev) => prev + json.content);
                  }
                } catch (e) {}
              }
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err);
          setSummaryError(`요약을 불러오는 중 오류가 발생했습니다: ${message}`);
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticker, summaryPeriod]);

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 mb-4 w-full max-w-4xl ml-0"
      style={{ marginLeft: 0, marginRight: "auto" }}
    >
      {/* 상단 강조 바 + 기간 버튼 오른쪽 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f3f4f6",
          padding: "8px 16px 6px 16px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 18, marginRight: 8 }}>🤖</span>
          <span style={{ color: "#6366f1", fontSize: 14, fontWeight: 600 }}>
            AI가 최근 뉴스를 요약했어요
          </span>
        </div>
        {/* 기간 버튼 - 오른쪽 끝 */}
        <div
          style={{
            display: "inline-flex",
            background: "#f3f4f6",
            borderRadius: 999,
            padding: 1,
            margin: 0,
          }}
        >
          {[
            { label: "1개월", value: "1m" },
            { label: "3개월", value: "3m" },
            { label: "1년", value: "1y" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSummaryPeriod(opt.value)}
              style={{
                background:
                  summaryPeriod === opt.value ? "#fff" : "transparent",
                color: "#22223b",
                fontWeight: 400,
                fontSize: 14,
                border: "none",
                outline: "none",
                borderRadius: 999,
                padding: "4px 14px",
                marginRight: 2,
                boxShadow:
                  summaryPeriod === opt.value
                    ? "0 1px 4px 0 rgba(0,0,0,0.04)"
                    : "none",
                transition: "background 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {/* 타이틀 */}
      <div
        style={{
          padding: "8px 16px 0 16px",
          fontSize: 14,
          color: "#22223b",
          fontWeight: 600,
        }}
      >
        지난{" "}
        {summaryPeriod === "1m"
          ? "1개월"
          : summaryPeriod === "3m"
          ? "3개월"
          : "1년"}{" "}
        뉴스 요약
      </div>
      {/* 요약문 카드 */}
      <div
        style={{
          margin: "8px 16px 10px 16px",
          background: "#f9fafb",
          border: "1.5px solid #e5e7eb",
          borderRadius: 10,
          minHeight: 36,
          padding: 10,
          fontSize: 14,
          fontStyle: "italic",
          color: "#22223b",
          boxShadow: "0 1px 4px 0 rgba(0,0,0,0.03)",
        }}
      >
        {summaryLoading ? (
          <span style={{ color: "#888" }}>요약을 불러오는 중...</span>
        ) : summaryError ? (
          <span style={{ color: "#ef4444" }}>{summaryError}</span>
        ) : (
          summaryText
        )}
      </div>
      {/* 하단 안내 */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          background: "#f3f4f6",
          color: "#64748b",
          fontSize: 12,
          padding: "5px 16px",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        ※ AI가 제공하는 요약 정보는 참고용입니다.
      </div>
    </div>
  );
}
