// KeywordDashboardPage.js
"use client";

import React, { useState } from 'react';
import KeywordSummaryStats from './KeywordSummaryStats';
import KeywordPeriodTabs from './KeywordPeriodTabs';
import KeywordCardGrid from './KeywordCardGrid';
import KeywordDetailPanel from './KeywordDetailPanel';
import KOSPI200Grid from './KOSPI200Grid';

const KeywordDashboardPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <KeywordSummaryStats selectedPeriod={selectedPeriod} />
      <KeywordPeriodTabs selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
      <KeywordCardGrid selectedPeriod={selectedPeriod} onSelectKeyword={setSelectedKeyword} />
      {selectedKeyword && (
        <KeywordDetailPanel keyword={selectedKeyword} onClose={() => setSelectedKeyword(null)} />
      )}
      <KOSPI200Grid />
      {/* 기타 섹션: 뉴스, 트렌드 등 필요시 추가 */}
    </div>
  );
};

export default KeywordDashboardPage; 