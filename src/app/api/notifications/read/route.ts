import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getUser } from "@/lib/session";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { readJson } from "@/lib/api";

const schema = z.object({ ids: z.array(z.string().uuid()).max(100).optional(), all: z.boolean().optional() });

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 422 });

  const { ids, all } = parsed.data;
  if (!all && !ids?.length) return NextResponse.json({ ok: true });

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, user.id),
        isNull(notifications.readAt),
        all ? undefined : inArray(notifications.id, ids!)
      )
    );
  return NextResponse.json({ ok: true });
}
