import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell, Section } from "@/components/LegalShell";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  const who = s.legalName || s.businessName;
  return (
    <LegalShell
      title="Privacy Policy"
      updated="2 October 2026"
      intro={`This explains what ${s.businessName} collects when you browse, apply to a guestlist or book an event, why, who sees it, and how to have it corrected or deleted. It's written to meet India's Digital Personal Data Protection Act, 2023.`}
    >
      <Section title="Who we are">
        <p>
          {who} (&ldquo;{s.businessName}&rdquo;, &ldquo;we&rdquo;) runs this website and app and decides how your personal data is used.
          {s.businessAddress ? ` Our address: ${s.businessAddress}.` : ""} You can reach us at {s.supportEmail}
          {s.supportPhone ? ` or ${s.supportPhone}` : ""}.
        </p>
      </Section>
      <Section title="What we collect">
        <p><b>Account details</b> — name, email, mobile number, and optionally gender, city and Instagram handle.</p>
        <p><b>Bookings</b> — the names and number of people in your group, your mobile and email, arrival time, notes you add, and the event or night you chose.</p>
        <p><b>Payments</b> — we don&apos;t collect or store card or bank details. For UPI payments we keep the amount, the UPI reference (UTR) you give us and the payment screenshot you send on WhatsApp, to verify your booking.</p>
        <p><b>Messages</b> — what you send through the contact form, job applications (including links you share) and WhatsApp.</p>
        <p><b>Device and usage</b> — a sign-in cookie, your notification subscription if you turn alerts on, and, where enabled, analytics and advertising measurement (Google Analytics, Google Ads, Meta Pixel) that record pages visited and bookings made.</p>
      </Section>
      <Section title="Why we use it">
        <p>To put you on guestlists and issue tickets; to share what a venue or organiser needs for entry; to verify payments; to send confirmations and updates by email, WhatsApp and app notifications; to prevent fraud and misuse; to understand which pages and ads work; and to meet legal obligations. We rely on your consent, which you give when you sign up or book, and you can withdraw it at any time.</p>
      </Section>
      <Section title="Who we share it with">
        <p><b>Venues and organisers</b> of the night you book — your name, group size, booking code and, if the door needs to reach you, your mobile number.</p>
        <p><b>Service providers</b> that run SyncOut for us — hosting (Vercel), database (Neon), email (Resend) and analytics/advertising providers — only to provide their service. Some club pages show posts embedded from Instagram; those load from Instagram, which may set its own cookies.</p>
        <p><b>Authorities</b> when the law requires it. We never sell your personal data.</p>
      </Section>
      <Section title="How long we keep it">
        <p>Account data is kept while your account is open. Booking and payment records are kept for as long as tax and accounting law requires. When you delete your account, your profile is erased and your past bookings are anonymised, except records we must keep by law.</p>
      </Section>
      <Section title="Your rights">
        <p>You can ask to see, correct or erase your data, withdraw consent, nominate someone to act for you, and raise a grievance. You can edit or delete your account yourself in <Link href="/profile/edit" className="text-text underline">Profile → Edit</Link>, or write to us.</p>
        <p>
          <b>Grievance Officer:</b> {s.grievanceOfficer || "Grievance Officer"}, {s.grievanceEmail || s.supportEmail}. We acknowledge grievances promptly and resolve them within the time the law requires.
        </p>
      </Section>
      <Section title="Age">
        <p>You must be 18 or older to create an account. Clubs and bars set their own age limits for entry and check ID at the door.</p>
      </Section>
      <Section title="Security and changes">
        <p>Data is encrypted in transit and access is limited to people who need it. If we change this policy, we&apos;ll update the date above and, for significant changes, tell you in the app.</p>
      </Section>
    </LegalShell>
  );
}
