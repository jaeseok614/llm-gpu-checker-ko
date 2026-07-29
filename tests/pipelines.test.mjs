import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Pages deployment builds a cache-stamped artifact", () => {
  assert.ok(fs.existsSync("_site/index.html"), "run npm run build:static before tests");
  const html = fs.readFileSync("_site/index.html", "utf8");
  assert.equal(html.includes("__CACHE_VERSION__"), false);
  assert.match(html, /app\.js\?v=[a-f0-9]{7,}/);
});

test("GPU and benchmark request workflows have guarded approval labels", () => {
  const gpu = fs.readFileSync(".github/workflows/gpu-request.yml", "utf8");
  const benchmark = fs.readFileSync(".github/workflows/benchmark-request.yml", "utf8");
  assert.match(gpu, /gpu-ready/);
  assert.match(gpu, /steps\.gpu\.outputs\.valid == 'true'/);
  assert.match(benchmark, /benchmark-ready/);
  assert.match(benchmark, /steps\.benchmark\.outputs\.valid == 'true'/);
});
