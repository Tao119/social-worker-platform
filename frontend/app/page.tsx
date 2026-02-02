"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && !hasRedirected.current) {
      hasRedirected.current = true;
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">読み込み中...</div>
    </div>
  );
}
