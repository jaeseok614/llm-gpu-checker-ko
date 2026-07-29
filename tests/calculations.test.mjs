// Core calculation regression tests. Uses jsdom to load the app exactly the
// way a browser would (single <script> globals, no bundler), then calls the
// app's own functions directly. Run with `npm test` or `node --test tests/`.
//
// jsdom is a devDependency (`npm install`) — it is not shipped to the
// browser build, only used here for testing.

import { test, describe, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (relativePath) => fs.readFileSync(path.join(rootDir, relativePath), "utf8");

const DATA_FILES = [
  "data/gpus.js",
  "data/quantizations.js",
  "data/precision-profiles.js",
  "data/models.js",
  "data/embedding-models.js",
  "data/reranker-models.js",
  "data/ocr-models.js",
  "data/model-metadata.js",
  "data/benchmarks.js",
  "data/licenses.js",
];

// Loads the app into a fresh jsdom window and returns that window. Each
// call gets an independent global scope so tests can't leak state into
// each other through top-level `let`/`const` bindings in app.js.
// Names app.js declares with `const` at the top level. A single window.eval()
// call keeps these as live lexical bindings, but a *separate*, later
// window.eval() call cannot see them (only function declarations and `var`
// attach to the global object and survive across eval calls). So after the
// initial load we copy everything tests need onto `window` explicitly.
const BRIDGED_NAMES = [
  "$", "GENERATIVE_MODELS", "EMBEDDING_MODELS", "RERANKER_MODELS", "OCR_MODELS",
  "QUANTS", "KV_PRECISION_META", "GPU_PRESETS", "ENCODER_PRECISIONS", "OCR_PRECISIONS",
  "BENCHMARKS", "PRIMARY_GPU_STORAGE_KEY",
];

const openTestWindows = new Set();
const persistentTestWindows = new Set();

function loadApp(url = "https://example.com/?gpu=rtx4090-24", storage = {}, { persistent = false } = {}) {
  const dom = new JSDOM(read("index.html"), { url, runScripts: "outside-only" });
  const { window } = dom;
  openTestWindows.add(window);
  if (persistent) persistentTestWindows.add(window);
  Object.entries(storage).forEach(([key, value]) => window.localStorage.setItem(key, value));
  let combined = DATA_FILES.map(read).join("\n;\n");
  combined += "\n;\n" + read("app.js");
  combined += "\n;\ninit();\n";
  combined += BRIDGED_NAMES.map((name) => `window.${name} = ${name};`).join("\n");
  window.eval(combined);
  return window;
}

afterEach(() => {
  [...openTestWindows].forEach((window) => {
    if (persistentTestWindows.has(window)) return;
    window.close();
    openTestWindows.delete(window);
  });
});

after(() => {
  openTestWindows.forEach((window) => window.close());
  openTestWindows.clear();
  persistentTestWindows.clear();
});

let win;

before(() => {
  win = loadApp("https://example.com/?gpu=rtx4090-24", {}, { persistent: true });
});

describe("weights: dense vs MoE (active vs total params)", () => {
  test("KV cache scales with active params, not total params", () => {
    const dense = win.eval(`GENERATIVE_MODELS.find((m) => m.params === m.active && m.params > 3 && m.params < 40)`);
    const moe = win.eval(`GENERATIVE_MODELS.find((m) => m.active < m.params * 0.5 && m.params > 20)`);
    assert.ok(dense, "expected at least one dense model in the catalog");
    assert.ok(moe, "expected at least one MoE model in the catalog");

    const hardware = win.eval(`({ ...getHardware(), context: 8192, concurrency: 1, kvMeta: KV_PRECISION_META.fp16 })`);
    win.denseModel = dense;
    win.moeModel = moe;
    win.testHardware = hardware;

    const denseKv = win.eval("estimateKvCacheGb(denseModel, testHardware)");
    const moeKv = win.eval("estimateKvCacheGb(moeModel, testHardware)");

    // KV cache should track active params: a MoE model with far fewer active
    // params than a similarly-sized dense model must report smaller KV cache
    // per token, even though its total (loaded) weight is comparable or larger.
    const denseActiveRatio = denseKv / dense.active;
    const moeActiveRatio = moeKv / moe.active;
    assert.ok(
      Math.abs(denseActiveRatio - moeActiveRatio) < 0.01,
      `KV cache should be proportional to active params for both dense and MoE (dense ratio ${denseActiveRatio}, moe ratio ${moeActiveRatio})`,
    );
  });

  test("weight footprint scales with total params (quant bytes * params * 1.08)", () => {
    const model = win.eval(`GENERATIVE_MODELS.find((m) => m.params > 5)`);
    const quant = win.eval(`QUANTS.find((q) => q.id === "fp16")`);
    const hardware = win.eval(`({ ...getHardware(), concurrency: 1 })`);
    win.wModel = model;
    win.wQuant = quant;
    win.wHardware = hardware;
    const estimate = win.eval("estimateWithQuant(wModel, wQuant, wHardware)");
    const expectedWeightsGb = model.params * quant.bytesPerB * 1.08;
    assert.ok(
      estimate.requiredGb >= expectedWeightsGb,
      `required VRAM (${estimate.requiredGb}) should be at least the raw weight footprint (${expectedWeightsGb})`,
    );
  });
});

describe("auto quantization selection", () => {
  test("recommends a smaller quant on a tighter VRAM budget than on a roomy one", () => {
    const model = win.eval(`GENERATIVE_MODELS.find((m) => m.params > 20 && m.params < 40)`);
    win.qModel = model;
    const tight = win.eval(`(() => { const h = { ...getHardware(), vram: 10, totalVram: 10, baseEffectiveVram: 10, availableVram: 9, count: 1, primaryCount: 1 }; return recommendQuant(qModel, h); })()`);
    const roomy = win.eval(`(() => { const h = { ...getHardware(), vram: 80, totalVram: 80, baseEffectiveVram: 80, availableVram: 78, count: 1, primaryCount: 1 }; return recommendQuant(qModel, h); })()`);
    assert.ok(tight, "expected a recommendation even under a tight budget");
    assert.ok(roomy, "expected a recommendation under a roomy budget");
    const quantOrder = win.eval("QUANTS.map((q) => q.id)");
    const tightIndex = quantOrder.indexOf(tight.id);
    const roomyIndex = quantOrder.indexOf(roomy.id);
    assert.ok(
      tightIndex >= roomyIndex,
      `tighter budget (${tight.id}) should not recommend a larger quant than the roomy budget (${roomy.id})`,
    );
  });
});

describe("fit grading / offload threshold", () => {
  test("grade boundaries follow the documented pressure thresholds", () => {
    assert.equal(win.eval("gradeFromPressure(0.5, 10, 0)"), "S");
    assert.equal(win.eval("gradeFromPressure(0.8, 10, 0)"), "A");
    assert.equal(win.eval("gradeFromPressure(0.95, 10, 0)"), "B");
    assert.equal(win.eval("gradeFromPressure(1.10, 10, 0)"), "C");
    assert.equal(win.eval("gradeFromPressure(1.10, 10, 0)"), "C");
  });

  test("beyond grade C, RAM offload room determines D vs F", () => {
    const withRoom = win.eval("gradeFromPressure(1.5, 10, 20)");
    const withoutRoom = win.eval("gradeFromPressure(1.5, 10, 0)");
    assert.equal(withRoom, "D");
    assert.equal(withoutRoom, "F");
  });
});

describe("heterogeneous GPU sharding loss", () => {
  test("identical multi-GPU pooling applies a smaller loss than mixed-vendor pooling", () => {
    const identical = win.eval(`(() => {
      $("gpuPreset").value = "rtx4090-24";
      $("gpuCount").value = "2";
      $("secondaryGpuPreset").value = "none";
      return getHardware().shardingEfficiency;
    })()`);
    const heterogeneous = win.eval(`(() => {
      $("gpuPreset").value = "rtx4090-24";
      $("gpuCount").value = "1";
      $("secondaryGpuPreset").value = "rtx3090-24";
      $("secondaryGpuCount").value = "1";
      return getHardware().shardingEfficiency;
    })()`);
    assert.equal(identical, 0.92);
    assert.equal(heterogeneous, 0.88);
    assert.ok(heterogeneous < identical, "mixed-GPU pooling should be penalized more than same-GPU pooling");

    // reset shared window state for later tests
    win.eval(`$("gpuCount").value = "1"; $("secondaryGpuPreset").value = "none";`);
  });
});

describe("embedding batch memory", () => {
  test("required VRAM increases with batch size", () => {
    const model = win.eval("EMBEDDING_MODELS[0]");
    win.eModel = model;
    const hardware = win.eval("getHardware()");
    win.eHardware = hardware;
    const small = win.eval(`estimateEncoderModel(eModel, eHardware, { inputTokens: 256, batchSize: 4, maxBatchTokens: 16384, runtime: "tei" }, "auto")`);
    const large = win.eval(`estimateEncoderModel(eModel, eHardware, { inputTokens: 256, batchSize: 64, maxBatchTokens: 16384, runtime: "tei" }, "auto")`);
    assert.ok(large.requiredGb > small.requiredGb, `batch 64 (${large.requiredGb}GB) should need more VRAM than batch 4 (${small.requiredGb}GB)`);
  });
});

describe("reranker candidate latency", () => {
  test("more candidates require more rerank passes and higher query latency", () => {
    const model = win.eval("RERANKER_MODELS[0]");
    win.rModel = model;
    const hardware = win.eval(`(() => {
      $("gpuPreset").value = "h100-sxm-80";
      applyPreset("h100-sxm-80");
      return getHardware();
    })()`);
    win.rHardware = hardware;
    const few = win.eval(`estimateRerankerModel(rModel, rHardware, {
      queryTokens: 64,
      docTokens: 512,
      candidates: 16,
      batchSize: 8,
      precisionId: "fp16",
      runtime: "tei",
    })`);
    const many = win.eval(`estimateRerankerModel(rModel, rHardware, {
      queryTokens: 64,
      docTokens: 512,
      candidates: 80,
      batchSize: 8,
      precisionId: "fp16",
      runtime: "tei",
    })`);

    assert.ok(many.rerankPasses > few.rerankPasses);
    assert.ok(
      many.latencySeconds > few.latencySeconds,
      `80 candidates (${many.latencySeconds}s) should take longer than 16 (${few.latencySeconds}s)`,
    );
  });
});

describe("OCR resolution scaling", () => {
  test("required VRAM increases with image resolution", () => {
    const model = win.eval("OCR_MODELS.find((m) => m.type === 'ocr-pipeline')");
    win.oModel = model;
    const hardware = win.eval("getHardware()");
    win.oHardware = hardware;
    const small = win.eval(`estimateOcrModel(oModel, oHardware, { width: 800, height: 600, batchSize: 1, featureSet: "basic" }, "auto")`);
    const large = win.eval(`estimateOcrModel(oModel, oHardware, { width: 2480, height: 3508, batchSize: 1, featureSet: "basic" }, "auto")`);
    assert.ok(large.requiredGb > small.requiredGb, `A4 300DPI (${large.requiredGb}GB) should need more VRAM than a small thumbnail (${small.requiredGb}GB)`);
  });
});

describe("mode, filtering, and sorting UI", () => {
  test("switches modes and applies search and speed sorting", () => {
    const fresh = loadApp();
    const simpleTab = fresh.document.querySelector('[data-app-mode="simple"]');
    const expertTab = fresh.document.querySelector('[data-app-mode="expert"]');

    simpleTab.dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.getElementById("simpleModePanel").hidden, false);
    assert.equal(fresh.document.getElementById("expertModeSection").hidden, true);

    expertTab.dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.getElementById("simpleModePanel").hidden, true);
    assert.equal(fresh.document.getElementById("expertModeSection").hidden, false);

    const search = fresh.document.getElementById("searchInput");
    search.value = "Qwen";
    search.dispatchEvent(new fresh.Event("input", { bubbles: true }));
    const visibleNames = [...fresh.document.querySelectorAll(".model-name-cell strong")].map((node) => node.textContent);
    assert.ok(visibleNames.length > 0, "expected at least one filtered Qwen result");
    assert.ok(visibleNames.every((name) => name.toLowerCase().includes("qwen")));

    search.value = "";
    const sort = fresh.document.getElementById("sortBy");
    sort.value = "speed";
    sort.dispatchEvent(new fresh.Event("change", { bubbles: true }));
    const speeds = fresh.eval("getFilteredEstimates().slice(0, 12).map((estimate) => estimate.speed)");
    assert.deepEqual([...speeds], [...speeds].sort((a, b) => b - a));
  });
});

describe("first-visit GPU onboarding", () => {
  test("starts in quick recommendation mode without inventing a GPU", () => {
    const fresh = loadApp("https://example.com/");

    assert.equal(fresh.document.getElementById("gpuPreset").value, "");
    assert.equal(fresh.document.getElementById("hardwareHeadline").textContent, "GPU를 선택해 주세요");
    assert.equal(fresh.document.getElementById("settingsDrawer").hidden, true);
    assert.equal(fresh.document.getElementById("simpleModePanel").hidden, false);
    assert.equal(fresh.document.getElementById("expertModeSection").hidden, true);
    assert.equal(fresh.document.getElementById("calculationBasisStrip").hidden, true);
    assert.equal(fresh.document.querySelectorAll(".simple-pick-card").length, 0);
    assert.match(fresh.document.getElementById("simpleModeResult").textContent, /내 GPU를 선택하면 추천을 시작합니다/);
  });

  test("remembers a fixed GPU and restores it on the next visit", () => {
    const fresh = loadApp("https://example.com/");
    const select = fresh.document.getElementById("gpuPreset");
    select.value = "rtx3060-12";
    select.dispatchEvent(new fresh.Event("change", { bubbles: true }));

    const storageKey = fresh.PRIMARY_GPU_STORAGE_KEY;
    assert.equal(fresh.localStorage.getItem(storageKey), "rtx3060-12");
    assert.ok(fresh.document.querySelectorAll(".simple-pick-card").length > 0);

    const restored = loadApp("https://example.com/", {
      [storageKey]: "rtx3060-12",
    });
    assert.equal(restored.document.getElementById("gpuPreset").value, "rtx3060-12");
    assert.match(restored.document.getElementById("simpleModeGpuReadout").textContent, /RTX 3060/);
  });

  test("URL GPU overrides the remembered GPU without replacing the preference", () => {
    const storageKey = "ai-hardware-fit-primary-gpu-v1";
    const fresh = loadApp("https://example.com/?gpu=h100-sxm-80", {
      [storageKey]: "rtx3060-12",
    });

    assert.equal(fresh.document.getElementById("gpuPreset").value, "h100-sxm-80");
    assert.equal(fresh.localStorage.getItem(storageKey), "rtx3060-12");
  });

  test("custom GPU input is usable for the session but is not persisted", () => {
    const storageKey = "ai-hardware-fit-primary-gpu-v1";
    const fresh = loadApp("https://example.com/", {
      [storageKey]: "rtx3060-12",
    });
    const select = fresh.document.getElementById("gpuPreset");
    select.value = "custom";
    select.dispatchEvent(new fresh.Event("change", { bubbles: true }));

    assert.equal(fresh.localStorage.getItem(storageKey), null);
    assert.equal(fresh.document.getElementById("settingsDrawer").hidden, false);
    assert.equal(fresh.document.getElementById("gpuPresetSearch").hidden, false);
  });

  test("keeps hardware settings compact and moves placement out of advanced tools", () => {
    const fresh = loadApp();
    fresh.document.getElementById("settingsToggle")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));

    const drawer = fresh.document.getElementById("settingsDrawer");
    const groupTitles = [...drawer.querySelectorAll(".settings-cluster h3")]
      .map((title) => title.childNodes[0].textContent.trim());
    assert.equal(drawer.hidden, false);
    assert.deepEqual(groupTitles, ["기본 하드웨어", "보조 GPU", "메모리 보정"]);
    assert.equal(drawer.querySelectorAll(".advanced-tools-inline > details").length, 1);
    assert.equal(fresh.document.getElementById("gpuPlacementPanel").closest("#settingsDrawer"), null);
    assert.equal(fresh.document.querySelector('[data-workload-settings="generative"]').hidden, false);
    assert.equal(fresh.document.getElementById("vramGb").value, "24");
  });

  test("opens the placement planner directly with a simple starter screen", () => {
    const fresh = loadApp("https://example.com/?mode=placement");
    assert.equal(fresh.document.getElementById("onboardingScreen").hidden, true);
    assert.equal(fresh.document.getElementById("hardwarePanel").hidden, false);
    assert.equal(fresh.document.getElementById("gpuPlacementPanel").hidden, false);
    assert.equal(fresh.document.getElementById("placementWelcome").hidden, false);
    assert.equal(
      fresh.document.querySelector("#placementGuide > summary")?.textContent.trim(),
      "사용 가이드",
    );
    assert.match(
      fresh.document.querySelector(".placement-guide-popover")?.textContent || "",
      /파이프라인.*독립 서비스.*순차 실행/s,
    );
    assert.equal(fresh.document.getElementById("placementBuilder").hidden, true);
    assert.equal(fresh.document.getElementById("resultsPanel").hidden, true);
    assert.equal(new URLSearchParams(fresh.location.search).get("mode"), "placement");

    fresh.document.querySelector("[data-placement-starter='rag']")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.getElementById("placementWelcome").hidden, true);
    assert.equal(fresh.document.getElementById("placementBuilder").hidden, false);
    assert.equal(fresh.document.querySelectorAll(".placement-stepper li").length, 4);
    assert.equal(fresh.document.querySelectorAll(".placement-model-config").length, 3);
    assert.ok(fresh.document.querySelector(".placement-model-gate"), "full model catalog should stay gated before search/category browse");
    assert.equal(fresh.document.getElementById("placementResultStage").hidden, true);
  });
});

describe("quick recommendation navigation", () => {
  test("opens a recommendation detail and exposes an explicit full-catalog action", () => {
    const fresh = loadApp();
    const card = fresh.document.querySelector(".simple-pick-card");
    assert.ok(card, "expected a quick recommendation card");
    assert.match(card.querySelector(".simple-pick-cta").textContent, /상세 계산 보기/);
    assert.ok(fresh.document.querySelector("[data-share-link]"));
    assert.ok(fresh.document.querySelector("[data-download-share-card]"));
    assert.ok(fresh.document.querySelector("[data-share-3060]"));

    const languageToggle = fresh.document.querySelector("[data-language-toggle]");
    const englishButton = languageToggle.querySelector("[data-lang='en']");
    englishButton.dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.documentElement.lang, "en");
    assert.equal(englishButton.classList.contains("active"), true);
    languageToggle.querySelector("[data-lang='ko']")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.documentElement.lang, "ko");

    const cardOrderBefore = [...fresh.document.querySelectorAll(".simple-pick-card-toggle")]
      .map((button) => button.dataset.modelKey);
    card.querySelector(".simple-pick-card-toggle")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.getElementById("modelDetail").hidden, true, "quick-recommend clicks must not open the expert-mode drawer");
    const inspector = fresh.document.getElementById("simpleRecommendationPanel");
    assert.equal(inspector.hidden, false, "expected the compact recommendation inspector to open");
    assert.ok(fresh.document.querySelector(".simple-pick-card.is-selected"));
    assert.equal(fresh.document.querySelector(".simple-pick-card.is-expanded"), null, "cards must never span/reflow the grid");
    assert.ok(inspector.querySelector("[data-share-model-link]"));
    assert.ok(inspector.querySelector("[data-download-simple-card]"));
    assert.ok(inspector.querySelector("[data-open-full-simple-detail]"));

    const secondCard = fresh.document.querySelectorAll(".simple-pick-card-toggle")[1];
    secondCard.dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    const cardOrderAfter = [...fresh.document.querySelectorAll(".simple-pick-card-toggle")]
      .map((button) => button.dataset.modelKey);
    assert.deepEqual(cardOrderAfter, cardOrderBefore, "opening rank 2 must not reorder ranks 1 and 3");
    assert.equal(fresh.document.querySelector(".simple-pick-card.is-selected .simple-pick-card-toggle").dataset.modelKey, cardOrderBefore[1]);

    const purpose = fresh.document.getElementById("simplePurpose");
    const priority = fresh.document.getElementById("simplePriority");
    purpose.value = "coding";
    priority.value = "quality";
    purpose.dispatchEvent(new fresh.Event("change", { bubbles: true }));
    const params = new URLSearchParams(fresh.location.search);
    assert.equal(params.get("purpose"), "coding");
    assert.equal(params.get("priority"), "quality");

    fresh.document.getElementById("simpleOpenExpert")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.getElementById("simpleModePanel").hidden, true);
    assert.equal(fresh.document.getElementById("expertModeSection").hidden, false);
    assert.equal(fresh.document.getElementById("calculationBasisStrip").hidden, false);
    assert.equal(new URLSearchParams(fresh.location.search).get("ui"), "expert");
  });

  test("restores an explicit UI mode and treats a model-only link as expert mode", () => {
    const explicit = loadApp("https://example.com/?gpu=rtx4090-24&ui=expert");
    assert.equal(explicit.document.getElementById("simpleModePanel").hidden, true);
    assert.equal(explicit.document.getElementById("expertModeSection").hidden, false);

    const key = win.eval("modelKey(GENERATIVE_MODELS[0])");
    const linked = loadApp(`https://example.com/?gpu=rtx4090-24&model=${encodeURIComponent(key)}`);
    assert.equal(linked.document.getElementById("simpleModePanel").hidden, true);
    assert.equal(linked.document.getElementById("expertModeSection").hidden, false);
    assert.equal(linked.document.getElementById("modelDetail").hidden, false);

    linked.document.querySelector("[data-add-detail-to-placement]")
      .dispatchEvent(new linked.MouseEvent("click", { bubbles: true }));
    assert.equal(linked.document.getElementById("gpuPlacementPanel").hidden, false);
    assert.equal(linked.document.getElementById("placementBuilder").hidden, false);
    assert.equal(linked.document.querySelectorAll(".placement-model-config").length, 1);
    assert.equal(new URLSearchParams(linked.location.search).get("mode"), "placement");
  });
});

describe("multi-GPU placement optimizer", () => {
  let fresh;

  before(() => {
    fresh = loadApp("https://example.com/?gpu=rtx4090-24", {}, { persistent: true });
  });

  test("rebalances the reported 3B/1.7B/0.6B two-GPU scenario", () => {
    fresh.testScenarioKeys = fresh.eval(`
      [
        "Llama 3.2 3B Instruct",
        "Qwen2.5 3B Instruct",
        "SmolLM2 1.7B Instruct",
        "Qwen3 1.7B",
        "Qwen3 0.6B",
      ].map((name) => modelKey(GENERATIVE_MODELS.find((model) => model.name === name))).filter(Boolean)
    `);
    fresh.testRows = [
      { id: "scenario-gpu-1", presetId: "rtx4090-24", count: 1 },
      { id: "scenario-gpu-2", presetId: "rtx4090-24", count: 1 },
    ];
    const placement = fresh.eval("computeGpuPlacement(testRows, testScenarioKeys, 'balanced', '')");
    const free = placement.gpus.map((gpu) => gpu.remaining);
    assert.equal(placement.unplaced.length, 0);
    assert.ok(Math.max(...free) - Math.min(...free) < 4, `expected balanced free VRAM, got ${free.join(" / ")}`);
    assert.ok(placement.stats.serviceFloor >= 1, "balanced mode must avoid a zero-concurrency recommendation when a safe alternative exists");
  });

  test("honors user headroom, explores alternatives, and can pin a model", () => {
    fresh.testKeys = fresh.eval(`
      GENERATIVE_MODELS
        .filter((model) => model.params >= 1 && model.params <= 4)
        .slice(0, 5)
        .map(modelKey)
    `);
    assert.equal(fresh.testKeys.length, 5);
    fresh.testRows = [
      { id: "test-gpu-1", presetId: "rtx4090-24", count: 1 },
      { id: "test-gpu-2", presetId: "rtx4090-24", count: 1 },
    ];
    const placement = fresh.eval("computeGpuPlacement(testRows, testKeys, 'balanced', '')");
    assert.equal(placement.gpus.length, 2);
    assert.equal(Math.round(placement.gpus[0].physicalCapacityGb), 24);
    assert.equal(Math.round(placement.gpus[0].reservedHeadroomGb * 10) / 10, 3.6);
    assert.ok(["exact", "approximate"].includes(placement.searchMeta.mode));
    assert.ok(placement.searchMeta.exploredStates > 0);
    assert.ok(placement.gpus.some((gpu) => gpu.placements.length), "expected at least one placed model");

    fresh.firstPlacementKey = fresh.testKeys[0];
    const pinned = fresh.eval(`
      getPlacementModelConfig(firstPlacementKey).pinnedGpu = "1";
      computeGpuPlacement(testRows, testKeys, "balanced", "")
    `);
    const actualPinnedGpu = pinned.gpus.findIndex((gpu) => gpu.placements.some((item) => item.model.name === fresh.eval("getModelByKey(firstPlacementKey).name")));
    assert.equal(actualPinnedGpu, 1);
  });

  test("renders four optimization strategies and model-level controls", () => {
    const strategyKeys = [...fresh.document.querySelectorAll("[data-placement-strategy]")]
      .map((button) => button.dataset.placementStrategy);
    assert.deepEqual(strategyKeys, ["balanced", "compact", "throughput", "primary"]);
    assert.equal(fresh.document.getElementById("placementMinHeadroom").value, "15");
    assert.equal(fresh.document.getElementById("placementAllowQuantChange").checked, true);

    fresh.document.querySelector("[data-open-placement-browser]")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    const firstCheckbox = fresh.document.querySelector("#placementModelList [data-model-key]");
    fresh.controlModelKey = firstCheckbox.dataset.modelKey;
    fresh.eval("togglePlacementModel(controlModelKey)");
    assert.ok(fresh.document.querySelector(".placement-model-config"));
    assert.ok(fresh.document.querySelector("[data-placement-config-field='pinnedGpu']"));
    assert.ok(fresh.document.querySelector("[data-placement-config-field='requestShare']"));
    assert.ok(fresh.document.querySelector("[data-placement-config-field='minConcurrency']"));
  });

  test("locks a preferred precision and only creates replicas in independent mode", () => {
    fresh.singleKey = fresh.eval(`modelKey(GENERATIVE_MODELS.find((model) => model.name === "Qwen3 0.6B"))`);
    fresh.testRows = [
      { id: "replica-gpu-1", presetId: "rtx4090-24", count: 1 },
      { id: "replica-gpu-2", presetId: "rtx4090-24", count: 1 },
    ];
    fresh.eval(`getPlacementModelConfig(singleKey).preferredSetting = "fp16"`);
    const quantToggle = fresh.document.getElementById("placementAllowQuantChange");
    quantToggle.checked = false;
    quantToggle.dispatchEvent(new fresh.Event("change", { bubbles: true }));
    const locked = fresh.eval("computeGpuPlacement(testRows, [singleKey], 'balanced', '')");
    const lockedItems = locked.gpus.flatMap((gpu) => gpu.placements);
    assert.ok(lockedItems.length > 0);
    assert.ok(lockedItems.every((item) => item.setting.id === "fp16"));

    quantToggle.checked = true;
    quantToggle.dispatchEvent(new fresh.Event("change", { bubbles: true }));
    const replicaToggle = fresh.document.getElementById("placementAllowReplication");
    replicaToggle.checked = true;
    replicaToggle.dispatchEvent(new fresh.Event("change", { bubbles: true }));
    const replicated = fresh.eval("computeGpuPlacement(testRows, [singleKey], 'throughput', '')");
    assert.equal(replicated.gpus.flatMap((gpu) => gpu.placements).filter((item) => item.model.name === "Qwen3 0.6B").length, 2);

    fresh.document.querySelector("[data-placement-usage='pipeline']")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    const pipeline = fresh.eval("computeGpuPlacement(testRows, [singleKey], 'throughput', '')");
    assert.equal(pipeline.gpus.flatMap((gpu) => gpu.placements).filter((item) => item.model.name === "Qwen3 0.6B").length, 1);
    assert.equal(replicaToggle.disabled, true);
  });

  test("only explores shorter contexts after the user allows reduction", () => {
    fresh.contextKey = fresh.eval(`modelKey(GENERATIVE_MODELS.find((model) => model.name === "Llama 3.2 3B Instruct"))`);
    fresh.eval(`getPlacementModelConfig(contextKey).contextTokens = 32768`);
    const lockedContexts = fresh.eval(`
      [...new Set(getPlacementSearchCandidates(
        getModelByKey(contextKey),
        getPlacementModelConfig(contextKey),
        { ...getHardware(), concurrency: 1 },
        24,
      ).map((candidate) => candidate.contextTokens))]
    `);
    assert.equal(lockedContexts.length, 1);
    assert.equal(lockedContexts[0], 32768);

    const contextToggle = fresh.document.getElementById("placementAllowContextReduction");
    contextToggle.checked = true;
    contextToggle.dispatchEvent(new fresh.Event("change", { bubbles: true }));
    const reducedContexts = fresh.eval(`
      [...new Set(getPlacementSearchCandidates(
        getModelByKey(contextKey),
        getPlacementModelConfig(contextKey),
        { ...getHardware(), concurrency: 1 },
        24,
      ).map((candidate) => candidate.contextTokens))]
    `);
    assert.ok(reducedContexts.includes(32768));
    assert.ok(reducedContexts.some((value) => value < 32768));
  });

  test("renders a plain-language overview, three plans, and collapsed calculation details", () => {
    if (!fresh.document.querySelector(".placement-model-config")) {
      fresh.document.querySelector("[data-open-placement-browser]")
        ?.dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
      const checkbox = fresh.document.querySelector("#placementModelList [data-model-key]");
      fresh.overviewModelKey = checkbox.dataset.modelKey;
      fresh.eval("togglePlacementModel(overviewModelKey)");
    }
    fresh.document.querySelector("[data-placement-usage='independent']")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    fresh.document.getElementById("runPlacementButton")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.getElementById("placementResultStage").hidden, false);
    assert.match(fresh.document.getElementById("placementResultOverview").textContent, /추천:|현재 안전 동시 접속|예상 총 처리량/);
    assert.equal(fresh.document.querySelectorAll(".placement-plan-card").length, 3);
    assert.equal(fresh.document.getElementById("placementCalculationDetails").open, false);
    assert.ok(fresh.document.getElementById("gpuPlacementResult").textContent.trim());
  });
});

describe("model comparison table rendering", () => {
  test("keeps one item column per row and labels incomparable public evaluations", () => {
    const fresh = loadApp();
    const candidates = [...fresh.document.querySelectorAll("[data-compare-key]")]
      .map((checkbox) => {
        fresh.testModelKey = checkbox.dataset.compareKey;
        const model = fresh.eval("getModelByKey(window.testModelKey)");
        return {
          key: checkbox.dataset.compareKey,
          metric: model?.qualityBenchmark?.metric || null,
        };
      })
      .filter((candidate) => candidate.metric);
    const first = candidates[0];
    assert.ok(first, "expected at least one model with a public benchmark metric");
    const second = candidates.find((candidate) => candidate.metric !== first.metric);

    assert.ok(second, "expected two models with different public benchmark metrics");
    [first.key, second.key].forEach((key) => {
      const checkbox = [...fresh.document.querySelectorAll("[data-compare-key]")]
        .find((item) => item.dataset.compareKey === key);
      checkbox.checked = true;
      checkbox.dispatchEvent(new fresh.Event("change", { bubbles: true }));
    });

    fresh.document.querySelector("[data-open-compare]")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));

    const modal = fresh.document.getElementById("compareModal");
    const headerCells = modal.querySelectorAll("thead th");
    const bodyRows = [...modal.querySelectorAll("tbody tr")];
    assert.equal(headerCells.length, 3, "item + two model columns should render");
    assert.ok(bodyRows.length > 0);
    assert.ok(bodyRows.every((row) => row.children.length === 3), "every row should keep the same three-column grid");
    assert.match(modal.querySelector(".compare-summary-line").textContent, /권장합니다|실행 가능한 모델이 없습니다/);
    assert.equal(
      modal.querySelector("tbody tr:nth-child(4) > th").textContent.trim(),
      "대표 공개 평가",
    );
    const caveats = [...modal.querySelectorAll(".compare-caveat")].map((node) => node.textContent.trim());
    assert.ok(caveats.length > 0);
    assert.ok(caveats.every((text) => text === "서로 다른 벤치마크로 직접 비교할 수 없습니다."));

    fresh.document.querySelector("[data-add-compare-to-placement]")
      .dispatchEvent(new fresh.MouseEvent("click", { bubbles: true }));
    assert.equal(fresh.document.getElementById("gpuPlacementPanel").hidden, false);
    assert.equal(fresh.document.querySelectorAll(".placement-model-config").length, 2);
  });
});

describe("URL state save / restore", () => {
  test("lang query restores English UI and survives a GPU rerender", () => {
    const english = loadApp("https://example.com/?gpu=rtx4090-24&lang=en");
    assert.equal(english.document.documentElement.lang, "en");
    assert.equal(english.document.getElementById("settingsToggle").textContent, "Detailed settings");
    assert.equal(english.document.getElementById("providerFilter").options[0].textContent, "All providers");
    english.document.getElementById("gpuPreset").dispatchEvent(new english.Event("change", { bubbles: true }));
    assert.equal(english.document.getElementById("settingsToggle").textContent, "Detailed settings");
    assert.equal(new URLSearchParams(english.location.search).get("lang"), "en");
    assert.match(english.document.querySelector(".placement-advanced-conditions").textContent, /Minimum VRAM headroom/);
    assert.match(english.document.querySelector(".gpu-placement-policy-toggles").textContent, /automatic quantization\/precision changes/);

    english.document.querySelector("[data-open-placement-browser]")
      .dispatchEvent(new english.MouseEvent("click", { bubbles: true }));
    const placementCheckbox = english.document.querySelector("#placementModelList [data-model-key]");
    placementCheckbox.checked = true;
    placementCheckbox.dispatchEvent(new english.Event("change", { bubbles: true }));
    const modelControls = english.document.querySelector(".placement-model-config-grid").textContent;
    assert.match(modelControls, /Preferred setting/);
    assert.doesNotMatch(modelControls, /선호|요청 비율|최소 동시|GPU 고정/);

    english.document.querySelector(".core-task-actions [data-core-task='placement']")
      .dispatchEvent(new english.MouseEvent("click", { bubbles: true }));
    english.document.querySelector("[data-placement-starter='rag']")
      .dispatchEvent(new english.MouseEvent("click", { bubbles: true }));
    const placementText = english.document.getElementById("gpuPlacementPanel").textContent;
    assert.match(placementText, /AI Stack Placement Planner|Basic RAG stack|Operating goals|Quick guide/);
    assert.doesNotMatch(placementText, /여러 모델|처음이라면|하드웨어|모델 선택|운영 목표|세부 조건|배치 결과|사용 가이드/);
  });

  test("share URL encodes the current GPU and context settings", () => {
    win.eval(`
      $("gpuPreset").value = "h100-sxm-80";
      applyPreset("h100-sxm-80");
      $("contextSize").value = "32768";
      $("concurrency").value = "4";
    `);
    win.eval("syncUrlState()");
    const search = win.location.search;
    const params = new URLSearchParams(search);
    assert.equal(params.get("gpu"), "h100-sxm-80");
    assert.equal(params.get("ctx"), "32768");
    assert.equal(params.get("con"), "4");
    assert.equal(params.get("ui"), "simple");
  });

  test("loading a URL with query params restores the same settings on a fresh session", () => {
    const restored = loadApp("https://example.com/?gpu=h100-sxm-80&vram=80&ram=128&count=1&ctx=32768&con=4&out=512&kv=fp16&runtime=vllm&purpose=coding&priority=quality");
    const hardware = restored.eval("getHardware()");
    assert.equal(hardware.preset.id, "h100-sxm-80");
    assert.equal(hardware.context, 32768);
    assert.equal(hardware.concurrency, 4);
    assert.equal(hardware.runtime, "vllm");
    assert.equal(restored.document.getElementById("simplePurpose").value, "coding");
    assert.equal(restored.document.getElementById("simplePriority").value, "quality");
  });

  test("multi-GPU placement constraints survive a shared URL", () => {
    const source = loadApp();
    source.document.querySelector("[data-open-placement-browser]")
      .dispatchEvent(new source.MouseEvent("click", { bubbles: true }));
    const checkbox = source.document.querySelector("#placementModelList [data-model-key]");
    checkbox.checked = true;
    checkbox.dispatchEvent(new source.Event("change", { bubbles: true }));
    source.document.getElementById("placementMinHeadroom").value = "20";
    source.document.getElementById("placementMinHeadroom")
      .dispatchEvent(new source.Event("change", { bubbles: true }));
    source.document.getElementById("placementAllowContextReduction").checked = true;
    source.document.getElementById("placementAllowContextReduction")
      .dispatchEvent(new source.Event("change", { bubbles: true }));
    source.eval("syncUrlState()");

    const params = new URLSearchParams(source.location.search);
    assert.ok(params.get("pgModels"));
    assert.equal(params.get("pgHeadroom"), "20");
    assert.equal(params.get("pgContext"), "1");

    const restored = loadApp(source.location.href);
    assert.equal(restored.document.querySelectorAll(".placement-model-config").length, 1);
    assert.equal(restored.document.getElementById("placementMinHeadroom").value, "20");
    assert.equal(restored.document.getElementById("placementAllowContextReduction").checked, true);
  });
});

describe("benchmark estimate-error aggregate stats", () => {
  test("returns null when there are no measured rows (current live state)", () => {
    const stats = win.eval("computeBenchmarkErrorStats()");
    assert.equal(stats, null);
  });

  test("averages |error%| across measured rows once they exist", () => {
    const fresh = win;
    const model = fresh.eval(`GENERATIVE_MODELS.find((m) => m.params < 10 && m.params > 3)`);
    const gpuId = "rtx4090-24";
    fresh.eval(`
      $("gpuPreset").value = "${gpuId}";
      applyPreset("${gpuId}");
      $("contextSize").value = "8192";
      $("concurrency").value = "1";
      $("outputTokens").value = "512";
      $("runtimeMode").value = "llamacpp";
    `);
    const estimate = fresh.eval(`estimateModel(GENERATIVE_MODELS.find((m) => m.name === ${JSON.stringify(model.name)}), "auto", getHardware())`);

    // one row 10% below the estimate, one row 10% above -> average |error| should land near 10%
    fresh.eval(`
      BENCHMARKS.push({
        evidenceType: "user",
        modelName: ${JSON.stringify(model.name)},
        gpu: "${gpuId}",
        gpuId: "${gpuId}",
        workload: "generative",
        runtime: "llamacpp",
        quantization: ${JSON.stringify(estimate.quant.label)},
        context: 8192,
        concurrency: 1,
        inputTokens: 8192,
        outputTokens: 512,
        tokensPerSecond: ${estimate.speed} * 0.9,
        sourceUrl: "https://example.com/1",
      });
      BENCHMARKS.push({
        evidenceType: "project",
        modelName: ${JSON.stringify(model.name)},
        gpu: "${gpuId}",
        gpuId: "${gpuId}",
        workload: "generative",
        runtime: "llamacpp",
        quantization: ${JSON.stringify(estimate.quant.label)},
        context: 8192,
        concurrency: 1,
        inputTokens: 8192,
        outputTokens: 512,
        tokensPerSecond: ${estimate.speed} * 1.1,
        sourceUrl: "https://example.com/2",
      });
      BENCHMARKS.push({
        evidenceType: "external",
        modelName: ${JSON.stringify(model.name)},
        gpu: "${gpuId}",
        gpuId: "${gpuId}",
        workload: "generative",
        runtime: "llamacpp",
        quantization: ${JSON.stringify(estimate.quant.label)},
        context: 8192,
        concurrency: 1,
        inputTokens: 8192,
        outputTokens: 512,
        tokensPerSecond: ${estimate.speed} * 10,
        sourceUrl: "https://example.com/external-reference",
      });
    `);

    const stats = fresh.eval("computeBenchmarkErrorStats()");
    assert.ok(stats, "expected non-null stats once rows exist");
    assert.equal(stats.sampleCount, 2);
    assert.equal(stats.gpuCoverage, 1);
    // 0.9x -> ~+11.1% abs error, 1.1x -> ~-9.1% abs error, average ~10.1%
    assert.ok(stats.avgAbsErrorPct > 8 && stats.avgAbsErrorPct < 13, `expected avg abs error near 10%, got ${stats.avgAbsErrorPct}`);
  });
});

describe("GPU contribution and media-generation upgrades", () => {
  test("finds a GPU by community-friendly aliases and uses its GPU-usable memory", () => {
    const fresh = loadApp("https://example.com/");
    assert.equal(fresh.eval(`findGpuPresetByName("Radeon 8060S", false)?.id`), "ryzen-ai-max-plus-395-128");
    fresh.eval(`selectPrimaryGpu("ryzen-ai-max-plus-395-128")`);
    const hardware = fresh.eval("getHardware()");
    assert.equal(hardware.preset.memoryType, "unified");
    assert.equal(hardware.vram, 96);
  });

  test("shows direct-entry and request actions for an unknown GPU", () => {
    const fresh = loadApp("https://example.com/");
    const input = fresh.document.getElementById("onboardingGpuSearch");
    input.value = "Future GPU 9999";
    input.dispatchEvent(new fresh.Event("input", { bubbles: true }));
    const actions = fresh.document.getElementById("onboardingGpuNotFound");
    assert.equal(actions.hidden, false);
    assert.match(actions.querySelector("[data-request-gpu]").href, /gpu-request\.yml/);
  });

  test("video frames and offloading change media VRAM and speed estimates", () => {
    const fresh = loadApp();
    const model = fresh.eval(`OCR_MODELS.find((item) => item.type === "video-generation")`);
    fresh.testVideoModel = model;
    const base = fresh.eval(`estimateOcrModel(testVideoModel, getHardware(), {
      type: "videoGeneration", width: 832, height: 480, batchSize: 1,
      precisionId: "fp16", featureSet: "text", steps: 28, frames: 81, fps: 16,
      loraCount: 0, offload: "none"
    })`);
    const longer = fresh.eval(`estimateOcrModel(testVideoModel, getHardware(), {
      type: "videoGeneration", width: 832, height: 480, batchSize: 1,
      precisionId: "fp16", featureSet: "text", steps: 28, frames: 161, fps: 16,
      loraCount: 1, offload: "none"
    })`);
    const offloaded = fresh.eval(`estimateOcrModel(testVideoModel, getHardware(), {
      type: "videoGeneration", width: 832, height: 480, batchSize: 1,
      precisionId: "fp16", featureSet: "text", steps: 28, frames: 161, fps: 16,
      loraCount: 1, offload: "sequential"
    })`);
    assert.ok(longer.requiredGb > base.requiredGb);
    assert.ok(longer.speed < base.speed);
    assert.ok(offloaded.requiredGb < longer.requiredGb);
    assert.ok(offloaded.speed < longer.speed);
  });
});

describe("v1.3 GPU platform upgrades", () => {
  test("normalizes every GPU schema record", () => {
    const fresh = loadApp();
    const invalid = fresh.eval(`GPU_PRESETS.filter((gpu) => !gpu.vendor || !gpu.architecture || !gpu.memoryType || !gpu.formFactor || !Array.isArray(gpu.runtimes) || !Array.isArray(gpu.aliases))`);
    assert.deepEqual([...invalid], []);
  });

  test("scales laptop compute by selected TGP and preserves it in shared URLs", () => {
    const fresh = loadApp("https://example.com/?gpu=rtx4090laptop-16");
    const low = fresh.eval(`estimateHardwareCompute(GPU_PRESETS.find((gpu) => gpu.id === "rtx4090laptop-16"), 576, 80).fp16Tflops`);
    const high = fresh.eval(`estimateHardwareCompute(GPU_PRESETS.find((gpu) => gpu.id === "rtx4090laptop-16"), 576, 175).fp16Tflops`);
    assert.ok(high > low);
    fresh.document.getElementById("powerLimitW").value = "90";
    fresh.eval("syncUrlState()");
    assert.equal(new URLSearchParams(fresh.location.search).get("power"), "90");
  });

  test("calibrates estimates from source-linked user measurements and exposes uncertainty", () => {
    const fresh = loadApp();
    const model = fresh.eval(`GENERATIVE_MODELS.find((item) => item.name === "Llama 3.1 8B Instruct")`);
    fresh.testCalibrationModel = model;
    const raw = fresh.eval(`normalizeGenerativeEstimate(estimateModel(testCalibrationModel, "q4", getHardware()))`);
    for (const factor of [0.72, 0.76, 0.8]) {
      fresh.BENCHMARKS.push({
        evidenceType: "user",
        modelName: model.name,
        gpu: "RTX 4090 24GB",
        gpuId: "rtx4090-24",
        workload: "generative",
        runtime: "llamacpp",
        quantization: "Q4_K_M",
        context: 8192,
        concurrency: 1,
        inputTokens: 8192,
        outputTokens: 512,
        tokensPerSecond: raw.speed * factor,
        sourceUrl: `https://example.com/${factor}`,
      });
    }
    const calibrated = fresh.eval(`applyMeasuredCalibration(normalizeGenerativeEstimate(estimateModel(testCalibrationModel, "q4", getHardware())), getHardware())`);
    assert.ok(calibrated.speed < raw.speed);
    assert.equal(calibrated.calibration.sampleCount, 3);
    fresh.testCalibrated = calibrated;
    const confidence = fresh.eval(`getEstimateConfidence(testCalibrationModel, testCalibrated, getHardware())`);
    assert.equal(confidence.className, "confidence-high");
  });

  test("uses a dedicated media engine and renders GPU comparison accessibly", () => {
    const fresh = loadApp();
    const model = fresh.eval(`OCR_MODELS.find((item) => item.type === "video-generation")`);
    fresh.testDedicatedMedia = model;
    const estimate = fresh.eval(`estimateMediaModel(testDedicatedMedia, getHardware(), {
      type: "videoGeneration", width: 832, height: 480, batchSize: 1,
      precisionId: "fp16", featureSet: "text", steps: 28, frames: 81, fps: 16,
      loraCount: 1, offload: "none"
    })`);
    assert.ok(estimate.textEncoderGb > 0);
    assert.ok(estimate.temporalActivationGb > 0);
    fresh.eval(`selectPrimaryGpu("rtx4090-24"); renderGpuInsights(getHardware()); $("toggleGpuCompare").click(); $("compareGpuA").value = "rtx5090-32"; renderGpuInsights(getHardware())`);
    const table = fresh.document.querySelector(".gpu-comparison-table");
    assert.ok(table);
    assert.ok(table.textContent.includes("RTX 5090"));
    assert.equal(fresh.document.getElementById("gpuComparisonResult").getAttribute("aria-live"), "polite");
    fresh.eval(`setUiLanguage("en"); renderGpuInsights(getHardware())`);
    assert.doesNotMatch(fresh.document.getElementById("gpuInsightsPanel").textContent, /[가-힣]/);
  });
});
