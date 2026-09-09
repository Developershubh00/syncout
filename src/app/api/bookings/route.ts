import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { db } from "@/db";
import { bookings, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { bookingSchema } from "@/lib/validators";
import { guestlistWindow } from "@/lib/guestlist";
import { getEventCounts } from "@/lib/queries";
import { getUser } from "@/lib/session";
import { sendMail, guestlistReceivedEmail } from "@/lib/mail";
import { friendlyDate } from "@/lib/utils";

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again" },
      { status: 422 }
    );
  }
  const d = parsed.data;

  const [ev] = await db.select().from(events).where(eq(events.id, d.eventId)).limit(1);
  if (!ev || !ev.isActive) {
    return NextResponse.json({ error: "That night is no longer listed" }, { status: 404 });
  }

  const win = guestlistWindow(new Date(ev.startsAt), ev.guestlistOpen, ev.cutoffHour);
  if (!win.open) return NextResponse.json({ error: win.message }, { status: 409 });

  const total = d.femaleCount + d.maleCount;
  if (total < 1) return NextResponse.json({ error: "Add at least one guest" }, { status: 422 });

  // entry type must match the head count
  if (d.entryType === "couple" && (d.femaleCount < 1 || d.maleCount < 1))
    return NextResponse.json({ error: "A couple needs at least one girl and one guy" }, { status: 422 });
  if (d.entryType === "stag_female" && d.maleCount > 0)
    return NextResponse.json({ error: "Pick the couple option to bring guys along" }, { status: 422 });
  if (d.entryType === "stag_male" && d.femaleCount > 0)
    return NextResponse.json({ error: "Pick the couple option to bring girls along" }, { status: 422 });

  const enabled =
    (d.entryType === "stag_female" && ev.femaleEnabled) ||
    (d.entryType === "couple" && ev.coupleEnabled) ||
    (d.entryType === "stag_male" && ev.maleEnabled);
  if (!enabled) return NextResponse.json({ error: "That list is closed for this night" }, { status: 409 });

  // capacity
  const counts = await getEventCounts(ev.id);
  const limit =
    d.entryType === "stag_female" ? ev.femaleLimit : d.entryType === "couple" ? ev.coupleLimit : ev.maleLimit;
  const left = limit - (counts[d.entryType] ?? 0);
  if (total > left) {
    return NextResponse.json(
      { error: left > 0 ? `Only ${left} spots left on this list` : "This list is full for tonight" },
      { status: 409 }
    );
  }

  const price =
    d.entryType === "stag_female" ? ev.femalePrice : d.entryType === "couple" ? ev.couplePrice : ev.malePrice;

  const user = await getUser();
  const code = makeCode();

  const [row] = await db
    .insert(bookings)
    .values({
      code,
      userId: user?.id ?? null,
      eventId: ev.id,
      clubId: ev.clubId,
      entryType: d.entryType,
      femaleCount: d.femaleCount,
      maleCount: d.maleCount,
      totalGuests: total,
      guestName: d.guestName.trim(),
      guestPhone: d.guestPhone.trim(),
      guestEmail: d.guestEmail.trim().toLowerCase(),
      guestInstagram: d.guestInstagram || null,
      arrivalTime: d.arrivalTime,
      notes: d.notes || null,
      companions: d.companions,
      amount: price * (d.entryType === "couple" ? 1 : total),
      status: "pending",
    })
    .returning({ code: bookings.code, id: bookings.id });

  await sendMail({
    to: d.guestEmail,
    subject: `Guestlist request received — ${ev.title}`,
    html: guestlistReceivedEmail({
      name: d.guestName,
      event: ev.title,
      club: "the venue",
      date: friendlyDate(ev.startsAt),
      code: row.code,
    }),
  });

  return NextResponse.json({ ok: true, code: row.code, id: row.id }, { status: 201 });
}
