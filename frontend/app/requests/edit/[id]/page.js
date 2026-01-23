"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { requestAPI } from "@/lib/api";
import Link from "next/link";

export default function EditRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const requestId = params.id;

  const [request, setRequest] = useState(null);
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("男性");
  const [medicalCondition, setMedicalCondition] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequest();
    }
  }, [authLoading, user, requestId]);

  const fetchRequest = async () => {
    try {
      const response = await requestAPI.getById(requestId);
      const req = response.data;
      setRequest(req);
      setPatientAge(req.patient_age.toString());
      setPatientGender(req.patient_gender);
      setMedicalCondition(req.medical_condition);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "リクエストの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await requestAPI.update(requestId, {
        patient_age: parseInt(patientAge),
        patient_gender: patientGender,
        medical_condition: medicalCondition,
      });
      alert("リクエストを更新しました");
      router.push("/requests");
    } catch (err) {
      setError(err.response?.data?.error || "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center py-12">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
          <Link href="/requests" className="text-blue-600 hover:underline">
            ← リクエスト一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-4">
          <Link href="/requests" className="text-blue-600 hover:text-blue-800">
            ← リクエスト一覧に戻る
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">リクエストを編集</h1>

          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">
            施設: {request?.facility_name}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">患者年齢</label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                max="150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">患者性別</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="男性">男性</option>
                <option value="女性">女性</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                医療状態・病状
              </label>
              <textarea
                value={medicalCondition}
                onChange={(e) => setMedicalCondition(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="6"
                required
                placeholder="患者の医療状態や病状を詳しく記入してください"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? "更新中..." : "更新"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/requests")}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
