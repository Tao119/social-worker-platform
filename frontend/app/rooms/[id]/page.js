"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { roomAPI } from "@/lib/api";

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const roomId = params.id;

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const fetchRoomDetails = useCallback(async () => {
    try {
      const response = await roomAPI.getById(roomId);
      setRoom(response.data.room);
      setMessages(response.data.messages || []);
      setFiles(response.data.files || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "ルームの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoomDetails();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchRoomDetails, 5000);
    return () => clearInterval(interval);
  }, [fetchRoomDetails]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await roomAPI.sendMessage(roomId, { message_text: newMessage });
      setNewMessage("");
      fetchRoomDetails();
    } catch (err) {
      alert(err.response?.data?.error || "メッセージの送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      await roomAPI.uploadFile(roomId, formData);
      setSelectedFile(null);
      document.getElementById("fileInput").value = "";
      fetchRoomDetails();
    } catch (err) {
      alert(
        err.response?.data?.error || "ファイルのアップロードに失敗しました",
      );
    } finally {
      setSending(false);
    }
  };

  const handleAcceptRoom = async () => {
    if (
      !confirm(
        "患者の受け入れを承認しますか？承認後も詳細な書類交換や話し合いが可能です。",
      )
    ) {
      return;
    }

    try {
      await roomAPI.accept(roomId);
      alert("受け入れを承認しました");
      fetchRoomDetails();
    } catch (err) {
      alert(err.response?.data?.error || "承認に失敗しました");
    }
  };

  const handleRejectRoom = async () => {
    if (
      !confirm(
        "患者の受け入れを拒否しますか？拒否後、このルームは閉鎖されます。",
      )
    ) {
      return;
    }

    try {
      await roomAPI.reject(roomId);
      alert("受け入れを拒否しました");
      router.push("/rooms");
    } catch (err) {
      alert(err.response?.data?.error || "拒否に失敗しました");
    }
  };

  const handleComplete = async () => {
    if (
      !confirm(
        "全ての作業が完了しましたか？両者が完了すると、このルームは閉鎖されます。",
      )
    ) {
      return;
    }

    try {
      await roomAPI.complete(roomId);
      alert("完了としてマークしました");
      fetchRoomDetails();
    } catch (err) {
      alert(err.response?.data?.error || "完了処理に失敗しました");
    }
  };

  const handleCancelCompletion = async () => {
    if (!confirm("完了をキャンセルしますか？")) {
      return;
    }

    try {
      await roomAPI.cancelCompletion(roomId);
      alert("完了をキャンセルしました");
      fetchRoomDetails();
    } catch (err) {
      alert(err.response?.data?.error || "キャンセルに失敗しました");
    }
  };

  const downloadFile = async (fileId, fileName) => {
    try {
      const response = await roomAPI.downloadFile(roomId, fileId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("ファイルのダウンロードに失敗しました");
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (!confirm(`「${fileName}」を削除してもよろしいですか？`)) {
      return;
    }

    try {
      await roomAPI.deleteFile(roomId, fileId);
      alert("ファイルを削除しました");
      fetchRoomDetails();
    } catch (err) {
      alert(err.response?.data?.error || "ファイルの削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || "ルームが見つかりません"}
          </p>
          <button
            onClick={() => router.push("/rooms")}
            className="text-blue-600 hover:underline"
          >
            ルーム一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const isRoomClosed =
    room.status === "rejected" || room.status === "completed";
  const isNegotiating = room.status === "negotiating";
  const isAccepted = room.status === "accepted";
  const isCompleted = room.status === "completed";
  const canUploadFiles = !isRoomClosed; // No file uploads when closed
  const canSendMessages = room.status !== "rejected"; // Can send messages even when completed

  const getStatusLabel = (status) => {
    switch (status) {
      case "negotiating":
        return "受け入れ検討中";
      case "accepted":
        return "受け入れ承認済み";
      case "completed":
        return "受け入れ完了";
      case "rejected":
        return "受け入れ拒否";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "negotiating":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="mb-2">
            <Link
              href="/rooms"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← ルーム一覧に戻る
            </Link>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">メッセージルーム</h1>
              <p className="text-sm text-gray-500">
                {room.hospital_name} ⇄ {room.facility_name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded text-sm ${getStatusColor(room.status)}`}
              >
                {getStatusLabel(room.status)}
              </span>

              {/* Negotiating phase: Facility can accept or reject */}
              {isNegotiating && user?.role === "facility" && (
                <>
                  <button
                    onClick={handleAcceptRoom}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    受け入れ承認
                  </button>
                  <button
                    onClick={handleRejectRoom}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    受け入れ拒否
                  </button>
                </>
              )}

              {/* Accepted phase: Both parties can mark completion */}
              {isAccepted && (
                <>
                  {user?.role === "hospital" && !room.hospital_completed && (
                    <button
                      onClick={handleComplete}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      作業完了
                    </button>
                  )}
                  {user?.role === "hospital" && room.hospital_completed && (
                    <button
                      onClick={handleCancelCompletion}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    >
                      完了をキャンセル
                    </button>
                  )}
                  {user?.role === "facility" && !room.facility_completed && (
                    <button
                      onClick={handleComplete}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      作業完了
                    </button>
                  )}
                  {user?.role === "facility" && room.facility_completed && (
                    <button
                      onClick={handleCancelCompletion}
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                    >
                      完了をキャンセル
                    </button>
                  )}
                </>
              )}

              {/* Show completion status */}
              {isAccepted && (
                <>
                  {room.hospital_completed && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                      病院: 完了
                    </span>
                  )}
                  {room.facility_completed && (
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                      施設: 完了
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Messages Area */}
          <div className="col-span-2 bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">メッセージ</h2>
            </div>

            {/* Messages List */}
            <div className="h-96 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500">
                  メッセージがありません
                </p>
              ) : (
                messages.map((msg) => {
                  const isMyMessage = msg.sender_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md rounded-lg p-3 ${
                          isMyMessage
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{msg.message_text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMyMessage ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleString("ja-JP")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {canSendMessages && (
              <div className="p-4 border-t">
                {isCompleted && (
                  <p className="text-xs text-gray-500 mb-2">
                    ※ 受け入れ完了後も追加の連絡が可能です
                  </p>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    送信
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Files Area */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">ファイル</h2>
            </div>

            <div className="p-4">
              {canUploadFiles && (
                <div className="mb-4">
                  <input
                    id="fileInput"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {selectedFile && (
                    <button
                      onClick={handleFileUpload}
                      disabled={sending}
                      className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {sending ? "アップロード中..." : "アップロード"}
                    </button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                {files.length === 0 ? (
                  <p className="text-sm text-gray-500">ファイルがありません</p>
                ) : (
                  files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 border rounded hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => downloadFile(file.id, file.file_name)}
                        >
                          <p className="text-sm font-medium truncate">
                            {file.file_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.file_size / 1024).toFixed(1)} KB
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(file.created_at).toLocaleDateString(
                              "ja-JP",
                            )}
                          </p>
                        </div>
                        {file.sender_id === user?.id && !isRoomClosed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id, file.file_name);
                            }}
                            className="ml-2 text-red-600 hover:text-red-800 text-xs"
                          >
                            削除
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
