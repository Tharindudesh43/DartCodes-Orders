"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import type { SupportMessage } from "@/lib/types";
import { LoadingScreen } from "@/components/Loading";
import { Footer } from "@/components/Footer";

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

  if (authLoading || !user) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Contact Support
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Need help ? Let's get it to the right experts.
        </p>
        {result && (
          <div className="mt-6 border-l-2 border-teal bg-white p-4 text-sm">
            <p className="font-medium text-ink">
              Request submitted. Our team will review it shortly.
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
                Unable to auto categorize.{" "}
                {result.classification.topCandidate ? (
                  <>
                    It appears to match <span className="text-ink font-medium">{result.classification.topCandidate}</span>, but a team member will process it directly.
                  </>
                ) : (
                  "A team member will process this directly."
                )}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-ink-soft">
              Please specify the issue (payment, delivery, refund, etc.)
            </span>
            <textarea
              rows={5}
              className="input resize-none"
              placeholder="e.g : My payment went through, but the order isn't showing up..."
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
          <div className="mt-15">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Your messages
            </h2>
            <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
              {myMessages.length > 0 && (
                <div className="mt-12">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                      Your messages
                    </h2>
                    <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-xs font-medium text-ink-soft">
                      {myMessages.length} {myMessages.length === 1 ? "message" : "messages"}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-3">
                    {myMessages.map((m) => (
                      <li
                        key={m._id}
                        className="group rounded-xl border border-line bg-white p-4 shadow-sm transition-all hover:border-ink/20 hover:shadow-md"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${m.status === "resolved"
                                ? "bg-teal/10 text-teal-ink ring-1 ring-inset ring-teal/20"
                                : "bg-ink/5 text-ink-soft ring-1 ring-inset ring-line"
                              }`}
                          >
                            {m.status === "resolved" ? "Resolved" : "Open"}
                          </span>
                          <time className="text-xs text-ink-soft">
                            {new Intl.DateTimeFormat("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }).format(new Date(m.createdAt))}
                          </time>
                        </div>
                        <p className="text-sm leading-relaxed text-ink line-clamp-3">
                          {m.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </ul>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
