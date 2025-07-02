// components/KeywordCard.js
import React from "react";

const KeywordCard = ({ keyword, rank, onClick, isSelected, stockCount }) => {
const getSentimentIcon = (sentiment) => {
if (sentiment > 0.1) return { icon: "↗", color: "text-red-500" };
if (sentiment < -0.1) return { icon: "↘", color: "text-blue-500" };
return { icon: "→", color: "text-gray-500" };
};

const sentimentData = getSentimentIcon(keyword.sentiment);

return (
<div
    onClick={() => onClick(keyword)}
    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
    isSelected 
        ? 'border-gray-900 bg-gray-50' 
        : 'border-gray-200 hover:border-gray-300 bg-white'
    }`}
>
    <div className="flex items-start justify-between mb-3">
    <div className="flex items-center space-x-2">
        <span className="text-xs font-bold text-gray-400">#{rank}</span>
        <h3 className="text-lg font-bold text-gray-900">{keyword.keyword}</h3>
    </div>
    <span className={`text-xl ${sentimentData.color}`}>
        {sentimentData.icon}
    </span>
    </div>
    
    <div className="space-y-1">
    <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">언급</span>
        <span className="text-sm font-semibold text-gray-900">{keyword.count}회</span>
    </div>
    <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">관련 종목</span>
        <span className="text-sm font-semibold text-gray-900">{stockCount}개</span>
    </div>
    </div>
</div>
);
};

export default KeywordCard;