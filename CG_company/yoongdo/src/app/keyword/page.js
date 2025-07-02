"use client";
import React, { useRef } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

// 더미 데이터
const newsList = [
  {
    id: 1,
    image: "https://imgnews.pstatic.net/image/011/2025/06/29/0004502698_001_20250629230900740.jpg?type=w860",
    title: "트럼프, 중동 눈 돌린 사이…우크라전 요지에 11만 병력 모은 푸틴",
    author: "서울경제",
    tag: "트럼프, 푸틴, 전쟁, 우크라이나, 러시아",
    url: "https://n.news.naver.com/mnews/article/011/0004502698",
    date: "2025.06.29",
  },
  {
    id: 2,
    image: "https://menu.mtn.co.kr/upload/article/2025/07/01/2025070116423231552_00_281.jpg",
    title: "'연금저축계좌 개설·이전하면 美주식 준다'…키움증권, '미국주식드림' 이벤트 진행",
    author: "MTN뉴스",
    tag: "키움증권, 이벤트, 미국주식, 연금",
    url: "https://news.mtn.co.kr/news-detail/2025070116423231552",
    date: "2025.07.01",
  },
  {
    id: 3,
    image: "https://imgnews.pstatic.net/image/243/2025/06/28/0000080362_001_20250628112009773.jpg?type=w860",
    title: "AI 데이터센터 두고 벌어지는 '쩐의 전쟁'…메타 데이터센터 구축에 40조원 조달",
    author: "이코노미스트",
    tag: "AI, 데이터센터, 투자발표",
    url: "https://n.news.naver.com/mnews/article/243/0000080362?sid=105",
    date: "2025.06.28",
  },
  {
    id: 4,
    image: "https://imgnews.pstatic.net/image/018/2025/06/27/0006050456_001_20250627152820407.jpg?type=w860",
    title: "국정위 '한은, 스테이블코인 관련 전향적 자세 보여야'",
    author: "이데일리",
    tag: "스테이블코인, 코인, 한국은행, 국정위",
    url: "https://n.news.naver.com/mnews/article/018/0006050456?sid=101",
    date: "2025.06.27",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    title: "7/1 장전 시황",
    author: "에디초이",
    tag: "에디초이",
    url: "https://news.naver.com/...",
    date: "2025.06.26",
  },
];

const stockCards = [
  {
    id: 1,
    name: "시프트업",
    code: "462870.KS",
    price: "50,600",
    change: "-0.61%",
    opinion: "매수",
    target: "70,840",
    expected: "+40.00%",
    summary: "한한령 해제에 대한 기대감으로 '엔터, 웹툰' 그리고 '게임' 관련 산업에 대한 기대감이 점점 올라가고 있습니다.",
    author: "대구사람",
    deadline: "2025.05.31 까지",
    like: 1,
    comment: 1,
  },
  {
    id: 2,
    name: "노보 노디스크 ADR",
    code: "NVO",
    price: "65.77",
    change: "+0.74%",
    opinion: "강력 매수",
    target: "141.40",
    expected: "+50.00%",
    summary: "Summary 당뇨병 시장을 bottom으로 비만치료제 시장이 열리고 있음. Novo와 Lilly는 비만치료제 시장을 선도.",
    author: "남남",
    deadline: "2025.05.13 까지",
    like: 2,
    comment: 0,
  },
  {
    id: 3,
    name: "현대로템",
    code: "064350.KS",
    price: "112,200",
    change: "+2.04%",
    opinion: "매수",
    target: "157,080",
    expected: "+40%",
    summary: "실질적인 모멘텀은 방산주들이 속속들이 실적 발표를 하면서 '무인전투차량' 관련 기대감이 커지고 있습니다.",
    author: "대구사람",
    deadline: "2025.04.30 까지",
    like: 1,
    comment: 2,
  },
  {
    id: 4,
    name: "KB금융",
    code: "105560.KS",
    price: "86,900",
    change: "+0.72%",
    opinion: "매수",
    target: "117,315",
    expected: "+35.00%",
    summary: "KB금융은 양호한 실적 내공과 더불어 깜짝 자사주 및 이익의 배당을 발표했습니다.",
    author: "에디초이",
    deadline: "2026.04.26 까지",
    like: 2,
    comment: 1,
  },
  {
    id: 5,
    name: "피엔티",
    code: "137400.KQ",
    price: "42,700",
    change: "+0.81%",
    opinion: "강력 매수",
    target: "72,590",
    expected: "+70.00%",
    summary: "테슬라의 건식공정, LG에너지솔루션의 건식공정 2차전지의 비용 절감을 위해서 '건식공정'이 핵심포인트입니다.",
    author: "대구사람",
    deadline: "2025.03.27 까지",
    like: 1,
    comment: 1,
  },
];

export default function NewsPage() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 340; // 카드 한 개 너비 + 여백
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex overflow-x-hidden">
      <Sidebar currentPage="news" />
      <div className="flex-1 ml-52">
        <Header />
        <main className="p-8 bg-gray-50 min-h-screen overflow-x-auto">
          <h1 className="text-2xl font-bold mb-6">중요뉴스</h1>
          {/* 상단 뉴스 카드 슬라이드 */}
          <div className="relative max-w-[1600px] mx-auto w-full">
            {/* 왼쪽 화살표 */}
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/60 rounded-full shadow p-4"
              onClick={() => scroll("left")}
              style={{ display: "block" }}
            >
              <svg className="w-10 h-10 text-black-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {/* 카드 리스트 */}
            <div
              ref={scrollRef}
              className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth w-full pb-2"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {newsList.map((news) => (
                <div
                  key={news.id}
                  className="min-w-[320px] max-w-xs bg-white rounded-xl shadow-md overflow-hidden flex-shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col"
                  >
                    <img src={news.image} alt={news.title} className="w-full h-40 object-cover" />
                    <div className="p-4 flex flex-col">
                      <div
                        className="font-semibold text-base mb-2 line-clamp-2"
                        style={{ minHeight: '3rem' }}
                      >
                        {news.title}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{news.date}</span>
                        <span>{news.author}</span>
                      </div>
                      <div className="mt-2 overflow-hidden whitespace-nowrap truncate">
                        {(news.tag || '').split(',').map((t, idx, arr) =>
                          t.trim() && (
                            <span
                              key={idx}
                              className={
                                "inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded" +
                                (idx !== arr.length - 1 ? " mr-2" : "")
                              }
                            >
                              #{t.trim()}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
            {/* 오른쪽 화살표 */}
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/60 rounded-full shadow p-4"
              onClick={() => scroll("right")}
              style={{ display: "block" }}
            >
              <svg className="w-10 h-10 text-black-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 하단 추천 종목 카드 리스트 */}
          <div className="max-w-[1600px] mx-auto w-full mt-10">
            <h2 className="text-lg font-semibold mb-4">자유 피드 📝</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-w-0">
              {stockCards.map((card) => (
                <div key={card.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col w-auto">
                  <div className="flex items-center mb-2">
                    <span className="font-bold text-gray-700 mr-2">{card.name}</span>
                    <span className="text-xs text-gray-400">{card.code}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <span className="text-lg font-bold text-blue-600 mr-2">{card.price}</span>
                    <span className={`text-sm font-semibold ${card.change.startsWith("-") ? "text-red-500" : "text-green-600"}`}>{card.change}</span>
                  </div>
                  <div className="mb-2">
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-2">{card.opinion} 투자 의견</span>
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">목표가 {card.target}</span>
                  </div>
                  <div className="mb-2 text-xs text-gray-500">{card.summary}</div>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>👍 {card.like}</span>
                      <span>💬 {card.comment}</span>
                    </div>
                    <div className="text-xs text-gray-500">{card.deadline}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">작성자: {card.author}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
