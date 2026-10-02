import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { getAdmin, getStaffSession } from "./session";

export type DoorActor = { kind: "admin" | "staff"; name: string };

/** Admins and active door staff may look up and check in guests. Deactivating staff takes effect immediately. */
export async function getDoorActor(): Promise<DoorActor | null> {
  if (await getAdmin()) return { kind: "admin", name: "admin" };
  const s = await getStaffSession();
  if (!s) return null;
  const [row] = await db.select({ active: staff.isActive, name: staff.name }).from(staff).where(eq(staff.id, s.staffId)).limit(1).catch(() => []);
  return row?.active ? { kind: "staff", name: row.name } : null;
}
