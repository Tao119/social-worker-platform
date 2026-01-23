"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { facilityAPI } from "@/lib/api";

export default function FacilityProfilePage() {
  const { user, isFacility, loading: authLoading } = useAuth();
  const router = useRouter();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    bed_capacity: "",
    acceptance_conditions: "",
  });

  useEffect(() => {
    if (!isFacility && !authLoading) {
      router.push("/dashboard");
      return;
    }
    if (isFacility) {
      loadFacility();
    }
  }, [isFacility, loading, router]);

  const loadFacility = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await facilityAPI.getMy();
      setFacility(response.data);
      setFormData({
        name: response.data.name || "",
        address: response.data.address || "",
        phone: response.data.phone || "",
        bed_capacity: response.data.bed_capacity || "",
        acceptance_conditions: response.data.acceptance_conditions || "",
      });
    } catch (err) {
      if (err.response?.status === 404) {
        setIsEditing(true);
      } else {
        setError(
          err.response?.data?.error || "施設情報の読み込みに失敗しました",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const submitData = {
        ...formData,
        bed_capacity: parseInt(formData.bed_capacity) || 0,
      };

      if (facility) {
        await facilityAPI.update(facility.id, submitData);
        setSuccess("施設情報を更新しました");
      } else {
        await facilityAPI.create(submitData);
        setSuccess("施設情報を登録しました");
      }
      setIsEditing(false);
      await loadFacility();
    } catch (err) {
      setError(err.response?.data?.error || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (facility) {
      setFormData({
        name: facility.name || "",
        address: facility.address || "",
        phone: facility.phone || "",
        bed_capacity: facility.bed_capacity || "",
        acceptance_conditions: facility.acceptance_conditions || "",
      });
      setIsEditing(false);
    }
  };

  if (!isFacility) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">施設情報</h1>
          <p className="mt-2 text-sm text-gray-600">
            {facility ? "施設情報の確認・編集" : "施設情報を登録してください"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        )}

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {!isEditing && facility ? (
              <div>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      施設名
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {facility.name}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">住所</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {facility.address || "未登録"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      電話番号
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {facility.phone || "未登録"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      病床数
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {facility.bed_capacity}床
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      受け入れ条件
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {facility.acceptance_conditions || "未登録"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    ダッシュボードに戻る
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    施設名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    住所
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    電話番号
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="bed_capacity"
                    className="block text-sm font-medium text-gray-700"
                  >
                    病床数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="bed_capacity"
                    required
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    value={formData.bed_capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bed_capacity: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="acceptance_conditions"
                    className="block text-sm font-medium text-gray-700"
                  >
                    受け入れ条件
                  </label>
                  <textarea
                    id="acceptance_conditions"
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                    value={formData.acceptance_conditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acceptance_conditions: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  {facility && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      キャンセル
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    ダッシュボードに戻る
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
