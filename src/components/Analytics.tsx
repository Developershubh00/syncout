"use client";
import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const clean = (s?: string) => (s ?? "").replace(/[^A-Za-z0-9_\-]/g, "");

/** GA4, Google Ads and Meta Pixel — each loads only when its ID is set in Admin → Settings. */
export function Analytics({ gaId, adsId, adsLabel, pixelId }: { gaId?: string; adsId?: string; adsLabel?: string; pixelId?: string }) {
  const ga = clean(gaId);
  const ads = clean(adsId);
  const label = clean(adsLabel);
  const px = clean(pixelId);
  const path = usePathname();

  useEffect(() => {
    (window as unknown as { __soAds?: { id: string; label: string } }).__soAds = { id: ads, label };
  }, [ads, label]);

  useEffect(() => {
    const w = window as unknown as { fbq?: (...a: unknown[]) => void };
    if (px) w.fbq?.("track", "PageView");
  }, [path, px]);

  const tag = ga || ads;
  if (!tag && !px) return null;

  return (
    <>
      {tag && <Script src={`https://www.googletagmanager.com/gtag/js?id=${tag}`} strategy="afterInteractive" />}
      {tag && (
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${
            ga ? `gtag('config','${ga}');` : ""
          }${ads ? `gtag('config','${ads}');` : ""}`}
        </Script>
      )}
      {px && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${px}');`}
        </Script>
      )}
    </>
  );
}
