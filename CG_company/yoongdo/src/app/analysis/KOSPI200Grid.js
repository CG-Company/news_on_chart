// KOSPI200Grid.js
"use client";
import React, { useEffect, useState } from 'react';
import { PieChart, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const KOSPI200Grid = ({ search = '' }) => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchStocks = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch('http://192.168.1.105:8000/api/ticker_map');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Stocks API Response:', data); // 디버깅용
                
                // 데이터가 배열인지 확인
                const stocksArray = Array.isArray(data) ? data : (data.stocks || []);
                
                // 실제 데이터에 모의 주가 정보 추가
                const stocksWithPrices = stocksArray.map((stock, index) => ({
                    ...stock,
                    ticker: stock.ticker || `000${index.toString().padStart(3, '0')}`,
                    name: stock.name || stock.company_name || `종목 ${stock.ticker}`,
                    sector: stock.sector || '기타',
                    price: Math.floor(Math.random() * 200000) + 50000,
                    change: (Math.random() - 0.5) * 10,
                    marketCap: Math.floor(Math.random() * 50) + 10,
                    volume: Math.floor(Math.random() * 1000000),
                    trend: Math.random() > 0.5 ? 'up' : 'down'
                }));
                
                setStocks(stocksWithPrices);
            } catch (err) {
                console.error('Error fetching stocks:', err);
                setError(err.message);
                setStocks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStocks();
    }, []);

    // 검색 필터링
    const filteredStocks = stocks.filter(stock => 
        search === '' || 
        (stock.name && stock.name.toLowerCase().includes(search.toLowerCase())) ||
        (stock.ticker && stock.ticker.includes(search.toUpperCase())) ||
        (stock.sector && stock.sector.toLowerCase().includes(search.toLowerCase()))
    );

    const displayedStocks = showAll ? filteredStocks : filteredStocks.slice(0, 12);

    // 로딩 상태
    if (loading) {
        return (
            <div className="mt-12">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="mt-12">
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
                    <div className="flex items-center justify-center text-red-500">
                        <AlertCircle className="w-8 h-8 mr-3" />
                        <div>
                            <h3 className="text-lg font-semibold">종목 데이터를 불러올 수 없습니다</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                서버 연결을 확인해주세요: {error}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 데이터 없음 상태
    if (filteredStocks.length === 0) {
        return (
            <div className="mt-12">
                <div className="bg-white rounded-xl shadow-sm border p-8">
                    <div className="text-center text-gray-500">
                        <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">종목이 없습니다</h3>
                        <p className="text-sm">
                            {search ? `"${search}"에 대한 검색 결과가 없습니다` : '종목 데이터가 없습니다'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-white p-6 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <PieChart className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">전체 종목</h2>
                                <p className="text-sm text-gray-600">종목 현황</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-500">
                                {filteredStocks.length.toLocaleString()}개 종목
                            </div>
                            {filteredStocks.length > 12 && (
                                <button
                                    onClick={() => setShowAll(!showAll)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    {showAll ? '접기' : '전체 보기'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedStocks.map((stock, index) => (
                            <div 
                                key={stock.ticker || index} 
                                className="group p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${
                                            stock.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                        <span className="text-xs font-medium text-gray-500">
                                            #{index + 1}
                                        </span>
                                    </div>
                                    <div className={`p-1 rounded ${
                                        (stock.change || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
                                    }`}>
                                        {(stock.change || 0) >= 0 ? (
                                            <TrendingUp className="w-3 h-3 text-green-600" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3 text-red-600" />
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {stock.name || `종목 ${stock.ticker}`}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">{stock.ticker}</span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                                {stock.sector || '기타'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {(stock.price || 185000).toLocaleString()}원
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                (stock.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {(stock.change || 0) >= 0 ? '+' : ''}{(stock.change || 2.5).toFixed(2)}%
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <div>시총 {stock.marketCap || 134}조</div>
                                            <div>거래량 {(stock.volume || 230000).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {!showAll && filteredStocks.length > 12 && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setShowAll(true)}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                {filteredStocks.length - 12}개 더 보기
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KOSPI200Grid;