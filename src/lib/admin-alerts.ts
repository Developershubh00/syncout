import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { adminDevices } from "@/db/schema";
import { pushToEndpoints, type PushPayload } from "./push";

/** A push to every admin phone/laptop that turned on booking alerts. Never throws. */
export async function alertAdmins(p: PushPayload) {
  try {
    const devices = await db.select().from(adminDevices);
    if (!devices.length) return 0;
    const { sent, dead } = await pushToEndpoints(devices, p);
    if (dead.length) await db.delete(adminDevices).where(inArray(adminDevices.endpoint, dead));
    return sent;
  } catch (e) {
    console.error("[admin alert]", (e as Error).message);
    return 0;
  }
}
