import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Clock, Music2, Check } from "lucide-react";
import { getNight, getEventCounts } from "@/lib/queries";
import { guestlistWindow } from "@/lib/guestlist";
import { getUser } from "@/lib/session";
import { friendlyDate, fmtTime } from "@/lib/utils";
import { BookingFlow } from "@/components/BookingFlow";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const n = await getNight((await params).slug);
  return { title: n ? `${n.title} · ${n.clubName}` : "Night" };
}

export default async function NightPage({ params }: { params: Promise<{ slug: string }> }) {
  const night = await getNight((await params).slug);
  if (!night) notFound();

  const [counts, user] = await Promise.all([getEventCounts(night.id), getUser()]);
  const win = guestlistWindow(new Date(night.startsAt), night.guestlistOpen, night.cutoffHour);

  const left = {
    stag_female: Math.max(0, night.femaleLimit - (counts.stag_female ?? 0)),
    couple: Math.max(0, night.coupleLimit - (counts.couple ?? 0)),
    stag_male: Math.max(0, night.maleLimit - (counts.stag_male ?? 0)),
  };

  return (
    <>
      <div className="relative aspect-[4/3] w-full">
        {night.poster && (
          <Image src={night.poster} alt="" fill priority sizes="512px" className="object-cover" />
        )}
        <div className="scrim absolute inset-x-0 bottom-0 h-3/4" />
        <Link
          href="/nights"
          aria-label="Back to nights"
          className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-ink/65 backdrop-blur"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <span className="absolute right-3 top-3 rounded-lg bg-red px-2.5 py-1 text-[12px] font-bold">
          {friendlyDate(night.startsAt)}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tight">
            {night.title}
          </h1>
          <Link
            href={`/clubs/${night.clubSlug}`}
            className="mt-1 flex items-center gap-1.5 text-[13px] text-muted"
          >
            <MapPin className="size-3.5" />
            {night.clubName} · {night.clubArea}
          </Link>
        </div>
      </div>

      <div className="flex gap-2.5 px-4 pt-4">
        <Chip icon={<Clock className="size-3.5" />}>{fmtTime(night.startsAt)} onwards</Chip>
        {night.musicType && <Chip icon={<Music2 className="size-3.5" />}>{night.musicType}</Chip>}
      </div>

      {night.description && (
        <p className="px-4 pt-4 text-[13.5px] leading-relaxed text-muted">{night.description}</p>
      )}

      {night.perks.length > 0 && (
        <section className="mx-4 mt-5 rounded-[18px] border border-gold/25 bg-gold/[0.06] p-4">
          <p className="text-[13px] font-semibold text-gold">If you&apos;re approved</p>
          <ul className="mt-2.5 space-y-2">
            {night.perks.map((p) => (
              <li key={p} className="flex gap-2.5 text-[13.5px] leading-snug">
                <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                {p}
              </li>
            ))}
          </ul>
        </section>
      )}

      <BookingFlow
        night={{
          id: night.id,
          slug: night.slug,
          title: night.title,
          clubName: night.clubName,
          startsAt: String(night.startsAt),
          femaleEnabled: night.femaleEnabled,
          coupleEnabled: night.coupleEnabled,
          maleEnabled: night.maleEnabled,
          femalePrice: night.femalePrice,
          couplePrice: night.couplePrice,
          malePrice: night.malePrice,
          dressCode: night.clubDressCode,
        }}
        left={left}
        window={{ open: win.open, message: win.message, closesAt: win.closesAt.toISOString() }}
        user={user}
      />
      <div className="h-6" />
    </>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted">
      {icon}
      {children}
    </span>
  );
}
