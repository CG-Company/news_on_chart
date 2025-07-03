import { useState, useEffect } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  // process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";


export default function AINewsSummaryBanner({ ticker }) {
  const [summaryPeriod, setSummaryPeriod] = useState("3m");
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      setSummaryText("");

      const startTime = Date.now();

      try {
        const response = await fetch(
          `${API_BASE}/api/news_summary?ticker=${ticker}&period=${summaryPeriod}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        console.log("📊 응답 데이터:", {
          data,
          responseTime: `${responseTime}ms`,
          hasSummary: !!data.summary,
          summaryLength: data.summary?.length || 0,
        });

        // 디버깅 정보 저장
        setDebugInfo({
          newsCount: data.news_count || 0,
          cached: data.cached || false,
          responseTime,
          period: data.period || summaryPeriod,
        });

        if (data.summary) {
          // 문제가 있는 요약문 체크
          const problematicTexts = [
            "LLM 요약 결과",
            "973건 뉴스 기반",
            "예시",
            "요약 생성 중 오류",
            "API 키가 설정되지",
            "OpenAI",
          ];

          const hasProblems = problematicTexts.some((text) =>
            data.summary.includes(text)
          );

          if (hasProblems) {
            console.warn("⚠️ 문제가 있는 요약문 감지:", data.summary);
            setSummaryError("요약 생성에 실패했습니다. 다시 시도해주세요.");
          } else {
            setSummaryText(data.summary);
          }
        } else {
          setSummaryError("요약 결과를 받을 수 없습니다.");
        }
      } catch (err) {
        const responseTime = Date.now() - startTime;
        console.error("❌ 요약 요청 실패:", {
          error: err.message,
          responseTime: `${responseTime}ms`,
          ticker,
          period: summaryPeriod,
        });

        setSummaryError(
          `요약을 불러오는 중 오류가 발생했습니다: ${err.message}`
        );
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [ticker, summaryPeriod]);

  const retrySummary = () => {
    setSummaryError(null);
    setSummaryText("");
    // useEffect가 다시 실행되도록 ticker를 임시로 변경했다가 복원
    const currentTicker = ticker;
    // 강제로 다시 실행
    setSummaryPeriod(summaryPeriod);
  };

  if (!ticker) return null;

  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px",
        fontSize: "12px",
        color: "#475569",
        position: "relative",
        height: "100%",
        overflow: "auto",
      }}
    >
      {/* 개발자 배너 스타일 */}
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}
      >
        <span style={{ fontSize: "14px", marginRight: "6px" }}>🤖</span>
        <span style={{ fontWeight: "600", color: "#1e293b" }}>
          AI 뉴스 요약
        </span>
        {debugInfo && (
          <span
            style={{ marginLeft: "auto", fontSize: "10px", color: "#64748b" }}
          >
            {debugInfo.newsCount}건 | {debugInfo.responseTime}ms
          </span>
        )}
      </div>

      {/* 기간 선택 */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
        <button
          onClick={() => setSummaryPeriod("1m")}
          disabled={summaryLoading}
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            background: summaryPeriod === "1m" ? "#3b82f6" : "#f1f5f9",
            color: summaryPeriod === "1m" ? "white" : "#64748b",
            border: "none",
            borderRadius: "4px",
            cursor: summaryLoading ? "not-allowed" : "pointer",
            opacity: summaryLoading ? 0.5 : 1,
          }}
        >
          1M
        </button>
        <button
          onClick={() => setSummaryPeriod("3m")}
          disabled={summaryLoading}
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            background: summaryPeriod === "3m" ? "#3b82f6" : "#f1f5f9",
            color: summaryPeriod === "3m" ? "white" : "#64748b",
            border: "none",
            borderRadius: "4px",
            cursor: summaryLoading ? "not-allowed" : "pointer",
            opacity: summaryLoading ? 0.5 : 1,
          }}
        >
          3M
        </button>
        <button
          onClick={() => setSummaryPeriod("1y")}
          disabled={summaryLoading}
          style={{
            fontSize: "10px",
            padding: "2px 6px",
            background: summaryPeriod === "1y" ? "#3b82f6" : "#f1f5f9",
            color: summaryPeriod === "1y" ? "white" : "#64748b",
            border: "none",
            borderRadius: "4px",
            cursor: summaryLoading ? "not-allowed" : "pointer",
            opacity: summaryLoading ? 0.5 : 1,
          }}
        >
          1Y
        </button>
        {summaryError && (
          <button
            onClick={retrySummary}
            style={{
              fontSize: "10px",
              padding: "2px 6px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            재시도
          </button>
        )}
      </div>

      {/* 요약문 */}
      <div style={{ fontSize: "11px", lineHeight: "1.4", color: "#475569" }}>
        {summaryLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#64748b",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                border: "1px solid #cbd5e1",
                borderTop: "1px solid #3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            요약 생성 중...
          </div>
        )}

        {summaryError && (
          <div style={{ color: "#ef4444", fontSize: "10px" }}>
            ⚠️ {summaryError}
          </div>
        )}

        {!summaryLoading && !summaryError && summaryText && (
          <div>
            {summaryText}
            {debugInfo && debugInfo.newsCount > 0 && (
              <div
                style={{ marginTop: "4px", fontSize: "9px", color: "#64748b" }}
              >
                📊 {debugInfo.newsCount}건 분석
              </div>
            )}
          </div>
        )}

        {!summaryLoading && !summaryError && !summaryText && (
          <div style={{ color: "#64748b", fontSize: "10px" }}>
            요약할 뉴스가 없습니다.
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      {/* CSS 애니메이션 추가 */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
