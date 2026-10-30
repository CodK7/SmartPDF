import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const outputRoot = join(root, ".open-next");
const workerPath = join(outputRoot, "worker.js");
const configPath = join(root, "wrangler.jsonc");
const forbiddenRuntimeMarkers = [
  "playwright-core",
  "CHROMIUM_EXECUTABLE_PATH",
  "Microsoft\\\\Edge\\\\Application",
  "Google\\\\Chrome\\\\Application",
];

async function collectJavaScript(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collectJavaScript(path, files);
    else if ([".js", ".mjs", ".cjs"].includes(extname(entry.name))) files.push(path);
  }
  return files;
}

await stat(workerPath);
const config = JSON.parse(await readFile(configPath, "utf8"));
if (config.browser?.binding !== "BROWSER") throw new Error("Missing production Browser Rendering binding");
if (config.vars?.PDF_EXPORT_ENABLED !== "0") throw new Error("Production PDF export must remain fail-closed before the final gate");
if (config.preview_urls !== true) throw new Error("Cloudflare version Preview URLs must be explicitly enabled");

const preview = config.env?.preview;
if (preview?.browser?.binding !== "BROWSER" || preview?.vars?.PDF_EXPORT_ENABLED !== "1") {
  throw new Error("Preview Browser Rendering environment is incomplete");
}

for (const target of [config, preview]) {
  const names = new Set((target.ratelimits ?? []).map((binding) => binding.name));
  for (const name of ["PDF_EXPORT_IP_RATE_LIMITER", "PDF_EXPORT_ROUTE_RATE_LIMITER"]) {
    if (!names.has(name)) throw new Error(`Missing rate-limit binding: ${name}`);
  }
}

const findings = [];
for (const path of await collectJavaScript(outputRoot)) {
  const content = await readFile(path, "utf8");
  for (const marker of forbiddenRuntimeMarkers) {
    if (content.includes(marker)) findings.push(`${relative(root, path)} contains ${marker}`);
  }
}

if (findings.length) {
  throw new Error(`Cloudflare artifact contains local-only renderer code:\n${findings.join("\n")}`);
}
console.log("Cloudflare artifact verified: bindings are present and local browser code is excluded.");
