"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Branch, Product, StockEntry } from "@/lib/types";

export default function AdminStockPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  function load() {
    setIsLoading(true);
    setError(null);
    Promise.all([
      api.get<{ branches: Branch[] }>("/branches"),
      api.get<{ products: Product[] }>("/products"),
      api.get<{ stock: StockEntry[] }>("/stock"),
    ])
      .then(([branchRes, productRes, stockRes]) => {
        setBranches(branchRes.branches);
        setProducts(productRes.products);
        setStock(stockRes.stock);
        setSelectedBranch((prev) => prev || branchRes.branches[0]?._id || "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load stock data."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  const quantityByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stock) {
      if (row.branch._id === selectedBranch) map.set(row.product._id, row.quantity);
    }
    return map;
  }, [stock, selectedBranch]);

  function draftFor(productId: string): string {
    if (productId in drafts) return drafts[productId];
    return String(quantityByProduct.get(productId) ?? 0);
  }

  async function saveRow(productId: string) {
    const raw = draftFor(productId);
    const quantity = Number(raw);
    if (!Number.isInteger(quantity) || quantity < 0) {
      setRowError((r) => ({ ...r, [productId]: "Must be a non-negative whole number" }));
      return;
    }
    setRowError((r) => ({ ...r, [productId]: "" }));
    setSavingId(productId);
    try {
      await api.put(`/stock`, { branch: selectedBranch, product: productId, quantity });
      load();
      setDrafts((d) => {
        const next = { ...d };
        delete next[productId];
        return next;
      });
    } catch (err) {
      setRowError((r) => ({
        ...r,
        [productId]: err instanceof ApiError ? err.message : "Couldn't save.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading) return <p className="text-sm text-ink-soft">Loading…</p>;

  if (branches.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Add a branch first, then come back here to set its stock.
      </p>
    );
  }
  if (products.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Add a product first, then come back here to set stock levels.
      </p>
    );
  }

  return (
    <div>
      <label className="flex max-w-xs flex-col gap-1.5 text-sm">
        <span className="text-ink-soft">Branch</span>
        <select
          className="input"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
        >
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
        {products.map((p) => (
          <li key={p._id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{p.name}</p>
              <p className="text-xs text-ink-soft">{p.sku}</p>
            </div>
            <input
              type="number"
              min={0}
              step={1}
              className="input w-24"
              value={draftFor(p._id)}
              onChange={(e) => setDrafts((d) => ({ ...d, [p._id]: e.target.value }))}
            />
            <button
              className="btn-secondary"
              disabled={savingId === p._id}
              onClick={() => saveRow(p._id)}
            >
              {savingId === p._id ? "Saving…" : "Save"}
            </button>
            {rowError[p._id] && <p className="text-xs text-danger">{rowError[p._id]}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
