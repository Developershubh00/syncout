import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validators";
import { checkAdminCredentials } from "@/lib/auth";
import { createAdminSession } from "@/lib/session";

export async function POST(req: Request) {
  const parsed = adminLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const via = checkAdminCredentials(parsed.data);
  if (!via) {
    // constant-ish delay to blunt guessing
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Those credentials don't match" }, { status: 401 });
  }

  await createAdminSession(via);
  return NextResponse.json({ ok: true, via });
}
