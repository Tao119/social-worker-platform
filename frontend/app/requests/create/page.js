"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { facilityAPI, requestAPI } from "@/lib/api";
import Link from "next/link";

export default function CreateRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHospital, loading: authLoading } = useAuth();
  const facilityId = searchParams.get("facilityId");

  const [formData, setFormData] = useState({
    facility_id: facilityId || "",
    patient_age: "",
    patient_gender: "男性",
    medical_condition: "",
  });
  const [facility, setFacility] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFacility = useCallback(async () => {
    try {
      const response = await facilityAPI.getById(facilityId);
      setFacility(response.data);
    } catch (err) {
      console.error("Failed to fetch facility:", err);
    }
  }, [facilityId]);

  useEffect(() => {
    if (!isHospital && !authLoading) {
      router.push("/dashboard");
      return;
    }
    if (facilityId && isHospital) {
      fetchFacility();
    }
  }, [facilityId, isHospital, authLoading, router, fetchFacility]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await requestAPI.create({
        ...formData,
        facility_id: parseInt(formData.facility_id),
        patient_age: parseInt(formData.patient_age),
      });
      router.push("/requests");
    } catch (err) {
      setError(
        err.response?.data?.error || "受け入れリクエストの作成に失敗しました",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!isHospital) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← ダッシュボードに戻る
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">受け入れリクエスト作成</h1>

          {facility && (
            <div className="mb-6 p-4 bg-blue-50 rounded">
              <h2 className="font-semibold mb-2">送信先施設</h2>
              <p className="text-lg">{facility.name}</p>
              <p className="text-sm text-gray-600">{facility.address}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  患者年齢 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="patient_age"
                  value={formData.patient_age}
                  onChange={handleChange}
                  required
                  min="0"
                  max="150"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  患者性別 <span className="text-red-500">*</span>
                </label>
                <select
                  name="patient_gender"
                  value={formData.patient_gender}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                  <option value="その他">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  医療状態・病状 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="medical_condition"
                  value={formData.medical_condition}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 肝臓がん手術後、リハビリ必要。ADL一部介助。"
                />
                <p className="text-sm text-gray-500 mt-1">
                  患者の医療状態、必要なケア、特記事項などを詳しく記入してください
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? "送信中..." : "リクエストを送信"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border rounded hover:bg-gray-50"
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
