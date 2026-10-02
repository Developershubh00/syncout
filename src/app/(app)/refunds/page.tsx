import type { Metadata } from "next";
import { LegalShell, Section } from "@/components/LegalShell";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Refund & Cancellation Policy", alternates: { canonical: "/refunds" } };

export default async function RefundsPage() {
  const s = await getSettings();
  return (
    <LegalShell title="Refund & Cancellation Policy" updated="2 October 2026" intro="Plain answers on what happens to your money if plans change.">
      <Section title="Guestlists">
        <p>Guestlist applications are free, so there&apos;s nothing to refund. If you can&apos;t make it, cancel by messaging us so the spot goes to someone else.</p>
      </Section>
      <Section title="Event tickets — full refund when">
        <p>• The event is cancelled, or moved to a date you can&apos;t attend, by the organiser.</p>
        <p>• You paid but we couldn&apos;t confirm your tickets (for example, the event sold out while your payment was being checked).</p>
        <p>• You were charged twice for the same booking.</p>
      </Section>
      <Section title="No refund when">
        <p>• You don&apos;t attend, arrive after entry closes, or change your mind after the booking is confirmed.</p>
        <p>• Entry is refused by the venue for age, ID, dress code or conduct reasons.</p>
      </Section>
      <Section title="How to ask">
        <p>
          Send your booking code and payment screenshot on{" "}
          <a href={waLink(s.whatsapp, "Hi SyncOut, I'd like a refund for booking ")} className="text-text underline">WhatsApp</a> or email {s.supportEmail}, ideally within 48 hours of the event. Approved refunds go back to the UPI account you paid from within 5–7 working days.
        </p>
      </Section>
    </LegalShell>
  );
}
