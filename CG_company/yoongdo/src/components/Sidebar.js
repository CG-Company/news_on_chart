// components/Sidebar.js
import React from "react";
import Link from "next/link";

const Sidebar = ({ currentPage = "dashboard" }) => {
  const menuItems = [
    {
      id: "dashboard",
      label: "CHART",
      icon: "📊",
      href: "/",
      active: true,
    },
    {
      id: "analysis",
      label: "KEYWORDS",
      icon: "📈",
      href: "/analysis",
      active: true,
    },
    {
      id: "keyword",
      label: "COMMUNITY",
      icon: "📰",
      href: "/keyword",
      active: true,
    },
    // { id: "settings", label: "Settings", icon: "⚙️", href: "/settings", active: true },
  ];

  return (
    <div className="w-52 bg-gray-900 h-screen fixed left-0 top-0 flex flex-col z-20">
      {/* 로고 영역 */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-white text-xl font-bold">NEWS ON CHART</h1>
      </div>

      {/* 메뉴 영역 */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.id === currentPage
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 사용자 정보 영역 */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">U</span>
          </div>
          <div className="ml-3">
            <p className="text-white text-sm font-medium">User</p>
            <p className="text-gray-400 text-xs">Premium</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
