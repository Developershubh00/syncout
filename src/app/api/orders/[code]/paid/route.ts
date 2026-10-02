import { NextResponse } from "next/server";
import { db } from "@/db";
import { ticketOrders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin, getUser } from "@/lib/session";
import { hasAccess } from "@/lib/access";
import { orderPaidSchema } from "@/lib/validators";
import { readJson, fail } from "@/lib/api";

/** The guest says they've paid (or messaged us on WhatsApp). Admin still verifies. */
export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  const parsed = orderPaidSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail("Bad request", 422);

  const [order] = await db.select().from(ticketOrders).where(eq(ticketOrders.code, code)).limit(1);
  if (!order) return fail("Booking not found", 404);

  const [user, admin] = await Promise.all([getUser(), getAdmin()]);
  const allowed = admin || (user && order.userId === user.id) || hasAccess("ticket", code, parsed.data.k);
  if (!allowed) return fail("Open this booking from your link to update it", 403);

  if (!["awaiting_payment", "payment_submitted"].includes(order.status)) return NextResponse.json({ ok: true, status: order.status });

  const utr = parsed.data.utr?.trim() || order.utr;
  await db
    .update(ticketOrders)
    .set({
      whatsappAt: new Date(),
      utr,
      status: parsed.data.enquiry ? order.status : "payment_submitted",
    })
    .where(eq(ticketOrders.id, order.id));

  return NextResponse.json({ ok: true, status: parsed.data.enquiry ? order.status : "payment_submitted" });
}
