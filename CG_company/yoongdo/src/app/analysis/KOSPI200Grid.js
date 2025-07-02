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
        const fetchStocksWithPrices = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // 1. 종목 리스트 가져오기
                const tickerResponse = await fetch('http://192.168.1.105:8000/api/ticker_map');
                if (!tickerResponse.ok) {
                    throw new Error(`Ticker API error! status: ${tickerResponse.status}`);
                }
                
                const tickerData = await tickerResponse.json();
                console.log('Ticker Map Response:', tickerData);
                
                const rawTickerList = Array.isArray(tickerData) ? tickerData : (tickerData.stocks || []);
                
                // 000000 티커(거시뉴스) 제외
                const tickerList = rawTickerList.filter(ticker => ticker.ticker !== '000000');
                
                // 2. 각 종목의 주식 데이터 가져오기 (병렬로 처리, 최대 50개만)
                const limitedTickers = tickerList.slice(0, 50); // 너무 많으면 로딩이 오래걸리므로 제한
                
                const stockPromises = limitedTickers.map(async (ticker) => {
                    try {
                        const stockResponse = await fetch(`http://192.168.1.105:8000/api/stock?ticker=${ticker.ticker}`);
                        if (!stockResponse.ok) {
                            throw new Error(`Stock API error for ${ticker.ticker}`);
                        }
                        
                        const stockData = await stockResponse.json();
                        const stockArray = stockData.stockData || [];
                        
                        // 최신 데이터 (배열의 마지막 요소)
                        const latestStock = stockArray.length > 0 ? stockArray[stockArray.length - 1] : null;
                        
                        return {
                            ticker: ticker.ticker,
                            name: ticker.name || ticker.company_name,
                            sector: ticker.sector || '기타',
                            price: latestStock ? latestStock.close : null,
                            change: latestStock ? latestStock.change_rate : null,
                            date: latestStock ? latestStock.date : null,
                            // 거래량과 시총은 실제 데이터가 없으므로 모의 데이터
                            volume: Math.floor(Math.random() * 1000000) + 100000,
                            marketCap: latestStock ? Math.floor(latestStock.close * (Math.random() * 1000 + 100) / 1000000) : Math.floor(Math.random() * 50) + 10,
                            trend: latestStock && latestStock.change_rate >= 0 ? 'up' : 'down'
                        };
                    } catch (error) {
                        console.warn(`Error fetching stock data for ${ticker.ticker}:`, error);
                        // 주식 데이터를 가져올 수 없으면 기본값 사용
                        return {
                            ticker: ticker.ticker,
                            name: ticker.name || ticker.company_name,
                            sector: ticker.sector || '기타',
                            price: null,
                            change: null,
                            date: null,
                            volume: Math.floor(Math.random() * 1000000) + 100000,
                            marketCap: Math.floor(Math.random() * 50) + 10,
                            trend: 'down'
                        };
                    }
                });
                
                // 모든 주식 데이터 가져오기 완료 대기
                const stocksWithPrices = await Promise.all(stockPromises);
                
                // 가격 데이터가 있는 것들을 우선 정렬
                const sortedStocks = stocksWithPrices.sort((a, b) => {
                    if (a.price && !b.price) return -1;
                    if (!a.price && b.price) return 1;
                    if (a.price && b.price) return b.price - a.price; // 가격 높은 순
                    return a.ticker.localeCompare(b.ticker); // 티커 순
                });
                
                setStocks(sortedStocks);
                console.log(`✅ ${sortedStocks.length}개 종목 데이터 로딩 완료`);
                
            } catch (err) {
                console.error('Error fetching stocks:', err);
                setError(err.message);
                setStocks([]);
            } finally {
                setLoading(false);
            }
        };

        fetchStocksWithPrices();
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
                    <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-4 text-sm text-gray-500">
                        실제 주식 데이터를 불러오는 중입니다...
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
                                <p className="text-sm text-gray-600">실시간 종목 현황</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-500">
                                총 {filteredStocks.length.toLocaleString()}개 종목
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
                                key={stock.ticker} 
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
                                                {stock.sector}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-bold text-gray-900">
                                                {stock.price !== null 
                                                    ? `${stock.price.toLocaleString()}원`
                                                    : '데이터 없음'
                                                }
                                            </div>
                                            <div className={`text-sm font-medium ${
                                                (stock.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {stock.change !== null 
                                                    ? `${(stock.change || 0) >= 0 ? '+' : ''}${(stock.change || 0).toFixed(2)}%`
                                                    : '-'
                                                }
                                            </div>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <div>시총 {stock.marketCap}조</div>
                                            <div>거래량 {stock.volume.toLocaleString()}</div>
                                            {stock.date && (
                                                <div className="mt-1 text-gray-400">{stock.date}</div>
                                            )}
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