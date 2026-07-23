#!/usr/bin/env node
// AI Hardware Fit - local benchmark collector
//
// Runs a real prompt against a local Ollama or llama.cpp server on your own GPU,
// measures actual prefill/decode speed, time-to-first-token, and peak VRAM, and
// prints a JSON row in the exact shape data/benchmarks.js expects, plus a ready
// to paste GitHub issue body.
//
// This script only talks to your local runtime (Ollama / llama.cpp) and to
// `nvidia-smi` if present. It does not read, upload, or transmit anything.
// You choose whether to share the printed result.
//
// Usage:
//   node scripts/benchmark-cli.mjs --runtime ollama --model qwen3:8b --context 8192
//   node scripts/benchmark-cli.mjs --runtime llamacpp --url http://localhost:8080 --model "Qwen3 8B Q4_K_M" --context 8192
//
// Options:
//   --runtime      ollama | llamacpp                         (required)
//   --model        Model name for the API call / for the report (required)
//   --model-name   Display name for the report, if different from --model
//   --context      Context length used for the request, in tokens (default 8192)
//   --prompt       Prompt text to send (default: a short built-in prompt)
//   --predict      Max tokens to generate (default 256)
//   --url          Server base URL (default http://localhost:11434 for ollama,
//                  http://localhost:8080 for llamacpp)
//   --gpu          GPU display name, e.g. "GeForce RTX 4090 24GB" (auto-detected if nvidia-smi is available)
//   --gpu-id       GPU preset id from this app's data/gpus.js, e.g. rtx4090-24 (optional, improves match confidence)
//   --quantization Quantization label, e.g. Q4_K_M (optional but recommended)
//   --out          Write the JSON row to this file (default: benchmark-result.json)
//   --repeat       Number of runs to average (default 1)

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function printHelp() {
  console.log(`AI Hardware Fit - local benchmark collector

Usage:
  node scripts/benchmark-cli.mjs --runtime ollama --model qwen3:8b --context 8192
  node scripts/benchmark-cli.mjs --runtime llamacpp --url http://localhost:8080 --model "Qwen3 8B Q4_K_M" --context 8192

Options:
  --runtime       ollama | llamacpp                     (required)
  --model         model name/tag for the API call        (required)
  --model-name    display name for the report if different from --model
  --context       context length in tokens (default 8192)
  --prompt        custom prompt (default: built-in short prompt)
  --predict       max tokens to generate (default 256)
  --url           server base URL
  --gpu           GPU display name (auto-detected via nvidia-smi if omitted)
  --gpu-id        GPU preset id from data/gpus.js (optional)
  --quantization  quantization label, e.g. Q4_K_M (optional)
  --out           output JSON file (default benchmark-result.json)
  --repeat        number of runs to average (default 1)
`);
}

const DEFAULT_PROMPT =
  "Explain in three short sentences why memory bandwidth matters more than raw compute for local LLM decoding speed.";

function detectGpuInfo() {
  try {
    const out = execSync(
      "nvidia-smi --query-gpu=name,memory.used,memory.total,driver_version --format=csv,noheader,nounits",
      { encoding: "utf8" },
    ).trim();
    const [name, usedMb, totalMb, driver] = out.split(",").map((part) => part.trim());
    return {
      name,
      usedMb: Number(usedMb),
      totalMb: Number(totalMb),
      driver,
      available: true,
    };
  } catch {
    return { available: false };
  }
}

function detectCudaVersion() {
  try {
    const out = execSync("nvidia-smi", { encoding: "utf8" });
    const match = out.match(/CUDA Version:\s*([\d.]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function runOllama({ url, model, context, prompt, predict }) {
  const base = url || "http://localhost:11434";
  const start = performance.now();
  let firstTokenAt = null;
  let finalPayload = null;
  let text = "";

  const response = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: true,
      options: { num_ctx: Number(context), num_predict: Number(predict) },
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  let buffer = "";
  for await (const chunk of response.body) {
    buffer += Buffer.from(chunk).toString("utf8");
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;
      const payload = JSON.parse(line);
      if (payload.response && firstTokenAt === null) firstTokenAt = performance.now();
      if (payload.response) text += payload.response;
      if (payload.done) finalPayload = payload;
    }
  }

  if (!finalPayload) throw new Error("Ollama stream ended without a final payload");

  const ttftMs = firstTokenAt ? firstTokenAt - start : null;
  const decodeTokens = finalPayload.eval_count || 0;
  const decodeSeconds = (finalPayload.eval_duration || 0) / 1e9;
  const prefillTokens = finalPayload.prompt_eval_count || 0;
  const prefillSeconds = (finalPayload.prompt_eval_duration || 0) / 1e9;
  const totalSeconds = (finalPayload.total_duration || 0) / 1e9;

  return {
    ttftMs,
    decodeTokensPerSecond: decodeSeconds > 0 ? decodeTokens / decodeSeconds : null,
    prefillTokensPerSecond: prefillSeconds > 0 ? prefillTokens / prefillSeconds : null,
    decodeTokens,
    prefillTokens,
    totalSeconds,
    outputPreview: text.slice(0, 120),
  };
}

async function runLlamaCpp({ url, context, prompt, predict }) {
  const base = url || "http://localhost:8080";
  const start = performance.now();

  const response = await fetch(`${base}/completion`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      prompt,
      n_predict: Number(predict),
      n_ctx: Number(context),
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`llama.cpp request failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const totalSeconds = (performance.now() - start) / 1000;
  const timings = payload.timings || {};

  return {
    ttftMs: typeof timings.prompt_ms === "number" ? timings.prompt_ms : null,
    decodeTokensPerSecond: typeof timings.predicted_per_second === "number" ? timings.predicted_per_second : null,
    prefillTokensPerSecond: typeof timings.prompt_per_second === "number" ? timings.prompt_per_second : null,
    decodeTokens: timings.predicted_n || 0,
    prefillTokens: timings.prompt_n || 0,
    totalSeconds,
    outputPreview: String(payload.content || "").slice(0, 120),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printHelp();
    return;
  }

  if (!args.runtime || !args.model) {
    console.error("Missing required --runtime and/or --model. Run with --help for usage.\n");
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (args.runtime !== "ollama" && args.runtime !== "llamacpp") {
    console.error(`Unsupported --runtime "${args.runtime}". Use "ollama" or "llamacpp".`);
    process.exitCode = 1;
    return;
  }

  const context = args.context || 8192;
  const predict = args.predict || 256;
  const prompt = args.prompt || DEFAULT_PROMPT;
  const repeat = Math.max(1, Number(args.repeat) || 1);

  const gpuBefore = detectGpuInfo();
  const cudaVersion = detectCudaVersion();

  console.log(`Running ${repeat} pass(es) against ${args.runtime}: ${args.model} (context ${context})...`);

  const runs = [];
  for (let i = 0; i < repeat; i += 1) {
    console.log(`  pass ${i + 1}/${repeat}...`);
    const runFn = args.runtime === "ollama" ? runOllama : runLlamaCpp;
    // eslint-disable-next-line no-await-in-loop
    const result = await runFn({ url: args.url, model: args.model, context, prompt, predict });
    runs.push(result);
  }

  const gpuAfter = detectGpuInfo();

  const avg = (values) => {
    const filtered = values.filter((value) => typeof value === "number" && Number.isFinite(value));
    return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : null;
  };

  const decodeTokensPerSecond = avg(runs.map((run) => run.decodeTokensPerSecond));
  const prefillTokensPerSecond = avg(runs.map((run) => run.prefillTokensPerSecond));
  const ttftMs = avg(runs.map((run) => run.ttftMs));

  const gpuName = args.gpu || (gpuAfter.available ? gpuAfter.name : "GPU 미기재 (--gpu로 직접 입력하세요)");
  const peakVramGb = gpuAfter.available ? Math.round((gpuAfter.usedMb / 1024) * 100) / 100 : undefined;
  const idleVramGb = gpuBefore.available ? Math.round((gpuBefore.usedMb / 1024) * 100) / 100 : undefined;

  const row = {
    modelName: args["model-name"] || args.model,
    modelKey: undefined, // 저장소의 실제 모델과 매칭하려면 data/models.js의 slug 규칙에 맞는 modelKey를 직접 채워주세요 (선택)
    gpu: gpuName,
    gpuId: args["gpu-id"] || undefined,
    workload: "generative",
    runtime: args.runtime === "ollama" ? "llama.cpp" : "llama.cpp", // 앱의 런타임 분류 기준 (Ollama/llama.cpp는 같은 그룹)
    runtimeTool: args.runtime,
    quantization: args.quantization || undefined,
    context: Number(context),
    tokensPerSecond: decodeTokensPerSecond ? Math.round(decodeTokensPerSecond * 100) / 100 : undefined,
    prefillTokensPerSecond: prefillTokensPerSecond ? Math.round(prefillTokensPerSecond * 100) / 100 : undefined,
    ttftMs: ttftMs ? Math.round(ttftMs) : undefined,
    peakVramGb,
    idleVramGb,
    cudaVersion: cudaVersion || undefined,
    driverVersion: gpuAfter.available ? gpuAfter.driver : undefined,
    passes: repeat,
    date: new Date().toISOString().slice(0, 10),
    sourceUrl: "<이 결과를 올린 GitHub 이슈/댓글 URL을 여기에 붙여넣으세요>",
    note: "로컬 CLI로 측정 (scripts/benchmark-cli.mjs)",
  };

  // undefined 필드는 출력에서 제거합니다.
  const cleanRow = Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));

  const outPath = args.out || "benchmark-result.json";
  writeFileSync(outPath, JSON.stringify(cleanRow, null, 2));

  console.log("\n=== 측정 결과 ===");
  console.log(`GPU              ${cleanRow.gpu}${cleanRow.cudaVersion ? ` · CUDA ${cleanRow.cudaVersion}` : ""}${cleanRow.driverVersion ? ` · Driver ${cleanRow.driverVersion}` : ""}`);
  console.log(`모델             ${cleanRow.modelName}${cleanRow.quantization ? ` (${cleanRow.quantization})` : ""}`);
  console.log(`컨텍스트         ${cleanRow.context}`);
  console.log(`Prefill 속도     ${cleanRow.prefillTokensPerSecond ?? "측정 안 됨"} tok/s`);
  console.log(`Decode 속도      ${cleanRow.tokensPerSecond ?? "측정 안 됨"} tok/s`);
  console.log(`TTFT             ${cleanRow.ttftMs ?? "측정 안 됨"} ms`);
  console.log(`Peak VRAM        ${cleanRow.peakVramGb ?? "측정 안 됨"}${cleanRow.peakVramGb !== undefined ? " GB" : ""}${typeof cleanRow.idleVramGb === "number" ? ` (유휴 상태 ${cleanRow.idleVramGb} GB 포함)` : ""}`);
  console.log(`\n결과를 ${outPath} 에 저장했습니다.`);

  if (!gpuAfter.available) {
    console.log(
      "\n참고: nvidia-smi를 찾을 수 없어 VRAM을 자동으로 측정하지 못했습니다. AMD/Intel/Apple GPU를 쓰거나 nvidia-smi가 PATH에 없다면, --gpu로 GPU 이름을 직접 넣고 VRAM은 작업관리자/nvtop 등에서 확인해 JSON 파일에 peakVramGb를 직접 채워주세요.",
    );
  }

  console.log(`\n다음 순서로 제보해주세요:
1. GitHub 이슈를 새로 엽니다: https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml
2. 아래 JSON을 이슈 본문에 붙여넣습니다 (sourceUrl은 이슈를 올린 뒤 이슈 자신의 URL로 바꿔주세요).
3. 이슈가 등록되면 유지자가 data/benchmarks.js에 실측 행으로 반영합니다.

\`\`\`json
${JSON.stringify(cleanRow, null, 2)}
\`\`\`
`);
}

main().catch((error) => {
  console.error(`\n오류: ${error.message}`);
  console.error("Ollama/llama.cpp 서버가 실행 중인지, --url이 올바른지 확인해주세요.");
  process.exitCode = 1;
});
