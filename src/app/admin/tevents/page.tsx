import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { adminEvents } from "@/lib/tevents";
import { TEventManager } from "@/components/admin/TEventManager";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  if (!(await getAdmin())) redirect("/admin");
  const rows = await adminEvents();
  return (
    <TEventManager
      initial={rows.map((e) => ({
        ...e,
        startsAt: new Date(e.startsAt).toISOString(),
        endsAt: e.endsAt ? new Date(e.endsAt).toISOString() : null,
      }))}
    />
  );
}
