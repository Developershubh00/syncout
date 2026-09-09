import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function rupees(n: number) {
  if (!n) return "Free";
  return "₹" + n.toLocaleString("en-IN");
}

const IST = "Asia/Kolkata";

export function fmtDate(d: Date | string, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "numeric",
    month: "short",
    ...opts,
  }).format(date);
}

export function fmtTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function fmtDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "short" }).format(date);
}

/** "Tonight" / "Tomorrow" / "Sat, 14 Jun" */
export function friendlyDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const key = (x: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(x);
  const now = new Date();
  const tmr = new Date(now.getTime() + 864e5);
  if (key(date) === key(now)) return "Tonight";
  if (key(date) === key(tmr)) return "Tomorrow";
  return `${fmtDay(date)}, ${fmtDate(date)}`;
}
