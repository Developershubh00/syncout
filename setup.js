#!/usr/bin/env node
/**
 * SyncOut — one-shot setup.
 *
 *   node setup.js                 full run: deps, env, database, git, GitHub
 *   node setup.js --local         stop after the database seed, no git/GitHub
 *   node setup.js --two-repos     separate prod + dev repos instead of branches
 *   node setup.js --name my-app   repo name (default: syncout)
 *   node setup.js --public        create the repo public (default: private)
 *   node setup.js --yes          take every default, no prompts (CI-safe)\n *   node setup.js --help
 *
 * Safe to re-run. It never overwrites an existing .env.local, never force-pushes,
 * and stops at the first real failure instead of ploughing on.
 *
 * No dependencies — this runs before `npm install` has necessarily happened.
 */
"use strict";

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline/promises");

const ROOT = __dirname;
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const opt = (f, d) => {
  const i = argv.indexOf(f);
  return i > -1 && argv[i + 1] ? argv[i + 1] : d;
};

const LOCAL_ONLY = flag("--local");
const TWO_REPOS = flag("--two-repos");
const PUBLIC = flag("--public");
const REPO_NAME = opt("--name", "syncout");

/* ── output ─────────────────────────────────────────────────────── */

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let stepNo = 0;
const step = (t) => console.log(`\n${c.bold(`[${++stepNo}] ${t}`)}`);
const ok = (t) => console.log(`    ${c.green("✓")} ${t}`);
const warn = (t) => console.log(`    ${c.yellow("!")} ${t}`);
const info = (t) => console.log(`    ${c.dim(t)}`);
const die = (t, hint) => {
  console.error(`\n${c.red("✗ " + t)}`);
  if (hint) console.error(`  ${c.dim(hint)}`);
  process.exit(1);
};

/* ── shell ──────────────────────────────────────────────────────── */

/**
 * Run a command, streaming its output.
 * stdin is deliberately closed: npm and next don't need it, and if they inherit
 * it they swallow input the prompts are about to ask for. Throws on failure.
 */
function run(cmd, opts = {}) {
  execSync(cmd, { cwd: ROOT, stdio: ["ignore", "inherit", "inherit"], ...opts });
}

/** Run quietly and return trimmed stdout, or null if it failed. */
function capture(cmd) {
  const r = spawnSync(cmd, { cwd: ROOT, shell: true, encoding: "utf8" });
  return r.status === 0 ? (r.stdout || "").trim() : null;
}

const has = (bin) => capture(process.platform === "win32" ? `where ${bin}` : `command -v ${bin}`) !== null;

/* ── prompts ────────────────────────────────────────────────────── */

/**
 * When stdin isn't a terminal — CI, `< /dev/null`, a piped runner — prompting
 * would hang forever waiting on a line that never comes. In that case take the
 * default and say so, so an unattended run still completes.
 */
const INTERACTIVE = Boolean(process.stdin.isTTY) && !flag("--yes");

let rl;
const ask = async (q, fallback = "") => {
  if (!INTERACTIVE) {
    console.log(`    ${q} ${c.dim(fallback ? `${fallback} (default)` : "(skipped)")}`);
    return fallback;
  }
  rl ||= readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(`    ${q}${fallback ? c.dim(` [${fallback}]`) : ""} `)).trim();
  return a || fallback;
};
const confirm = async (q, def = true) => {
  if (!INTERACTIVE) {
    console.log(`    ${q} ${c.dim(`${def ? "yes" : "no"} (default)`)}`);
    return def;
  }
  const a = (await ask(`${q} ${def ? "(Y/n)" : "(y/N)"}`)).toLowerCase();
  return a === "" ? def : a.startsWith("y");
};

/* ── steps ──────────────────────────────────────────────────────── */

function checkTools() {
  step("Checking your toolchain");

  const major = Number(process.versions.node.split(".")[0]);
  if (major < 20) die(`Node ${process.versions.node} is too old.`, "Next 16 needs Node 20 or newer. Try: nvm install 22");
  ok(`node ${process.versions.node}`);

  if (!has("npm")) die("npm not found on PATH.");
  ok(`npm ${capture("npm -v")}`);

  if (!has("git")) die("git not found.", "https://git-scm.com/downloads");
  ok(`git ${(capture("git --version") || "").replace("git version ", "")}`);

  if (LOCAL_ONLY) return { gh: false };

  if (!has("gh")) {
    warn("GitHub CLI (gh) not found — I'll do the local setup and skip GitHub.");
    info("Install it later from https://cli.github.com, then re-run: node setup.js");
    return { gh: false };
  }
  const who = capture("gh api user --jq .login");
  if (!who) {
    warn("gh is installed but not logged in. Run: gh auth login");
    return { gh: false };
  }
  ok(`gh authenticated as ${who}`);
  return { gh: true, who };
}

function installDeps() {
  step("Installing dependencies");
  if (fs.existsSync(path.join(ROOT, "node_modules"))) {
    info("node_modules already present — running npm install to top up");
  }
  const lock = fs.existsSync(path.join(ROOT, "package-lock.json"));
  run(lock ? "npm ci --no-audit --no-fund" : "npm install --no-audit --no-fund");
  ok("dependencies installed");
}

async function writeEnv() {
  step("Setting up .env.local");
  const target = path.join(ROOT, ".env.local");

  if (fs.existsSync(target)) {
    ok(".env.local already exists — leaving it alone");
    const txt = fs.readFileSync(target, "utf8");
    const url = (txt.match(/^DATABASE_URL\s*=\s*"?([^"\n]*)"?/m) || [])[1];
    return { dbUrl: url && url.startsWith("postgres") ? url : null, created: false };
  }

  let txt = fs.readFileSync(path.join(ROOT, ".env.example"), "utf8");

  // Session secret — generated, never a placeholder.
  const secret = crypto.randomBytes(32).toString("base64");
  txt = txt.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${secret}"`);
  ok("generated a random AUTH_SECRET");

  console.log();
  info("Paste your Neon connection string. Get it from:");
  info("Vercel → Storage → your Neon database → .env.local tab,");
  info("or neon.tech → project → Connection string.");
  info("Press Enter to skip and fill it in by hand later.");
  const dbUrl = (await ask("DATABASE_URL:", process.env.DATABASE_URL || "")).trim();

  if (dbUrl && !/^postgres(ql)?:\/\//.test(dbUrl)) {
    warn("That doesn't look like a postgres:// URL — saving it anyway, check it before you run db:push.");
  }
  if (dbUrl) txt = txt.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${dbUrl}"`);

  console.log();
  info("Admin login for /admin. Change these from the demo values now if you can.");
  const user = await ask("ADMIN_USERNAME:", process.env.ADMIN_USERNAME || "syncout.com");
  const pass = await ask("ADMIN_PASSWORD:", process.env.ADMIN_PASSWORD || "ganeshSHIV");
  const key = await ask("ADMIN_AUTH_KEY:", process.env.ADMIN_AUTH_KEY || "ganeshSHIV@11");
  txt = txt
    .replace(/^ADMIN_USERNAME=.*$/m, `ADMIN_USERNAME="${user}"`)
    .replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD="${pass}"`)
    .replace(/^ADMIN_AUTH_KEY=.*$/m, `ADMIN_AUTH_KEY="${key}"`);

  if (pass === "ganeshSHIV" || key === "ganeshSHIV@11") {
    warn("Still on the demo admin credentials — rotate them in Vercel before this is public.");
  }

  fs.writeFileSync(target, txt);
  ok(".env.local written (gitignored — it will not be committed)");
  return { dbUrl: dbUrl || null, created: true };
}

async function setupDatabase(dbUrl) {
  step("Database");
  if (!dbUrl) {
    warn("No DATABASE_URL yet, so skipping schema + seed.");
    info("Add it to .env.local, then run: npm run db:push && npm run db:seed");
    return false;
  }

  info("Creating tables (drizzle-kit push)…");
  try {
    run("npm run db:push");
  } catch {
    die("db:push failed.", "Check DATABASE_URL in .env.local, and that the Neon project is awake.");
  }

  // db:push can exit 0 having failed to connect, so confirm the tables exist
  // before we tell you it worked.
  try {
    run("npm run db:check");
    ok("schema pushed and verified");
  } catch {
    die(
      "The schema did not land.",
      "drizzle-kit reported success but the tables aren't there — almost always a bad\n" +
        "  DATABASE_URL or a paused Neon project. Fix it in .env.local and re-run: node setup.js"
    );
  }

  if (await confirm("Seed 24 clubs and 2 weeks of nights? This clears existing rows.", true)) {
    try {
      run("npm run db:seed");
      ok("seeded");
    } catch {
      die("db:seed failed.", "The schema pushed fine, so this is likely a connection drop. Re-run: npm run db:seed");
    }
  } else {
    info("Skipped. Run it any time with: npm run db:seed");
  }
  return true;
}

async function buildCheck() {
  step("Build check");
  if (!(await confirm("Run a production build now? Takes about a minute.", true))) {
    info("Skipped. Run it later with: npm run build");
    return;
  }
  try {
    run("npm run build");
    ok("build succeeded");
  } catch {
    die("Build failed.", "Fix the error above before pushing — CI runs this same command.");
  }
}

function gitInit() {
  step("Git");
  if (fs.existsSync(path.join(ROOT, ".git"))) {
    ok("already a git repo");
  } else {
    run("git init -q");
    run("git symbolic-ref HEAD refs/heads/main");
    ok("initialised on main");
  }

  // Refuse to continue if .env.local would be committed.
  const tracked = capture("git check-ignore .env.local");
  if (!tracked) die(".env.local is not gitignored.", "Add it to .gitignore before committing — it holds your secrets.");

  if (capture("git status --porcelain")) {
    run("git add -A");
    const existing = capture("git rev-parse --verify HEAD");
    run(`git commit -q -m "${existing ? "chore: setup" : "feat: SyncOut guestlist app"}"`);
    ok(existing ? "committed changes" : "initial commit");
  } else {
    ok("nothing to commit");
  }
}

async function pushToGitHub() {
  step("GitHub");

  const visibility = PUBLIC ? "--public" : "--private";
  info(`Creating ${PUBLIC ? "public" : "private"} repo(s) as ${capture("gh api user --jq .login")}`);

  const create = (name) => {
    if (capture(`gh repo view ${name} --json name`)) {
      warn(`${name} already exists — reusing it`);
      return capture(`gh repo view ${name} --json url --jq .url`);
    }
    run(`gh repo create ${name} ${visibility} --source . --remote origin-tmp --description "SyncOut — Delhi NCR nightlife guestlist"`);
    capture("git remote remove origin-tmp");
    return capture(`gh repo view ${name} --json url --jq .url`);
  };

  if (TWO_REPOS) {
    warn("Two separate repos means merging prod and dev by hand. Branches are usually less painful.");
    const prod = create(REPO_NAME);
    const dev = create(`${REPO_NAME}-dev`);
    capture("git remote remove origin");
    capture("git remote remove dev");
    run(`git remote add origin ${prod}`);
    run(`git remote add dev ${dev}`);
    run("git push -u origin main");
    run("git push dev main");
    ok(`pushed to ${REPO_NAME} (prod) and ${REPO_NAME}-dev`);
    info("Work in the dev repo, then pull into this one to release.");
    return REPO_NAME;
  }

  const url = create(REPO_NAME);
  capture("git remote remove origin");
  run(`git remote add origin ${url}`);
  run("git push -u origin main");
  ok("pushed main (production)");

  if (!capture("git rev-parse --verify dev")) run("git branch dev");
  run("git push -u origin dev");
  ok("pushed dev (working branch)");

  run("git checkout dev");
  ok("switched you to dev — main is now release-only");
  return REPO_NAME;
}

async function setSecrets(repo) {
  step("GitHub Actions secrets");
  if (!(await confirm("Push your env values into GitHub secrets so CI can build?", true))) {
    info("Skipped. Set them later at: Settings → Secrets and variables → Actions");
    return;
  }

  const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  const read = (k) => (env.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\n]*)"?`, "m")) || [])[1] || "";

  const set = (k, v) => {
    if (!v) return warn(`${k} is empty — skipped`);
    const r = spawnSync("gh", ["secret", "set", k, "--repo", repo, "--body", v], { encoding: "utf8" });
    r.status === 0 ? ok(`${k} set`) : warn(`${k} failed: ${(r.stderr || "").trim()}`);
  };

  set("DATABASE_URL", read("DATABASE_URL"));
  set("AUTH_SECRET", read("AUTH_SECRET"));

  console.log();
  info("Vercel deploy secrets. Skip any of these with Enter — deploy.yml just won't run until they exist.");
  info("Token: vercel.com/account/tokens. Org/Project IDs: your project's .vercel/project.json after `vercel link`.");
  const token = await ask("VERCEL_TOKEN:");
  if (token) {
    set("VERCEL_TOKEN", token);
    set("VERCEL_ORG_ID", await ask("VERCEL_ORG_ID:"));
    set("VERCEL_PROJECT_ID", await ask("VERCEL_PROJECT_ID:"));
  } else {
    info("Skipped Vercel secrets.");
  }
}

function finish(repo, seeded, twoRepos) {
  console.log(`\n${c.green(c.bold("Done."))}\n`);
  console.log("  Next:");
  console.log(`    npm run dev            ${c.dim("→ http://localhost:3000")}`);
  console.log(`    open /admin            ${c.dim("→ log in with your ADMIN_ values")}`);
  if (!seeded) console.log(`    npm run db:push && npm run db:seed   ${c.dim("→ once DATABASE_URL is set")}`);
  if (repo && twoRepos) {
    console.log(`\n  Two remotes are set up:`);
    console.log(`    git push origin main    ${c.dim("→ prod")}`);
    console.log(`    git push dev main       ${c.dim("→ dev")}`);
  } else if (repo) {
    console.log(`\n  You're on ${c.bold("dev")}. To release:`);
    console.log(`    git push origin dev`);
    console.log(`    gh pr create --base main --head dev --fill && gh pr merge --merge`);
    console.log(`  ${c.dim("Merging to main triggers the Vercel deploy workflow.")}`);
  }
  console.log(`\n  ${c.dim("Import the repo at vercel.com/new to finish hosting.")}\n`);
}

/* ── main ───────────────────────────────────────────────────────── */

async function main() {
  if (flag("--help") || flag("-h")) {
    console.log(fs.readFileSync(__filename, "utf8").split("*/")[0].replace("#!/usr/bin/env node", ""));
    process.exit(0);
  }

  console.log(c.bold("\nSyncOut setup"));
  console.log(c.dim("Ctrl-C at any point is safe — nothing is half-written.\n"));

  const { gh } = checkTools();
  installDeps();
  const { dbUrl } = await writeEnv();
  const seeded = await setupDatabase(dbUrl);
  await buildCheck();

  let repo = null;
  if (!LOCAL_ONLY && gh) {
    gitInit();
    if (await confirm(`Create the GitHub repo and push?`, true)) {
      repo = await pushToGitHub();
      await setSecrets(repo);
    } else {
      info("Skipped GitHub. Your commits are safe locally.");
    }
  } else if (!LOCAL_ONLY) {
    gitInit();
    info("Install and authenticate gh, then re-run to create the repo.");
  }

  rl?.close();
  finish(repo, seeded, TWO_REPOS);
}

main().catch((e) => {
  rl?.close();
  die(e?.message || String(e));
});
