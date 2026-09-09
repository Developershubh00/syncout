import { TabBar } from "@/components/TabBar";
import { ToastHost } from "@/components/ui/Toast";
import { DesktopNav } from "@/components/DesktopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { LiveBookings } from "@/components/LiveBookings";
import { getUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") ?? "";

  return (
    <ToastHost>
      <DesktopNav initials={initials} />
      {/* max-w-lg keeps the phone layout untouched; lg widens to the desktop grid */}
      <div className="mx-auto min-h-dvh max-w-lg lg:max-w-[1280px] lg:px-6">
        <main className="mb-tabbar lg:mb-0 lg:pt-8">{children}</main>
      </div>
      <SiteFooter />
      <TabBar />
      <LiveBookings signedIn={Boolean(user)} />
    </ToastHost>
  );
}
