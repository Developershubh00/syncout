# Patching

How new features get added to this repo without you hand-editing files.

I hand you a patch file. You drop it in, run one command, check the build, push.

---

## The loop

```bash
# 1. put the file I gave you in the repo root, then:
node patch.js --dry     # shows exactly what it will touch, writes nothing
node patch.js           # applies it
npm run build           # confirm the app still compiles
git add -A && git commit -m "patch: <name>" && git push
```

That's it. Vercel redeploys on the push.

---

## Where the file goes

Either works:

| Location | When |
|---|---|
| `patches/003-favourites.js` | preferred — the patch stays in git as history |
| `patch-favourites.js` (repo root) | fine for a quick one-off |

The runner picks up `patches/*.js` and any root file matching `patch-*.js`.
Files starting with `_` are ignored, which is why the template is `patches/_example.js`.

---

## Commands

```bash
node patch.js                     # apply everything not yet applied
node patch.js --dry               # preview — writes nothing
node patch.js --list              # what's applied, what's pending
node patch.js --only 003          # run just one, by id prefix
node patch.js --force             # re-run something already applied
node patch.js --rollback 003      # undo it, restore the original files
```

---

## Safety

**It validates the entire queue before writing a single byte.** If any `replace` can't
find its target text, or matches more than once, the whole run aborts and your files are
untouched. You get told which op and which file.

**Every changed file is backed up** to `.patch-backups/<patch-id>/` before it's written.
`--rollback` restores from there, including deleting files the patch created.

**Applied patches are recorded** in `.patches-applied.json`, so running `node patch.js`
twice does nothing the second time. Commit that file — it's how the repo knows its state.

`.patch-backups/` is gitignored. `.patches-applied.json` is not, and shouldn't be.

---

## If a patch refuses to apply

```
003-favourites cannot apply:
  · op 2 (replace): "find" text not found in src/lib/queries.ts
```

This means the file changed since I wrote the patch — usually because you edited it, or
an earlier patch touched the same lines. Nothing was written. Send me the error and the
current contents of that file and I'll re-cut the patch against your actual code.

---

## Patch file format

For reference — you don't need to write these, but here's what you're running.
A working template lives at `patches/_example.js`.

```js
module.exports = {
  id: "003-favourites",              // unique, sortable; the runner records this
  description: "Save clubs to a favourites list",

  ops: [
    // new file, or full overwrite
    { type: "write", path: "src/app/(app)/saved/page.tsx", content: `...` },

    // surgical edit — "find" must appear exactly once
    { type: "replace",
      path: "src/components/TabBar.tsx",
      find: `{ href: "/clubs", label: "Clubs", Icon: Disc3 },`,
      replace: `{ href: "/clubs", label: "Clubs", Icon: Disc3 },
  { href: "/saved", label: "Saved", Icon: Heart },` },

    // add to the end of a file
    { type: "append", path: "src/app/globals.css", content: `\n.saved { ... }\n` },

    // remove a file
    { type: "delete", path: "src/components/Old.tsx" },

    // merge into package.json (deps get sorted)
    { type: "package", deps: { "react-hook-form": "^7.54.0" } },

    // shell command from the repo root, run in order
    { type: "run", cmd: "npm install" },
  ],
};
```

Ops run top to bottom, so put `package` before the `run: npm install` that installs it.

---

## Database changes

If a patch adds or changes a table it will say so. After applying:

```bash
npm run db:generate    # writes a new SQL migration into drizzle/
npm run db:push        # applies it to your database
```

Do this against your local database first, then against production.
