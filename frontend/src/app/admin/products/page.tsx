"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api, ApiError } from "@/lib/api";
import type { DiscountType, Product } from "@/lib/types";

type FormState = {
  name: string;
  sku: string;
  price: string;
  image: string;
  discountType: DiscountType;
  discountValue: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  sku: "",
  price: "",
  image: "",
  discountType: "none",
  discountValue: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  function load() {
    api
      .get<{ products: Product[] }>("/products")
      .then((res) => {
        setProducts(res.products);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load products."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const price = Number(form.price);
    const discountValue = form.discountValue ? Number(form.discountValue) : 0;
    if (!form.name.trim() || !form.sku.trim() || !Number.isFinite(price) || price < 0) {
      setFormError("Name, SKU, and a valid non-negative price are required.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/products", {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price,
        image: form.image.trim(),
        discountType: form.discountType,
        discountValue,
      });
      setForm(EMPTY_FORM);
      setShowCreate(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create the product.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(p: Product) {
    setEditingId(p._id);
    setEditForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      image: p.image,
      discountType: p.discountType,
      discountValue: String(p.discountValue),
    });
  }

  async function saveEdit(id: string) {
    setIsSaving(true);
    setFormError(null);
    try {
      const price = Number(editForm.price);
      const discountValue = editForm.discountValue ? Number(editForm.discountValue) : 0;
      await api.patch(`/products/${id}`, {
        name: editForm.name.trim(),
        price,
        image: editForm.image.trim(),
        discountType: editForm.discountType,
        discountValue,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't update the product.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    try {
      await api.patch(`/products/${p._id}`, { isActive: !p.isActive });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update the product.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{products.length} products</p>
        <button className="btn-primary" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? "Cancel" : "Add product"}
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="mt-4 border border-line bg-white p-5">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">Name</span>
              <input
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">SKU</span>
              <input
                required
                className="input"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">Price (Rs.)</span>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">Image URL (optional)</span>
              <input
                className="input"
                placeholder="https://…"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">Discount</span>
              <select
                className="input"
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value as DiscountType })
                }
              >
                <option value="none">No discount</option>
                <option value="percentage">Percentage off</option>
                <option value="flat">Flat amount off</option>
              </select>
            </label>
            {form.discountType !== "none" && (
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-ink-soft">
                  {form.discountType === "percentage" ? "Discount %" : "Discount amount (Rs.)"}
                </span>
                <input
                  type="number"
                  min={0}
                  max={form.discountType === "percentage" ? 100 : undefined}
                  className="input"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                />
              </label>
            )}
          </div>
          {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}
          <button type="submit" disabled={isSaving} className="btn-primary mt-4">
            {isSaving ? "Saving…" : "Create product"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
          {products.map((p) => (
            <li key={p._id} className="py-4">
              {editingId === p._id ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    <input
                      className="input"
                      type="number"
                      min={0}
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Image URL"
                      value={editForm.image}
                      onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    />
                    <select
                      className="input"
                      value={editForm.discountType}
                      onChange={(e) =>
                        setEditForm({ ...editForm, discountType: e.target.value as DiscountType })
                      }
                    >
                      <option value="none">No discount</option>
                      <option value="percentage">Percentage off</option>
                      <option value="flat">Flat amount off</option>
                    </select>
                    {editForm.discountType !== "none" && (
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={editForm.discountValue}
                        onChange={(e) =>
                          setEditForm({ ...editForm, discountValue: e.target.value })
                        }
                      />
                    )}
                  </div>
                  {formError && <p className="text-sm text-danger">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      className="btn-primary"
                      disabled={isSaving}
                      onClick={() => saveEdit(p._id)}
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </button>
                    <button className="btn-secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="h-12 w-12 shrink-0 rounded-none border border-line object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-dashed border-line text-xs text-ink-soft">
                      No image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {p.name}{" "}
                      {!p.isActive && (
                        <span className="ml-1 text-xs font-normal text-ink-soft">(inactive)</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">{p.sku}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-display tabular-nums text-ink">
                      Rs. {p.effectivePrice}
                    </p>
                    {p.discountType !== "none" && (
                      <p className="text-xs text-ink-soft line-through">Rs. {p.price}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button className="btn-secondary" onClick={() => startEdit(p)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => toggleActive(p)}>
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
