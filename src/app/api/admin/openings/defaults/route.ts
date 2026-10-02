import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { seedCareers } from "@/db/seed-core";
import { fail } from "@/lib/api";

export async function POST() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const added = await seedCareers();
  return NextResponse.json({ ok: true, message: added ? `${added} roles added — edit them below.` : "Default roles were already there." });
}
