import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const ignored = new Set([".git", ".next", ".open-next", ".wrangler", "node_modules", "coverage"]);
const textExtensions = new Set([".cjs", ".css", ".html", ".js", ".json", ".jsonc", ".md", ".mjs", ".ts", ".tsx", ".yaml", ".yml"]);
const forbiddenFiles = /^\.env(?:\..+)?$/;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\bgh[oprs]_[A-Za-z0-9_]{30,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /(?:api[_-]?key|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*["'][^"'\s]{12,}["']/i,
];

const findings = [];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    const projectPath = relative(root, path).replaceAll("\\", "/");
    if (entry.isDirectory()) { await scan(path); continue; }
    if (forbiddenFiles.test(entry.name) && entry.name !== ".env.example") findings.push(`${projectPath}: forbidden environment file`);
    if (!textExtensions.has(extname(entry.name)) && entry.name !== ".env.example") continue;
    const content = await readFile(path, "utf8");
    for (const pattern of secretPatterns) if (pattern.test(content)) findings.push(`${projectPath}: candidate secret (${pattern.source})`);
  }
}

await scan(root);
if (findings.length) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Security scan passed: no committed environment files or candidate secrets found.");
}
