// components/LoadingSpinner.js
import React from "react";

// 기본 로딩 스피너
export const LoadingSpinner = ({ 
  size = 'md', 
  message, 
  className = '',
  color = 'blue' 
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-500',
    green: 'border-green-500',
    red: 'border-red-500',
    gray: 'border-gray-500'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`
          animate-spin rounded-full border-2 border-t-transparent 
          ${sizeClasses[size]} 
          ${colorClasses[color]}
        `}
      />
      {message && (
        <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

// 차트 로딩 스켈레톤
export const ChartLoadingSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    {/* 헤더 스켈레톤 */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="flex items-center space-x-2">
          <div className="h-5 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="flex bg-gray-200 rounded-lg p-1 w-32 h-10"></div>
    </div>

    {/* 차트 영역 스켈레톤 */}
    <div className="relative h-96 bg-gray-100 rounded-lg mb-6">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-4 h-4 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>

    {/* 하단 컨트롤 스켈레톤 */}
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <div className="flex items-center space-x-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 rounded w-8"></div>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
    </div>
  </div>
);

// 뉴스 패널 로딩 스켈레톤
export const NewsLoadingSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col animate-pulse">
    {/* 헤더 스켈레톤 */}
    <div className="px-6 py-4 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded w-16"></div>
        <div className="h-4 bg-gray-200 rounded w-12"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-20 mt-2"></div>
    </div>

    {/* 뉴스 아이템 스켈레톤 */}
    <div className="flex-1 overflow-y-auto">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="flex items-center space-x-2">
                <div className="h-3 bg-gray-200 rounded w-12"></div>
                <div className="h-3 bg-gray-200 rounded w-8"></div>
                <div className="h-3 bg-gray-200 rounded w-10"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mt-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 주식 카드 로딩 스켈레톤
export const StockCardsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="w-15 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="h-5 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    ))}
  </div>
);

// 검색 결과 로딩
export const SearchLoadingSpinner = () => (
  <div className="flex items-center space-x-2 text-sm text-gray-500">
    <LoadingSpinner size="sm" />
    <span>검색 중...</span>
  </div>
);

// 인라인 로딩 (버튼 등에 사용)
export const InlineLoading = ({ text = "처리 중..." }) => (
  <div className="flex items-center space-x-2">
    <LoadingSpinner size="xs" />
    <span>{text}</span>
  </div>
);

// 페이지 전체 로딩
export const PageLoading = ({ message = "페이지를 불러오는 중입니다..." }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" message={message} />
    </div>
  </div>
);

// 데이터 페칭 로딩 (작은 영역용)
export const DataLoading = ({ message = "데이터 로딩 중..." }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="md" message={message} />
  </div>
);

// 프로그레스 바가 있는 로딩
export const ProgressLoading = ({ 
  progress = 0, 
  message = "로딩 중...", 
  showPercentage = true 
}) => (
  <div className="flex flex-col items-center space-y-4">
    <LoadingSpinner size="lg" />
    <div className="w-full max-w-xs">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{message}</span>
        {showPercentage && <span>{Math.round(progress)}%</span>}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  </div>
);

// 점 애니메이션 로딩
export const DotsLoading = ({ text = "로딩", className = "" }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <span className="text-gray-600">{text}</span>
      <div className="flex space-x-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;