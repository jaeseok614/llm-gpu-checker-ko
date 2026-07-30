#!/usr/bin/env node

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";

const root = process.cwd();
const siteRoot = fs.existsSync(path.join(root, "_site", "index.html")) ? path.join(root, "_site") : root;
const outputDir = path.join(root, "outputs", "ui-regression");
fs.mkdirSync(outputDir, { recursive: true });

function loadPlaywright() {
  try {
    return createRequire(import.meta.url)("playwright");
  } catch (error) {
    const moduleDir = process.env.PLAYWRIGHT_MODULE_DIR;
    if (moduleDir) {
      return createRequire(path.join(moduleDir, "package.json"))("playwright");
    }
    throw new Error("Playwright is required. Run `npm install --no-save playwright` before `npm run test:visual`.", { cause: error });
  }
}

function contentType(file) {
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".gif": "image/gif",
    ".xml": "application/xml",
    ".txt": "text/plain; charset=utf-8",
  }[path.extname(file)] || "application/octet-stream";
}

const server = http.createServer((request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    if (!relative || relative.endsWith("/")) relative += "index.html";
    const file = path.resolve(siteRoot, relative);
    if (!file.startsWith(path.resolve(siteRoot))) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const body = fs.readFileSync(file);
    response.writeHead(200, { "Content-Type": contentType(file), "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;
const { chromium } = loadPlaywright();
const launchOptions = { headless: true };
if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
}

const browser = await chromium.launch(launchOptions);
const viewports = [
  [1920, 1080],
  [1440, 900],
  [1280, 720],
  [768, 1024],
  [430, 932],
  [390, 844],
];
const report = { generatedAt: new Date().toISOString(), viewports: [], flows: {} };

function check(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  for (const [width, height] of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: "light" });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/?gpu=rtx3060-12&lang=ko`, { waitUntil: "networkidle" });
    await page.locator('[data-workload-tab="audioTts"]').click();
    await page.locator("#simpleModePanel").scrollIntoViewIfNeeded();

    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      purposeWorkload: document.querySelector("#simplePurpose")?.dataset.workload,
      purposeValues: [...document.querySelectorAll("#simplePurpose option")].map((option) => option.value),
      cardTypes: [...document.querySelectorAll(".simple-pick-card")].map((card) => card.dataset.modelType),
      taskButtons: document.querySelectorAll(".core-task-actions [data-core-task]").length,
      mainWidth: Math.round(document.querySelector("main")?.getBoundingClientRect().width || 0),
    }));
    check(state.overflow <= 0, `${width}x${height}: horizontal overflow ${state.overflow}px`);
    check(state.purposeWorkload === "audioTts", `${width}x${height}: TTS purpose state was not restored`);
    check(state.purposeValues.includes("voiceCloning"), `${width}x${height}: voice-cloning purpose is missing`);
    check(state.cardTypes.length > 0 && state.cardTypes.every((type) => type === "audio-tts"), `${width}x${height}: recommendation crossed workload boundaries`);
    check(state.taskButtons === 3, `${width}x${height}: beginner task count changed`);

    await page.screenshot({
      path: path.join(outputDir, `finder-tts-${width}x${height}.png`),
      fullPage: true,
    });
    report.viewports.push({ width, height, ...state });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/?gpu=rtx3060-12&lang=ko`, { waitUntil: "networkidle" });
  await page.locator('[data-workload-tab="audioTts"]').click();
  await page.locator("#simplePurpose").selectOption("voiceCloning");
  const names = await page.locator(".simple-pick-head strong").allTextContents();
  check(names.includes("XTTS-v2"), "Voice cloning did not recommend XTTS-v2");
  await page.locator(".simple-pick-card-toggle").first().click();
  const feedbackLinks = await page.locator("[data-run-feedback]").evaluateAll((links) => links.map((link) => link.href));
  check(feedbackLinks.length === 2, "Success/failure feedback links are missing");
  check(feedbackLinks.every((url) => url.includes("github.com/jaeseok614/llm-gpu-checker-ko/issues/new")), "Feedback does not open the repository issue form");
  const feedbackBodies = feedbackLinks.map((url) => new URL(url).searchParams.get("body") || "");
  check(feedbackBodies.every((body) => /런타임: PyTorch/.test(body) && !/llama\.?cpp/i.test(body)), "TTS feedback contains an unrelated LLM runtime");

  await page.locator('[data-language-toggle] [data-lang="en"]').click();
  const englishOptions = await page.locator("#simplePurpose option").allTextContents();
  check(englishOptions.every((label) => !/[가-힣]/.test(label)), "Korean text remained in English purpose options");
  await page.locator('[data-language-toggle] [data-lang="ko"]').click();
  const koreanCard = await page.locator(".simple-pick-card").first().innerText();
  check(!/Calculated estimate|Copy run command|Approx\./.test(koreanCard), "English fragments remained after returning to Korean");

  const staticResponse = await page.request.get(`${baseUrl}/model/xtts-v2/`);
  check(staticResponse.ok(), "XTTS-v2 static model page is missing");
  const sitemapResponse = await page.request.get(`${baseUrl}/sitemap.xml`);
  check(sitemapResponse.ok() && (await sitemapResponse.text()).includes("/model/xtts-v2/"), "sitemap.xml does not include model pages");
  report.flows = { voiceCloningModels: names, feedbackLinks: feedbackLinks.length, languageRoundTrip: true, staticSeo: true };
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

fs.writeFileSync(path.join(outputDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`visual regression passed for ${viewports.length} viewports; artifacts: ${path.relative(root, outputDir)}`);
