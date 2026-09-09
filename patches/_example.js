/**
 * Template. Files starting with "_" are ignored by the runner —
 * copy this, drop the underscore, and it runs.
 */
module.exports = {
  id: "000-example",
  description: "What this patch does, in one line",

  ops: [
    // Create or overwrite a file. Use for new components/pages.
    {
      type: "write",
      path: "src/components/Example.tsx",
      content: `export function Example() {
  return <p>hello</p>;
}
`,
    },

    // Surgical edit. "find" must appear exactly once, or the patch refuses to run.
    {
      type: "replace",
      path: "src/components/TabBar.tsx",
      find: `{ href: "/profile", label: "You", Icon: User },`,
      replace: `{ href: "/profile", label: "You", Icon: User },
  // added by patch 000`,
      // all: true,   // set this to replace every occurrence instead
    },

    // Add to the end of a file (handy for globals.css).
    {
      type: "append",
      path: "src/app/globals.css",
      content: `\n.example { color: var(--color-gold); }\n`,
    },

    // Merge into package.json — deps are sorted automatically.
    {
      type: "package",
      deps: { "date-fns": "^4.1.0" },
      devDeps: {},
      scripts: { "check:example": "echo ok" },
    },

    // Shell command, run from the repo root, in order.
    { type: "run", cmd: "npm install" },

    // Remove a file.
    // { type: "delete", path: "src/components/Old.tsx" },
  ],
};
