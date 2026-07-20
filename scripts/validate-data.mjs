import fs from "node:fs";
import vm from "node:vm";

const context = {
  window: {},
};
vm.createContext(context);

for (const file of [
  "data/gpus.js",
  "data/quantizations.js",
  "data/precision-profiles.js",
  "data/models.js",
  "data/embedding-models.js",
  "data/reranker-models.js",
  "data/ocr-models.js",
]) {
  const source = fs.readFileSync(file, "utf8");
  vm.runInContext(source, context, { filename: file });
}

const data = context.window.LLM_GPU_CHECKER_DATA;
assertArray(data.gpus, "gpus");
assertArray(data.quantizations, "quantizations");
assertArray(data.models, "models");
assertArray(data.precisions.encoder, "encoder precisions");
assertArray(data.precisions.ocr, "ocr precisions");
assertArray(data.embeddingModels, "embeddingModels");
assertArray(data.rerankerModels, "rerankerModels");
assertArray(data.ocrModels, "ocrModels");

const gpuIds = new Set();
for (const gpu of data.gpus) {
  requireFields(gpu, ["id", "name", "vram", "ram", "bandwidth"], "gpu");
  if (gpuIds.has(gpu.id)) throw new Error(`duplicate gpu id: ${gpu.id}`);
  gpuIds.add(gpu.id);
}

const quantIds = new Set();
for (const quant of data.quantizations) {
  requireFields(quant, ["id", "label", "rank"], "quantization");
  if (quant.id !== "auto" && typeof quant.bytesPerB !== "number") {
    throw new Error(`quantization ${quant.id} needs bytesPerB`);
  }
  if (quantIds.has(quant.id)) throw new Error(`duplicate quantization id: ${quant.id}`);
  quantIds.add(quant.id);
}

const modelNames = new Set();
const allowedTags = new Set([
  "general",
  "korean",
  "coding",
  "reasoning",
  "long",
  "edge",
  "vision",
  "embedding",
  "reranker",
  "retrieval",
  "sparse",
  "dense",
  "multilingual",
  "matryoshka",
  "ocr",
  "document",
  "document-vlm",
  "general-vlm",
  "vlm",
  "layout",
  "table",
  "math",
  "handwriting",
  "pdf",
  "markdown",
  "chart",
  "seal",
  "spotting",
  "coordinate",
  "screen",
  "mobile",
  "agent",
  "legacy",
  "classification",
  "clustering",
  "matching",
  "codeRetrieval",
]);
for (const model of data.models) {
  requireFields(model, ["name", "maker", "params", "active", "context", "license", "tags", "summary"], "model");
  validateTagsAndName(model, "generative model");
}

for (const model of data.embeddingModels) {
  requireFields(model, ["type", "name", "maker", "params", "hiddenSize", "layers", "attentionHeads", "maxTokens", "embeddingDim", "pooling", "license", "tags", "precisions", "supportsFlashAttention", "summary"], "embedding model");
  validatePrecisionRefs(model, data.precisions.encoder);
  validateTagsAndName(model, "embedding model");
}

for (const model of data.rerankerModels) {
  requireFields(model, ["type", "name", "maker", "params", "hiddenSize", "layers", "attentionHeads", "maxTokens", "recommendedTokens", "license", "tags", "precisions", "supportsFlashAttention", "summary"], "reranker model");
  validatePrecisionRefs(model, data.precisions.encoder);
  validateTagsAndName(model, "reranker model");
}

for (const model of data.ocrModels) {
  requireFields(model, ["type", "name", "maker", "params", "license", "tags", "precisions", "profiles", "summary"], "ocr model");
  validatePrecisionRefs(model, data.precisions.ocr);
  validateTagsAndName(model, "ocr model");
}

console.log(`validated ${data.gpus.length} GPUs, ${data.quantizations.length} quantizations, ${data.models.length} LLMs, ${data.embeddingModels.length} embeddings, ${data.rerankerModels.length} rerankers, ${data.ocrModels.length} OCR models`);

function assertArray(value, name) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
}

function requireFields(record, fields, type) {
  for (const field of fields) {
    if (!(field in record)) {
      throw new Error(`${type} record is missing ${field}`);
    }
  }
}

function validateTagsAndName(model, type) {
  const key = `${model.type || "generative"}:${model.name}`;
  if (modelNames.has(key)) throw new Error(`duplicate ${type}: ${model.name}`);
  if (!Array.isArray(model.tags) || model.tags.length === 0) {
    throw new Error(`${type} ${model.name} needs at least one tag`);
  }
  for (const tag of model.tags) {
    if (!allowedTags.has(tag)) throw new Error(`${type} ${model.name} has unsupported tag: ${tag}`);
  }
  modelNames.add(key);
}

function validatePrecisionRefs(model, precisionOptions) {
  const validPrecisionIds = new Set(precisionOptions.map((precision) => precision.id));
  for (const precision of model.precisions) {
    if (!validPrecisionIds.has(precision)) {
      throw new Error(`${model.name} references unknown precision: ${precision}`);
    }
  }
}
