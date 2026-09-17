import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        
        <div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink transition-opacity hover:opacity-80">
            DartCodes <span className="text-teal">Orders</span>
          </span>
          <p className="mt-1 text-sm text-ink-soft">
            Smart order allocation for seamless branch tracking.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-ink-soft">
          <Link 
            href="/orders" 
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            Orders
          </Link>
          <Link 
            href="/support" 
            className="rounded-full px-3 py-1.5 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            Support
          </Link>
          {user?.role === "ADMIN" && (
            <Link 
              href="/admin/branches" 
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-teal/10 hover:text-teal-ink"
            >
              Admin
            </Link>
          )}
        </nav>

        <p className="text-xs font-medium text-ink-soft sm:text-right">
          © {new Date().getFullYear()} TDH (Pvt) Ltd
        </p>
        
      </div>
    </footer>
  );
}