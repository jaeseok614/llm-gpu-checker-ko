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
  "data/benchmarks.js",
  "data/licenses.js",
  "data/decision-data.js",
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
});

test("price and evidence states avoid presenting estimates as live market prices", () => {
  app.document.querySelector('[data-studio-tab="market"]').click();
  const marketText = app.document.getElementById("decisionStudioBody").textContent;
  assert.match(marketText, /출처 연결 시세/);
  assert.match(read("platform-v3.js"), /공개 국내 시세 없음/);
  assert.match(read("app.js"), /예상 오차/);
});

test("English mode updates the primary navigation and infrastructure wizard", () => {
  app.eval('setUiLanguage("en"); setCoreTaskMode("infra");');
  app.document.querySelector('[data-studio-tab="consulting"]').click();
  assert.match(app.document.querySelector('[data-core-task="modelFinder"]').textContent, /Find a GPU for my model/);
  assert.match(app.document.querySelector(".core-task-intro").textContent, /Do you already have a GPU/);
  assert.match(app.document.querySelector("[data-demo-infra]").textContent, /30-user internal RAG example/);
  assert.doesNotMatch(app.document.querySelector(".core-task-switcher").textContent, /[가-힣]/);
  assert.match(app.document.querySelector(".si-simple-wizard").textContent, /three steps/i);
});

test("accessibility and responsive contracts are present", () => {
  assert.ok(app.document.querySelector(".skip-link"));
  assert.equal(app.document.getElementById("simpleRecommendationPanel").getAttribute("aria-modal"), "true");
  assert.equal(app.document.getElementById("appToast").getAttribute("role"), "status");
  const css = read("styles.css");
  for (const width of ["900", "560"]) assert.match(css, new RegExp(`max-width:\\s*${width}px`));
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /prefers-reduced-motion/);
});
