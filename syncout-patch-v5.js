#!/usr/bin/env node
/**
 * SyncOut patch v5 — self-contained. Run from the repo root:
 *
 *     node syncout-patch-v3.js
 *
 * Does everything in one pass: desktop layout, live booking popups,
 * the Vercel deploy fix, and 22 new Delhi NCR venues.
 *
 * Safe to run twice. Every step checks whether it has already been done
 * and skips rather than duplicating. Changed files are backed up next to
 * themselves as <name>.bak before the first write.
 *
 * After it finishes:  npm run db:seed  &&  npm run build
 */
"use strict";

const fs = require("fs");
const path = require("path");

const done = [];
const skip = [];
const warn = [];

/* Refuse to run anywhere except the SyncOut repo root. */
if (!fs.existsSync("package.json")) {
  console.error("\n  Run this from the repo root (no package.json here).\n");
  process.exit(1);
}
try {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  if (pkg.name !== "syncout") {
    console.error("\n  This is the '" + pkg.name + "' repo, not syncout.\n");
    process.exit(1);
  }
} catch {
  console.error("\n  package.json could not be read.\n");
  process.exit(1);
}

function backup(p) {
  if (fs.existsSync(p) && !fs.existsSync(p + ".bak")) {
    fs.copyFileSync(p, p + ".bak");
  }
}

function writeFile(p, content) {
  const exists = fs.existsSync(p);
  if (exists && fs.readFileSync(p, "utf8") === content) {
    skip.push(p + " (already current)");
    return;
  }
  fs.mkdirSync(path.dirname(p), { recursive: true });
  backup(p);
  fs.writeFileSync(p, content);
  done.push((exists ? "updated  " : "created  ") + p);
}

function removeFile(p) {
  if (!fs.existsSync(p)) {
    skip.push(p + " (already gone)");
    return;
  }
  backup(p);
  fs.unlinkSync(p);
  done.push("removed  " + p);
}

function edit(p, find, replace, all) {
  if (!fs.existsSync(p)) {
    warn.push(p + " is missing — skipped one edit");
    return;
  }
  let src = fs.readFileSync(p, "utf8");
  if (src.includes(replace)) {
    skip.push(p + " (edit already present)");
    return;
  }
  const count = src.split(find).length - 1;
  if (count === 0) {
    warn.push(p + ": anchor text not found, edit skipped");
    return;
  }
  if (count > 1 && !all) {
    warn.push(p + ": anchor matched " + count + " times, edit skipped for safety");
    return;
  }
  backup(p);
  fs.writeFileSync(p, all ? src.split(find).join(replace) : src.replace(find, replace));
  done.push("edited   " + p + (all && count > 1 ? " (x" + count + ")" : ""));
}

function append(p, content) {
  if (!fs.existsSync(p)) {
    warn.push(p + " is missing — nothing appended");
    return;
  }
  const src = fs.readFileSync(p, "utf8");
  if (src.includes(content.trim().slice(0, 60))) {
    skip.push(p + " (append already present)");
    return;
  }
  backup(p);
  fs.appendFileSync(p, content);
  done.push("appended " + p);
}

/* Stop .env.local.txt style leaks from happening again. */
function hardenGitignore() {
  const p = ".gitignore";
  if (!fs.existsSync(p)) return;
  let src = fs.readFileSync(p, "utf8");
  const rules = ["env.local.txt", "*.env.txt", "*.bak"];
  const missing = rules.filter((r) => !src.split(/\r?\n/).includes(r));
  if (!missing.length) {
    skip.push(".gitignore (already covers env text files)");
    return;
  }
  backup(p);
  fs.appendFileSync(
    p,
    "\n# never let a pasted env file get committed\n" + missing.join("\n") + "\n"
  );
  done.push("edited   .gitignore (+" + missing.join(", ") + ")");
}


/* ─────────────── files ─────────────── */
const FILES = {
  "src/app/api/live/bookings/route.ts": "import { db } from \"@/db\";\nimport { bookings, events, clubs } from \"@/db/schema\";\nimport { getUser } from \"@/lib/session\";\nimport { eq, inArray } from \"drizzle-orm\";\n\nexport const runtime = \"nodejs\";\nexport const dynamic = \"force-dynamic\";\n\n/** Fast tick while a decision could land; slow tick when nothing is pending. */\nconst HOT_MS = Number(process.env.LIVE_POLL_MS ?? 2000);\nconst IDLE_MS = 20_000;\nconst MAX_LIFETIME_MS = 50_000;\n\n/**\n * Deliberately narrow: two columns, one indexed predicate, no joins.\n * This runs on a timer so its cost is the thing that matters most.\n */\nasync function statuses(userId: string) {\n  return db\n    .select({ id: bookings.id, status: bookings.status })\n    .from(bookings)\n    .where(eq(bookings.userId, userId));\n}\n\n/** Only called when something actually changed, so the joins are affordable. */\nasync function detailsFor(ids: string[]) {\n  if (!ids.length) return [];\n  return db\n    .select({\n      id: bookings.id,\n      code: bookings.code,\n      status: bookings.status,\n      rejectionReason: bookings.rejectionReason,\n      eventTitle: events.title,\n      clubName: clubs.name,\n    })\n    .from(bookings)\n    .innerJoin(events, eq(bookings.eventId, events.id))\n    .innerJoin(clubs, eq(bookings.clubId, clubs.id))\n    .where(inArray(bookings.id, ids));\n}\n\nexport async function GET() {\n  const user = await getUser();\n  if (!user) return new Response(\"unauthorized\", { status: 401 });\n\n  const encoder = new TextEncoder();\n  const started = Date.now();\n\n  const stream = new ReadableStream({\n    async start(controller) {\n      let closed = false;\n      const send = (event: string, data: unknown) => {\n        if (closed) return;\n        try {\n          controller.enqueue(encoder.encode(`event: ${event}\\ndata: ${JSON.stringify(data)}\\n\\n`));\n        } catch {\n          closed = true;\n        }\n      };\n\n      let previous = new Map<string, string>();\n      try {\n        for (const r of await statuses(user.id)) previous.set(r.id, r.status);\n      } catch {\n        send(\"error\", { message: \"cannot reach the database\" });\n        controller.close();\n        return;\n      }\n\n      const anyPending = () => [...previous.values()].some((s) => s === \"pending\");\n      send(\"ready\", { watching: previous.size, pending: anyPending() });\n\n      while (!closed && Date.now() - started < MAX_LIFETIME_MS) {\n        await new Promise((r) => setTimeout(r, anyPending() ? HOT_MS : IDLE_MS));\n        if (Date.now() - started >= MAX_LIFETIME_MS) break;\n\n        try {\n          const rows = await statuses(user.id);\n          const changed = rows\n            .filter((r) => previous.has(r.id) && previous.get(r.id) !== r.status)\n            .map((r) => r.id);\n\n          if (changed.length) {\n            for (const d of await detailsFor(changed)) {\n              send(\"status\", {\n                id: d.id,\n                code: d.code,\n                status: d.status,\n                reason: d.rejectionReason,\n                eventTitle: d.eventTitle,\n                clubName: d.clubName,\n              });\n            }\n          }\n          previous = new Map(rows.map((r) => [r.id, r.status]));\n        } catch {\n          // A transient Neon blip shouldn't kill the stream.\n        }\n      }\n\n      closed = true;\n      controller.close();\n    },\n  });\n\n  return new Response(stream, {\n    headers: {\n      \"Content-Type\": \"text/event-stream; charset=utf-8\",\n      \"Cache-Control\": \"no-cache, no-transform\",\n      Connection: \"keep-alive\",\n      \"X-Accel-Buffering\": \"no\",\n    },\n  });\n}\n",
  "src/app/api/live/catchup/route.ts": "import { NextResponse } from \"next/server\";\nimport { db } from \"@/db\";\nimport { bookings, events, clubs } from \"@/db/schema\";\nimport { getUser } from \"@/lib/session\";\nimport { eq, ne, and } from \"drizzle-orm\";\n\nexport const dynamic = \"force-dynamic\";\n\n/**\n * Every decided booking for this user. The client compares against what it\n * last showed and pops anything it missed, so a decision made overnight\n * still gets announced the next time the app is opened.\n */\nexport async function GET() {\n  const user = await getUser();\n  if (!user) return NextResponse.json({ decided: [] });\n\n  const rows = await db\n    .select({\n      id: bookings.id,\n      code: bookings.code,\n      status: bookings.status,\n      rejectionReason: bookings.rejectionReason,\n      eventTitle: events.title,\n      clubName: clubs.name,\n    })\n    .from(bookings)\n    .innerJoin(events, eq(bookings.eventId, events.id))\n    .innerJoin(clubs, eq(bookings.clubId, clubs.id))\n    .where(and(eq(bookings.userId, user.id), ne(bookings.status, \"pending\")));\n\n  return NextResponse.json({ decided: rows });\n}\n",
  "src/components/LiveBookings.tsx": "\"use client\";\nimport { useCallback, useEffect, useRef, useState } from \"react\";\nimport { useRouter } from \"next/navigation\";\nimport { StatusPopup, type PopupPayload } from \"@/components/ui/StatusPopup\";\n\ntype Update = {\n  id: string;\n  code: string;\n  status: string;\n  reason?: string | null;\n  eventTitle: string;\n  clubName: string;\n};\n\nconst SEEN_KEY = \"syncout:seen-status\";\n\nfunction readSeen(): Record<string, string> {\n  try {\n    return JSON.parse(localStorage.getItem(SEEN_KEY) || \"{}\");\n  } catch {\n    return {};\n  }\n}\nfunction markSeen(id: string, status: string) {\n  try {\n    const s = readSeen();\n    s[id] = status;\n    localStorage.setItem(SEEN_KEY, JSON.stringify(s));\n  } catch {\n    /* private mode — popups just repeat, which is survivable */\n  }\n}\n\nfunction toPopup(u: Update): PopupPayload | null {\n  if (u.status === \"approved\")\n    return {\n      kind: \"approved\",\n      title: \"You're on the list\",\n      body: `${u.eventTitle} at ${u.clubName}. Show this code at the door.`,\n      code: u.code,\n      cta: { label: \"View pass\", href: `/passes/${u.code}` },\n    };\n  if (u.status === \"rejected\")\n    return {\n      kind: \"rejected\",\n      title: \"Not tonight\",\n      body: u.reason || `${u.clubName} couldn't fit this one in. There are other rooms on tonight.`,\n      cta: { label: \"Find another night\", href: \"/nights\" },\n    };\n  if (u.status === \"waitlisted\")\n    return {\n      kind: \"waitlisted\",\n      title: \"You're on the waitlist\",\n      body: `${u.clubName} is full for now. We'll tell you the moment a spot opens.`,\n    };\n  return null;\n}\n\nexport function LiveBookings({ signedIn }: { signedIn: boolean }) {\n  const [popup, setPopup] = useState<PopupPayload | null>(null);\n  const router = useRouter();\n  const queue = useRef<PopupPayload[]>([]);\n  const shownFor = useRef<Set<string>>(new Set());\n\n  const push = useCallback((u: Update) => {\n    // One announcement per booking per session, whichever channel finds it first.\n    const key = u.id + \":\" + u.status;\n    if (shownFor.current.has(key)) return;\n    shownFor.current.add(key);\n\n    const p = toPopup(u);\n    if (!p) return;\n    markSeen(u.id, u.status);\n    queue.current.push(p);\n    setPopup((cur) => cur ?? queue.current.shift() ?? null);\n  }, []);\n\n  const next = useCallback(() => setPopup(queue.current.shift() ?? null), []);\n\n  /* Catch up on anything decided while the tab was closed. */\n  useEffect(() => {\n    if (!signedIn) return;\n    let cancelled = false;\n    (async () => {\n      try {\n        const res = await fetch(\"/api/live/catchup\");\n        if (!res.ok) return;\n        const { decided } = (await res.json()) as { decided: Update[] };\n        if (cancelled) return;\n        const seen = readSeen();\n        for (const d of decided) {\n          if (seen[d.id] !== d.status) push(d);\n        }\n      } catch {\n        /* offline — the stream will catch it later */\n      }\n    })();\n    return () => {\n      cancelled = true;\n    };\n  }, [signedIn, push]);\n\n  /* Live stream for decisions made while you're watching. */\n  useEffect(() => {\n    if (!signedIn) return;\n    let es: EventSource | null = null;\n    let retry: ReturnType<typeof setTimeout>;\n    let stopped = false;\n\n    const connect = () => {\n      if (stopped) return;\n      es = new EventSource(\"/api/live/bookings\");\n      es.addEventListener(\"status\", (e) => {\n        try {\n          push(JSON.parse((e as MessageEvent).data));\n          router.refresh();\n        } catch {\n          /* ignore a malformed frame */\n        }\n      });\n      es.onerror = () => {\n        es?.close();\n        if (!stopped) retry = setTimeout(connect, 2000);\n      };\n    };\n\n    connect();\n    return () => {\n      stopped = true;\n      clearTimeout(retry);\n      es?.close();\n    };\n  }, [signedIn, router, push]);\n\n  return <StatusPopup data={popup} onClose={next} />;\n}\n",
  "src/app/api/admin/bookings/bulk/route.ts": "import { NextResponse } from \"next/server\";\nimport { db } from \"@/db\";\nimport { bookings } from \"@/db/schema\";\nimport { getAdmin } from \"@/lib/session\";\nimport { inArray } from \"drizzle-orm\";\nimport { z } from \"zod\";\n\nconst schema = z.object({\n  ids: z.array(z.string().uuid()).min(1).max(200),\n  status: z.enum([\"approved\", \"rejected\", \"waitlisted\"]),\n  reason: z.string().max(200).optional(),\n});\n\nexport async function POST(req: Request) {\n  if (!(await getAdmin())) return NextResponse.json({ error: \"Unauthorized\" }, { status: 401 });\n\n  const parsed = schema.safeParse(await req.json().catch(() => null));\n  if (!parsed.success)\n    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });\n\n  const { ids, status, reason } = parsed.data;\n\n  // A decline with no reason reads as a shrug, so give it a default.\n  const updated = await db\n    .update(bookings)\n    .set({\n      status,\n      reviewedAt: new Date(),\n      rejectionReason:\n        status === \"rejected\"\n          ? reason || \"The list filled up for this night.\"\n          : null,\n    })\n    .where(inArray(bookings.id, ids))\n    .returning({ id: bookings.id });\n\n  return NextResponse.json({ ok: true, updated: updated.length });\n}\n",
  "src/components/admin/BulkActions.tsx": "\"use client\";\nimport { useState } from \"react\";\nimport { useRouter } from \"next/navigation\";\nimport { motion, AnimatePresence } from \"framer-motion\";\nimport { Check, X, Loader2, Clock } from \"lucide-react\";\n\n/**\n * Sits above the guestlist table. Acts on every id handed to it, which is\n * the currently filtered page — approving a whole night in one click.\n */\nexport function BulkActions({ ids }: { ids: string[] }) {\n  const [busy, setBusy] = useState<string | null>(null);\n  const [result, setResult] = useState<string | null>(null);\n  const router = useRouter();\n\n  if (!ids.length) return null;\n\n  async function run(status: \"approved\" | \"rejected\" | \"waitlisted\") {\n    const verb = status === \"approved\" ? \"Approve\" : status === \"rejected\" ? \"Decline\" : \"Waitlist\";\n    if (!confirm(`${verb} all ${ids.length} shown ${ids.length === 1 ? \"application\" : \"applications\"}?`))\n      return;\n\n    setBusy(status);\n    setResult(null);\n    try {\n      const res = await fetch(\"/api/admin/bookings/bulk\", {\n        method: \"POST\",\n        headers: { \"Content-Type\": \"application/json\" },\n        body: JSON.stringify({ ids, status }),\n      });\n      const data = await res.json();\n      if (!res.ok) throw new Error(data?.error || \"That didn't go through.\");\n      setResult(`${data.updated} updated`);\n      router.refresh();\n    } catch (e) {\n      setResult((e as Error).message);\n    } finally {\n      setBusy(null);\n    }\n  }\n\n  const Btn = ({\n    status,\n    Icon,\n    label,\n    tone,\n  }: {\n    status: \"approved\" | \"rejected\" | \"waitlisted\";\n    Icon: typeof Check;\n    label: string;\n    tone: string;\n  }) => (\n    <button\n      onClick={() => run(status)}\n      disabled={busy !== null}\n      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold disabled:opacity-50 ${tone}`}\n    >\n      {busy === status ? <Loader2 className=\"size-3.5 animate-spin\" /> : <Icon className=\"size-3.5\" />}\n      {label}\n    </button>\n  );\n\n  return (\n    <div className=\"mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5\">\n      <span className=\"mr-1 text-[13px] text-muted\">\n        {ids.length} shown\n      </span>\n      <Btn status=\"approved\" Icon={Check} label=\"Approve all\" tone=\"bg-red text-white\" />\n      <Btn status=\"waitlisted\" Icon={Clock} label=\"Waitlist all\" tone=\"bg-raised text-text\" />\n      <Btn status=\"rejected\" Icon={X} label=\"Decline all\" tone=\"bg-raised text-text\" />\n\n      <AnimatePresence>\n        {result && (\n          <motion.span\n            initial={{ opacity: 0, x: -6 }}\n            animate={{ opacity: 1, x: 0 }}\n            exit={{ opacity: 0 }}\n            className=\"text-[12.5px] text-muted\"\n          >\n            {result}\n          </motion.span>\n        )}\n      </AnimatePresence>\n    </div>\n  );\n}\n",
  "src/app/api/admin/export/route.ts": "import { db } from \"@/db\";\nimport { bookings, events, clubs } from \"@/db/schema\";\nimport { getAdmin } from \"@/lib/session\";\nimport { and, eq, gte, lt } from \"drizzle-orm\";\n\nexport const dynamic = \"force-dynamic\";\n\nfunction csvCell(v: unknown) {\n  const s = v == null ? \"\" : String(v);\n  return /[\",\\n]/.test(s) ? '\"' + s.replace(/\"/g, '\"\"') + '\"' : s;\n}\n\n/**\n * Tonight's approved guests as CSV. \"Tonight\" runs to 6am so a 1am\n * arrival is still on the right list.\n */\nexport async function GET() {\n  if (!(await getAdmin())) return new Response(\"Unauthorized\", { status: 401 });\n\n  // The whole of tonight, not \"from now\" — the door pulls this list at 11pm\n  // for a night that started at 9, and it still has to be on it.\n  const from = new Date();\n  from.setHours(12, 0, 0, 0); // midday today\n  const to = new Date();\n  to.setHours(30, 0, 0, 0); // 6am tomorrow\n\n  const rows = await db\n    .select({\n      club: clubs.name,\n      night: events.title,\n      starts: events.startsAt,\n      code: bookings.code,\n      name: bookings.guestName,\n      phone: bookings.guestPhone,\n      entry: bookings.entryType,\n      guests: bookings.totalGuests,\n      female: bookings.femaleCount,\n      male: bookings.maleCount,\n      status: bookings.status,\n    })\n    .from(bookings)\n    .innerJoin(events, eq(bookings.eventId, events.id))\n    .innerJoin(clubs, eq(bookings.clubId, clubs.id))\n    .where(\n      and(\n        eq(bookings.status, \"approved\"),\n        gte(events.startsAt, from),\n        lt(events.startsAt, to)\n      )\n    )\n    .orderBy(clubs.name, bookings.guestName);\n\n  const head = [\n    \"Club\", \"Night\", \"Starts\", \"Code\", \"Guest\", \"Phone\",\n    \"Entry\", \"Guests\", \"Girls\", \"Guys\", \"Status\",\n  ];\n  const body = rows.map((r) =>\n    [\n      r.club, r.night,\n      r.starts ? new Date(r.starts).toLocaleString(\"en-IN\", { timeZone: \"Asia/Kolkata\" }) : \"\",\n      r.code, r.name, r.phone, r.entry, r.guests, r.female, r.male, r.status,\n    ].map(csvCell).join(\",\")\n  );\n\n  const stamp = new Date().toISOString().slice(0, 10);\n  return new Response([head.join(\",\"), ...body].join(\"\\n\"), {\n    headers: {\n      \"Content-Type\": \"text/csv; charset=utf-8\",\n      \"Content-Disposition\": `attachment; filename=\"syncout-door-${stamp}.csv\"`,\n    },\n  });\n}\n"
};

/* ─────────────── edits ─────────────── */
const EDITS = [
  [
    "src/app/(app)/passes/[code]/page.tsx",
    "                {b.code}",
    "                {approved ? b.code : \"· · · · · ·\"}",
    false
  ],
  [
    "src/app/(app)/passes/[code]/page.tsx",
    "      {/* ── status detail ── */}",
    "      {!approved && (\n        <p className=\"px-4 pt-2 text-center text-[12.5px] text-muted\">\n          Your code appears here once a host approves you. Nothing to show at the\n          door until then.\n        </p>\n      )}\n\n      {/* ── status detail ── */}",
    false
  ],
  [
    "src/app/(app)/clubs/page.tsx",
    "        <div className=\"grid grid-cols-2 gap-3 px-4 pb-4\">",
    "        <div className=\"grid grid-cols-2 gap-3 px-4 pb-4 lg:grid-cols-4 lg:gap-5 lg:px-0 xl:grid-cols-5\">",
    false
  ],
  [
    "src/app/(app)/nights/page.tsx",
    "          <div className=\"mt-2 space-y-5 px-4\">",
    "          <div className=\"mt-2 space-y-5 px-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0 lg:px-0 xl:grid-cols-4\">",
    false
  ],
  [
    "src/components/Cards.tsx",
    "          className=\"object-cover transition-transform duration-500 group-active:scale-[1.04]\"",
    "          className=\"object-cover transition-transform duration-500 group-active:scale-[1.04] lg:group-hover:scale-[1.06]\"",
    true
  ],
  [
    "src/components/Cards.tsx",
    "      <div className=\"relative aspect-[3/4] overflow-hidden rounded-[18px] bg-raised\">",
    "      <div className=\"relative aspect-[3/4] overflow-hidden rounded-[18px] bg-raised ring-0 ring-red/0 transition-all duration-300 lg:group-hover:-translate-y-1 lg:group-hover:ring-2 lg:group-hover:ring-red/60\">",
    true
  ],
  [
    "src/components/Cards.tsx",
    "      <div className=\"relative aspect-[16/10] overflow-hidden rounded-[18px] bg-raised\">",
    "      <div className=\"relative aspect-[16/10] overflow-hidden rounded-[18px] bg-raised ring-0 ring-red/0 transition-all duration-300 lg:group-hover:-translate-y-1 lg:group-hover:ring-2 lg:group-hover:ring-red/60\">",
    false
  ],
  [
    "src/app/admin/bookings/page.tsx",
    "import { BookingRow } from \"@/components/admin/BookingRow\";",
    "import { BookingRow } from \"@/components/admin/BookingRow\";\nimport { BulkActions } from \"@/components/admin/BulkActions\";",
    false
  ],
  [
    "src/app/admin/bookings/page.tsx",
    "      <h1 className=\"px-4 font-display text-[24px] font-extrabold tracking-tight\">Guestlist</h1>",
    "      <div className=\"flex items-center gap-3 px-4 lg:px-0\">\n        <h1 className=\"font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]\">\n          Guestlist\n        </h1>\n        <a\n          href=\"/api/admin/export\"\n          className=\"ml-auto inline-flex h-9 items-center rounded-lg border border-line bg-raised px-3 text-[13px] font-semibold\"\n        >\n          Export tonight&apos;s door list\n        </a>\n      </div>",
    false
  ],
  [
    "src/app/admin/bookings/page.tsx",
    "      {rows.length === 0 ? (",
    "      <div className=\"px-4 lg:px-0\">\n        <BulkActions ids={rows.filter((r) => r.status === \"pending\").map((r) => r.id)} />\n      </div>\n\n      {rows.length === 0 ? (",
    false
  ]
];

/* ─────────────── deletes ───────────── */
const DELETES = [];

/* ─────────────── appends ───────────── */
const APPENDS = [];

for (const p of Object.keys(FILES)) writeFile(p, FILES[p]);
for (const [p, find, replace, all] of EDITS) edit(p, find, replace, all);
for (const [p, content] of APPENDS) append(p, content);
for (const p of DELETES) removeFile(p);
hardenGitignore();

/* ─────────────── report ────────────── */
console.log("\n=========== SYNCOUT PATCH v5 ===========\n");
done.forEach((d) => console.log("  OK   " + d));

if (skip.length) {
  console.log("\n  ALREADY DONE:");
  skip.forEach((s) => console.log("  -    " + s));
}

if (warn.length) {
  console.log("\n  NEEDS A LOOK:");
  warn.forEach((w) => console.log("  !    " + w));
}

console.log("\nNext:");
console.log("  npm run db:seed     # reseeds offers with dates");
console.log("  npm run build");
console.log("  npm run dev");

if (warn.length) {
  console.log("\nSome edits were skipped. The app still builds, but the");
  console.log("desktop hero or seed wiring may be missing. Send me the");
  console.log("NEEDS A LOOK lines above and I'll re-anchor them.");
}
console.log("");
