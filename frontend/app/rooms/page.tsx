"use client";

import { useState, useEffect, ChangeEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { roomAPI } from "@/lib/api";
import PageLayout, { PageLoading } from "@/components/PageLayout";

// Room status type
type RoomStatus = "pending" | "negotiating" | "accepted" | "completed" | "rejected";

// Extended room type for list view (includes joined data from API)
interface RoomListItem {
  id: string;
  status: RoomStatus;
  facility_name?: string;
  hospital_name?: string;
  patient_age?: number;
  patient_gender?: string;
  medical_condition?: string;
  created_at: string;
  updated_at?: string;
  latest_message?: string;
  latest_message_at?: string;
  has_unread: boolean;
}

// Status color type
interface StatusColor {
  bg: string;
  text: string;
}

// Filter option type
interface FilterOption {
  id: string;
  label: string;
}

// Stats type
interface RoomStats {
  all: number;
  negotiating: number;
  accepted: number;
  completed: number;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays === 1) return "昨日";
  return date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" });
}

function getStatusLabel(status: RoomStatus): string {
  switch (status) {
    case "negotiating": return "交渉中";
    case "accepted": return "受け入れ確定";
    case "completed": return "完了";
    case "rejected": return "拒否済み";
    default: return "審査待ち";
  }
}

function getStatusColor(status: RoomStatus): StatusColor {
  switch (status) {
    case "negotiating": return { bg: "bg-blue-100", text: "text-[#2b8cee]" };
    case "accepted": return { bg: "bg-emerald-100", text: "text-emerald-700" };
    case "completed": return { bg: "bg-slate-100", text: "text-slate-500" };
    case "rejected": return { bg: "bg-red-100", text: "text-red-700" };
    default: return { bg: "bg-slate-100", text: "text-slate-500" };
  }
}

interface RoomCardProps {
  room: RoomListItem;
  onClick: () => void;
  userRole?: string;
}

function RoomCard({ room, onClick, userRole }: RoomCardProps) {
  const status = getStatusColor(room.status);
  // Show partner name based on user role
  const partnerName = userRole === "hospital" ? room.facility_name : room.hospital_name;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-xl border transition-all cursor-pointer relative ${
        room.has_unread
          ? "border-[#2b8cee] shadow-sm"
          : "border-[#cfdbe7] hover:shadow-md hover:border-[#2b8cee]/30"
      }`}
    >
      {/* Unread badge */}
      {room.has_unread && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="sr-only">未読</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className={`font-bold ${room.has_unread ? "text-[#0d141b]" : "text-[#0d141b]"}`}>
              {partnerName || "不明"}
            </p>
            <p className="text-xs text-[#4c739a]">
              患者: {room.patient_age ? `${room.patient_age}歳` : ""} {room.patient_gender || ""}
            </p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.text}`}>
          {getStatusLabel(room.status)}
        </span>
      </div>
      {/* Latest message preview */}
      <p className={`text-sm mb-2 line-clamp-2 ${room.has_unread ? "text-[#0d141b] font-medium" : "text-[#4c739a]"}`}>
        {room.latest_message || room.medical_condition || "詳細情報なし"}
      </p>
      <div className="flex justify-between items-center text-xs text-[#4c739a]">
        <span>
          {room.latest_message_at
            ? formatTime(room.latest_message_at)
            : `更新: ${formatTime(room.updated_at || room.created_at)}`}
        </span>
        <span className="text-[#2b8cee] font-medium">詳細を見る →</span>
      </div>
    </div>
  );
}

function RoomsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [filter, setFilter] = useState<string>(searchParams.get("filter") || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchRooms();
    }
  }, [authLoading, user]);

  const fetchRooms = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await roomAPI.list();
      setRooms((response.data as unknown as RoomListItem[]) || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "ルームの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room: RoomListItem): boolean => {
    // Status filter
    if (filter === "negotiating" && room.status !== "negotiating") return false;
    if (filter === "accepted" && room.status !== "accepted") return false;
    if (filter === "completed" && (room.status !== "completed" && room.status !== "rejected")) return false;
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchName = room.facility_name?.toLowerCase().includes(query) || room.hospital_name?.toLowerCase().includes(query);
      const matchCondition = room.medical_condition?.toLowerCase().includes(query);
      if (!matchName && !matchCondition) return false;
    }
    return true;
  });

  // Stats
  const stats: RoomStats = {
    all: rooms.length,
    negotiating: rooms.filter((r: RoomListItem) => r.status === "negotiating").length,
    accepted: rooms.filter((r: RoomListItem) => r.status === "accepted").length,
    completed: rooms.filter((r: RoomListItem) => r.status === "completed" || r.status === "rejected").length,
  };

  if (authLoading || loading) {
    return <PageLoading activeItem="rooms" />;
  }

  const filterOptions: FilterOption[] = [
    { id: "all", label: `すべて (${stats.all})` },
    { id: "negotiating", label: `交渉中 (${stats.negotiating})` },
    { id: "accepted", label: `確定 (${stats.accepted})` },
    { id: "completed", label: `履歴 (${stats.completed})` },
  ];

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleFilterClick = (filterId: string): void => {
    setFilter(filterId);
  };

  const handleRoomClick = (roomId: string): void => {
    router.push(`/rooms/${roomId}`);
  };

  const handleSearchFacilities = (): void => {
    router.push("/facilities");
  };

  return (
    <PageLayout
      activeItem="rooms"
      title="メッセージルーム"
      description="施設との調整・コミュニケーション"
    >
      <div>
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
                  onChange={handleSearchChange}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full ml-2 placeholder:text-[#4c739a]"
                  placeholder="施設名や病状で検索..."
                />
              </div>
            </div>
            <div className="flex gap-2">
              {filterOptions.map((f: FilterOption) => (
                <button
                  key={f.id}
                  onClick={() => handleFilterClick(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.id
                      ? "bg-[#2b8cee] text-white"
                      : "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50"
                  }`}
                >
                  {f.label}
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

          {/* Room List */}
          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#cfdbe7] p-12 text-center">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-[#4c739a] mb-4">
                {searchQuery || filter !== "all" ? "条件に一致するルームがありません" : "メッセージルームがありません"}
              </p>
              {user?.role === "hospital" && (
                <button
                  onClick={handleSearchFacilities}
                  className="px-6 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
                >
                  施設を検索する
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room: RoomListItem) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomClick(room.id)}
                  userRole={user?.role}
                />
              ))}
            </div>
          )}
      </div>
    </PageLayout>
  );
}

export default function RoomsPage() {
  return (
    <Suspense fallback={<PageLoading activeItem="rooms" />}>
      <RoomsPageContent />
    </Suspense>
  );
}
