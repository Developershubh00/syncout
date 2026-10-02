import Link from "next/link";
import { getAdmin } from "@/lib/session";
import { ToastHost } from "@/components/ui/Toast";
import { AdminLogout } from "@/components/admin/AdminLogout";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminLive } from "@/components/admin/AdminLive";
import { AdminAlertsToggle } from "@/components/admin/AdminAlertsToggle";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { InstallButton } from "@/components/pwa/InstallButton";

// Its own installable app: "SyncOut Admin" opens straight to the dashboard.
export const metadata = {
  title: "Admin",
  manifest: "/admin-manifest.json",
  appleWebApp: { capable: true, title: "SyncOut Admin", statusBarStyle: "black-translucent" as const },
};
export const dynamic = "force-dynamic";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Guestlist" },
  { href: "/admin/orders", label: "Event bookings" },
  { href: "/admin/door", label: "Door" },
  { href: "/admin/tevents", label: "Events" },
  { href: "/admin/nights", label: "Nights" },
  { href: "/admin/clubs", label: "Clubs" },
  { href: "/admin/announcements", label: "Popups & banners" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/promos", label: "Promo codes" },
  { href: "/admin/waitlist", label: "Waitlist" },
  { href: "/admin/staff", label: "Door staff" },
  { href: "/admin/notify", label: "Message guests" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/careers", label: "Careers" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();

  if (!admin) {
    return (
      <ToastHost>
        <div className="mx-auto min-h-dvh max-w-3xl pb-16">{children}</div>
      </ToastHost>
    );
  }

  return (
    <ToastHost>
      <PwaProvider>
      <AdminLive />
      <div className="min-h-dvh lg:flex">
        {/* Desktop sidebar */}
        <aside className="hidden w-[212px] shrink-0 border-r border-line print:!hidden lg:flex lg:flex-col">
          <div className="px-5 py-5">
            <Link href="/admin" className="font-display text-[18px] font-extrabold tracking-tight">
              Sync<span className="text-red">Out</span>
            </Link>
            <p className="mt-0.5 text-[11px] font-semibold tracking-wide text-faint">ADMIN</p>
          </div>

          <AdminNav items={ADMIN_NAV} />

          <div className="mt-auto space-y-2 border-t border-line p-4">
            <AdminAlertsToggle />
            <InstallButton variant="pill" />
            <Link href="/" className="block text-[12.5px] text-muted hover:text-text">
              View site
            </Link>
            <AdminLogout />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Phone header — unchanged behaviour, just hidden on desktop */}
          <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-xl print:hidden lg:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Link href="/admin" className="font-display text-[18px] font-extrabold tracking-tight">
                Sync<span className="text-red">Out</span>
                <span className="ml-2 rounded-md bg-raised px-1.5 py-0.5 text-[10.5px] font-semibold text-muted">
                  ADMIN
                </span>
              </Link>
              <div className="ml-auto flex items-center gap-2">
                <AdminAlertsToggle compact />
                <Link href="/" className="text-[12.5px] text-muted">
                  View site
                </Link>
                <AdminLogout />
              </div>
            </div>
            <nav className="rail pb-2.5 pt-0.5">
              {ADMIN_NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-muted"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </header>

          <div className="mx-auto max-w-3xl pb-16 lg:max-w-none lg:px-8 lg:pb-10">{children}</div>
        </div>
      </div>
      </PwaProvider>
    </ToastHost>
  );
}
