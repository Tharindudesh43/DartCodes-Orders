import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-display font-semibold text-ink">
            DartCodes <span className="text-teal">Orders</span>
          </span>
          <p className="mt-1 text-xs">
            Smart order allocation, built for the DartCodes Software Engineer Intern assessment.
          </p>
        </div>

        <nav className="flex flex-wrap gap-4">
          <Link href="/orders" className="hover:text-ink">
            Orders
          </Link>
          <Link href="/support" className="hover:text-ink">
            Support
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin/branches" className="hover:text-ink">
              Admin
            </Link>
          )}
        </nav>

        <p className="text-xs">© {new Date().getFullYear()} DartCodes (Pvt) Ltd</p>
      </div>
    </footer>
  );
}