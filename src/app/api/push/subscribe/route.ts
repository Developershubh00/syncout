import { NextResponse } from "next/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getUser } from "@/lib/session";
import { pushSubscribeSchema } from "@/lib/validators";
import { readJson, guard } from "@/lib/api";

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Log in to turn on notifications" }, { status: 401 });
  const parsed = pushSubscribeSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Bad subscription" }, { status: 422 });

  const { endpoint, keys } = parsed.data;
  const ua = req.headers.get("user-agent")?.slice(0, 200) ?? null;
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: ua })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth, userAgent: ua },
    });
  return NextResponse.json({ ok: true });
}
