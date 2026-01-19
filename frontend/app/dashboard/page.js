"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function DashboardPage() {
  const {
    user,
    loading,
    isAuthenticated,
    isHospital,
    isFacility,
    isAdmin,
    logout,
  } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">
                ソーシャルワーカープラットフォーム
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.email} ({user.role})
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-6">ダッシュボード</h2>

          {isHospital && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">病院ユーザー機能</h3>
              <div className="space-y-2">
                <a
                  href="/facilities"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  施設を検索
                </a>
                <a
                  href="/documents"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  書類管理
                </a>
              </div>
            </div>
          )}

          {isFacility && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">施設ユーザー機能</h3>
              <div className="space-y-2">
                <a
                  href="/facility/profile"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  施設情報管理
                </a>
                <a
                  href="/documents"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  書類管理
                </a>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">管理者機能</h3>
              <div className="space-y-2">
                <a
                  href="/admin"
                  className="block px-4 py-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  アカウント管理
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
