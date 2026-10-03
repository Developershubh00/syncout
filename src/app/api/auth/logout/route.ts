import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { clearUserSession } from "@/lib/session";

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  await clearUserSession();
  return NextResponse.json({ ok: true });
}
