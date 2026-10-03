import Link from "next/link";
import { getUser } from "@/lib/session";
import { getUserBookings } from "@/lib/queries";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { KeyRound } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";
import { ChevronRight, Ticket, Disc3, LifeBuoy, Sparkles, Bell, UserPen, Briefcase, ShieldCheck as Shield } from "lucide-react";
import { InstallButton } from "@/components/pwa/InstallButton";
import { PushToggle } from "@/components/pwa/PushToggle";
import { SoundToggle } from "@/components/SoundToggle";

export const dynamic = "force-dynamic";
export const metadata = { title: "You" };

export default async function ProfilePage() {
  const user = await getUser();
  const [bookings, needsPassword] = user
    ? await Promise.all([
        getUserBookings(user.id),
        db.select({ set: users.passwordSet }).from(users).where(eq(users.id, user.id)).limit(1).then((r) => r[0]?.set === false).catch(() => false),
      ])
    : [[], false];
  const approved = bookings.filter((b) => b.status === "approved" || b.status === "checked_in").length;

  return (
    <>
      <header className="px-4 pb-5 pt-6">
        {user ? (
          <>
            <div className="flex items-center gap-3.5">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-red font-display text-[22px] font-extrabold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate font-display text-[22px] font-extrabold tracking-tight">{user.name}</h1>
                <p className="truncate text-[13px] text-muted">{user.email}</p>
              </div>
            </div>
            {needsPassword && (
              <Link href="/profile/edit" className="mt-4 flex items-center gap-3 rounded-[18px] border border-gold/40 bg-gold/[0.07] p-3.5">
                <KeyRound className="size-5 shrink-0 text-gold" />
                <span className="min-w-0 flex-1 text-[13px] leading-snug"><b>Set a password</b> — you&apos;re logged in on this phone; a password lets you log in anywhere.</span>
                <ChevronRight className="size-4 text-muted" />
              </Link>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Stat n={bookings.length} label="Applications" />
              <Stat n={approved} label="Nights approved" gold />
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-[27px] font-extrabold tracking-tight">You</h1>
            <p className="mt-1.5 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
              Log in to keep your passes in one place and skip the form next time.
            </p>
            <div className="mt-4 flex gap-2.5">
              <Link href="/login" className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-red text-[14px] font-semibold">
                Log in
              </Link>
              <Link href="/register" className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-raised text-[14px] font-semibold">
                Sign up
              </Link>
            </div>
          </>
        )}
      </header>

      <nav className="px-4">
        <ul className="divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface">
          <Item href="/passes" icon={<Ticket className="size-[18px]" />}>Passes &amp; tickets</Item>
          <Item href="/events" icon={<Sparkles className="size-[18px]" />}>Events &amp; Dandiya</Item>
          {user && <Item href="/notifications" icon={<Bell className="size-[18px]" />}>Notifications</Item>}
          {user && <Item href="/profile/edit" icon={<UserPen className="size-[18px]" />}>Edit profile &amp; password</Item>}
          <Item href="/clubs" icon={<Disc3 className="size-[18px]" />}>Browse clubs</Item>
          <Item href="/contact" icon={<LifeBuoy className="size-[18px]" />}>Help &amp; contact</Item>
          <Item href="/careers" icon={<Briefcase className="size-[18px]" />}>Careers, internships &amp; volunteering</Item>
          <Item href="/privacy" icon={<Shield className="size-[18px]" />}>Privacy, terms &amp; refunds</Item>
        </ul>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface empty:hidden">
          <li className="empty:hidden"><InstallButton /></li>
          {user && <li className="empty:hidden"><PushToggle /></li>}
          <li><SoundToggle /></li>
        </ul>
      </nav>

      {user && (
        <div className="px-4 pt-5">
          <LogoutButton />
        </div>
      )}

      <p className="px-4 pt-8 text-[12px] leading-relaxed text-faint">
        SyncOut runs guestlists, not the venues. Doors make the final call on entry, and lists close
        at 6 PM on the day.
      </p>
      <div className="h-8" />
    </>
  );
}

function Stat({ n, label, gold }: { n: number; label: string; gold?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3.5">
      <p className={`font-display text-[24px] font-extrabold leading-none ${gold ? "text-gold" : ""}`}>{n}</p>
      <p className="mt-1.5 text-[12px] text-muted">{label}</p>
    </div>
  );
}

function Item({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-raised">
        <span className="text-muted">{icon}</span>
        <span className="flex-1 text-[14.5px]">{children}</span>
        <ChevronRight className="size-4 text-faint" />
      </Link>
    </li>
  );
}
