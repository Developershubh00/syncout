import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { DoorScanner } from "@/components/admin/DoorScanner";

export const dynamic = "force-dynamic";

export default async function DoorPage() {
  if (!(await getAdmin())) redirect("/admin");

  return (
    <div className="px-4 pt-6">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight">Door</h1>
      <p className="mt-1.5 max-w-[42ch] text-[13.5px] leading-relaxed text-muted">
        Type the code from the guest&apos;s pass. Approved shows in gold — anything else, send them
        to the paid queue.
      </p>
      <DoorScanner />
    </div>
  );
}
