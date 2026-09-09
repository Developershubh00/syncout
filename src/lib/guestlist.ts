/**
 * Guestlist rules.
 * Applications for a night close at the cutoff hour (default 18:00 IST)
 * on the day of the event. After that the door list is printed.
 */

const IST_OFFSET_MIN = 330; // +05:30

function toIST(d: Date) {
  return new Date(d.getTime() + (IST_OFFSET_MIN + d.getTimezoneOffset()) * 60000);
}

export const CUTOFF_HOUR = Number(process.env.GUESTLIST_CUTOFF_HOUR ?? 18);

export type GuestlistWindow = {
  open: boolean;
  reason: "open" | "closed_for_tonight" | "event_passed" | "list_closed";
  closesAt: Date;
  message: string;
};

/** Cutoff instant = event day at CUTOFF_HOUR IST, expressed in UTC. */
export function cutoffFor(startsAt: Date, hour = CUTOFF_HOUR): Date {
  const ist = toIST(startsAt);
  const y = ist.getFullYear();
  const m = ist.getMonth();
  const d = ist.getDate();
  // Build the IST wall-clock cutoff, then shift back to UTC.
  return new Date(Date.UTC(y, m, d, hour, 0, 0) - IST_OFFSET_MIN * 60000);
}

export function guestlistWindow(
  startsAt: Date,
  guestlistOpen = true,
  hour = CUTOFF_HOUR,
  now = new Date()
): GuestlistWindow {
  const closesAt = cutoffFor(startsAt, hour);
  const label = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? " PM" : " AM"}`;

  if (!guestlistOpen)
    return { open: false, reason: "list_closed", closesAt, message: "Guestlist is closed for this night." };

  if (now.getTime() > startsAt.getTime() + 6 * 3600e3)
    return { open: false, reason: "event_passed", closesAt, message: "This night is over." };

  if (now.getTime() > closesAt.getTime())
    return {
      open: false,
      reason: "closed_for_tonight",
      closesAt,
      message: `Applications closed at ${label}. Doors run on the printed list tonight.`,
    };

  return {
    open: true,
    reason: "open",
    closesAt,
    message: `Apply before ${label} today to make tonight's list.`,
  };
}

/** Human countdown, e.g. "3h 12m left" */
export function timeLeft(to: Date, now = new Date()) {
  const ms = to.getTime() - now.getTime();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600e3);
  const m = Math.floor((ms % 3600e3) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export const ENTRY_TYPES = [
  {
    id: "stag_female" as const,
    label: "Girls",
    sub: "Solo or with friends",
    icon: "girls",
  },
  {
    id: "couple" as const,
    label: "Couple",
    sub: "One girl + one guy",
    icon: "couple",
  },
  {
    id: "stag_male" as const,
    label: "Guys",
    sub: "Limited spots, apply early",
    icon: "guys",
  },
] as const;

export type EntryTypeId = (typeof ENTRY_TYPES)[number]["id"];
