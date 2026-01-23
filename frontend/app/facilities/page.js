"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { facilityAPI } from "@/lib/api";

export default function FacilitiesPage() {
  const { user, isHospital, loading: authLoading } = useAuth();
  const router = useRouter();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useState({
    name: "",
    minBeds: "",
    location: "",
  });

  useEffect(() => {
    if (!isHospital && !authLoading) {
      router.push("/dashboard");
      return;
    }
    if (isHospital) {
      loadFacilities();
    }
  }, [isHospital, authLoading, router]);

  const loadFacilities = async (params = {}) => {
    try {
      setLoading(true);
      setError("");
      const response = await facilityAPI.list(params);
      setFacilities(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "施設の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (searchParams.name) params.name = searchParams.name;
    if (searchParams.minBeds)
      params.min_bed_capacity = parseInt(searchParams.minBeds);
    if (searchParams.location) params.address = searchParams.location;
    loadFacilities(params);
  };

  const handleReset = () => {
    setSearchParams({ name: "", minBeds: "", location: "" });
    loadFacilities();
  };

  const viewDetails = (id) => {
    router.push(`/facilities/${id}`);
  };

  if (!isHospital) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">施設検索</h1>
            <p className="mt-2 text-sm text-gray-600">
              受け入れ可能な施設を検索できます
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ダッシュボードに戻る
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  施設名
                </label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={searchParams.name}
                  onChange={(e) =>
                    setSearchParams({ ...searchParams, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="minBeds"
                  className="block text-sm font-medium text-gray-700"
                >
                  最小病床数
                </label>
                <input
                  type="number"
                  id="minBeds"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={searchParams.minBeds}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      minBeds: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  所在地
                </label>
                <input
                  type="text"
                  id="location"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={searchParams.location}
                  onChange={(e) =>
                    setSearchParams({
                      ...searchParams,
                      location: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                検索
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                リセット
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {facilities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">施設が見つかりませんでした</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {facilities.map((facility) => (
                  <li key={facility.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-indigo-600">
                            {facility.name}
                          </h3>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                病床数: {facility.bed_capacity}床
                              </p>
                              {facility.address && (
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  {facility.address}
                                </p>
                              )}
                            </div>
                          </div>
                          {facility.acceptance_conditions && (
                            <p className="mt-2 text-sm text-gray-600">
                              受け入れ条件: {facility.acceptance_conditions}
                            </p>
                          )}
                        </div>
                        <div className="ml-5 flex-shrink-0">
                          <button
                            onClick={() => viewDetails(facility.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            詳細
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
