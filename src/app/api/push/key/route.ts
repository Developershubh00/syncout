import { NextResponse } from "next/server";
import { vapidPublicKey } from "@/lib/push";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ key: vapidPublicKey() });
}
