"use client";

import { useState, useEffect, useRef, ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { documentAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import type { Document } from "@/lib/types";
import { AxiosError } from "axios";

interface DocumentType {
  id: string;
  label: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { id: "all", label: "すべての書類" },
  { id: "medical", label: "診療情報提供書" },
  { id: "contract", label: "契約書類" },
  { id: "referral", label: "紹介状" },
];

interface TypeStyle {
  bg: string;
  text: string;
  label: string;
}

const TYPE_STYLES: Record<string, TypeStyle> = {
  medical: { bg: "bg-blue-50", text: "text-[#2b8cee]", label: "診療記録" },
  legal: { bg: "bg-purple-50", text: "text-purple-600", label: "法的書類" },
  identity: { bg: "bg-emerald-50", text: "text-emerald-600", label: "本人確認・請求" },
  contract: { bg: "bg-amber-50", text: "text-amber-600", label: "契約書" },
  default: { bg: "bg-slate-50", text: "text-slate-600", label: "その他" },
};

interface DocumentTypeBadgeProps {
  type: string;
}

function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.default;
  return (
    <span className={`px-3 py-1 ${style.bg} ${style.text} text-xs font-bold rounded-lg tracking-tight`}>
      {style.label}
    </span>
  );
}

interface FileIconProps {
  filename: string;
}

function FileIcon({ filename }: FileIconProps) {
  const ext = filename?.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, { bg: string; color: string }> = {
    pdf: { bg: "bg-red-100", color: "text-red-600" },
    doc: { bg: "bg-blue-100", color: "text-blue-600" },
    docx: { bg: "bg-blue-100", color: "text-blue-600" },
    jpg: { bg: "bg-emerald-100", color: "text-emerald-600" },
    jpeg: { bg: "bg-emerald-100", color: "text-emerald-600" },
    png: { bg: "bg-emerald-100", color: "text-emerald-600" },
  };
  const iconConfig = icons[ext] || { bg: "bg-slate-100", color: "text-slate-600" };

  return (
    <div className={`w-10 h-10 rounded-lg ${iconConfig.bg} ${iconConfig.color} flex items-center justify-center`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

export default function DocumentsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      loadDocuments();
    }
  }, [isAuthenticated, authLoading, router]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await documentAPI.list();
      setDocuments(response.data || []);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "書類の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("document_type", "medical");
        formData.append("recipient_id", String(user?.id || 0));
        await documentAPI.upload(formData);
      }
      setSuccess("書類をアップロードしました");
      await loadDocuments();
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: number, title: string) => {
    try {
      const response = await documentAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", title);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "ダウンロードに失敗しました");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("この書類を削除してもよろしいですか？")) return;

    try {
      setError("");
      await documentAPI.delete(id);
      setSuccess("書類を削除しました");
      await loadDocuments();
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error || "削除に失敗しました");
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
    handleFileUpload(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesFilter = activeFilter === "all" || doc.document_type === activeFilter;
    const matchesSearch =
      !searchQuery ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-[#f6f7f8]">
        <Sidebar activeItem="documents" />
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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar activeItem="documents" />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#cfdbe7] px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-black text-[#0d141b] mb-2">書類管理</h2>
            <p className="text-[#4c739a]">送受信した書類を管理できます</p>
          </div>
        </div>

        <div className="px-8 py-6 max-w-6xl mx-auto">
          {/* Search and Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center px-4 py-2.5 bg-white rounded-xl border border-[#cfdbe7]">
                <svg className="w-5 h-5 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full ml-2 placeholder:text-[#4c739a]"
                  placeholder="ファイル名で検索..."
                />
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-2.5 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? "アップロード中..." : "新規アップロード"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {DOCUMENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setActiveFilter(type.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === type.id
                    ? "bg-[#2b8cee] text-white"
                    : "bg-white border border-[#cfdbe7] text-[#4c739a] hover:bg-slate-50"
                }`}
              >
                {type.label}
              </button>
            ))}
            <span className="ml-auto text-sm text-[#4c739a] flex items-center">
              全 {filteredDocuments.length} 件
            </span>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-xl border border-[#cfdbe7] overflow-hidden">
            {filteredDocuments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#4c739a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-[#4c739a] mb-4">
                  {searchQuery || activeFilter !== "all" ? "条件に一致する書類がありません" : "書類がありません"}
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-[#2b8cee] text-white rounded-lg font-bold text-sm hover:bg-[#2b8cee]/90 transition-all"
                >
                  書類をアップロード
                </button>
              </div>
            ) : (
              <>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#cfdbe7]">
                      <th className="px-6 py-4 text-[#0d141b] text-sm font-bold w-[35%]">タイトル</th>
                      <th className="px-6 py-4 text-[#0d141b] text-sm font-bold">種類</th>
                      <th className="px-6 py-4 text-[#0d141b] text-sm font-bold">送信先</th>
                      <th className="px-6 py-4 text-[#0d141b] text-sm font-bold">アップロード日</th>
                      <th className="px-6 py-4 text-[#0d141b] text-sm font-bold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileIcon filename={doc.title} />
                            <div>
                              <div className="text-[#0d141b] text-sm font-bold">{doc.title}</div>
                              <div className="text-[#4c739a] text-xs">
                                {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <DocumentTypeBadge type={doc.document_type} />
                        </td>
                        <td className="px-6 py-4 text-[#4c739a] text-sm">
                          ID: {doc.recipient_id}
                        </td>
                        <td className="px-6 py-4 text-[#4c739a] text-sm">
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString("ja-JP")
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDownload(doc.id, doc.title)}
                              className="px-3 py-1.5 text-xs font-bold text-[#4c739a] hover:text-[#2b8cee] transition-colors border border-[#cfdbe7] rounded-lg"
                            >
                              ダウンロード
                            </button>
                            {doc.sender_id === user?.id && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="px-3 py-1.5 text-xs font-bold text-[#4c739a] hover:text-red-500 transition-colors border border-[#cfdbe7] rounded-lg"
                              >
                                削除
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-[#cfdbe7] flex items-center justify-between">
                    <p className="text-sm text-[#4c739a]">
                      {totalPages}ページ中 {currentPage}ページ目
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-[#cfdbe7] rounded-lg text-sm font-medium text-[#4c739a] hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        前へ
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-[#cfdbe7] rounded-lg text-sm font-medium text-[#2b8cee] hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
                      >
                        次へ
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`mt-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? "border-[#2b8cee] bg-[#2b8cee]/5"
                : "border-[#cfdbe7] bg-white/50"
            }`}
          >
            <svg className="w-10 h-10 text-[#4c739a] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-[#0d141b] font-bold">ファイルをドラッグ＆ドロップしてアップロード</p>
            <p className="text-[#4c739a] text-sm">対応形式: PDF, DOCX, JPEG, PNG (最大 15MB)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
