import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Mail, Phone, MapPin, Briefcase, HeartHandshake, Instagram } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";
import { ContactForm } from "@/components/ContactForm";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Contact SyncOut — Bookings, Venues, Careers",
  description: "Talk to SyncOut on WhatsApp or email: booking help, listing your venue or event, careers, internships and volunteering in Delhi NCR.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const [s, { topic }] = await Promise.all([getSettings(), searchParams]);
  const rows = [
    { Icon: MessageCircle, label: "WhatsApp (fastest)", value: `+${s.whatsapp}`, href: waLink(s.whatsapp, "Hi SyncOut!") },
    { Icon: Mail, label: "Email", value: s.supportEmail, href: `mailto:${s.supportEmail}` },
    ...(s.supportPhone ? [{ Icon: Phone, label: "Phone", value: s.supportPhone, href: `tel:${s.supportPhone}` }] : []),
    ...(s.instagram ? [{ Icon: Instagram, label: "Instagram", value: `@${s.instagram}`, href: `https://instagram.com/${s.instagram}` }] : []),
    ...(s.businessAddress ? [{ Icon: MapPin, label: "Office", value: s.businessAddress, href: `https://maps.google.com/?q=${encodeURIComponent(s.businessAddress)}` }] : []),
  ];
  return (
    <div className="mx-auto max-w-[980px] px-4 pb-16 pt-6 lg:px-0">
      <h1 className="font-display text-[32px] font-extrabold tracking-tight lg:text-[42px]">Talk to us</h1>
      <p className="mt-2 max-w-[56ch] text-[14px] text-muted">Booking trouble, listing your venue or event, press, or joining the team — we&apos;re a message away.</p>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <ul className="space-y-2.5">
            {rows.map(({ Icon, label, value, href }) => (
              <li key={label}>
                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 transition-colors hover:border-white/20">
                  <span className="grid size-10 place-items-center rounded-xl bg-raised text-gold"><Icon className="size-[18px]" /></span>
                  <span className="min-w-0">
                    <span className="block text-[12px] text-faint">{label}</span>
                    <span className="block truncate text-[14px] font-semibold">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link href="/careers" className="flex items-center gap-2 rounded-[18px] border border-line bg-surface p-4 text-[13.5px] font-semibold hover:border-white/20"><Briefcase className="size-4 text-gold" /> Careers</Link>
            <Link href="/careers#volunteer" className="flex items-center gap-2 rounded-[18px] border border-line bg-surface p-4 text-[13.5px] font-semibold hover:border-white/20"><HeartHandshake className="size-4 text-gold" /> Volunteer</Link>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <div className="rounded-[22px] border border-line bg-surface p-5">
            <ContactForm initialTopic={topic} />
          </div>
        </Reveal>
      </div>
    </div>
  );
}
