const API_BASE = "http://192.168.1.136:8000/api";

export async function fetchStock(ticker) {
  const res = await fetch(`${API_BASE}/stock?ticker=${ticker}`);
  if (!res.ok) throw new Error("Stock not found");
  return res.json();
}

export async function fetchTickerMap() {
  const res = await fetch(`${API_BASE}/ticker_map`);
  if (!res.ok) throw new Error("Ticker map fetch failed");
  return res.json();
}

export async function fetchNews(ticker) {
  const res = await fetch(`${API_BASE}/news?ticker=${ticker}`);
  if (!res.ok) throw new Error("News not found");
  return res.json();
}
