import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 py-4 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-stretch gap-4">
        {/* 왼쪽: 로고 (더 작게, 세로 중앙) */}
        <div className="flex-1 flex items-center justify-center md:justify-start min-w-[120px]">
          <Image
            src="/footer_logo.png"
            alt="KDA STOCK 1TEAM Logo"
            width={260}
            height={260}
            className="object-contain"
          />
        </div>
        {/* 가운데: 회사 정보 */}
        <div className="flex-1 flex flex-col justify-center items-center text-center min-w-[220px] gap-0.5">
          <div className="text-xs text-gray-700 mb-0.5">
            서울시 성동구 왕십리로 63 언더스탠드 에비뉴 B동
            <br />
            상호: (주) CG 투자상사 &nbsp;|&nbsp; 대표자: 박준규
            <br />
            사업자등록번호: 123-45-67890
            <br />
            Copyright © {new Date().getFullYear()} KDA STOCK 1TEAM. All rights
            reserved.
          </div>
          <div className="text-xs text-gray-400">
            통신판매업 신고번호: 제2024-서울송파-0000호 &nbsp;|&nbsp;
            유료직업소개업 등록번호: 제 2024-0000000-00-00000호
          </div>
        </div>
        {/* 오른쪽: 고객센터 */}
        <div className="flex-1 flex flex-col items-center md:items-end justify-center min-w-[180px] gap-1">
          <div className="text-xs text-gray-600 font-semibold mb-0.5">
            KDA STOCK 1TEAM 고객센터
          </div>
          <div className="text-lg font-bold text-gray-800 mb-0.5">
            1644-0000
          </div>
          <div className="text-xs text-gray-500 mb-0.5">
            월~금 09:00~17:00 (주말, 공휴일 휴무)
          </div>
          <div className="text-xs text-gray-500">
            이메일: kda.stock1team@email.com &nbsp;|&nbsp; FAX: 02-0000-0000
          </div>
          <select className="mt-1 border rounded px-2 py-1 text-xs text-gray-600">
            <option>Family site</option>
            <option>공식 블로그</option>
            <option>파트너사</option>
          </select>
        </div>
      </div>
    </footer>
  );
}
