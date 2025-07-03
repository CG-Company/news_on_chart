// KeywordDetailPanel.js
"use client";
import React, { useEffect, useState } from "react";
import {
ArrowLeft,
TrendingUp,
Newspaper,
BarChart3,
Hash,
Activity,
Users,
TrendingDown,
ExternalLink,
Calendar,
AlertCircle,
} from "lucide-react";
import {
ResponsiveContainer,
AreaChart,
BarChart,
CartesianGrid,
XAxis,
YAxis,
Tooltip,
Area,
Bar,
} from "recharts";

const KeywordDetailPanel = ({ keyword, onClose }) => {
const [stats, setStats] = useState(null);
const [news, setNews] = useState([]);
const [related, setRelated] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [activeTab, setActiveTab] = useState("stocks");
const [tickerMap, setTickerMap] = useState([]);
const [relatedStocksWithPrices, setRelatedStocksWithPrices] = useState([]);

// 티커맵 가져오기
useEffect(() => {
    const fetchTickerMap = async () => {
        try {
            const response = await fetch('http://192.168.1.105:8000/api/ticker_map');
            if (response.ok) {
                const data = await response.json();
                setTickerMap(data);
                console.log('TickerMap loaded for KeywordDetailPanel:', data.length, '종목');
            }
        } catch (error) {
            console.warn('Failed to load ticker map:', error);
        }
    };
    fetchTickerMap();
}, []);

// 주식 데이터 가져오기 함수
const fetchStockData = async (ticker) => {
    try {
        const response = await fetch(`http://192.168.1.105:8000/api/stock?ticker=${ticker}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        const stockArray = data.stockData || [];
        // 최신 데이터 (배열의 마지막 요소)
        return stockArray.length > 0 ? stockArray[stockArray.length - 1] : null;
    } catch (error) {
        console.warn(`Error fetching stock data for ${ticker}:`, error);
        return null;
    }
};

// 종목명 찾기 함수
const getCompanyName = (ticker) => {
    const found = tickerMap.find(item => item.ticker === ticker);
    return found ? (found.name || found.company_name) : ticker;
};

// 관련 종목의 실제 데이터 가져오기
useEffect(() => {
    const fetchRelatedStocksData = async () => {
        if (!keyword?.tickers || tickerMap.length === 0) {
            setRelatedStocksWithPrices([]);
            return;
        }

        console.log('Fetching stock prices for keyword tickers:', keyword.tickers);

        try {
            const stocksWithPrices = await Promise.all(
                keyword.tickers.map(async (tickerInfo) => {
                    // tickerInfo가 객체인지 확인하고 ticker 추출
                    const ticker = typeof tickerInfo === 'object' ? tickerInfo.ticker : tickerInfo;
                    
                    if (!ticker) {
                        console.warn('Invalid ticker info:', tickerInfo);
                        return null;
                    }

                    console.log(`Fetching stock data for: ${ticker}`);
                    
                    const stockData = await fetchStockData(ticker);
                    const companyName = getCompanyName(ticker);
                    
                    return {
                        ticker: ticker,
                        name: companyName,
                        sector: typeof tickerInfo === 'object' ? tickerInfo.sector : '기술',
                        price: stockData ? stockData.close : (typeof tickerInfo === 'object' ? tickerInfo.price : null),
                        change: stockData ? stockData.change_rate : (typeof tickerInfo === 'object' ? tickerInfo.change_rate : null),
                        date: stockData ? stockData.date : null,
                        hasRealData: !!stockData,
                        correlation: 0.7 + Math.random() * 0.3 // 상관계수는 임시 데이터
                    };
                })
            );

            // null 값 제거
            const validStocks = stocksWithPrices.filter(stock => stock !== null);
            setRelatedStocksWithPrices(validStocks);
            console.log('Related stocks with prices loaded:', validStocks);

        } catch (error) {
            console.error('Error fetching related stocks data:', error);
            setRelatedStocksWithPrices([]);
        }
    };

    fetchRelatedStocksData();
}, [keyword, tickerMap]);

useEffect(() => {
if (!keyword) return;

const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
    const [statsResponse, newsResponse, relatedResponse] =
        await Promise.allSettled([
        fetch(
            `http://192.168.1.105:8000/api/keyword_stats?keyword=${encodeURIComponent(
            keyword.keyword
            )}&days=30`
        ),
        fetch(
            `http://192.168.1.105:8000/api/keyword_news?keyword=${encodeURIComponent(
            keyword.keyword
            )}&days=7&limit=20`
        ),
        fetch(
            `http://192.168.1.105:8000/api/related_keywords?keyword=${encodeURIComponent(
            keyword.keyword
            )}&days=7&limit=10`
        ),
        ]);

    // 통계 데이터 처리
    if (statsResponse.status === "fulfilled" && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json();
        setStats(statsData);
    } else {
        console.warn("Stats API failed:", statsResponse.reason);
        setStats(null);
    }

    // 뉴스 데이터 처리
    if (newsResponse.status === "fulfilled" && newsResponse.value.ok) {
        const newsData = await newsResponse.value.json();
        setNews(newsData.news || []);
    } else {
        console.warn("News API failed:", newsResponse.reason);
        setNews([]);
    }

    // 관련 키워드 처리
    if (
        relatedResponse.status === "fulfilled" &&
        relatedResponse.value.ok
    ) {
        const relatedData = await relatedResponse.value.json();
        setRelated(relatedData.related_keywords || []);
    } else {
        console.warn("Related keywords API failed:", relatedResponse.reason);
        setRelated([]);
    }
    } catch (err) {
    console.error("Error fetching keyword details:", err);
    setError(err.message);
    } finally {
    setLoading(false);
    }
};

fetchData();
}, [keyword]);

if (!keyword) return null;

// 로딩 상태
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

// 에러 상태
if (error) {
return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-2xl w-full p-8">
        <div className="text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
            데이터를 불러올 수 없습니다
        </h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
            닫기
        </button>
        </div>
    </div>
    </div>
);
}

// 상관관계 차트 데이터 (모의 데이터)
const correlationData = stats?.daily_stats
?.slice(0, 7)
.map((stat, index) => ({
    date: new Date(stat.date).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    }),
    mentions: stat.mention_count || 0,
    priceChange: (Math.random() - 0.5) * 6,
})) || [
{ date: "07-01", mentions: 45, priceChange: 1.2 },
{ date: "07-02", mentions: 67, priceChange: 2.8 },
{ date: "07-03", mentions: 23, priceChange: -0.5 },
{ date: "07-04", mentions: 89, priceChange: 3.1 },
{ date: "07-05", mentions: 156, priceChange: 4.7 },
{ date: "07-08", mentions: 98, priceChange: 2.3 },
{ date: "07-09", mentions: 134, priceChange: 3.9 },
];

const getSentimentBadge = (sentiment) => {
const badges = {
    positive: "bg-green-100 text-green-800",
    negative: "bg-red-100 text-red-800",
    neutral: "bg-gray-100 text-gray-800",
};
const labels = {
    positive: "긍정",
    negative: "부정",
    neutral: "중립",
};
return (
    <span
    className={`px-2 py-1 rounded-full text-xs font-medium ${
        badges[sentiment] || badges.neutral
    }`}
    >
    {labels[sentiment] || labels.neutral}
    </span>
);
};

const tabs = [
{ id: "stocks", label: "관련 종목", icon: TrendingUp },
{ id: "news", label: "관련 뉴스", icon: Newspaper },
{ id: "correlation", label: "상관관계", icon: BarChart3 },
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
                {(keyword.count || 0).toLocaleString()}건 언급
            </span>
            <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {keyword.tickers?.length || 0}개 종목
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                활성 키워드
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
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
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
        {activeTab === "stocks" && (
        <div className="space-y-4">
            {relatedStocksWithPrices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>관련 종목 정보를 불러오는 중이거나 데이터가 없습니다.</p>
            </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedStocksWithPrices.map((stock, index) => (
                    <div
                        key={`${stock.ticker}-${index}`}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">
                                        {stock.name}
                                    </h4>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                                        {stock.ticker}
                                    </span>
                                    {stock.hasRealData && (
                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="실시간 데이터"></span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>
                                        상관계수: {stock.correlation.toFixed(2)}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                        {stock.sector}
                                    </span>
                                </div>
                                {stock.date && (
                                    <div className="text-xs text-gray-400">
                                        {stock.date} 기준
                                    </div>
                                )}
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-lg font-bold text-gray-900">
                                    {stock.price !== null 
                                        ? `${stock.price.toLocaleString()}원`
                                        : '데이터 없음'
                                    }
                                </div>
                                {stock.change !== null && (
                                    <div className="flex items-center gap-1">
                                        {stock.change > 0 ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className={stock.change > 0 ? "text-green-500" : "text-red-500"}>
                                            {stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            )}
        </div>
        )}

        {activeTab === "news" && (
        <div className="space-y-4">
            {news.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
                <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>관련 뉴스가 없습니다.</p>
            </div>
            ) : (
            news.map((article, index) => (
                <div
                key={index}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                >
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-gray-900 leading-tight">
                        {article.title}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                        {getSentimentBadge(article.sentiment)}
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    </div>
                    <p className="text-sm text-gray-600">{article.summary}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{article.ticker || "종합"}</span>
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{article.published_at || "2024-01-15"}</span>
                    </div>
                    </div>
                </div>
                </div>
            ))
            )}
        </div>
        )}

        {activeTab === "correlation" && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold mb-4">언급량 추이</h4>
                <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={correlationData}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                    />
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
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                    />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                        dataKey="priceChange"
                        fill="#10b981"
                        name="주가변동%"
                    />
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-6">
            <h4 className="font-semibold mb-4">분석 인사이트</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                    {stats?.total_mentions || keyword.count || 0}
                </div>
                <div className="text-sm text-gray-600">총 언급량</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                    {stats?.total_tickers || keyword.tickers?.length || 0}
                </div>
                <div className="text-sm text-gray-600">관련 종목</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                    {stats?.avg_daily_mentions?.toFixed(1) || "0.0"}
                </div>
                <div className="text-sm text-gray-600">일평균 언급</div>
                </div>
            </div>
            <div className="text-sm text-gray-600 bg-white p-4 rounded-lg">
                💡 <strong>{keyword.keyword}</strong> 키워드는 최근 활발한
                관심을 받고 있으며,
                {keyword.tickers?.length || 0}개의 종목과 연관되어 있습니다.
                {stats?.total_mentions || keyword.count || 0}건의 언급량을
                기록했습니다.
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
