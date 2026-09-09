import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { inArray } from "drizzle-orm";
import { z } from "zod";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  status: z.enum(["approved", "rejected", "waitlisted"]),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const { ids, status, reason } = parsed.data;

  // A decline with no reason reads as a shrug, so give it a default.
  const updated = await db
    .update(bookings)
    .set({
      status,
      reviewedAt: new Date(),
      rejectionReason:
        status === "rejected"
          ? reason || "The list filled up for this night."
          : null,
    })
    .where(inArray(bookings.id, ids))
    .returning({ id: bookings.id });

  return NextResponse.json({ ok: true, updated: updated.length });
}
