"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { adminAPI } from "@/lib/api";

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hospitals");
  const [hospitals, setHospitals] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    address: "",
    phone: "",
    bed_capacity: "",
    acceptance_conditions: "",
  });

  useEffect(() => {
    if (!isAdmin && !authLoading) {
      router.push("/dashboard");
      return;
    }
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loading, router, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      if (activeTab === "hospitals") {
        const response = await adminAPI.listHospitals();
        setHospitals(response.data || []);
      } else {
        const response = await adminAPI.listFacilities();
        setFacilities(response.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.error || "データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      address: "",
      phone: "",
      bed_capacity: "",
      acceptance_conditions: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setFormData({
      email: item.email || "",
      password: "",
      name: item.name || "",
      address: item.address || "",
      phone: item.phone || "",
      bed_capacity: item.bed_capacity || "",
      acceptance_conditions: item.acceptance_conditions || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const submitData = {
        ...formData,
      };

      if (activeTab === "facilities") {
        submitData.bed_capacity = parseInt(formData.bed_capacity) || 0;
      }

      if (editingId) {
        if (activeTab === "hospitals") {
          await adminAPI.updateHospital(editingId, submitData);
          setSuccess("病院情報を更新しました");
        } else {
          await adminAPI.updateFacility(editingId, submitData);
          setSuccess("施設情報を更新しました");
        }
      } else {
        if (activeTab === "hospitals") {
          await adminAPI.createHospital(submitData);
          setSuccess("病院アカウントを作成しました");
        } else {
          await adminAPI.createFacility(submitData);
          setSuccess("施設アカウントを作成しました");
        }
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || "操作に失敗しました");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("本当に削除しますか？")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      if (activeTab === "hospitals") {
        await adminAPI.deleteHospital(id);
        setSuccess("病院アカウントを削除しました");
      } else {
        await adminAPI.deleteFacility(id);
        setSuccess("施設アカウントを削除しました");
      }
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || "削除に失敗しました");
    }
  };

  if (!isAdmin) {
    return null;
  }

  const currentList = activeTab === "hospitals" ? hospitals : facilities;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              管理者ダッシュボード
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              病院・施設アカウントの管理
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ダッシュボードに戻る
          </button>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => {
                  setActiveTab("hospitals");
                  resetForm();
                }}
                className={`${
                  activeTab === "hospitals"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                病院アカウント
              </button>
              <button
                onClick={() => {
                  setActiveTab("facilities");
                  resetForm();
                }}
                className={`${
                  activeTab === "facilities"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                施設アカウント
              </button>
            </nav>
          </div>
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

        <div className="mb-6">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {activeTab === "hospitals" ? "病院を追加" : "施設を追加"}
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingId
                ? activeTab === "hospitals"
                  ? "病院情報編集"
                  : "施設情報編集"
                : activeTab === "hospitals"
                  ? "病院アカウント作成"
                  : "施設アカウント作成"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  パスワード{" "}
                  {!editingId && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={editingId ? "変更する場合のみ入力" : ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {activeTab === "hospitals" ? "病院名" : "施設名"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  住所
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  電話番号
                </label>
                <input
                  type="tel"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              {activeTab === "facilities" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      病床数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
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
                    <label className="block text-sm font-medium text-gray-700">
                      受け入れ条件
                    </label>
                    <textarea
                      rows={3}
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
                </>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingId ? "更新" : "作成"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {currentList.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {activeTab === "hospitals"
                    ? "病院アカウントがありません"
                    : "施設アカウントがありません"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {currentList.map((item) => (
                  <li key={item.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            メール: {item.email}
                          </p>
                          {item.address && (
                            <p className="mt-1 text-sm text-gray-500">
                              住所: {item.address}
                            </p>
                          )}
                          {item.phone && (
                            <p className="mt-1 text-sm text-gray-500">
                              電話: {item.phone}
                            </p>
                          )}
                          {activeTab === "facilities" && (
                            <>
                              <p className="mt-1 text-sm text-gray-500">
                                病床数: {item.bed_capacity}床
                              </p>
                              {item.acceptance_conditions && (
                                <p className="mt-1 text-sm text-gray-500">
                                  受け入れ条件: {item.acceptance_conditions}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                        <div className="ml-5 flex-shrink-0 flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
