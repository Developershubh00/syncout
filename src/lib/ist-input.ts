/** <input type="datetime-local"> values, always in IST whatever timezone the admin's device is in. */
export function toIstInput(d?: Date | string | null) {
  if (!d) return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  return new Date(t.getTime() + 330 * 60000).toISOString().slice(0, 16);
}

export function fromIstInput(v?: string | null) {
  if (!v) return null;
  const d = new Date(`${v.length === 16 ? v + ":00" : v}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** "today at 9 PM IST" as a datetime-local value. */
export function istTonightInput(hour = 21) {
  const day = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
  return `${day}T${String(hour).padStart(2, "0")}:00`;
}
