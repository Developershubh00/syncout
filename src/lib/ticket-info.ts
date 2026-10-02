import "server-only";
import { getBookingByCode } from "./queries";
import { getOrder } from "./tevents";
import { dayLabel, rs } from "./event-format";
import { cityName } from "./cities";

export type TicketInfo = {
  kind: "ticket" | "pass";
  code: string;
  status: string;
  ok: boolean;
  title: string;
  venue: string;
  name: string;
  phone: string;
  email: string | null;
  admits: number;
  admitted: number[];
  rows: [string, string][];
};

const ist = (d: Date | string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const ENTRY: Record<string, string> = { stag_female: "Girls", couple: "Couples", stag_male: "Guys" };

/** Everything the door or a venue manager needs about one booking code. */
export async function ticketInfo(raw: string): Promise<TicketInfo | null> {
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length === 7 && code.startsWith("T")) {
    const o = await getOrder(code);
    if (!o) return null;
    const admitted = Array.isArray(o.admitted) ? o.admitted : [];
    return {
      kind: "ticket", code: o.code, status: o.status, ok: o.status === "confirmed" || o.status === "checked_in",
      title: o.eventTitle, venue: `${o.venueName}, ${cityName(o.citySlug)}`, name: o.name, phone: o.phone, email: o.email,
      admits: o.admits, admitted,
      rows: [
        ["Event", o.eventTitle],
        ["Date", o.day ? dayLabel(o.day) : ist(o.startsAt)],
        ["Venue", `${o.venueName}, ${cityName(o.citySlug)}`],
        ["Tickets", `${o.quantity} × ${o.tierName}`],
        ["Admits", `${o.admits} ${o.admits === 1 ? "person" : "people"} · ${admitted.length} in`],
        ["Paid", `${rs(o.amount)}${o.discount ? ` (code ${o.promoCode}, −${rs(o.discount)})` : ""}`],
        ["Status", o.status.replace(/_/g, " ")],
        ["Booked by", o.name],
        ["Phone", o.phone],
        ["Email", o.email],
        ["Booked at", ist(o.createdAt)],
        ...(o.utr ? ([["UPI ref", o.utr]] as [string, string][]) : []),
        ...(o.note ? ([["Note", o.note]] as [string, string][]) : []),
      ],
    };
  }
  const b = await getBookingByCode(code);
  if (!b) return null;
  return {
    kind: "pass", code: b.code, status: b.status, ok: b.status === "approved" || b.status === "checked_in",
    title: b.eventTitle, venue: [b.clubName, b.clubArea].filter(Boolean).join(", "), name: b.guestName, phone: b.guestPhone, email: b.guestEmail,
    admits: b.totalGuests, admitted: b.status === "checked_in" ? Array.from({ length: b.totalGuests }, (_, i) => i + 1) : [],
    rows: [
      ["Night", b.eventTitle],
      ["Club", [b.clubName, b.clubArea].filter(Boolean).join(", ")],
      ["When", ist(b.startsAt)],
      ["List", ENTRY[b.entryType] ?? b.entryType],
      ["Group", `${b.totalGuests} — ${b.femaleCount} girls, ${b.maleCount} guys`],
      ["Arrive by", b.arrivalTime ?? "10:30 PM"],
      ["Status", b.status.replace(/_/g, " ")],
      ["Name", b.guestName],
      ["Phone", b.guestPhone],
      ["Email", b.guestEmail],
      ["Applied", ist(b.createdAt)],
      ...(b.notes ? ([["Notes", b.notes]] as [string, string][]) : []),
    ],
  };
}
