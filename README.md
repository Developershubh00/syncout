# SyncOut

Guestlist app for Delhi NCR nightlife. Mobile-first Next.js app where people apply
to a club's list for a given night as **girls**, a **couple**, or **guys** — and get
free entry plus food and drinks if the venue approves them before 6 PM.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, RSC) | One deployable for UI + API. No separate Node server to babysit. |
| Language | TypeScript, strict | |
| Styling | **Tailwind v4** (CSS-first `@theme`) | Tokens live in `globals.css`, no config file to sync. |
| Motion | **Framer Motion** | Sheets, tab indicator, step transitions. |
| Database | **Neon Postgres** + **Drizzle ORM** | Serverless driver over HTTP, works on Vercel Edge/Node. |
| Images | **Vercel Blob** | Uploads from the admin panel and guest ID proofs. |
| Email | **Resend** | Wired but dormant until you set the key. |
| Auth | `jose` JWT in httpOnly cookies | Separate user and admin sessions. |
| CI/CD | GitHub Actions → Vercel | Typecheck + build on PR, deploy on `main`. |

Three.js/Vue were on your list — I left them out. Nothing here needs 3D, and mixing
frameworks would cost bundle size on a product where **99% of traffic is mobile**.
All motion is Framer Motion + CSS, which stays under budget on a mid-range phone.

---

> **Start here:** `SETUP.md` has every command in order — local run, Neon, GitHub, Vercel.
> **Adding features:** `PATCHING.md` explains the `patch.js` workflow.

---

## Getting it running

```bash
npm install
cp .env.example .env.local     # fill in DATABASE_URL and AUTH_SECRET
npm run db:push                # create tables in Neon
npm run db:seed                # 24 clubs + 2 weeks of nights + offers
npm run dev
```

Open http://localhost:3000. Admin is at `/admin`.

### The env vars that actually matter

| Var | Needed for | Where to get it |
|---|---|---|
| `DATABASE_URL` | everything | Neon dashboard, or Vercel → Storage → Neon → `.env.local` tab |
| `AUTH_SECRET` | sessions | `openssl rand -base64 32` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | admin login | your call — defaults to the demo pair |
| `ADMIN_AUTH_KEY` | admin login (single-field) | your call |
| `BLOB_READ_WRITE_TOKEN` | photo uploads | Vercel → Storage → Blob |
| `RESEND_API_KEY` + `MAIL_ENABLED=true` | emails | resend.com. Until set, mail is logged to console and nothing blocks. |
| `GUESTLIST_CUTOFF_HOUR` | list deadline | `18` = 6 PM IST |

Admin credentials are read from env on every request, so **rotating the password is
an env-var change in Vercel, not a redeploy of code.**

### Before the database is connected

Every read in `src/lib/queries.ts` goes through a `safe()` wrapper, so a missing or
unreachable `DATABASE_URL` renders each screen's empty state rather than a 500. You can
clone, `npm install`, `npm run dev` and click through the whole app before touching Neon.
The console prints a one-time reminder telling you which command to run next.

Writes are deliberately **not** wrapped — `POST /api/bookings` still throws and reports a
real error, because silently swallowing a failed booking would be worse than showing one.

---

## How the guestlist works

`src/lib/guestlist.ts` is the single source of truth.

- Applications for a night close at `cutoffHour` (default **18:00 IST**) *on the day of
  the event*. `cutoffFor()` builds that instant in IST and converts back to UTC, so it's
  correct regardless of where the server runs.
- The rule is enforced in three places: the button state on the night page, the API
  route (`POST /api/bookings` returns 409 after cutoff), and the copy the guest sees.
- Capacity is counted live per entry type. `pending + approved + checked_in` all consume
  a spot, so a list can't be oversold while requests sit unreviewed.
- Each night has independent switches and caps for girls / couples / guys. The seeder
  closes the guys' list automatically on Ladies Night.

### Booking states

`pending → approved | rejected | waitlisted` and then `checked_in | no_show`.
Approving sends the pass email; rejecting sends the "list filled up" email.

---

## Admin panel

`/admin` — sign in with username + password, or with the single auth key.

| Screen | What it does |
|---|---|
| **Overview** | Pending count, today's queue, daily rhythm |
| **Guestlist** | Filter by status, expand a row for phone/email/notes, approve or decline (fires the email) |
| **Door** | Type a 6-character code, see the party, tap to check in — built for a phone at the entrance |
| **Clubs** | Full CRUD with Blob photo upload or a pasted URL |
| **Nights** | Full CRUD, per-list caps and prices, cutoff hour, open/close the list |

---

## Data carried over from sync.quickrpe.com

All 24 venues were extracted with their photos, areas and cities:

- **New Delhi (16)** — Club Brown, Playboy Club, Privée, Mandem, Diablo, Liv Bar,
  Unplugged Courtyard, Oso, MisoSexy, Monët, Sorra, Aquila, Khubani, Slique, M Houz, Bougie
- **Gurugram (4)** — Klub Hermis, Local Gurgaon, Duty Free (Vayu Bar), Zorro
- **Noida (4)** — Local Noida, F Bar & Lounge, Paso, Molecule Air Bar

Each one has written copy, music tags, timings, a price band and a dress code, in
`src/data/venues.ts`. Images still point at the old media server — re-upload through
Admin → Clubs to move them onto Blob and drop the dependency.

---

## Deploying

1. Push to GitHub.
2. Import the repo in Vercel. Framework detects as Next.js.
3. Add every var from `.env.example` under Settings → Environment Variables.
4. Add repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` if you want
   `.github/workflows/deploy.yml` to drive deploys instead of Vercel's own Git hook.
5. `npm run db:push` once against production, then `npm run db:seed` if you want the
   sample nights.

`ci.yml` runs typecheck + build on every PR. It builds without a database — the Drizzle
client connects lazily, so CI needs no live Postgres.

---

## Project map

```
src/
├─ app/
│  ├─ (app)/            guest-facing, wrapped in the tab-bar shell
│  │  ├─ page.tsx           home — cutoff countdown, rails, how it works
│  │  ├─ clubs/             list + detail
│  │  ├─ nights/            list grouped by day + detail with booking sheet
│  │  ├─ passes/            your applications + the pass stub
│  │  ├─ search/  profile/  login/  register/
│  ├─ admin/            staff, own layout, no tab bar
│  └─ api/              bookings, auth, upload, door lookup, admin CRUD
├─ components/          Cards, BookingFlow, TabBar, TopBar, ui/*, admin/*
├─ db/                  schema.ts, seed.ts, lazy client
├─ lib/                 guestlist rules, session, auth, mail, blob, queries, validators
└─ data/venues.ts       the 24 venues

patch.js               feature-patch runner (see PATCHING.md)
patches/               patch files, kept in git as history
```

---

## Design notes

Dark room, one red (`#e4113c`), one gold (`#f2c14e`). Gold means *approved* and nothing
else — it only ever appears on perks, an approved pass code, and the door's green light.
Everything else stays quiet so that signal reads instantly at a glance in a dark club.

The **pass stub** is where the visual budget went: a torn-ticket shape with a notched
tear line and the code set large in the display face. It's the screen a guest opens at
the door, so it's the one that should feel like an object.

The hero is the **6 PM countdown**, not a stock photo — the deadline is the product.

Type is Bricolage Grotesque for display and Inter for UI.

---

## Things left deliberately open

- **Payments.** Every list is free entry today, and the schema carries `amount` per
  booking. Drop Razorpay into `POST /api/bookings` when paid lists start.
- **OTP login.** Password auth ships now; phone OTP is a swap inside `lib/auth.ts`.
- **Guest ID upload.** `bookings.idProofUrl` and the upload route exist; the field isn't
  in the booking form yet because it slows first-time conversion. Add it when the doors
  ask for it.
- **Push / WhatsApp.** The approve handler is the single hook point for both.
