// Bundles ios/editor/editor.js into the app's resources as one self-contained
// file. The output is committed, so building the iOS app never needs Node —
// only changing the editor does.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

const result = await build({
  entryPoints: [path.join(here, "editor.js")],
  outfile: path.join(here, "../MfolioAdmin/Editor/editor.bundle.js"),
  bundle: true,
  format: "iife",
  // WKWebView on the app's minimum iOS.
  target: ["safari17"],
  minify: true,
  legalComments: "none",
  metafile: true,
  logLevel: "info",
});

const bytes = Object.values(result.metafile.outputs).reduce((sum, o) => sum + o.bytes, 0);
console.log(`editor bundle: ${(bytes / 1024).toFixed(0)} KB`);
