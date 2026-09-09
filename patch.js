#!/usr/bin/env node
/**
 * SyncOut patch runner
 * ────────────────────────────────────────────────────────────────
 * Applies feature patches to this repo. Zero dependencies.
 *
 *   node patch.js                 apply every patch that hasn't run yet
 *   node patch.js --dry           show what would change, touch nothing
 *   node patch.js --only 003      run one patch by id prefix
 *   node patch.js --force         re-apply even if already recorded
 *   node patch.js --list          show applied / pending
 *   node patch.js --rollback 003  restore the files that patch changed
 *
 * Patches are picked up from:
 *   ./patches/*.js      (preferred — keeps history in git)
 *   ./patch-*.js        (repo root, for a one-off drop-in)
 *
 * A patch file looks like:
 *
 *   module.exports = {
 *     id: "003-favourites",
 *     description: "Save clubs to a favourites list",
 *     ops: [
 *       { type: "write",   path: "src/x.tsx", content: `...` },
 *       { type: "replace", path: "src/y.ts", find: "old", replace: "new" },
 *       { type: "append",  path: "src/z.css", content: "..." },
 *       { type: "delete",  path: "src/old.tsx" },
 *       { type: "package", deps: { zod: "^3" }, scripts: { foo: "bar" } },
 *       { type: "run",     cmd: "npm install" },
 *     ],
 *   };
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = __dirname;
const LEDGER = path.join(ROOT, ".patches-applied.json");
const BACKUPS = path.join(ROOT, ".patch-backups");

/* ── tiny console helpers ─────────────────────────────────────── */
const c = (n, s) => (process.stdout.isTTY ? `\x1b[${n}m${s}\x1b[0m` : s);
const red = (s) => c(31, s);
const green = (s) => c(32, s);
const yellow = (s) => c(33, s);
const dim = (s) => c(90, s);
const bold = (s) => c(1, s);

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valOf = (f) => {
  const i = args.indexOf(f);
  return i > -1 ? args[i + 1] : null;
};

const DRY = has("--dry");
const FORCE = has("--force");
const ONLY = valOf("--only");
const ROLLBACK = valOf("--rollback");

/* ── ledger ───────────────────────────────────────────────────── */

function readLedger() {
  try {
    return JSON.parse(fs.readFileSync(LEDGER, "utf8"));
  } catch {
    return { applied: [] };
  }
}

function writeLedger(l) {
  fs.writeFileSync(LEDGER, JSON.stringify(l, null, 2) + "\n");
}

/* ── discovery ────────────────────────────────────────────────── */

function discover() {
  const files = [];

  const dir = path.join(ROOT, "patches");
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).sort()) {
      if (f.endsWith(".js") && !f.startsWith("_")) files.push(path.join(dir, f));
    }
  }

  for (const f of fs.readdirSync(ROOT).sort()) {
    if (/^patch-.+\.js$/.test(f)) files.push(path.join(ROOT, f));
  }

  return files.map((file) => {
    let mod;
    try {
      mod = require(file);
    } catch (e) {
      throw new Error(`Could not read patch ${path.relative(ROOT, file)}\n  ${e.message}`);
    }
    if (!mod || !mod.id || !Array.isArray(mod.ops)) {
      throw new Error(`${path.relative(ROOT, file)} is missing "id" or "ops"`);
    }
    return { file, ...mod };
  });
}

/* ── validation: check everything before writing anything ─────── */

function validate(patch) {
  const problems = [];

  patch.ops.forEach((op, i) => {
    const where = `op ${i + 1} (${op.type})`;
    const abs = op.path ? path.join(ROOT, op.path) : null;

    if (abs && !abs.startsWith(ROOT)) {
      problems.push(`${where}: path escapes the repo — ${op.path}`);
      return;
    }

    switch (op.type) {
      case "write":
        if (typeof op.content !== "string") problems.push(`${where}: needs a string "content"`);
        break;

      case "replace": {
        if (!fs.existsSync(abs)) {
          problems.push(`${where}: ${op.path} does not exist`);
          break;
        }
        const src = fs.readFileSync(abs, "utf8");
        const count = src.split(op.find).length - 1;
        if (count === 0) problems.push(`${where}: "find" text not found in ${op.path}`);
        else if (count > 1 && !op.all)
          problems.push(`${where}: "find" matches ${count} times in ${op.path} — set all:true or make it unique`);
        break;
      }

      case "append":
        if (typeof op.content !== "string") problems.push(`${where}: needs a string "content"`);
        break;

      case "delete":
        if (!fs.existsSync(abs)) problems.push(`${where}: ${op.path} already gone`);
        break;

      case "package":
        if (!fs.existsSync(path.join(ROOT, "package.json")))
          problems.push(`${where}: no package.json here — are you in the repo root?`);
        break;

      case "run":
        if (!op.cmd) problems.push(`${where}: needs a "cmd"`);
        break;

      default:
        problems.push(`${where}: unknown op type "${op.type}"`);
    }
  });

  return problems;
}

/* ── apply ────────────────────────────────────────────────────── */

function backupFile(patchId, rel) {
  const abs = path.join(ROOT, rel);
  const dest = path.join(BACKUPS, patchId, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(abs)) fs.copyFileSync(abs, dest);
  else fs.writeFileSync(dest + ".was-absent", "");
}

function apply(patch) {
  const touched = [];
  const commands = [];

  for (const op of patch.ops) {
    const rel = op.path;
    const abs = rel ? path.join(ROOT, rel) : null;

    if (op.type === "run") {
      commands.push(op.cmd);
      if (!DRY) {
        console.log(dim(`    $ ${op.cmd}`));
        execSync(op.cmd, { cwd: ROOT, stdio: "inherit" });
      } else {
        console.log(dim(`    would run: ${op.cmd}`));
      }
      continue;
    }

    if (op.type === "package") {
      const pkgPath = path.join(ROOT, "package.json");
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      Object.assign((pkg.dependencies ??= {}), op.deps || {});
      Object.assign((pkg.devDependencies ??= {}), op.devDeps || {});
      Object.assign((pkg.scripts ??= {}), op.scripts || {});
      pkg.dependencies = sortKeys(pkg.dependencies);
      pkg.devDependencies = sortKeys(pkg.devDependencies);
      if (!DRY) {
        backupFile(patch.id, "package.json");
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
      }
      touched.push("package.json");
      console.log(`    ${green("~")} package.json`);
      continue;
    }

    if (!DRY) backupFile(patch.id, rel);

    switch (op.type) {
      case "write": {
        const isNew = !fs.existsSync(abs);
        if (!DRY) {
          fs.mkdirSync(path.dirname(abs), { recursive: true });
          fs.writeFileSync(abs, op.content);
        }
        console.log(`    ${green(isNew ? "+" : "~")} ${rel}`);
        break;
      }
      case "replace": {
        const src = fs.readFileSync(abs, "utf8");
        const out = op.all ? src.split(op.find).join(op.replace) : src.replace(op.find, op.replace);
        if (!DRY) fs.writeFileSync(abs, out);
        console.log(`    ${green("~")} ${rel}`);
        break;
      }
      case "append": {
        if (!DRY) fs.appendFileSync(abs, op.content);
        console.log(`    ${green("~")} ${rel}`);
        break;
      }
      case "delete": {
        if (!DRY) fs.rmSync(abs, { recursive: true, force: true });
        console.log(`    ${red("-")} ${rel}`);
        break;
      }
    }
    touched.push(rel);
  }

  return { touched, commands };
}

function sortKeys(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
}

/* ── rollback ─────────────────────────────────────────────────── */

function rollback(idPrefix) {
  const ledger = readLedger();
  const entry = ledger.applied.find((a) => a.id.startsWith(idPrefix));
  if (!entry) {
    console.log(red(`No applied patch matching "${idPrefix}".`));
    process.exit(1);
  }

  const dir = path.join(BACKUPS, entry.id);
  if (!fs.existsSync(dir)) {
    console.log(red(`No backup found for ${entry.id}. Use git to revert instead.`));
    process.exit(1);
  }

  console.log(bold(`\nRolling back ${entry.id}`));

  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name);
      if (fs.statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      const rel = path.relative(dir, full);
      if (rel.endsWith(".was-absent")) {
        const target = path.join(ROOT, rel.replace(/\.was-absent$/, ""));
        fs.rmSync(target, { force: true });
        console.log(`  ${red("-")} ${rel.replace(/\.was-absent$/, "")}`);
      } else {
        const target = path.join(ROOT, rel);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(full, target);
        console.log(`  ${green("~")} ${rel}`);
      }
    }
  };
  walk(dir);

  ledger.applied = ledger.applied.filter((a) => a.id !== entry.id);
  writeLedger(ledger);
  console.log(green(`\nRolled back. Run npm install if the patch touched dependencies.\n`));
}

/* ── main ─────────────────────────────────────────────────────── */

function main() {
  if (!fs.existsSync(path.join(ROOT, "package.json"))) {
    console.log(red("patch.js must sit in the repo root, next to package.json."));
    process.exit(1);
  }

  if (ROLLBACK) return rollback(ROLLBACK);

  const ledger = readLedger();
  const appliedIds = new Set(ledger.applied.map((a) => a.id));

  let patches;
  try {
    patches = discover();
  } catch (e) {
    console.log(red(e.message));
    process.exit(1);
  }

  if (has("--list")) {
    console.log(bold("\nPatches\n"));
    if (!patches.length) console.log(dim("  none found"));
    for (const p of patches) {
      const done = appliedIds.has(p.id);
      console.log(`  ${done ? green("applied") : yellow("pending")}  ${p.id}  ${dim(p.description || "")}`);
    }
    console.log();
    return;
  }

  let queue = patches.filter((p) => FORCE || !appliedIds.has(p.id));
  if (ONLY) queue = queue.filter((p) => p.id.startsWith(ONLY));

  if (!queue.length) {
    console.log(green("\nNothing to do — every patch is already applied.\n"));
    return;
  }

  console.log(bold(`\n${DRY ? "Dry run — " : ""}${queue.length} patch${queue.length > 1 ? "es" : ""} to apply\n`));

  // Check the whole queue first. One bad patch means nothing gets written.
  let blocked = false;
  for (const patch of queue) {
    const problems = validate(patch);
    if (problems.length) {
      blocked = true;
      console.log(red(`  ${patch.id} cannot apply:`));
      problems.forEach((p) => console.log(red(`    · ${p}`)));
      console.log();
    }
  }
  if (blocked) {
    console.log(
      dim(
        `Nothing was written. This usually means the target file already changed.\n` +
          `Check the patch against your current code, or run: git status\n`
      )
    );
    process.exit(1);
  }

  for (const patch of queue) {
    console.log(`  ${bold(patch.id)} ${dim(patch.description || "")}`);

    let result;
    try {
      result = apply(patch);
    } catch (e) {
      console.log(red(`\n  Failed partway through: ${e.message}`));
      console.log(dim(`  Restore with: node patch.js --rollback ${patch.id}\n`));
      process.exit(1);
    }

    if (!DRY) {
      ledger.applied = ledger.applied.filter((a) => a.id !== patch.id);
      ledger.applied.push({
        id: patch.id,
        description: patch.description || "",
        at: new Date().toISOString(),
        files: result.touched,
      });
      writeLedger(ledger);
    }
    console.log();
  }

  if (DRY) {
    console.log(yellow("Dry run — nothing was written. Drop --dry to apply.\n"));
    return;
  }

  console.log(green("Done.\n"));
  console.log(dim("Next:  npm run build   then   git add -A && git commit -m \"patch\" && git push\n"));
}

main();
