import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, GraduationCap, HeartHandshake, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { getOpenings, type OpeningView } from "@/lib/careers";
import { JOB_TYPE_LABEL, WORK_MODE_LABEL } from "@/data/careers";
import { MotionCard, Reveal } from "@/components/motion/Reveal";
import { PartyBackground } from "@/components/fx/Backgrounds";
import { ApplyButton } from "@/components/ApplyForm";

export const metadata: Metadata = {
  title: "Careers, Internships & Volunteering at SyncOut — Delhi NCR",
  description: "Work in Delhi NCR nightlife and events: SDE-1, content and social editor, event planner, partnerships, internships and volunteer crew for Navratri. Apply in two minutes.",
  alternates: { canonical: "/careers" },
};

const GROUPS = [
  { id: "roles", title: "Open roles", sub: "Full-time, part-time and contract", Icon: Briefcase, match: (o: OpeningView) => ["full_time", "part_time", "contract"].includes(o.type) },
  { id: "internships", title: "Internships", sub: "Stipend, certificate, a path to a full-time role", Icon: GraduationCap, match: (o: OpeningView) => o.type === "internship" },
  { id: "volunteer", title: "Volunteer", sub: "Be part of the biggest nights of the season", Icon: HeartHandshake, match: (o: OpeningView) => o.type === "volunteer" },
];

export default async function CareersPage() {
  const openings = await getOpenings();
  return (
    <>
      <PartyBackground />
      <header className="px-4 pb-2 pt-8 lg:px-0">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-gold">
          <Sparkles className="size-3.5" /> We&apos;re hiring in Delhi NCR
        </p>
        <h1 className="mt-3 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight lg:text-[48px]">
          Build the nights <span className="text-shimmer">people remember</span>
        </h1>
        <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-muted">
          Engineers, editors, creators, planners and crew. Small team, real ownership, and every weekend you get to see what you built in action.
        </p>
        <nav className="mt-5 flex flex-wrap gap-2">
          {GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="flex items-center gap-1.5 rounded-full border border-line bg-ink/40 px-3.5 py-1.5 text-[13px] text-muted hover:text-text">
              <g.Icon className="size-3.5" /> {g.title}
            </a>
          ))}
        </nav>
      </header>

      {GROUPS.map((g) => {
        const list = openings.filter(g.match);
        if (!list.length) return null;
        return (
          <section key={g.id} id={g.id} className="scroll-mt-24 px-4 pt-10 lg:px-0">
            <Reveal>
              <h2 className="flex items-center gap-2 text-[22px]"><g.Icon className="size-5 text-gold" /> {g.title}</h2>
              <p className="mt-1 text-[13px] text-muted">{g.sub}</p>
            </Reveal>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((o, i) => (
                <MotionCard key={o.slug} index={i} columns={3}>
                  <Link href={`/careers/${o.slug}`} className="group flex h-full flex-col rounded-[20px] border border-line bg-surface/90 p-4 transition-colors hover:border-[#ff2bd6]/40">
                    <div className="flex items-center gap-2 text-[11.5px] font-semibold">
                      <span className="rounded-md bg-gold/12 px-1.5 py-0.5 text-gold">{JOB_TYPE_LABEL[o.type] ?? o.type}</span>
                      {o.team && <span className="text-faint">{o.team}</span>}
                    </div>
                    <h3 className="mt-2.5 text-[17px] leading-snug">{o.title}</h3>
                    {o.summary && <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-muted">{o.summary}</p>}
                    <p className="mt-auto flex items-center gap-1.5 pt-4 text-[12px] text-faint">
                      <MapPin className="size-3.5" /> {o.location} · {WORK_MODE_LABEL[o.workMode] ?? o.workMode}
                      <ArrowRight className="ml-auto size-4 text-muted transition-transform group-hover:translate-x-1" />
                    </p>
                  </Link>
                </MotionCard>
              ))}
            </div>
          </section>
        );
      })}

      <Reveal className="px-4 pt-12 lg:px-0">
        <div className="festive-panel rounded-[24px] border border-[#ff2bd6]/20 p-6">
          <h2 className="text-[20px]">Don&apos;t see your role?</h2>
          <p className="mt-1.5 max-w-[56ch] text-[13.5px] text-muted">Tell us what you&apos;d do at SyncOut. Great people get a conversation even when there&apos;s no listing.</p>
          <div className="mt-4">
            <ApplyButton openingId={null} roleTitle="Open application" kind="job" label="Send an open application" />
          </div>
        </div>
      </Reveal>
      <div className="h-12" />
    </>
  );
}
