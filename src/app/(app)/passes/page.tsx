import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/lib/session";
import { getUserBookings } from "@/lib/queries";
import { friendlyDate } from "@/lib/utils";
import { Empty } from "@/components/Empty";
import { Ticket } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your passes" };

const BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-raised text-muted" },
  approved: { label: "On the list", cls: "bg-gold/15 text-gold" },
  checked_in: { label: "Checked in", cls: "bg-gold/15 text-gold" },
  waitlisted: { label: "Waitlist", cls: "bg-raised text-muted" },
  rejected: { label: "Not approved", cls: "bg-red/12 text-red-hot" },
  no_show: { label: "No-show", cls: "bg-red/12 text-red-hot" },
  cancelled: { label: "Cancelled", cls: "bg-raised text-faint" },
};

export default async function PassesPage() {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <Head />
        <div className="px-4">
          <div className="rounded-[18px] border border-line bg-surface p-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-raised">
              <Ticket className="size-5 text-muted" />
            </span>
            <p className="mt-3.5 text-[15px] font-semibold">Log in to see your passes</p>
            <p className="mx-auto mt-1.5 max-w-[32ch] text-[13px] leading-relaxed text-muted">
              Applied without an account? Open the link in your confirmation email — the pass lives there too.
            </p>
            <div className="mt-4 flex gap-2.5">
              <Link href="/login" className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-red text-[14px] font-semibold">
                Log in
              </Link>
              <Link href="/register" className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-raised text-[14px] font-semibold">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const list = await getUserBookings(user.id);

  return (
    <>
      <Head />
      {list.length === 0 ? (
        <Empty
          title="No passes yet"
          body="Apply to a night before 6 PM and your pass shows up here the moment it's approved."
          cta={{ href: "/nights", label: "See tonight's nights" }}
        />
      ) : (
        <ul className="space-y-3 px-4">
          {list.map((b) => {
            const badge = BADGE[b.status];
            return (
              <li key={b.id}>
                <Link
                  href={`/passes/${b.code}`}
                  className="flex gap-3.5 rounded-[18px] border border-line bg-surface p-3 active:bg-raised"
                >
                  <div className="relative size-[76px] shrink-0 overflow-hidden rounded-xl bg-raised">
                    {b.poster && <Image src={b.poster} alt="" fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-[14.5px] font-semibold">{b.eventTitle}</h3>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-muted">
                      {b.clubName} · {b.clubArea}
                    </p>
                    <p className="mt-1.5 text-[12px] text-faint">
                      {friendlyDate(b.startsAt)} · {b.totalGuests} guest{b.totalGuests > 1 ? "s" : ""} ·{" "}
                      <span className="tracking-[0.08em] text-muted">{b.code}</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="h-8" />
    </>
  );
}

function Head() {
  return (
    <header className="px-4 pb-4 pt-5">
      <h1 className="font-display text-[27px] font-extrabold tracking-tight">Your passes</h1>
      <p className="mt-1 text-[13px] text-muted">Everything you&apos;ve applied for, and where it stands.</p>
    </header>
  );
}
