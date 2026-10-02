import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Section } from "@/components/LegalShell";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms of Use", alternates: { canonical: "/terms" } };

export default async function TermsPage() {
  const s = await getSettings();
  const who = s.legalName || s.businessName;
  return (
    <LegalShell title="Terms of Use" updated="2 October 2026" intro={`These terms apply when you use ${s.businessName} to apply to guestlists or book events. By using the site or app you agree to them.`}>
      <Section title="What SyncOut does">
        <p>{who} runs a platform that puts you on guestlists at partner venues and sells passes to events. Venues and organisers run the nights themselves and make the final decision on entry.</p>
      </Section>
      <Section title="Your account">
        <p>You must be 18 or older and give accurate details. Keep your password private — you&apos;re responsible for bookings made from your account. We may suspend accounts used for fraud, abuse or repeated no-shows.</p>
      </Section>
      <Section title="Guestlists">
        <p>Applying doesn&apos;t guarantee a spot. Lists close at the cutoff shown on each night (usually 6 PM IST on the day). An approved pass is valid for the people, date and arrival time shown, and the venue may stop honouring it after the stated time.</p>
      </Section>
      <Section title="Event tickets">
        <p>Prices are shown before you book. A booking is confirmed only after we verify your payment, and you&apos;ll see a confirmed ticket with a code and QR. Tickets are for the date and ticket type shown and can&apos;t be resold.</p>
        <p>Refunds follow our <Link href="/refunds" className="text-text underline">Refund &amp; Cancellation Policy</Link>.</p>
      </Section>
      <Section title="At the venue">
        <p>Carry a government photo ID for everyone in your group. Venues apply their own age limits, dress codes and house rules, and may refuse entry for safety or conduct reasons. Drink responsibly and never drink and drive.</p>
      </Section>
      <Section title="Acceptable use">
        <p>Don&apos;t misuse the service — no fake bookings, scraping, attempts to break security, or harassment of staff or guests.</p>
      </Section>
      <Section title="Liability">
        <p>SyncOut isn&apos;t responsible for what happens at a venue or event run by a third party. To the extent the law allows, our liability for any booking is limited to the amount you paid us for it.</p>
      </Section>
      <Section title="Governing law">
        <p>These terms are governed by the laws of India, and courts in New Delhi have jurisdiction. Questions: {s.supportEmail}.</p>
      </Section>
    </LegalShell>
  );
}
