// Retired in v6 — unread notifications replace it (GET /api/notifications?popup=1).
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ decided: [] });
}
