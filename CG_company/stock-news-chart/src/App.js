import React from "react";
import StockChart from './components/StockChart.jsx';
import useStockData from './hooks/useStockData.js';

function App() {
  const stockData = useStockData();
  return (
    <div>
      <h1>주가 차트 & 뉴스 요약</h1>
      <StockChart data={stockData} />
    </div>
  );
}

export default App;

