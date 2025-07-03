"use client";
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
        console.error("티커 맵 로딩 실패:", err);
        setError("검색 데이터를 불러올 수 없습니다.");

        // 로컬 백업 시도
        try {
          const API_BASE =
            process.env.NEXT_PUBLIC_API_BASE || "http://192.168.1.138:8000";
          const backupResponse = await fetch(`${API_BASE}/ticker_map.json`);
          if (backupResponse.ok) {
            const backupData = await backupResponse.json();
            setTickerMap(backupData);
            setError(null);
          }
        } catch (backupError) {
          console.error("백업 데이터 로딩도 실패:", backupError);
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
    if (
      !(input || "").trim() ||
      !Array.isArray(tickerMap) ||
      tickerMap.length === 0
    )
      return [];

    const query = (input || "").toLowerCase().trim();

    return tickerMap
      .filter((item) => {
        if (!item || typeof item !== "object") return false;
        const nameMatch = (item.name || "").toLowerCase().includes(query);
        const tickerMatch = (item.ticker || "").includes(query);
        return nameMatch || tickerMatch;
      })
      .slice(0, 10) // 최대 10개까지만
      .sort((a, b) => {
        // 정확히 일치하는 것을 우선
        const aExactName = (a.name || "").toLowerCase() === query;
        const bExactName = (b.name || "").toLowerCase() === query;
        const aExactTicker = (a.ticker || "") === query;
        const bExactTicker = (b.ticker || "") === query;

        if (aExactName || aExactTicker) return -1;
        if (bExactName || bExactTicker) return 1;

        // 이름으로 시작하는 것을 우선
        const aStartsWithName = (a.name || "").toLowerCase().startsWith(query);
        const bStartsWithName = (b.name || "").toLowerCase().startsWith(query);

        if (aStartsWithName && !bStartsWithName) return -1;
        if (!aStartsWithName && bStartsWithName) return 1;

        // 알파벳 순 정렬
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [input, tickerMap]);

  // 검색 실행
  const handleSearch = async (searchTicker = null) => {
    const targetTicker = searchTicker || input.trim();

    if (!targetTicker) {
      setError("검색어를 입력해주세요.");
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
      const found = tickerMap.find(
        (item) =>
          item && (item.name === targetTicker || item.ticker === targetTicker)
      );

      if (found) {
        setTicker(found.ticker);
        setInput(found.name);
        setShowSuggestions(false);
      } else {
        // 부분 일치 검색
        const partialMatch = tickerMap.find(
          (item) =>
            item &&
            item.name &&
            item.name.toLowerCase().includes(targetTicker.toLowerCase())
        );

        if (partialMatch) {
          setTicker(partialMatch.ticker);
          setInput(partialMatch.name);
          setShowSuggestions(false);
        } else {
          setError(`'${targetTicker}'에 해당하는 종목을 찾을 수 없습니다.`);
          // 유사한 종목 제안
          const similar = tickerMap
            .filter(
              (item) =>
                item &&
                item.name &&
                item.name
                  .toLowerCase()
                  .includes(targetTicker.toLowerCase().substring(0, 2))
            )
            .slice(0, 3);

          if (similar.length > 0) {
            setError(
              `'${targetTicker}'에 해당하는 종목을 찾을 수 없습니다. 혹시 이런 종목을 찾으시나요? ${similar
                .map((s) => s.name)
                .join(", ")}`
            );
          }
        }
      }
    } catch (err) {
      console.error("검색 중 오류:", err);
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    // 리스트 형태에 맞는 네비게이션
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === -1) return 0;
          const next = prev + 1;
          return next < suggestions.length ? next : prev;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => {
          if (prev === -1) return suggestions.length - 1;
          const next = prev - 1;
          return next >= 0 ? next : prev;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSearch(suggestions[selectedIndex].ticker);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      case "Tab":
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 선택된 항목으로 스크롤 (그리드 레이아웃)
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex].scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative w-full" ref={inputRef}>
      {/* 메인 검색 입력 */}
      <div
        className={`flex items-center bg-white rounded-full border transition-all duration-200 shadow-sm hover:shadow-md ${
          error
            ? "border-red-300 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100"
            : "border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"
        }`}
      >
        {/* 검색 아이콘 */}
        <div className="pl-4">
          <svg
            className={`w-4 h-4 ${error ? "text-red-400" : "text-gray-400"}`}
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
          className="flex-1 outline-none bg-transparent py-3 px-4 text-sm text-gray-900 placeholder-gray-400 rounded-l-full"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (input.trim() && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Search for various stocks"
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
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md mr-1"
          onClick={() => handleSearch()}
          disabled={isLoading || !(input || "").trim()}
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

      {/* 검색 결과 배너 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[99999] max-w-6xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  검색 결과
                </h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {suggestions.length}개
                </span>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 검색 결과 리스트 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.ticker}
                  ref={(el) => (suggestionRefs.current[index] = el)}
                  className={`w-full p-4 rounded-lg transition-all duration-200 border hover:shadow-md text-left ${
                    index === selectedIndex
                      ? "bg-blue-50 text-blue-700 border-blue-300 shadow-md"
                      : "text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm leading-tight mb-1 break-words">
                        {suggestion.name}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {suggestion.ticker}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      {/* 정확히 일치하는 항목 표시 */}
                      {((suggestion.name || "").toLowerCase() ===
                        (input || "").toLowerCase() ||
                        (suggestion.ticker || "") === (input || "")) && (
                        <div className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                          정확일치
                        </div>
                      )}
                      {/* 선택 표시 */}
                      {index === selectedIndex && (
                        <div className="text-blue-600">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 키보드 단축키 안내 */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>↑↓로 선택, Enter로 검색, ESC로 닫기</span>
                <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                  ESC
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 도움말 배너 */}
      {showSuggestions && suggestions.length === 0 && input.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-[99999] max-w-2xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">
                검색 결과 없음
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 도움말 내용 */}
            <div className="text-center">
              <div className="text-gray-500 mb-3">
                <svg
                  className="w-8 h-8 mx-auto text-gray-300 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <div className="text-sm font-medium mb-2">
                  검색 결과가 없습니다
                </div>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• 정확한 종목명을 입력해보세요</div>
                <div>• 6자리 종목 코드로 검색해보세요</div>
                <div>• 예: "삼성전자" 또는 "005930"</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
