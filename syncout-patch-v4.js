#!/usr/bin/env node
/**
 * SyncOut patch v4 — self-contained. Run from the repo root:
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

function edit(p, find, replace) {
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
  if (count > 1) {
    warn.push(p + ": anchor matched " + count + " times, edit skipped for safety");
    return;
  }
  backup(p);
  fs.writeFileSync(p, src.replace(find, replace));
  done.push("edited   " + p);
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
  "src/lib/cache.ts": "import \"server-only\";\nimport { unstable_cache } from \"next/cache\";\nimport { getClubs, getNights, getOffers } from \"./queries\";\n\n/** Tags let admin writes drop the cache immediately instead of waiting it out. */\nexport const TAGS = {\n  clubs: \"clubs\",\n  nights: \"nights\",\n  offers: \"offers\",\n} as const;\n\n/**\n * Club lists change rarely — a long window is fine, and any admin edit\n * busts it by tag anyway.\n */\nexport const cachedClubs = (citySlug: string, limit = 60) =>\n  unstable_cache(\n    () => getClubs(citySlug, limit),\n    [\"clubs\", citySlug, String(limit)],\n    { revalidate: 600, tags: [TAGS.clubs] }\n  )();\n\n/**\n * Nights move more often (an admin can close a list mid-evening), so this\n * window is short. Booking counts are read separately and never cached.\n */\nexport const cachedNights = (opts: { citySlug?: string; clubId?: string; limit?: number } = {}) =>\n  unstable_cache(\n    () => getNights(opts),\n    [\"nights\", opts.citySlug ?? \"-\", opts.clubId ?? \"-\", String(opts.limit ?? 0)],\n    { revalidate: 60, tags: [TAGS.nights] }\n  )();\n\nexport const cachedOffers = () =>\n  unstable_cache(() => getOffers(), [\"offers\"], {\n    revalidate: 120,\n    tags: [TAGS.offers],\n  })();\n",
  "src/app/admin/layout.tsx": "import Link from \"next/link\";\nimport { getAdmin } from \"@/lib/session\";\nimport { ToastHost } from \"@/components/ui/Toast\";\nimport { AdminLogout } from \"@/components/admin/AdminLogout\";\nimport { AdminNav } from \"@/components/admin/AdminNav\";\n\nexport const metadata = { title: \"Admin\" };\nexport const dynamic = \"force-dynamic\";\n\nexport const ADMIN_NAV = [\n  { href: \"/admin\", label: \"Overview\" },\n  { href: \"/admin/bookings\", label: \"Guestlist\" },\n  { href: \"/admin/door\", label: \"Door\" },\n  { href: \"/admin/clubs\", label: \"Clubs\" },\n  { href: \"/admin/nights\", label: \"Nights\" },\n];\n\nexport default async function AdminLayout({ children }: { children: React.ReactNode }) {\n  const admin = await getAdmin();\n\n  if (!admin) {\n    return (\n      <ToastHost>\n        <div className=\"mx-auto min-h-dvh max-w-3xl pb-16\">{children}</div>\n      </ToastHost>\n    );\n  }\n\n  return (\n    <ToastHost>\n      <div className=\"min-h-dvh lg:flex\">\n        {/* Desktop sidebar */}\n        <aside className=\"hidden w-[212px] shrink-0 border-r border-line lg:flex lg:flex-col\">\n          <div className=\"px-5 py-5\">\n            <Link href=\"/admin\" className=\"font-display text-[18px] font-extrabold tracking-tight\">\n              Sync<span className=\"text-red\">Out</span>\n            </Link>\n            <p className=\"mt-0.5 text-[11px] font-semibold tracking-wide text-faint\">ADMIN</p>\n          </div>\n\n          <AdminNav items={ADMIN_NAV} />\n\n          <div className=\"mt-auto space-y-2 border-t border-line p-4\">\n            <Link href=\"/\" className=\"block text-[12.5px] text-muted hover:text-text\">\n              View site\n            </Link>\n            <AdminLogout />\n          </div>\n        </aside>\n\n        <div className=\"min-w-0 flex-1\">\n          {/* Phone header — unchanged behaviour, just hidden on desktop */}\n          <header className=\"sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-xl lg:hidden\">\n            <div className=\"flex items-center gap-3 px-4 py-3\">\n              <Link href=\"/admin\" className=\"font-display text-[18px] font-extrabold tracking-tight\">\n                Sync<span className=\"text-red\">Out</span>\n                <span className=\"ml-2 rounded-md bg-raised px-1.5 py-0.5 text-[10.5px] font-semibold text-muted\">\n                  ADMIN\n                </span>\n              </Link>\n              <div className=\"ml-auto flex items-center gap-2\">\n                <Link href=\"/\" className=\"text-[12.5px] text-muted\">\n                  View site\n                </Link>\n                <AdminLogout />\n              </div>\n            </div>\n            <nav className=\"rail pb-2.5 pt-0.5\">\n              {ADMIN_NAV.map((n) => (\n                <Link\n                  key={n.href}\n                  href={n.href}\n                  className=\"rounded-full border border-line px-3.5 py-1.5 text-[13px] text-muted\"\n                >\n                  {n.label}\n                </Link>\n              ))}\n            </nav>\n          </header>\n\n          <div className=\"mx-auto max-w-3xl pb-16 lg:max-w-none lg:px-8 lg:pb-10\">{children}</div>\n        </div>\n      </div>\n    </ToastHost>\n  );\n}\n",
  "src/components/admin/AdminNav.tsx": "\"use client\";\nimport Link from \"next/link\";\nimport { usePathname } from \"next/navigation\";\nimport { cn } from \"@/lib/utils\";\n\nexport function AdminNav({ items }: { items: { href: string; label: string }[] }) {\n  const path = usePathname();\n\n  return (\n    <nav className=\"px-3\">\n      {items.map((n) => {\n        const active = n.href === \"/admin\" ? path === \"/admin\" : path.startsWith(n.href);\n        return (\n          <Link\n            key={n.href}\n            href={n.href}\n            aria-current={active ? \"page\" : undefined}\n            className={cn(\n              \"mb-0.5 block rounded-lg px-3 py-2 text-[13.5px] transition-colors\",\n              active ? \"bg-raised font-semibold text-text\" : \"text-muted hover:text-text\"\n            )}\n          >\n            {n.label}\n          </Link>\n        );\n      })}\n    </nav>\n  );\n}\n"
};

/* ─────────────── edits ─────────────── */
const EDITS = [
  [
    "src/app/(app)/page.tsx",
    "import { getClubs, getNights, getOffers } from \"@/lib/queries\";",
    "import { cachedClubs, cachedNights, cachedOffers } from \"@/lib/cache\";"
  ],
  [
    "src/app/(app)/page.tsx",
    "    getNights({ citySlug: city, limit: 12 }),\n    getClubs(city, 14),\n    getOffers(),",
    "    cachedNights({ citySlug: city, limit: 12 }),\n    cachedClubs(city, 14),\n    cachedOffers(),"
  ],
  [
    "src/app/(app)/nights/page.tsx",
    "import { getNights } from \"@/lib/queries\";",
    "import { cachedNights } from \"@/lib/cache\";"
  ],
  [
    "src/app/(app)/clubs/page.tsx",
    "import { getClubs } from \"@/lib/queries\";",
    "import { cachedClubs } from \"@/lib/cache\";"
  ],
  [
    "src/lib/queries.ts",
    "async function _getOffers() {\n  return db.select().from(offers).where(eq(offers.isActive, true)).orderBy(asc(offers.sortOrder));\n}",
    "async function _getOffers() {\n  const at = now();\n  const rows = await db\n    .select()\n    .from(offers)\n    .where(\n      and(\n        eq(offers.isActive, true),\n        // No end date means an evergreen perk; otherwise it must not have passed.\n        or(sql`${offers.validTill} is null`, gte(offers.validTill, at))\n      )\n    )\n    .orderBy(asc(offers.sortOrder));\n\n  return rows.map((o) => ({\n    ...o,\n    /** Ends within 36h — the UI shows these as tonight's specials. */\n    isToday: o.validTill\n      ? o.validTill.getTime() - at.getTime() <= 36 * 60 * 60 * 1000\n      : false,\n  }));\n}"
  ],
  [
    "src/db/seed.ts",
    "  await db.insert(offers).values([",
    "  // Ends tonight, so the day-scoping is proven end to end.\n  const tonightEnds = new Date();\n  tonightEnds.setHours(30, 0, 0, 0);\n  const nextWeek = new Date(Date.now() + 7 * 864e5);\n\n  await db.insert(offers).values([\n    {\n      title: \"Sponsor night: open bar till 11\",\n      subtitle: \"Tonight only\",\n      description:\n        \"First hour is on the sponsor for anyone approved on tonight's list. Turn up before eleven and the tab is covered.\",\n      image: inserted[2].coverImage,\n      clubId: inserted[2].id,\n      validTill: tonightEnds,\n      isActive: true,\n      sortOrder: 0,\n    },\n    {\n      title: \"Ladies night residency\",\n      subtitle: \"Every Wednesday this month\",\n      description:\n        \"A resident DJ for the month and no cover for girls on the list, at every venue running a Wednesday.\",\n      image: inserted[6].coverImage,\n      clubId: null,\n      validTill: nextWeek,\n      isActive: true,\n      sortOrder: 2,\n    },"
  ],
  [
    "src/lib/queries.ts",
    "async function _adminStats() {\n  const [[b], [pending], [c], [e]] = await Promise.all([\n    db.select({ n: count() }).from(bookings),\n    db.select({ n: count() }).from(bookings).where(eq(bookings.status, \"pending\")),\n    db.select({ n: count() }).from(clubs),\n    db.select({ n: count() }).from(events).where(gte(events.startsAt, new Date())),\n  ]);\n  return { bookings: b.n, pending: pending.n, clubs: c.n, upcoming: e.n };\n}",
    "async function _adminStats() {\n  const at = now();\n  // Tonight = from now until 6am tomorrow, so a 1am booking still counts.\n  const dayEnd = new Date(at);\n  dayEnd.setHours(30, 0, 0, 0);\n\n  const [[b], [pending], [c], [e], [tonight], [approvedTonight], [heads]] = await Promise.all([\n    db.select({ n: count() }).from(bookings),\n    db.select({ n: count() }).from(bookings).where(eq(bookings.status, \"pending\")),\n    db.select({ n: count() }).from(clubs),\n    db.select({ n: count() }).from(events).where(gte(events.startsAt, at)),\n    db\n      .select({ n: count() })\n      .from(events)\n      .where(and(gte(events.startsAt, at), sql`${events.startsAt} < ${dayEnd}`)),\n    db\n      .select({ n: count() })\n      .from(bookings)\n      .where(eq(bookings.status, \"approved\")),\n    db\n      .select({ n: sql<number>`coalesce(sum(${bookings.totalGuests}), 0)::int` })\n      .from(bookings)\n      .where(eq(bookings.status, \"approved\")),\n  ]);\n\n  return {\n    bookings: b.n,\n    pending: pending.n,\n    clubs: c.n,\n    upcoming: e.n,\n    tonight: tonight.n,\n    approved: approvedTonight.n,\n    heads: heads.n,\n  };\n}"
  ],
  [
    "src/app/admin/page.tsx",
    "      <div className=\"mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4\">\n        <Stat n={stats.pending} label=\"Awaiting review\" accent />\n        <Stat n={stats.bookings} label=\"Total applications\" />\n        <Stat n={stats.upcoming} label=\"Upcoming nights\" />",
    "      <div className=\"mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6\">\n        <Stat n={stats.pending} label=\"Awaiting review\" accent />\n        <Stat n={stats.tonight} label=\"Nights on tonight\" />\n        <Stat n={stats.approved} label=\"Approved\" />\n        <Stat n={stats.heads} label=\"Heads on lists\" />\n        <Stat n={stats.bookings} label=\"Total applications\" />\n        <Stat n={stats.upcoming} label=\"Upcoming nights\" />"
  ],
  [
    "src/app/api/admin/clubs/route.ts",
    "import { clubSchema } from \"@/lib/validators\";",
    "import { clubSchema } from \"@/lib/validators\";\nimport { revalidateTag } from \"next/cache\";\nimport { TAGS } from \"@/lib/cache\";"
  ],
  [
    "src/app/api/admin/clubs/route.ts",
    "  const [row] = await db.insert(clubs).values(parsed.data).returning();\n  return NextResponse.json(row, { status: 201 });",
    "  const [row] = await db.insert(clubs).values(parsed.data).returning();\n  // Without this a new club sits behind the cache for up to ten minutes.\n  revalidateTag(TAGS.clubs, \"max\");\n  return NextResponse.json(row, { status: 201 });"
  ],
  [
    "src/app/admin/page.tsx",
    "    <div className=\"px-4 pt-6\">\n      <h1 className=\"font-display text-[24px] font-extrabold tracking-tight\">Overview</h1>",
    "    <div className=\"px-4 pt-6 lg:px-0 lg:pt-8\">\n      <h1 className=\"font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]\">\n        Overview\n      </h1>"
  ],
  [
    "src/components/admin/ClubManager.tsx",
    "    <div className=\"px-4 pt-6\">",
    "    <div className=\"px-4 pt-6 lg:px-0 lg:pt-8\">"
  ],
  [
    "src/app/(app)/clubs/page.tsx",
    "  const list = await getClubs(city, 80);",
    "  const list = await cachedClubs(city, 80);"
  ],
  [
    "src/app/(app)/nights/page.tsx",
    "  const nights = await getNights({ citySlug: city, limit: 90 });",
    "  const nights = await cachedNights({ citySlug: city, limit: 90 });"
  ],
  [
    "src/lib/queries.ts",
    "export const adminStats = safe(_adminStats, { bookings: 0, pending: 0, clubs: 0, upcoming: 0 });",
    "export const adminStats = safe(_adminStats, {\n  bookings: 0,\n  pending: 0,\n  clubs: 0,\n  upcoming: 0,\n  tonight: 0,\n  approved: 0,\n  heads: 0,\n});"
  ]
];

/* ─────────────── deletes ───────────── */
const DELETES = [
  ".github/workflows/deploy.yml"
];

/* ─────────────── appends ───────────── */
const APPENDS = [];

for (const p of Object.keys(FILES)) writeFile(p, FILES[p]);
for (const [p, find, replace] of EDITS) edit(p, find, replace);
for (const [p, content] of APPENDS) append(p, content);
for (const p of DELETES) removeFile(p);
hardenGitignore();

/* ─────────────── report ────────────── */
console.log("\n=========== SYNCOUT PATCH v4 ===========\n");
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
