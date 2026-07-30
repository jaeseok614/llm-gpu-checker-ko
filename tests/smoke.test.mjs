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
    read("app.js"),
    read("platform-v2.js"),
    read("platform-v3.js"),
    "init(); initPlatformV2(); initDecisionStudio();",
  ].join("\n;\n");
  app.eval(source);
});

after(() => dom?.window.close());

test("first screen presents three beginner choices and one advanced placement tool", () => {
  assert.equal(app.document.querySelectorAll(".core-task-actions [data-core-task]").length, 3);
  assert.ok(app.document.querySelector('.advanced-entry [data-core-task="placement"]'));
  assert.ok(app.document.querySelector('[data-demo-gpu="rtx3060-12"]'));
  assert.ok(app.document.querySelector('[data-demo-infra="internal-rag"]'));
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
  assert.ok(app.document.querySelector(".si-plan-card .si-decision-metrics"));
  assert.equal(app.document.querySelectorAll(".si-workflow-nav [data-si-jump]").length, 3);
  assert.equal(app.document.querySelectorAll(".si-readiness-checks > button").length, 8);
  assert.equal(app.document.querySelectorAll(".si-plan-fit").length, 3);
  assert.equal(app.document.querySelectorAll(".si-plan-tradeoffs > span").length, 4);
  app.document.querySelector('[data-si-jump="siRequirements"]').click();
  assert.equal(app.document.querySelector(".si-expert-form").open, true);
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

test("v4.9 snapshots and share links keep a versioned infrastructure state", () => {
  app.eval("syncStudioUrl(); window.__smokeSizingSnapshot = sizingSnapshot(); window.__smokeShareState = shareableStudioState();");
  assert.equal(app.__smokeSizingSnapshot.schemaVersion, 3);
  assert.equal(app.__smokeSizingSnapshot.appVersion, "4.9.0");
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
  assert.match(app.document.querySelector('[data-core-task="modelFinder"]').textContent, /Find a GPU for my model/);
  assert.match(app.document.querySelector(".core-task-intro").textContent, /Do you already have a GPU/);
  assert.match(app.document.querySelector("[data-demo-infra]").textContent, /30-user internal RAG example/);
  assert.doesNotMatch(app.document.querySelector(".core-task-switcher").textContent, /[가-힣]/);
  assert.match(app.document.querySelector(".si-simple-wizard").textContent, /three steps/i);
  app.document.querySelector('[data-si-input-mode="expert"]').click();
  assert.match(app.document.querySelector('[data-si-input-mode="expert"]').textContent, /Detailed estimate/);
  assert.match(app.document.getElementById("siIndustry").value, /Manufacturing/);
  assert.match(app.document.querySelector("#siQps").closest("label").querySelector(".term-help").dataset.tooltip, /queries per second/i);
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
  assert.match(css, /\.studio-check-label input\[type="checkbox"\]\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;/s);
  assert.match(css, /\.term-help::after\s*\{[^}]*width:\s*var\(--term-tip-width,\s*min\(360px,\s*calc\(100vw - 32px\)\)\)/s);
  assert.match(read("platform-v3.js"), /const tooltipWidth = Math\.min\(360,[\s\S]*--term-tip-offset-x[\s\S]*button\.classList\.add\("is-tip-left"\)/);
});
