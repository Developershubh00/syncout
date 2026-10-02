import { CalendarPlus, Download } from "lucide-react";
import { googleCalendarUrl } from "@/lib/calendar";

export function AddToCalendar({ title, start, end, location, details, icsHref }: { title: string; start: Date; end: Date; location: string; details: string; icsHref: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={googleCalendarUrl({ title, start, end, location, details })} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-raised text-[13px] font-semibold">
        <CalendarPlus className="size-4 text-gold" /> Google Calendar
      </a>
      <a href={icsHref} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-raised text-[13px] font-semibold">
        <Download className="size-4 text-gold" /> Apple / Outlook
      </a>
    </div>
  );
}
