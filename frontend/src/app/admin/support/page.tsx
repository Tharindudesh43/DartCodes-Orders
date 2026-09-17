"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { SupportMessage } from "@/lib/types";
import { LoadingInline } from "@/components/Loading";
import { Pagination } from "@/components/Pagination";

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("open");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);


  function load() {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    params.set("page", String(page));
    params.set("limit", "10");

    api
      .get<{ messages: SupportMessage[]; total: number }>(`/support?${params.toString()}`)
      .then((res) => {
        setMessages(res.messages);
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load messages."))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    load();
  }, [statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  async function toggleStatus(m: SupportMessage) {
    try {
      await api.patch(`/support/${m._id}`, {
        status: m.status === "open" ? "resolved" : "open",
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update the message.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{messages.length} messages</p>
        <div className="flex gap-1 text-sm">
          {(["open", "resolved", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`border px-2.5 py-1 capitalize transition-colors ${statusFilter === s
                ? "border-teal text-ink"
                : "border-line text-ink-soft hover:text-ink"
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {isLoading ? (
        <LoadingInline />
      ) : messages.length === 0 ? (
        <p className="mt-8 text-sm text-ink-soft">No messages here.</p>
      ) : (
        <><ul className="mt-6 flex flex-col divide-y divide-line border-t border-line">
          {messages.map((m) => (
            <li key={m._id} className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-ink-soft">
                    <span>
                      {typeof m.customer === "string" ? m.customer : m.customer.name}
                    </span>
                    <span>·</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                    {m.classification.category ? (
                      <span className="border border-teal px-1.5 py-0.5 text-teal-ink">
                        {m.classification.category}
                        {typeof m.classification.confidence === "number" &&
                          ` ${Math.round(m.classification.confidence * 100)}%`}
                      </span>
                    ) : (
                      m.classification.topCandidate && (
                        <span className="border border-amber px-1.5 py-0.5 text-amber">
                          Uncertain — possibly {m.classification.topCandidate}
                        </span>
                      )
                    )}
                  </div>
                  <p className="mt-1.5 text-sm text-ink">{m.message}</p>
                </div>
                <button className="btn-secondary shrink-0" onClick={() => toggleStatus(m)}>
                  {m.status === "open" ? "Mark resolved" : "Reopen"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / 10))} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
