// ComprehensiveKeywordPage.js
"use client";
import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import KeywordSummaryStats from './KeywordSummaryStats';
import KeywordPeriodTabs from './KeywordPeriodTabs';
import KeywordCardGrid from './KeywordCardGrid';
import KeywordDetailPanel from './KeywordDetailPanel';
import KOSPI200Grid from './KOSPI200Grid';
import { Activity, RefreshCw, Hash, TrendingUp, Search } from 'lucide-react';

// Main ComprehensiveKeywordPage Component
const ComprehensiveKeywordPage = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('7');
    const [selectedKeyword, setSelectedKeyword] = useState(null);
    const [activeTab, setActiveTab] = useState('keywords');
    const [stockSearch, setStockSearch] = useState('');
    const [keywordSearch, setKeywordSearch] = useState('');

const handleKeywordSearch = (e) => {
    e.preventDefault();
    // Implement keyword search logic here
    console.log('Searching for keyword:', keywordSearch);
};

const handleStockSearch = (e) => {
    e.preventDefault();
    // Implement stock search logic here
    console.log('Searching for stock:', stockSearch);
};

return (
    <div className="flex min-h-screen bg-gray-50">
    <Sidebar currentPage="analysis" />
    
    <div className="flex-1 ml-52">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
            <h1 className="text-2xl font-bold text-gray-900">시장 분석 대시보드</h1>
            <p className="text-gray-600 mt-1">실시간 키워드 트렌드와 종목 분석</p>
            </div>
            <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Activity className="w-4 h-4" />
                <span>실시간 업데이트</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
                새로고침
            </button>
            </div>
        </div>
        </div>

        <div className="p-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg inline-flex">
            <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'keywords' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('keywords')}
            >
            <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                키워드 분석
            </div>
            </button>
            <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'stocks' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('stocks')}
            >
            <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                전체 종목
            </div>
            </button>
        </div>

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
            <>
            {/* Keyword Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                    <Search className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">키워드 검색</h2>
                </div>
                <form onSubmit={handleKeywordSearch} className="flex gap-3 w-1/2">
                    <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="관심 키워드를 검색하세요..."
                        value={keywordSearch}
                        onChange={(e) => setKeywordSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    </div>
                    <button 
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                    검색
                    </button>
                </form>
                </div>
            </div>

            <KeywordSummaryStats selectedPeriod={selectedPeriod} />
            <KeywordPeriodTabs selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
            <KeywordCardGrid 
                selectedPeriod={selectedPeriod} 
                onSelectKeyword={setSelectedKeyword} 
                search={keywordSearch}
            />
            {selectedKeyword && (
                <KeywordDetailPanel 
                keyword={selectedKeyword} 
                onClose={() => setSelectedKeyword(null)} 
                />
            )}
            </>
        )}

        {/* Stocks Tab */}
        {activeTab === 'stocks' && (
            <>
            {/* Stock Search */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                    <Search className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">종목 검색</h2>
                </div>
                <form onSubmit={handleStockSearch} className="flex gap-3 w-1/2">
                    <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="종목명 또는 코드를 검색하세요..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    </div>
                    <button 
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                    검색
                    </button>
                </form>
                </div>
            </div>

            <KOSPI200Grid search={stockSearch} />
            </>
        )}
        </div>
    </div>
    </div>
);
};

export default ComprehensiveKeywordPage;