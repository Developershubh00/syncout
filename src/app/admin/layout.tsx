import Link from "next/link";
import { getAdmin } from "@/lib/session";
import { ToastHost } from "@/components/ui/Toast";
import { AdminLogout } from "@/components/admin/AdminLogout";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Guestlist" },
  { href: "/admin/door", label: "Door" },
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/nights", label: "Nights" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();

  return (
    <ToastHost>
      <div className="mx-auto min-h-dvh max-w-3xl pb-16">
        <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link href="/admin" className="font-display text-[18px] font-extrabold tracking-tight">
              Sync<span className="text-red">Out</span>
              <span className="ml-2 rounded-md bg-raised px-1.5 py-0.5 text-[10.5px] font-semibold text-muted">
                ADMIN
              </span>
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <Link href="/" className="text-[12.5px] text-muted">View site</Link>
              {admin && <AdminLogout />}
            </div>
          </div>
          {admin && (
            <nav className="rail pb-2.5 pt-0.5">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-muted"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          )}
        </header>
        {children}
      </div>
    </ToastHost>
  );
}
