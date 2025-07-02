// components/ErrorBoundary.js
"use client";
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return { 
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 프로덕션에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  reportError = (error, errorInfo) => {
    // Sentry, LogRocket 등의 에러 리포팅 서비스 연동
    console.log('Reporting error to monitoring service:', {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 있으면 사용, 없으면 기본 UI 사용
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          componentName={this.props.name}
        />
      );
    }

    return this.props.children;
  }
}

// 기본 에러 폴백 컴포넌트
const ErrorFallback = ({ error, errorInfo, errorId, onRetry, componentName }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const copyErrorDetails = () => {
    const errorDetails = `
에러 ID: ${errorId}
컴포넌트: ${componentName || 'Unknown'}
시간: ${new Date().toLocaleString()}
에러: ${error?.toString() || 'Unknown error'}
스택: ${error?.stack || 'No stack trace'}
컴포넌트 스택: ${errorInfo?.componentStack || 'No component stack'}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();
    
    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('에러 정보가 클립보드에 복사되었습니다.');
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* 에러 아이콘 */}
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* 에러 메시지 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          문제가 발생했습니다
        </h2>
        
        <p className="text-gray-600 mb-6">
          {componentName ? `${componentName} 컴포넌트에서 ` : ''}
          예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>

        {/* 에러 ID */}
        {errorId && (
          <div className="bg-gray-100 rounded-lg p-3 mb-6">
            <p className="text-xs text-gray-500">에러 ID</p>
            <p className="text-sm font-mono text-gray-700">{errorId}</p>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            다시 시도
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
          >
            페이지 새로고침
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2 transition-colors"
          >
            {showDetails ? '기술적 세부사항 숨기기' : '기술적 세부사항 보기'}
          </button>
        </div>

        {/* 에러 세부사항 */}
        {showDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">에러 정보</h4>
              <button
                onClick={copyErrorDetails}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                복사
              </button>
            </div>
            
            <div className="space-y-2 text-xs text-gray-600">
              <div>
                <strong>에러:</strong>
                <p className="font-mono bg-white p-2 rounded mt-1 break-all">
                  {error?.toString() || 'Unknown error'}
                </p>
              </div>
              
              {error?.stack && (
                <div>
                  <strong>스택 트레이스:</strong>
                  <pre className="font-mono bg-white p-2 rounded mt-1 text-xs overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 개발 환경에서만 보이는 추가 정보 */}
        {process.env.NODE_ENV === 'development' && errorInfo && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-left">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              개발 정보 (프로덕션에서는 보이지 않음)
            </h4>
            <pre className="text-xs text-yellow-700 overflow-x-auto whitespace-pre-wrap">
              {errorInfo.componentStack}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// 특정 차트 컴포넌트용 에러 폴백
export const ChartErrorFallback = ({ error, onRetry }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-96 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">차트 로딩 실패</h3>
      <p className="text-gray-600 text-sm mb-4">
        차트를 불러오는 중 문제가 발생했습니다.
      </p>
      <button
        onClick={onRetry}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        다시 시도
      </button>
    </div>
  </div>
);

// 뉴스 패널용 에러 폴백
export const NewsErrorFallback = ({ error, onRetry }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2.5 2.5 0 00-2.5-2.5H15" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">뉴스 로딩 실패</h3>
      <p className="text-gray-600 text-sm mb-4">
        뉴스를 불러오는 중 문제가 발생했습니다.
      </p>
      <button
        onClick={onRetry}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        다시 시도
      </button>
    </div>
  </div>
);

export default ErrorBoundary;