import { useState, useEffect } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.105:8000";

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
        marginTop: 24,
        maxWidth: 700,
        background: "#f9fafb",
        border: "1.5px solid #e5e7eb",
        borderRadius: 16,
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.04)",
        padding: 0,
        overflow: "hidden",
      }}
    >
      {/* 상단 강조 바 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ede9fe",
          padding: "10px 20px 8px 20px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontSize: 20, marginRight: 10 }}>🤖</span>
          <span style={{ fontWeight: 700, color: "#7c3aed", fontSize: 15 }}>
            AI가 최근 뉴스를 요약했어요
          </span>
        </div>

        {/* 디버깅 정보 (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === "development" && debugInfo && (
          <div
            style={{
              fontSize: 10,
              color: "#666",
              background: "#fff",
              padding: "2px 6px",
              borderRadius: 4,
              border: "1px solid #ddd",
            }}
          >
            뉴스: {debugInfo.newsCount}건 |
            {debugInfo.cached ? " 캐시됨" : " 실시간"} |{debugInfo.responseTime}
            ms
          </div>
        )}
      </div>

      {/* 타이틀 */}
      <div
        style={{
          padding: "12px 20px 0 20px",
          fontWeight: 600,
          fontSize: 15,
          color: "#22223b",
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

      {/* 기간 버튼 */}
      <div
        style={{
          padding: "6px 20px 0 20px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
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
            opacity: summaryLoading ? 0.5 : 1,
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
            opacity: summaryLoading ? 0.5 : 1,
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
            opacity: summaryLoading ? 0.5 : 1,
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
              cursor: "pointer",
            }}
          >
            재시도
          </button>
        )}
      </div>

      {/* 요약문 카드 */}
      <div
        style={{
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
          position: "relative",
        }}
      >
        {summaryLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#888",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                border: "2px solid #e5e7eb",
                borderTop: "2px solid #7c3aed",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            요약을 생성하고 있습니다...
          </div>
        )}

        {summaryError && (
          <div
            style={{
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            {summaryError}
          </div>
        )}

        {!summaryLoading && !summaryError && summaryText && (
          <div>
            {summaryText}
            {debugInfo && debugInfo.newsCount > 0 && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#666",
                  fontStyle: "normal",
                }}
              >
                📊 {debugInfo.newsCount}건의 뉴스를 분석했습니다
              </div>
            )}
          </div>
        )}

        {!summaryLoading && !summaryError && !summaryText && (
          <div style={{ color: "#888" }}>요약할 뉴스가 없습니다.</div>
        )}
      </div>

      {/* 하단 안내 */}
      <div
        style={{
          borderTop: "1px solid #f3f4f6",
          background: "#f4f3ff",
          color: "#7c3aed",
          fontSize: 12,
          padding: "7px 20px",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>※ AI가 제공하는 요약 정보는 참고용입니다.</span>
        {/* API 상태 체크 버튼 (개발 환경) */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={() => {
              fetch(`${API_BASE}/api/health`)
                .then((res) => res.json())
                .then((data) => {
                  console.log("🏥 API Health Check:", data);
                  alert(`API 상태: ${JSON.stringify(data, null, 2)}`);
                })
                .catch((err) => {
                  console.error("🏥 API Health Check 실패:", err);
                  alert(`API 상태 확인 실패: ${err.message}`);
                });
            }}
            style={{
              fontSize: 10,
              padding: "2px 6px",
              background: "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            API 체크
          </button>
        )}
      </div>
    </div>
  );
}
