'use client';

import React, { useState } from 'react';

const Frame101 = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="frame-101 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">CG Company Dashboard</h1>
            <p className="text-blue-100 text-sm">실시간 주식 데이터 및 뉴스 분석</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">₩45,200</div>
            <div className="text-green-300 text-sm">+2.5% (+₩1,100)</div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: '개요', icon: '📊' },
            { id: 'chart', label: '차트', icon: '📈' },
            { id: 'news', label: '뉴스', icon: '📰' },
            { id: 'analysis', label: '분석', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 주요 지표 카드들 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">시가총액</p>
                  <p className="text-2xl font-bold text-green-800">₩32.5조</p>
                </div>
                <div className="text-green-500 text-2xl">📈</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">거래량</p>
                  <p className="text-2xl font-bold text-blue-800">2.3M</p>
                </div>
                <div className="text-blue-500 text-2xl">📊</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">PER</p>
                  <p className="text-2xl font-bold text-purple-800">15.2</p>
                </div>
                <div className="text-purple-500 text-2xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">52주 최고</p>
                  <p className="text-2xl font-bold text-orange-800">₩52,400</p>
                </div>
                <div className="text-orange-500 text-2xl">🏆</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="space-y-6">
            {/* 차트 영역 */}
            <div className="bg-gray-50 rounded-lg p-6 h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">📈</div>
                <p className="text-gray-600">실시간 주식 차트</p>
                <p className="text-sm text-gray-500">TradingView 차트가 여기에 표시됩니다</p>
              </div>
            </div>
            
            {/* 차트 컨트롤 */}
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                1일
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                1주
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                1개월
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                1년
              </button>
            </div>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-4">
            {/* 뉴스 아이템들 */}
            {[
              {
                title: "CG Company, AI 기술 혁신으로 실적 개선",
                summary: "최신 AI 기술 도입으로 생산성 향상 및 비용 절감 효과",
                time: "2시간 전",
                sentiment: "positive"
              },
              {
                title: "글로벌 시장 진출 확대 계획 발표",
                summary: "동남아시아 시장 진출을 위한 전략적 파트너십 체결",
                time: "5시간 전",
                sentiment: "positive"
              },
              {
                title: "분기 실적 예상치 상회",
                summary: "Q3 실적 발표, 시장 예상치 대비 15% 상회",
                time: "1일 전",
                sentiment: "positive"
              }
            ].map((news, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{news.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-gray-500">{news.time}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        news.sentiment === 'positive' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {news.sentiment === 'positive' ? '긍정' : '부정'}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl ml-4">
                    {news.sentiment === 'positive' ? '📈' : '📉'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 기술적 분석 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">기술적 분석</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">RSI</span>
                  <span className="text-sm font-medium text-green-600">65.2 (중립)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">MACD</span>
                  <span className="text-sm font-medium text-blue-600">양수</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">이동평균</span>
                  <span className="text-sm font-medium text-green-600">상승추세</span>
                </div>
              </div>
            </div>

            {/* 펀더멘털 분석 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">펀더멘털 분석</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ROE</span>
                  <span className="text-sm font-medium text-green-600">18.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">부채비율</span>
                  <span className="text-sm font-medium text-green-600">45.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">영업이익률</span>
                  <span className="text-sm font-medium text-green-600">12.8%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>🔄 실시간 업데이트</span>
            <span>📊 PostgreSQL 연동</span>
          </div>
          <div>
            마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Frame101; 