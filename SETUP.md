# Setup

## The short way

```bash
cd syncout
node setup.js
```

That one command does everything below: checks your toolchain, installs
dependencies, writes `.env.local` with a freshly generated `AUTH_SECRET`, pushes
the schema to Neon, verifies it actually landed, seeds 24 clubs and two weeks of
nights, runs a build, then creates the GitHub repo with `main` + `dev` and sets
your Actions secrets.

It's safe to re-run. It never overwrites an existing `.env.local` and never
force-pushes.

| Flag | Does |
|---|---|
| `--local` | stop after the seed, skip git and GitHub |
| `--two-repos` | separate prod + dev repos instead of two branches |
| `--name my-app` | repo name (default `syncout`) |
| `--public` | create the repo public (default private) |
| `--yes` | take every default, no prompts — also what happens automatically when stdin isn't a terminal |

Have your Neon connection string ready. Everything else has a sensible default.

---

# The long way — every command, in order

Copy-paste these top to bottom. Nothing is skippable unless it says so.

---

## 1. Run it locally

```bash
# unzip, then:
cd syncout

npm install
```

Create your env file:

```bash
cp .env.example .env.local
```

Generate a session secret and paste it into `.env.local` as `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

> On Windows without openssl:
> `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## 2. Get a database (Neon)

1. Go to **neon.tech** → new project → region **AWS ap-southeast-1 (Singapore)**, closest to Delhi.
2. Copy the **pooled** connection string. It looks like:
   `postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
3. Paste it into `.env.local` as `DATABASE_URL`.

Then create the tables and load the 24 clubs:

```bash
npm run db:push     # creates the 8 tables
npm run db:seed     # 24 clubs, ~2 weeks of nights, offers, reviews
```

Start it:

```bash
npm run dev
```

- App → http://localhost:3000
- Admin → http://localhost:3000/admin
  (username `syncout.com`, password `ganeshSHIV`, or auth key `ganeshSHIV@11`)

Open the app in your browser's device mode on an iPhone/Android size — it's built mobile-first.

**Useful:**

```bash
npm run db:studio   # visual DB browser at local.drizzle.studio
npm run typecheck   # TS check, no build
npm run build       # full production build
```

---

## 3. Push to a public GitHub repo

```bash
git init
git add -A
git commit -m "SyncOut: initial build"
git branch -M main
```

Create an empty **public** repo on github.com called `syncout`, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/syncout.git
git push -u origin main
```

`.env.local` is gitignored — your credentials do not leave your machine.

---

## 4. Deploy on Vercel

1. **vercel.com** → Add New → Project → import `syncout`. It detects Next.js; leave build settings alone.
2. Before clicking Deploy, open **Environment Variables** and add these:

| Name | Value |
|---|---|
| `DATABASE_URL` | your Neon pooled string |
| `AUTH_SECRET` | the openssl output from step 1 |
| `ADMIN_USERNAME` | `syncout.com` |
| `ADMIN_PASSWORD` | your real password |
| `ADMIN_AUTH_KEY` | your real auth key |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |
| `GUESTLIST_CUTOFF_HOUR` | `18` |

Leave `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY` and `MAIL_ENABLED` out for now — the app runs fine without them.

3. Deploy.

### Turn on photo uploads

Vercel → your project → **Storage** → Create → **Blob**. Connecting it adds
`BLOB_READ_WRITE_TOKEN` automatically. Redeploy. Admin → Clubs → upload now works.

### Turn on email

1. **resend.com** → add your domain → add the DNS records they give you.
2. Add to Vercel env: `RESEND_API_KEY`, `MAIL_FROM="SyncOut <guestlist@yourdomain.com>"`, `MAIL_ENABLED=true`.
3. Redeploy.

Until then every email is logged to the Vercel function log instead of sending. Nothing breaks.

### Seed production

Point your local `.env.local` at the production `DATABASE_URL` for one command:

```bash
npm run db:push
npm run db:seed
```

Then put your dev URL back.

---

## 5. Optional: deploy from GitHub Actions instead

Vercel's own Git integration already redeploys on every push, so this is only if you
want the deploy to run through Actions. In the repo → Settings → Secrets → Actions, add:

- `VERCEL_TOKEN` — vercel.com/account/tokens
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` — from `.vercel/project.json` after running `npx vercel link`

`.github/workflows/ci.yml` runs typecheck + build on every PR and needs no secrets —
the database client connects lazily, so CI builds without a live Postgres.

---

## 6. Day-to-day

```bash
git pull
npm install          # only if package.json changed
npm run dev
```

Ship a change:

```bash
npm run build        # catch errors before Vercel does
git add -A
git commit -m "what changed"
git push             # Vercel deploys automatically
```

For adding features from patch files, see **PATCHING.md**.
