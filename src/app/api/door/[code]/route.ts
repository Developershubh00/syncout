import { NextResponse } from "next/server";
import { getDoorActor } from "@/lib/door-auth";
import { getBookingByCode } from "@/lib/queries";
import { getOrder } from "@/lib/tevents";
import { dayLabel } from "@/lib/event-format";

/** Guestlist passes are 6 characters; event tickets are 7 and start with T. ?g=N = one friend's own pass. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!(await getDoorActor())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const code = (await params).code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const g = Number(new URL(req.url).searchParams.get("g")) || null;

  if (code.length === 7 && code.startsWith("T")) {
    const o = await getOrder(code);
    if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const admitted = Array.isArray(o.admitted) ? o.admitted : [];
    return NextResponse.json({
      kind: "ticket",
      id: o.id,
      code: o.code,
      status: o.status,
      ok: o.status === "confirmed" || o.status === "checked_in",
      guestName: o.name,
      guestPhone: o.phone,
      totalGuests: o.admits,
      admitted,
      guest: g && g >= 1 && g <= o.admits ? g : null,
      detail: `${o.quantity} × ${o.tierName}${o.day ? ` · ${dayLabel(o.day)}` : ""}`,
      eventTitle: o.eventTitle,
      clubName: o.venueName,
    });
  }

  const b = await getBookingByCode(code);
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    kind: "pass",
    id: b.id,
    code: b.code,
    status: b.status,
    ok: b.status === "approved" || b.status === "checked_in",
    guestName: b.guestName,
    guestPhone: b.guestPhone,
    totalGuests: b.totalGuests,
    admitted: [],
    guest: null,
    detail: `${b.femaleCount} girl${b.femaleCount === 1 ? "" : "s"} · ${b.maleCount} guy${b.maleCount === 1 ? "" : "s"}`,
    eventTitle: b.eventTitle,
    clubName: b.clubName,
  });
}
