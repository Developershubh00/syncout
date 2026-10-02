import { TabBar } from "@/components/TabBar";
import { ToastHost } from "@/components/ui/Toast";
import { DesktopNav } from "@/components/DesktopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { NotificationsProvider } from "@/components/notify/NotificationsProvider";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { AnnouncementPopup, AnnouncementBanner } from "@/components/Announcements";
import { PromoCapture } from "@/components/PromoCapture";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { Analytics } from "@/components/Analytics";
import { getUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { cachedAnnouncements } from "@/lib/cache";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, settings, announcements] = await Promise.all([getUser(), getSettings(), cachedAnnouncements()]);
  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") ?? "";
  const items = announcements.map((a) => ({ ...a, cities: a.cities ?? [] }));

  return (
    <ToastHost>
      <PwaProvider>
        <NotificationsProvider signedIn={Boolean(user)}>
          <DesktopNav initials={initials} />
          <AnnouncementBanner items={items} signedIn={Boolean(user)} />
          {/* max-w-lg keeps the phone layout untouched; lg widens to the desktop grid */}
          <div className="mx-auto min-h-dvh max-w-lg lg:max-w-[1280px] lg:px-6">
            <main className="mb-tabbar lg:mb-0 lg:pt-8">{children}</main>
          </div>
          <SiteFooter />
          <TabBar />
          <AnnouncementPopup items={items} signedIn={Boolean(user)} />
          <PromoCapture />
          {settings.installPrompt && <InstallPrompt />}
          {settings.whatsappFab && <WhatsAppFab number={settings.whatsapp} />}
          <Analytics gaId={settings.gaId} adsId={settings.adsId} adsLabel={settings.adsLabel} pixelId={settings.metaPixelId} />
        </NotificationsProvider>
      </PwaProvider>
    </ToastHost>
  );
}
