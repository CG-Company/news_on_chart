// KeywordCardGrid.js
"use client";
import React, { useEffect, useState } from 'react';
import { Star, Hash, Activity, Users, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const KeywordCardGrid = ({ selectedPeriod, onSelectKeyword, search = '' }) => {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tickerMap, setTickerMap] = useState([]);

    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";

    // 티커맵 가져오기
    useEffect(() => {
        const fetchTickerMap = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/ticker_map`);
                if (response.ok) {
                    const data = await response.json();
                    setTickerMap(data);
                    console.log('TickerMap loaded:', data.length, '종목');
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
            const response = await fetch(`${API_BASE}/api/stock?ticker=${ticker}`);
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

    useEffect(() => {
        const fetchKeywords = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(
                    `${API_BASE}/api/popular_keywords?days=${selectedPeriod}&limit=12`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Popular Keywords API Response:', data);
                
                // API 응답 구조에 맞게 데이터 추출
                const keywordsData = data.keywords || [];
                
                // 각 키워드의 관련 종목들에 대해 실제 주식 데이터 가져오기 (배치 처리)
                const processedKeywords = await Promise.all(
                    keywordsData.map(async (keyword, index) => {
                        console.log(`Processing keyword: ${keyword.keyword}`, keyword.tickers);
                        
                        const tickers = keyword.tickers || [];
                        
                        // 각 티커에 대해 실제 주식 데이터 가져오기 (최대 3개만, 더 빠른 로딩)
                        const tickersWithPrices = await Promise.allSettled(
                            tickers.slice(0, 3).map(async (tickerInfo) => {
                                // tickerInfo가 객체인지 확인하고 ticker 추출
                                const ticker = typeof tickerInfo === 'object' ? tickerInfo.ticker : tickerInfo;
                                
                                if (!ticker) {
                                    console.warn('Invalid ticker info:', tickerInfo);
                                    return null;
                                }
                                
                                console.log(`Fetching data for ticker: ${ticker}`);
                                
                                const stockData = await fetchStockData(ticker);
                                const companyName = getCompanyName(ticker);
                                
                                return {
                                    ticker: ticker,
                                    name: companyName,
                                    price: stockData ? stockData.close : (typeof tickerInfo === 'object' ? tickerInfo.price : null),
                                    change_rate: stockData ? stockData.change_rate : (typeof tickerInfo === 'object' ? tickerInfo.change_rate : null),
                                    date: stockData ? stockData.date : null,
                                    hasRealData: !!stockData,
                                    sector: typeof tickerInfo === 'object' ? tickerInfo.sector : null
                                };
                            })
                        );

                        // 성공한 결과만 추출하고 null 값 제거
                        const validTickers = tickersWithPrices
                            .filter(result => result.status === 'fulfilled' && result.value !== null)
                            .map(result => result.value);

                        return {
                            ...keyword,
                            rank: keyword.rank || index + 1,
                            keyword: keyword.keyword || '',
                            count: keyword.count || 0,
                            tickers: validTickers,
                            sentiment: keyword.sentiment || 'neutral',
                            is_hot: keyword.count > 10 || false,
                            change_rate: Math.floor(Math.random() * 20) - 5
                        };
                    })
                );
                
                console.log('Processed keywords with stock data:', processedKeywords);
                setKeywords(processedKeywords);
            } catch (err) {
                console.error('Error fetching keywords:', err);
                setError(err.message);
                setKeywords([]);
            } finally {
                setLoading(false);
            }
        };

        // 티커맵이 로드된 후에만 키워드 데이터 가져오기
        if (tickerMap.length > 0) {
            fetchKeywords();
        }
    }, [selectedPeriod, tickerMap]);

    // 검색 필터링
    const filteredKeywords = keywords.filter(keyword => 
        search === '' || 
        (keyword.keyword && keyword.keyword.toLowerCase().includes(search.toLowerCase()))
    );

    // 로딩 상태
    if (loading) {
        return (
            <div className="mb-8">
                <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-xl shadow-lg border p-8 mb-6 relative overflow-hidden">
                    {/* 배경 애니메이션 */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-8 right-8 w-16 h-16 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="absolute bottom-8 left-8 w-12 h-12 bg-blue-400 rounded-full animate-pulse delay-500"></div>
                    </div>

                    {/* 로딩 헤더 */}
                    <div className="relative z-10 text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full mb-4 animate-bounce">
                            <Hash className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            🔍 키워드 분석 중...
                        </h3>
                        <p className="text-gray-600">
                            인기 키워드와 관련 종목 데이터를 수집하고 있습니다
                        </p>
                    </div>

                    {/* 진행 단계 */}
                    <div className="relative z-10 flex justify-center space-x-6 mb-6">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm text-gray-700">키워드 수집</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-300"></div>
                            <span className="text-sm text-gray-700">종목 매칭</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-700"></div>
                            <span className="text-sm text-gray-700">실시간 데이터</span>
                        </div>
                    </div>

                    <div className="relative z-10 text-center text-sm text-gray-500">
                        💡 {selectedPeriod}일 기간의 인기 키워드를 분석하고 있습니다
                    </div>
                </div>

                {/* 스켈레톤 카드들 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div 
                            key={i} 
                            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border p-6 animate-pulse hover:shadow-md transition-all duration-300"
                            style={{
                                animationDelay: `${i * 150}ms`,
                                animation: 'fadeInUp 0.8s ease-out forwards'
                            }}
                        >
                            <div className="space-y-4">
                                {/* 헤더 */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full w-12 animate-pulse"></div>
                                        <div className="h-8 w-8 bg-gradient-to-r from-blue-200 to-blue-300 rounded-lg animate-pulse delay-200"></div>
                                    </div>
                                    <div className="text-right">
                                        <div className="h-3 bg-gray-200 rounded w-8 mb-1 animate-pulse delay-300"></div>
                                        <div className="h-4 bg-gradient-to-r from-green-200 to-green-300 rounded w-10 animate-pulse delay-500"></div>
                                    </div>
                                </div>
                                
                                {/* 키워드명 */}
                                <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4 animate-pulse delay-400"></div>
                                
                                {/* 통계 */}
                                <div className="flex gap-4">
                                    <div className="h-4 bg-gradient-to-r from-purple-200 to-purple-300 rounded w-16 animate-pulse delay-600"></div>
                                    <div className="h-4 bg-gradient-to-r from-blue-200 to-blue-300 rounded w-12 animate-pulse delay-800"></div>
                                </div>
                                
                                {/* 종목 정보 */}
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-full animate-pulse delay-1000"></div>
                                    <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse delay-1200"></div>
                                    <div className="h-2 bg-gradient-to-r from-blue-200 to-blue-400 rounded w-full animate-pulse delay-1400"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CSS 애니메이션 */}
                <style jsx>{`
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                `}</style>
            </div>
        );
    }

    // 에러 상태
    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 mb-8">
                <div className="flex items-center justify-center text-red-500">
                    <AlertCircle className="w-8 h-8 mr-3" />
                    <div>
                        <h3 className="text-lg font-semibold">데이터를 불러올 수 없습니다</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            서버 연결을 확인해주세요: {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // 데이터 없음 상태
    if (filteredKeywords.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                <div className="text-center text-gray-500">
                    <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">키워드가 없습니다</h3>
                    <p className="text-sm">
                        {search ? `"${search}"에 대한 검색 결과가 없습니다` : '해당 기간에 키워드 데이터가 없습니다'}
                    </p>
                </div>
            </div>
        );
    }

    // 감정에 따른 색상 설정
    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'positive': return 'border-l-green-500 bg-gradient-to-r from-green-50 to-white';
            case 'negative': return 'border-l-red-500 bg-gradient-to-r from-red-50 to-white';
            default: return 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-white';
        }
    };

    // 최대 언급량 계산 (프로그레스 바용)
    const maxCount = Math.max(...filteredKeywords.map(k => k.count || 0), 1);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredKeywords.map((keyword, index) => (
                <div
                    key={`${keyword.keyword}-${keyword.rank || index}`}
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
                                    #{keyword.rank || index + 1}
                                </span>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Hash className="w-4 h-4 text-blue-600" />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">변화율</div>
                                <div className={`text-sm font-semibold ${
                                    keyword.change_rate >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {keyword.change_rate >= 0 ? '+' : ''}{keyword.change_rate}%
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                                {keyword.keyword || '키워드 없음'}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {(keyword.count || 0).toLocaleString()}건
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {(keyword.tickers?.length || 0)}개
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">언급량</span>
                                <span className="font-semibold text-blue-600">
                                    {(keyword.count || 0).toLocaleString()}건
                                </span>
                            </div>
                            
                            {/* 관련 종목 실제 데이터 표시 */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">관련 종목</span>
                                    <span className="font-semibold text-gray-900">
                                        {keyword.tickers?.length || 0}개
                                    </span>
                                </div>
                                
                                {/* 주요 종목 3개 표시 */}
                                {keyword.tickers && keyword.tickers.length > 0 && (
                                    <div className="space-y-1 max-h-24 overflow-y-auto">
                                        {keyword.tickers.slice(0, 3).map((ticker, idx) => (
                                            <div key={`${ticker.ticker}-${idx}`} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <span className="font-medium text-gray-700 truncate">
                                                        {ticker.name || ticker.ticker}
                                                    </span>
                                                    <span className="text-gray-500 text-xs">
                                                        {ticker.ticker}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {ticker.price && (
                                                        <span className="font-semibold text-gray-900 text-xs">
                                                            {ticker.price.toLocaleString()}원
                                                        </span>
                                                    )}
                                                    {ticker.change_rate !== null && ticker.change_rate !== undefined && (
                                                        <div className={`flex items-center gap-0.5 ${
                                                            ticker.change_rate >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {ticker.change_rate >= 0 ? (
                                                                <TrendingUp className="w-3 h-3" />
                                                            ) : (
                                                                <TrendingDown className="w-3 h-3" />
                                                            )}
                                                            <span className="font-medium text-xs">
                                                                {ticker.change_rate >= 0 ? '+' : ''}{ticker.change_rate?.toFixed(2)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                    {ticker.hasRealData && (
                                                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full" title="실시간 데이터"></span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {keyword.tickers.length > 3 && (
                                            <div className="text-xs text-gray-500 text-center py-1">
                                                +{keyword.tickers.length - 3}개 더
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${Math.min(((keyword.count || 0) / maxCount) * 100, 100)}%` 
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