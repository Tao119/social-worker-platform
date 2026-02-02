"use client";

import { useState, useEffect, useRef, ChangeEvent, DragEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { facilityAPI } from "@/lib/api";
import PageLayout, { PageLoading, Card, Button, Alert } from "@/components/PageLayout";
import DraggablePhotoGallery, { Photo } from "@/components/DraggablePhotoGallery";
import type { Facility } from "@/lib/types";

// Extended Facility type with additional fields used in the profile form
interface FacilityWithExtras extends Facility {
  facility_type?: string;
  care_areas?: string[];
  acceptance_conditions_json?: Record<string, boolean>;
  photos?: FacilityPhoto[];
  monthly_fee_private?: number;
}

type FacilityPhoto = Photo;

interface CareAreaConfig {
  id: string;
  label: string;
}

interface AcceptanceConditionConfig {
  id: string;
  label: string;
  description: string;
}

interface FormData {
  name: string;
  address: string;
  phone: string;
  facility_type: string;
  bed_capacity: string;
  available_beds: string;
  latitude: string;
  longitude: string;
  monthly_fee_shared: string;
  monthly_fee_private: string;
  medicine_cost: string;
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const CARE_AREAS: CareAreaConfig[] = [
  { id: "postop", label: "術後ケア" },
  { id: "orthopedics", label: "整形外科" },
  { id: "cardiac_rehab", label: "心臓リハビリ" },
  { id: "pressure_ulcer", label: "褥瘡ケア" },
  { id: "dementia", label: "認知症ケア" },
  { id: "respiratory", label: "呼吸器ケア" },
  { id: "stroke", label: "脳卒中リハビリ" },
  { id: "palliative", label: "緩和ケア" },
];

const ACCEPTANCE_CONDITIONS: AcceptanceConditionConfig[] = [
  { id: "ventilator", label: "人工呼吸器", description: "継続的な機械換気管理の対応" },
  { id: "iv_antibiotics", label: "点滴・IV抗生剤", description: "院内調剤およびPICC管理" },
  { id: "tube_feeding", label: "経管栄養 (胃瘻/鼻腔)", description: "栄養管理サービスの提供" },
  { id: "tracheostomy", label: "気管切開管理", description: "オンコール体制の呼吸器担当者" },
  { id: "dialysis", label: "透析", description: "人工透析を必要とする患者の対応" },
  { id: "oxygen", label: "在宅酸素療法", description: "酸素療法の継続管理" },
];

const FACILITY_TYPES: string[] = [
  "介護老人保健施設",
  "特別養護老人ホーム",
  "療養病床",
  "有料老人ホーム",
  "グループホーム",
  "サービス付き高齢者向け住宅",
];

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
      />
      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2b8cee]"></div>
    </label>
  );
}

export default function FacilityProfilePage() {
  const { isFacility, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [facility, setFacility] = useState<FacilityWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    phone: "",
    facility_type: "介護老人保健施設",
    bed_capacity: "",
    available_beds: "",
    latitude: "",
    longitude: "",
    monthly_fee_shared: "",
    monthly_fee_private: "",
    medicine_cost: "",
  });

  const [careAreas, setCareAreas] = useState<Record<string, boolean>>({});
  const [acceptanceConditions, setAcceptanceConditions] = useState<Record<string, boolean>>({});
  const [photos, setPhotos] = useState<FacilityPhoto[]>([]);

  useEffect(() => {
    if (!isFacility && !authLoading) {
      router.push("/dashboard");
      return;
    }
    if (isFacility) {
      loadFacility();
    }
  }, [isFacility, authLoading, router]);

  const loadFacility = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await facilityAPI.getMy();
      const data = response.data as FacilityWithExtras;
      setFacility(data);
      setFormData({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        facility_type: data.facility_type || "介護老人保健施設",
        bed_capacity: data.bed_capacity?.toString() || "",
        available_beds: data.available_beds?.toString() || "",
        latitude: data.latitude?.toString() || "",
        longitude: data.longitude?.toString() || "",
        monthly_fee_shared: data.monthly_fee?.toString() || "",
        monthly_fee_private: data.monthly_fee_private?.toString() || "",
        medicine_cost: data.medicine_cost?.toString() || "",
      });

      if (data.care_areas) {
        const areas: Record<string, boolean> = {};
        data.care_areas.forEach((area: string) => {
          areas[area] = true;
        });
        setCareAreas(areas);
      }

      if (data.acceptance_conditions_json) {
        setAcceptanceConditions(data.acceptance_conditions_json);
      }

      // Map images from API to photos format
      if (data.images && data.images.length > 0) {
        const mappedPhotos: FacilityPhoto[] = data.images.map((img) => ({
          id: img.id,
          url: img.image_url,
          alt: img.caption || img.image_type || "施設写真",
        }));
        setPhotos(mappedPhotos);
      } else if (data.photos) {
        setPhotos(data.photos);
      }
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      if (error.response?.status !== 404) {
        setError(error.response?.data?.error || "施設情報の読み込みに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const selectedCareAreas = Object.entries(careAreas)
        .filter(([, checked]) => checked)
        .map(([id]) => id);

      const submitData = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        facility_type: formData.facility_type,
        bed_capacity: parseInt(formData.bed_capacity) || 0,
        available_beds: parseInt(formData.available_beds) || 0,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        monthly_fee: formData.monthly_fee_shared ? parseInt(formData.monthly_fee_shared) : undefined,
        monthly_fee_private: formData.monthly_fee_private ? parseInt(formData.monthly_fee_private) : undefined,
        medicine_cost: formData.medicine_cost ? parseInt(formData.medicine_cost) : undefined,
        care_areas: selectedCareAreas,
        acceptance_conditions_json: acceptanceConditions,
      };

      if (facility) {
        await facilityAPI.update(facility.id, submitData);

        // Save images separately - only include images with valid URLs (not blob URLs)
        const imageInputs = photos
          .filter((photo) => photo.url && !photo.url.startsWith("blob:"))
          .map((photo) => ({
            image_url: photo.url,
            image_type: "exterior",
            caption: photo.alt || undefined,
          }));

        // Always update images (even if empty, to allow clearing all images)
        await facilityAPI.updateImages(facility.id, imageInputs);

        setSuccess("施設情報を更新しました");
      } else {
        await facilityAPI.create(submitData);
        setSuccess("施設情報を登録しました");
      }
      await loadFacility();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (facility) {
      loadFacility();
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter((file) =>
      ["image/png", "image/jpeg", "image/webp"].includes(file.type)
    );
    const newPhotos: FacilityPhoto[] = imageFiles.map((file) => ({
      id: Date.now() + Math.random(),
      url: URL.createObjectURL(file),
      file,
      alt: file.name,
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handlePhotosChange = (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
  };

  if (!isFacility) {
    return null;
  }

  if (loading) {
    return <PageLoading activeItem="profile" />;
  }

  return (
    <PageLayout
      activeItem="profile"
      title="施設プロフィール設定"
      description="紹介元との正確なマッチングのために、施設情報を最新の状態に保ってください"
      headerActions={
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => {}}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            プレビュー表示
          </Button>
          <Button variant="primary" onClick={() => handleSubmit()} loading={saving}>
            {saving ? "保存中..." : "変更を保存"}
          </Button>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Alerts */}
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {/* Section Header */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-[#0d141b]">基本情報</h3>
        </div>

          {/* Basic Info Section */}
          <section className="bg-white rounded-xl border border-[#e7edf3] overflow-hidden shadow-sm">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[#0d141b] text-sm font-bold">施設名</label>
                <input
                  type="text"
                  className="w-full rounded-lg border-[#cfdbe7] border p-3 text-sm focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                  value={formData.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="施設名を入力"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#0d141b] text-sm font-bold">電話番号</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border-[#cfdbe7] border p-3 text-sm focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                  value={formData.phone}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="03-1234-5678"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-[#0d141b] text-sm font-bold">住所</label>
                <div className="relative">
                  <svg className="w-5 h-5 absolute left-3 top-3 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="text"
                    className="w-full pl-10 rounded-lg border-[#cfdbe7] border p-3 text-sm focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                    value={formData.address}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="東京都港区南青山1-2-3"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#0d141b] text-sm font-bold">施設種別</label>
                <select
                  className="w-full rounded-lg border-[#cfdbe7] border p-3 text-sm focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                  value={formData.facility_type}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, facility_type: e.target.value })}
                >
                  {FACILITY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[#0d141b] text-sm font-bold">総定員数</label>
                <input
                  type="number"
                  className="w-full rounded-lg border-[#cfdbe7] border p-3 text-sm focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                  value={formData.bed_capacity}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, bed_capacity: e.target.value })}
                  placeholder="124"
                />
              </div>
            </div>
          </section>

          {/* Care Areas Section */}
          <div>
            <h2 className="text-xl font-bold text-[#0d141b] mb-1">重点診療領域・対応分野</h2>
            <p className="text-sm text-[#4c739a] mb-4">
              施設の主な対応可能なケア領域を選択してください。
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {CARE_AREAS.map((area) => (
                <label
                  key={area.id}
                  className={`flex items-center gap-3 p-3 bg-white border rounded-lg cursor-pointer transition-all ${
                    careAreas[area.id]
                      ? "border-[#2b8cee] bg-[#2b8cee]/5"
                      : "border-[#e7edf3] hover:border-[#2b8cee]"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="rounded border-[#cfdbe7] text-[#2b8cee] focus:ring-[#2b8cee]"
                    checked={careAreas[area.id] || false}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCareAreas({ ...careAreas, [area.id]: e.target.checked })
                    }
                  />
                  <span className="text-sm font-medium">{area.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Acceptance Conditions Section */}
          <section className="bg-white rounded-xl border border-[#e7edf3] p-6">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-xl font-bold text-[#0d141b]">受け入れ条件設定</h2>
              <svg className="w-5 h-5 text-[#4c739a] cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {ACCEPTANCE_CONDITIONS.map((condition) => (
                <div
                  key={condition.id}
                  className="flex items-center justify-between py-2 border-b border-slate-50"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{condition.label}</span>
                    <span className="text-xs text-[#4c739a]">{condition.description}</span>
                  </div>
                  <Toggle
                    checked={acceptanceConditions[condition.id] || false}
                    onChange={(checked: boolean) =>
                      setAcceptanceConditions({
                        ...acceptanceConditions,
                        [condition.id]: checked,
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Fee Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-[#e7edf3] p-6">
              <h2 className="text-lg font-bold mb-4">基本月額費用</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#4c739a] uppercase">
                    多床室（相部屋）
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-[#4c739a]">¥</span>
                    <input
                      type="text"
                      className="w-full pl-8 rounded-lg border-[#cfdbe7] border p-3 text-sm font-bold focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                      value={formData.monthly_fee_shared}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, monthly_fee_shared: e.target.value })
                      }
                      placeholder="185,000"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#4c739a] uppercase">個室</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-[#4c739a]">¥</span>
                    <input
                      type="text"
                      className="w-full pl-8 rounded-lg border-[#cfdbe7] border p-3 text-sm font-bold focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                      value={formData.monthly_fee_private}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, monthly_fee_private: e.target.value })
                      }
                      placeholder="260,000"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#e7edf3] p-6">
              <h2 className="text-lg font-bold mb-4">推定薬剤管理費</h2>
              <p className="text-sm text-[#4c739a] mb-4">
                入所者1人あたりの平均的な月額調剤・薬剤管理コスト。
              </p>
              <div className="relative">
                <span className="absolute left-3 top-3 text-[#4c739a]">¥</span>
                <input
                  type="text"
                  className="w-full pl-8 rounded-lg border-[#cfdbe7] border p-3 text-sm font-bold focus:ring-[#2b8cee] focus:border-[#2b8cee]"
                  value={formData.medicine_cost}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, medicine_cost: e.target.value })}
                  placeholder="15,000"
                />
              </div>
              <div className="mt-4 p-3 bg-[#2b8cee]/5 rounded-lg">
                <p className="text-[11px] text-[#4c739a]">
                  ※注：薬剤費は概算であり、個別の処方内容により変動します。
                </p>
              </div>
            </div>
          </div>

          {/* Photo Gallery Section */}
          <section className="bg-white rounded-xl border border-[#e7edf3] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">施設写真ギャラリー</h2>
              <span className="text-xs text-[#4c739a]">ドラッグで並び替え可能</span>
            </div>
            <div className="mb-6">
              <DraggablePhotoGallery
                photos={photos}
                onPhotosChange={handlePhotosChange}
                onAddClick={() => fileInputRef.current?.click()}
              />
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center text-center transition-colors ${
                isDragging
                  ? "border-[#2b8cee] bg-[#2b8cee]/10"
                  : "border-[#2b8cee]/30 bg-[#2b8cee]/5"
              }`}
            >
              <div className="size-12 rounded-full bg-[#2b8cee]/10 flex items-center justify-center text-[#2b8cee] mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-bold">ここに写真をドラッグ＆ドロップ</p>
              <p className="text-xs text-[#4c739a] mt-1">
                PNG, JPG または WEBP（1枚あたり最大10MB）
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 border border-[#2b8cee] text-[#2b8cee] text-xs font-bold rounded-lg hover:bg-[#2b8cee] hover:text-white transition-all"
              >
                ファイルを選択
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </section>
        {/* Footer Buttons */}
        <Card className="p-6">
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={handleCancel}>
              変更を破棄
            </Button>
            <Button variant="primary" onClick={() => handleSubmit()} loading={saving}>
              {saving ? "保存中..." : "プロフィールを保存"}
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
