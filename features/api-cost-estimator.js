/**
 * "API vs Local" -- a standalone core-task mode, separate from every other
 * mode in this app. Every other mode answers "what GPU do I need to run
 * this locally"; this one answers a different question users increasingly
 * ask alongside that: "what would it cost to just call a hosted API
 * instead of buying/renting a GPU at all". It deliberately does NOT touch
 * the local GPU catalog (data/gpus.js) or the VRAM-fit calculations
 * anywhere else in the app -- it only reads data/api-models.js (per-token
 * pricing for hosted API models) and the usage numbers typed into this
 * panel.
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
  const TIER_ORDER = ["economy", "balanced", "flagship"];

  const WORKLOAD_LABEL = {
    general: { ko: "일반 챗봇", en: "General chatbot" },
    rag: { ko: "RAG·문서 QA", en: "RAG / document Q&A" },
    coding: { ko: "코딩", en: "Coding" },
    reasoning: { ko: "추론", en: "Reasoning" },
    batch: { ko: "대량 배치", en: "Batch processing" },
  };
  // Which quality tier a given workload TYPICALLY calls for -- purely a
  // starting-point suggestion for the primary Quality selector below, never
  // a second input to the cost formula itself. Changing "용도" only changes
  // which tier gets pre-selected; it never changes estimate()'s math.
  const WORKLOAD_TIER_HINT = {
    general: "balanced",
    rag: "balanced",
    coding: "flagship",
    reasoning: "flagship",
    batch: "economy",
  };

  // Provider filter and column sort inside the "전체 9개 모델 보기" (view all 9)
  // expanded table are UI-only concerns -- they never touch estimate()
  // itself, so platform-v3.js's build-vs-buy comparison (which calls
  // estimate() directly, not through this panel) is unaffected.
  const SORT_COLUMNS = {
    provider: (row) => row.provider,
    name: (row) => row.name,
    tier: (row) => row.tier,
    input: (row) => row.inputPerMTokUsd,
    output: (row) => row.outputPerMTokUsd,
    cost: (row) => row.monthlyCostUsd,
  };
  let tableFilter = { provider: "all", tier: "all", sortKey: "cost", sortDir: "asc" };
  // Primary view state: which quality tier the compact 3-model view shows,
  // which workload preset last drove that tier choice, and whether the
  // "전체 9개 모델 보기" (view all 9) table is currently expanded.
  let viewState = { workload: "general", tier: "balanced", expanded: false };

  function providerOptions() {
    return [...new Set(apiModels().map((model) => model.provider))].sort();
  }

  function applyTableFilterAndSort(rows) {
    const filtered = rows.filter((row) =>
      (tableFilter.provider === "all" || row.provider === tableFilter.provider)
      && (tableFilter.tier === "all" || row.tier === tableFilter.tier));
    const getValue = SORT_COLUMNS[tableFilter.sortKey] || SORT_COLUMNS.cost;
    const direction = tableFilter.sortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const left = getValue(a);
      const right = getValue(b);
      if (typeof left === "string") return left.localeCompare(right) * direction;
      return (left - right) * direction;
    });
  }

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
    // placement-primary-badge, studio-form-note, simple-data-coverage)
    // rather than adding a full new set of CSS rules -- styles.css is
    // already close to its size budget. Only the handful of classes listed
    // in the "v7.18 API vs Local" CSS section are genuinely new.
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
      <div class="studio-question-grid api-cost-primary-row">
        <label class="field"><span id="apiCostWorkloadLabel"></span>
          <select id="apiCostWorkload">
            <option value="general"></option>
            <option value="rag"></option>
            <option value="coding"></option>
            <option value="reasoning"></option>
            <option value="batch"></option>
          </select>
        </label>
        <label class="field"><span id="apiCostTierLabel"></span>
          <select id="apiCostTier">
            <option value="economy"></option>
            <option value="balanced"></option>
            <option value="flagship"></option>
          </select>
        </label>
      </div>
      <p class="api-cost-tier-hint" id="apiCostTierHint"></p>
      <div class="simple-data-coverage api-cost-usage-summary" id="apiCostUsageSummary" aria-label="비교 조건"></div>
      <div class="studio-table-wrap">
        <table class="studio-table" id="apiCostTable"></table>
      </div>
      <button type="button" class="ghost-button api-cost-expand-toggle" id="apiCostExpandToggle" aria-expanded="false"></button>
      <div class="api-cost-expanded" id="apiCostExpanded" hidden>
        <div class="studio-question-grid api-cost-filter-row">
          <label class="field"><span id="apiCostProviderFilterLabel"></span><select id="apiCostProviderFilter"><option value="all"></option></select></label>
          <label class="field"><span id="apiCostTierFilterLabel"></span><select id="apiCostTierFilter"><option value="all"></option></select></label>
        </div>
        <div class="studio-table-wrap">
          <table class="studio-table" id="apiCostFullTable"></table>
        </div>
      </div>
      <p class="studio-form-note" id="apiCostCaveat"></p>
      <p id="apiCostBridge"></p>
    `;
    mount.appendChild(panel);
    ["apiCostMonthlyRequests", "apiCostInputTokens", "apiCostOutputTokens"].forEach((id) => {
      panel.querySelector(`#${id}`).addEventListener("input", () => renderApiCostEstimator());
    });
    panel.querySelector("#apiCostWorkload").addEventListener("change", (event) => {
      viewState.workload = event.target.value;
      // Bias the primary Quality selector to this workload's typical tier --
      // the user can still override it afterward via the Quality select
      // itself; this only sets a sensible starting point.
      viewState.tier = WORKLOAD_TIER_HINT[viewState.workload] || viewState.tier;
      renderApiCostEstimator();
    });
    panel.querySelector("#apiCostTier").addEventListener("change", (event) => {
      viewState.tier = event.target.value;
      renderApiCostEstimator();
    });
    panel.querySelector("#apiCostExpandToggle").addEventListener("click", () => {
      viewState.expanded = !viewState.expanded;
      renderApiCostEstimator();
    });
    panel.querySelector("#apiCostProviderFilter").addEventListener("change", (event) => {
      tableFilter.provider = event.target.value;
      renderApiCostEstimator();
    });
    panel.querySelector("#apiCostTierFilter").addEventListener("change", (event) => {
      tableFilter.tier = event.target.value;
      renderApiCostEstimator();
    });
    // Column headers are rebuilt on every render (their sort indicator
    // depends on the current tableFilter state), so bind sort clicks once,
    // delegated on the stable <table> element -- the same pattern used for
    // #apiCostBridge below, for the same reason (a fresh <th> with no
    // listener would otherwise replace the old one on each render).
    panel.querySelector("#apiCostFullTable").addEventListener("click", (event) => {
      const header = event.target.closest("[data-sort-key]");
      if (!header) return;
      const key = header.dataset.sortKey;
      if (tableFilter.sortKey === key) tableFilter.sortDir = tableFilter.sortDir === "asc" ? "desc" : "asc";
      else { tableFilter.sortKey = key; tableFilter.sortDir = "asc"; }
      renderApiCostEstimator();
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

  function sortIndicator(key) {
    if (tableFilter.sortKey !== key) return "";
    return tableFilter.sortDir === "asc" ? " ▲" : " ▼";
  }

  function apiCostColumns(en) {
    return [
      ["provider", en ? "Provider" : "제공사"],
      ["name", en ? "Model" : "모델"],
      ["tier", en ? "Tier" : "등급"],
      ["input", en ? "Input $/1M" : "입력가($/1M)"],
      ["output", en ? "Output $/1M" : "출력가($/1M)"],
      ["cost", en ? "Monthly cost" : "월 예상 비용"],
    ];
  }

  function apiCostRow(row, language, isCheapest) {
    const en = language === "en";
    const tierLabel = TIER_LABEL[row.tier]?.[en ? "en" : "ko"] || row.tier;
    const note = row.note?.[en ? "en" : "ko"] || "";
    return `<tr class="${isCheapest ? "is-cheapest" : ""}">
      <td>${escapeHtml(row.provider)}</td>
      <td><a href="${escapeAttr(row.sourceUrl)}" target="_blank" rel="noreferrer" title="${escapeAttr(note)}">${escapeHtml(row.name)}</a>${isCheapest ? ` <span class="placement-primary-badge">${en ? "Cheapest" : "최저가"}</span>` : ""}</td>
      <td>${escapeHtml(tierLabel)}</td>
      <td>${row.inputPerMTokUsd.toFixed(2)}</td>
      <td>${row.outputPerMTokUsd.toFixed(2)}</td>
      <td>${escapeHtml(formatUsd(row.monthlyCostUsd))} <small>(${escapeHtml(formatKrw(row.monthlyCostKrw))})</small></td>
    </tr>`;
  }

  // Compact, non-sortable table for the default "3 models, one per
  // provider, matching the selected quality tier" view -- this is the
  // primary thing the panel shows before anyone expands anything. The
  // "cheapest" badge here is scoped to the 3 rows actually shown (cheapest
  // within this tier), not the global cheapest across all 9 -- the global
  // cheapest is almost always the economy tier, which wouldn't appear at
  // all while looking at, say, the flagship tier, leaving no row flagged.
  function renderCompactTable(compactRows, language) {
    const en = language === "en";
    const cheapestUsd = compactRows.reduce((min, row) => Math.min(min, row.monthlyCostUsd), Infinity);
    const head = `<thead><tr>${apiCostColumns(en).map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>`;
    const body = compactRows.length
      ? compactRows.map((row) => apiCostRow(row, language, row.monthlyCostUsd === cheapestUsd)).join("")
      : `<tr><td colspan="6" class="api-cost-empty">${en ? "No tracked model in this tier." : "이 등급에 해당하는 모델이 없습니다."}</td></tr>`;
    return `${head}<tbody>${body}</tbody>`;
  }

  // Full, sortable/filterable table for the "전체 9개 모델 보기" (view all 9)
  // expanded state -- unchanged from the previous filter/sort behavior.
  function renderFullTable(rows, language, allRows) {
    const en = language === "en";
    // The "cheapest" badge always reflects the globally cheapest tracked
    // model (allRows, before any provider/tier filter is applied) -- not
    // just the cheapest among whatever the current filter happens to show.
    // Otherwise filtering down to one expensive provider would silently
    // relabel its priciest model as "Cheapest", which would misrepresent it.
    const cheapestUsd = (allRows?.length ? allRows : rows).reduce((min, row) => Math.min(min, row.monthlyCostUsd), Infinity);
    const columns = apiCostColumns(en);
    const head = `<thead><tr>${columns.map(([key, label]) =>
      `<th class="is-sortable" data-sort-key="${key}" aria-sort="${tableFilter.sortKey === key ? (tableFilter.sortDir === "asc" ? "ascending" : "descending") : "none"}">${escapeHtml(label)}${sortIndicator(key)}</th>`
    ).join("")}</tr></thead>`;
    const body = rows.length
      ? rows.map((row) => apiCostRow(row, language, row.monthlyCostUsd === cheapestUsd)).join("")
      : `<tr><td colspan="6" class="api-cost-empty">${en ? "No tracked model matches this filter." : "이 조건에 맞는 모델이 없습니다."}</td></tr>`;
    return `${head}<tbody>${body}</tbody>`;
  }

  function renderApiCostEstimator() {
    const panel = ensureApiCostPanel();
    if (!panel) return;
    const en = uiLanguage === "en";
    panel.querySelector("#apiCostKicker").textContent = "API VS LOCAL";
    panel.querySelector("#apiCostTitle").textContent = "API vs Local";
    panel.querySelector("#apiCostNote").textContent = en
      ? "Compare monthly hosted-API cost against your usage, and see where self-hosting would start paying off."
      : "월 사용량 기준 API 비용을 비교하고, 어느 시점부터 자체 구축이 유리해지는지 함께 확인하세요.";
    panel.querySelector("#apiCostRequestsLabel").textContent = en ? "Monthly requests" : "월간 요청 수";
    panel.querySelector("#apiCostInputTokensLabel").textContent = en ? "Average input tokens / request" : "요청당 평균 입력 토큰";
    panel.querySelector("#apiCostOutputTokensLabel").textContent = en ? "Average output tokens / request" : "요청당 평균 출력 토큰";
    panel.querySelector("#apiCostWorkloadLabel").textContent = en ? "Workload" : "용도";
    panel.querySelector("#apiCostTierLabel").textContent = en ? "Quality" : "품질";
    panel.querySelector("#apiCostProviderFilterLabel").textContent = en ? "Provider" : "제공사";
    panel.querySelector("#apiCostTierFilterLabel").textContent = en ? "Tier" : "등급";

    // Rebuild every <select>'s options on every render (cheap -- a handful of
    // options each) rather than only once at creation, so relabeling on a
    // language switch doesn't need its own separate code path; the
    // currently selected value is preserved either way since it lives in
    // viewState/tableFilter, not read back from the DOM.
    const workloadSelect = panel.querySelector("#apiCostWorkload");
    [...workloadSelect.options].forEach((option) => {
      option.textContent = WORKLOAD_LABEL[option.value]?.[en ? "en" : "ko"] || option.value;
    });
    workloadSelect.value = viewState.workload;

    const tierSelect = panel.querySelector("#apiCostTier");
    [...tierSelect.options].forEach((option) => {
      option.textContent = TIER_LABEL[option.value]?.[en ? "en" : "ko"] || option.value;
    });
    tierSelect.value = viewState.tier;

    const providerSelect = panel.querySelector("#apiCostProviderFilter");
    providerSelect.innerHTML = `<option value="all">${en ? "All providers" : "전체 제공사"}</option>`
      + providerOptions().map((provider) => `<option value="${escapeAttr(provider)}">${escapeHtml(provider)}</option>`).join("");
    providerSelect.value = tableFilter.provider;
    const tierFilterSelect = panel.querySelector("#apiCostTierFilter");
    tierFilterSelect.innerHTML = `<option value="all">${en ? "All tiers" : "전체 등급"}</option>`
      + TIER_ORDER.map((tier) => `<option value="${tier}">${escapeHtml(TIER_LABEL[tier][en ? "en" : "ko"])}</option>`).join("");
    tierFilterSelect.value = tableFilter.tier;

    const monthlyRequests = clampNumber(panel.querySelector("#apiCostMonthlyRequests").value, 0, 1_000_000_000, 100000);
    const inputTokensPerRequest = clampNumber(panel.querySelector("#apiCostInputTokens").value, 0, 2_000_000, 2000);
    const outputTokensPerRequest = clampNumber(panel.querySelector("#apiCostOutputTokens").value, 0, 2_000_000, 500);
    const allRows = estimate({ monthlyRequests, inputTokensPerRequest, outputTokensPerRequest });

    // "용도" only pre-selects a tier; it never filters or re-weights the
    // cost formula itself, so the hint sentence is the only place the
    // workload choice shows up besides having set viewState.tier.
    const hintTier = WORKLOAD_TIER_HINT[viewState.workload];
    const hintTierLabel = TIER_LABEL[hintTier]?.[en ? "en" : "ko"] || hintTier;
    const workloadLabel = WORKLOAD_LABEL[viewState.workload]?.[en ? "en" : "ko"] || viewState.workload;
    panel.querySelector("#apiCostTierHint").textContent = en
      ? `${workloadLabel} usage typically fits the ${hintTierLabel} tier -- feel free to pick a different one.`
      : `${workloadLabel}에는 보통 ${hintTierLabel} 등급을 많이 사용합니다 -- 다른 등급을 직접 골라도 됩니다.`;

    // "비교 조건" (comparison conditions) -- plain computed numbers, not an
    // AI "interpretation" of the inputs above. Every figure here is a
    // deterministic function of the three number fields plus the selected
    // quality tier; nothing here is inferred or approximated.
    const monthlyInputTokens = monthlyRequests * inputTokensPerRequest;
    const monthlyOutputTokens = monthlyRequests * outputTokensPerRequest;
    const totalTokens = monthlyInputTokens + monthlyOutputTokens;
    const numberLocale = en ? "en-US" : "ko-KR";
    const tierLabelForSummary = TIER_LABEL[viewState.tier]?.[en ? "en" : "ko"] || viewState.tier;
    panel.querySelector("#apiCostUsageSummary").innerHTML = `
      <span><strong>${Math.round(monthlyRequests).toLocaleString(numberLocale)}</strong> ${en ? "requests/mo" : "월 요청"}</span>
      <span><strong>${Math.round(monthlyInputTokens).toLocaleString(numberLocale)}</strong> ${en ? "input tokens/mo" : "월 입력 토큰"}</span>
      <span><strong>${Math.round(monthlyOutputTokens).toLocaleString(numberLocale)}</strong> ${en ? "output tokens/mo" : "월 출력 토큰"}</span>
      <span><strong>${Math.round(totalTokens).toLocaleString(numberLocale)}</strong> ${en ? "tokens/mo total" : "총 처리량(토큰/월)"}</span>
      <span><strong>${escapeHtml(tierLabelForSummary)}</strong> ${en ? "quality tier" : "품질 기준"}</span>
    `;

    // Default view: only the 3 models (one per provider) in the selected
    // quality tier -- the data file tracks exactly one model per
    // provider per tier, so filtering by tier alone already yields the
    // "one per provider" set with no extra dedupe logic needed.
    const compactRows = allRows.filter((row) => row.tier === viewState.tier);
    panel.querySelector("#apiCostTable").innerHTML = renderCompactTable(compactRows, uiLanguage);

    const expandToggle = panel.querySelector("#apiCostExpandToggle");
    expandToggle.setAttribute("aria-expanded", String(viewState.expanded));
    expandToggle.textContent = viewState.expanded
      ? (en ? "Hide the other models ▲" : "다른 모델 접기 ▲")
      : (en ? "View all 9 models →" : "전체 9개 모델 보기 →");
    panel.querySelector("#apiCostExpanded").hidden = !viewState.expanded;
    // Always re-render the expanded table's content (even while its
    // container is hidden), not just when actually visible -- otherwise a
    // language switch or a usage-input change made while collapsed leaves
    // stale content sitting in the DOM (invisible, but still picked up by
    // anything that reads .textContent, like an i18n leftover-Korean check
    // or a screen reader that ignores `hidden`).
    const filteredRows = applyTableFilterAndSort(allRows);
    panel.querySelector("#apiCostFullTable").innerHTML = renderFullTable(filteredRows, uiLanguage, allRows);

    const meta = window.LLM_GPU_CHECKER_DATA?.apiPricingMeta;
    const caveat = meta?.basis?.[en ? "en" : "ko"] || "";
    panel.querySelector("#apiCostCaveat").textContent = `${caveat}${caveat ? " " : ""}${en ? `(checked ${meta?.verifiedAt || ""})` : `(확인일 ${meta?.verifiedAt || ""})`}`;
    panel.querySelector("#apiCostBridge").innerHTML = en
      ? `Want to compare this against buying your own GPU for the same usage? Try <button type="button" class="ghost-button" data-core-task="infra">the infra sizing estimate</button>.`
      : `같은 사용량 기준으로 직접 GPU를 사는 비용과 비교하려면 <button type="button" class="ghost-button" data-core-task="infra">인프라 견적</button>에서 확인하세요.`;
  }

  window.AIHardwareApiCost = { estimate, ensureApiCostPanel, renderApiCostEstimator, TIER_LABEL, formatUsd, formatKrw };
})();
