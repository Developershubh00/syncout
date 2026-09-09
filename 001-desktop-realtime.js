/**
 * 001 — deploy fix, desktop layout, live booking popups.
 *
 * Apply:  node patch.js --dry   →   node patch.js   →   npm run build
 */
module.exports = {
  id: "001-desktop-realtime",
  description: "Desktop UI, live booking popups, deploy fix",

  ops: [
    /* ─────────────────────────────────────────────────────────────
       1. The deploy blocker.

       vercel pull --token=  ← empty means VERCEL_TOKEN was never set.
       This version checks first and tells you which secret is missing
       instead of failing 40s later with a cryptic CLI error.
       ───────────────────────────────────────────────────────────── */
    {
      type: "write",
      path: ".github/workflows/deploy.yml",
      content: `name: Deploy to Vercel

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Fail fast and say exactly what's missing, rather than letting the
      # Vercel CLI die on an empty --token 40 seconds in.
      - name: Check secrets
        env:
          TOKEN: \${{ secrets.VERCEL_TOKEN }}
          ORG: \${{ secrets.VERCEL_ORG_ID }}
          PROJECT: \${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          missing=""
          [ -z "$TOKEN" ]   && missing="$missing VERCEL_TOKEN"
          [ -z "$ORG" ]     && missing="$missing VERCEL_ORG_ID"
          [ -z "$PROJECT" ] && missing="$missing VERCEL_PROJECT_ID"
          if [ -n "$missing" ]; then
            echo "::error::Missing repo secret(s):$missing"
            echo ""
            echo "Set them under Settings -> Secrets and variables -> Actions:"
            echo "  VERCEL_TOKEN       vercel.com/account/tokens"
            echo "  VERCEL_ORG_ID      .vercel/project.json after 'vercel link'"
            echo "  VERCEL_PROJECT_ID  same file"
            echo ""
            echo "Or delete this workflow and let Vercel's own Git integration"
            echo "deploy on push - it needs no secrets at all."
            exit 1
          fi
          echo "All three secrets present."

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - run: npm ci
      - run: npm install --global vercel@latest

      - name: Pull Vercel env
        run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build
        run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}

      - name: Deploy
        run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
`,
    },

    /* ── 2. env template refreshed to match what Neon/Vercel hands you ── */
    {
      type: "write",
      path: ".env.example",
      content: `# Copy to .env.local and fill in. Never commit .env.local.

# ── Database (Neon) ──────────────────────────────────────────────
# Use the POOLED url. Neon's pooler is what the serverless driver wants.
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require"
# Direct (non-pooled) connection. drizzle-kit push/migrate prefers this.
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"

# ── Sessions ─────────────────────────────────────────────────────
# openssl rand -base64 32
AUTH_SECRET=""

# ── Admin login (/admin) ─────────────────────────────────────────
ADMIN_USERNAME="syncout.com"
ADMIN_PASSWORD="change-me"
ADMIN_AUTH_KEY="change-me-too"

# ── App ──────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GUESTLIST_CUTOFF_HOUR="18"

# ── Live booking updates ─────────────────────────────────────────
# How often the stream checks for an approval, in ms. 2000-5000 is sane.
NEXT_PUBLIC_LIVE_POLL_MS="2500"

# ── Photo uploads (Vercel Blob) ──────────────────────────────────
BLOB_READ_WRITE_TOKEN=""

# ── Email (Resend) — off until you set these ─────────────────────
MAIL_ENABLED="false"
RESEND_API_KEY=""
MAIL_FROM="SyncOut <list@yourdomain.com>"
`,
    },

    /* ─────────────────────────────────────────────────────────────
       3. Desktop navigation. Mobile keeps the tab bar; from lg up this
          top bar takes over, matching the mockup.
       ───────────────────────────────────────────────────────────── */
    {
      type: "write",
      path: "src/components/DesktopNav.tsx",
      content: `"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/nights", label: "Nights" },
  { href: "/clubs", label: "Clubs" },
  { href: "/passes", label: "Passes" },
  { href: "/profile", label: "Your list" },
];

export function DesktopNav({ initials = "" }: { initials?: string }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-ink/85 backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-7 px-6">
        <Link href="/" className="font-display text-[21px] font-extrabold tracking-tight">
          Sync<span className="text-red">Out</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => {
            const active = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-3 py-5 text-[14px] font-medium transition-colors",
                  active ? "text-text" : "text-muted hover:text-text"
                )}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="desknav"
                    className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-red"
                    transition={{ type: "spring", damping: 30, stiffness: 420 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <form action="/search" className="ml-auto w-[320px]">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3">
            <Search className="size-4 shrink-0 text-faint" />
            <input
              name="q"
              placeholder="Search clubs, areas or nights"
              className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint"
            />
          </div>
        </form>

        <Link
          href="/profile"
          className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-raised text-[12px] font-semibold"
        >
          {initials || "\\u00b7\\u00b7"}
        </Link>
      </div>
    </header>
  );
}
`,
    },

    /* ── 4. Footer from the mockup — desktop only ── */
    {
      type: "write",
      path: "src/components/SiteFooter.tsx",
      content: `import Link from "next/link";

const cols = [
  { head: "Explore", items: [["Tonight", "/nights"], ["All clubs", "/clubs"], ["Search", "/search"]] },
  { head: "Your account", items: [["Your list", "/profile"], ["Passes", "/passes"], ["Settings", "/profile"]] },
  { head: "Company", items: [["For venues", "/clubs"], ["Contact", "/profile"], ["Terms", "/"]] },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 hidden border-t border-line lg:block">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1.4fr_repeat(3,1fr)] gap-10 px-6 py-14">
        <div>
          <p className="font-display text-[21px] font-extrabold tracking-tight">
            Sync<span className="text-red">Out</span>
          </p>
          <p className="mt-3 max-w-[38ch] text-[13px] leading-relaxed text-muted">
            Guestlists for Delhi NCR. 21+ with a government photo ID. Entry stays at the
            venue&apos;s discretion and lists close at 6 PM on the day.
          </p>
          <p className="mt-6 text-[12px] text-faint">
            © {new Date().getFullYear()} SyncOut
          </p>
        </div>

        {cols.map((col) => (
          <div key={col.head}>
            <p className="text-[13px] font-semibold">{col.head}</p>
            <ul className="mt-3 space-y-2.5">
              {col.items.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[13px] text-muted transition-colors hover:text-text">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
`,
    },

    /* ─────────────────────────────────────────────────────────────
       5. Live booking updates.

       WHY THIS IS NOT A WEBSOCKET: Vercel's serverless functions can't
       hold a socket open, and there's no shared process to broadcast
       from — each request may hit a different instance. So this is
       Server-Sent Events over a route that watches the database for
       this user's booking statuses and pushes the moment one changes.
       Same user-visible result (popup within ~2.5s of an admin click),
       no extra infrastructure. If you later want true sub-second push,
       drop in Pusher or Ably and keep this component as the fallback.
       ───────────────────────────────────────────────────────────── */
    {
      type: "write",
      path: "src/app/api/live/bookings/route.ts",
      content: `import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { getUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS = Number(process.env.LIVE_POLL_MS ?? 2500);
// Stay under the platform's function ceiling, then let EventSource reconnect.
const MAX_LIFETIME_MS = 50_000;

type Snapshot = Record<string, string>;

async function snapshot(userId: string) {
  const rows = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      status: bookings.status,
      rejectionReason: bookings.rejectionReason,
      eventTitle: events.title,
      clubName: clubs.name,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(eq(bookings.userId, userId));

  const map: Snapshot = {};
  for (const r of rows) map[r.id] = r.status;
  return { rows, map };
}

export async function GET() {
  const user = await getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  const started = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(\`event: \${event}\\ndata: \${JSON.stringify(data)}\\n\\n\`));
        } catch {
          closed = true;
        }
      };

      let previous: Snapshot;
      try {
        previous = (await snapshot(user.id)).map;
      } catch {
        send("error", { message: "cannot reach the database" });
        controller.close();
        return;
      }

      send("ready", { watching: Object.keys(previous).length });

      while (!closed && Date.now() - started < MAX_LIFETIME_MS) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        try {
          const { rows, map } = await snapshot(user.id);
          for (const row of rows) {
            const before = previous[row.id];
            if (before && before !== row.status) {
              send("status", {
                id: row.id,
                code: row.code,
                from: before,
                status: row.status,
                reason: row.rejectionReason,
                eventTitle: row.eventTitle,
                clubName: row.clubName,
              });
            }
          }
          previous = map;
        } catch {
          // A transient Neon blip shouldn't kill the stream.
        }
        send("ping", { t: Date.now() });
      }

      closed = true;
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
`,
    },

    /* ── 6. The popup itself — the payment-style success/failure splash ── */
    {
      type: "write",
      path: "src/components/ui/StatusPopup.tsx",
      content: `"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Clock, PartyPopper } from "lucide-react";
import { useEffect } from "react";

export type PopupKind = "approved" | "rejected" | "waitlisted" | "submitted";

export type PopupPayload = {
  kind: PopupKind;
  title: string;
  body?: string;
  code?: string;
  cta?: { label: string; href: string };
};

const look: Record<PopupKind, { Icon: typeof Check; ring: string; tint: string }> = {
  approved: { Icon: Check, ring: "#22c55e", tint: "rgba(34,197,94,0.16)" },
  submitted: { Icon: Clock, ring: "var(--color-gold)", tint: "rgba(242,193,78,0.16)" },
  waitlisted: { Icon: Clock, ring: "var(--color-gold)", tint: "rgba(242,193,78,0.16)" },
  rejected: { Icon: X, ring: "var(--color-red)", tint: "rgba(228,17,60,0.16)" },
};

export function StatusPopup({ data, onClose }: { data: PopupPayload | null; onClose: () => void }) {
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(onClose, data.kind === "approved" ? 6000 : 4500);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [data, onClose]);

  const cfg = data ? look[data.kind] : null;
  const Icon = data?.kind === "approved" ? PartyPopper : cfg?.Icon ?? Check;

  return (
    <AnimatePresence>
      {data && cfg && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-0 bg-ink/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="alertdialog"
            aria-live="assertive"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[340px] overflow-hidden rounded-sheet border border-line bg-surface p-7 text-center shadow-2xl"
            initial={{ opacity: 0, y: 26, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
          >
            <div className="relative mx-auto grid size-[74px] place-items-center">
              {/* the ring draws itself, then the mark lands */}
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: cfg.tint }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", damping: 18, stiffness: 300 }}
              />
              <motion.svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={cfg.ring}
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.svg>
              <motion.span
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.32, type: "spring", damping: 14, stiffness: 420 }}
              >
                <Icon className="size-8" style={{ color: cfg.ring }} strokeWidth={2.6} />
              </motion.span>
            </div>

            <motion.p
              className="mt-5 font-display text-[21px] font-extrabold leading-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              {data.title}
            </motion.p>

            {data.body && (
              <motion.p
                className="mx-auto mt-2 max-w-[30ch] text-[13.5px] leading-relaxed text-muted"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {data.body}
              </motion.p>
            )}

            {data.code && (
              <motion.p
                className="mt-4 inline-block rounded-xl border border-line bg-raised px-4 py-2 font-mono text-[17px] font-semibold tracking-[0.18em]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.38, type: "spring", damping: 20, stiffness: 300 }}
              >
                {data.code}
              </motion.p>
            )}

            <div className="mt-6 flex gap-2">
              {data.cta && (
                <a
                  href={data.cta.href}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red text-[14px] font-semibold text-white"
                >
                  {data.cta.label}
                </a>
              )}
              <button
                onClick={onClose}
                className="h-11 flex-1 rounded-xl border border-line bg-raised text-[14px] font-semibold"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
`,
    },

    /* ── 7. The watcher that connects the stream to the popup ── */
    {
      type: "write",
      path: "src/components/LiveBookings.tsx",
      content: `"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPopup, type PopupPayload } from "@/components/ui/StatusPopup";

type Update = {
  id: string;
  code: string;
  status: string;
  reason?: string | null;
  eventTitle: string;
  clubName: string;
};

function toPopup(u: Update): PopupPayload | null {
  if (u.status === "approved")
    return {
      kind: "approved",
      title: "You're on the list",
      body: \`\${u.eventTitle} at \${u.clubName}. Show this code at the door.\`,
      code: u.code,
      cta: { label: "View pass", href: \`/passes/\${u.code}\` },
    };
  if (u.status === "rejected")
    return {
      kind: "rejected",
      title: "Not this time",
      body: u.reason || \`\${u.clubName} couldn't fit this one in. Try another night.\`,
      cta: { label: "Find another night", href: "/nights" },
    };
  if (u.status === "waitlisted")
    return {
      kind: "waitlisted",
      title: "You're on the waitlist",
      body: \`\${u.clubName} is full for now. We'll tell you if a spot opens.\`,
    };
  return null;
}

/**
 * Mounted once in the app layout. Opens an SSE connection and shows a popup
 * the moment an admin changes one of your bookings. Signed-out visitors get
 * a 401 and this quietly does nothing.
 */
export function LiveBookings({ signedIn }: { signedIn: boolean }) {
  const [popup, setPopup] = useState<PopupPayload | null>(null);
  const router = useRouter();
  const queue = useRef<PopupPayload[]>([]);

  const next = useCallback(() => {
    const item = queue.current.shift() ?? null;
    setPopup(item);
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      es = new EventSource("/api/live/bookings");

      es.addEventListener("status", (e) => {
        try {
          const p = toPopup(JSON.parse((e as MessageEvent).data));
          if (!p) return;
          queue.current.push(p);
          setPopup((cur) => cur ?? queue.current.shift() ?? null);
          router.refresh(); // keep the page's own data honest
        } catch {
          /* ignore a malformed frame */
        }
      });

      // The route closes itself before the platform's timeout; reconnect.
      es.onerror = () => {
        es?.close();
        if (!stopped) retry = setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      es?.close();
    };
  }, [signedIn, router]);

  return <StatusPopup data={popup} onClose={next} />;
}
`,
    },

    /* ── 8. Layout: desktop shell + live watcher ── */
    {
      type: "write",
      path: "src/app/(app)/layout.tsx",
      content: `import { TabBar } from "@/components/TabBar";
import { ToastHost } from "@/components/ui/Toast";
import { DesktopNav } from "@/components/DesktopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { LiveBookings } from "@/components/LiveBookings";
import { getUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") ?? "";

  return (
    <ToastHost>
      <DesktopNav initials={initials} />
      {/* max-w-lg keeps the phone layout untouched; lg widens to the desktop grid */}
      <div className="mx-auto min-h-dvh max-w-lg lg:max-w-[1280px] lg:px-6">
        <main className="mb-tabbar lg:mb-0 lg:pt-8">{children}</main>
      </div>
      <SiteFooter />
      <TabBar />
      <LiveBookings signedIn={Boolean(user)} />
    </ToastHost>
  );
}
`,
    },

    /* ── 9. Hide the phone tab bar once the top nav appears ── */
    {
      type: "replace",
      path: "src/components/TabBar.tsx",
      find: `<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/85 backdrop-blur-xl">`,
      replace: `<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/85 backdrop-blur-xl lg:hidden">`,
    },

    { type: "run", cmd: "npx tsc --noEmit" },
  ],
};
