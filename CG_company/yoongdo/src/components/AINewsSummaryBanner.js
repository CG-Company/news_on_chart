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
  const [hasStarted, setHasStarted] = useState(false); // 요약 시작 여부

  const fetchSummary = async () => {
    if (!ticker) return;
    
    setSummaryLoading(true);
    setSummaryError(null);
    setSummaryText("");
    setHasStarted(true);
    
    const startTime = Date.now();
    const url = `${API_BASE}/api/news_summary/stream?ticker=${ticker}&period=${summaryPeriod}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const stream = response.body;
      if (!stream) throw new Error("서버 응답에 스트림 바디가 없습니다.");
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      
      while (!done) {
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
      const responseTime = Date.now() - startTime;
      setDebugInfo((prev) => ({ ...(prev || {}), responseTime }));
    } catch (err) {
      const responseTime = Date.now() - startTime;
      setDebugInfo((prev) => ({ ...(prev || {}), responseTime }));
      setSummaryError(
        `요약을 불러오는 중 오류가 발생했습니다: ${err.message}`
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSummarize = () => {
    fetchSummary();
  };

  const retrySummary = () => {
    setSummaryError(null);
    setSummaryText("");
    fetchSummary();
  };

  if (!ticker) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-4 shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">뉴스 요약</h3>
        </div>
        
        {/* 기간 선택 + 요약하기 버튼 */}
        <div className="flex items-center gap-2">
          {/* 기간 선택 버튼들 */}
          <div className="flex gap-1">
            <button
              onClick={() => setSummaryPeriod("1m")}
              disabled={summaryLoading}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                summaryPeriod === "1m"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"
              } ${summaryLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              1M
            </button>
            <button
              onClick={() => setSummaryPeriod("3m")}
              disabled={summaryLoading}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                summaryPeriod === "3m"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"
              } ${summaryLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              3M
            </button>
            <button
              onClick={() => setSummaryPeriod("1y")}
              disabled={summaryLoading}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                summaryPeriod === "1y"
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"
              } ${summaryLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              1Y
            </button>
          </div>
          
          {/* 요약하기 버튼 */}
          <button
            onClick={handleSummarize}
            disabled={summaryLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              summaryLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {summaryLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-400 rounded-full animate-spin"></div>
                분석중
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                요약하기
              </>
            )}
          </button>
          
          {summaryError && (
            <button
              onClick={retrySummary}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              재시도
            </button>
          )}
        </div>
      </div>

      {/* 요약문 */}
      <div className="bg-white rounded-lg p-4 min-h-[120px] max-h-[300px] overflow-y-auto border border-gray-100">
        {summaryLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium">AI가 뉴스를 분석하고 있습니다...</span>
            </div>
          </div>
        )}

        {summaryError && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-2">⚠️</div>
              <p className="text-red-600 text-sm font-medium">{summaryError}</p>
            </div>
          </div>
        )}

        {!summaryLoading && !summaryError && summaryText && (
          <div>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {summaryText}
            </div>
            {debugInfo && debugInfo.newsCount > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                    📊 {debugInfo.newsCount}건 분석
                  </span>
                  <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium">
                    ⚡ {debugInfo.responseTime}ms
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {!summaryLoading && !summaryError && !summaryText && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              {!hasStarted ? (
                <>
                  <div className="text-blue-400 text-2xl mb-2">🤖</div>
                  <p className="text-gray-600 text-sm font-medium mb-1">AI 뉴스 요약 준비완료</p>
                  <p className="text-gray-500 text-xs">기간을 선택하고 &apos;요약하기&apos; 버튼을 눌러주세요</p>
                </>
              ) : (
                <>
                  <div className="text-gray-400 text-2xl mb-2">📄</div>
                  <p className="text-gray-500 text-sm">요약할 뉴스가 없습니다.</p>
                </>
              )}
            </div>
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
