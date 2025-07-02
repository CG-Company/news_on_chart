// KeywordSummaryStats.js
"use client";
import React, { useEffect, useState } from 'react';
import { Hash, Star, Activity, TrendingUp, TrendingDown } from 'lucide-react';

const KeywordSummaryStats = ({ selectedPeriod }) => {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);

useEffect(() => {
    setLoading(true);
    fetch(`http://192.168.1.105:8000/api/popular_keywords?days=${selectedPeriod}&limit=50`)
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

if (loading) {
    return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
        ))}
    </div>
    );
}

const totalMentions = keywords.reduce((sum, k) => sum + (k.count || 0), 0);
const hotKeywords = keywords.filter(k => k.is_hot).length;
const positiveRatio = keywords.length > 0 ? Math.round((keywords.filter(k => k.sentiment === 'positive').length / keywords.length) * 100) : 0;
const avgMentions = keywords.length > 0 ? Math.round(totalMentions / keywords.length) : 0;

const stats = [
    {
    title: '총 키워드',
    value: keywords.length,
    unit: '개',
    change: '+2',
    trend: 'up',
    icon: Hash,
    color: 'blue',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
    },
    {
    title: 'HOT 키워드',
    value: hotKeywords,
    unit: '개',
    change: '+3',
    trend: 'up',
    icon: Star,
    color: 'orange',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600'
    },
    {
    title: '평균 언급량',
    value: avgMentions,
    unit: '건',
    change: '+12%',
    trend: 'up',
    icon: Activity,
    color: 'green',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600'
    },
    {
    title: '긍정 비율',
    value: positiveRatio,
    unit: '%',
    change: '+5%',
    trend: 'up',
    icon: TrendingUp,
    color: 'purple',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600'
    }
];

return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
    {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
            <div className={`flex items-center text-xs font-medium ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
                {stat.trend === 'up' ? (
                <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {stat.change}
            </div>
            </div>
            <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{stat.title}</p>
            <p className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">{stat.unit}</span>
            </p>
            </div>
        </div>
        );
    })}
    </div>
);
};


export default KeywordSummaryStats; 