"use client";

import { useEffect, useState, useRef, useCallback, ReactNode, KeyboardEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { requestAPI, facilityAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import type { PlacementRequest, Facility } from "@/lib/types";

interface SearchFilters {
  keyword: string;
  hasAvailableBeds: boolean;
  maxMonthlyFee: string;
  maxMedicineCost: string;
  maxDistanceKm: string;
  careLevel: string;
}

function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

interface StatusCardProps {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  count: number;
  label: string;
  description: string;
  progress: number;
  progressColor: string;
}

function StatusCard({ icon, iconBg, iconColor, count, label, description, progress, progressColor }: StatusCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#cfdbe7] flex flex-col gap-4 shadow-sm">
      <div className={`size-12 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-2xl font-black text-[#0d141b]">{count}件 {label}</h4>
        <p className="text-sm text-[#4c739a]">{description}</p>
      </div>
      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2">
        <div className={`${progressColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

interface RequestItemProps {
  request: PlacementRequest;
  onView: (request: PlacementRequest) => void;
}

function RequestItem({ request, onView }: RequestItemProps) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-orange-100", text: "text-orange-700", label: "施設回答待ち" },
    accepted: { bg: "bg-emerald-100", text: "text-emerald-700", label: "受諾済み" },
    negotiating: { bg: "bg-blue-100", text: "text-[#2b8cee]", label: "交渉中" },
    rejected: { bg: "bg-red-100", text: "text-red-700", label: "拒否" },
  };

  const status = statusColors[request.status] || statusColors.pending;
  const patientInfo = [
    request.patient_age ? `${request.patient_age}歳` : null,
    request.patient_gender || null,
  ].filter(Boolean).join(" ");

  return (
    <div
      onClick={() => onView(request)}
      className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm">{patientInfo || "患者情報"}</p>
          <p className="text-xs text-[#4c739a]">
            ID: #{request.id} • {request.care_type || "一般"}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.text}`}>
          {status.label}
        </span>
        <p className="text-[10px] text-[#4c739a]">更新: {formatDate(request.updated_at)}</p>
      </div>
    </div>
  );
}

interface Stats {
  pending: number;
  accepted: number;
  negotiating: number;
  total?: number;
}

interface FacilityDashboardProps {
  router: ReturnType<typeof useRouter>;
}

function FacilityDashboard({ router }: FacilityDashboardProps) {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [availableBeds, setAvailableBeds] = useState<string>("");
  const [originalBeds, setOriginalBeds] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const hasChanges = availableBeds !== originalBeds;

  useEffect(() => {
    loadFacility();
  }, []);

  const loadFacility = async () => {
    try {
      const response = await facilityAPI.getMy();
      const data = response.data as Facility;
      setFacility(data);
      const beds = data.available_beds?.toString() || "0";
      setAvailableBeds(beds);
      setOriginalBeds(beds);
    } catch {
      // Facility might not exist yet
    }
  };

  const handleUpdateBeds = async () => {
    if (!facility) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await facilityAPI.update(facility.id, {
        available_beds: parseInt(availableBeds) || 0,
      });
      setOriginalBeds(availableBeds);
      setSuccess("空床数を更新しました");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const adjustBeds = (delta: number) => {
    const current = parseInt(availableBeds) || 0;
    const newValue = Math.max(0, current + delta);
    setAvailableBeds(newValue.toString());
  };

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem="dashboard" />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-[#cfdbe7] px-8 py-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-[#0d141b] mb-2">施設ダッシュボード</h2>
            <p className="text-[#4c739a]">受け入れリクエストと施設情報を管理</p>
          </div>
        </div>
        <div className="px-8 py-8 max-w-6xl mx-auto">
          {/* Quick Bed Update Section */}
          {facility && (
            <div className="bg-white p-6 rounded-xl border border-[#cfdbe7] shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#0d141b] mb-1">空床数 クイック更新</h3>
                  <p className="text-sm text-[#4c739a]">
                    総定員: {facility.bed_capacity}床
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustBeds(-1)}
                      className="size-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#0d141b] font-bold text-xl transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={availableBeds}
                      onChange={(e) => setAvailableBeds(e.target.value)}
                      className={`w-20 text-center text-2xl font-bold border rounded-lg py-2 focus:ring-[#2b8cee] focus:border-[#2b8cee] ${
                        hasChanges
                          ? "text-[#2b8cee] border-[#2b8cee] bg-[#2b8cee]/5"
                          : "text-[#4c739a] border-[#cfdbe7]"
                      }`}
                      min="0"
                      max={facility.bed_capacity}
                    />
                    <button
                      onClick={() => adjustBeds(1)}
                      className="size-10 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#0d141b] font-bold text-xl transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={handleUpdateBeds}
                    disabled={saving || !hasChanges}
                    className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 ${
                      hasChanges
                        ? "bg-[#2b8cee] text-white hover:bg-[#2b8cee]/90"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {saving ? "更新中..." : "更新"}
                  </button>
                </div>
              </div>
              {success && (
                <div className="mt-3 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                  {success}
                </div>
              )}
              {error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => router.push("/facility/profile")}
              className="bg-white p-6 rounded-xl border border-[#cfdbe7] shadow-sm hover:shadow-md hover:border-[#2b8cee]/30 transition-all text-left"
            >
              <div className="size-12 rounded-lg bg-[#2b8cee]/10 flex items-center justify-center text-[#2b8cee] mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0d141b] mb-1">施設情報管理</h3>
              <p className="text-sm text-[#4c739a]">施設の基本情報や空き状況を更新</p>
            </button>
            <button
              onClick={() => router.push("/requests")}
              className="bg-white p-6 rounded-xl border border-[#cfdbe7] shadow-sm hover:shadow-md hover:border-[#2b8cee]/30 transition-all text-left"
            >
              <div className="size-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0d141b] mb-1">受け入れリクエスト</h3>
              <p className="text-sm text-[#4c739a]">病院からのリクエストを確認・対応</p>
            </button>
            <button
              onClick={() => router.push("/rooms")}
              className="bg-white p-6 rounded-xl border border-[#cfdbe7] shadow-sm hover:shadow-md hover:border-[#2b8cee]/30 transition-all text-left"
            >
              <div className="size-12 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0d141b] mb-1">メッセージ</h3>
              <p className="text-sm text-[#4c739a]">病院とのコミュニケーション</p>
            </button>
            <button
              onClick={() => router.push("/documents")}
              className="bg-white p-6 rounded-xl border border-[#cfdbe7] shadow-sm hover:shadow-md hover:border-[#2b8cee]/30 transition-all text-left"
            >
              <div className="size-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0d141b] mb-1">書類管理</h3>
              <p className="text-sm text-[#4c739a]">提出書類の確認・ダウンロード</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, isAuthenticated, isFacility, isAdmin } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<PlacementRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, accepted: 0, negotiating: 0 });
  const [loadingRequests, setLoadingRequests] = useState(true);
  const hasRedirected = useRef(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keyword: "",
    hasAvailableBeds: false,
    maxMonthlyFee: "",
    maxMedicineCost: "",
    maxDistanceKm: "",
    careLevel: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  const loadRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const response = await requestAPI.list();
      const data = response.data || [];
      setRequests(data.slice(0, 5));

      const pending = data.filter((r: PlacementRequest) => r.status === "pending").length;
      const accepted = data.filter((r: PlacementRequest) => r.status === "accepted").length;
      const negotiating = data.filter((r: PlacementRequest) => r.status === "negotiating").length;
      setStats({ pending, accepted, negotiating, total: data.length });
    } catch (err) {
      // Error handled silently
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadRequests();
    }
  }, [isAuthenticated, loadRequests]);

  const handleViewRequest = (request: PlacementRequest) => {
    router.push(`/rooms/${request.id}`);
  };

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (searchFilters.keyword) params.set("keyword", searchFilters.keyword);
    if (searchFilters.hasAvailableBeds) params.set("hasAvailableBeds", "true");
    if (searchFilters.maxMonthlyFee) params.set("maxMonthlyFee", searchFilters.maxMonthlyFee);
    if (searchFilters.maxMedicineCost) params.set("maxMedicineCost", searchFilters.maxMedicineCost);
    if (searchFilters.maxDistanceKm) params.set("maxDistanceKm", searchFilters.maxDistanceKm);
    if (searchFilters.careLevel) params.set("careLevel", searchFilters.careLevel);
    const queryString = params.toString();
    return queryString ? `/facilities?${queryString}` : "/facilities";
  };

  const handleSearchSubmit = () => {
    router.push(buildSearchUrl());
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handleResetFilters = () => {
    setSearchFilters({
      keyword: "",
      hasAvailableBeds: false,
      maxMonthlyFee: "",
      maxMedicineCost: "",
      maxDistanceKm: "",
      careLevel: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-[#2b8cee]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-[#4c739a]">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 施設ユーザーの場合は施設ダッシュボードを表示
  if (isFacility) {
    return <FacilityDashboard router={router} />;
  }

  // 管理者ユーザーの場合
  if (isAdmin) {
    return (
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="dashboard" />
        <main className="flex-1 overflow-y-auto">
          <div className="bg-white border-b border-[#cfdbe7] px-8 py-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-black text-[#0d141b] mb-2">管理者ダッシュボード</h2>
              <p className="text-[#4c739a]">システム全体の管理</p>
            </div>
          </div>
          <div className="px-8 py-8 max-w-6xl mx-auto">
            <button
              onClick={() => router.push("/admin")}
              className="bg-white p-6 rounded-xl border border-[#cfdbe7] shadow-sm hover:shadow-md hover:border-[#2b8cee]/30 transition-all text-left w-full max-w-md"
            >
              <div className="size-12 rounded-lg bg-[#2b8cee]/10 flex items-center justify-center text-[#2b8cee] mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#0d141b] mb-1">アカウント管理</h3>
              <p className="text-sm text-[#4c739a]">ユーザーアカウントの管理・作成</p>
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 病院ユーザー（ソーシャルワーカー）のダッシュボード
  const total = stats.pending + stats.accepted + stats.negotiating;

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem="dashboard" />

      <main className="flex-1 overflow-y-auto">
        {/* Search Section */}
        <div className="bg-white border-b border-[#cfdbe7] px-8 py-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-black text-[#0d141b] mb-2">転院先・入所先を探す</h2>
            <p className="text-[#4c739a] mb-6">空き状況・条件から最適な施設を探せます</p>

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center px-4 py-2.5 bg-white rounded-xl border border-[#cfdbe7]">
                  <svg className="w-5 h-5 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full ml-2 placeholder:text-[#4c739a]"
                    placeholder="施設名、エリア、郵便番号で検索"
                    type="text"
                    value={searchFilters.keyword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  showFilters ? "bg-[#2b8cee] text-white" : "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                絞り込み
              </button>
              <button
                onClick={handleSearchSubmit}
                className="px-6 py-2.5 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
              >
                検索する
              </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="bg-slate-50 rounded-xl border border-[#cfdbe7] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#0d141b]">絞り込み条件</h3>
                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-bold text-[#2b8cee] hover:underline"
                  >
                    リセット
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Distance Filter */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      現在地からの距離
                    </p>
                    <select
                      className="w-full px-3 py-2 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none bg-white"
                      value={searchFilters.maxDistanceKm}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSearchFilters({ ...searchFilters, maxDistanceKm: e.target.value })}
                    >
                      <option value="">指定なし</option>
                      <option value="5">〜5km</option>
                      <option value="10">〜10km</option>
                      <option value="15">〜15km</option>
                      <option value="30">〜30km</option>
                      <option value="50">〜50km</option>
                    </select>
                  </div>

                  {/* Monthly Fee Filter */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      月額費用（上限）
                    </p>
                    <select
                      className="w-full px-3 py-2 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none bg-white"
                      value={searchFilters.maxMonthlyFee}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSearchFilters({ ...searchFilters, maxMonthlyFee: e.target.value })}
                    >
                      <option value="">指定なし</option>
                      <option value="100000">〜10万円</option>
                      <option value="150000">〜15万円</option>
                      <option value="200000">〜20万円</option>
                      <option value="300000">〜30万円</option>
                    </select>
                  </div>

                  {/* Medicine Cost Filter */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      薬価（上限）
                    </p>
                    <select
                      className="w-full px-3 py-2 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none bg-white"
                      value={searchFilters.maxMedicineCost}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSearchFilters({ ...searchFilters, maxMedicineCost: e.target.value })}
                    >
                      <option value="">指定なし</option>
                      <option value="50000">〜5万円</option>
                      <option value="100000">〜10万円</option>
                      <option value="150000">〜15万円</option>
                      <option value="200000">〜20万円</option>
                    </select>
                  </div>

                  {/* Care Level Filter */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      介護度
                    </p>
                    <select
                      className="w-full px-3 py-2 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none bg-white"
                      value={searchFilters.careLevel}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSearchFilters({ ...searchFilters, careLevel: e.target.value })}
                    >
                      <option value="">指定なし</option>
                      <option value="要支援1">要支援1</option>
                      <option value="要支援2">要支援2</option>
                      <option value="要介護1">要介護1</option>
                      <option value="要介護2">要介護2</option>
                      <option value="要介護3">要介護3</option>
                      <option value="要介護4">要介護4</option>
                      <option value="要介護5">要介護5</option>
                    </select>
                  </div>

                  {/* Available Beds Toggle */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      空き状況
                    </p>
                    <button
                      type="button"
                      onClick={() => setSearchFilters({ ...searchFilters, hasAvailableBeds: !searchFilters.hasAvailableBeds })}
                      className={`w-full flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors bg-white ${
                        searchFilters.hasAvailableBeds ? "border-[#2b8cee] border-2" : "border border-[#cfdbe7]"
                      }`}
                    >
                      <span className="text-sm font-medium">空きありのみ表示</span>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${searchFilters.hasAvailableBeds ? "bg-[#2b8cee]" : "bg-slate-300"}`}>
                        <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${searchFilters.hasAvailableBeds ? "right-1" : "left-1"}`} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-8 py-8 max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-6 px-2">
            <div>
              <h3 className="text-xl font-bold text-[#0d141b]">リクエスト状況</h3>
              <p className="text-[#4c739a] text-sm">{total}件の転院調整を管理中</p>
            </div>
            <button
              onClick={() => router.push("/requests")}
              className="text-[#2b8cee] text-sm font-bold hover:underline"
            >
              履歴をすべて見る
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatusCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-orange-100"
              iconColor="text-orange-600"
              count={stats.pending}
              label="保留中"
              description="施設からの回答待ち"
              progress={total > 0 ? (stats.pending / total) * 100 : 0}
              progressColor="bg-orange-500"
            />
            <StatusCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
              count={stats.accepted}
              label="受諾済み"
              description="搬送調整が可能な状態です"
              progress={total > 0 ? (stats.accepted / total) * 100 : 0}
              progressColor="bg-emerald-500"
            />
            <StatusCard
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>}
              iconBg="bg-blue-100"
              iconColor="text-[#2b8cee]"
              count={stats.negotiating}
              label="交渉中"
              description="費用またはケア内容の確認中"
              progress={total > 0 ? (stats.negotiating / total) * 100 : 0}
              progressColor="bg-[#2b8cee]"
            />
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-xl border border-[#cfdbe7] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#cfdbe7] flex justify-between items-center">
              <h3 className="font-bold text-[#0d141b]">最近のリクエスト</h3>
              <button className="p-2 hover:bg-slate-100 rounded-lg text-[#4c739a]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>

            {loadingRequests ? (
              <div className="px-6 py-12 text-center">
                <svg className="animate-spin h-8 w-8 text-[#2b8cee] mx-auto mb-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-[#4c739a]">読み込み中...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-[#4c739a] mb-4">まだリクエストがありません</p>
                <button
                  onClick={() => router.push("/requests/create")}
                  className="px-6 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
                >
                  新規リクエスト作成
                </button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-[#cfdbe7]">
                  {requests.map((request) => (
                    <RequestItem key={request.id} request={request} onView={handleViewRequest} />
                  ))}
                </div>
                {stats.total && stats.total > 5 && (
                  <div className="bg-slate-50 px-6 py-3 border-t border-[#cfdbe7]">
                    <button
                      onClick={() => router.push("/requests")}
                      className="w-full text-center text-xs font-bold text-[#2b8cee] hover:text-[#2b8cee]/80"
                    >
                      残り{stats.total - 5}件のリクエストを読み込む
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Info Cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-[#2b8cee]/5 border border-[#2b8cee]/20">
              <h4 className="font-bold text-[#2b8cee] mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                ヒント
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                施設検索タブで保険会社や保証人の有無でフィルタリングできるようになりました。条件に合う施設をより素早く見つけることができます。
              </p>
            </div>
            <div className="p-5 rounded-xl bg-slate-100 border border-slate-200">
              <h4 className="font-bold text-[#0d141b] mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                施設の空き状況について
              </h4>
              <p className="text-xs text-[#4c739a] leading-relaxed">
                空き病床情報は提携施設によって30分ごとに更新されます。緊急の転院が必要な場合は、施設へ直接お電話でご確認ください。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
