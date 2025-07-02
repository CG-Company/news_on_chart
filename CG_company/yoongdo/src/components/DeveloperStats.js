import { useState } from "react";
import { getApiDebugInfo } from "../utils/api";

export default function DeveloperStats({
  apiHealthy,
  ticker,
  tickerName,
  stockData,
  newsData,
  errors,
  selectedNews,
  lastUpdateTime,
  handleManualRefresh,
  isLoadingStock,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleStats = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-4 right-4 z-30">
      {/* 개발자 배너 버튼 */}
      <button
        onClick={toggleStats}
        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2"
      >
        <span className="text-sm">🔧</span>
        <span className="text-sm font-medium">개발자</span>
      </button>

      {/* 통계 패널 */}
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">개발자 통계</h3>
            <button
              onClick={toggleStats}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* 연결 상태 정보 */}
            {lastUpdateTime && apiHealthy && (
              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <svg
                      className="w-4 h-4 text-green-600 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h4 className="text-xs font-medium text-green-700">
                      PostgreSQL 데이터 연결 완료
                    </h4>
                  </div>
                  <button
                    onClick={handleManualRefresh}
                    disabled={isLoadingStock}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    {isLoadingStock ? "업데이트 중..." : "새로고침"}
                  </button>
                </div>
                <p className="text-xs text-green-600">
                  마지막 업데이트: {lastUpdateTime.toLocaleString("ko-KR")} |
                  주식 데이터: {stockData.length}개 | 뉴스: {newsData.length}개
                </p>
              </div>
            )}

            {/* 시스템 상태 */}
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                🔧 시스템 상태 (PostgreSQL 연동)
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">DB 상태:</span>
                  <span
                    className={`ml-1 ${
                      apiHealthy ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {apiHealthy ? "PostgreSQL 연결됨" : "연결 실패"}
                  </span>
                </div>
                <div>
                  <span className="font-medium">종목:</span>
                  <span className="ml-1">
                    {ticker} ({tickerName || "로딩중"})
                  </span>
                </div>
                <div>
                  <span className="font-medium">주식 데이터:</span>
                  <span className="ml-1">
                    {stockData.length}개 (DB에서 실시간)
                  </span>
                </div>
                <div>
                  <span className="font-medium">뉴스 데이터:</span>
                  <span className="ml-1">{newsData.length}개</span>
                </div>
              </div>

              {/* 에러 상태 표시 */}
              {(errors.stock || errors.api) && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-red-600 mb-1">
                    ⚠️ 현재 오류:
                  </p>
                  <div className="space-y-1">
                    {errors.stock && (
                      <p className="text-xs text-red-500">
                        • 주식 데이터: {errors.stock}
                      </p>
                    )}
                    {errors.api && (
                      <p className="text-xs text-red-500">
                        • API 연결: {errors.api}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 데이터베이스 정보 */}
            <div className="bg-indigo-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-indigo-700 mb-2">
                🗄️ 데이터베이스 정보
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">DB 테이블</span>
                  <span className="text-xs font-medium text-gray-900">
                    stock_price, news, ticker
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">API 상태</span>
                  <span
                    className={`text-xs font-medium ${
                      apiHealthy ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {apiHealthy ? "정상" : "오류"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">마지막 업데이트</span>
                  <span className="text-xs font-medium text-gray-900">
                    {lastUpdateTime
                      ? lastUpdateTime.toLocaleTimeString("ko-KR")
                      : "없음"}
                  </span>
                </div>
              </div>
            </div>

            {/* 거래 정보 */}
            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-blue-700 mb-2">
                📊 거래 정보
              </h4>
              <div className="space-y-2">
                {stockData.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">현재가</span>
                      <span className="text-xs font-medium text-gray-900">
                        {stockData[
                          stockData.length - 1
                        ]?.close?.toLocaleString()}
                        원
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">데이터 기간</span>
                      <span className="text-xs font-medium text-gray-900">
                        {stockData[0]?.date} ~{" "}
                        {stockData[stockData.length - 1]?.date}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-500">데이터 로딩 중...</div>
                )}
              </div>
            </div>

            {/* 뉴스 통계 */}
            <div className="bg-purple-50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-purple-700 mb-2">
                📰 뉴스 통계
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">총 뉴스</span>
                  <span className="text-xs font-medium text-gray-900">
                    {newsData.length}개
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">기업 뉴스</span>
                  <span className="text-xs font-medium text-blue-500">
                    {stockData.reduce(
                      (sum, item) => sum + (item.companyNews?.length || 0),
                      0
                    )}
                    개
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">거시경제</span>
                  <span className="text-xs font-medium text-orange-500">
                    {stockData.reduce(
                      (sum, item) => sum + (item.macroNews?.length || 0),
                      0
                    )}
                    개
                  </span>
                </div>
              </div>
            </div>

            {/* 개발 정보 */}
            {process.env.NODE_ENV === "development" && (
              <div className="bg-green-50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-green-700 mb-2">
                  🛠️ 개발 정보
                </h4>
                <div className="text-xs text-green-600 space-y-1">
                  <div>
                    현재 종목: {ticker} ({tickerName})
                  </div>
                  <div>
                    DB 테이블: stock_price ({stockData.length}행), news (
                    {newsData.length}행)
                  </div>
                  <div>
                    선택된 뉴스:{" "}
                    {selectedNews ? selectedNews.date || "있음" : "없음"}
                  </div>
                  <div>API 베이스: {getApiDebugInfo().apiBase}</div>
                  <div>
                    캐시 키: {getApiDebugInfo().cachedKeys.join(", ") || "없음"}
                  </div>
                  <div className="text-green-600 font-medium">
                    ✅ PostgreSQL + FastAPI 연동 완료
                  </div>
                  <div className="text-blue-600 font-medium">
                    🚀 실시간 데이터베이스 연결
                  </div>
                  <div className="text-purple-600 font-medium">
                    🛡️ 전체 에러 처리 시스템 적용
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
