"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { requestAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import type { PlacementRequest, User } from "@/lib/types";
import { AxiosError } from "axios";

interface FilterOption {
  id: string;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: "all", label: "全てのリクエスト" },
  { id: "pending", label: "保留中" },
  { id: "accepted", label: "承認済み" },
  { id: "rejected", label: "拒否" },
];

interface StatCardProps {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  label: string;
  value: number;
}

function StatCard({ icon, iconBgColor, iconColor, label, value }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl p-6 bg-white border border-[#cfdbe7] shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 ${iconBgColor} rounded-lg ${iconColor}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
        <p className="text-[#4c739a] text-sm font-bold">{label}</p>
      </div>
      <p className="text-[#0d141b] text-3xl font-black leading-tight mt-1">{value}</p>
    </div>
  );
}

type RequestStatus = "pending" | "accepted" | "rejected" | "negotiating" | "completed" | "cancelled";

interface StatusBadgeProps {
  status: RequestStatus;
}

interface StatusConfig {
  bg: string;
  text: string;
  label: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, StatusConfig> = {
    pending: { bg: "bg-orange-100", text: "text-orange-700", label: "保留中" },
    accepted: { bg: "bg-emerald-100", text: "text-emerald-700", label: "承認済み" },
    rejected: { bg: "bg-slate-100", text: "text-slate-500", label: "拒否" },
  };
  const { bg, text, label } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold ${bg} ${text}`}>
      {label}
    </span>
  );
}

// Extended type for the API response which includes additional fields not in the base type
interface ExtendedPlacementRequest extends PlacementRequest {
  hospital_name?: string;
  facility_name?: string;
  medical_condition?: string;
  room_id?: number;
}

interface RequestStats {
  pending: number;
  accepted: number;
  total: number;
}

export default function RequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ExtendedPlacementRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequests();
      // Hospital users: mark all as read when viewing (they only see badges for accepted/rejected)
      // Facility users: do NOT mark as read (they need to respond to pending requests)
      if (user.role === "hospital") {
        requestAPI.markAllAsRead().catch(() => {
          // Silently ignore errors
        });
      }
    }
  }, [authLoading, user]);

  const fetchRequests = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await requestAPI.list();
      setRequests((response.data as ExtendedPlacementRequest[]) || []);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "リクエストの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: number): Promise<void> => {
    if (!confirm("この受け入れリクエストを承認しますか？")) return;
    try {
      await requestAPI.accept(id);
      fetchRequests();
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      alert(axiosError.response?.data?.error || "承認に失敗しました");
    }
  };

  const handleReject = async (id: number): Promise<void> => {
    if (!confirm("この受け入れリクエストを拒否しますか？")) return;
    try {
      await requestAPI.reject(id);
      fetchRequests();
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      alert(axiosError.response?.data?.error || "拒否に失敗しました");
    }
  };

  const filteredRequests = requests.filter((request) => {
    const matchesFilter = activeFilter === "all" || request.status === activeFilter;
    const matchesSearch =
      !searchQuery ||
      request.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.hospital_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats: RequestStats = {
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    total: requests.length,
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="requests" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="animate-spin h-10 w-10 text-[#2b8cee]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[#4c739a]">読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem="requests" />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#cfdbe7] px-8 py-6">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-end gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#0d141b] mb-2">
                {user?.role === "facility" ? "受け入れリクエスト" : "進行中のリクエスト"}
              </h2>
              <p className="text-[#4c739a]">転院・入所リクエストの管理</p>
            </div>
            {user?.role === "hospital" && (
              <Link
                href="/facilities"
                className="px-4 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新規リクエスト
              </Link>
            )}
          </div>
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              iconBgColor="bg-orange-100"
              iconColor="text-orange-600"
              label="保留中"
              value={stats.pending}
            />
            <StatCard
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              iconBgColor="bg-emerald-100"
              iconColor="text-emerald-600"
              label="承認済み"
              value={stats.accepted}
            />
            <StatCard
              icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              iconBgColor="bg-blue-100"
              iconColor="text-[#2b8cee]"
              label="合計"
              value={stats.total}
            />
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center px-4 py-2.5 bg-white rounded-xl border border-[#cfdbe7]">
                <svg className="w-5 h-5 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full ml-2 placeholder:text-[#4c739a]"
                  placeholder="患者名または病院名で検索..."
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => { setActiveFilter(option.id); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === option.id
                      ? "bg-[#2b8cee] text-white"
                      : "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                  {option.id === "pending" && stats.pending > 0 && (
                    <span className="ml-1.5 bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {stats.pending}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-[#cfdbe7] shadow-sm overflow-hidden">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-[#4c739a] mb-4">リクエストがありません</p>
                {user?.role === "hospital" && (
                  <Link
                    href="/facilities"
                    className="px-6 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90"
                  >
                    施設を検索する
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-[#cfdbe7]">
                        <th className="px-6 py-4 text-xs font-bold uppercase text-[#4c739a]">受信日時</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-[#4c739a]">患者情報</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-[#4c739a]">年齢</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-[#4c739a]">医学的サマリー</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-[#4c739a]">
                          {user?.role === "facility" ? "依頼元病院" : "送信先施設"}
                        </th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-[#4c739a]">ステータス</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-[#4c739a] text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-[#4c739a] text-sm">
                            {new Date(request.created_at).toLocaleString("ja-JP", {
                              year: "numeric", month: "2-digit", day: "2-digit",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#0d141b] text-sm">
                            {request.patient_name || `患者-${request.id}`}
                          </td>
                          <td className="px-6 py-4 text-[#4c739a] text-sm">
                            {request.patient_age || "-"}歳
                          </td>
                          <td className="px-6 py-4 text-[#4c739a] text-sm max-w-[200px]">
                            <p className="truncate">{request.medical_condition || "詳細なし"}</p>
                          </td>
                          <td className="px-6 py-4 text-[#4c739a] text-sm font-medium">
                            {user?.role === "facility" ? request.hospital_name : request.facility_name || "未指定"}
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              {user?.role === "facility" && request.status === "pending" && (
                                <>
                                  <button
                                    onClick={() => handleAccept(request.id)}
                                    className="text-emerald-600 font-bold text-sm hover:underline"
                                  >
                                    承認
                                  </button>
                                  <button
                                    onClick={() => handleReject(request.id)}
                                    className="text-red-500 font-bold text-sm hover:underline"
                                  >
                                    拒否
                                  </button>
                                </>
                              )}
                              {request.status === "accepted" && request.room_id && (
                                <Link
                                  href={`/rooms/${request.room_id}`}
                                  className="text-[#2b8cee] font-bold text-sm hover:underline"
                                >
                                  メッセージ →
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 flex items-center justify-between border-t border-[#cfdbe7] bg-slate-50">
                    <p className="text-sm text-[#4c739a]">
                      全{filteredRequests.length}件中 {(currentPage - 1) * itemsPerPage + 1}〜
                      {Math.min(currentPage * itemsPerPage, filteredRequests.length)}件を表示
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-[#cfdbe7] bg-white text-[#4c739a] hover:bg-slate-50 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-bold ${
                            currentPage === page
                              ? "bg-[#2b8cee] text-white"
                              : "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-[#cfdbe7] bg-white text-[#4c739a] hover:bg-slate-50 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
