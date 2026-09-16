"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Link href="/orders" className="font-display text-lg font-semibold tracking-tight">
          DartCodes <span className="text-teal">Orders</span>
        </Link>
        {user && (
          <nav className="flex items-center gap-5 text-sm text-ink-soft">
            <Link href="/orders" className="hover:text-ink">
              {user.role === "ADMIN" ? "All orders" : "Your orders"}
            </Link>
            <Link href="/orders/new" className="hover:text-ink">
              New order
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin/branches" className="hover:text-ink">
                Admin
              </Link>
            )}
            <span className="text-line">|</span>
            <span>{user.name}</span>
            <button onClick={logout} className="hover:text-danger">
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
