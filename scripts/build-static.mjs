import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const outputDir = "_site";
const excluded = new Set([".git", ".github", "node_modules", "_site", "work", "outputs"]);
let version = process.env.GITHUB_SHA?.slice(0, 12) || "";

if (!version) {
  try {
    version = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    version = String(Date.now());
  }
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of fs.readdirSync(".")) {
  if (excluded.has(entry)) continue;
  fs.cpSync(entry, path.join(outputDir, entry), { recursive: true });
}

const indexPath = path.join(outputDir, "index.html");
const index = fs.readFileSync(indexPath, "utf8").replaceAll("__CACHE_VERSION__", version);
fs.writeFileSync(indexPath, index);

if (index.includes("__CACHE_VERSION__")) throw new Error("cache version placeholder was not fully replaced");
console.log(`built ${outputDir} with cache version ${version}`);
