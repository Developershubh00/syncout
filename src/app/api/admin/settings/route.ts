import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { settingsSchema } from "@/lib/validators";
import { getSettingsFresh, saveSettings } from "@/lib/settings";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, guard } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  return NextResponse.json(await getSettingsFresh());
}

export async function PUT(req: Request) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = settingsSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await saveSettings(parsed.data);
  bust(TAGS.settings);
  return NextResponse.json({ ok: true, settings: await getSettingsFresh() });
}
