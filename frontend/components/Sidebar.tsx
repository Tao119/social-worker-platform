"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { unreadAPI } from "@/lib/api";
import type { UnreadCounts } from "@/lib/types";

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badgeKey?: keyof UnreadCounts;
}

type UserRole = "hospital" | "facility" | "admin";

// Navigation items for different user roles
const getNavItems = (role: UserRole | undefined): NavItem[] => {
  const hospitalNav: NavItem[] = [
    { id: "dashboard", label: "ダッシュボード", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", href: "/dashboard" },
    { id: "facilities", label: "施設を検索", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", href: "/facilities" },
    { id: "requests", label: "進行中のリクエスト", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", href: "/requests", badgeKey: "requests" },
    { id: "rooms", label: "メッセージ", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", href: "/rooms", badgeKey: "messages" },
    { id: "documents", label: "提出書類", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", href: "/documents" },
  ];

  const facilityNav: NavItem[] = [
    { id: "dashboard", label: "ダッシュボード", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", href: "/dashboard" },
    { id: "profile", label: "施設情報管理", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", href: "/facility/profile" },
    { id: "requests", label: "受け入れリクエスト", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", href: "/requests", badgeKey: "requests" },
    { id: "rooms", label: "メッセージ", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", href: "/rooms", badgeKey: "messages" },
    { id: "documents", label: "書類管理", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", href: "/documents" },
  ];

  const adminNav: NavItem[] = [
    { id: "dashboard", label: "ダッシュボード", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", href: "/dashboard" },
    { id: "admin", label: "アカウント管理", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z", href: "/admin" },
  ];

  switch (role) {
    case "facility":
      return facilityNav;
    case "admin":
      return adminNav;
    default:
      return hospitalNav;
  }
};

// Unread badge component
function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto bg-red-500 text-white rounded-full text-xs font-bold min-w-[20px] h-5 flex items-center justify-center px-1.5">
      {count > 99 ? "99+" : count}
    </span>
  );
}

interface SidebarProps {
  activeItem: string;
}

export default function Sidebar({ activeItem }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const navItems = getNavItems(user?.role);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({ messages: 0, requests: 0 });

  const fetchUnreadCounts = useCallback(async () => {
    if (!user || user.role === "admin") return;

    try {
      const response = await unreadAPI.getCounts();
      setUnreadCounts(response.data);
    } catch (error) {
      // Silently ignore errors - unread counts are not critical
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCounts, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  // Refresh when activeItem changes (user navigates to a page)
  useEffect(() => {
    // Small delay to allow the page to mark items as read
    const timeout = setTimeout(fetchUnreadCounts, 500);
    return () => clearTimeout(timeout);
  }, [activeItem, fetchUnreadCounts]);

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  const getRoleLabel = (role: UserRole | undefined): string => {
    switch (role) {
      case "hospital":
        return "病院";
      case "facility":
        return "施設";
      case "admin":
        return "管理者";
      default:
        return role || "";
    }
  };

  return (
    <aside className="w-64 border-r border-[#cfdbe7] bg-white flex flex-col h-screen sticky top-0 shrink-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 mb-8">
          <div className="bg-[#2b8cee] size-10 rounded-lg flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#0d141b] text-lg font-black leading-tight">remedyCare</h1>
            <p className="text-[#4c739a] text-xs font-medium">
              {user?.role === "facility" ? "施設用ポータル" : user?.role === "admin" ? "管理者ポータル" : "ソーシャルワーカー用ポータル"}
            </p>
          </div>
        </Link>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.href)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                activeItem === item.id
                  ? "bg-[#2b8cee]/10 text-[#2b8cee]"
                  : "text-[#4c739a] hover:bg-slate-100"
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className={`text-sm ${activeItem === item.id ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
              {item.badgeKey && <UnreadBadge count={unreadCounts[item.badgeKey]} />}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-6 border-t border-[#cfdbe7]">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#2b8cee]/20 flex items-center justify-center text-[#2b8cee] font-bold">
            {user?.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.email || "ユーザー"}</p>
            <p className="text-xs text-[#4c739a]">{getRoleLabel(user?.role)}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-[#4c739a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="ログアウト"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
