'use client';
// components/SearchBar.js - 개선된 버전
import React, { useState, useEffect, useRef, useMemo } from "react";
import { fetchTickerMap } from "../utils/api";
import { validateTickerMap } from "../utils/dataValidation";
import { SearchLoadingSpinner } from "./LoadingSpinner";

const SearchBar = ({ ticker, setTicker }) => {
  const [input, setInput] = useState(ticker);
  const [isLoading, setIsLoading] = useState(false);
  const [tickerMap, setTickerMap] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState(null);
  
  const inputRef = useRef(null);
  const suggestionRefs = useRef([]);

  // 티커 맵 로딩
  useEffect(() => {
    const loadTickerMap = async () => {
      try {
        setError(null);
        const data = await fetchTickerMap();
        
        // 데이터 검증
        const validation = validateTickerMap(data);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
        
        setTickerMap(data);
      } catch (err) {
        console.error('티커 맵 로딩 실패:', err);
        setError('검색 데이터를 불러올 수 없습니다.');
        
        // 로컬 백업 시도
        try {
          const backupResponse = await fetch('/ticker_map.json');
          if (backupResponse.ok) {
            const backupData = await backupResponse.json();
            setTickerMap(backupData);
            setError(null);
          }
        } catch (backupError) {
          console.error('백업 데이터 로딩도 실패:', backupError);
        }
      }
    };

    loadTickerMap();
  }, []);

  // 입력값 변경시 ticker 업데이트
  useEffect(() => {
    setInput(ticker);
  }, [ticker]);

  // 검색 제안 필터링 (메모이제이션)
  const suggestions = useMemo(() => {
    if (!(input || '').trim() || tickerMap.length === 0) return [];
    
    const query = (input || '').toLowerCase().trim();
    
    return tickerMap
      .filter(item => {
        const nameMatch = item.name.toLowerCase().includes(query);
        const tickerMatch = item.ticker.includes(query);
        return nameMatch || tickerMatch;
      })
      .slice(0, 10) // 최대 10개까지만
      .sort((a, b) => {
        // 정확히 일치하는 것을 우선
        const aExactName = a.name.toLowerCase() === query;
        const bExactName = b.name.toLowerCase() === query;
        const aExactTicker = a.ticker === query;
        const bExactTicker = b.ticker === query;
        
        if (aExactName || aExactTicker) return -1;
        if (bExactName || bExactTicker) return 1;
        
        // 이름으로 시작하는 것을 우선
        const aStartsWithName = a.name.toLowerCase().startsWith(query);
        const bStartsWithName = b.name.toLowerCase().startsWith(query);
        
        if (aStartsWithName && !bStartsWithName) return -1;
        if (!aStartsWithName && bStartsWithName) return 1;
        
        // 알파벳 순 정렬
        return a.name.localeCompare(b.name);
      });
  }, [input, tickerMap]);

  // 검색 실행
  const handleSearch = async (searchTicker = null) => {
    const targetTicker = searchTicker || input.trim();
    
    if (!targetTicker) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 숫자만 입력된 경우(티커 코드)
      if (/^\d{6}$/.test(targetTicker)) {
        setTicker(targetTicker);
        setShowSuggestions(false);
        setInput(targetTicker);
        return;
      }

      // 종목명으로 검색
      const found = tickerMap.find(item => 
        item.name === targetTicker || item.ticker === targetTicker
      );

      if (found) {
        setTicker(found.ticker);
        setInput(found.name);
        setShowSuggestions(false);
      } else {
        // 부분 일치 검색
        const partialMatch = tickerMap.find(item =>
          item.name.toLowerCase().includes(targetTicker.toLowerCase())
        );
        
        if (partialMatch) {
          setTicker(partialMatch.ticker);
          setInput(partialMatch.name);
          setShowSuggestions(false);
        } else {
          setError(`'${targetTicker}'에 해당하는 종목을 찾을 수 없습니다.`);
          // 유사한 종목 제안
          const similar = tickerMap.filter(item =>
            item.name.toLowerCase().includes(targetTicker.toLowerCase().substring(0, 2))
          ).slice(0, 3);
          
          if (similar.length > 0) {
            setError(`'${targetTicker}'에 해당하는 종목을 찾을 수 없습니다. 혹시 이런 종목을 찾으시나요? ${similar.map(s => s.name).join(', ')}`);
          }
        }
      }
    } catch (err) {
      console.error('검색 중 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSearch(suggestions[selectedIndex].ticker);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case 'Tab':
        if (suggestions.length > 0 && selectedIndex >= 0) {
          e.preventDefault();
          setInput(suggestions[selectedIndex].name);
        }
        break;
    }
  };

  // 입력 변경 처리
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setError(null);
    setSelectedIndex(-1);
    
    if (value.trim().length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // 제안 항목 클릭
  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion.ticker);
  };

  // 입력 필드 클리어
  const handleClear = () => {
    setInput("");
    setError(null);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // 외부 클릭시 제안 숨기기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 선택된 항목으로 스크롤
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative max-w-md mx-auto" ref={inputRef}>
      {/* 메인 검색 입력 */}
      <div className={`flex items-center bg-gray-50 rounded-lg border transition-colors ${
        error ? 'border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500' :
        'border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
      }`}>
        {/* 검색 아이콘 */}
        <div className="pl-3">
          <svg
            className={`w-5 h-5 ${error ? 'text-red-400' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* 입력 필드 */}
        <input
          ref={inputRef}
          className="flex-1 outline-none bg-transparent py-2.5 px-3 text-sm text-gray-900 placeholder-gray-500"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (input.trim() && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="종목명 또는 코드 검색 (예: 삼성전자, 005930)"
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />

        {/* 클리어 버튼 */}
        {input && !isLoading && (
          <button
            className="p-1 mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={handleClear}
            type="button"
            tabIndex={-1}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* 로딩 스피너 */}
        {isLoading && (
          <div className="p-2 mr-2">
            <SearchLoadingSpinner />
          </div>
        )}

        {/* 검색 버튼 */}
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleSearch()}
          disabled={isLoading || !(input || '').trim()}
        >
          {isLoading ? "검색중..." : "검색"}
        </button>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* 검색 제안 드롭다운 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-gray-500 font-medium px-2 py-1 mb-1">
              검색 결과 ({suggestions.length}개)
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.ticker}
                ref={el => suggestionRefs.current[index] = el}
                className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center justify-between ${
                  index === selectedIndex
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div>
                  <div className="font-medium">{suggestion.name}</div>
                  <div className="text-xs text-gray-500">{suggestion.ticker}</div>
                </div>
                {/* 정확히 일치하는 항목 표시 */}
                {(suggestion.name.toLowerCase() === input.toLowerCase() ||
                  suggestion.ticker === input) && (
                  <div className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                    정확일치
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 도움말 (포커스시) */}
      {showSuggestions && suggestions.length === 0 && input.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500 mb-2">검색 결과가 없습니다</div>
            <div className="text-xs text-gray-400">
              • 정확한 종목명을 입력해보세요<br/>
              • 6자리 종목 코드로 검색해보세요<br/>
              • 예: "삼성전자" 또는 "005930"
            </div>
          </div>
        </div>
      )}

      {/* 키보드 단축키 안내 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-50 border border-gray-200 rounded-lg shadow-sm z-40 overflow-hidden">
          <div className="px-3 py-2 text-xs text-gray-500 flex items-center justify-between">
            <span>↑↓로 선택, Enter로 검색, Tab으로 자동완성</span>
            <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">ESC</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;