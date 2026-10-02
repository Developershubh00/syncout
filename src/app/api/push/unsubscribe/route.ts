import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { readJson } from "@/lib/api";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = z.object({ endpoint: z.string().max(1000) }).safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 422 });
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, parsed.data.endpoint)));
  return NextResponse.json({ ok: true });
}
