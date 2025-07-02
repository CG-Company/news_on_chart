// KeywordCardGrid.js
"use client";
import React, { useEffect, useState } from 'react';
import { Star, Hash, Activity, Users } from 'lucide-react';

// Enhanced KeywordCardGrid Component
const KeywordCardGrid = ({ selectedPeriod, onSelectKeyword, search = '' }) => {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);

useEffect(() => {
    setLoading(true);
    fetch(`http://192.168.1.105:8000/api/popular_keywords?days=${selectedPeriod}&limit=12`)
    .then(res => res.json())
    .then(data => {
        setKeywords(data.keywords || []);
        setLoading(false);
    })
    .catch(err => {
        console.error('Error fetching keywords:', err);
        setLoading(false);
    });
}, [selectedPeriod]);

const filteredKeywords = keywords.filter(keyword => 
    search === '' || keyword.keyword.toLowerCase().includes(search.toLowerCase())
);

if (loading) {
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
            </div>
        </div>
        ))}
    </div>
    );
}

const getSentimentColor = (sentiment) => {
    switch (sentiment) {
    case 'positive': return 'border-l-green-500 bg-gradient-to-r from-green-50 to-white';
    case 'negative': return 'border-l-red-500 bg-gradient-to-r from-red-50 to-white';
    default: return 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white';
    }
};

return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {filteredKeywords.map((keyword, index) => (
        <div
        key={keyword.keyword}
        className={`cursor-pointer hover:shadow-xl transition-all duration-300 border-l-4 ${getSentimentColor(keyword.sentiment)} 
                    rounded-xl shadow-sm border border-gray-100 p-6 relative transform hover:-translate-y-1 group`}
        onClick={() => onSelectKeyword(keyword)}
        >
        {keyword.is_hot && (
            <div className="absolute -top-2 -right-2">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Star className="h-3 w-3" />
                HOT
            </div>
            </div>
        )}
        
        <div className="space-y-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-semibold">
                #{keyword.rank}
                </span>
                <div className="p-2 bg-blue-100 rounded-lg">
                <Hash className="w-4 h-4 text-blue-600" />
                </div>
            </div>
            <div className="text-right">
                <div className="text-xs text-gray-500">변화율</div>
                <div className="text-sm font-semibold text-green-600">+12%</div>
            </div>
            </div>
            
            <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                {keyword.keyword}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                {keyword.count}건
                </span>
                <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {keyword.tickers?.length || 0}개
                </span>
            </div>
            </div>
            
            <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">언급량</span>
                <span className="font-semibold text-blue-600">{keyword.count.toLocaleString()}건</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">관련 종목</span>
                <span className="font-semibold text-gray-900">{keyword.tickers?.length || 0}개</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                    width: `${Math.min((keyword.count / Math.max(...filteredKeywords.map(k => k.count))) * 100, 100)}%` 
                }}
                ></div>
            </div>
            </div>
        </div>
        </div>
    ))}
    </div>
);
};


export default KeywordCardGrid; 