// utils/dataValidation.js
/**
 * 주식 데이터 구조 검증
 */
export const validateStockData = (data) => {
    const result = {
      isValid: false,
      error: null,
      warnings: []
    };
  
    // 기본 타입 검증
    if (!Array.isArray(data)) {
      result.error = '주식 데이터는 배열이어야 합니다.';
      return result;
    }
  
    if (data.length === 0) {
      result.error = '주식 데이터가 비어있습니다.';
      return result;
    }
  
    // 필수 필드 정의
    const requiredFields = ['date', 'close'];
    const optionalFields = ['open', 'high', 'low', 'volume', 'companyNews', 'macroNews'];
    const numericFields = ['open', 'high', 'low', 'close', 'volume'];
  
    // 각 데이터 항목 검증
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
  
      if (!item || typeof item !== 'object') {
        result.error = `데이터 항목 ${i}이 유효하지 않습니다.`;
        return result;
      }
  
      // 필수 필드 확인
      for (const field of requiredFields) {
        if (!(field in item) || item[field] === null || item[field] === undefined) {
          result.error = `데이터 항목 ${i}에 필수 필드 '${field}'가 없습니다.`;
          return result;
        }
      }
  
      // 날짜 형식 검증
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(item.date)) {
        result.error = `데이터 항목 ${i}의 날짜 형식이 올바르지 않습니다. (YYYY-MM-DD 형식이어야 함)`;
        return result;
      }
  
      // 숫자 필드 검증
      for (const field of numericFields) {
        if (field in item) {
          if (typeof item[field] !== 'number' || isNaN(item[field]) || item[field] < 0) {
            result.error = `데이터 항목 ${i}의 '${field}' 필드가 유효한 양수가 아닙니다.`;
            return result;
          }
        }
      }
  
      // OHLC 논리 검증 (high >= low, open/close between high and low)
      if (item.high && item.low && item.open && item.close) {
        if (item.high < item.low) {
          result.error = `데이터 항목 ${i}에서 고가가 저가보다 낮습니다.`;
          return result;
        }
        
        if (item.open > item.high || item.open < item.low) {
          result.warnings.push(`데이터 항목 ${i}에서 시가가 고가-저가 범위를 벗어납니다.`);
        }
        
        if (item.close > item.high || item.close < item.low) {
          result.warnings.push(`데이터 항목 ${i}에서 종가가 고가-저가 범위를 벗어납니다.`);
        }
      }
  
      // 뉴스 배열 검증
      if (item.companyNews && !Array.isArray(item.companyNews)) {
        result.warnings.push(`데이터 항목 ${i}의 companyNews가 배열이 아닙니다.`);
      }
      
      if (item.macroNews && !Array.isArray(item.macroNews)) {
        result.warnings.push(`데이터 항목 ${i}의 macroNews가 배열이 아닙니다.`);
      }
    }
  
    // 날짜 정렬 확인
    const dates = data.map(item => new Date(item.date));
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] < dates[i - 1]) {
        result.warnings.push('데이터가 날짜순으로 정렬되지 않았습니다.');
        break;
      }
    }
  
    result.isValid = true;
    return result;
  };
  
  /**
   * 뉴스 데이터 검증
   */
  export const validateNewsData = (news) => {
    const result = {
      isValid: false,
      error: null,
      warnings: []
    };
  
    if (!news) {
      result.error = '뉴스 데이터가 없습니다.';
      return result;
    }
  
    // 단일 뉴스 항목인 경우
    if (typeof news === 'object' && !Array.isArray(news)) {
      if (news.companyNews && !Array.isArray(news.companyNews)) {
        result.error = 'companyNews는 배열이어야 합니다.';
        return result;
      }
      
      if (news.macroNews && !Array.isArray(news.macroNews)) {
        result.error = 'macroNews는 배열이어야 합니다.';
        return result;
      }
      
      result.isValid = true;
      return result;
    }
  
    // 뉴스 배열인 경우
    if (Array.isArray(news)) {
      for (let i = 0; i < news.length; i++) {
        const item = news[i];
        
        if (!item || typeof item !== 'object') {
          result.error = `뉴스 항목 ${i}이 유효하지 않습니다.`;
          return result;
        }
  
        // 필수 필드 확인
        if (!item.title || typeof item.title !== 'string') {
          result.warnings.push(`뉴스 항목 ${i}에 제목이 없거나 유효하지 않습니다.`);
        }
      }
      
      result.isValid = true;
      return result;
    }
  
    result.error = '뉴스 데이터 형식이 올바르지 않습니다.';
    return result;
  };
  
  /**
   * 티커 맵 데이터 검증
   */
  export const validateTickerMap = (tickerMap) => {
    const result = {
      isValid: false,
      error: null,
      warnings: []
    };
  
    if (!Array.isArray(tickerMap)) {
      result.error = '티커 맵은 배열이어야 합니다.';
      return result;
    }
  
    if (tickerMap.length === 0) {
      result.error = '티커 맵이 비어있습니다.';
      return result;
    }
  
    for (let i = 0; i < tickerMap.length; i++) {
      const item = tickerMap[i];
      
      if (!item || typeof item !== 'object') {
        result.error = `티커 맵 항목 ${i}이 유효하지 않습니다.`;
        return result;
      }
  
      if (!item.ticker || typeof item.ticker !== 'string') {
        result.error = `티커 맵 항목 ${i}에 유효한 ticker가 없습니다.`;
        return result;
      }
  
      if (!item.name || typeof item.name !== 'string') {
        result.error = `티커 맵 항목 ${i}에 유효한 name이 없습니다.`;
        return result;
      }
  
      // 티커 형식 검증 (한국 주식은 6자리 숫자)
      if (!/^\d{6}$/.test(item.ticker)) {
        result.warnings.push(`티커 맵 항목 ${i}의 ticker 형식이 일반적이지 않습니다: ${item.ticker}`);
      }
    }
  
    result.isValid = true;
    return result;
  };
  
  /**
   * 차트 데이터 샘플링 (성능 최적화용)
   */
  export const sampleChartData = (data, maxPoints = 1000) => {
    if (!Array.isArray(data) || data.length <= maxPoints) {
      return data;
    }
  
    const step = Math.ceil(data.length / maxPoints);
    const sampled = [];
  
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }
  
    // 마지막 데이터 포인트는 항상 포함
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1]);
    }
  
    return sampled;
  };
  
  /**
   * 데이터 정렬 유틸리티
   */
  export const sortDataByDate = (data) => {
    if (!Array.isArray(data)) return data;
    
    return [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  /**
   * 데이터 필터링 유틸리티
   */
  export const filterDataByDateRange = (data, startDate, endDate) => {
    if (!Array.isArray(data)) return data;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
  };
  
  /**
   * 데이터 통계 계산
   */
  export const calculateDataStats = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }
  
    const prices = data.map(item => item.close).filter(price => typeof price === 'number');
    
    if (prices.length === 0) {
      return null;
    }
  
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
      count: data.length,
      priceRange: { min, max },
      average: avg,
      latest: prices[prices.length - 1],
      change: prices.length > 1 ? prices[prices.length - 1] - prices[prices.length - 2] : 0
    };
  };