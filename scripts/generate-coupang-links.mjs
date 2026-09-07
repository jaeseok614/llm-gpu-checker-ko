#!/usr/bin/env node
/**
 * One-time/periodic offline tool: converts this app's GPU search queries
 * into real, commission-tracked Coupang Partners "deep links", and writes
 * the results into data/coupang-affiliate-links.js.
 *
 * WHY THIS IS A SEPARATE OFFLINE SCRIPT, NOT CLIENT-SIDE CODE:
 * Coupang Partners' Deeplink API requires a request signed with your
 * SECRET KEY (HMAC-SHA256). A secret key can never be safely shipped to a
 * browser -- anyone viewing this site's source could read it and use your
 * account. So this conversion has to happen here, offline, where only you
 * (holding the credentials) can run it -- never inside features/*.js.
 *
 * BEFORE YOU CAN RUN THIS:
 * 1. Create a Coupang Partners account at https://partners.coupang.com
 * 2. Issue an Open API access key + secret key from your Partners
 *    dashboard (NOT developers.coupang.com -- that's Coupang's separate
 *    seller/logistics API and uses different credentials).
 * 3. Double-check the exact Deeplink endpoint path and request/response
 *    shape against your Partners dashboard's current API docs before
 *    relying on this -- Coupang's API surface can change, and the path
 *    below (`/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink`)
 *    reflects the commonly-documented endpoint as of when this script was
 *    written, not a live-verified contract.
 *
 * USAGE:
 *   COUPANG_ACCESS_KEY=xxx COUPANG_SECRET_KEY=yyy node scripts/generate-coupang-links.mjs
 *
 * The two env vars are read only at runtime and never written to disk --
 * only the resulting public tracked URLs (shortenUrl/landingUrl) get
 * written into data/coupang-affiliate-links.js, which is safe to commit.
 *
 * Re-run this periodically (e.g. whenever GPU search queries change, or if
 * Coupang invalidates old deep links) -- it's fully idempotent, safe to
 * run as many times as you like.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("Missing COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY environment variables.");
  console.error("See the comment at the top of this file for how to obtain them.");
  process.exit(1);
}

const DOMAIN = "api-gateway.coupang.com";
const DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

// Every GPU search query this app currently uses for its Coupang
// "구매하기" button -- derived from data/gpus.js's own `name` field with
// the exact same shortGpuName() transform the UI applies (strip
// "NVIDIA"/"GeForce" prefixes, collapse whitespace), so the queries this
// script pre-generates deep links for are guaranteed to match what
// buildCoupangLink() actually gets called with in
// features/gpu-advisor.js -- otherwise a mismatch would silently fall back
// to a plain, unmonetized link even after this script has been run.
function shortGpuName(name) {
  return String(name || "")
    .replace(/^NVIDIA\s+/i, "")
    .replace(/^GeForce\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function loadQueries() {
  const gpusSrc = fs.readFileSync(path.join(rootDir, "data/gpus.js"), "utf8");
  const nameMatches = [...gpusSrc.matchAll(/name:\s*"([^"]+)"/g)];
  const queries = new Set(nameMatches.map((match) => shortGpuName(match[1])).filter(Boolean));
  return [...queries];
}

// Coupang's "CEA" HMAC-SHA256 signature scheme: sign
// `${signedDate}${method}${path}${query}` with the secret key, and send it
// as an Authorization header formatted exactly as below. signedDate must
// be UTC, format yyMMdd'T'HHmmss'Z'.
function signedDateNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${String(d.getUTCFullYear()).slice(2)}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildAuthorizationHeader(method, urlPath, query) {
  const signedDate = signedDateNow();
  const message = `${signedDate}${method}${urlPath}${query}`;
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${signedDate}, signature=${signature}`;
}

function requestDeeplinks(coupangUrls) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ coupangUrls });
    const authorization = buildAuthorizationHeader("POST", DEEPLINK_PATH, "");
    const req = https.request({
      hostname: DOMAIN,
      path: DEEPLINK_PATH,
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Coupang API returned HTTP ${res.statusCode}: ${raw.slice(0, 500)}`));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (error) {
          reject(new Error(`Could not parse Coupang API response as JSON: ${raw.slice(0, 500)}`));
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const queries = loadQueries();
  console.log(`Found ${queries.length} GPU search queries to convert.`);

  const results = {};
  // Coupang's deeplink API converts existing coupang.com URLs, not search
  // queries directly -- so first point it at each query's plain search
  // page, then store the tracked version of THAT search page. Rate-limit
  // gently (sequential, not parallel) since this is a one-off/occasional
  // script, not a hot path.
  for (const query of queries) {
    const plainUrl = `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}`;
    try {
      const response = await requestDeeplinks([plainUrl]);
      if (response.rCode !== "0" || !response.data?.[0]) {
        console.warn(`  skip "${query}": unexpected response ${JSON.stringify(response).slice(0, 200)}`);
        continue;
      }
      const { shortenUrl, landingUrl } = response.data[0];
      results[query] = shortenUrl || landingUrl;
      console.log(`  ok "${query}" -> ${results[query]}`);
    } catch (error) {
      console.warn(`  failed "${query}": ${error.message}`);
    }
  }

  const outPath = path.join(rootDir, "data/coupang-affiliate-links.js");
  const fileContents = `// Auto-generated by scripts/generate-coupang-links.mjs -- do not hand-edit.
// Re-run that script (with COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY set) to
// refresh these links. Contains only public tracked URLs, never credentials.
window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};
window.LLM_GPU_CHECKER_DATA.coupangDeepLinks = ${JSON.stringify(results, null, 2)};
`;
  fs.writeFileSync(outPath, fileContents, "utf8");
  console.log(`\nWrote ${Object.keys(results).length} tracked links to ${outPath}`);
  console.log("Add <script src=\"./data/coupang-affiliate-links.js\"></script> to index.html (after data/decision-data.js) if it isn't there yet.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
