"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/orders"
            className="font-display text-lg font-semibold tracking-tight text-ink transition-opacity hover:opacity-80"
          >
            DartCodes <span className="text-teal">Orders</span>
          </Link>

          {user && (
            <nav className="flex items-center gap-1.5 text-sm font-medium text-ink-soft">
              <Link
                href="/orders"
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {user.role === "ADMIN" ? "All orders" : "Your orders"}
              </Link>
              <Link
                href="/orders/new"
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                New order
              </Link>
              <Link
                href="/support"
                className="rounded-full px-3 py-1.5 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                Support
              </Link>

              {user.role === "ADMIN" && (
                <Link
                  href="/admin/branches"
                  className="rounded-full px-3 py-1.5 transition-colors hover:bg-teal/10 hover:text-teal-ink"
                >
                  Admin
                </Link>
              )}

              <div className="ml-3 mr-1 h-5 w-px bg-line" aria-hidden="true" />

              <div className="flex items-center gap-2 pl-2">
                <div className="flex items-center gap-2 px-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/5 text-xs font-semibold text-ink">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline-block text-ink">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="rounded-full bg-gray-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-50 hover:text-red-600 text-black"
                >
                  Log out
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <h3 className="font-display text-lg font-semibold text-ink">
              Log out
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              Are you sure you want to log out?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  logout();
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}