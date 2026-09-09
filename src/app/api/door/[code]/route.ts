import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { getBookingByCode } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = await getBookingByCode((await params).code.toUpperCase());
  if (!b) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: b.id,
    code: b.code,
    status: b.status,
    guestName: b.guestName,
    guestPhone: b.guestPhone,
    totalGuests: b.totalGuests,
    femaleCount: b.femaleCount,
    maleCount: b.maleCount,
    eventTitle: b.eventTitle,
    clubName: b.clubName,
  });
}
