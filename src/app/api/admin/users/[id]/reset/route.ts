import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { createResetLink } from "@/lib/password-reset";
import { fail, guard } from "@/lib/api";

/** A one-hour reset link the admin can send on WhatsApp — works even when email is off. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  return NextResponse.json({ ok: true, link: await createResetLink((await params).id) });
}
