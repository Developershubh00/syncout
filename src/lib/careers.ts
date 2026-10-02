import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { jobOpenings } from "@/db/schema";
import { DEFAULT_OPENINGS } from "@/data/careers";
import { safe } from "./queries";

export type OpeningView = {
  id: string | null; slug: string; title: string; team: string | null; type: string; location: string; workMode: string;
  summary: string | null; responsibilities: string[]; requirements: string[]; perks: string[];
};

const fromDefaults = (): OpeningView[] => DEFAULT_OPENINGS.map((o) => ({ ...o, id: null }));

/** Live openings; until any exist in the database, the defaults show (read-only) so the page is never empty. */
async function _openings(): Promise<OpeningView[]> {
  const rows = await db.select().from(jobOpenings).orderBy(asc(jobOpenings.sortOrder), asc(jobOpenings.title));
  if (!rows.length) return fromDefaults();
  return rows.filter((r) => r.isActive);
}

async function _opening(slug: string): Promise<OpeningView | null> {
  const [row] = await db.select().from(jobOpenings).where(eq(jobOpenings.slug, slug)).limit(1);
  if (row) return row.isActive ? row : null;
  const any = await db.select({ id: jobOpenings.id }).from(jobOpenings).limit(1);
  if (any.length) return null;
  return fromDefaults().find((o) => o.slug === slug) ?? null;
}

export const getOpenings = safe(_openings, fromDefaults());
export const getOpening = safe(_opening, null);
