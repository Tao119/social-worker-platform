"use client";

import { useState, useEffect, FormEvent, ReactNode, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { adminAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import type { Hospital, Facility } from "@/lib/types";
import { AxiosError } from "axios";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-[#2b8cee] text-white"
          : "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

type AccountItem = Hospital | Facility;
type AccountType = "hospitals" | "facilities";

interface AccountCardProps {
  item: AccountItem;
  type: AccountType;
  onEdit: (item: AccountItem) => void;
  onDelete: (id: number) => void;
}

function AccountCard({ item, type, onEdit, onDelete }: AccountCardProps) {
  const facilityItem = item as Facility;

  return (
    <div className="bg-white p-4 rounded-xl border border-[#cfdbe7] hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-[#2b8cee]/10 flex items-center justify-center text-[#2b8cee] font-bold">
            {item.name?.[0]?.toUpperCase() || (type === "hospitals" ? "H" : "F")}
          </div>
          <div>
            <p className="font-bold text-[#0d141b]">{item.name}</p>
            {"email" in item && item.email && (
              <p className="text-xs text-[#4c739a]">{item.email}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          type === "hospitals" ? "bg-blue-100 text-[#2b8cee]" : "bg-emerald-100 text-emerald-700"
        }`}>
          {type === "hospitals" ? "病院" : "施設"}
        </span>
      </div>
      <div className="space-y-1 text-sm text-[#4c739a] mb-4">
        {item.address && <p>住所: {item.address}</p>}
        {item.phone && <p>電話: {item.phone}</p>}
        {type === "facilities" && facilityItem.bed_capacity && (
          <p>病床数: {facilityItem.bed_capacity}床</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 px-3 py-2 rounded-lg bg-[#2b8cee]/10 text-[#2b8cee] text-sm font-medium hover:bg-[#2b8cee]/20 transition-colors"
        >
          編集
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="flex-1 px-3 py-2 rounded-lg bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}

interface FormData {
  email: string;
  password: string;
  name: string;
  address: string;
  phone: string;
  bed_capacity: string;
  acceptance_conditions: string;
}

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AccountType>("hospitals");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
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
  }, [isAdmin, authLoading, router, activeTab]);

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
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "データの読み込みに失敗しました");
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

  const handleEdit = (item: AccountItem) => {
    const facilityItem = item as Facility;
    setFormData({
      email: ("email" in item ? item.email : "") || "",
      password: "",
      name: item.name || "",
      address: item.address || "",
      phone: item.phone || "",
      bed_capacity: facilityItem.bed_capacity?.toString() || "",
      acceptance_conditions: facilityItem.acceptance_conditions || "",
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        if (activeTab === "hospitals") {
          await adminAPI.updateHospital(editingId, {
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
          });
          setSuccess("病院情報を更新しました");
        } else {
          await adminAPI.updateFacility(editingId, {
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            bed_capacity: parseInt(formData.bed_capacity) || 0,
            acceptance_conditions: formData.acceptance_conditions,
          });
          setSuccess("施設情報を更新しました");
        }
      } else {
        if (activeTab === "hospitals") {
          await adminAPI.createHospital({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
          });
          setSuccess("病院アカウントを作成しました");
        } else {
          await adminAPI.createFacility({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            address: formData.address,
            phone: formData.phone,
            bed_capacity: parseInt(formData.bed_capacity) || 0,
            acceptance_conditions: formData.acceptance_conditions,
          });
          setSuccess("施設アカウントを作成しました");
        }
      }
      resetForm();
      await loadData();
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "操作に失敗しました");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("本当に削除しますか？")) return;

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
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "削除に失敗しました");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="admin" />
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

  if (!isAdmin) {
    return null;
  }

  const currentList: AccountItem[] = activeTab === "hospitals" ? hospitals : facilities;

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem="admin" />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#cfdbe7] px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-black text-[#0d141b] mb-2">アカウント管理</h2>
            <p className="text-[#4c739a]">病院・施設アカウントの作成・編集・削除</p>
          </div>
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto">
          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
              {success}
            </div>
          )}

          {/* Tabs and Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex gap-2">
              <TabButton
                active={activeTab === "hospitals"}
                onClick={() => { setActiveTab("hospitals"); resetForm(); }}
              >
                病院アカウント ({hospitals.length})
              </TabButton>
              <TabButton
                active={activeTab === "facilities"}
                onClick={() => { setActiveTab("facilities"); resetForm(); }}
              >
                施設アカウント ({facilities.length})
              </TabButton>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {activeTab === "hospitals" ? "病院を追加" : "施設を追加"}
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-[#cfdbe7] p-6 mb-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#0d141b] mb-4">
                {editingId
                  ? (activeTab === "hospitals" ? "病院情報編集" : "施設情報編集")
                  : (activeTab === "hospitals" ? "病院アカウント作成" : "施設アカウント作成")}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] mb-1">
                      メールアドレス <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] mb-1">
                      パスワード {!editingId && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      required={!editingId}
                      className="w-full px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editingId ? "変更する場合のみ入力" : ""}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] mb-1">
                      {activeTab === "hospitals" ? "病院名" : "施設名"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d141b] mb-1">電話番号</label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#0d141b] mb-1">住所</label>
                    <input
                      type="text"
                      name="address"
                      className="w-full px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                  {activeTab === "facilities" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#0d141b] mb-1">
                          病床数 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="bed_capacity"
                          required
                          min="0"
                          className="w-full px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm"
                          value={formData.bed_capacity}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#0d141b] mb-1">受け入れ条件</label>
                        <textarea
                          name="acceptance_conditions"
                          rows={3}
                          className="w-full px-4 py-2.5 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm resize-none"
                          value={formData.acceptance_conditions}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#2b8cee] text-white rounded-xl font-bold text-sm hover:bg-[#2b8cee]/90 transition-colors"
                  >
                    {editingId ? "更新" : "作成"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 border border-[#cfdbe7] text-[#4c739a] rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-10 w-10 text-[#2b8cee]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : currentList.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#cfdbe7] p-12 text-center">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-[#4c739a] mb-4">
                {activeTab === "hospitals" ? "病院アカウントがありません" : "施設アカウントがありません"}
              </p>
              <button
                onClick={handleCreate}
                className="px-6 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
              >
                {activeTab === "hospitals" ? "病院を追加" : "施設を追加"}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentList.map((item) => (
                <AccountCard
                  key={item.id}
                  item={item}
                  type={activeTab}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
