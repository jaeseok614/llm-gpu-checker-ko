import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
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
  "data/api-models.js",
  "features/quick-recommendation.js",
  "features/community-feedback.js",
  "features/privacy-analytics.js",
  "features/workspace-controller.js",
  "features/guided-experience.js",
  "features/decision-guidance.js",
  "features/catalog-requests.js",
  "features/catalog-search.js",
  "features/evidence-policy.js",
  "features/pricing-policy.js",
  "features/infrastructure-sizing.js",
  "features/locale-context.js",
  "features/data-trust.js",
  "features/runtime-localization.js",
  "features/promotion-kit.js",
];

let dom;
let app;

before(() => {
  dom = new JSDOM(read("index.html"), {
    url: "https://example.com/?gpu=rtx3060-12",
    runScripts: "outside-only",
  });
  app = dom.window;
  // jsdom's navigator.language defaults to "en-US". The app now auto-detects the UI
  // language from the browser on a first visit (no ?lang=, no saved preference) --
  // pin the simulated browser to Korean so this suite keeps exercising the app's
  // existing Korean-default assumptions.
  Object.defineProperty(app.navigator, "language", { value: "ko-KR", configurable: true });
  Object.defineProperty(app.navigator, "languages", { value: ["ko-KR", "ko"], configurable: true });
  const source = [
    ...dataFiles.map(read),
    read("ui-foundation.js"),
    read("features/i18n-catalog.js"),
    read("features/estimation-engine.js"),
    read("features/hf-import.js"),
    read("app.js"),
    read("features/i18n-runtime.js"),
    read("features/gpu-advisor.js"),
    read("features/model-placement.js"),
    read("features/api-cost-estimator.js"),
    read("features/benchmark-workspace.js"),
    read("platform-v2.js"),
    read("platform-v3.js"),
    "init(); initPlatformV2(); initDecisionStudio();",
  ].join("\n;\n");
  app.eval(source);
});

test("v7.1 key catalog survives Korean-English-Korean round trips", () => {
  app.setUiLanguage("ko");
  const korean = app.document.querySelector("#brandSubtitle").textContent;
  app.setUiLanguage("en");
  assert.equal(app.document.querySelector("#brandSubtitle").textContent, "GPU · Model · Infrastructure Workbench");
  app.setUiLanguage("ko");
  assert.equal(app.document.querySelector("#brandSubtitle").textContent, korean);
  assert.ok(app.AIHardwareI18n.audit().keyedNodes >= 20);
  assert.deepEqual(Array.from(app.AIHardwareI18n.audit().missing), []);
});

test("v7.2 priority sources and completeness are deterministic", () => {
  assert.equal(app.AIHardwareEvidence.PRIORITY_GPU_IDS.length, 30);
  const priority = app.AIHardwareEvidence.audit(app.LLM_GPU_CHECKER_DATA.gpus, app.LLM_GPU_CHECKER_DATA.koreanGpuMarket).priority;
  assert.equal(priority.length, 30);
  assert.ok(priority.every((row) => row.source.level >= 2));
  const gpu = app.LLM_GPU_CHECKER_DATA.gpus.find((row) => row.id === "rtx5090-32");
  assert.ok(app.AIHardwareDataTrust.scoreGpu(gpu).score >= 80);
  assert.equal(app.AIHardwareDataTrust.freshness("2026-07-20", new Date("2026-08-03T00:00:00Z")).id, "fresh");
  assert.equal(app.AIHardwareDataTrust.freshness("2026-04-01", new Date("2026-08-03T00:00:00Z")).id, "stale");
});

test("v7.3 local behavior counters never retain payload values", () => {
  app.AIHardwareLocalAnalytics.clear();
  assert.equal(app.AIHardwareLocalAnalytics.track("share", { customer: "secret" }), true);
  assert.equal(app.AIHardwareLocalAnalytics.track("unknown_event"), false);
  const summary = app.AIHardwareLocalAnalytics.exportSummary();
  assert.match(summary, /"share": 1/);
  assert.doesNotMatch(summary, /secret|customer/);
});

test("v7.5 terminal results are sanitized before submission", () => {
  const parsed = app.AIHardwareCommunityFeedback.parseTerminalResult(JSON.stringify({
    model: "Qwen3 8B", gpu: "RTX 3060", tokensPerSecond: 42, prompt: "private", apiKey: "secret",
  }));
  assert.deepEqual(Array.from(Object.keys(parsed)).sort(), ["gpu", "model", "tokensPerSecond"]);
  assert.doesNotMatch(app.AIHardwareCommunityFeedback.measurementIssueUrl(parsed), /private|secret/);
  assert.equal(app.AIHardwareCommunityFeedback.neededCombinations().length, 10);
});

after(() => dom?.window.close());

test("first screen presents a flat tool-switcher tab bar plus a More menu with the advanced tools", () => {
  assert.equal(app.document.querySelectorAll(".core-task-actions > [data-core-task]").length, 4);
  assert.equal(app.document.querySelectorAll(".task-choice-number").length, 0);
  assert.ok(app.document.querySelector('.core-task-more-menu [data-core-task="placement"]'));
  assert.ok(app.document.querySelector('.core-task-more-menu [data-core-task="apiCost"]'));
  assert.ok(app.document.querySelector('[data-demo-gpu="rtx3060-12"]'));
  assert.ok(app.document.querySelector('[data-demo-infra="internal-rag"]'));
  assert.ok(app.document.querySelector('[data-demo-model]'));
  assert.ok(app.document.querySelector('[data-demo-placement]'));
  assert.ok(app.document.getElementById("workspaceJourney"));
  assert.match(app.document.querySelector("[data-guide-examples-title]").textContent, /예시로 보기/);
  assert.match(app.document.querySelector("[data-showcase-feedback]").href, /product-feedback\.yml/);
  assert.ok(app.document.querySelector("[data-open-start-guide]"));
  assert.ok(app.document.querySelector(".app-header [data-open-start-guide]"));
});

test("locale helpers and price data trust remain deterministic", () => {
  assert.equal(app.AIHardwareLocale.confidence("낮음", "en"), "Low");
  assert.equal(app.AIHardwareLocale.confidence("Low", "ko"), "낮음");
  assert.match(app.AIHardwareLocale.usedPriceMethod("신품 최저가의 75% 계산 참고값", "en"), /75%/);
  // Coverage counts are derived from the actual KOREAN_GPU_MARKET row count
  // rather than a hardcoded number, so this test doesn't need a manual edit
  // every time price-data coverage grows (only the >= floor guards against
  // an accidental regression that silently drops rows).
  const coverage = app.AIHardwareDataTrust.priceCoverage(
    app.LLM_GPU_CHECKER_DATA.gpus.filter((gpu) => gpu.id !== "custom"),
    app.LLM_GPU_CHECKER_DATA.koreanGpuMarket,
    new Date("2026-08-11T00:00:00Z"),
  );
  const pricedCount = app.LLM_GPU_CHECKER_DATA.koreanGpuMarket.length;
  assert.equal(coverage.sourced, pricedCount);
  assert.equal(coverage.fresh, pricedCount, "every KOREAN_GPU_MARKET row is dated on/before the fixed reference date above, so all of them should count as fresh");
  assert.equal(coverage.missing, coverage.total - coverage.enterpriseOnly - pricedCount);
  assert.equal(coverage.missing + coverage.enterpriseOnly + coverage.sourced, coverage.total, "every GPU should land in exactly one of missing/enterpriseOnly/sourced");
  assert.ok(coverage.enterpriseOnly > 0, "expected at least one GPU to be flagged as enterprise-only (no consumer retail channel)");
  assert.ok(pricedCount >= 37, `price coverage regressed below the last known floor (37 GPUs), got ${pricedCount}`);
  assert.equal(app.AIHardwareDataTrust.validateMarketRows(app.LLM_GPU_CHECKER_DATA.koreanGpuMarket).length, 0);
});

test("guided workspace collapses the chooser and can return to it", () => {
  app.document.querySelector('[data-core-task="finder"]').click();
  assert.equal(app.document.getElementById("coreTaskSwitcher").classList.contains("is-collapsed"), true);
  app.document.querySelector("[data-change-path]").click();
  assert.equal(app.document.getElementById("coreTaskSwitcher").classList.contains("is-collapsed"), false);
});

test("catalog search accepts aliases, typos, and natural GPU conditions", () => {
  const gpus = app.LLM_GPU_CHECKER_DATA.gpus;
  const typo = app.AIHardwareCatalogSearch.search("RTX 509O", gpus, { limit: 1 });
  assert.match(typo[0].name, /5090/);
  const natural = app.AIHardwareCatalogSearch.search("24GB 노트북", gpus, {
    limit: 5,
    filter: (gpu) => gpu.formFactor === "laptop" && Number(gpu.vram) >= 24,
  });
  assert.ok(natural.length > 0);
  assert.ok(natural.every((gpu) => gpu.formFactor === "laptop" && Number(gpu.vram) >= 24));
  app.eval("window.__catalogModels = getAllModels()");
  const speech = app.AIHardwareCatalogSearch.search("음성 합성", app.__catalogModels, { limit: 5 });
  assert.ok(speech.some((model) => model.type === "audio-tts"));
});

test("evidence policy distinguishes official model and family sources", () => {
  const audit = app.AIHardwareEvidence.audit(app.LLM_GPU_CHECKER_DATA.gpus, app.LLM_GPU_CHECKER_DATA.koreanGpuMarket);
  assert.equal(audit.total, app.LLM_GPU_CHECKER_DATA.gpus.filter((gpu) => gpu.id !== "custom").length);
  assert.ok(audit.official > 0);
  assert.ok(audit.family + audit.missing > 0);
  assert.ok(audit.priority.length >= 10);
});

test("GPU selection renders three quick recommendations", () => {
  app.eval('selectPrimaryGpu("rtx3060-12"); coreTaskMode = "finder"; appMode = "simple"; render();');
  assert.equal(app.document.querySelectorAll(".simple-pick-card").length, 3);
  assert.match(app.document.getElementById("simpleModeGpuReadout").textContent, /RTX 3060/);
  const missingCapabilities = app.eval(`getAllModels().filter((model) =>
    !model.capabilities?.useCases?.length
    || !model.capabilities?.inputModality?.length
    || !model.capabilities?.outputModality?.length
  ).length`);
  assert.equal(missingCapabilities, 0, "every catalog model should have normalized capabilities");
  const capabilityEvidenceMissing = app.eval(`getAllModels().filter((model) =>
    model.capabilities.useCases.some((useCase) => !model.capabilities.useCaseEvidence?.[useCase])
  ).length`);
  assert.equal(capabilityEvidenceMissing, 0, "every use case should explain its evidence");
  assert.notEqual(
    app.eval(`getAllModels().filter((model) => model.type === "audio-tts" && model.capabilities.useCases.includes("voiceCloning")).length`),
    app.eval(`getAllModels().filter((model) => model.type === "audio-tts").length`),
    "voice cloning must not be assigned to every TTS model",
  );
});

test("quick recommendations keep purpose choices and models inside the selected workload", () => {
  const ttsTab = app.document.querySelector('[data-workload-tab="audioTts"]');
  ttsTab.dispatchEvent(new app.MouseEvent("click", { bubbles: true }));

  const purpose = app.document.getElementById("simplePurpose");
  assert.equal(purpose.dataset.workload, "audioTts");
  assert.deepEqual(
    [...purpose.options].map((option) => option.value),
    ["natural", "realtime", "voiceCloning", "multilingual", "lightweight"],
  );
  assert.doesNotMatch(purpose.textContent, /코딩|추론|긴 문서/);

  const cards = [...app.document.querySelectorAll(".simple-pick-card")];
  assert.ok(cards.length > 0, "expected at least one runnable TTS recommendation");
  assert.ok(cards.every((card) => card.dataset.workload === "audioTts"));
  assert.ok(cards.every((card) => card.dataset.modelType === "audio-tts"));
  assert.doesNotMatch(app.document.getElementById("simpleModeResult").textContent, /Wan2\.1|video/i);

  purpose.value = "voiceCloning";
  purpose.dispatchEvent(new app.Event("change", { bubbles: true }));
  assert.match(app.document.getElementById("simpleModeResult").textContent, /XTTS-v2/);
  assert.match(app.document.getElementById("simpleModeResult").textContent, /목소리 복제 용도 지원/);

  app.document.querySelector("[data-language-toggle] [data-lang='en']")
    .dispatchEvent(new app.MouseEvent("click", { bubbles: true }));
  assert.match(purpose.textContent, /Natural narration|Voice cloning/);
  assert.doesNotMatch(purpose.textContent, /[가-힣]/);
  app.document.querySelector("[data-language-toggle] [data-lang='ko']")
    .dispatchEvent(new app.MouseEvent("click", { bubbles: true }));
  assert.doesNotMatch(
    app.document.getElementById("simpleModeResult").textContent,
    /Calculated estimate|Copy run command|Approx\./,
  );
  app.document.querySelector('[data-workload-tab="generative"]')
    .dispatchEvent(new app.MouseEvent("click", { bubbles: true }));
});

test("community run feedback keeps visible hardware conditions in a privacy-conscious issue link", () => {
  const feedback = app.AIHardwareCommunityFeedback;
  assert.match(feedback.buttons("ko"), /실행됐어요/);
  assert.match(feedback.buttons("ko"), /실행 안 됐어요/);
  const url = feedback.feedbackUrl({
    outcome: "success",
    model: "XTTS-v2",
    gpu: "GeForce RTX 3060 12GB",
    workload: "음성 합성",
    purpose: "목소리 복제",
    runtime: "PyTorch",
    setting: "FP16",
    requiredGb: "4.2 GB",
    estimatedSpeed: "실시간",
  });
  assert.match(url, /github\.com\/jaeseok614\/llm-gpu-checker-ko\/issues\/new/);
  const feedbackBody = new URL(url).searchParams.get("body");
  assert.match(feedbackBody, /XTTS-v2/);
  assert.match(feedbackBody, /RTX 3060/);
  assert.doesNotMatch(feedbackBody, /고객명:|프로젝트명:/);
});

test("full catalog and advisor produce usable results", () => {
  app.eval('setAppMode("expert");');
  assert.ok(app.document.querySelectorAll("#modelResults [data-model-key]").length > 0);
  app.eval(`
    setCoreTaskMode("modelFinder");
    const smokeModel = getAllModels().find((model) => model.name.includes("TinyLlama")) || getAllModels()[0];
    document.getElementById("advisorModel").value = modelKey(smokeModel);
    document.getElementById("advisorBudgetUsd").value = "100000";
    document.getElementById("advisorVendor").value = "all";
    document.getElementById("advisorFormFactor").value = "all";
    renderGpuAdvisor();
    const smokeHardware = getHardware();
    const smokeEstimate = estimateAnyModelForHardware(smokeModel, smokeHardware);
    window.__smokeAdvisorDebug = {
      model: smokeModel.name,
      quantization: document.getElementById("quantization").value,
      gpu: smokeHardware.preset?.name,
      grade: smokeEstimate?.grade,
      speed: smokeEstimate?.speed,
      requiredGb: smokeEstimate?.requiredGb,
    };
  `);
  assert.ok(
    app.document.querySelectorAll(".gpu-advisor-card").length > 0,
    `${app.document.getElementById("gpuAdvisorResult").textContent.trim()} ${JSON.stringify(app.__smokeAdvisorDebug)}`,
  );
  app.eval('setUiLanguage("ko"); renderGpuAdvisor();');
  assert.equal(app.document.getElementById("advisorBudgetUsd").dataset.currency, "KRW");
  assert.equal(app.document.querySelectorAll(".gpu-advisor-card").length, 3);
});

test("advanced placement remains available but outside the beginner choices", () => {
  app.eval('openPlacementPlanner([], { showBuilder: true, seedHardware: true });');
  assert.equal(app.document.body.classList.contains("placement-task-active"), true);
  assert.equal(app.document.getElementById("gpuPlacementPanel").hidden, false);
});

test("the multi-model placement demo chip seeds two GPUs and both models", () => {
  app.document.querySelector("[data-demo-placement]").click();
  assert.equal(app.document.getElementById("gpuPlacementPanel").hidden, false);
  const selected = app.document.getElementById("placementModelSelected").textContent;
  assert.match(selected, /Llama 3\.1 70B Instruct/);
  assert.match(selected, /Qwen3-Embedding-4B/);
  assert.equal(app.document.querySelectorAll("#gpuInventoryList .gpu-inventory-row").length, 1);
  app.eval('placementSelectedKeys = new Set(); gpuInventoryRows = []; placementInventorySeeded = false;');
});

test("API vs Local defaults to 3 tier-matched models with a computed usage summary, and can expand to all 9", () => {
  app.document.querySelector('[data-core-task="apiCost"]').click();
  assert.equal(app.document.body.classList.contains("api-cost-task-active"), true);
  assert.equal(app.document.getElementById("apiCostPanel").hidden, false);
  assert.match(app.document.getElementById("apiCostTitle").textContent, /API vs Local/);

  // Default view: exactly 3 models (one per provider) matching the
  // Quality selector's default tier ("balanced"), not all 9 upfront.
  const compactRows = () => app.document.querySelectorAll("#apiCostTable tbody tr");
  assert.equal(compactRows().length, 3);
  assert.equal(app.document.getElementById("apiCostTier").value, "balanced");
  [...compactRows()].forEach((row) => assert.match(row.cells[2].textContent, /균형형/));
  const cheapestRow = app.document.querySelector("#apiCostTable tbody tr.is-cheapest");
  assert.ok(cheapestRow, "the cheapest of the 3 shown models should be flagged, even though it isn't the globally cheapest model");

  // "비교 조건" (comparison conditions): plain computed numbers, not framed
  // as an AI "해석" of the inputs -- every figure should be a deterministic
  // function of the 3 usage fields plus the selected quality tier.
  const summary = app.document.getElementById("apiCostUsageSummary").textContent;
  assert.match(summary, /100,000/); // monthly requests
  assert.match(summary, /200,000,000/); // monthly input tokens = requests x 2,000
  assert.match(summary, /50,000,000/); // monthly output tokens = requests x 500
  assert.match(summary, /250,000,000/); // total throughput
  assert.match(summary, /균형형/); // selected quality tier

  // Choosing a workload pre-selects (but does not lock) a typical tier for it.
  app.document.getElementById("apiCostWorkload").value = "coding";
  app.document.getElementById("apiCostWorkload").dispatchEvent(new app.Event("change"));
  assert.equal(app.document.getElementById("apiCostTier").value, "flagship");
  assert.equal(compactRows().length, 3);
  [...compactRows()].forEach((row) => assert.match(row.cells[2].textContent, /플래그십/));
  assert.match(app.document.getElementById("apiCostTierHint").textContent, /코딩.*플래그십/);

  // "전체 9개 모델 보기" expands to the full catalog with the provider/tier
  // filter and sortable columns; collapsing goes back to the compact view.
  const expandToggle = app.document.getElementById("apiCostExpandToggle");
  assert.equal(app.document.getElementById("apiCostExpanded").hidden, true);
  expandToggle.click();
  assert.equal(app.document.getElementById("apiCostExpanded").hidden, false);
  assert.equal(app.document.querySelectorAll("#apiCostFullTable tbody tr").length, 9);
  expandToggle.click();
  assert.equal(app.document.getElementById("apiCostExpanded").hidden, true);
  assert.equal(compactRows().length, 3, "collapsing back should restore the compact tier-matched view");
  app.document.getElementById("apiCostWorkload").value = "general";
  app.document.getElementById("apiCostWorkload").dispatchEvent(new app.Event("change"));

  // Changing usage inputs should recompute the table (not just relabel it).
  const before = app.document.getElementById("apiCostTable").textContent;
  app.document.getElementById("apiCostMonthlyRequests").value = "1000000";
  app.document.getElementById("apiCostMonthlyRequests").dispatchEvent(new app.Event("input"));
  const after = app.document.getElementById("apiCostTable").textContent;
  assert.notEqual(before, after, "raising monthly requests 10x should change the computed costs");

  // English round trip: no Korean text should leak, and the KRW figures
  // should still render (using the "₩" symbol, not the word "원", so they
  // remain readable without themselves being flagged as untranslated copy).
  app.eval('setUiLanguage("en");');
  assert.doesNotMatch(app.document.getElementById("apiCostPanel").textContent, /[가-힣]/);
  assert.match(app.document.getElementById("apiCostTable").textContent, /₩[\d,]+/);
  assert.match(app.document.getElementById("apiCostPanel").textContent, /Cheapest/);
  app.eval('setUiLanguage("ko");');
});

test("API vs Local's expanded 9-model table supports provider/tier filtering and column sorting", () => {
  app.document.querySelector('[data-core-task="apiCost"]').click();
  app.document.getElementById("apiCostExpandToggle").click();
  const table = () => app.document.getElementById("apiCostFullTable");
  const providerSelect = app.document.getElementById("apiCostProviderFilter");
  const tierSelect = app.document.getElementById("apiCostTierFilter");
  assert.ok(providerSelect, "a provider filter should exist");
  assert.ok(tierSelect, "a tier filter should exist");
  // "All providers"/"All tiers" plus one option per real value (3 providers,
  // 3 tiers in the current catalog).
  assert.equal(providerSelect.querySelectorAll("option").length, 4);
  assert.equal(tierSelect.querySelectorAll("option").length, 4);

  providerSelect.value = "Anthropic";
  providerSelect.dispatchEvent(new app.Event("change"));
  let rows = [...table().querySelectorAll("tbody tr")];
  assert.equal(rows.length, 3, "filtering to one provider should leave exactly its 3 tracked models");
  rows.forEach((row) => assert.equal(row.cells[0].textContent, "Anthropic"));

  tierSelect.value = "flagship";
  tierSelect.dispatchEvent(new app.Event("change"));
  rows = [...table().querySelectorAll("tbody tr")];
  assert.equal(rows.length, 1, "combining a provider and tier filter should narrow to the single matching model");
  assert.match(rows[0].cells[1].textContent, /Opus/);

  providerSelect.value = "all";
  providerSelect.dispatchEvent(new app.Event("change"));
  tierSelect.value = "all";
  tierSelect.dispatchEvent(new app.Event("change"));
  assert.equal(table().querySelectorAll("tbody tr").length, 9, "clearing both filters should restore all 9 tracked models");

  // Clicking the "Provider" column header should sort alphabetically by
  // provider instead of the default cost-ascending order. The header
  // <th> is rebuilt (a fresh element replaces it) on every render, so
  // re-query it after each click rather than reusing a stale reference.
  table().querySelector('[data-sort-key="provider"]').click();
  const providersAsc = [...table().querySelectorAll("tbody tr")].map((row) => row.cells[0].textContent);
  const expectedAsc = [...providersAsc].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(providersAsc, expectedAsc);
  assert.equal(table().querySelector('[data-sort-key="provider"]').getAttribute("aria-sort"), "ascending");

  // Clicking the same header again should reverse the sort direction.
  table().querySelector('[data-sort-key="provider"]').click();
  const providersDesc = [...table().querySelectorAll("tbody tr")].map((row) => row.cells[0].textContent);
  assert.deepEqual(providersDesc, [...expectedAsc].reverse());
  assert.equal(table().querySelector('[data-sort-key="provider"]').getAttribute("aria-sort"), "descending");

  // Restore the default cost-ascending sort so later tests (and any state
  // this suite still reads from the API cost panel) see the original order.
  table().querySelector('[data-sort-key="cost"]').click();
  if (table().querySelector('[data-sort-key="cost"]').getAttribute("aria-sort") !== "ascending") {
    table().querySelector('[data-sort-key="cost"]').click();
  }
  assert.equal(table().querySelector('[data-sort-key="cost"]').getAttribute("aria-sort"), "ascending");
});

test("infra sizing shows a build-vs-buy API cost comparison using the same usage assumptions", () => {
  app.eval('setCoreTaskMode("infra");');
  const bridge = app.document.querySelector(".si-api-cost-bridge");
  assert.ok(bridge, "the infra studio should surface a self-host-vs-API comparison");
  assert.match(bridge.textContent, /TCO|월/);
  const bridgeButton = bridge.querySelector('[data-core-task="apiCost"]');
  assert.ok(bridgeButton);
  bridgeButton.click();
  assert.equal(app.document.getElementById("apiCostPanel").hidden, false);
  assert.equal(app.document.getElementById("decisionStudio").hidden, true);
  app.eval('setCoreTaskMode("finder");');
});

test("build-vs-buy comparison shows a breakeven point and a usage-scaling table", () => {
  // Regression test for the "동접에 따라 전체 비용만 움직여서 잘 안 보인다"
  // feedback: the bridge used to show only a single-usage-level snapshot,
  // with no indication of how the comparison changes with volume. Now it
  // also surfaces the breakeven request volume and a 0.25x/1x/4x/16x
  // scaling table -- verify both appear and that the math is actually
  // linear (API cost scales with requests, hardware cost stays flat).
  app.eval('setCoreTaskMode("infra");');
  const bridge = app.document.querySelector(".si-api-cost-bridge");
  assert.ok(bridge);
  const breakeven = bridge.querySelector(".si-api-cost-breakeven");
  assert.ok(breakeven, "a breakeven sentence should be shown");
  assert.match(breakeven.textContent, /배|%/);

  const scaleTable = bridge.querySelector(".si-api-cost-scale");
  assert.ok(scaleTable, "a usage-scaling table should be shown");
  const rows = [...scaleTable.querySelectorAll("tbody tr")];
  assert.equal(rows.length, 4);
  const parseMoney = (text) => Number(text.replace(/[^0-9.]/g, ""));
  const requestCounts = rows.map((row) => Number(row.cells[1].textContent.replace(/[^0-9]/g, "")));
  // 0.25x, 1x, 4x, 16x -- each successive row's request count should scale
  // by 4x, confirming the usage axis itself is set up correctly.
  assert.ok(Math.abs(requestCounts[1] / requestCounts[0] - 4) < 0.05);
  assert.ok(Math.abs(requestCounts[2] / requestCounts[1] - 4) < 0.05);
  assert.ok(Math.abs(requestCounts[3] / requestCounts[2] - 4) < 0.05);
  const apiCosts = rows.map((row) => parseMoney(row.cells[2].textContent));
  // The hosted API has a flat per-request rate (no volume discounts
  // modeled), so its cost must scale linearly with the request count.
  assert.ok(Math.abs(apiCosts[1] / apiCosts[0] - 4) < 0.1);
  assert.ok(Math.abs(apiCosts[2] / apiCosts[1] - 4) < 0.1);
  const hardwareCosts = rows.map((row) => parseMoney(row.cells[3].textContent));
  // Self-hosted cost is a flat monthly TCO -- it must not change across rows.
  assert.equal(hardwareCosts[0], hardwareCosts[1]);
  assert.equal(hardwareCosts[1], hardwareCosts[2]);
  assert.equal(hardwareCosts[2], hardwareCosts[3]);
  app.eval('setCoreTaskMode("finder");');
});

test("build-vs-buy comparison also shows a hardware payback period, year-by-year totals, and a non-cost comparison table", () => {
  app.eval('setCoreTaskMode("infra");');
  const bridge = app.document.querySelector(".si-api-cost-bridge");
  assert.ok(bridge);

  // Payback period: how many months the hardware's upfront cost takes to
  // be recovered via avoided API bills (or an explicit "won't pay for
  // itself here" sentence when the API is cheaper than just running the
  // hardware, ignoring its purchase price).
  const payback = bridge.querySelector(".api-cost-payback");
  assert.ok(payback, "a payback-period sentence should be shown");
  // At the default usage level the cheapest tracked API (economy tier) can
  // cost less than just running the hardware, so payback is "never" here --
  // accept either that sentence or an actual N-month figure, since which one
  // applies depends on today's tracked API prices vs the recommended plan's
  // running cost, not on anything this test controls.
  assert.match(payback.textContent, /개월|month|회수하지 못|not pay for itself/);

  // Year-by-year cumulative cost table (1/2/3 years), complementing the
  // volume-based breakeven with a calendar-time view.
  const yearTables = [...bridge.querySelectorAll(".si-api-cost-scale")];
  const yearTable = yearTables.find((table) => table.textContent.includes("1년차") || table.textContent.includes("Year 1"));
  assert.ok(yearTable, "a year-by-year cumulative cost table should be shown");
  const yearRows = [...yearTable.querySelectorAll("tbody tr")];
  assert.equal(yearRows.length, 3);
  const parseMoney = (text) => Number(text.replace(/[^0-9.]/g, ""));
  const selfHostByYear = yearRows.map((row) => parseMoney(row.cells[1].textContent));
  const apiByYear = yearRows.map((row) => parseMoney(row.cells[2].textContent));
  // Self-hosted cumulative cost grows by a fixed monthly running cost each
  // year (purchase price is a one-time cost in year 0), so successive years
  // must increase by the same amount; the API's cumulative cost must scale
  // linearly (3x by year 3) since its per-request rate never changes.
  assert.ok(selfHostByYear[1] - selfHostByYear[0] > 0);
  assert.ok(Math.abs((selfHostByYear[2] - selfHostByYear[1]) - (selfHostByYear[1] - selfHostByYear[0])) < 1);
  assert.ok(Math.abs(apiByYear[2] / apiByYear[0] - 3) < 0.05);

  // Non-quality-equivalence disclaimer: the comparison above is cost-only
  // and must not read as a claim that the cheapest tracked API model and
  // the recommended local setup perform equivalently.
  const disclaimer = bridge.querySelector(".api-cost-disclaimer");
  assert.ok(disclaimer, "a cost-only / not-quality-equivalent disclaimer should be shown");
  assert.match(disclaimer.textContent, /동일 사용량 기준|비용만|cost-only/);

  // The 3 non-cost comparison dimensions: upfront cost, whether data leaves
  // the premises, and operational burden.
  const dimensionsTable = bridge.querySelector(".si-api-cost-dimensions");
  assert.ok(dimensionsTable, "a non-cost comparison table should be shown");
  assert.match(dimensionsTable.textContent, /초기 비용/);
  assert.match(dimensionsTable.textContent, /데이터 외부 전송/);
  assert.match(dimensionsTable.textContent, /운영 부담/);

  app.eval('setCoreTaskMode("finder");');
});

test("infrastructure sizing uses three steps and three decision cards", () => {
  app.eval(`
    setCoreTaskMode("infra");
    window.dispatchEvent(new CustomEvent("ai-hardware-fit:infra-demo", {
      detail: { scenario: "internal-rag", users: 30 },
    }));
  `);
  assert.equal(app.document.querySelectorAll(".si-wizard-step").length, 3);
  assert.equal(app.document.querySelectorAll(".si-plan-card").length, 3);
  assert.equal(app.document.querySelectorAll(".si-auto-parts > span").length, 6);
  assert.equal(app.document.querySelectorAll(".si-scenario-grid > button").length, 8);
  assert.equal(app.document.querySelectorAll(".si-wizard-progress > li").length, 4);
  assert.ok(app.document.querySelector(".decision-guidance"));
  assert.equal(app.document.querySelectorAll("[data-si-adjust]").length, 3);
  assert.ok(app.document.querySelector(".price-coverage-note"));
  assert.ok(app.document.querySelector(".evidence-coverage-note"));
  assert.equal(app.document.getElementById("decisionStudio").dataset.wizardStep, "4");
  assert.ok(app.document.querySelector(".si-plan-card .si-decision-metrics"));
  assert.equal(app.document.querySelectorAll(".si-workflow-nav [data-si-jump]").length, 3);
  assert.equal(app.document.querySelectorAll(".si-readiness-checks > button").length, 8);
  assert.equal(app.document.querySelectorAll(".si-plan-fit").length, 3);
  assert.equal(app.document.querySelectorAll(".si-plan-tradeoffs > span").length, 4);
  assert.equal(app.document.querySelectorAll(".si-plan-card .si-decision-metrics > span").length, 18);
  assert.match(app.document.querySelector(".si-plan-detail").textContent, /이럴 때는 피하세요/);
  const planSnapshot = app.eval(`calculateSiSizing().plans.map((plan) => ({
    id: plan.id,
    price: plan.purchaseKrw,
    capacity: plan.capacityRps,
    production: plan.productionGpuCount,
    reserve: plan.reserveGpuCount,
  }))`);
  assert.equal(planSnapshot.map((plan) => plan.id).join(","), "economy,recommended,scalable");
  assert.ok(planSnapshot[0].price <= planSnapshot[1].price && planSnapshot[1].price <= planSnapshot[2].price);
  assert.ok(planSnapshot[2].capacity > planSnapshot[1].capacity);
  assert.ok(planSnapshot.every((plan) => plan.production >= 1 && plan.reserve >= 0));
  app.document.querySelector('[data-si-jump="siRequirements"]').click();
  assert.equal(app.document.querySelector(".si-expert-form").open, true);
});

test("easy infrastructure sizing advances one screen at a time", () => {
  app.eval('updateStudio("siInputMode", "simple"); updateStudio("siWizardStep", 1);');
  for (let step = 1; step <= 4; step += 1) {
    const wizard = app.document.querySelector(".si-simple-wizard");
    assert.equal(wizard.dataset.step, String(step));
    assert.equal(app.document.getElementById("decisionStudio").dataset.wizardStep, String(step));
    if (step < 4) app.document.querySelector("[data-si-wizard-next]").click();
  }
  assert.ok(app.document.querySelector(".simple-verdict"));
  assert.ok(app.document.querySelector(".simple-result-actions"));
});

test("detailed sizing explains every field and offers starting baselines", () => {
  app.document.querySelector('[data-si-input-mode="expert"]').click();
  assert.match(app.document.querySelector('[data-si-input-mode="expert"]').textContent, /상세 견적/);
  assert.equal(app.document.querySelector(".si-expert-form").open, true);
  assert.equal(app.document.querySelectorAll("[data-si-baseline]").length, 3);
  const detailedControls = [...app.document.querySelectorAll(".si-expert-form input[id], .si-expert-form select[id], .si-advanced input[id], .si-advanced select[id]")];
  assert.ok(detailedControls.length >= 30);
  for (const control of detailedControls) {
    const label = control.closest("label");
    assert.ok(label.querySelector(".term-help"), `${control.id} should have a help tooltip`);
    assert.ok(label.querySelector(".si-field-baseline"), `${control.id} should show a starting point`);
  }
  assert.match(app.document.querySelector("#siQps").closest("label").querySelector(".term-help").dataset.tooltip, /초당 시작되는 요청/);
  app.document.querySelector('[data-si-baseline="pilot"]').click();
  assert.ok(Number(app.document.getElementById("siTotalUsers").value) <= 10);
  assert.ok(Number(app.document.getElementById("siQps").value) > 0);
  app.document.getElementById("siTotalUsers").value = "5";
  app.document.getElementById("siTotalUsers").dispatchEvent(new app.Event("change", { bubbles: true }));
  app.document.getElementById("siConcurrency").value = "10";
  app.document.getElementById("siConcurrency").dispatchEvent(new app.Event("change", { bubbles: true }));
  assert.equal(app.document.getElementById("siConcurrency").getAttribute("aria-invalid"), "true");
  assert.ok(app.document.getElementById("siConcurrency").closest("label").querySelector(".si-field-warning"));
  app.document.getElementById("siConcurrency").value = "2";
  app.document.getElementById("siConcurrency").dispatchEvent(new app.Event("change", { bubbles: true }));
  assert.equal(app.document.getElementById("siConcurrency").hasAttribute("aria-invalid"), false);
});

test("customer proposal links exclude internal sales fields and render read-only", () => {
  const url = new URL(app.eval("proposalUrl()"));
  const state = JSON.parse(url.searchParams.get("studioState"));
  assert.equal(url.searchParams.get("view"), "proposal");
  for (const key of ["siCompanyName", "siCustomerName", "siContact", "siSupplierName", "siReviewer", "siApprover"]) {
    assert.equal(Object.hasOwn(state, key), false, `${key} must not be shared`);
  }
  app.eval('updateStudio("siReadOnly", true);');
  assert.ok(app.document.querySelector(".customer-proposal"));
  assert.equal(app.document.querySelector(".decision-studio-tabs").hidden, true);
  app.eval('updateStudio("siReadOnly", false);');
});

test("v7.5 snapshots and share links keep a versioned infrastructure state", () => {
  app.eval("syncStudioUrl(); window.__smokeSizingSnapshot = sizingSnapshot(); window.__smokeShareState = shareableStudioState();");
  assert.equal(app.__smokeSizingSnapshot.schemaVersion, 3);
  assert.equal(app.__smokeSizingSnapshot.appVersion, "7.5.0");
  assert.equal(app.__smokeSizingSnapshot.readiness.total, 8);
  assert.equal(new URL(app.location.href).searchParams.get("schema"), "3");
  assert.ok(Object.keys(app.__smokeShareState).every((key) => key === "tab" || key === "modelKey" || key.startsWith("si")));
});

test("price and evidence states avoid presenting estimates as live market prices", () => {
  app.document.querySelector('[data-studio-tab="market"]').click();
  const marketText = app.document.getElementById("decisionStudioBody").textContent;
  assert.match(marketText, /출처 연결 시세/);
  assert.match(read("platform-v3.js"), /공개 국내 시세 없음/);
  assert.match(read("app.js"), /예상 오차/);
});

test("enterprise-only GPUs and studio pick-card prices disclose their basis in the actual DOM", () => {
  // Data-layer assertions elsewhere confirm the *counts* are right (missing +
  // enterpriseOnly + sourced === total). This test instead renders the real
  // views and checks that a person looking at the screen -- not just the
  // underlying JSON -- can see why a GPU has no Korean price, and that a
  // studio pick-card price is disclosed as an estimate rather than presented
  // as a real market price.
  app.eval(`
    setCoreTaskMode("infra");
    window.dispatchEvent(new CustomEvent("ai-hardware-fit:infra-demo", {
      detail: { scenario: "internal-rag", users: 30 },
    }));
  `);
  const coverageNote = app.document.querySelector(".price-coverage-note").textContent;
  assert.match(coverageNote, /기업용 전용 GPU/, "the price-coverage note should explain that some GPUs are excluded because they're enterprise-only");
  assert.match(coverageNote, /H100.*A100.*MI300X/, "the note should name the kind of GPU it means (H100/A100/MI300X-class)");

  app.document.querySelector('[data-studio-tab="recommend"]').click();
  // Clear every recommend-tab filter so at least one GPU can actually match
  // (the infra-demo dispatch above leaves budget/power/speed filters in a
  // state tuned for the infra wizard, not this tab -- without resetting
  // them every pick card silently renders "no GPU meets the conditions").
  app.eval(`
    updateStudio("powerLimitW", 0);
    updateStudio("targetSpeed", 0);
    updateStudio("formFactor", "all");
    updateStudio("category", "all");
    updateStudio("budgetKrw", 999999999);
  `);
  const pickCards = [...app.document.querySelectorAll(".studio-pick-card")];
  assert.ok(pickCards.length > 0, "the recommend tab should render at least one pick card");
  const priceNotes = pickCards
    .map((card) => card.querySelector(".studio-price-note")?.textContent || "")
    .filter(Boolean);
  assert.ok(priceNotes.length > 0, "at least one pick card should show a price-basis disclosure note");
  assert.ok(
    priceNotes.every((note) => /계산|참고/.test(note)),
    "every disclosure note present should describe a calculated/reference basis, matching what studioMarket() actually returns",
  );

  // usedKrw is always a calculated "75% of new" reference value in this
  // dataset (no GPU has a directly-sourced secondhand price), so switching
  // to the used-price condition should unconditionally trigger the
  // disclosure note on every card, regardless of which specific GPUs are
  // recommended.
  app.eval('updateStudio("condition", "used");');
  const usedPickCards = [...app.document.querySelectorAll(".studio-pick-card")];
  const usedPriceNotes = usedPickCards
    .map((card) => card.querySelector(".studio-price-note")?.textContent || "")
    .filter(Boolean);
  assert.ok(usedPickCards.length > 0);
  assert.equal(
    usedPriceNotes.length,
    usedPickCards.length,
    "every pick card should disclose a price-calculation method once condition is set to used",
  );
  app.eval('updateStudio("condition", "either");');
});

test("English mode updates the primary navigation and infrastructure wizard", () => {
  app.document.querySelector('[data-studio-tab="consulting"]').click();
  app.document.querySelector('[data-si-input-mode="simple"]').click();
  app.eval('setUiLanguage("en"); setCoreTaskMode("infra");');
  app.document.querySelector('[data-studio-tab="consulting"]').click();
  assert.match(app.document.querySelector('[data-core-task="modelFinder"]').textContent, /GPU that fits my model/);
  assert.match(app.document.querySelector('[data-core-task="finder"]').textContent, /Models that run on my GPU/);
  assert.match(app.document.querySelector("[data-demo-infra]").textContent, /30-user internal RAG estimate/);
  assert.doesNotMatch(app.document.querySelector(".core-task-actions").textContent, /[가-힣]/);
  assert.match(app.document.querySelector(".si-simple-wizard").textContent, /three steps/i);
  assert.match(app.document.querySelector("[data-guide-examples-title]").textContent, /Try examples/);
  assert.match(app.document.querySelector("[data-showcase-feedback]").textContent, /Send workflow feedback/);
  app.document.querySelector('[data-si-input-mode="expert"]').click();
  assert.match(app.document.querySelector('[data-si-input-mode="expert"]').textContent, /Detailed estimate/);
  assert.match(app.document.getElementById("siIndustry").value, /Manufacturing/);
  assert.match(app.document.querySelector("#siQps").closest("label").querySelector(".term-help").dataset.tooltip, /queries per second/i);
  assert.equal(app.document.getElementById("advisorBudgetUsd").dataset.currency, "USD");
  assert.match(app.document.getElementById("siElectricityKrw").closest("label").textContent, /USD\/kWh/);
  assert.equal(app.eval("studioMoney(1400000)"), "$1,000");
  assert.match(app.document.querySelector(".si-plan-card .si-decision-metrics").textContent, /High|Medium|Low/);
  app.eval('updateStudio("siReadOnly", true);');
  assert.match(app.document.querySelector(".customer-proposal").textContent, /Confidence/);
  assert.doesNotMatch(app.document.querySelector(".customer-proposal").textContent, /높음|중간|낮음/);
  app.eval('updateStudio("siReadOnly", false);');
  app.document.querySelector('[data-studio-tab="market"]').click();
  assert.match(app.document.getElementById("decisionStudioBody").textContent, /Planning reference: 75%/);
  app.document.querySelector('[data-studio-tab="consulting"]').click();

  app.document.querySelector('[data-platform-tab="purchase"]').click();
  assert.equal(app.document.getElementById("purchaseCurrency").value, "USD");
  assert.match(app.document.getElementById("purchaseNewPrice").closest("label").textContent, /USD/);
  const purchasePriceUsd = Number(app.document.getElementById("purchaseNewPrice").value);

  app.eval('setUiLanguage("ko"); setCoreTaskMode("infra");');
  app.document.querySelector('[data-studio-tab="consulting"]').click();
  app.document.querySelector('[data-si-input-mode="expert"]').click();
  assert.match(app.document.querySelector('[data-core-task="modelFinder"]').textContent, /모델에 적합한 GPU/);
  assert.match(app.document.querySelector("[data-guide-examples-title]").textContent, /예시로 보기/);
  assert.match(app.document.querySelector('[data-core-task="finder"]').textContent, /내 GPU에서 실행 가능한 모델/);
  assert.doesNotMatch(app.document.querySelector(".core-task-actions").textContent, /GPU that fits|Models that run/);
  assert.equal(app.document.getElementById("advisorBudgetUsd").dataset.currency, "KRW");
  assert.match(app.document.getElementById("siElectricityKrw").closest("label").textContent, /원\/kWh/);
  assert.equal(Number(app.document.getElementById("siElectricityKrw").value), 150);
  assert.equal(app.eval("studioMoney(1400000)"), "1,400,000원");

  app.document.querySelector('[data-platform-tab="purchase"]').click();
  assert.equal(app.document.getElementById("purchaseCurrency").value, "KRW");
  assert.match(app.document.getElementById("purchaseNewPrice").closest("label").textContent, /KRW/);
  assert.ok(Math.abs(Number(app.document.getElementById("purchaseNewPrice").value) - purchasePriceUsd * 1400) < 10);
});

test("switching to English re-translates the GPU comparison detail panel", () => {
  // Regression test: renderGpuInsights() (the "Architecture/Memory/Bandwidth/
  // Runtime" + "Data completeness"/"Specification evidence" detail panel)
  // used to only get rebuilt by the main render() pass or the compare-GPU
  // selects -- setUiLanguage() never called it directly. A pure language
  // toggle while the panel was already visible left its longer phrases
  // ("데이터 완성도", "보강 항목", "사양 근거", "검증일") stuck in Korean even
  // though the short single-word labels ("아키텍처", "대역폭", "런타임") got
  // patched by the generic dictionary sweep, since those happened to already
  // have dictionary entries and these longer phrases didn't.
  // Use the real setCoreTaskMode()/selectPrimaryGpu() functions (not bare
  // "coreTaskMode = ..." assignment) -- each app.eval() call is a separate
  // top-level script, and top-level `let` bindings from the original
  // app.js load aren't visible for plain reassignment from a later eval;
  // a bare assignment silently creates an unrelated global instead of
  // updating the real state the render functions close over.
  app.eval('selectPrimaryGpu("rtx4090-24"); setCoreTaskMode("finder"); setUiLanguage("ko");');
  const detailKo = app.document.getElementById("gpuDetailSummary").textContent;
  assert.match(detailKo, /아키텍처/);
  assert.match(detailKo, /데이터 완성도/);

  app.eval('setUiLanguage("en");');
  const detailEn = app.document.getElementById("gpuDetailSummary").textContent;
  assert.match(detailEn, /Architecture/);
  assert.match(detailEn, /Data completeness/);
  assert.match(detailEn, /Specification evidence/);
  assert.doesNotMatch(detailEn, /[가-힣]/, "no Korean text should remain in the detail panel after switching to English");

  app.eval('setUiLanguage("ko");');
});

test("accessibility and responsive contracts are present", () => {
  assert.ok(app.document.querySelector(".skip-link"));
  assert.equal(app.document.getElementById("simpleRecommendationPanel").getAttribute("aria-modal"), "true");
  assert.equal(app.document.getElementById("appToast").getAttribute("role"), "status");
  const css = read("styles.css");
  for (const width of ["900", "560"]) assert.match(css, new RegExp(`max-width:\\s*${width}px`));
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.si-expert-form \.studio-question-grid \.studio-check\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  // .studio-check-label was the old wrapper markup used only by the
  // "개발계·운영계 분리" checkbox; it caused a vertical single-character text
  // wrap bug and was removed so that checkbox now shares the same flat
  // <label class="studio-check"> markup (and CSS) as every other checkbox.
  assert.match(css, /\.studio-question-grid \.studio-check > input\[type="checkbox"\]\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;/s);
  assert.doesNotMatch(css, /\.studio-check-label/);
  assert.match(css, /\.term-help::after\s*\{[^}]*width:\s*var\(--term-tip-width,\s*min\(360px,\s*calc\(100vw - 32px\)\)\)/s);
  assert.match(read("platform-v3.js"), /const tooltipWidth = Math\.min\(360,[\s\S]*--term-tip-offset-x[\s\S]*button\.classList\.add\("is-tip-left"\)/);
});

test("community measurement panel re-translates on language switch without losing typed input", () => {
  // Regression test: renderWorkbench() (features/community-feedback.js)
  // builds the "실측 결과를 안전하게 제보하세요" panel exactly once, guarded by
  // an existence check -- it was never wired into setUiLanguage(), so a
  // pure language toggle left the whole panel frozen in whatever language
  // was active at first paint (the same bug class already fixed for the
  // GPU insights and API cost panels). In this test harness the panel's own
  // DOMContentLoaded listener never fires (the document is already past
  // "loading" by the time app.eval() runs), so call renderWorkbench()
  // directly first to simulate the real page's first paint.
  app.eval('window.AIHardwareCommunityFeedback.renderWorkbench(); setUiLanguage("ko");');
  const panel = () => app.document.getElementById("communityMeasurementPanel");
  assert.match(panel().textContent, /실측 결과를 안전하게 제보하세요/);
  const input = panel().querySelector("[data-community-input]");
  input.value = '{"model":"Qwen3 8B","gpu":"RTX 3060 12GB"}';

  app.eval('setUiLanguage("en");');
  assert.match(panel().textContent, /Contribute an actual run safely/);
  assert.match(panel().textContent, /Same-condition references/);
  assert.match(panel().textContent, /Top 10 measurements needed/);
  assert.doesNotMatch(panel().textContent, /[가-힣]/, "no Korean text should remain in the community panel after switching to English");
  assert.equal(input.value, '{"model":"Qwen3 8B","gpu":"RTX 3060 12GB"}', "the user's in-progress textarea input must survive a language toggle");

  app.eval('setUiLanguage("ko");');
  assert.match(panel().textContent, /실측 결과를 안전하게 제보하세요/);
  assert.doesNotMatch(panel().textContent, /Contribute an actual run safely|Same-condition references|Top 10 measurements needed/, "no leftover English UI copy should remain after switching back to Korean");
});

test("getting-started and quick-recommendation dialog aria-labels translate as full phrases", () => {
  // Regression test: the generic dictionary sweep matches "사용 가이드" and
  // "빠른 추천" as bare substrings inside the longer aria-label values "처음
  // 사용 가이드" and "빠른 추천 상세", translating only the matched fragment
  // and leaving the rest ("처음", "상세") behind in the other language --
  // e.g. "처음 Quick guide" and "Quick recommendations 상세". Longer,
  // full-phrase dictionary entries were added so these translate cleanly.
  app.eval('setUiLanguage("ko");');
  assert.equal(app.document.getElementById("gettingStartedPanel").getAttribute("aria-label"), "처음 사용 가이드");
  assert.equal(app.document.getElementById("simpleRecommendationPanel").getAttribute("aria-label"), "빠른 추천 상세");

  app.eval('setUiLanguage("en");');
  assert.equal(app.document.getElementById("gettingStartedPanel").getAttribute("aria-label"), "Getting started guide");
  assert.equal(app.document.getElementById("simpleRecommendationPanel").getAttribute("aria-label"), "Quick recommendations detail");

  app.eval('setUiLanguage("ko");');
  assert.equal(app.document.getElementById("gettingStartedPanel").getAttribute("aria-label"), "처음 사용 가이드");
  assert.equal(app.document.getElementById("simpleRecommendationPanel").getAttribute("aria-label"), "빠른 추천 상세");
});

test("benchmark-meta placeholder translates cleanly before the lazy benchmark workspace loads", () => {
  // Regression test: in production, features/benchmark-workspace.js (which
  // overwrites #benchmarkMeta with real bilingual text) is lazy-loaded on
  // demand, not part of the eager bundle -- so on first paint, the static
  // Korean placeholder "벤치마크 데이터 준비 중" from index.html is still in
  // the DOM when translateDynamicUi() runs. Its generic dictionary only had
  // a standalone "벤치마크" -> "Benchmarks" entry, so it produced the broken
  // half-translation "Benchmarks 데이터 준비 중". This test harness loads
  // benchmark-workspace.js eagerly, so restore the raw static placeholder
  // first to simulate the real pre-load moment.
  app.document.getElementById("benchmarkMeta").textContent = "벤치마크 데이터 준비 중";
  app.eval('translateDynamicUi("en");');
  assert.equal(app.document.getElementById("benchmarkMeta").textContent, "Benchmark data loading");
  assert.doesNotMatch(app.document.getElementById("benchmarkMeta").textContent, /[가-힣]/);

  app.document.getElementById("benchmarkMeta").textContent = "Benchmark data loading";
  app.eval('translateDynamicUi("ko");');
  assert.equal(app.document.getElementById("benchmarkMeta").textContent, "벤치마크 데이터 준비 중");
});

test("the header logo acts as a home link, resetting to the default beginner mode", () => {
  // The header logo/title (.brand-block) is a <button data-reset-home> that
  // should behave like the conventional "click the logo to go home" pattern
  // most sites use: reset to the default beginner mode and re-show the task
  // chooser, without wiping the user's GPU/model selections (those persist
  // separately via URL state and localStorage).
  app.eval('setCoreTaskMode("infra"); window.AIHardwareGuide.setStarted(true);');
  assert.ok(app.document.body.classList.contains("infra-task-active"));
  assert.ok(app.document.body.classList.contains("guided-workspace-started"));

  const logo = app.document.querySelector("[data-reset-home]");
  assert.ok(logo, "the header logo should be a clickable [data-reset-home] control");
  assert.equal(logo.tagName, "BUTTON");
  logo.click();

  assert.ok(!app.document.body.classList.contains("infra-task-active"));
  assert.ok(app.document.body.classList.contains("finder-task-active"));
  assert.ok(!app.document.body.classList.contains("guided-workspace-started"), "the task chooser should be shown again after clicking the logo");
});
