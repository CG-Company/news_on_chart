import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-gray-50 border-t border-gray-200 py-6 mt-12 flex flex-col items-center">
      <div className="flex items-center gap-4 mb-2">
        <Image
          src="/footer_logo.png"
          alt="KDA STOCK 1TEAM Logo"
          width={60}
          height={60}
        />
        <span className="text-lg font-bold tracking-widest text-gray-700">
          KDA STOCK 1TEAM
        </span>
      </div>
      <div className="text-sm text-gray-500 mb-1">
        주식 뉴스 및 차트 통합 서비스
      </div>
      <div className="text-xs text-gray-400">
        Contact: kda.stock1team@email.com
      </div>
      <div className="text-xs text-gray-400 mt-1">
        © {new Date().getFullYear()} KDA STOCK 1TEAM. All rights reserved.
      </div>
    </footer>
  );
}
