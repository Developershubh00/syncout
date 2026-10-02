import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventsListing, dandiyaFaq } from "@/components/events/EventsListing";
import { cityName, isLiveCity, LIVE_CITIES } from "@/lib/cities";

export function generateStaticParams() {
  return LIVE_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const name = cityName(city);
  return {
    title: `Dandiya Nights in ${name} 2026 — Dates, Venues & Passes`,
    description: `Navratri 2026 Dandiya and Garba nights in ${name}: dates, venues and pass prices. Book on SyncOut, pay by UPI, confirmed on WhatsApp.`,
    keywords: [`dandiya ${name.toLowerCase()} 2026`, `dandiya night in ${name.toLowerCase()}`, `garba ${name.toLowerCase()}`, `navratri events ${name.toLowerCase()}`],
    alternates: { canonical: `/dandiya/${city}` },
  };
}

export default async function DandiyaCity({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  if (!isLiveCity(city)) notFound();
  const name = cityName(city);
  return (
    <EventsListing
      heading={`Dandiya in ${name}`}
      intro={`The Dandiya and Garba nights worth your Navratri in ${name}, 11–19 October 2026. Pick a night, choose your passes, pay by UPI.`}
      city={city}
      basePath="/dandiya"
      faq={dandiyaFaq(city)}
    />
  );
}
