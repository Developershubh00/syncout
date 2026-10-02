import type { Metadata } from "next";
import { EventsListing, dandiyaFaq } from "@/components/events/EventsListing";

export const metadata: Metadata = {
  title: "Dandiya Nights 2026 in Delhi NCR — Delhi, Gurugram & Noida Passes",
  description:
    "All the big Dandiya and Garba nights for Navratri 2026 (11–19 Oct) in Delhi, Gurugram and Noida — dates, venues, prices. Book passes and pay by UPI.",
  keywords: ["dandiya night 2026", "dandiya delhi", "dandiya gurugram", "dandiya noida", "garba night delhi ncr", "navratri events 2026", "dandiya passes"],
  alternates: { canonical: "/dandiya" },
};

export default function DandiyaPage() {
  return (
    <EventsListing
      heading="Dandiya Nights 2026"
      intro="Every big Dandiya and Garba night in Delhi, Gurugram and Noida this Navratri — from JLN Stadium and India Expo Centre to CyberHub and club nights. Book in a minute, pay by UPI."
      basePath="/dandiya"
      faq={dandiyaFaq()}
    />
  );
}
