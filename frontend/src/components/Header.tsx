"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
        <Link href="/orders" className="font-display text-lg font-semibold tracking-tight">
          DartCodes <span className="text-teal">Orders</span>
        </Link>
        {user && (
          <nav className="flex items-center gap-5 text-sm text-ink-soft">
            <Link href="/orders" className="hover:text-ink">
              Your orders
            </Link>
            <Link href="/orders/new" className="hover:text-ink">
              New order
            </Link>
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
