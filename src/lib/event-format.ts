/** Date/time labels for ticketed events. Client-safe (no server imports). */
import { istAt, istDateKey } from "./guestlist";

const IST = "Asia/Kolkata";

export function dayLabel(dayKey: string, opts: { weekday?: boolean } = { weekday: true }) {
  const d = istAt(dayKey, 12);
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    ...(opts.weekday ? { weekday: "short" } : {}),
    day: "numeric",
    month: "short",
  }).format(d);
}

export function timeLabel(ev: { timeLabel?: string | null; startsAt: Date | string }) {
  if (ev.timeLabel) return ev.timeLabel;
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(ev.startsAt))
    .replace(/\s?(am|pm)$/i, (m) => m.toUpperCase());
}

function daysOf(ev: { days?: string[] | null; startsAt: Date | string }) {
  const list = (ev.days ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  return list.length ? list : [istDateKey(ev.startsAt)];
}

/** "Sat, 17 Oct" · "Fri 16 – Sun 18 Oct" · "11, 14 & 16 Oct" */
export function datesLabel(ev: { days?: string[] | null; startsAt: Date | string }) {
  const days = daysOf(ev);
  if (days.length === 1) return dayLabel(days[0]);

  const consecutive = days.every((d, i) => i === 0 || istAt(d).getTime() - istAt(days[i - 1]).getTime() === 864e5);
  const first = istAt(days[0], 12);
  const last = istAt(days[days.length - 1], 12);
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...o }).format(d);
  const sameMonth = fmt(first, { month: "short" }) === fmt(last, { month: "short" });

  if (consecutive) {
    return sameMonth
      ? `${fmt(first, { weekday: "short" })} ${fmt(first, { day: "numeric" })} – ${fmt(last, { weekday: "short" })} ${fmt(last, { day: "numeric", month: "short" })}`
      : `${fmt(first, { day: "numeric", month: "short" })} – ${fmt(last, { day: "numeric", month: "short" })}`;
  }
  const nums = days.map((d) => fmt(istAt(d, 12), { day: "numeric" }));
  return `${nums.slice(0, -1).join(", ")} & ${nums[nums.length - 1]} ${fmt(last, { month: "short" })}`;
}

export function eventDayList(ev: { days?: string[] | null; startsAt: Date | string }) {
  return daysOf(ev);
}

export const rs = (n: number) => (n ? "₹" + n.toLocaleString("en-IN") : "Free");
