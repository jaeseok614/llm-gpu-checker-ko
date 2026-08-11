import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataFiles = [
  "data/gpus.js",
  "data/quantizations.js",
  "data/precision-profiles.js",
  "data/models.js",
  "data/embedding-models.js",
  "data/reranker-models.js",
  "data/ocr-models.js",
  "data/audio-models.js",
  "data/model-metadata.js",
  "data/model-capabilities.js",
  "data/benchmarks.js",
  "data/licenses.js",
  "data/decision-data.js",
];
const context = { window: {} };
context.window.LLM_GPU_CHECKER_DATA = {};
vm.createContext(context);
for (const relative of dataFiles) {
  vm.runInContext(fs.readFileSync(path.join(root, relative), "utf8"), context, { filename: relative });
}

const data = context.window.LLM_GPU_CHECKER_DATA;
const warnings = [];
const errors = [];
const duplicateValues = (items, valueOf) => {
  const seen = new Set();
  const duplicates = new Set();
  items.forEach((item) => {
    const value = String(valueOf(item) || "").trim().toLowerCase();
    if (!value) return;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
};
const models = [
  ...(data.models || []),
  ...(data.embeddingModels || []),
  ...(data.rerankerModels || []),
  ...(data.ocrModels || []),
  ...(data.audioModels || []),
];

for (const id of duplicateValues(data.gpus || [], (gpu) => gpu.id)) errors.push(`Duplicate GPU id: ${id}`);
for (const name of duplicateValues(models, (model) => `${model.type || "generative"}:${model.name}`)) errors.push(`Duplicate model: ${name}`);

const validHttps = (value) => /^https:\/\/[^\s]+$/i.test(String(value || ""));
(data.gpus || []).forEach((gpu) => {
  if (!gpu.id || !gpu.name || !Number.isFinite(gpu.vram) || !Number.isFinite(gpu.bandwidth)) {
    errors.push(`Incomplete GPU schema: ${gpu.id || gpu.name || "unknown"}`);
  }
  if (gpu.sourceUrl && !validHttps(gpu.sourceUrl)) errors.push(`GPU source is not HTTPS: ${gpu.id}`);
});
models.forEach((model) => {
  if (!model.name) errors.push("Model is missing a name");
  if (model.sourceUrl && !validHttps(model.sourceUrl)) errors.push(`Model source is not HTTPS: ${model.name}`);
});
(data.benchmarks || []).forEach((row, index) => {
  if (!row.modelName || !row.gpu || !row.sourceUrl) errors.push(`Incomplete benchmark row: ${index}`);
  if (row.sourceUrl && !validHttps(row.sourceUrl)) errors.push(`Benchmark source is not HTTPS: ${index}`);
});
(data.koreanGpuMarket || []).forEach((row, index) => {
  if (!row.gpuId || !Number.isFinite(row.newKrw) || !Number.isFinite(row.lowestKrw) || !row.updatedAt || !row.sourceUrl) {
    errors.push(`Incomplete Korean market row: ${index}`);
  }
  if (row.sourceUrl && !validHttps(row.sourceUrl)) errors.push(`Market source is not HTTPS: ${row.gpuId || index}`);
  if (!(data.gpus || []).some((gpu) => gpu.id === row.gpuId)) errors.push(`Market row references unknown GPU: ${row.gpuId}`);
});
Object.entries(data.systemPartCatalog || {}).forEach(([type, rows]) => {
  if (!Array.isArray(rows) || !rows.length) errors.push(`Empty component catalog: ${type}`);
  (rows || []).forEach((row, index) => {
    if (!row.id || !row.name || !Number.isFinite(row.priceKrw)) errors.push(`Incomplete ${type} component: ${index}`);
  });
});
const missingGpuSources = (data.gpus || []).filter((gpu) => gpu.id !== "custom" && !gpu.sourceUrl).length;
const familyGpuSources = (data.gpus || []).filter((gpu) => gpu.id !== "custom" && gpu.sourceScope === "family").length;
const referenceGpuSources = (data.gpus || []).filter((gpu) => gpu.id !== "custom" && gpu.sourceScope === "reference").length;
const missingModelSources = models.filter((model) => {
  const metadata = data.modelMetadata?.[`${model.type || "generative"}:${model.name}`]
    || data.modelMetadata?.[model.name]
    || {};
  return !model.sourceUrl && !metadata.sourceUrl;
}).length;
if (missingGpuSources) warnings.push(`${missingGpuSources} GPU records rely on catalog-level sources`);
if (familyGpuSources) warnings.push(`${familyGpuSources} GPU records use an official product-family source and still need a model-specific specification link`);
if (referenceGpuSources) warnings.push(`${referenceGpuSources} GPU records use a third-party reference source (not the manufacturer) and still need an official model-specific link`);
if (missingModelSources) warnings.push(`${missingModelSources} model records rely on metadata or catalog-level sources`);

const platformSource = fs.readFileSync(path.join(root, "platform-v2.js"), "utf8");
const copyBlock = platformSource.match(/const PLATFORM_V2_COPY = (\{[\s\S]*?\n\});/)?.[1];
if (!copyBlock) {
  errors.push("PLATFORM_V2_COPY not found");
} else {
  const copy = vm.runInNewContext(`(${copyBlock})`);
  const ko = new Set(Object.keys(copy.ko || {}));
  const en = new Set(Object.keys(copy.en || {}));
  [...ko].filter((key) => !en.has(key)).forEach((key) => errors.push(`Missing English translation: ${key}`));
  [...en].filter((key) => !ko.has(key)).forEach((key) => errors.push(`Missing Korean translation: ${key}`));
  const referenced = [...platformSource.matchAll(/platformText\("([^"]+)"\)/g)].map((match) => match[1]);
  [...new Set(referenced)].filter((key) => !ko.has(key)).forEach((key) => errors.push(`Unknown translation key: ${key}`));
}

const report = {
  generatedAt: new Date().toISOString(),
  counts: {
    gpus: (data.gpus || []).length,
    models: models.length,
    benchmarks: (data.benchmarks || []).length,
    marketPrices: (data.koreanGpuMarket || []).length,
  },
  errors,
  warnings,
};
const output = JSON.stringify(report, null, 2);
if (process.argv.includes("--json")) console.log(output);
else {
  console.log(`audited ${report.counts.gpus} GPUs, ${report.counts.models} models, ${report.counts.benchmarks} benchmarks`);
  warnings.slice(0, 20).forEach((warning) => console.warn(`warning: ${warning}`));
  if (warnings.length > 20) console.warn(`warning: ${warnings.length - 20} more warning(s)`);
  errors.forEach((error) => console.error(`error: ${error}`));
}
if (errors.length) process.exitCode = 1;
