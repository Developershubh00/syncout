import { NextResponse } from "next/server";
import { getDoorActor } from "@/lib/door-auth";
import { ticketInfo } from "@/lib/ticket-info";

/** Look up any code for the door: guestlist passes (6) or event tickets (7, starting T). ?g=N = one friend's own pass. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!(await getDoorActor())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const t = await ticketInfo((await params).code);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const g = Number(new URL(req.url).searchParams.get("g")) || null;
  const row = (k: string) => t.rows.find(([key]) => key === k)?.[1];
  return NextResponse.json({
    kind: t.kind,
    code: t.code,
    status: t.status,
    ok: t.ok,
    guestName: t.name,
    guestPhone: t.phone,
    totalGuests: t.admits,
    admitted: t.kind === "ticket" ? t.admitted : [],
    guest: t.kind === "ticket" && g && g >= 1 && g <= t.admits ? g : null,
    detail: t.kind === "ticket" ? `${row("Tickets")} · ${row("Date")}` : row("Group") ?? "",
    eventTitle: t.title,
    clubName: t.venue,
    rows: t.rows.filter(([k]) => !["Booked by", "Name", "Event", "Night"].includes(k)),
  });
}
