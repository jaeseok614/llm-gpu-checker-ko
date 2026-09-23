import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";
test("failed lazy script can be retried and concurrent calls share the request", async () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url: "https://example.com/", runScripts: "outside-only",
  });
  try {
    dom.window.eval(fs.readFileSync("feature-loader.js", "utf8"));
    const load = dom.window.loadApiCostEstimator;
    const first = load();
    assert.equal(load(), first);
    const failed = dom.window.document.querySelector("script[data-feature]");
    const rejected = assert.rejects(first);
    failed.dispatchEvent(new dom.window.Event("error"));
    await rejected;
    assert.equal(failed.isConnected, false);
    const retry = load();
    const replacement = dom.window.document.querySelector("script[data-feature]");
    assert.notEqual(replacement, failed);
    replacement.dispatchEvent(new dom.window.Event("load"));
    await retry;
    assert.equal(replacement.dataset.loaded, "true");
    await load();
    assert.equal(dom.window.document.querySelectorAll("script[data-feature]").length, 1);
  } finally { dom.window.close(); }
});
