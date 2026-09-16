"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Branch } from "@/lib/types";

type FormState = {
  name: string;
  lat: string;
  lng: string;
  address: string;
  maxCapacity: string;
};

const EMPTY_FORM: FormState = { name: "", lat: "", lng: "", address: "", maxCapacity: "20" };

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
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
      .get<{ branches: Branch[] }>("/branches")
      .then((res) => {
        setBranches(res.branches);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load branches."))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    const maxCapacity = Number(form.maxCapacity);
    if (!form.name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormError("Name and a valid latitude/longitude are required.");
      return;
    }

    setIsSaving(true);
    try {
      await api.post("/branches", {
        name: form.name.trim(),
        location: { lat, lng, address: form.address.trim() },
        maxCapacity: Number.isFinite(maxCapacity) ? maxCapacity : 20,
      });
      setForm(EMPTY_FORM);
      setShowCreate(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't create the branch.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEdit(b: Branch) {
    setEditingId(b._id);
    setEditForm({
      name: b.name,
      lat: String(b.location.lat),
      lng: String(b.location.lng),
      address: b.location.address,
      maxCapacity: String(b.maxCapacity),
    });
  }

  async function saveEdit(id: string) {
    setIsSaving(true);
    setFormError(null);
    try {
      const lat = Number(editForm.lat);
      const lng = Number(editForm.lng);
      const maxCapacity = Number(editForm.maxCapacity);
      await api.patch(`/branches/${id}`, {
        name: editForm.name.trim(),
        location: { lat, lng, address: editForm.address.trim() },
        maxCapacity,
      });
      setEditingId(null);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't update the branch.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(b: Branch) {
    try {
      await api.patch(`/branches/${b._id}`, { isActive: !b.isActive });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update the branch.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{branches.length} branches</p>
        <button className="btn-primary" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? "Cancel" : "Add branch"}
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
              <span className="text-ink-soft">Max capacity</span>
              <input
                type="number"
                min={1}
                className="input"
                value={form.maxCapacity}
                onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">Latitude</span>
              <input
                required
                type="number"
                step="any"
                className="input"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">Longitude</span>
              <input
                required
                type="number"
                step="any"
                className="input"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1.5 text-sm">
              <span className="text-ink-soft">Address (optional)</span>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </label>
          </div>
          {formError && <p className="mt-3 text-sm text-danger">{formError}</p>}
          <button type="submit" disabled={isSaving} className="btn-primary mt-4">
            {isSaving ? "Saving…" : "Create branch"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-soft">Loading…</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
          {branches.map((b) => (
            <li key={b._id} className="py-4">
              {editingId === b._id ? (
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
                      min={1}
                      value={editForm.maxCapacity}
                      onChange={(e) => setEditForm({ ...editForm, maxCapacity: e.target.value })}
                    />
                    <input
                      className="input"
                      type="number"
                      step="any"
                      value={editForm.lat}
                      onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })}
                    />
                    <input
                      className="input"
                      type="number"
                      step="any"
                      value={editForm.lng}
                      onChange={(e) => setEditForm({ ...editForm, lng: e.target.value })}
                    />
                    <input
                      className="input col-span-2"
                      placeholder="Address"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    />
                  </div>
                  {formError && <p className="text-sm text-danger">{formError}</p>}
                  <div className="flex gap-2">
                    <button
                      className="btn-primary"
                      disabled={isSaving}
                      onClick={() => saveEdit(b._id)}
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {b.name}{" "}
                      {!b.isActive && (
                        <span className="ml-1 text-xs font-normal text-ink-soft">(inactive)</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {b.location.address || `${b.location.lat}, ${b.location.lng}`}
                    </p>
                  </div>
                  <div className="text-right text-sm text-ink-soft tabular-nums">
                    load {b.currentLoad}/{b.maxCapacity}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button className="btn-secondary" onClick={() => startEdit(b)}>
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => toggleActive(b)}>
                      {b.isActive ? "Deactivate" : "Activate"}
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
