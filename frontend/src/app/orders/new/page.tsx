"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { Product, Order } from "@/lib/types";

interface LineItem {
  product: string;
  quantity: number;
}

interface CreateOrderResponse {
  order: Order;
  allocated: boolean;
  message?: string;
}

export default function NewOrderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [items, setItems] = useState<LineItem[]>([{ product: "", quantity: 1 }]);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreateOrderResponse | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    api
      .get<{ products: Product[] }>("/products")
      .then((res) => setProducts(res.products))
      .catch(() => setError("Couldn't load products. Is the backend running?"))
      .finally(() => setLoadingProducts(false));
  }, []);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { product: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location — enter coordinates manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
      },
      () => setError("Couldn't get your location — enter coordinates manually.")
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const cleanItems = items.filter((i) => i.product);
    if (cleanItems.length === 0) {
      setError("Add at least one product to the order.");
      return;
    }
    const productIds = cleanItems.map((i) => i.product);
    if (new Set(productIds).size !== productIds.length) {
      setError("Each product can only appear once — adjust the quantity instead of adding it twice.");
      return;
    }
    if (!address.trim() || !lat || !lng) {
      setError("A delivery address and location are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<CreateOrderResponse>("/orders", {
        items: cleanItems,
        deliveryLocation: { lat: Number(lat), lng: Number(lng), address: address.trim() },
        note: note.trim(),
      });
      setResult(res);
      if (res.allocated) {
        setItems([{ product: "", quantity: 1 }]);
        setNote("");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong placing the order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Place an order</h1>
        <p className="mt-1 text-sm text-ink-soft">
          We&apos;ll automatically assign your order to the branch best placed to fulfil it.
        </p>

        {result && (
          <div
            className={`mt-6 border-l-2 px-4 py-3 text-sm ${
              result.allocated ? "border-teal bg-teal/5" : "border-amber bg-amber/5"
            }`}
          >
            {result.allocated ? (
              <>
                <p className="font-medium text-ink">
                  Order placed — assigned to {result.order.branch?.name}.
                </p>
                {result.order.classification?.category ? (
                  <p className="mt-1 text-ink-soft">
                    Note classified as{" "}
                    <span className="text-ink">{result.order.classification.category}</span>
                    {typeof result.order.classification.confidence === "number" &&
                      ` (${Math.round(result.order.classification.confidence * 100)}% confidence)`}
                    .
                  </p>
                ) : (
                  result.order.classification?.topCandidate && (
                    <p className="mt-1 text-ink-soft">
                      Note wasn&apos;t confidently categorized — possibly{" "}
                      <span className="text-ink">
                        {result.order.classification.topCandidate}
                      </span>
                      .
                    </p>
                  )
                )}
              </>
            ) : (
              <p className="text-ink">{result.message}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-10">
          <section>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Items
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-end gap-3">
                  <span className="pb-2.5 text-sm text-ink-soft tabular-nums">{index + 1}.</span>
                  <label className="flex flex-1 flex-col gap-1.5 text-sm">
                    <span className="text-ink-soft">Product</span>
                    <select
                      required
                      value={item.product}
                      onChange={(e) => updateItem(index, { product: e.target.value })}
                      className="input"
                      disabled={loadingProducts}
                    >
                      <option value="">
                        {loadingProducts ? "Loading…" : "Select a product"}
                      </option>
                      {products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} — Rs. {p.effectivePrice}
                          {p.discountType !== "none" ? ` (was Rs. ${p.price})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex w-24 flex-col gap-1.5 text-sm">
                    <span className="text-ink-soft">Qty</span>
                    <input
                      required
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      className="input"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="pb-2.5 text-sm text-ink-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="btn-secondary mt-4">
              Add another item
            </button>
          </section>

          <section>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Delivery location
            </h2>
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-ink-soft">Address</span>
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                  placeholder="123 Galle Road, Colombo"
                />
              </label>
              <div className="flex items-end gap-3">
                <label className="flex flex-1 flex-col gap-1.5 text-sm">
                  <span className="text-ink-soft">Latitude</span>
                  <input
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="input"
                    placeholder="6.9271"
                    inputMode="decimal"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1.5 text-sm">
                  <span className="text-ink-soft">Longitude</span>
                  <input
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="input"
                    placeholder="79.8612"
                    inputMode="decimal"
                  />
                </label>
                <button type="button" onClick={useCurrentLocation} className="btn-secondary mb-0.5">
                  Use my location
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Note <span className="normal-case text-ink-soft/70">(optional)</span>
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Mention a payment, delivery, or account issue here and we&apos;ll route it to the right team.
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={3}
              className="input mt-3 w-full resize-none"
              placeholder="e.g. My payment was deducted but the order isn't showing."
            />
          </section>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary self-start">
            {isSubmitting ? "Placing order…" : "Place order"}
          </button>
        </form>
      </main>
    </div>
  );
}
