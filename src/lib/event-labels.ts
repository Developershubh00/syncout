/** Labels for ticketed events — client-safe. */
import type { OrderStatus } from "@/db/schema";

export const CATEGORIES = [
  { id: "dandiya", label: "Dandiya" },
  { id: "garba", label: "Garba" },
  { id: "party", label: "Parties" },
  { id: "concert", label: "Concerts" },
  { id: "festival", label: "Festivals" },
  { id: "comedy", label: "Comedy" },
  { id: "other", label: "More" },
] as const;

export const categoryLabel = (id?: string | null) => CATEGORIES.find((c) => c.id === id)?.label ?? "Event";

export const ORDER_STATUS: Record<OrderStatus, { label: string; cls: string }> = {
  awaiting_payment: { label: "Awaiting payment", cls: "bg-raised text-muted" },
  payment_submitted: { label: "Verifying payment", cls: "bg-gold/15 text-gold" },
  verifying: { label: "Pending verification", cls: "bg-gold/15 text-gold" },
  confirmed: { label: "Confirmed", cls: "bg-gold/15 text-gold" },
  checked_in: { label: "Checked in", cls: "bg-gold/15 text-gold" },
  rejected: { label: "Not confirmed", cls: "bg-red/12 text-red-hot" },
  cancelled: { label: "Cancelled", cls: "bg-raised text-faint" },
  refunded: { label: "Refunded", cls: "bg-raised text-faint" },
};

export const MODE_LABEL = { request: "In-app booking", upi: "UPI in app", whatsapp: "In-app booking", external: "Organiser link", free: "Free RSVP" } as const;
