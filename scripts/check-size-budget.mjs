#!/usr/bin/env node

import fs from "node:fs";

const budgets = [
  ["app.js", 350 * 1024],
  ["features/estimation-engine.js", 100 * 1024],
  ["features/i18n-runtime.js", 60 * 1024],
  ["features/gpu-advisor.js", 32 * 1024],
  ["features/model-placement.js", 115 * 1024],
  ["features/benchmark-workspace.js", 40 * 1024],
  ["platform-v2.js", 60 * 1024],
  ["platform-v3.js", 210 * 1024],
  ["styles.css", 170 * 1024],
];

const failures = [];
for (const [file, limit] of budgets) {
  const bytes = fs.statSync(file).size;
  const pct = Math.round(bytes / limit * 100);
  console.log(`${file}: ${(bytes / 1024).toFixed(1)} KiB / ${(limit / 1024).toFixed(0)} KiB (${pct}%)`);
  if (bytes > limit) failures.push(`${file} exceeds its ${(limit / 1024).toFixed(0)} KiB budget`);
}

if (failures.length) {
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
