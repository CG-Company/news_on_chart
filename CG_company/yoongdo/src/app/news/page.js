import React from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

// 더미 데이터
const newsList = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    title: "AI 데이터센터 두고 벌어지는 '쩐의 전쟁'…메타 데이터센터 구…",
    author: "파닥거리기",
    tag: "에디초이",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    title: "채권 동향",
    author: "에디초이",
    tag: "에디초이",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
    title: "무역 낙관론에 웃은 증시, 다우 사상 최고치 경신",
    author: "에디초이",
    tag: "에디초이",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    title: "구형 D램 가격 급등세…'공급업체 가격 협상력 제고'",
    author: "파닥거리기",
    tag: "에디초이",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    title: "7/1 장전 시황",
    author: "에디초이",
    tag: "에디초이",
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
  return (
    <div className="flex">
      <Sidebar currentPage="news" />
      <div className="flex-1 ml-52">
        <Header />
        <main className="p-8 bg-gray-50 min-h-screen">
          <h1 className="text-2xl font-bold mb-6">커뮤니티</h1>
          {/* 상단 뉴스 카드 슬라이드 */}
          <div className="flex space-x-4 overflow-x-auto pb-4 mb-8">
            {newsList.map((news) => (
              <div
                key={news.id}
                className="min-w-[320px] max-w-xs bg-white rounded-xl shadow-md overflow-hidden flex-shrink-0"
              >
                <img src={news.image} alt={news.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-1">{news.tag} <span className="ml-2">{news.author}</span></div>
                  <div className="font-semibold text-base line-clamp-2">{news.title}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 하단 추천 종목 카드 리스트 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">탱고픽 선정, 심층 분석글 📝</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {stockCards.map((card) => (
                <div key={card.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col">
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
