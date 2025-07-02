// components/NewsCard.js
import React from "react";

const NewsCard = ({ news, keyword }) => {
const keywordRegex = new RegExp(`(${keyword})`, 'gi');
const highlightedTitle = news.title.replace(keywordRegex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');

return (
<div className="p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
    <div className="flex items-start space-x-3">
    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
        news.sentiment > 0 ? 'bg-red-500' : news.sentiment < 0 ? 'bg-blue-500' : 'bg-gray-400'
    }`}></div>
    <div className="flex-1">
        <h5 
        className="font-medium text-gray-900 text-sm mb-2 leading-5"
        dangerouslySetInnerHTML={{ __html: highlightedTitle }}
        />
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {news.summary}
        </p>
        <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{news.date}</span>
        <div className="flex items-center space-x-2">
            {news.is_main_news && (
            <span className="text-xs bg-gray-900 text-white px-2 py-1 rounded-full">
                메인
            </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
            news.sentiment > 0 ? 'bg-red-50 text-red-600' : 
            news.sentiment < 0 ? 'bg-blue-50 text-blue-600' : 
            'bg-gray-50 text-gray-600'
            }`}>
            {news.sentiment > 0 ? '긍정' : news.sentiment < 0 ? '부정' : '중립'}
            </span>
        </div>
        </div>
    </div>
    </div>
</div>
);
};

export default NewsCard;