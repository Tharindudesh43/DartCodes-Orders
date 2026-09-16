"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { SupportMessage } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";

export default function SupportPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SupportMessage | null>(null);
  const [myMessages, setMyMessages] = useState<SupportMessage[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ messages: SupportMessage[] }>("/support")
      .then((res) => setMyMessages(res.messages))
      .catch(() => { });
  }, [user, result]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError("Please write a message before sending.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<{ supportMessage: SupportMessage }>("/support", {
        message: message.trim(),
      });
      setResult(res.supportMessage);
      setMessage("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't send your message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Contact support
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Tell us what&apos;s going on — we&apos;ll route it to the right team.
        </p>

        {result && (
          <div className="mt-6 border-l-2 border-teal bg-white p-4 text-sm">
            <p className="font-medium text-ink">
              Message sent — thanks, we&apos;ve got it.
            </p>
            {result.classification.category && !result.classification.isUncertain ? (
              <p className="mt-1 text-ink-soft">
                Categorized as{" "}
                <span className="text-ink">{result.classification.category}</span>
                {typeof result.classification.confidence === "number" &&
                  ` (${Math.round(result.classification.confidence * 100)}% confidence)`}
                .
              </p>
            ) : (
              <p className="mt-1 text-ink-soft">
                We weren&apos;t confident enough to auto-categorize this one
                {result.classification.topCandidate && (
                  <>
                    {" "}
                    — possibly{" "}
                    <span className="text-ink">{result.classification.topCandidate}</span>
                  </>
                )}
                . A person will read it directly.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-soft">
              What&apos;s the issue? (payment, delivery, refund, account, or anything else)
            </span>
            <textarea
              rows={5}
              className="input resize-none"
              placeholder="e.g. My payment was deducted but the order isn't showing…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
            />
          </label>
          <p className="text-right text-xs text-ink-soft">{message.length}/1000</p>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary self-start">
            {isSubmitting ? "Sending…" : "Send message"}
          </button>
        </form>
        {myMessages.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Your messages
            </h2>
            <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
              {myMessages.map((m) => (
                <li key={m._id} className="py-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`border px-2 py-0.5 ${m.status === "resolved"
                          ? "border-teal text-teal-ink"
                          : "border-ink-soft/40 text-ink-soft"
                        }`}
                    >
                      {m.status === "resolved" ? "Resolved" : "Open"}
                    </span>
                    <span className="text-ink-soft">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink">{m.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
