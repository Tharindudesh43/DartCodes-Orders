export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center gap-3">
      <div className="spinner" />
      <span className="text-sm text-ink-soft">{label}</span>
    </div>
  );
}

export function LoadingInline({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-ink-soft">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}