// KeywordDetailPanel.js
"use client";
import React, { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, Newspaper, BarChart3, Hash, Activity, Users, TrendingDown, ExternalLink, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Bar } from 'recharts';
// Enhanced KeywordDetailPanel Component
const KeywordDetailPanel = ({ keyword, onClose }) => {
    const [stats, setStats] = useState(null);
    const [news, setNews] = useState([]);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stocks');

useEffect(() => {
    if (!keyword) return;
    
    setLoading(true);
    Promise.all([
    fetch(`http://192.168.1.105:8000/api/keyword_stats?keyword=${encodeURIComponent(keyword.keyword)}&days=30`)
        .then(res => res.json()),
    fetch(`http://192.168.1.105:8000/api/keyword_news?keyword=${encodeURIComponent(keyword.keyword)}&days=7&limit=20`)
        .then(res => res.json()),
    fetch(`http://192.168.1.105:8000/api/related_keywords?keyword=${encodeURIComponent(keyword.keyword)}&days=7&limit=10`)
        .then(res => res.json())
    ]).then(([statsData, newsData, relatedData]) => {
    setStats(statsData);
    setNews(newsData.news || []);
    setRelated(relatedData.related_keywords || []);
    setLoading(false);
    }).catch(err => {
    console.error('Error fetching keyword details:', err);
    setLoading(false);
    });
}, [keyword]);

if (!keyword) return null;

if (loading) {
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-8">
            <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
            </div>
            </div>
        </div>
        </div>
    </div>
    );
}

// Mock data for related stocks if not available from stats
const relatedStocks = stats?.related_tickers || keyword.tickers?.map(ticker => ({
    ticker,
    name: `종목 ${ticker}`,
    sector: '기술',
    price: Math.floor(Math.random() * 200000) + 50000,
    change: (Math.random() - 0.5) * 10,
    correlation: 0.7 + Math.random() * 0.3
})) || [];

const correlationData = [
    { date: '07-01', mentions: 45, priceChange: 1.2 },
    { date: '07-02', mentions: 67, priceChange: 2.8 },
    { date: '07-03', mentions: 23, priceChange: -0.5 },
    { date: '07-04', mentions: 89, priceChange: 3.1 },
    { date: '07-05', mentions: 156, priceChange: 4.7 },
    { date: '07-08', mentions: 98, priceChange: 2.3 },
    { date: '07-09', mentions: 134, priceChange: 3.9 }
];

const getSentimentBadge = (sentiment) => {
    const badges = {
    positive: 'bg-green-100 text-green-800',
    negative: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800'
    };
    const labels = {
    positive: '긍정',
    negative: '부정',
    neutral: '중립'
    };
    return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[sentiment] || badges.neutral}`}>
        {labels[sentiment] || labels.neutral}
    </span>
    );
};

const tabs = [
    { id: 'stocks', label: '관련 종목', icon: TrendingUp },
    { id: 'news', label: '관련 뉴스', icon: Newspaper },
    { id: 'correlation', label: '상관관계', icon: BarChart3 }
];

return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
            <Hash className="w-6 h-6 text-blue-600" />
            </div>
            <div>
            <h2 className="text-2xl font-bold text-gray-900">
                {keyword.keyword}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                {keyword.count?.toLocaleString() || 0}건 언급
                </span>
                <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {keyword.tickers?.length || 0}개 종목
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                +12% 증가
                </span>
            </div>
            </div>
        </div>
        <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
        <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                </button>
            );
            })}
        </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
        {activeTab === 'stocks' && (
            <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedStocks.map((stock, index) => (
                <div key={stock.ticker || index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{stock.name || `종목 ${stock.ticker}`}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                            {stock.ticker}
                        </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>상관계수: {stock.correlation?.toFixed(2) || '0.75'}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {stock.sector || '기술'}
                        </span>
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="text-lg font-bold text-gray-900">
                        {stock.price?.toLocaleString() || '185,000'}원
                        </div>
                        <div className="flex items-center gap-1">
                        {(stock.change || 2.5) > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={(stock.change || 2.5) > 0 ? 'text-green-500' : 'text-red-500'}>
                            {(stock.change || 2.5) > 0 ? '+' : ''}{(stock.change || 2.5).toFixed(2)}%
                        </span>
                        </div>
                    </div>
                    </div>
                </div>
                ))}
            </div>
            </div>
        )}

        {activeTab === 'news' && (
            <div className="space-y-4">
            {news.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>관련 뉴스가 없습니다.</p>
                </div>
            ) : (
                news.map((article, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                        <h4 className="font-semibold text-gray-900 leading-tight">{article.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                        {getSentimentBadge(article.sentiment)}
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">{article.summary}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{article.source || '한국경제'}</span>
                        <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{article.published_at || '2024-01-15'}</span>
                        </div>
                    </div>
                    </div>
                </div>
                ))
            )}
            </div>
        )}

        {activeTab === 'correlation' && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4">언급량 추이</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={correlationData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                        type="monotone" 
                        dataKey="mentions" 
                        stroke="#3b82f6" 
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                        name="언급량"
                        />
                    </AreaChart>
                    </ResponsiveContainer>
                </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4">주가 변동률</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={correlationData}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="priceChange" fill="#10b981" name="주가변동%" />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-6">
                <h4 className="font-semibold mb-4">분석 인사이트</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">0.74</div>
                    <div className="text-sm text-gray-600">상관계수</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-gray-600">예측 정확도</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">높음</div>
                    <div className="text-sm text-gray-600">영향력</div>
                </div>
                </div>
                <div className="text-sm text-gray-600 bg-white p-4 rounded-lg">
                💡 <strong>{keyword.keyword}</strong> 키워드의 언급량과 관련 종목 주가 간에는 
                높은 양의 상관관계(0.74)가 관찰됩니다. 특히 언급량이 100건을 넘을 때 
                주가 상승 확률이 78% 증가하는 패턴을 보입니다.
                </div>
            </div>
            </div>
        )}
        </div>
    </div>
    </div>
);
};

export default KeywordDetailPanel; 