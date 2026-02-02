"use client";

import { useState, useEffect, useRef, useCallback, ReactNode, FormEvent, KeyboardEvent, ChangeEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { facilityAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import type { Facility, FacilitySearchParams } from "@/lib/types";

// Extended Facility type for search results that may include additional fields
interface FacilityWithExtras extends Facility {
  facility_type?: string;
  care_areas?: string[];
  acceptance_conditions_json?: Record<string, boolean>;
  photos?: FacilityPhoto[];
  monthly_fee_private?: number;
}

interface FacilityPhoto {
  id: number | string;
  url: string;
  alt: string;
  file?: File;
}

interface FacilityImageType {
  id: number;
  facility_id: number;
  image_url: string;
  image_type: string;
  sort_order: number;
  caption?: string;
  created_at: string;
}

interface SearchParams {
  name: string;
  hasAvailableBeds: boolean;
  location: string;
  latitude: number | null;
  longitude: number | null;
  maxDistanceKm: string;
  minMonthlyFee: string;
  maxMonthlyFee: string;
  maxMedicineCost: string;
  sortBy: string;
  sortOrder: string;
  // Acceptance conditions
  ventilator: boolean;
  ivAntibiotics: boolean;
  tubeFeeding: boolean;
  tracheostomy: boolean;
  dialysis: boolean;
  oxygen: boolean;
  pressureUlcer: boolean;
  dementia: boolean;
}

interface FacilityCardProps {
  facility: FacilityWithExtras;
  onViewDetails: (id: number) => void;
}

interface FilterToggleProps {
  label: string;
  icon: ReactNode;
  active: boolean;
  onChange: () => void;
}

function FacilityCard({ facility, onViewDetails }: FacilityCardProps) {
  const hasAvailableBeds = facility.available_beds > 0;
  const firstImage = facility.images?.[0];

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-[#cfdbe7] hover:shadow-lg hover:border-[#2b8cee]/30 transition-all duration-300">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {firstImage ? (
          <img
            src={firstImage.image_url}
            alt={firstImage.caption || facility.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {hasAvailableBeds ? (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
              即入居可能
            </span>
          ) : (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
              満床
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-base font-bold text-[#0d141b] group-hover:text-[#2b8cee] transition-colors truncate">
              {facility.name}
            </h3>
            <p className="text-xs text-[#4c739a] flex items-center gap-1 mt-1">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">
                {facility.address || "住所未登録"}
                {facility.distance != null && ` • ${facility.distance.toFixed(1)}km`}
              </span>
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-[#4c739a] font-medium">月額目安</p>
            <p className="text-lg font-black text-[#2b8cee]">
              {facility.monthly_fee != null ? (
                <>¥{facility.monthly_fee.toLocaleString()}</>
              ) : (
                <span className="text-sm text-[#4c739a]">要相談</span>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-[#4c739a]">空き状況</p>
            <p className={`text-sm font-bold ${hasAvailableBeds ? "text-emerald-600" : "text-amber-600"}`}>
              {hasAvailableBeds ? `${facility.available_beds}床` : "満床"}
            </p>
          </div>
          <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-[#4c739a]">病床数</p>
            <p className="text-sm font-bold text-[#0d141b]">{facility.bed_capacity}床</p>
          </div>
          <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center">
            <p className="text-[10px] text-[#4c739a]">薬剤費</p>
            <p className="text-sm font-bold text-[#0d141b]">
              {facility.medicine_cost != null ? `¥${(facility.medicine_cost / 10000).toFixed(0)}万` : "-"}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onViewDetails(facility.id)}
          className="w-full py-2.5 bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          詳細を見る
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function FilterToggle({ label, icon, active, onChange }: FilterToggleProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
        active ? "bg-[#2b8cee]/5 border border-[#2b8cee]/20" : "hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={active ? "text-[#2b8cee]" : "text-[#4c739a]"}>{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? "bg-[#2b8cee]" : "bg-slate-300"}`}>
        <div className={`absolute top-1 size-3 bg-white rounded-full transition-all ${active ? "right-1" : "left-1"}`} />
      </div>
    </button>
  );
}

function FacilitiesPageContent() {
  const { isHospital, loading: authLoading } = useAuth();
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [facilities, setFacilities] = useState<FacilityWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useState<SearchParams>({
    name: "",
    hasAvailableBeds: false,
    location: "",
    latitude: null,
    longitude: null,
    maxDistanceKm: "",
    minMonthlyFee: "",
    maxMonthlyFee: "",
    maxMedicineCost: "",
    sortBy: "",
    sortOrder: "asc",
    ventilator: false,
    ivAntibiotics: false,
    tubeFeeding: false,
    tracheostomy: false,
    dialysis: false,
    oxygen: false,
    pressureUlcer: false,
    dementia: false,
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const hasRedirected = useRef(false);
  const hasInitialized = useRef(false);

  const loadFacilities = useCallback(async (params: FacilitySearchParams = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await facilityAPI.list(params);
      setFacilities((response.data || []) as FacilityWithExtras[]);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "施設の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  // URLパラメータから初期検索条件を読み込み
  useEffect(() => {
    if (!isHospital && !authLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/dashboard");
      return;
    }
    if (isHospital && !hasInitialized.current) {
      hasInitialized.current = true;

      // URLパラメータを取得
      const keyword = urlSearchParams.get("keyword") || "";
      const hasAvailableBeds = urlSearchParams.get("hasAvailableBeds") === "true";
      const maxMonthlyFee = urlSearchParams.get("maxMonthlyFee") || "";
      const maxMedicineCost = urlSearchParams.get("maxMedicineCost") || "";
      const maxDistanceKm = urlSearchParams.get("maxDistanceKm") || "";

      // 検索パラメータを更新
      const newSearchParams: SearchParams = {
        name: keyword,
        hasAvailableBeds,
        location: "",
        latitude: null,
        longitude: null,
        maxDistanceKm,
        minMonthlyFee: "",
        maxMonthlyFee,
        maxMedicineCost,
        sortBy: "",
        sortOrder: "asc",
        ventilator: false,
        ivAntibiotics: false,
        tubeFeeding: false,
        tracheostomy: false,
        dialysis: false,
        oxygen: false,
        pressureUlcer: false,
        dementia: false,
      };
      setSearchParams(newSearchParams);

      // フィルターが設定されていたらパネルを開く
      if (hasAvailableBeds || maxMonthlyFee || maxMedicineCost || maxDistanceKm) {
        setShowFilters(true);
      }

      // 常に現在位置を取得して距離を表示（距離フィルターの有無に関わらず）
      getCurrentLocationAndSearch(newSearchParams);
    }
  }, [isHospital, authLoading, router, urlSearchParams, loadFacilities]);

  const getCurrentLocationAndSearch = (params: SearchParams) => {
    if (!navigator.geolocation) {
      setLocationError("お使いのブラウザは位置情報に対応していません。距離フィルターを使用するには、位置情報対応のブラウザをお使いください。");
      // 位置情報なしで検索
      const searchParams: FacilitySearchParams = {};
      if (params.name) searchParams.name = params.name;
      if (params.hasAvailableBeds) searchParams.has_available_beds = true;
      if (params.maxMonthlyFee) searchParams.max_monthly_fee = parseInt(params.maxMonthlyFee);
      if (params.maxMedicineCost) searchParams.max_medicine_cost = parseInt(params.maxMedicineCost);
      loadFacilities(searchParams);
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const updatedParams = {
          ...params,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setSearchParams(updatedParams);
        setLocationLoading(false);

        // 位置情報を含めて検索（距離は常に表示、距離フィルターは設定時のみ適用）
        const searchParams: FacilitySearchParams = {};
        if (updatedParams.name) searchParams.name = updatedParams.name;
        if (updatedParams.hasAvailableBeds) searchParams.has_available_beds = true;
        if (updatedParams.maxMonthlyFee) searchParams.max_monthly_fee = parseInt(updatedParams.maxMonthlyFee);
        if (updatedParams.maxMedicineCost) searchParams.max_medicine_cost = parseInt(updatedParams.maxMedicineCost);
        // 常に位置情報を渡して距離を計算させる
        searchParams.latitude = position.coords.latitude;
        searchParams.longitude = position.coords.longitude;
        // 距離フィルターは明示的に設定されている場合のみ適用
        if (updatedParams.maxDistanceKm) {
          searchParams.max_distance_km = parseFloat(updatedParams.maxDistanceKm);
        }
        loadFacilities(searchParams);
      },
      (error: GeolocationPositionError) => {
        let errorMessage = "位置情報の取得に失敗しました。";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "位置情報の使用が許可されていません。ブラウザの設定から位置情報を許可してください。";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報を取得できませんでした。電波状況を確認してください。";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。再度お試しください。";
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);

        // 位置情報なしで検索
        const searchParams: FacilitySearchParams = {};
        if (params.name) searchParams.name = params.name;
        if (params.hasAvailableBeds) searchParams.has_available_beds = true;
        if (params.maxMonthlyFee) searchParams.max_monthly_fee = parseInt(params.maxMonthlyFee);
        if (params.maxMedicineCost) searchParams.max_medicine_cost = parseInt(params.maxMedicineCost);
        loadFacilities(searchParams);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = (e?: FormEvent<HTMLFormElement> | KeyboardEvent<HTMLInputElement>) => {
    if (e) e.preventDefault();
    const params: FacilitySearchParams = {};

    if (searchParams.name) params.name = searchParams.name;
    if (searchParams.hasAvailableBeds) params.has_available_beds = true;
    if (searchParams.location) params.address = searchParams.location;

    if (searchParams.latitude && searchParams.longitude) {
      params.latitude = searchParams.latitude;
      params.longitude = searchParams.longitude;
      if (searchParams.maxDistanceKm) {
        params.max_distance_km = parseFloat(searchParams.maxDistanceKm);
      }
    }

    if (searchParams.minMonthlyFee) params.min_monthly_fee = parseInt(searchParams.minMonthlyFee);
    if (searchParams.maxMonthlyFee) params.max_monthly_fee = parseInt(searchParams.maxMonthlyFee);
    if (searchParams.maxMedicineCost) params.max_medicine_cost = parseInt(searchParams.maxMedicineCost);

    if (searchParams.sortBy) {
      params.sort_by = searchParams.sortBy as FacilitySearchParams["sort_by"];
      params.sort_order = searchParams.sortOrder as FacilitySearchParams["sort_order"];
    }

    // Acceptance conditions
    if (searchParams.ventilator) params.ventilator = true;
    if (searchParams.ivAntibiotics) params.iv_antibiotics = true;
    if (searchParams.tubeFeeding) params.tube_feeding = true;
    if (searchParams.tracheostomy) params.tracheostomy = true;
    if (searchParams.dialysis) params.dialysis = true;
    if (searchParams.oxygen) params.oxygen = true;
    if (searchParams.pressureUlcer) params.pressure_ulcer = true;
    if (searchParams.dementia) params.dementia = true;

    loadFacilities(params);
  };

  const handleReset = () => {
    const resetParams: SearchParams = {
      name: "",
      hasAvailableBeds: false,
      location: "",
      latitude: null,
      longitude: null,
      maxDistanceKm: "",
      minMonthlyFee: "",
      maxMonthlyFee: "",
      maxMedicineCost: "",
      sortBy: "",
      sortOrder: "asc",
      ventilator: false,
      ivAntibiotics: false,
      tubeFeeding: false,
      tracheostomy: false,
      dialysis: false,
      oxygen: false,
      pressureUlcer: false,
      dementia: false,
    };
    setSearchParams(resetParams);
    setLocationError("");
    setShowAdvancedFilters(false);
    // 位置情報を再取得して距離を表示
    getCurrentLocationAndSearch(resetParams);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("お使いのブラウザは位置情報に対応していません。距離フィルターを使用するには、位置情報対応のブラウザをお使いください。");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setSearchParams((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setLocationLoading(false);
      },
      (error: GeolocationPositionError) => {
        let errorMessage = "位置情報の取得に失敗しました。";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "位置情報の使用が許可されていません。ブラウザの設定から位置情報を許可してください。";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報を取得できませんでした。電波状況を確認してください。";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。再度お試しください。";
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const viewDetails = (id: number) => {
    router.push(`/facilities/${id}`);
  };

  if (!isHospital) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="facilities" />
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

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem="facilities" />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#cfdbe7] px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-black text-[#0d141b] mb-2">施設を検索</h2>
            <p className="text-[#4c739a]">空き状況・条件から最適な施設を探せます</p>
          </div>
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center px-4 py-2.5 bg-white rounded-xl border border-[#cfdbe7]">
                <svg className="w-5 h-5 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchParams.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchParams({ ...searchParams, name: e.target.value })}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full ml-2 placeholder:text-[#4c739a]"
                  placeholder="施設名で検索..."
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                showFilters ? "bg-[#2b8cee] text-white" : "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              絞り込み
            </button>
            <button
              onClick={() => handleSearch()}
              className="px-6 py-2.5 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
            >
              検索
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-[#cfdbe7] p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#0d141b]">絞り込み条件</h3>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-[#2b8cee] hover:underline"
                >
                  リセット
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Distance Filter */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    現在地からの距離
                  </p>

                  {!searchParams.latitude ? (
                    <button
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-[#cfdbe7] rounded-lg text-sm font-medium text-[#4c739a] transition-colors flex items-center justify-center gap-2"
                    >
                      {locationLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          取得中...
                        </>
                      ) : (
                        "現在地を取得"
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-[#4c739a]">
                        <span>0km</span>
                        <span className="font-bold text-[#2b8cee]">{searchParams.maxDistanceKm}km</span>
                        <span>50km</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={searchParams.maxDistanceKm}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchParams({ ...searchParams, maxDistanceKm: e.target.value })}
                        className="w-full accent-[#2b8cee]"
                      />
                    </div>
                  )}
                  {locationError && <p className="text-xs text-red-500">{locationError}</p>}
                </div>

                {/* Monthly Fee Filter */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    月額料金
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="最小 (円)"
                      className="flex-1 min-w-0 px-3 py-2 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none"
                      value={searchParams.minMonthlyFee}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchParams({ ...searchParams, minMonthlyFee: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="最大 (円)"
                      className="flex-1 min-w-0 px-3 py-2 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none"
                      value={searchParams.maxMonthlyFee}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchParams({ ...searchParams, maxMonthlyFee: e.target.value })}
                    />
                  </div>
                </div>

                {/* Medicine Cost Filter */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    薬価（上限）
                  </p>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 min-w-0 px-3 py-2 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none"
                      value={searchParams.maxMedicineCost}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSearchParams({ ...searchParams, maxMedicineCost: e.target.value })}
                    >
                      <option value="">指定なし</option>
                      <option value="50000">〜5万円</option>
                      <option value="100000">〜10万円</option>
                      <option value="150000">〜15万円</option>
                      <option value="200000">〜20万円</option>
                    </select>
                  </div>
                </div>

                {/* Toggle Filters */}
                <div className="space-y-3">
                  <p className="text-sm font-bold text-[#0d141b] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#2b8cee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    条件
                  </p>
                  <FilterToggle
                    label="空き状況（即入居可）"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    }
                    active={searchParams.hasAvailableBeds}
                    onChange={() => setSearchParams({ ...searchParams, hasAvailableBeds: !searchParams.hasAvailableBeds })}
                  />
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="mt-6 pt-6 border-t border-[#cfdbe7]">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 text-sm font-bold text-[#4c739a] hover:text-[#2b8cee] transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showAdvancedFilters ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  高度な絞り込み（受け入れ条件）
                </button>

                {/* Acceptance Conditions Section */}
                {showAdvancedFilters && (
                  <div className="mt-4">
                    <p className="text-sm text-[#4c739a] mb-3">
                      対応可能な施設のみ表示されます
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.ventilator ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.ventilator}
                          onChange={() => setSearchParams({ ...searchParams, ventilator: !searchParams.ventilator })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">人工呼吸器</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.ivAntibiotics ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.ivAntibiotics}
                          onChange={() => setSearchParams({ ...searchParams, ivAntibiotics: !searchParams.ivAntibiotics })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">点滴抗生剤</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.tubeFeeding ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.tubeFeeding}
                          onChange={() => setSearchParams({ ...searchParams, tubeFeeding: !searchParams.tubeFeeding })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">経管栄養</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.tracheostomy ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.tracheostomy}
                          onChange={() => setSearchParams({ ...searchParams, tracheostomy: !searchParams.tracheostomy })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">気管切開</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.dialysis ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.dialysis}
                          onChange={() => setSearchParams({ ...searchParams, dialysis: !searchParams.dialysis })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">透析</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.oxygen ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.oxygen}
                          onChange={() => setSearchParams({ ...searchParams, oxygen: !searchParams.oxygen })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">酸素療法</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.pressureUlcer ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.pressureUlcer}
                          onChange={() => setSearchParams({ ...searchParams, pressureUlcer: !searchParams.pressureUlcer })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">褥瘡（床ずれ）</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${searchParams.dementia ? "bg-[#2b8cee]/10 border border-[#2b8cee]" : "bg-white border border-[#cfdbe7] hover:bg-slate-50"}`}>
                        <input
                          type="checkbox"
                          checked={searchParams.dementia}
                          onChange={() => setSearchParams({ ...searchParams, dementia: !searchParams.dementia })}
                          className="w-4 h-4 text-[#2b8cee] border-[#cfdbe7] rounded focus:ring-[#2b8cee]"
                        />
                        <span className="text-sm">認知症</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Header with Sort */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#4c739a]">
              {loading ? "検索中..." : `${facilities.length}件の施設が見つかりました`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#4c739a]">並び替え:</span>
              <select
                value={searchParams.sortBy ? `${searchParams.sortBy}_${searchParams.sortOrder}` : ""}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                  const value = e.target.value;
                  if (!value) {
                    setSearchParams((prev) => ({ ...prev, sortBy: "", sortOrder: "asc" }));
                  } else {
                    // Split from the last underscore to handle "available_beds_desc" correctly
                    const lastUnderscoreIndex = value.lastIndexOf("_");
                    const sortBy = value.substring(0, lastUnderscoreIndex);
                    const sortOrder = value.substring(lastUnderscoreIndex + 1);
                    setSearchParams((prev) => ({ ...prev, sortBy, sortOrder }));
                  }
                  // Auto-search when sort changes
                  setTimeout(() => {
                    const params: FacilitySearchParams = {};
                    if (searchParams.name) params.name = searchParams.name;
                    if (searchParams.hasAvailableBeds) params.has_available_beds = true;
                    if (searchParams.latitude && searchParams.longitude) {
                      params.latitude = searchParams.latitude;
                      params.longitude = searchParams.longitude;
                      if (searchParams.maxDistanceKm) {
                        params.max_distance_km = parseFloat(searchParams.maxDistanceKm);
                      }
                    }
                    if (searchParams.minMonthlyFee) params.min_monthly_fee = parseInt(searchParams.minMonthlyFee);
                    if (searchParams.maxMonthlyFee) params.max_monthly_fee = parseInt(searchParams.maxMonthlyFee);
                    if (searchParams.maxMedicineCost) params.max_medicine_cost = parseInt(searchParams.maxMedicineCost);
                    // Acceptance conditions
                    if (searchParams.ventilator) params.ventilator = true;
                    if (searchParams.ivAntibiotics) params.iv_antibiotics = true;
                    if (searchParams.tubeFeeding) params.tube_feeding = true;
                    if (searchParams.tracheostomy) params.tracheostomy = true;
                    if (searchParams.dialysis) params.dialysis = true;
                    if (searchParams.oxygen) params.oxygen = true;
                    if (searchParams.pressureUlcer) params.pressure_ulcer = true;
                    if (searchParams.dementia) params.dementia = true;
                    if (value) {
                      // Split from the last underscore to handle "available_beds_desc" correctly
                      const lastUnderscoreIndex = value.lastIndexOf("_");
                      const sortBy = value.substring(0, lastUnderscoreIndex);
                      const sortOrder = value.substring(lastUnderscoreIndex + 1);
                      params.sort_by = sortBy as FacilitySearchParams["sort_by"];
                      params.sort_order = sortOrder as FacilitySearchParams["sort_order"];
                    }
                    loadFacilities(params);
                  }, 0);
                }}
                className="px-3 py-1.5 border border-[#cfdbe7] rounded-lg text-sm focus:ring-1 focus:ring-[#2b8cee] focus:border-[#2b8cee] focus:outline-none bg-white"
              >
                <option value="">デフォルト</option>
                <option value="distance_asc">距離（近い順）</option>
                <option value="distance_desc">距離（遠い順）</option>
                <option value="monthly_fee_asc">月額費用（安い順）</option>
                <option value="monthly_fee_desc">月額費用（高い順）</option>
                <option value="medicine_cost_asc">薬剤費（安い順）</option>
                <option value="medicine_cost_desc">薬剤費（高い順）</option>
                <option value="available_beds_desc">空床数（多い順）</option>
                <option value="available_beds_asc">空床数（少ない順）</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <svg className="animate-spin h-10 w-10 text-[#2b8cee] mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-[#4c739a]">施設を検索中...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#cfdbe7] p-12 text-center">
              <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-[#4c739a] mb-4">施設が見つかりませんでした</p>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
              >
                フィルターをリセット
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  onViewDetails={viewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function FacilitiesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="facilities" />
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
    }>
      <FacilitiesPageContent />
    </Suspense>
  );
}
