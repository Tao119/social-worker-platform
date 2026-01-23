"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { documentAPI } from "@/lib/api";

export default function DocumentsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    document_type: "",
    recipient_id: "",
    folder: "",
    file: null,
  });

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
      setError(err.response?.data?.error || "書類の読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadData({ ...uploadData, file });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      setError("ファイルを選択してください");
      return;
    }

    setError("");
    setSuccess("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadData.file);
      formData.append("title", uploadData.title);
      formData.append("document_type", uploadData.document_type);
      formData.append("recipient_id", parseInt(uploadData.recipient_id));
      if (uploadData.folder) {
        formData.append("folder", uploadData.folder);
      }

      await documentAPI.upload(formData);
      setSuccess("書類をアップロードしました");
      setShowUploadForm(false);
      setUploadData({
        title: "",
        document_type: "",
        recipient_id: "",
        folder: "",
        file: null,
      });
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id, title) => {
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
      setError(err.response?.data?.error || "ダウンロードに失敗しました");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("この書類を削除してもよろしいですか？")) {
      return;
    }

    try {
      setError("");
      await documentAPI.delete(id);
      setSuccess("書類を削除しました");
      await loadDocuments();
    } catch (err) {
      setError(err.response?.data?.error || "削除に失敗しました");
    }
  };

  // Group documents by folder
  const groupedDocuments = documents.reduce((acc, doc) => {
    const folder = doc.folder || "未分類";
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(doc);
    return acc;
  }, {});

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">書類管理</h1>
            <p className="mt-2 text-sm text-gray-600">
              送受信した書類を管理できます
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showUploadForm ? "キャンセル" : "書類をアップロード"}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              ダッシュボードに戻る
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="text-sm text-green-800">{success}</div>
          </div>
        )}

        {showUploadForm && (
          <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              書類アップロード
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  タイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="document_type"
                  className="block text-sm font-medium text-gray-700"
                >
                  書類種別
                </label>
                <input
                  type="text"
                  id="document_type"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={uploadData.document_type}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      document_type: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="recipient_id"
                  className="block text-sm font-medium text-gray-700"
                >
                  送信先ユーザーID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="recipient_id"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  value={uploadData.recipient_id}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      recipient_id: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="folder"
                  className="block text-sm font-medium text-gray-700"
                >
                  フォルダ
                </label>
                <input
                  type="text"
                  id="folder"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  placeholder="例: 契約書、診断書など"
                  value={uploadData.folder}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      folder: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label
                  htmlFor="file"
                  className="block text-sm font-medium text-gray-700"
                >
                  ファイル <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="file"
                  required
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  onChange={handleFileChange}
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {uploading ? "アップロード中..." : "アップロード"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="text-center py-12">
              <p className="text-gray-500">書類がありません</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocuments).map(([folder, docs]) => (
              <div
                key={folder}
                className="bg-white shadow overflow-hidden sm:rounded-md"
              >
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    📁 {folder}
                  </h2>
                </div>
                <ul className="divide-y divide-gray-200">
                  {docs.map((doc) => (
                    <li key={doc.id}>
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {doc.title}
                            </h3>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                {doc.document_type && (
                                  <p className="flex items-center text-sm text-gray-500">
                                    種別: {doc.document_type}
                                  </p>
                                )}
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  送信者ID: {doc.sender_id}
                                </p>
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  受信者ID: {doc.recipient_id}
                                </p>
                              </div>
                            </div>
                            {doc.created_at && (
                              <p className="mt-2 text-sm text-gray-500">
                                作成日時:{" "}
                                {new Date(doc.created_at).toLocaleString(
                                  "ja-JP",
                                )}
                              </p>
                            )}
                          </div>
                          <div className="ml-5 flex-shrink-0 flex gap-2">
                            <button
                              onClick={() => handleDownload(doc.id, doc.title)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              ダウンロード
                            </button>
                            {doc.sender_id === user?.id && (
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                削除
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
