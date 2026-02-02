"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { facilityAPI } from "@/lib/api";
import PageLayout, { PageLoading, PageError, Breadcrumb, Card, Button } from "@/components/PageLayout";
import type { Facility } from "@/lib/types";

// Extended Facility type with additional fields used in the detail view
interface FacilityWithExtras extends Facility {
  facility_type?: string;
  acceptance_conditions_json?: Record<string, boolean>;
}

interface AcceptanceConditionConfig {
  label: string;
  description: string;
}

const ACCEPTANCE_CONDITIONS_MAP: Record<string, AcceptanceConditionConfig> = {
  ventilator: { label: "人工呼吸器", description: "24時間呼吸療法士が常駐" },
  iv_antibiotics: { label: "点滴・IV療法", description: "中心静脈・末梢静脈対応可能" },
  tube_feeding: { label: "経管栄養", description: "胃瘻・鼻腔管理対応可能" },
  tracheostomy: { label: "気管切開管理", description: "気管切開患者の受け入れ可能" },
  dialysis: { label: "透析", description: "人工透析患者の受け入れ対応" },
  oxygen: { label: "在宅酸素療法", description: "酸素療法の継続管理可能" },
  pressure_ulcer: { label: "褥瘡・創傷ケア", description: "ステージI-IV、陰圧閉鎖療法対応" },
  dementia: { label: "認知症・メモリーケア", description: "認知症専用フロアあり" },
};

interface BedCardProps {
  title: string;
  value: number | string;
  color?: string;
  subtitle: string;
  hasIcon?: boolean;
}

interface AcceptanceConditionItemProps {
  condition: AcceptanceConditionConfig;
  accepted: boolean;
}

function BedCard({ title, value, color, subtitle, hasIcon }: BedCardProps) {
  return (
    <Card className="shadow-sm">
      <p className="text-sm font-bold text-[#4c739a] mb-1">{title}</p>
      <p className={`text-3xl font-black ${color || "text-[#0d141b]"}`}>{value}</p>
      <div className={`flex items-center gap-1 ${color} mt-2`}>
        {hasIcon && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        <span className="text-xs font-bold">{subtitle}</span>
      </div>
    </Card>
  );
}

function AcceptanceConditionItem({ condition, accepted }: AcceptanceConditionItemProps) {
  return (
    <div className={`flex items-start gap-3 ${!accepted ? "text-[#4c739a] opacity-60" : ""}`}>
      {accepted ? (
        <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5 text-[#4c739a] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <div>
        <p className="font-bold text-sm">{condition.label}</p>
        <p className="text-sm text-[#4c739a]">{condition.description}</p>
      </div>
    </div>
  );
}

export default function FacilityDetailPage() {
  const { isHospital, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [facility, setFacility] = useState<FacilityWithExtras | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isHospital && !authLoading) {
      router.push("/dashboard");
      return;
    }
    if (isHospital) {
      loadFacility();
    }
  }, [isHospital, authLoading, router, params.id]);

  const loadFacility = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await facilityAPI.getById(params.id as string);
      setFacility(response.data as FacilityWithExtras);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "施設情報の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  if (!isHospital) {
    return null;
  }

  if (authLoading || loading) {
    return <PageLoading activeItem="facilities" />;
  }

  if (error) {
    return (
      <PageError
        activeItem="facilities"
        title="エラーが発生しました"
        message={error}
        onRetry={loadFacility}
      />
    );
  }

  const acceptanceConditions: Record<string, boolean> = facility?.acceptance_conditions_json || {};
  const hasAvailableBeds = (facility?.available_beds ?? 0) > 0;

  return (
    <PageLayout activeItem="facilities" noPadding>
      <div className="px-8 py-6 max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "ホーム", href: "/dashboard" },
            { label: "施設検索", href: "/facilities" },
            { label: facility?.name || "施設詳細" },
          ]}
        />

        {/* Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {hasAvailableBeds && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                  新規受入可能
                </span>
              )}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                hasAvailableBeds
                  ? "bg-blue-100 text-[#2b8cee]"
                  : "bg-slate-100 text-[#4c739a]"
              }`}>
                {hasAvailableBeds ? "空床あり" : "満床"}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-[#4c739a]">
                {facility?.facility_type || "介護施設"}
              </span>
            </div>
            <h1 className="text-3xl font-black text-[#0d141b] mb-2">{facility?.name}</h1>
            <div className="flex items-center gap-2 text-[#4c739a]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-base">{facility?.address || "住所未登録"}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              共有
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Photo Gallery */}
            <div className="grid grid-cols-4 grid-rows-2 gap-3 h-[350px]">
              {facility?.images && facility.images.length > 0 ? (
                <>
                  <div className="col-span-2 row-span-2 relative overflow-hidden rounded-xl border border-[#cfdbe7]">
                    <img
                      src={facility.images[0]?.image_url}
                      alt={facility.images[0]?.caption || facility.name}
                      className="w-full h-full object-cover"
                    />
                    {facility.images[0]?.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-white text-sm font-bold">{facility.images[0].caption}</p>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 row-span-1 relative overflow-hidden rounded-xl border border-[#cfdbe7]">
                    {facility.images[1] ? (
                      <img
                        src={facility.images[1].image_url}
                        alt={facility.images[1].caption || "施設画像"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 row-span-1 relative overflow-hidden rounded-xl border border-[#cfdbe7]">
                    {facility.images[2] ? (
                      <img
                        src={facility.images[2].image_url}
                        alt={facility.images[2].caption || "施設画像"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 row-span-1 relative overflow-hidden rounded-xl border border-[#cfdbe7]">
                    {facility.images[3] ? (
                      <img
                        src={facility.images[3].image_url}
                        alt={facility.images[3].caption || "施設画像"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2 row-span-2 relative overflow-hidden rounded-xl border border-[#cfdbe7] bg-slate-200 flex items-center justify-center">
                    <svg className="w-16 h-16 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="col-span-2 row-span-1 relative overflow-hidden rounded-xl border border-[#cfdbe7] bg-slate-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="col-span-1 row-span-1 relative overflow-hidden rounded-xl border border-[#cfdbe7] bg-slate-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="col-span-1 row-span-1 relative overflow-hidden rounded-xl border border-[#cfdbe7] bg-slate-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </>
              )}
            </div>

            {/* Description Section */}
            {facility?.description && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-[#0d141b]">施設概要</h3>
                </div>
                <Card>
                  <p className="text-sm text-[#4c739a] leading-relaxed">{facility.description}</p>
                </Card>
              </section>
            )}

            {/* Bed Count Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <h3 className="text-xl font-bold text-[#0d141b]">病床数</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BedCard
                  title="総病床数"
                  value={facility?.bed_capacity || 0}
                  subtitle="認可病床"
                />
                <BedCard
                  title="現在の空床数"
                  value={facility?.available_beds || 0}
                  color={hasAvailableBeds ? "text-green-600" : "text-[#4c739a]"}
                  subtitle={hasAvailableBeds ? "即日受入調整可能" : "現在満床"}
                  hasIcon={hasAvailableBeds}
                />
                <BedCard
                  title="待機者数"
                  value="0"
                  color="text-[#4c739a]"
                  subtitle="平均回答時間：24時間以内"
                />
              </div>
            </section>

            {/* Acceptance Conditions Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-[#0d141b]">受け入れ条件</h3>
              </div>
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-10">
                  {Object.entries(ACCEPTANCE_CONDITIONS_MAP).map(([key, condition]) => (
                    <AcceptanceConditionItem
                      key={key}
                      condition={condition}
                      accepted={acceptanceConditions[key] || false}
                    />
                  ))}
                </div>
              </Card>
            </section>

            {/* Pricing Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-[#0d141b]">料金詳細</h3>
              </div>
              <Card padding="p-0" className="overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a]">
                        部屋タイプ
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a]">
                        月額料金 (概算)
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#4c739a]">
                        空き状況
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-6 py-4 font-bold text-sm text-[#0d141b]">多床室（相部屋）</td>
                      <td className="px-6 py-4 font-bold text-[#2b8cee]">
                        {facility?.monthly_fee
                          ? `¥${facility.monthly_fee.toLocaleString()} 〜`
                          : "お問い合わせください"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <span className={hasAvailableBeds ? "text-green-600" : "text-[#4c739a]"}>
                          {hasAvailableBeds ? `${facility?.available_beds}床 空きあり` : "満床"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="p-4 bg-slate-50 border-t border-[#cfdbe7]">
                  <p className="text-xs text-[#4c739a]">
                    表示されている料金は基本料金です。介護保険負担割合や各種加算、私費項目によって変動します。
                    {facility?.medicine_cost && (
                      <span className="block mt-1">
                        推定薬剤管理費：約¥{facility.medicine_cost.toLocaleString()}/月
                      </span>
                    )}
                  </p>
                </div>
              </Card>
            </section>

            {/* Location Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <h3 className="text-xl font-bold text-[#0d141b]">所在地・アクセス</h3>
              </div>
              <Card className="h-48 flex items-center justify-center bg-slate-100">
                <div className="text-center">
                  <div className="bg-[#2b8cee] p-2 rounded-full inline-block mb-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#4c739a]">{facility?.address || "住所未登録"}</p>
                </div>
              </Card>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 space-y-6">
              {/* Request Card */}
              <Card className="shadow-lg">
                <div className="mb-6">
                  <h4 className="text-lg font-bold text-[#0d141b] mb-1">患者転院リクエスト</h4>
                  <p className="text-sm text-[#4c739a]">
                    推定回答時間：<span className="font-bold text-[#0d141b]">2時間以内</span>
                  </p>
                </div>
                {hasAvailableBeds && (
                  <div className="mb-6 p-4 rounded-xl bg-[#2b8cee]/5 border border-[#2b8cee]/10">
                    <div className="flex items-center gap-3 mb-2">
                      <svg className="w-5 h-5 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold text-[#2b8cee]">迅速受入対象施設</span>
                    </div>
                    <p className="text-xs text-[#4c739a]">
                      この施設は空床があり、迅速な転院調整が可能です。
                    </p>
                  </div>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mb-3 shadow-lg shadow-[#2b8cee]/25"
                  onClick={() => router.push(`/requests/create?facilityId=${facility?.id}`)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  転院リクエストを作成
                </Button>
                <Button variant="secondary" size="lg" className="w-full">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  施設に問い合わせる
                </Button>
              </Card>

              {/* Contact Card */}
              <Card>
                <h4 className="text-xs font-bold text-[#4c739a] uppercase tracking-wider mb-4">
                  入所相談窓口
                </h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-[#0d141b]">{facility?.contact_name || "相談員"}</p>
                    <p className="text-xs text-[#4c739a]">受付時間：{facility?.contact_hours || "9:00 - 17:00"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#4c739a]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{facility?.phone || "電話番号未登録"}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
