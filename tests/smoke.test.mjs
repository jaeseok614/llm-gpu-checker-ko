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
  const source = [
    ...dataFiles.map(read),
    read("ui-foundation.js"),
    read("features/i18n-catalog.js"),
    read("features/estimation-engine.js"),
    read("app.js"),
    read("features/i18n-runtime.js"),
    read("features/gpu-advisor.js"),
    read("features/model-placement.js"),
    read("features/benchmark-workspace.js"),
    read("platform-v2.js"),
    read("platform-v3.js"),
    "init(); initPlatformV2(); initDecisionStudio();",
  ].join("\n;\n");
  app.eval(source);
});

test("v7.1 key catalog survives Korean-English-Korean round trips", () => {
  app.setUiLanguage("ko");
  const korean = app.document.querySelector(".core-task-intro strong").textContent;
  app.setUiLanguage("en");
  assert.equal(app.document.querySelector(".core-task-intro strong").textContent, "Choose the one thing you already know");
  app.setUiLanguage("ko");
  assert.equal(app.document.querySelector(".core-task-intro strong").textContent, korean);
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

test("first screen presents four beginner choices and one advanced placement tool", () => {
  assert.equal(app.document.querySelectorAll(".core-task-actions [data-core-task]").length, 4);
  assert.ok(app.document.querySelector('.advanced-entry [data-core-task="placement"]'));
  assert.ok(app.document.querySelector('[data-demo-gpu="rtx3060-12"]'));
  assert.ok(app.document.querySelector('[data-demo-infra="internal-rag"]'));
  assert.ok(app.document.querySelector('[data-demo-model]'));
  assert.equal(app.document.querySelectorAll(".core-task-button .task-choice-number").length, 4);
  assert.ok(app.document.getElementById("workspaceJourney"));
  assert.match(app.document.querySelector("[data-showcase-title]").textContent, /60초/);
  assert.match(app.document.querySelector("[data-showcase-feedback]").href, /product-feedback\.yml/);
});

test("locale helpers and price data trust remain deterministic", () => {
  assert.equal(app.AIHardwareLocale.confidence("낮음", "en"), "Low");
  assert.equal(app.AIHardwareLocale.confidence("Low", "ko"), "낮음");
  assert.match(app.AIHardwareLocale.usedPriceMethod("신품 최저가의 75% 계산 참고값", "en"), /75%/);
  const coverage = app.AIHardwareDataTrust.priceCoverage(
    app.LLM_GPU_CHECKER_DATA.gpus.filter((gpu) => gpu.id !== "custom"),
    app.LLM_GPU_CHECKER_DATA.koreanGpuMarket,
    new Date("2026-08-11T00:00:00Z"),
  );
  assert.equal(coverage.sourced, 10);
  assert.equal(coverage.fresh, 10);
  assert.equal(coverage.missing, coverage.total - 10);
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

test("English mode updates the primary navigation and infrastructure wizard", () => {
  app.document.querySelector('[data-studio-tab="consulting"]').click();
  app.document.querySelector('[data-si-input-mode="simple"]').click();
  app.eval('setUiLanguage("en"); setCoreTaskMode("infra");');
  app.document.querySelector('[data-studio-tab="consulting"]').click();
  assert.match(app.document.querySelector('[data-core-task="modelFinder"]').textContent, /I know which model to run/);
  assert.match(app.document.querySelector(".core-task-intro").textContent, /Choose the one thing you already know/);
  assert.match(app.document.querySelector("[data-demo-infra]").textContent, /30-user internal RAG estimate/);
  assert.doesNotMatch(app.document.querySelector(".core-task-switcher").textContent, /[가-힣]/);
  assert.match(app.document.querySelector(".si-simple-wizard").textContent, /three steps/i);
  assert.match(app.document.querySelector("[data-showcase-title]").textContent, /60-second/);
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
  assert.match(app.document.querySelector('[data-core-task="modelFinder"]').textContent, /실행할 모델을 알아요/);
  assert.match(app.document.querySelector("[data-showcase-title]").textContent, /60초/);
  assert.match(app.document.querySelector(".core-task-intro").textContent, /지금 알고 있는 것 하나만 고르세요/);
  assert.doesNotMatch(app.document.querySelector(".core-task-switcher").textContent, /I know which|Choose the one/);
  assert.equal(app.document.getElementById("advisorBudgetUsd").dataset.currency, "KRW");
  assert.match(app.document.getElementById("siElectricityKrw").closest("label").textContent, /원\/kWh/);
  assert.equal(Number(app.document.getElementById("siElectricityKrw").value), 150);
  assert.equal(app.eval("studioMoney(1400000)"), "1,400,000원");

  app.document.querySelector('[data-platform-tab="purchase"]').click();
  assert.equal(app.document.getElementById("purchaseCurrency").value, "KRW");
  assert.match(app.document.getElementById("purchaseNewPrice").closest("label").textContent, /KRW/);
  assert.ok(Math.abs(Number(app.document.getElementById("purchaseNewPrice").value) - purchasePriceUsd * 1400) < 10);
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
