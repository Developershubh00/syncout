import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventsListing, dandiyaFaq } from "@/components/events/EventsListing";
import { CATEGORIES } from "@/lib/event-labels";
import { cityName, isLiveCity, LIVE_CITIES } from "@/lib/cities";

export function generateStaticParams() {
  return LIVE_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const name = cityName(city);
  return {
    title: `Events in ${name} — Dandiya, Garba & Parties 2026`,
    description: `Upcoming events in ${name}: Dandiya nights, Garba festivals and parties. Book passes on SyncOut, pay by UPI, confirmed on WhatsApp.`,
    alternates: { canonical: `/events/in/${city}` },
  };
}

export default async function CityEvents({ params, searchParams }: { params: Promise<{ city: string }>; searchParams: Promise<{ category?: string }> }) {
  const [{ city }, { category }] = await Promise.all([params, searchParams]);
  if (!isLiveCity(city)) notFound();
  const name = cityName(city);
  return (
    <EventsListing
      heading={`Events in ${name}`}
      intro={`Everything coming up in ${name} — Navratri Dandiya and Garba nights first, then parties and festivals.`}
      city={city}
      category={CATEGORIES.some((c) => c.id === category) ? category : undefined}
      basePath="/events"
      faq={dandiyaFaq(city)}
    />
  );
}
