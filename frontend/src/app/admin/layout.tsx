"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/Loading";
import { Footer } from "@/components/Footer";

const TABS = [
  { href: "/admin/branches", label: "Branches" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/stock", label: "Stock" },
  { href: "/admin/support", label: "Support inbox" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace("/orders");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== "ADMIN") return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex-1 w-full max-w-5xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin</h1>
        <nav className="mt-6 flex gap-1 border-b border-line text-sm">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px border-b-2 px-3 py-2 transition-colors ${pathname === tab.href
                  ? "border-teal text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
                }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
