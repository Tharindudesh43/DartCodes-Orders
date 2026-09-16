import type { OrderStatus } from "@/lib/types";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "border-ink-soft/40 text-ink-soft",
  allocated: "border-teal text-teal-ink",
  processing: "border-amber text-amber",
  shipped: "border-teal text-teal-ink",
  cancelled: "border-danger text-danger",
  unfulfillable: "border-danger text-danger",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  allocated: "Allocated",
  processing: "Processing",
  shipped: "Shipped",
  cancelled: "Cancelled",
  unfulfillable: "Unfulfillable",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
