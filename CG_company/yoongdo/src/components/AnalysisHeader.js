// components/AnalysisHeader.js
import React from "react";

const AnalysisHeader = ({ totalStocks, activeKeywords, onRefresh }) => {
return (
<header className="bg-white border-b border-gray-100 px-6 py-4">
    <div className="flex items-center justify-between">
    <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
        주식 키워드 분석
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
        <span>코스피 200</span>
        <span>•</span>
        <span>{totalStocks}개 종목</span>
        <span>•</span>
        <span>{activeKeywords}개 키워드</span>
        </div>
    </div>

    <button
        onClick={onRefresh}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-sm font-medium text-gray-700">새로고침</span>
    </button>
    </div>
</header>
);
};

export default AnalysisHeader;