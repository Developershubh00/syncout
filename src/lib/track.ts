/** Conversion events for GA4 / Google Ads / Meta Pixel. No-ops when tags aren't loaded. */
type W = Window & {
  gtag?: (...a: unknown[]) => void;
  fbq?: (...a: unknown[]) => void;
  __soAds?: { id: string; label: string };
};

export function track(
  event: "begin_checkout" | "booking_requested" | "order_created" | "payment_proof_sent" | "whatsapp_click" | "app_installed",
  params: { value?: number; label?: string } = {}
) {
  if (typeof window === "undefined") return;
  const w = window as W;
  try {
    w.gtag?.("event", event, { ...params, ...(params.value ? { currency: "INR" } : {}) });
    if (event === "booking_requested" || event === "order_created") {
      if (w.__soAds?.id && w.__soAds.label)
        w.gtag?.("event", "conversion", { send_to: `${w.__soAds.id}/${w.__soAds.label}`, value: params.value ?? 0, currency: "INR" });
      w.fbq?.("track", "Lead", { value: params.value ?? 0, currency: "INR", content_name: params.label });
    }
    if (event === "begin_checkout") w.fbq?.("track", "InitiateCheckout");
    if (event === "payment_proof_sent") w.fbq?.("track", "AddPaymentInfo", { value: params.value ?? 0, currency: "INR" });
  } catch {
    /* never let tracking break a booking */
  }
}
