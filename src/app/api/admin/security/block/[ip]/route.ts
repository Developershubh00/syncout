import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { unblockIp } from "@/lib/security/blocklist";
import { fail, guard } from "@/lib/api";

export async function DELETE(req: Request, { params }: { params: Promise<{ ip: string }> }) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await unblockIp(decodeURIComponent((await params).ip));
  return NextResponse.json({ ok: true });
}
