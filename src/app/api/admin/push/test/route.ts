import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/session";
import { alertAdmins } from "@/lib/admin-alerts";
import { pushEnabled } from "@/lib/push";
import { fail } from "@/lib/api";

export async function POST() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  if (!pushEnabled()) return fail("Push isn't set up — add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on Vercel", 503);
  const sent = await alertAdmins({ title: "Booking alerts are on", body: "You'll get a notification here for every new booking and payment.", url: "/admin", tag: "test" });
  return NextResponse.json({ ok: true, sent });
}
