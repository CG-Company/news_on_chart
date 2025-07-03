"use client";
import React, { useRef, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

// 더미 데이터
const dummyNewsList = [
  {
    id: 1,
    image:
      "https://imgnews.pstatic.net/image/011/2025/06/29/0004502698_001_20250629230900740.jpg?type=w860",
    title: "트럼프, 중동 눈 돌린 사이…우크라전 요지에 11만 병력 모은 푸틴",
    author: "서울경제",
    tag: "트럼프, 푸틴, 전쟁, 우크라이나, 러시아",
    url: "https://n.news.naver.com/mnews/article/011/0004502698",
    date: "2025.06.29",
  },
  {
    id: 2,
    image:
      "https://menu.mtn.co.kr/upload/article/2025/07/01/2025070116423231552_00_281.jpg",
    title:
      "'연금저축계좌 개설·이전하면 美주식 준다'…키움증권, '미국주식드림' 이벤트 진행",
    author: "MTN뉴스",
    tag: "키움증권, 이벤트, 미국주식, 연금",
    url: "https://news.mtn.co.kr/news-detail/2025070116423231552",
    date: "2025.07.01",
  },
  {
    id: 3,
    image:
      "https://imgnews.pstatic.net/image/243/2025/06/28/0000080362_001_20250628112009773.jpg?type=w860",
    title:
      "AI 데이터센터 두고 벌어지는 '쩐의 전쟁'…메타 데이터센터 구축에 40조원 조달",
    author: "이코노미스트",
    tag: "AI, 데이터센터, 투자발표",
    url: "https://n.news.naver.com/mnews/article/243/0000080362?sid=105",
    date: "2025.06.28",
  },
  {
    id: 4,
    image:
      "https://imgnews.pstatic.net/image/018/2025/06/27/0006050456_001_20250627152820407.jpg?type=w860",
    title: "국정위 '한은, 스테이블코인 관련 전향적 자세 보여야'",
    author: "이데일리",
    tag: "스테이블코인, 코인, 한국은행, 국정위",
    url: "https://n.news.naver.com/mnews/article/018/0006050456?sid=101",
    date: "2025.06.27",
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
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
    code: "462870",
    price: "50,600",
    change: "-0.61%",
    opinion: "매수",
    target: "70,840",
    expected: "+40.00%",
    summary:
      "한한령 해제에 대한 기대감으로 '엔터, 웹툰' 그리고 '게임' 관련 산업에 대한 기대감이 점점 올라가고 있습니다.",
    author: "대구사람",
    deadline: "2025.05.31 까지",
    like: 1,
    comment: 1,
  },
  {
    id: 2,
    name: "한미약품",
    code: "000270",
    price: "65.77",
    change: "+0.74%",
    opinion: "강력 매수",
    target: "141.40",
    expected: "+50.00%",
    summary:
      "Summary 당뇨병 시장을 bottom으로 비만치료제 시장이 열리고 있음. Novo와 Lilly는 비만치료제 시장을 선도.",
    author: "남남",
    deadline: "2025.05.13 까지",
    like: 2,
    comment: 0,
  },
  {
    id: 3,
    name: "현대로템",
    code: "064350",
    price: "112,200",
    change: "+2.04%",
    opinion: "매수",
    target: "157,080",
    expected: "+40%",
    summary:
      "실질적인 모멘텀은 방산주들이 속속들이 실적 발표를 하면서 '무인전투차량' 관련 기대감이 커지고 있습니다.",
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
    summary:
      "KB금융은 양호한 실적 내공과 더불어 깜짝 자사주 및 이익의 배당을 발표했습니다.",
    author: "에디초이",
    deadline: "2026.04.26 까지",
    like: 2,
    comment: 1,
  },
  {
    id: 5,
    name: "유한양행",
    code: "000100",
    price: "42,700",
    change: "+0.81%",
    opinion: "강력 매수",
    target: "72,590",
    expected: "+70.00%",
    summary:
      "테슬라의 건식공정, LG에너지솔루션의 건식공정 2차전지의 비용 절감을 위해서 '건식공정'이 핵심포인트입니다.",
    author: "대구사람",
    deadline: "2025.03.27 까지",
    like: 1,
    comment: 1,
  },
];

// report_img 폴더 내 이미지 파일명 배열
const reportImages = [
  "/report_img/report01.jpg",
  "/report_img/report02.jpg",
  "/report_img/report03.png",
  "/report_img/report04.jpeg",
  "/report_img/report05.jpg",
  "/report_img/report06.png",
  "/report_img/report07.png",
  "/report_img/report08.jpg",
  "/report_img/report09.png",
  "/report_img/report10.png",
];

export default function NewsPage() {
  const scrollRef = useRef(null);
  const [ticker, setTicker] = useState("");
  const [tickerName, setTickerName] = useState("");
  const [price, setPrice] = useState("");
  const [change, setChange] = useState("");
  const [newsList, setNewsList] = useState(dummyNewsList);
  const [stockCardsState, setStockCardsState] = useState(stockCards);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [feedForm, setFeedForm] = useState({
    name: "",
    code: "",
    price: "",
    change: "",
    opinion: "",
    target: "",
    expected: "",
    summary: "",
    author: "",
    deadline: "",
    like: 0,
    comment: 0,
  });
  const [nameError, setNameError] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [changeError, setChangeError] = useState(false);
  const [opinionError, setOpinionError] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [authorError, setAuthorError] = useState(false);
  const [deadlineError, setDeadlineError] = useState(false);
  const [targetError, setTargetError] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [globalAlert, setGlobalAlert] = useState("");
  const opinionRef = useRef();
  const summaryRef = useRef();
  const authorRef = useRef();
  const deadlineRef = useRef();
  const targetRef = useRef();
  const [showTargetTooltip, setShowTargetTooltip] = useState(false);
  const [newCards, setNewCards] = useState([]); // 실시간 추가 카드만 관리

  // getCardPrice는 card.price만 사용
  const getCardPrice = (card) => {
    const priceNum = Number(card.price?.toString().replace(/,/g, ""));
    if (card.price !== undefined && card.price !== null && !isNaN(priceNum)) {
      return priceNum.toLocaleString();
    }
    return "-";
  };

  // 리포트 자동 가져오기: ticker가 바뀔 때마다 실행
  useEffect(() => {
    if (!ticker) return;
    handleFetchReport();
    // 종목명, 현재가, 등락률 연동
    fetch(`/api/stock?ticker=${ticker}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stockData && data.stockData.length > 0) {
          const last = data.stockData[data.stockData.length - 1];
          setPrice(last.close || "");
          setChange(last.change_rate || "");
        } else {
          setPrice("");
          setChange("");
        }
      });
    // 종목명 연동
    fetch("/api/ticker_map")
      .then((res) => res.json())
      .then((map) => {
        const found = map.find((item) => item.ticker === ticker);
        setTickerName(found ? found.name : "");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  useEffect(() => {
    setFeedForm((prev) => ({
      ...prev,
      name: tickerName,
      code: ticker,
      price: price,
      change: change,
    }));
  }, [tickerName, ticker, price, change]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // 리포트 가져오기 함수 (버튼 없이 사용)
  const handleFetchReport = async () => {
    if (!ticker) {
      return;
    }
    try {
      const res = await fetch(`/api/report?ticker=${ticker}`);
      const data = await res.json();
      if (
        data.reports &&
        Array.isArray(data.reports) &&
        data.reports.length > 0
      ) {
        const mapped = data.reports.slice(0, 6).map((item, idx) => ({
          id: idx + 1,
          image: reportImages[Math.floor(Math.random() * reportImages.length)],
          title: item["제목"],
          author: item["증권사"],
          tag: item["종목명"],
          url: item["PDF링크"],
          date: item["날짜"],
        }));
        setNewsList(mapped);
      } else {
        setNewsList([]);
      }
    } catch (err) {
      const responseTime = Date.now() - startTime;
      console.error("❌ 요약 요청 실패:", err, {
        responseTime: `${responseTime}ms`,
        ticker,
      });
    }
  };

  // 피드 작성 모달 등록 핸들러
  const handleFeedSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    // 첫 번째 미입력 필수 입력란만 에러 표시 및 포커스
    if (!feedForm.opinion) {
      setOpinionError(true);
      setTargetError(false);
      setSummaryError(false);
      setAuthorError(false);
      setDeadlineError(false);
      opinionRef.current?.focus();
      return;
    }
    if (!feedForm.target) {
      setOpinionError(false);
      setTargetError(true);
      setSummaryError(false);
      setAuthorError(false);
      setDeadlineError(false);
      targetRef.current?.focus();
      return;
    }
    if (!feedForm.summary) {
      setOpinionError(false);
      setTargetError(false);
      setSummaryError(true);
      setAuthorError(false);
      setDeadlineError(false);
      summaryRef.current?.focus();
      return;
    }
    if (!feedForm.author) {
      setOpinionError(false);
      setTargetError(false);
      setSummaryError(false);
      setAuthorError(true);
      setDeadlineError(false);
      authorRef.current?.focus();
      return;
    }
    if (!feedForm.deadline) {
      setOpinionError(false);
      setTargetError(false);
      setSummaryError(false);
      setAuthorError(false);
      setDeadlineError(true);
      deadlineRef.current?.focus();
      return;
    }
    setOpinionError(false);
    setTargetError(false);
    setSummaryError(false);
    setAuthorError(false);
    setDeadlineError(false);
    setGlobalAlert("");
    setNewCards([{ id: Date.now(), ...feedForm }, ...newCards]);
    setShowFeedModal(false);
    setFeedForm({
      name: "",
      code: "",
      price: "",
      change: "",
      opinion: "",
      target: "",
      expected: "",
      summary: "",
      author: "",
      deadline: "",
      like: 0,
      comment: 0,
    });
    setIsSubmitted(false);
  };

  // 피드 작성 버튼 클릭 시, 현재 검색된 종목명/코드/현재가/등락률로 feedForm 초기화
  const handleOpenFeedModal = () => {
    // 오늘로부터 +30일 날짜 계산
    const today = new Date();
    const plus30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const deadlineStr = `${plus30.getFullYear()}.${String(
      plus30.getMonth() + 1
    ).padStart(2, "0")}.${String(plus30.getDate()).padStart(2, "0")} 까지`;
    setFeedForm((prev) => ({
      ...prev,
      name: tickerName,
      code: ticker,
      price: price,
      change: change,
      deadline: deadlineStr,
    }));
    setShowFeedModal(true);
  };

  return (
    <div className="flex overflow-x-hidden">
      <Sidebar currentPage="community" />
      <div className="flex-1 ml-52">
        <Header
          ticker={ticker}
          setTicker={setTicker}
          tickerName={tickerName}
          setTickerName={setTickerName}
        />
        <main className="p-8 bg-gray-50 min-h-screen overflow-x-auto">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            중요 리포트
          </h1>
          {/* 상단 뉴스 카드 슬라이드 */}
          <div className="relative w-full flex justify-center">
            {/* 왼쪽 화살표 */}
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white/60 rounded-full shadow p-6"
              onClick={() => scroll("left")}
              style={{ display: "block" }}
            >
              <svg
                className="w-12 h-12 text-black-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            {/* 오른쪽 화살표 */}
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/60 rounded-full shadow p-6"
              onClick={() => scroll("right")}
              style={{ display: "block" }}
            >
              <svg
                className="w-12 h-12 text-black-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div className="bg-white rounded-xl shadow w-full max-w-full sm:max-w-[600px] md:max-w-[900px] lg:max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1600px] min-w-0 px-2 sm:px-4 md:px-6 lg:px-8 py-6 mx-auto relative">
              {/* 카드 리스트 */}
              <div
                className="overflow-x-auto scrollbar-hide mt-2 mb-2"
                ref={scrollRef}
              >
                <div
                  className="flex space-x-4 scroll-smooth min-w-full pb-2"
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
                        <img
                          src={news.image}
                          alt={news.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-4 flex flex-col">
                          <div
                            className="font-semibold text-base mb-2 line-clamp-2"
                            style={{ minHeight: "3rem" }}
                          >
                            {news.title}
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>{news.date}</span>
                            <span>{news.author}</span>
                          </div>
                          <div className="mt-2 overflow-hidden whitespace-nowrap truncate">
                            {(news.tag || "").split(",").map(
                              (t, idx, arr) =>
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
                              <span className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded ml-2">
                                {news.author}
                              </span>
                              <span className="inline-block bg-green-100 text-gray-500 text-xs px-2 py-1 rounded ml-2">
                                {news.date?.split(".")[0]}년도
                              </span>
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 자유 피드 타이틀/버튼 */}
          <div className="flex items-center mb-4 gap-2 mt-10">
            <h2 className="text-lg font-semibold">자유 피드 📝</h2>
            <button
              className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 transition"
              type="button"
              onClick={handleOpenFeedModal}
            >
              피드 작성
            </button>
          </div>
          {/* 하단 추천 종목 카드 리스트 */}
          <div className="relative w-full flex justify-center">
            <div className="bg-white rounded-xl shadow w-full max-w-full sm:max-w-[600px] md:max-w-[900px] lg:max-w-[1200px] xl:max-w-[1400px] 2xl:max-w-[1600px] min-w-0 px-2 sm:px-4 md:px-6 lg:px-8 py-6 mx-auto relative">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-w-0">
                {[...newCards, ...stockCards].map((card) => (
                  <div
                    key={card.id}
                    className="bg-white rounded-xl shadow-md p-5 flex flex-col w-auto"
                  >
                    <div className="flex items-center mb-2">
                      <span className="font-bold text-gray-700 mr-2">
                        {card.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {card.code ? `${card.code}.KS` : ""}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      <span className="text-lg font-bold text-blue-600 mr-2">
                        {getCardPrice(card)}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          card.change && `${card.change}`.startsWith("-")
                            ? "text-red-500"
                            : "text-green-600"
                        }`}
                      >
                        {card.change !== undefined &&
                        card.change !== null &&
                        !isNaN(Number(card.change))
                          ? `${Math.round(Number(card.change) * 100) / 100}%`
                          : card.change}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-2">
                        {card.opinion} 투자 의견
                      </span>
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        목표가 {card.target}
                      </span>
                    </div>
                    <div className="mb-2 text-xs text-gray-500">
                      {card.summary}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>👍 {card.like ? card.like : 1}</span>
                        <span>💬 {card.comment ? card.comment : 1}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {card.deadline}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      작성자: {card.author}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 피드 작성 모달 */}
          {showFeedModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowFeedModal(false);
              }}
            >
              <form
                className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative"
                onSubmit={handleFeedSubmit}
              >
                {/* X 버튼 */}
                <button
                  type="button"
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 focus:outline-none"
                  onClick={() => setShowFeedModal(false)}
                  aria-label="닫기"
                >
                  <img
                    src="/icons/exit_white.svg"
                    alt="닫기"
                    className="w-8 h-8 transition duration-150 hover:brightness-110"
                  />
                </button>
                <h3 className="text-lg font-bold mb-4">피드 작성</h3>
                <div className="mb-2">
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>종목명
                  </label>
                  <input
                    className="w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 text-gray-400 bg-gray-100"
                    placeholder="종목명"
                    value={feedForm.name}
                    disabled
                  />
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>종목코드
                  </label>
                  <input
                    className="w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 text-gray-400 bg-gray-100"
                    placeholder="종목코드"
                    value={feedForm.code}
                    disabled
                  />
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>현재가
                  </label>
                  <input
                    className="w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 text-gray-400 bg-gray-100"
                    placeholder="현재가"
                    value={
                      feedForm.price
                        ? Number(feedForm.price).toLocaleString()
                        : ""
                    }
                    disabled
                  />
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>등락률
                  </label>
                  <input
                    className="w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 text-gray-400 bg-gray-100"
                    placeholder="등락률 (예: +1.23%)"
                    value={feedForm.change}
                    disabled
                  />
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>투자 의견
                  </label>
                  <select
                    ref={opinionRef}
                    className={`w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 appearance-none focus:border-blue-600 focus:border-2 focus:outline-none ${
                      opinionError ? "border-red-500 border-2" : ""
                    }`}
                    style={{
                      background:
                        "url('/icons/arrow-down.svg') no-repeat right 1rem center/1.2em auto",
                      paddingRight: "2.5rem",
                    }}
                    value={feedForm.opinion}
                    onChange={(e) => {
                      setFeedForm({ ...feedForm, opinion: e.target.value });
                      setOpinionError(false);
                    }}
                  >
                    <option
                      value=""
                      disabled
                      hidden
                      style={{ color: "#b0b0b0" }}
                    >
                      목록에서 항목을 선택하세요
                    </option>
                    <option value="매수">매수</option>
                    <option value="강력 매수">강력 매수</option>
                    <option value="중립">중립</option>
                    <option value="관망">관망</option>
                    <option value="매도">매도</option>
                  </select>
                  {opinionError && isSubmitted && (
                    <div
                      className="relative flex items-center gap-2 text-white text-xs mb-2 bg-red-500 rounded-xl px-3 py-2 shadow-lg"
                      style={{ width: "fit-content" }}
                    >
                      <img
                        src="/icons/warning.svg"
                        alt="경고"
                        className="w-4 h-4"
                      />
                      투자 의견을 선택해 주세요.
                      <span
                        className="absolute left-4 -top-2 w-3 h-3"
                        style={{
                          background: "#ef4444",
                          clipPath: "polygon(50% 0, 0 100%, 100% 100%)",
                        }}
                      />
                    </div>
                  )}
                  <label className="block mb-1 text-sm flex items-center">
                    <span className="text-red-500 mr-1">*</span>목표가
                    <button
                      type="button"
                      className="ml-1 text-gray-400 hover:text-blue-600 relative"
                      onMouseEnter={() => setShowTargetTooltip(true)}
                      onMouseLeave={() => setShowTargetTooltip(false)}
                      onFocus={() => setShowTargetTooltip(true)}
                      onBlur={() => setShowTargetTooltip(false)}
                      tabIndex={0}
                      style={{ lineHeight: 1 }}
                    >
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <circle cx="6" cy="6" r="6" fill="#9ca3af" />
                        <text
                          x="6"
                          y="9"
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight="bold"
                          fill="#fff"
                        >
                          !
                        </text>
                      </svg>
                      {showTargetTooltip && (
                        <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs rounded px-2 py-1 shadow z-10">
                          숫자만 입력이 가능합니다.
                        </span>
                      )}
                    </button>
                  </label>
                  <input
                    ref={targetRef}
                    className={`w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 focus:border-blue-600 focus:border-2 focus:outline-none ${
                      targetError ? "border-red-500 border-2" : ""
                    }`}
                    placeholder="목표가 (예: 120000)"
                    value={feedForm.target || ""}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      const formatted = raw.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                      );
                      setFeedForm({ ...feedForm, target: formatted });
                      setTargetError(false);
                    }}
                  />
                  {targetError && isSubmitted && (
                    <div
                      className="relative flex items-center gap-2 text-white text-xs mb-2 bg-red-500 rounded-xl px-3 py-2 shadow-lg"
                      style={{ width: "fit-content" }}
                    >
                      <img
                        src="/icons/warning.svg"
                        alt="경고"
                        className="w-4 h-4"
                      />
                      목표가를 입력해 주세요.
                      <span
                        className="absolute left-4 -top-2 w-3 h-3"
                        style={{
                          background: "#ef4444",
                          clipPath: "polygon(50% 0, 0 100%, 100% 100%)",
                        }}
                      />
                    </div>
                  )}
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>요약/설명
                  </label>
                  <textarea
                    ref={summaryRef}
                    className={`w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 focus:border-blue-600 focus:border-2 focus:outline-none ${
                      summaryError ? "border-red-500 border-2" : ""
                    }`}
                    placeholder="요약/설명"
                    value={feedForm.summary}
                    onChange={(e) => {
                      setFeedForm({ ...feedForm, summary: e.target.value });
                      setSummaryError(false);
                    }}
                    rows={3}
                  />
                  {summaryError && isSubmitted && (
                    <div
                      className="relative flex items-center gap-2 text-white text-xs mb-2 bg-red-500 rounded-xl px-3 py-2 shadow-lg"
                      style={{ width: "fit-content" }}
                    >
                      <img
                        src="/icons/warning.svg"
                        alt="경고"
                        className="w-4 h-4"
                      />
                      요약/설명을 입력해 주세요.
                      <span
                        className="absolute left-4 -top-2 w-3 h-3"
                        style={{
                          background: "#ef4444",
                          clipPath: "polygon(50% 0, 0 100%, 100% 100%)",
                        }}
                      />
                    </div>
                  )}
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>작성자
                  </label>
                  <input
                    ref={authorRef}
                    className={`w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 focus:border-blue-600 focus:border-2 focus:outline-none ${
                      authorError ? "border-red-500 border-2" : ""
                    }`}
                    placeholder="작성자"
                    value={feedForm.author}
                    onChange={(e) => {
                      setFeedForm({ ...feedForm, author: e.target.value });
                      setAuthorError(false);
                    }}
                  />
                  {authorError && isSubmitted && (
                    <div
                      className="relative flex items-center gap-2 text-white text-xs mb-2 bg-red-500 rounded-xl px-3 py-2 shadow-lg"
                      style={{ width: "fit-content" }}
                    >
                      <img
                        src="/icons/warning.svg"
                        alt="경고"
                        className="w-4 h-4"
                      />
                      작성자를 입력해 주세요.
                      <span
                        className="absolute left-4 -top-2 w-3 h-3"
                        style={{
                          background: "#ef4444",
                          clipPath: "polygon(50% 0, 0 100%, 100% 100%)",
                        }}
                      />
                    </div>
                  )}
                  <label className="block mb-1 text-sm">
                    <span className="text-red-500 mr-1">*</span>마감일
                  </label>
                  <input
                    ref={deadlineRef}
                    className={`w-full rounded-xl px-3 py-2 mb-2 text-sm border border-gray-300 text-gray-400 bg-gray-100 focus:border-blue-600 focus:border-2 focus:outline-none ${
                      deadlineError ? "border-red-500 border-2" : ""
                    }`}
                    placeholder="마감일 (예: 2025.12.31 까지)"
                    value={feedForm.deadline}
                    disabled
                    onChange={(e) => {
                      setFeedForm({ ...feedForm, deadline: e.target.value });
                      setDeadlineError(false);
                    }}
                  />
                  {deadlineError && isSubmitted && (
                    <div
                      className="relative flex items-center gap-2 text-white text-xs mb-2 bg-red-500 rounded-xl px-3 py-2 shadow-lg"
                      style={{ width: "fit-content" }}
                    >
                      <img
                        src="/icons/warning.svg"
                        alt="경고"
                        className="w-4 h-4"
                      />
                      마감일을 입력해 주세요.
                      <span
                        className="absolute left-4 -top-2 w-3 h-3"
                        style={{
                          background: "#ef4444",
                          clipPath: "polygon(50% 0, 0 100%, 100% 100%)",
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300"
                    onClick={() => setShowFeedModal(false)}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    등록
                  </button>
                </div>
              </form>
            </div>
          )}

          {globalAlert && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-4 bg-white border border-red-500 rounded-xl px-4 py-3">
              <img src="/icons/warning.svg" alt="경고" className="w-5 h-5" />
              {globalAlert}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
