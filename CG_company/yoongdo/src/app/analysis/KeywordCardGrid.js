// KeywordCardGrid.js
"use client";
import React, { useEffect, useState } from 'react';
import { Star, Hash, Activity, Users, AlertCircle } from 'lucide-react';

const KeywordCardGrid = ({ selectedPeriod, onSelectKeyword, search = '' }) => {
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKeywords = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(
                    `http://192.168.1.105:8000/api/popular_keywords?days=${selectedPeriod}&limit=12`
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('API Response:', data); // 디버깅용
                
                // API 응답 구조에 맞게 데이터 추출
                const keywordsData = data.keywords || [];
                
                // 각 키워드에 필요한 기본값들 설정
                const processedKeywords = keywordsData.map((keyword, index) => ({
                    ...keyword,
                    rank: keyword.rank || index + 1,
                    keyword: keyword.keyword || '',
                    count: keyword.count || 0,
                    tickers: keyword.tickers || [],
                    sentiment: keyword.sentiment || 'neutral',
                    is_hot: keyword.count > 10 || false, // count가 10 이상이면 HOT
                    change_rate: Math.floor(Math.random() * 20) - 5 // 임시 변화율
                }));
                
                setKeywords(processedKeywords);
            } catch (err) {
                console.error('Error fetching keywords:', err);
                setError(err.message);
                setKeywords([]); // 에러 시 빈 배열로 설정
            } finally {
                setLoading(false);
            }
        };

        fetchKeywords();
    }, [selectedPeriod]);

    // 검색 필터링
    const filteredKeywords = keywords.filter(keyword => 
        search === '' || 
        (keyword.keyword && keyword.keyword.toLowerCase().includes(search.toLowerCase()))
    );

    // 로딩 상태
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
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">관련 종목</span>
                                <span className="font-semibold text-gray-900">
                                    {keyword.tickers?.length || 0}개
                                </span>
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