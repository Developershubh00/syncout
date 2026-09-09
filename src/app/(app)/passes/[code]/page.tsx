import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Clock, Check, Hourglass, XCircle, Shirt } from "lucide-react";
import { getBookingByCode } from "@/lib/queries";
import { friendlyDate, fmtTime } from "@/lib/utils";
import { cutoffFor } from "@/lib/guestlist";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your pass" };

const LOOK = {
  pending: { label: "Waiting on approval", tone: "text-muted", Icon: Hourglass, ring: "border-line" },
  approved: { label: "You're on the list", tone: "text-gold", Icon: Check, ring: "border-gold/45" },
  checked_in: { label: "Checked in", tone: "text-gold", Icon: Check, ring: "border-gold/45" },
  waitlisted: { label: "On the waitlist", tone: "text-muted", Icon: Hourglass, ring: "border-line" },
  rejected: { label: "Not this time", tone: "text-red-hot", Icon: XCircle, ring: "border-red/40" },
  no_show: { label: "Marked no-show", tone: "text-red-hot", Icon: XCircle, ring: "border-red/40" },
  cancelled: { label: "Cancelled", tone: "text-muted", Icon: XCircle, ring: "border-line" },
} as const;

export default async function PassPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const b = await getBookingByCode(code.toUpperCase());
  if (!b) notFound();

  const look = LOOK[b.status];
  const cutoff = cutoffFor(new Date(b.startsAt), b.cutoffHour);
  const approved = b.status === "approved" || b.status === "checked_in";

  return (
    <>
      <header className="flex items-center gap-2 px-4 py-3.5">
        <Link href="/passes" aria-label="Back to passes" className="-ml-1.5 rounded-full p-1.5 active:bg-raised">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-[17px]">Your pass</h1>
      </header>

      {/* ── the stub ── */}
      <div className="px-4">
        <div className={`overflow-hidden rounded-[22px] border bg-surface ${look.ring}`}>
          {/* top half */}
          <div className="p-5">
            <div className={`flex items-center gap-1.5 text-[12.5px] font-semibold ${look.tone}`}>
              <look.Icon className="size-4" />
              {look.label}
            </div>

            <h2 className="mt-3 font-display text-[24px] font-extrabold leading-tight tracking-tight">
              {b.eventTitle}
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted">
              <MapPin className="size-3.5" />
              {b.clubName} · {b.clubArea}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
              <Clock className="size-3.5" />
              {friendlyDate(b.startsAt)} · doors {fmtTime(b.startsAt)} · reaching {b.arrivalTime}
            </p>
          </div>

          {/* tear line */}
          <div className="stub-notch h-6">
            <div className="dashed-tear mx-[26px] translate-y-3" />
          </div>

          {/* bottom half — the code */}
          <div className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-3">
              <Cell k="Name" v={b.guestName} />
              <Cell k="Guests" v={String(b.totalGuests)} />
              <Cell
                k="Entry"
                v={b.entryType === "couple" ? "Couple" : b.entryType === "stag_female" ? "Girls" : "Guys"}
              />
            </div>

            <div
              className={`mt-4 rounded-2xl border px-4 py-3.5 text-center ${
                approved ? "border-gold/40 bg-gold/[0.07]" : "border-line bg-raised"
              }`}
            >
              <p className="text-[11.5px] text-muted">Show this at the door</p>
              <p
                className={`mt-1 font-display text-[34px] font-extrabold leading-none tracking-[0.14em] ${
                  approved ? "text-gold" : "text-text"
                }`}
              >
                {approved ? b.code : "· · · · · ·"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!approved && (
        <p className="px-4 pt-2 text-center text-[12.5px] text-muted">
          Your code appears here once a host approves you. Nothing to show at the
          door until then.
        </p>
      )}

      {/* ── status detail ── */}
      <section className="mt-5 px-4">
        {b.status === "pending" && (
          <Note title="We confirm by 6 PM">
            Your request is with the venue. You&apos;ll get an email at{" "}
            <span className="text-text">{b.guestEmail}</span> by {fmtTime(cutoff)} on{" "}
            {friendlyDate(b.startsAt)} either way. Nothing is charged.
          </Note>
        )}

        {approved && (
          <div className="rounded-[18px] border border-gold/25 bg-gold/[0.06] p-4">
            <p className="text-[13px] font-semibold text-gold">The night is on us</p>
            <ul className="mt-2.5 space-y-2">
              {(b.perks.length ? b.perks : ["Free entry on the list", "Complimentary food", "House drinks covered"]).map(
                (p) => (
                  <li key={p} className="flex gap-2.5 text-[13.5px] leading-snug">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" />
                    {p}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

        {b.status === "rejected" && (
          <Note title="The list filled up">
            {b.rejectionReason ?? "We couldn't fit this group in. Nothing was charged — apply for another night and you'll be higher in the queue."}
          </Note>
        )}

        {b.status === "waitlisted" && (
          <Note title={"You're next in line"}>
            If a group drops out before 6 PM we&apos;ll move you up and email you straight away.
          </Note>
        )}
      </section>

      {/* ── door rules ── */}
      <section className="mt-5 px-4">
        <div className="rounded-[18px] border border-line bg-surface p-4">
          <p className="text-[13px] font-semibold">At the door</p>
          <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-muted">
            <li className="flex gap-2.5">
              <Shirt className="mt-0.5 size-4 shrink-0 text-faint" />
              {b.clubDressCode ?? "Smart casuals. No shorts, no slippers."}
            </li>
            <li>Carry a government photo ID for everyone in the group. 21+ only.</li>
            <li>Reach by 10:30 PM — the list stops being honoured after that.</li>
            <li>Entry always stays at the venue&apos;s discretion.</li>
          </ul>
          {b.clubAddress && (
            <a
              href={b.clubMapUrl ?? `https://maps.google.com/?q=${encodeURIComponent(b.clubName + " " + b.clubAddress)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3.5 flex h-11 items-center justify-center rounded-xl bg-raised text-[13.5px] font-semibold"
            >
              Open in Maps
            </a>
          )}
        </div>
      </section>

      <div className="h-8" />
    </>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-faint">{k}</p>
      <p className="truncate text-[13.5px] font-medium">{v}</p>
    </div>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-line bg-surface p-4">
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{children}</p>
    </div>
  );
}
