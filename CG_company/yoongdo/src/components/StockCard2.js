// components/StockCard.js
import React from "react";

const StockCard = ({ stock, keywordMentions }) => {
const isPositive = stock.change >= 0;

return (
<div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
    <div className="flex justify-between items-start mb-3">
    <div>
        <h4 className="font-bold text-gray-900 text-base">{stock.name}</h4>
        <p className="text-sm text-gray-500">{stock.ticker}</p>
    </div>
    <div className="text-right">
        <p className="font-bold text-gray-900">{stock.price.toLocaleString()}원</p>
        <p className={`text-sm font-medium ${isPositive ? 'text-red-500' : 'text-blue-500'}`}>
        {isPositive ? '+' : ''}{stock.change.toFixed(2)}%
        </p>
    </div>
    </div>
    
    <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">키워드 언급</span>
    <span className="text-sm font-semibold text-gray-900">{keywordMentions}회</span>
    </div>
</div>
);
};

export default StockCard;