import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Check, Gift, ListChecks } from "lucide-react";
import { getOpening } from "@/lib/careers";
import { getSettings } from "@/lib/settings";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/data/careers";
import { JsonLd } from "@/components/JsonLd";
import { ApplyButton } from "@/components/ApplyForm";
import { Reveal } from "@/components/motion/Reveal";
import { absUrl, SITE } from "@/lib/site";

const EMPLOYMENT: Record<string, string> = { full_time: "FULL_TIME", part_time: "PART_TIME", contract: "CONTRACTOR", internship: "INTERN", volunteer: "VOLUNTEER" };

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const o = await getOpening((await params).slug);
  if (!o) return { title: "Careers" };
  return {
    title: `${o.title} — ${JOB_TYPE_LABEL[o.type] ?? ""} at SyncOut, ${o.location}`,
    description: o.summary ?? undefined,
    alternates: { canonical: `/careers/${o.slug}` },
  };
}

export default async function OpeningPage({ params }: { params: Promise<{ slug: string }> }) {
  const [o, s] = await Promise.all([getOpening((await params).slug), getSettings()]);
  if (!o) notFound();
  const kind = o.type === "internship" ? "internship" : o.type === "volunteer" ? "volunteer" : "job";
  const now = new Date();

  return (
    <article className="mx-auto max-w-[760px] px-4 pb-16 pt-5 lg:px-0">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "JobPosting",
          title: o.title,
          description: [o.summary, ...o.responsibilities, ...o.requirements].filter(Boolean).join(" "),
          datePosted: now.toISOString().slice(0, 10),
          validThrough: new Date(now.getTime() + 60 * 864e5).toISOString(),
          employmentType: EMPLOYMENT[o.type] ?? "OTHER",
          hiringOrganization: { "@type": "Organization", name: s.legalName || s.businessName, sameAs: SITE.url, logo: absUrl("/icons/icon-512.png") },
          jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: "New Delhi", addressRegion: "Delhi", addressCountry: "IN" } },
          ...(o.workMode === "remote" ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "India" } } : {}),
          directApply: true,
          url: absUrl(`/careers/${o.slug}`),
        }}
      />
      <Link href="/careers" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-text"><ChevronLeft className="size-4" /> All roles</Link>
      <Reveal>
        <p className="mt-6 flex flex-wrap items-center gap-2 text-[12px] font-semibold">
          <span className="rounded-md bg-gold/12 px-1.5 py-0.5 text-gold">{JOB_TYPE_LABEL[o.type] ?? o.type}</span>
          {o.team && <span className="text-faint">{o.team}</span>}
          <span className="flex items-center gap-1 text-faint"><MapPin className="size-3.5" /> {o.location} · {WORK_MODE_LABEL[o.workMode] ?? o.workMode}</span>
        </p>
        <h1 className="mt-3 font-display text-[32px] font-extrabold leading-tight tracking-tight lg:text-[42px]">{o.title}</h1>
        {o.summary && <p className="mt-3 text-[15px] leading-relaxed text-white/80">{o.summary}</p>}
        <div className="mt-6"><ApplyButton openingId={o.id} roleTitle={o.title} kind={kind} label={kind === "volunteer" ? "Join the crew" : "Apply now"} /></div>
      </Reveal>
      {[
        { title: "What you'll do", Icon: ListChecks, items: o.responsibilities },
        { title: "What we're looking for", Icon: Check, items: o.requirements },
        { title: "What you get", Icon: Gift, items: o.perks },
      ].map((sec, i) =>
        sec.items.length ? (
          <Reveal key={sec.title} delay={i * 0.05}>
            <section className="mt-8 rounded-[20px] border border-line bg-surface p-5">
              <h2 className="flex items-center gap-2 text-[17px]"><sec.Icon className="size-4 text-gold" /> {sec.title}</h2>
              <ul className="mt-3 space-y-2">
                {sec.items.map((it) => (
                  <li key={it} className="flex gap-2.5 text-[14px] leading-relaxed text-white/80">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-red" />
                    {it}
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        ) : null
      )}
    </article>
  );
}
