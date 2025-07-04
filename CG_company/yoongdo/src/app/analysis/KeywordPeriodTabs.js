// KeywordPeriodTabs.js
"use client";
import React from 'react';

// Enhanced KeywordPeriodTabs Component
const KeywordPeriodTabs = ({ selectedPeriod, setSelectedPeriod }) => {
    const periods = [
    { label: '1일', value: '1' },
    { label: '3일', value: '3'},
    { label: '7일', value: '7'},
    { label: '14일', value: '14'},
    { label: '30일', value: '30'}
];

return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-8 inline-flex">
    {periods.map((period) => (
        <button
        key={period.value}
        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            selectedPeriod === period.value
            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
        onClick={() => setSelectedPeriod(period.value)}
        >
        <div className="text-center">
            <div className="font-semibold">{period.label}</div>
            <div className="text-xs opacity-75">{period.desc}</div>
        </div>
        </button>
    ))}
    </div>
);
};

export default KeywordPeriodTabs; 