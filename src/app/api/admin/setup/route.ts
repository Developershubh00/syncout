import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/session";
import { upgradeDatabase, missingTables } from "@/db/upgrade-core";
import { seedNavratri, seedNights } from "@/db/seed-core";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail } from "@/lib/api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({ action: z.enum(["upgrade", "events", "nights"]) });

/** One-click versions of db:upgrade / db:seed. All add-only and safe to repeat. */
export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return fail("Unknown action", 422);

  try {
    if (parsed.data.action === "upgrade") {
      const { applied } = await upgradeDatabase();
      bust(...Object.values(TAGS));
      return NextResponse.json({ ok: true, message: applied.length ? `Database upgraded (${applied.length} step).` : "Database was already up to date." });
    }

    const missing = await missingTables();
    if (missing.length) return fail("Set up the database first (missing tables).", 409);

    if (parsed.data.action === "events") {
      const added = await seedNavratri();
      bust(TAGS.events, TAGS.announcements, TAGS.settings);
      return NextResponse.json({ ok: true, message: added ? `${added} Navratri events added, plus the Dandiya popup.` : "Navratri events were already there." });
    }

    const added = await seedNights();
    bust(TAGS.nights);
    return NextResponse.json({ ok: true, message: added ? `${added} nights added for the next 2 weeks.` : "The next 2 weeks already have nights." });
  } catch (e) {
    console.error("[setup]", e);
    return fail((e as Error).message.slice(0, 300), 500);
  }
}
