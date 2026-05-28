// build.mjs — JSX → JS transform pipeline.
//
// Each .jsx source is transformed in place to a sibling .js file in dist/.
// Globals are shared via window.* (data.jsx → background.jsx → components.jsx
// → contact.jsx → app.jsx); index.html loads the compiled files in that
// order. Run `npm run build` (or `npm run watch` while editing).

import { build, context } from "esbuild";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes("--watch");

const entries = (await readdir(here))
  .filter((f) => f.endsWith(".jsx"))
  .map((f) => join(here, f));

const opts = {
  entryPoints: entries,
  outdir: join(here, "dist"),
  outExtension: { ".js": ".js" },
  loader: { ".jsx": "jsx" },
  jsx: "transform",
  jsxFactory: "React.createElement",
  jsxFragment: "React.Fragment",
  target: "es2020",
  format: "iife",
  minify: true,
  bundle: false,
  logLevel: "info",
};

if (watch) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log("watching for changes…");
} else {
  await build(opts);
}
