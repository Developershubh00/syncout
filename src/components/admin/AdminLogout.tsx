"use client";
import { useRouter } from "next/navigation";

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin");
        router.refresh();
      }}
      className="rounded-lg border border-line px-2.5 py-1 text-[12.5px] text-muted active:bg-raised"
    >
      Sign out
    </button>
  );
}
