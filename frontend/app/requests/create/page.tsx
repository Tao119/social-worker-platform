"use client";

import { useState, useEffect, useCallback, Suspense, useRef, ChangeEvent, FormEvent, DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { facilityAPI, requestAPI } from "@/lib/api";
import PageLayout, { PageLoading, Breadcrumb, Card, Button, Alert } from "@/components/PageLayout";
import type { Facility, PlacementRequestCreateData } from "@/lib/types";
import { AxiosError } from "axios";

interface FormData {
  facility_id: string;
  patient_age: string;
  patient_gender: string;
  patient_id: string;
  medical_condition: string;
}

function CreateRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isHospital, loading: authLoading } = useAuth();
  const facilityId = searchParams.get("facilityId");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    facility_id: facilityId || "",
    patient_age: "",
    patient_gender: "",
    patient_id: "",
    medical_condition: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fetchFacility = useCallback(async (): Promise<void> => {
    try {
      const response = await facilityAPI.getById(facilityId as string);
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const requestData: PlacementRequestCreateData & { patient_gender?: string; medical_condition?: string; patient_id?: string } = {
        facility_id: parseInt(formData.facility_id),
        patient_name: formData.patient_id || "",
        patient_age: parseInt(formData.patient_age),
        patient_gender: formData.patient_gender,
        medical_condition: formData.medical_condition,
      };
      await requestAPI.create(requestData as PlacementRequestCreateData);
      router.push("/requests");
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "受け入れリクエストの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (): void => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (newFiles: File[]): void => {
    const validFiles = newFiles.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number): void => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (!isHospital) {
    return null;
  }

  if (authLoading) {
    return <PageLoading activeItem="requests" />;
  }

  return (
    <PageLayout
      activeItem="requests"
      title="リクエスト作成"
      description="患者情報を入力して転院リクエストを作成"
    >
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/dashboard" },
            { label: "リクエスト一覧", href: "/requests" },
            { label: "新規作成" },
          ]}
        />

        {/* Main Form Card */}
        <Card className="mb-6">
          {/* Facility Info */}
          {facility && (
            <div className="mb-6 p-4 bg-[#2b8cee]/5 rounded-xl border border-[#2b8cee]/20">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#2b8cee]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#2b8cee]">送信先施設</p>
                  <p className="text-base font-bold text-[#0d141b]">{facility.name}</p>
                  <p className="text-sm text-[#4c739a]">{facility.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6">
              <Alert type="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Patient Basic Info Section */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[#cfdbe7] pb-3">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-lg font-bold text-[#0d141b]">患者基本情報</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <label className="flex flex-col gap-2">
                    <span className="text-[#0d141b] text-sm font-medium">
                      年齢 <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="number"
                      name="patient_age"
                      value={formData.patient_age}
                      onChange={handleChange}
                      required
                      min="0"
                      max="150"
                      className="w-full rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] h-11 px-4 focus:ring-2 focus:ring-[#2b8cee] focus:border-[#2b8cee] transition-all"
                      placeholder="例: 65"
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[#0d141b] text-sm font-medium">
                      性別 <span className="text-red-500">*</span>
                    </span>
                    <select
                      name="patient_gender"
                      value={formData.patient_gender}
                      onChange={handleChange}
                      required
                      className="w-full rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] h-11 px-4 focus:ring-2 focus:ring-[#2b8cee] focus:border-[#2b8cee] transition-all"
                    >
                      <option value="">選択してください</option>
                      <option value="男性">男性</option>
                      <option value="女性">女性</option>
                      <option value="その他">その他</option>
                      <option value="回答しない">回答しない</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 md:col-span-2">
                    <span className="text-[#0d141b] text-sm font-medium">
                      患者ID / 診察券番号
                    </span>
                    <input
                      type="text"
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] h-11 px-4 focus:ring-2 focus:ring-[#2b8cee] focus:border-[#2b8cee] transition-all"
                      placeholder="IDを入力してください"
                    />
                  </label>
                </div>
              </section>

              {/* Clinical Background Section */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[#cfdbe7] pb-3">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-[#0d141b]">臨床的背景</h3>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-[#0d141b] text-sm font-medium">
                    病状・診断名 <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    name="medical_condition"
                    value={formData.medical_condition}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] p-4 focus:ring-2 focus:ring-[#2b8cee] focus:border-[#2b8cee] transition-all resize-none"
                    placeholder="現在の病状、診断名、ADL、必要なケアレベルなどを入力してください..."
                  />
                </label>
              </section>

              {/* Document Upload Section */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[#cfdbe7] pb-3">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <h3 className="text-lg font-bold text-[#0d141b]">書類アップロード</h3>
                </div>

                {/* Uploaded Files List */}
                {files.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-[#cfdbe7]"
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-[#0d141b]">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 text-[#4c739a] hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex justify-center rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-colors ${
                    isDragging
                      ? "border-[#2b8cee] bg-[#2b8cee]/5"
                      : "border-[#cfdbe7] hover:border-[#2b8cee]"
                  }`}
                >
                  <div className="text-center">
                    <svg className="w-12 h-12 text-[#4c739a] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-[#0d141b]">
                      <span className="font-bold text-[#2b8cee]">診療情報提供書をアップロード</span>
                      {" "}またはドラッグ＆ドロップ
                    </p>
                    <p className="text-xs text-[#4c739a] mt-1">
                      PDF, Word形式 (最大10MB)
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </section>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#cfdbe7]">
              <Button
                variant="ghost"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
              >
                リクエストを送信
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Info Box */}
        <div className="flex items-start gap-4 p-5 bg-[#2b8cee]/5 rounded-xl border border-[#2b8cee]/10">
          <svg className="w-5 h-5 text-[#2b8cee] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-bold text-[#2b8cee]">お困りですか？</p>
            <p className="text-sm text-[#4c739a] mt-1">
              適切な施設が見つからない場合は、調整専門スタッフが24時間体制でサポートいたします。
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense fallback={<PageLoading activeItem="requests" />}>
      <CreateRequestForm />
    </Suspense>
  );
}
