"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? "/orders" : "/login");
  }, [user, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-ink-soft">Loading…</p>
    </div>
  );
}
