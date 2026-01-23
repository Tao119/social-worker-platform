"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { requestAPI } from "@/lib/api";
import Link from "next/link";

export default function RequestsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequests();
    }
  }, [authLoading, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await requestAPI.list();
      console.log("Requests API response:", response);
      console.log("Requests data:", response.data);
      setRequests(response.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.response?.data?.error || "リクエストの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    if (
      !confirm(
        "この受け入れリクエストを承認しますか？承認後、メッセージルームが作成されます。",
      )
    ) {
      return;
    }

    try {
      await requestAPI.accept(id);
      alert("リクエストを承認しました。メッセージルームが作成されました。");
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || "承認に失敗しました");
    }
  };

  const handleReject = async (id) => {
    if (!confirm("この受け入れリクエストを拒否しますか？")) {
      return;
    }

    try {
      await requestAPI.reject(id);
      alert("リクエストを拒否しました");
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || "拒否に失敗しました");
    }
  };

  const handleEdit = (id) => {
    router.push(`/requests/edit/${id}`);
  };

  const handleCancel = async (id) => {
    if (
      !confirm(
        "このリクエストをキャンセルしますか？キャンセル後は復元できません。",
      )
    ) {
      return;
    }

    try {
      await requestAPI.cancel(id);
      alert("リクエストをキャンセルしました");
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.error || "キャンセルに失敗しました");
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const labels = {
      pending: "承認待ち",
      accepted: "承認済み",
      rejected: "拒否済み",
    };

    return (
      <span className={`px-2 py-1 rounded text-sm ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12">読み込み中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← ダッシュボードに戻る
          </Link>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">受け入れリクエスト管理</h1>
          {user?.role === "hospital" && (
            <Link
              href="/facilities"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              新規リクエスト作成
            </Link>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            リクエストがありません
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {request.facility_name}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        患者: {request.patient_age}歳 {request.patient_gender}
                      </p>
                      <p>病院: {request.hospital_name}</p>
                      <p>
                        作成日時:{" "}
                        {new Date(request.created_at).toLocaleString("ja-JP")}
                      </p>
                    </div>
                  </div>
                  <div>{getStatusBadge(request.status)}</div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">医療状態・病状</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {request.medical_condition}
                  </p>
                </div>

                {user?.role === "facility" && request.status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      拒否
                    </button>
                  </div>
                )}

                {user?.role === "hospital" && request.status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(request.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleCancel(request.id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      キャンセル
                    </button>
                  </div>
                )}

                {request.status === "accepted" && request.room_id && (
                  <Link
                    href={`/rooms/${request.room_id}`}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    メッセージルームを開く
                  </Link>
                )}

                {request.status === "accepted" && !request.room_id && (
                  <p className="text-sm text-gray-500">
                    メッセージルームを作成中...
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
