/** Calendar links — client-safe. */
const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function googleCalendarUrl(o: { title: string; start: Date; end: Date; location: string; details: string }) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: o.title,
    dates: `${fmt(o.start)}/${fmt(o.end)}`,
    location: o.location,
    details: o.details,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function icsFile(o: { uid: string; title: string; start: Date; end: Date; location: string; details: string; url: string }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SyncOut//Tickets//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${o.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(o.start)}`,
    `DTEND:${fmt(o.end)}`,
    `SUMMARY:${esc(o.title)}`,
    `LOCATION:${esc(o.location)}`,
    `DESCRIPTION:${esc(o.details)}`,
    `URL:${o.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(o.title)} tonight`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
