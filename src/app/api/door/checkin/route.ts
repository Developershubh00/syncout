import { NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getDoorActor } from "@/lib/door-auth";
import { readJson, rowsOf } from "@/lib/api";

const schema = z.object({ code: z.string().min(4).max(10), g: z.number().int().min(1).max(50).optional().nullable() });

/**
 * Check in at the door — admins and door staff. For event tickets, g checks in
 * one friend's pass; without g, everyone not yet in. Atomic, so two phones
 * scanning the same QR can't both let it through.
 */
export async function POST(req: Request) {
  const actor = await getDoorActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 422 });
  const code = parsed.data.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const g = parsed.data.g ?? null;
  const by = `${actor.kind}:${actor.name}`.slice(0, 80);

  if (code.length === 7 && code.startsWith("T")) {
    const res = g
      ? await db.execute(sql`
          update ticket_orders
          set admitted = admitted || to_jsonb(${g}::int),
              status = case when jsonb_array_length(admitted) + 1 >= admits then 'checked_in' else status end,
              checked_in_at = coalesce(checked_in_at, now()),
              reviewed_by = ${by}
          where code = ${code} and status in ('confirmed', 'checked_in')
            and ${g}::int <= admits and not (admitted @> to_jsonb(${g}::int))
          returning admitted, admits, status`)
      : await db.execute(sql`
          update ticket_orders
          set admitted = (select coalesce(jsonb_agg(i), '[]'::jsonb) from generate_series(1, admits) i),
              status = 'checked_in', checked_in_at = coalesce(checked_in_at, now()), reviewed_by = ${by}
          where code = ${code} and status in ('confirmed', 'checked_in') and jsonb_array_length(admitted) < admits
          returning admitted, admits, status`);
    const row = rowsOf<{ admitted: number[] | string; admits: number; status: string }>(res)[0];
    if (!row) return NextResponse.json({ error: g ? `Guest ${g} is already in, or this ticket isn't confirmed` : "Everyone on this ticket is already in, or it isn't confirmed" }, { status: 409 });
    const admitted = typeof row.admitted === "string" ? JSON.parse(row.admitted) : row.admitted;
    return NextResponse.json({ ok: true, admitted, admits: Number(row.admits), status: row.status });
  }

  const res = await db.execute(sql`
    update bookings set status = 'checked_in', checked_in_at = now()
    where code = ${code} and status = 'approved'
    returning id`);
  if (!rowsOf(res).length) return NextResponse.json({ error: "Already checked in, or not approved" }, { status: 409 });
  return NextResponse.json({ ok: true, status: "checked_in" });
}
