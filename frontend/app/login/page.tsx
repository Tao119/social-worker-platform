"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface FormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "ログインに失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f6f7f8]">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2b8cee] flex-col justify-center px-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="5" cy="5" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white/20 size-14 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-white text-3xl font-black">remedyCare</h1>
              <p className="text-white/70 text-sm font-medium">医療介護連携プラットフォーム</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-white text-4xl font-black leading-tight">
              転院調整を、<br />もっとスマートに。
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              病院と介護施設をつなぐ、シームレスな患者マッチングプラットフォーム。空床情報の確認から受け入れ調整まで、すべてをワンストップで。
            </p>

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex items-center gap-3 text-white/90">
                <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">施設検索と空床確認</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">リアルタイムメッセージング</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">書類管理と共有</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-[#2b8cee] size-12 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-[#0d141b] text-2xl font-black">remedyCare</h1>
              <p className="text-[#4c739a] text-xs font-medium">医療介護連携プラットフォーム</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-[#cfdbe7] p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#0d141b] mb-2">ログイン</h2>
              <p className="text-[#4c739a] text-sm">アカウント情報を入力してください</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#0d141b] mb-2">
                  メールアドレス
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm transition-colors"
                  placeholder="example@hospital.jp"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#0d141b] mb-2">
                  パスワード
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 border border-[#cfdbe7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2b8cee]/20 focus:border-[#2b8cee] text-sm transition-colors"
                  placeholder="パスワードを入力"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#2b8cee] text-white rounded-xl font-bold text-sm hover:bg-[#2b8cee]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    ログイン中...
                  </>
                ) : (
                  "ログイン"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#cfdbe7]">
              <p className="text-center text-xs text-[#4c739a]">
                ログインに問題がある場合は、システム管理者にお問い合わせください。
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#4c739a]">
            © 2024 remedyCare. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
