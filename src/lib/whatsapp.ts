/** WhatsApp click-to-chat links. Works on phone (app) and desktop (web). */

export function normalizeWhatsapp(input?: string | null) {
  const digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
  return digits;
}

export function waLink(number: string, text: string) {
  return `https://wa.me/${normalizeWhatsapp(number)}?text=${encodeURIComponent(text)}`;
}

/** A phone number a guest typed, as a wa.me target (Indian numbers get +91). */
export function guestWaLink(phone: string, text: string) {
  return waLink(phone, text);
}

type OrderLike = {
  code: string;
  eventTitle: string;
  venue: string;
  dayLabel: string;
  tierName: string;
  quantity: number;
  amount: number;
  name: string;
  phone: string;
  utr?: string | null;
};

const rs = (n: number) => "₹" + n.toLocaleString("en-IN");

export function paymentProofMessage(o: OrderLike) {
  return [
    "Hi SyncOut! I've paid for my tickets.",
    "",
    `Booking: ${o.code}`,
    `Event: ${o.eventTitle}`,
    `Venue: ${o.venue}`,
    `Date: ${o.dayLabel}`,
    `Tickets: ${o.quantity} × ${o.tierName}`,
    `Amount paid: ${rs(o.amount)}`,
    o.utr ? `UPI ref / UTR: ${o.utr}` : "UPI ref / UTR: (screenshot attached)",
    `Name: ${o.name}`,
    `Phone: ${o.phone}`,
    "",
    "Payment screenshot attached.",
  ].join("\n");
}

export function bookingEnquiryMessage(o: Omit<OrderLike, "utr">) {
  return [
    "Hi SyncOut! I'd like to book this event.",
    "",
    `Booking: ${o.code}`,
    `Event: ${o.eventTitle}`,
    `Venue: ${o.venue}`,
    `Date: ${o.dayLabel}`,
    `Tickets: ${o.quantity} × ${o.tierName}`,
    `Total: ${rs(o.amount)}`,
    `Name: ${o.name}`,
    `Phone: ${o.phone}`,
    "",
    "Please share the payment details.",
  ].join("\n");
}
