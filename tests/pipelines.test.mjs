import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

test("Pages deployment builds a cache-stamped artifact", () => {
  assert.ok(fs.existsSync("_site/index.html"), "run npm run build:static before tests");
  const html = fs.readFileSync("_site/index.html", "utf8");
  assert.equal(html.includes("__CACHE_VERSION__"), false);
  assert.match(html, /app\.js\?v=[a-f0-9]{7,}/);
});

test("GPU request parser accepts a sourced normalized laptop record", () => {
  const body = `### GPU 이름

GeForce RTX Test Laptop 16GB
### 제조사

NVIDIA
### 아키텍처

Test Architecture
### 메모리 유형

전용 VRAM
### 폼팩터

노트북
### VRAM

16GB
### 메모리 대역폭

512 GB/s
### 최소 TGP

60W
### 최대 TGP

150W
### 확인된 실행 환경

- [x] CUDA
### 출처

https://www.nvidia.com/en-us/geforce/`;
  const result = spawnSync(process.execPath, ["scripts/gpu-request-tools.mjs"], {
    cwd: process.cwd(),
    env: { ...process.env, GPU_REQUEST_BODY: body },
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Required specifications/);
  assert.match(result.stdout, /tgpMinW: 60/);
});

test("GPU and benchmark request workflows have guarded approval labels", () => {
  const gpu = fs.readFileSync(".github/workflows/gpu-request.yml", "utf8");
  const benchmark = fs.readFileSync(".github/workflows/benchmark-request.yml", "utf8");
  assert.match(gpu, /gpu-ready/);
  assert.match(gpu, /steps\.gpu\.outputs\.valid == 'true'/);
  assert.match(benchmark, /benchmark-ready/);
  assert.match(benchmark, /steps\.benchmark\.outputs\.valid == 'true'/);
});
