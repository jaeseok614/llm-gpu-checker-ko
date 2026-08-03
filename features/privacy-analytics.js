/**
 * Privacy-first local funnel counters.
 * Only predefined event names and integer counts are stored in this browser.
 * No field value, customer name, model text, price, URL, or network request is recorded.
 */
(() => {
  const STORAGE_KEY = "ai-hardware-fit-local-funnel-v1";
  const EVENTS = new Set([
    "task_finder", "task_model_finder", "task_infra", "task_placement",
    "sample_gpu", "sample_model", "sample_infra", "result_reached", "empty_result",
    "share", "excel", "pdf", "command", "return_to_start",
  ]);
  const seenResults = new WeakSet();

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const counts = {};
      Object.entries(parsed.counts || {}).forEach(([key, value]) => {
        if (EVENTS.has(key) && Number.isInteger(value) && value >= 0) counts[key] = value;
      });
      return { version: 1, localOnly: true, counts };
    } catch {
      return { version: 1, localOnly: true, counts: {} };
    }
  }

  function write(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function track(name) {
    if (!EVENTS.has(name)) return false;
    const state = read();
    state.counts[name] = (state.counts[name] || 0) + 1;
    write(state);
    renderSummary();
    return true;
  }

  function clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    renderSummary();
  }

  function exportSummary() {
    return JSON.stringify(read(), null, 2);
  }

  function label(key, en) {
    const labels = {
      task_finder: ["GPU로 찾기", "GPU finder"], task_model_finder: ["모델로 찾기", "Model finder"],
      task_infra: ["인프라 견적", "Infrastructure"], task_placement: ["모델 배치", "Placement"],
      sample_gpu: ["GPU 샘플", "GPU sample"], sample_model: ["모델 샘플", "Model sample"], sample_infra: ["견적 샘플", "Estimate sample"],
      result_reached: ["결과 도달", "Result reached"], empty_result: ["빈 결과", "Empty result"],
      share: ["공유", "Share"], excel: ["Excel", "Excel"], pdf: ["PDF", "PDF"], command: ["명령 복사", "Command copy"],
      return_to_start: ["처음으로 복귀", "Returned to start"],
    };
    return labels[key]?.[en ? 1 : 0] || key;
  }

  function renderSummary() {
    const target = document.querySelector("[data-local-funnel-summary]");
    if (!target) return;
    const en = document.documentElement.lang === "en";
    const counts = read().counts;
    const rows = Object.entries(counts).filter(([, value]) => value > 0);
    target.innerHTML = rows.length
      ? rows.map(([key, value]) => `<span>${label(key, en)} <strong>${value}</strong></span>`).join("")
      : `<span>${en ? "No local actions recorded yet." : "아직 이 브라우저에 기록된 행동이 없습니다."}</span>`;
  }

  function installPanel() {
    const footer = document.querySelector(".app-footer");
    if (!footer || footer.querySelector("[data-local-funnel]")) return;
    const en = document.documentElement.lang === "en";
    const panel = document.createElement("details");
    panel.className = "local-funnel-panel";
    panel.dataset.localFunnel = "";
    panel.innerHTML = `
      <summary>${en ? "Private local usage summary" : "개인정보 없는 로컬 사용 요약"}</summary>
      <p>${en ? "Only anonymous event counts are kept in this browser. Nothing is transmitted automatically." : "정해진 행동의 횟수만 이 브라우저에 저장하며 어떤 값도 자동 전송하지 않습니다."}</p>
      <div class="local-funnel-summary" data-local-funnel-summary></div>
      <div class="local-funnel-actions"><button type="button" class="ghost-button" data-local-funnel-copy>${en ? "Copy summary JSON" : "요약 JSON 복사"}</button><button type="button" class="ghost-button" data-local-funnel-clear>${en ? "Clear local summary" : "로컬 요약 삭제"}</button></div>`;
    footer.appendChild(panel);
    panel.querySelector("[data-local-funnel-copy]").addEventListener("click", async () => {
      await navigator.clipboard?.writeText(exportSummary());
      window.AIHardwareUI?.announce(en ? "Local summary copied." : "로컬 요약을 복사했습니다.");
    });
    panel.querySelector("[data-local-funnel-clear]").addEventListener("click", clear);
    renderSummary();
  }

  function classifyClick(target) {
    const task = target.closest("[data-core-task]")?.dataset.coreTask;
    if (task === "finder") return target.closest(".placement-workspace") ? "return_to_start" : "task_finder";
    if (task === "modelFinder") return "task_model_finder";
    if (task === "infra") return "task_infra";
    if (task === "placement") return "task_placement";
    if (target.closest("[data-demo-gpu]")) return "sample_gpu";
    if (target.closest("[data-demo-model]")) return "sample_model";
    if (target.closest("[data-demo-infra]")) return "sample_infra";
    if (target.closest("[data-share-link],[data-si-share]")) return "share";
    if (target.closest("[data-si-export]")) return "excel";
    if (target.closest("[data-si-print]")) return "pdf";
    if (target.closest("[data-copy-command],[data-si-copy-command]")) return "command";
    return "";
  }

  function observeResults() {
    const observer = new MutationObserver(() => {
      if (!window.document) return;
      ["simpleModeResult", "gpuAdvisorResult", "siPlans"].forEach((id) => {
        const node = window.document.getElementById(id);
        if (!node || seenResults.has(node) || !node.textContent.trim()) return;
        seenResults.add(node);
        track(node.querySelector(".empty-state") || /조건에 맞는|No matching|No GPU/.test(node.textContent) ? "empty_result" : "result_reached");
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    installPanel();
    observeResults();
    document.addEventListener("click", (event) => {
      const name = classifyClick(event.target);
      if (name) track(name);
    });
  });

  window.AIHardwareLocalAnalytics = { EVENTS, read, track, clear, exportSummary };
})();
