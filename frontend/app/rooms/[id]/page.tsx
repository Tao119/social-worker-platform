"use client";

import { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { roomAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";

// Room status type
type RoomStatus = "pending" | "negotiating" | "accepted" | "completed" | "rejected";

// Message type for room detail
interface RoomMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name?: string;
  message_text: string;
  created_at: string;
}

// File type for room detail
interface RoomFileItem {
  id: number;
  room_id: number;
  sender_id: number;
  file_name: string;
  file_size: number;
  created_at: string;
}

// Extended room type for detail view
interface RoomDetail {
  id: number;
  status: RoomStatus;
  facility_name?: string;
  hospital_name?: string;
  patient_age?: number;
  patient_gender?: string;
  medical_condition?: string;
  hospital_completed?: boolean;
  facility_completed?: boolean;
  created_at: string;
  updated_at?: string;
}

// API response type for room detail
interface RoomDetailResponse {
  room: RoomDetail;
  messages: RoomMessage[];
  files: RoomFileItem[];
}

// Status color type
interface StatusColor {
  bg: string;
  text: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusLabel(status: RoomStatus): string {
  switch (status) {
    case "negotiating": return "交渉中";
    case "accepted": return "受け入れ確定";
    case "completed": return "完了";
    case "rejected": return "拒否済み";
    default: return status;
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

interface MessageBubbleProps {
  message: RoomMessage;
  isOwn: boolean;
}

// Message Bubble Component
function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex gap-3 max-w-[70%] ${isOwn ? "self-end flex-row-reverse" : ""}`}>
      <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <div className={`flex flex-col gap-1 ${isOwn ? "items-end" : ""}`}>
        <div className={`flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
          <span className="text-xs font-bold text-[#0d141b]">{isOwn ? "自分" : message.sender_name || "担当者"}</span>
          <span className="text-[10px] text-[#4c739a]">{formatTime(message.created_at)}</span>
        </div>
        <div
          className={`p-3 rounded-xl ${
            isOwn
              ? "bg-[#2b8cee] text-white rounded-tr-none"
              : "bg-slate-100 text-[#0d141b] rounded-tl-none"
          }`}
        >
          <p className="text-sm leading-relaxed">{message.message_text}</p>
        </div>
      </div>
    </div>
  );
}

interface FileItemProps {
  file: RoomFileItem;
  onDownload: (fileId: number, fileName: string) => void;
  onDelete: (fileId: number, fileName: string) => void;
  onPreview: (file: RoomFileItem) => void;
  canDelete: boolean;
}

// Check if file is previewable
function isPreviewable(fileName: string | undefined): boolean {
  if (!fileName) return false;
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["pdf", "jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
}

// File Item Component
function FileItem({ file, onDownload, onDelete, onPreview, canDelete }: FileItemProps) {
  const getFileIcon = (fileName: string | undefined): string => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
    return "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z";
  };

  const previewable = isPreviewable(file.file_name);

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-[#cfdbe7]">
      <div className="size-10 rounded-lg bg-[#2b8cee]/10 flex items-center justify-center text-[#2b8cee]">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getFileIcon(file.file_name)} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.file_name}</p>
        <p className="text-xs text-[#4c739a]">{(file.file_size / 1024).toFixed(1)} KB</p>
      </div>
      <div className="flex items-center gap-2">
        {previewable && (
          <button
            onClick={() => onPreview(file)}
            className="p-2 text-[#4c739a] hover:text-[#2b8cee] hover:bg-[#2b8cee]/10 rounded-lg transition-colors"
            title="プレビュー"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onDownload(file.id, file.file_name)}
          className="p-2 text-[#4c739a] hover:text-[#2b8cee] hover:bg-[#2b8cee]/10 rounded-lg transition-colors"
          title="ダウンロード"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(file.id, file.file_name)}
            className="p-2 text-[#4c739a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="削除"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// File Preview Modal Component
interface FilePreviewModalProps {
  file: RoomFileItem | null;
  previewUrl: string | null;
  onClose: () => void;
  onDownload: (fileId: number, fileName: string) => void;
}

function FilePreviewModal({ file, previewUrl, onClose, onDownload }: FilePreviewModalProps) {
  if (!file || !previewUrl) return null;

  const ext = file.file_name?.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "");
  const isPdf = ext === "pdf";

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl max-h-[90vh] w-full flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#cfdbe7]">
          <h3 className="font-bold text-[#0d141b] truncate flex-1 mr-4">{file.file_name}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file.id, file.file_name)}
              className="p-2 text-[#4c739a] hover:text-[#2b8cee] hover:bg-[#2b8cee]/10 rounded-lg transition-colors"
              title="ダウンロード"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#4c739a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="閉じる"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100">
          {isImage && (
            <img
              src={previewUrl}
              alt={file.file_name}
              className="max-w-full max-h-[calc(90vh-120px)] object-contain"
            />
          )}
          {isPdf && (
            <iframe
              src={previewUrl}
              className="w-full h-[calc(90vh-120px)]"
              title={file.file_name}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.id as string;

  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [files, setFiles] = useState<RoomFileItem[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [previewFile, setPreviewFile] = useState<RoomFileItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRoomDetails = useCallback(async (): Promise<void> => {
    try {
      const response = await roomAPI.getById(roomId);
      const data = response.data as unknown as RoomDetailResponse;
      setRoom(data.room);
      setMessages(data.messages || []);
      setFiles(data.files || []);
      setError("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "ルームの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Mark room as read when opened
  const markAsRead = useCallback(async (): Promise<void> => {
    try {
      await roomAPI.markAsRead(roomId);
    } catch {
      // Silently ignore errors - marking as read is not critical
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomDetails();
    markAsRead(); // Mark as read when page is opened
    const interval = setInterval(fetchRoomDetails, 5000);
    return () => clearInterval(interval);
  }, [fetchRoomDetails, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await roomAPI.sendMessage(roomId, { message_text: newMessage });
      setNewMessage("");
      fetchRoomDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "メッセージの送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await roomAPI.uploadFile(roomId, formData);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchRoomDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "ファイルのアップロードに失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRoom = async (): Promise<void> => {
    if (!confirm("患者の受け入れを承認しますか？")) return;
    try {
      await roomAPI.accept(roomId);
      alert("受け入れを承認しました");
      fetchRoomDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "承認に失敗しました");
    }
  };

  const handleRejectRoom = async (): Promise<void> => {
    if (!confirm("患者の受け入れを拒否しますか？拒否後、このルームは閉鎖されます。")) return;
    try {
      await roomAPI.reject(roomId);
      alert("受け入れを拒否しました");
      router.push("/rooms");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "拒否に失敗しました");
    }
  };

  const handleComplete = async (): Promise<void> => {
    if (!confirm("全ての作業が完了しましたか？両者が完了すると、このルームは閉鎖されます。")) return;
    try {
      await roomAPI.complete(roomId);
      alert("完了としてマークしました");
      fetchRoomDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "完了処理に失敗しました");
    }
  };

  const handleCancelCompletion = async (): Promise<void> => {
    if (!confirm("完了をキャンセルしますか？")) return;
    try {
      await roomAPI.cancelCompletion(roomId);
      alert("完了をキャンセルしました");
      fetchRoomDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "キャンセルに失敗しました");
    }
  };

  const downloadFile = async (fileId: number, fileName: string): Promise<void> => {
    try {
      const response = await roomAPI.downloadFile(roomId, fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("ファイルのダウンロードに失敗しました");
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string): Promise<void> => {
    if (!confirm(`「${fileName}」を削除してもよろしいですか？`)) return;
    try {
      await roomAPI.deleteFile(roomId, fileId);
      alert("ファイルを削除しました");
      fetchRoomDetails();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "ファイルの削除に失敗しました");
    }
  };

  const handlePreviewFile = async (file: RoomFileItem): Promise<void> => {
    try {
      const response = await roomAPI.previewFile(roomId, file.id);
      // Determine MIME type based on file extension
      const ext = file.file_name?.split(".").pop()?.toLowerCase();
      let mimeType = "application/octet-stream";
      if (ext === "pdf") mimeType = "application/pdf";
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "png") mimeType = "image/png";
      else if (ext === "gif") mimeType = "image/gif";
      else if (ext === "webp") mimeType = "image/webp";
      else if (ext === "svg") mimeType = "image/svg+xml";

      const url = window.URL.createObjectURL(new Blob([response.data], { type: mimeType }));
      setPreviewFile(file);
      setPreviewUrl(url);
    } catch {
      alert("ファイルのプレビューに失敗しました");
    }
  };

  const closePreview = (): void => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const handleMessageChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setNewMessage(e.target.value);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="rooms" />
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

  if (error || !room) {
    return (
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="rooms" />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="text-red-500 mb-4">{error || "ルームが見つかりません"}</p>
          <Link href="/rooms" className="text-[#2b8cee] hover:underline">
            ルーム一覧に戻る
          </Link>
        </main>
      </div>
    );
  }

  const isRoomClosed = room.status === "rejected" || room.status === "completed";
  const isNegotiating = room.status === "negotiating";
  const isAccepted = room.status === "accepted";
  const canSendMessages = room.status !== "rejected";
  const canUploadFiles = !isRoomClosed;
  const status = getStatusColor(room.status);

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem="rooms" />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#cfdbe7] px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <Link href="/rooms" className="text-[#2b8cee] hover:underline text-sm mb-2 inline-block">
              ← ルーム一覧に戻る
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-black text-[#0d141b]">
                    {user?.role === "hospital" ? room.facility_name : room.hospital_name}
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status.bg} ${status.text}`}>
                    {getStatusLabel(room.status)}
                  </span>
                </div>
                <p className="text-sm text-[#4c739a]">
                  患者: {room.patient_age}歳 {room.patient_gender} | {room.medical_condition || "詳細情報なし"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Facility actions */}
                {isNegotiating && user?.role === "facility" && (
                  <>
                    <button
                      onClick={handleRejectRoom}
                      className="px-4 py-2 rounded-lg border border-[#cfdbe7] text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      拒否
                    </button>
                    <button
                      onClick={handleAcceptRoom}
                      className="px-4 py-2 rounded-lg bg-[#2b8cee] text-white text-sm font-bold hover:bg-[#2b8cee]/90 transition-colors"
                    >
                      受け入れ確定
                    </button>
                  </>
                )}
                {/* Complete buttons */}
                {isAccepted && (
                  <>
                    {((user?.role === "hospital" && !room.hospital_completed) ||
                      (user?.role === "facility" && !room.facility_completed)) && (
                      <button
                        onClick={handleComplete}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
                      >
                        作業完了
                      </button>
                    )}
                    {((user?.role === "hospital" && room.hospital_completed) ||
                      (user?.role === "facility" && room.facility_completed)) && (
                      <button
                        onClick={handleCancelCompletion}
                        className="px-4 py-2 rounded-lg border border-[#cfdbe7] text-sm font-bold text-[#4c739a] hover:bg-slate-50 transition-colors"
                      >
                        完了をキャンセル
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Completion status badges */}
            {isAccepted && (room.hospital_completed || room.facility_completed) && (
              <div className="flex gap-2 mt-3">
                {room.hospital_completed && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">病院: 完了</span>
                )}
                {room.facility_completed && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded">施設: 完了</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages Area */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#cfdbe7] shadow-sm flex flex-col h-[600px]">
              <div className="px-6 py-4 border-b border-[#cfdbe7]">
                <h3 className="font-bold text-[#0d141b]">メッセージ</h3>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {/* Date indicator */}
                <div className="flex justify-center">
                  <span className="text-xs text-[#4c739a] bg-slate-100 px-3 py-1 rounded-full">
                    {formatDate(room.created_at)}
                  </span>
                </div>

                {messages.length === 0 ? (
                  <p className="text-center text-[#4c739a] py-8">メッセージがありません</p>
                ) : (
                  messages.map((msg: RoomMessage) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === user?.id}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {canSendMessages ? (
                <div className="p-4 border-t border-[#cfdbe7]">
                  {room.status === "completed" && (
                    <p className="text-xs text-[#4c739a] mb-2">※ 受け入れ完了後も追加の連絡が可能です</p>
                  )}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleMessageChange}
                      placeholder="メッセージを入力..."
                      className="flex-1 px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-2.5 bg-[#2b8cee] text-white rounded-xl font-bold text-sm hover:bg-[#2b8cee]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      送信
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-4 border-t border-[#cfdbe7] bg-slate-50 text-center">
                  <p className="text-[#4c739a] text-sm">このルームは閉鎖されています</p>
                </div>
              )}
            </div>

            {/* Files Area */}
            <div className="bg-white rounded-xl border border-[#cfdbe7] shadow-sm">
              <div className="px-6 py-4 border-b border-[#cfdbe7]">
                <h3 className="font-bold text-[#0d141b]">共有ファイル</h3>
              </div>

              <div className="p-4">
                {canUploadFiles && (
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-[#cfdbe7] rounded-xl text-[#4c739a] hover:border-[#2b8cee] hover:text-[#2b8cee] hover:bg-[#2b8cee]/5 transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium">ファイルをアップロード</span>
                    </label>
                  </div>
                )}

                <div className="space-y-2">
                  {files.length === 0 ? (
                    <p className="text-sm text-[#4c739a] text-center py-4">ファイルがありません</p>
                  ) : (
                    files.map((file: RoomFileItem) => (
                      <FileItem
                        key={file.id}
                        file={file}
                        onDownload={downloadFile}
                        onDelete={handleDeleteFile}
                        onPreview={handlePreviewFile}
                        canDelete={file.sender_id === user?.id && !isRoomClosed}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        previewUrl={previewUrl}
        onClose={closePreview}
        onDownload={downloadFile}
      />
    </div>
  );
}
