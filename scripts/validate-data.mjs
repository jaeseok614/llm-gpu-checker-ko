import fs from "node:fs";
import vm from "node:vm";

const context = {
  window: {},
};
vm.createContext(context);

for (const file of ["data/gpus.js", "data/quantizations.js", "data/models.js"]) {
  const source = fs.readFileSync(file, "utf8");
  vm.runInContext(source, context, { filename: file });
}

const data = context.window.LLM_GPU_CHECKER_DATA;
assertArray(data.gpus, "gpus");
assertArray(data.quantizations, "quantizations");
assertArray(data.models, "models");

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
const allowedTags = new Set(["general", "korean", "coding", "reasoning", "long", "edge", "vision"]);
for (const model of data.models) {
  requireFields(model, ["name", "maker", "params", "active", "context", "license", "tags", "summary"], "model");
  if (modelNames.has(model.name)) throw new Error(`duplicate model: ${model.name}`);
  if (!Array.isArray(model.tags) || model.tags.length === 0) {
    throw new Error(`model ${model.name} needs at least one tag`);
  }
  for (const tag of model.tags) {
    if (!allowedTags.has(tag)) throw new Error(`model ${model.name} has unsupported tag: ${tag}`);
  }
  modelNames.add(model.name);
}

console.log(`validated ${data.gpus.length} GPUs, ${data.quantizations.length} quantizations, ${data.models.length} models`);

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
