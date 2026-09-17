"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { LoadingScreen } from "@/components/Loading";
import { Pagination } from "@/components/Pagination";
import { Footer } from "@/components/Footer";

const STATUS_FILTERS: Array<OrderStatus | "all"> = [
  "all",
  "pending",
  "allocated",
  "processing",
  "shipped",
  "cancelled",
  "unfulfillable",
];

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const PAGE_SIZE = 10;

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    params.set("page", String(page));
    params.set("limit", String(PAGE_SIZE));

    api
      .get<{ orders: Order[]; total: number }>(`/orders?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setOrders(res.orders);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load orders.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, status, search, page]);


  useEffect(() => {
    setPage(1);
  }, [status, search]);

  if (authLoading || !user) return <LoadingScreen />;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {user.role === "ADMIN" ? "All orders" : "Your orders"}
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              {total} order{total === 1 ? "" : "s"}
              {status !== "all" ? ` \u00b7 filtered by ${status}` : ""}
            </p>
          </div>
          <Link href="/orders/new" className="btn-primary">
            New order
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1 border-b border-line text-sm">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`-mb-px border-b-2 px-2.5 py-2 capitalize transition-colors ${status === s
                  ? "border-teal text-ink"
                  : "border-transparent text-ink-soft hover:text-ink"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search note or address…"
            className="input ml-auto w-56"
          />
        </div>

        {error && (
          <p role="alert" className="mt-6 text-sm text-danger">
            {error}
          </p>
        )}

        {isLoading ? (
          <p className="mt-10 text-sm text-ink-soft">Loading orders…</p>
        ) : orders.length === 0 ? (
          <div className="mt-10 border border-dashed border-line px-6 py-10 text-center">
            <p className="text-sm text-ink-soft">
              No orders match this view yet.
            </p>
            <Link href="/orders/new" className="btn-secondary mt-4 inline-flex">
              Place your first order
            </Link>
          </div>
        ) : (
          <><ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
            {orders.map((order) => (
              <li
                key={order._id}
                className="group flex flex-col justify-between gap-4 rounded-xl border border-line bg-white p-5 shadow-sm transition-all hover:border-ink/20 hover:shadow-md sm:flex-row sm:items-center m-1"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <time className="text-xs font-medium text-ink-soft">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }).format(new Date(order.createdAt))}
                    </time>
                  </div>

                  <p className="truncate text-sm font-medium text-ink">
                    {order.items
                      .map((i) => typeof i.product === "string"
                        ? `${i.quantity}x item`
                        : `${i.quantity}x ${i.product.name}`
                      )
                      .join(", ")}
                  </p>

                  <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
                    <span>{order.branch ? order.branch.name : "No branch assigned"}</span>
                    {order.classification?.category && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-ink/20" aria-hidden="true" />
                        <span className="capitalize">{order.classification.category}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0 sm:text-right border-t border-line sm:border-0 mt-3 sm:mt-0">
                  <span className="font-display text-base font-semibold tabular-nums tracking-tight text-ink">
                    <span className="mr-0.5 text-xs font-medium text-ink-soft">Rs.</span>
                    {order.items
                      .reduce((sum, i) => sum + i.priceAtOrder * i.quantity, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
            onPageChange={setPage}
          /></>
        )}
      </main>
      <Footer/>
    </div>
  );
}
