/**
 * "API 비용 계산기" (API cost calculator) -- a standalone core-task mode,
 * separate from every other mode in this app. Every other mode answers
 * "what GPU do I need to run this locally"; this one answers a different
 * question users increasingly ask alongside that: "what would it cost to
 * just call a hosted API instead of buying/renting a GPU at all". It
 * deliberately does NOT touch the local GPU catalog (data/gpus.js) or the
 * VRAM-fit calculations anywhere else in the app -- it only reads
 * data/api-models.js (per-token pricing for hosted API models) and the
 * usage numbers typed into this panel.
 *
 * Also exposes window.AIHardwareApiCost.estimate() so platform-v3.js's
 * infra sizing studio can reuse the exact same cost formula for its
 * "self-host vs API" comparison, without duplicating the math.
 */
(() => {
  const TIER_LABEL = {
    flagship: { ko: "플래그십", en: "Flagship" },
    balanced: { ko: "균형형", en: "Balanced" },
    economy: { ko: "저가형", en: "Economy" },
  };

  function apiExchangeRate() {
    return Math.max(1, Number(window.LLM_GPU_CHECKER_DATA?.priceDataMeta?.exchangeRateKrwPerUsd) || 1400);
  }

  function apiModels() {
    return window.LLM_GPU_CHECKER_DATA?.apiModels || [];
  }

  // Shared cost formula: monthly requests x average input/output tokens per
  // request, priced at each model's standard (non-cached, non-batch)
  // per-1M-token rate. No caching/batch/long-context discounts or surcharges
  // are modeled -- see apiPricingMeta.basis for the caveat shown in the UI.
  function estimate({ monthlyRequests, inputTokensPerRequest, outputTokensPerRequest }) {
    const requests = Math.max(0, Number(monthlyRequests) || 0);
    const inputTokens = Math.max(0, Number(inputTokensPerRequest) || 0);
    const outputTokens = Math.max(0, Number(outputTokensPerRequest) || 0);
    const monthlyInputTokens = requests * inputTokens;
    const monthlyOutputTokens = requests * outputTokens;
    const rate = apiExchangeRate();
    return apiModels()
      .map((model) => {
        const monthlyCostUsd = (monthlyInputTokens / 1_000_000) * model.inputPerMTokUsd
          + (monthlyOutputTokens / 1_000_000) * model.outputPerMTokUsd;
        return {
          ...model,
          monthlyInputTokens,
          monthlyOutputTokens,
          monthlyCostUsd,
          monthlyCostKrw: monthlyCostUsd * rate,
        };
      })
      .sort((a, b) => a.monthlyCostUsd - b.monthlyCostUsd);
  }

  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 10 ? 2 : 0 }).format(value);
  }

  function formatKrw(value) {
    // Use the currency symbol "₩" rather than the Korean word "원" so this
    // still reads correctly (and never trips a "no Korean text left" i18n
    // check) when the panel is switched to English -- showing the KRW
    // equivalent alongside the USD price is useful in both languages for a
    // Korean-market tool, not leftover untranslated copy.
    return `₩${Math.round(value).toLocaleString("ko-KR")}`;
  }

  function ensureApiCostPanel() {
    if (typeof $ !== "function") return null;
    if ($("apiCostPanel")) return $("apiCostPanel");
    const mount = document.querySelector(".app-shell");
    if (!mount) return null;
    const panel = document.createElement("section");
    // Reuse existing panel/table/badge styling (gpu-advisor-panel,
    // gpu-insights-head, studio-question-grid, studio-table,
    // placement-primary-badge, studio-form-note) rather than adding a full
    // new set of CSS rules for a panel that visually just needs to match the
    // rest of the app -- styles.css is already at ~83% of its size budget.
    // Only "is-cheapest" (the row highlight) is genuinely new and gets a
    // small dedicated rule.
    panel.className = "gpu-advisor-panel api-cost-panel";
    panel.id = "apiCostPanel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "apiCostTitle");
    panel.innerHTML = `
      <div class="gpu-insights-head">
        <div>
          <span class="section-kicker" id="apiCostKicker"></span>
          <h2 id="apiCostTitle"></h2>
          <p id="apiCostNote"></p>
        </div>
      </div>
      <div class="studio-question-grid">
        <label class="field"><span id="apiCostRequestsLabel"></span><input id="apiCostMonthlyRequests" type="number" min="0" step="1000" value="100000"></label>
        <label class="field"><span id="apiCostInputTokensLabel"></span><input id="apiCostInputTokens" type="number" min="0" step="128" value="2000"></label>
        <label class="field"><span id="apiCostOutputTokensLabel"></span><input id="apiCostOutputTokens" type="number" min="0" step="32" value="500"></label>
      </div>
      <div class="studio-table-wrap">
        <table class="studio-table" id="apiCostTable"></table>
      </div>
      <p class="studio-form-note" id="apiCostCaveat"></p>
      <p id="apiCostBridge"></p>
    `;
    mount.appendChild(panel);
    ["apiCostMonthlyRequests", "apiCostInputTokens", "apiCostOutputTokens"].forEach((id) => {
      panel.querySelector(`#${id}`).addEventListener("input", () => renderApiCostEstimator());
    });
    // The bridge link's innerHTML is rewritten on every render() call, but the
    // #apiCostBridge element itself is not -- attach one delegated listener
    // here (at creation time) rather than re-binding a listener on the inner
    // button each render, which would only ever catch the FIRST render's
    // button (a fresh, listener-less node replaces it on every subsequent
    // render). This is also why the button can't rely on the app-wide
    // `[data-core-task]` click binding set up once in bindEvents() at init --
    // this button doesn't exist in the DOM yet at that point.
    panel.querySelector("#apiCostBridge").addEventListener("click", (event) => {
      const button = event.target.closest("[data-core-task]");
      if (button && typeof setCoreTaskMode === "function") setCoreTaskMode(button.dataset.coreTask);
    });
    return panel;
  }

  function renderApiCostTableRows(rows, language) {
    const en = language === "en";
    const cheapestUsd = rows.length ? rows[0].monthlyCostUsd : 0;
    const head = `<thead><tr>
      <th>${en ? "Provider" : "제공사"}</th>
      <th>${en ? "Model" : "모델"}</th>
      <th>${en ? "Tier" : "등급"}</th>
      <th>${en ? "Input $/1M" : "입력가($/1M)"}</th>
      <th>${en ? "Output $/1M" : "출력가($/1M)"}</th>
      <th>${en ? "Monthly cost" : "월 예상 비용"}</th>
    </tr></thead>`;
    const body = rows.map((row) => {
      const tierLabel = TIER_LABEL[row.tier]?.[en ? "en" : "ko"] || row.tier;
      const isCheapest = row.monthlyCostUsd === cheapestUsd;
      const note = row.note?.[en ? "en" : "ko"] || "";
      return `<tr class="${isCheapest ? "is-cheapest" : ""}">
        <td>${escapeHtml(row.provider)}</td>
        <td><a href="${escapeAttr(row.sourceUrl)}" target="_blank" rel="noreferrer" title="${escapeAttr(note)}">${escapeHtml(row.name)}</a>${isCheapest ? ` <span class="placement-primary-badge">${en ? "Cheapest" : "최저가"}</span>` : ""}</td>
        <td>${escapeHtml(tierLabel)}</td>
        <td>${row.inputPerMTokUsd.toFixed(2)}</td>
        <td>${row.outputPerMTokUsd.toFixed(2)}</td>
        <td>${escapeHtml(formatUsd(row.monthlyCostUsd))} <small>(${escapeHtml(formatKrw(row.monthlyCostKrw))})</small></td>
      </tr>`;
    }).join("");
    return `${head}<tbody>${body}</tbody>`;
  }

  function renderApiCostEstimator() {
    const panel = ensureApiCostPanel();
    if (!panel) return;
    const en = uiLanguage === "en";
    panel.querySelector("#apiCostKicker").textContent = "API COST";
    panel.querySelector("#apiCostTitle").textContent = en ? "API cost calculator" : "API 비용 계산기";
    panel.querySelector("#apiCostNote").textContent = en
      ? "Compare monthly cost across major hosted API models -- no GPU purchase required for any of these."
      : "GPU를 사지 않고 API를 그대로 쓸 때 예상되는 월 비용을 주요 제공사별로 비교합니다.";
    panel.querySelector("#apiCostRequestsLabel").textContent = en ? "Monthly requests" : "월간 요청 수";
    panel.querySelector("#apiCostInputTokensLabel").textContent = en ? "Average input tokens / request" : "요청당 평균 입력 토큰";
    panel.querySelector("#apiCostOutputTokensLabel").textContent = en ? "Average output tokens / request" : "요청당 평균 출력 토큰";

    const monthlyRequests = clampNumber(panel.querySelector("#apiCostMonthlyRequests").value, 0, 1_000_000_000, 100000);
    const inputTokensPerRequest = clampNumber(panel.querySelector("#apiCostInputTokens").value, 0, 2_000_000, 2000);
    const outputTokensPerRequest = clampNumber(panel.querySelector("#apiCostOutputTokens").value, 0, 2_000_000, 500);
    const rows = estimate({ monthlyRequests, inputTokensPerRequest, outputTokensPerRequest });
    panel.querySelector("#apiCostTable").innerHTML = renderApiCostTableRows(rows, uiLanguage);

    const meta = window.LLM_GPU_CHECKER_DATA?.apiPricingMeta;
    const caveat = meta?.basis?.[en ? "en" : "ko"] || "";
    panel.querySelector("#apiCostCaveat").textContent = `${caveat}${caveat ? " " : ""}${en ? `(checked ${meta?.verifiedAt || ""})` : `(확인일 ${meta?.verifiedAt || ""})`}`;
    panel.querySelector("#apiCostBridge").innerHTML = en
      ? `Want to compare this against buying your own GPU for the same usage? Try <button type="button" class="ghost-button" data-core-task="infra">the infra sizing estimate</button>.`
      : `같은 사용량 기준으로 직접 GPU를 사는 비용과 비교하려면 <button type="button" class="ghost-button" data-core-task="infra">인프라 견적</button>에서 확인하세요.`;
  }

  window.AIHardwareApiCost = { estimate, ensureApiCostPanel, renderApiCostEstimator, TIER_LABEL, formatUsd, formatKrw };
})();
