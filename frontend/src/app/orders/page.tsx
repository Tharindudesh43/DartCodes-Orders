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

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

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
  }, [user, status, search]);

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
                className={`-mb-px border-b-2 px-2.5 py-2 capitalize transition-colors ${
                  status === s
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
          <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
            {orders.map((order) => (
              <li key={order._id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="text-sm text-ink-soft">
                      {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink">
                    {order.items
                      .map((i) =>
                        typeof i.product === "string"
                          ? `${i.quantity}x item`
                          : `${i.quantity}x ${i.product.name}`
                      )
                      .join(", ")}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {order.branch ? order.branch.name : "No branch assigned"}
                    {order.classification?.category &&
                      ` \u00b7 ${order.classification.category}`}
                  </p>
                </div>
                <span className="shrink-0 font-display text-sm tabular-nums text-ink">
                  Rs.{" "}
                  {order.items
                    .reduce((sum, i) => sum + i.priceAtOrder * i.quantity, 0)
                    .toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
