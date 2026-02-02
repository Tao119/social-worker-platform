"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { requestAPI } from "@/lib/api";
import PageLayout, { PageLoading, PageError, Breadcrumb, Card, Button, Alert } from "@/components/PageLayout";
import type { PlacementRequest, PlacementRequestUpdateData } from "@/lib/types";
import { AxiosError } from "axios";

interface FormData {
  patient_age: string;
  patient_gender: string;
  medical_condition: string;
}

// Extended type for the API response which includes additional fields not in the base type
interface ExtendedPlacementRequest extends PlacementRequest {
  patient_gender?: string;
  medical_condition?: string;
  facility_name?: string;
}

export default function EditRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const requestId = params.id as string;

  const [request, setRequest] = useState<ExtendedPlacementRequest | null>(null);
  const [formData, setFormData] = useState<FormData>({
    patient_age: "",
    patient_gender: "",
    medical_condition: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!authLoading && user) {
      fetchRequest();
    }
  }, [authLoading, user, requestId]);

  const fetchRequest = async (): Promise<void> => {
    try {
      const response = await requestAPI.getById(requestId);
      const req = response.data as ExtendedPlacementRequest;
      setRequest(req);
      setFormData({
        patient_age: req.patient_age?.toString() || "",
        patient_gender: req.patient_gender || "",
        medical_condition: req.medical_condition || "",
      });
      setError("");
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "リクエストの取得に失敗しました");
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const updateData: PlacementRequestUpdateData & { patient_gender?: string; medical_condition?: string } = {
        patient_age: parseInt(formData.patient_age),
        patient_gender: formData.patient_gender,
        medical_condition: formData.medical_condition,
      };
      await requestAPI.update(requestId, updateData as PlacementRequestUpdateData);
      router.push("/requests");
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return <PageLoading activeItem="requests" />;
  }

  if (error && !request) {
    return (
      <PageError
        activeItem="requests"
        title="エラーが発生しました"
        message={error}
        onRetry={fetchRequest}
      />
    );
  }

  return (
    <PageLayout
      activeItem="requests"
      title="リクエストを編集"
      description="転院リクエストの内容を更新"
    >
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/dashboard" },
            { label: "リクエスト一覧", href: "/requests" },
            { label: "編集" },
          ]}
        />

        {/* Main Form Card */}
        <Card className="mb-6">
          {/* Request Info */}
          {request && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-[#cfdbe7]">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-[#2b8cee]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#4c739a]">送信先施設</p>
                  <p className="text-base font-bold text-[#0d141b]">{request.facility_name}</p>
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
            <div className="space-y-6">
              {/* Patient Basic Info */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[#cfdbe7] pb-3">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-lg font-bold text-[#0d141b]">患者情報</h3>
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
                </div>
              </section>

              {/* Medical Condition */}
              <section>
                <div className="flex items-center gap-2 mb-4 border-b border-[#cfdbe7] pb-3">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-bold text-[#0d141b]">病状・診断名</h3>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-[#0d141b] text-sm font-medium">
                    詳細 <span className="text-red-500">*</span>
                  </span>
                  <textarea
                    name="medical_condition"
                    value={formData.medical_condition}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full rounded-lg border border-[#cfdbe7] bg-white text-[#0d141b] p-4 focus:ring-2 focus:ring-[#2b8cee] focus:border-[#2b8cee] transition-all resize-none"
                    placeholder="患者の医療状態や病状を詳しく記入してください"
                  />
                </label>
              </section>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#cfdbe7]">
              <Button
                variant="ghost"
                onClick={() => router.push("/requests")}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitting}
              >
                更新する
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageLayout>
  );
}
