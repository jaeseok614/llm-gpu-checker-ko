#!/usr/bin/env node

import { spawnSync } from "node:child_process";

// jsdom keeps a large browser-like document graph for each UI regression.
// Running every suite in one process can exceed the GitHub Actions Node heap,
// so each group gets a fresh process and releases its memory on completion.
const groups = [
  [
    "weights:",
    "auto quantization",
    "fit grading",
    "heterogeneous GPU",
    "embedding batch",
    "reranker candidate",
    "OCR resolution",
  ],
  [
    "mode, filtering",
    "first-visit",
    "quick recommendation",
    "multi-GPU placement",
    "model comparison",
    "URL state",
    "benchmark estimate",
  ],
  [
    "GPU contribution",
    "v1.3 GPU",
    "v1.4 advisor",
    "v1.5 catalog",
  ],
  [
    "v2.0 decision",
    "v2.2 user",
  ],
  [
    "v3.7 infrastructure",
  ],
];

const batchArg = process.argv.find((arg) => arg.startsWith("--batch="));
const requestedBatch = batchArg ? Number(batchArg.split("=")[1]) : null;
if (requestedBatch !== null && (!Number.isInteger(requestedBatch) || requestedBatch < 1 || requestedBatch > groups.length)) {
  console.error(`--batch must be an integer from 1 to ${groups.length}.`);
  process.exit(2);
}

const selectedGroups = requestedBatch === null
  ? groups.map((names, index) => ({ names, index }))
  : [{ names: groups[requestedBatch - 1], index: requestedBatch - 1 }];

for (const { names, index } of selectedGroups) {
  const pattern = names.join("|");
  console.log(`\n[test batch ${index + 1}/${groups.length}] ${pattern}`);
  const result = spawnSync(process.execPath, [
    "--test",
    "--test-force-exit",
    `--test-name-pattern=${pattern}`,
    "tests/calculations.test.mjs",
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(requestedBatch === null
  ? "\nAll test batches passed."
  : `\nTest batch ${requestedBatch} passed.`);
