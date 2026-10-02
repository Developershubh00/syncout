import type { Metadata } from "next";
import { ToastHost } from "@/components/ui/Toast";
import { getDoorActor } from "@/lib/door-auth";
import { DoorScanner } from "@/components/admin/DoorScanner";
import { StaffLogin, StaffLogout } from "@/components/StaffLogin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Door check-in", robots: { index: false } };

/** The scanner for door staff — no admin access, nothing but check-in. QR codes on tickets open this page. */
export default async function DoorPage({ searchParams }: { searchParams: Promise<{ code?: string; g?: string }> }) {
  const [actor, { code, g }] = await Promise.all([getDoorActor(), searchParams]);
  return (
    <ToastHost>
      <main className="mx-auto min-h-screen max-w-[560px] px-4 pb-16 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
        <header className="flex items-center justify-between">
          <span className="font-display text-[20px] font-extrabold">Sync<span className="text-red">Out</span> <span className="text-[13px] font-semibold text-muted">· Door</span></span>
          {actor?.kind === "staff" && <StaffLogout />}
        </header>
        {actor ? (
          <>
            <p className="mt-4 text-[13px] text-muted">Signed in as <b className="text-text">{actor.kind === "admin" ? "admin" : actor.name}</b>. Scan a ticket or type the code.</p>
            <DoorScanner initialCode={code} initialGuest={Number(g) || null} />
          </>
        ) : (
          <StaffLogin />
        )}
      </main>
    </ToastHost>
  );
}
