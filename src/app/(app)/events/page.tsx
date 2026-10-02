import type { Metadata } from "next";
import { EventsListing, dandiyaFaq } from "@/components/events/EventsListing";
import { TopBar } from "@/components/TopBar";
import { CATEGORIES } from "@/lib/event-labels";
import { isLiveCity } from "@/lib/cities";

export const metadata: Metadata = {
  title: "Events in Delhi NCR — Dandiya, Garba & Parties",
  description:
    "Book Dandiya nights, Garba festivals and party events in Delhi, Gurugram and Noida. Pay by UPI, get confirmed on WhatsApp.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ category?: string; city?: string }> }) {
  const { category, city } = await searchParams;
  const cat = CATEGORIES.some((c) => c.id === category) ? category : undefined;
  return (
    <>
      <TopBar showCity={false} />
      <EventsListing
        heading="Events across Delhi NCR"
        intro="Dandiya and Garba nights for Navratri, plus parties and festivals in Delhi, Gurugram and Noida. Pick a night, pay by UPI, done."
        category={cat}
        city={city && isLiveCity(city) ? city : undefined}
        basePath="/events"
        faq={dandiyaFaq()}
      />
    </>
  );
}
