// components/CorrelationChart.js
import React from "react";

const CorrelationChart = ({ keyword, ticker, data, period, onPeriodChange }) => {
if (!data || data.length === 0) {
return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="text-center text-gray-500">
        <p>차트 데이터를 불러오는 중...</p>
    </div>
    </div>
);
}

const maxPrice = Math.max(...data.map(d => d.price));
const maxMentions = Math.max(...data.map(d => d.keyword_mentions));

return (
<div className="bg-white border border-gray-200 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-bold text-gray-900">
        {keyword} 키워드 영향 분석
    </h3>
    <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        {['1W', '1M', '3M'].map(p => (
        <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            period === p 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
        >
            {p}
        </button>
        ))}
    </div>
    </div>

    {/* 간단한 차트 영역 */}
    <div className="relative h-64 bg-gray-50 rounded-lg mb-4">
    <svg className="w-full h-full" viewBox="0 0 400 200">
        {/* 가격 라인 (빨간색) */}
        <polyline
        points={data.map((d, i) => 
            `${(i / (data.length - 1)) * 380 + 10},${190 - (d.price / maxPrice) * 160}`
        ).join(' ')}
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        />
        
        {/* 키워드 언급량 바 (파란색) */}
        {data.map((d, i) => (
        <rect
            key={i}
            x={(i / (data.length - 1)) * 380 + 8}
            y={190 - (d.keyword_mentions / maxMentions) * 80}
            width="4"
            height={(d.keyword_mentions / maxMentions) * 80}
            fill="#3b82f6"
            opacity="0.6"
        />
        ))}
    </svg>
    
    {/* 범례 */}
    <div className="absolute top-2 left-2 flex items-center space-x-4">
        <div className="flex items-center space-x-1">
        <div className="w-3 h-0.5 bg-red-500"></div>
        <span className="text-xs text-gray-600">주가</span>
        </div>
        <div className="flex items-center space-x-1">
        <div className="w-3 h-3 bg-blue-500 opacity-60"></div>
        <span className="text-xs text-gray-600">키워드 언급</span>
        </div>
    </div>
    </div>

    {/* 통계 */}
    <div className="grid grid-cols-3 gap-4">
    <div className="text-center">
        <div className="text-lg font-bold text-gray-900">
        {data.reduce((sum, d) => sum + d.keyword_mentions, 0)}
        </div>
        <div className="text-sm text-gray-600">총 언급</div>
    </div>
    <div className="text-center">
        <div className="text-lg font-bold text-gray-900">
        {data.length}일
        </div>
        <div className="text-sm text-gray-600">분석 기간</div>
    </div>
    <div className="text-center">
        <div className="text-lg font-bold text-gray-900">
        {data.length > 1 ? ((data[data.length - 1]?.price - data[0]?.price) / data[0]?.price * 100).toFixed(1) : '0.0'}%
        </div>
        <div className="text-sm text-gray-600">주가 변동</div>
    </div>
    </div>
</div>
);
};

export default CorrelationChart;