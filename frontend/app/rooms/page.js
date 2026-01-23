"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { roomAPI } from "@/lib/api";
import Link from "next/link";

export default function RoomsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchRooms();
    }
  }, [authLoading, user]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomAPI.list();
      setRooms(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "ルームの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      negotiating: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };

    const labels = {
      negotiating: "受け入れ検討中",
      accepted: "受け入れ承認済み",
      completed: "受け入れ完了",
      rejected: "受け入れ拒否",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-sm ${styles[status] || "bg-gray-100 text-gray-800"}`}
      >
        {labels[status] || status}
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
        <h1 className="text-2xl font-bold mb-6">メッセージルーム</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            メッセージルームがありません
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {room.hospital_name} ⇄ {room.facility_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      患者: {room.patient_age}歳 {room.patient_gender}
                    </p>
                  </div>
                  <div>{getStatusBadge(room.status)}</div>
                </div>

                <div className="text-sm text-gray-700">
                  <p className="mb-2">病状: {room.medical_condition}</p>
                  <p className="text-gray-500">
                    作成日時:{" "}
                    {new Date(room.created_at).toLocaleString("ja-JP")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
