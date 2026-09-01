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

  // One representative self-hosted (model, reference GPU, quant) per quality
  // tier -- deliberately a single fixed pick per tier rather than the full
  // GPU-catalog search the 인프라 견적 (infra sizing) flow does, so this
  // panel can compute a Local figure from data already loaded at this point
  // (GENERATIVE_MODELS, GPU_PRESETS, QUANTS, KOREAN_GPU_MARKET -- all bare
  // globals declared earlier in the <script> load order) without pulling in
  // platform-v3.js's much heavier QPS/concurrency-driven sizing pipeline.
  // Q4_K_M is used for economy/balanced; flagship drops to Q3_K_M since
  // Llama 3.3 70B at Q4_K_M leaves under 3GB of headroom on a 48GB card --
  // Q3_K_M leaves a more realistic margin for KV cache.
  const LOCAL_TIER_CONFIG = {
    economy: { modelName: "Qwen3 8B", gpuId: "rtx4060ti-16", quantId: "q4" },
    balanced: { modelName: "Qwen2.5 32B Instruct", gpuId: "rtx5090-32", quantId: "q4" },
    flagship: { modelName: "Llama 3.3 70B Instruct", gpuId: "rtx6000ada-48", quantId: "q3" },
  };
  // Assumed light concurrent batching (not user-configurable here -- the
  // infra flow is where QPS/concurrency become real inputs), the same
  // batch-efficiency curve infrastructure-sizing.js uses for its own
  // singleStreamSpeed -> safe-throughput conversion.
  const LOCAL_BATCH_SIZE = 4;
  const LOCAL_UTILIZATION_TARGET = 0.7;
  const LOCAL_ELECTRICITY_KRW_PER_KWH = 150;
  const LOCAL_MAINTENANCE_PCT = 8;
  const SECONDS_PER_MONTH = 60 * 60 * 24 * 30;

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

  // Lightweight, self-contained Local (self-hosted GPU) cost estimate for
  // one quality tier -- deliberately NOT the same pipeline as the infra
  // sizing flow's sizeCandidate()/choosePlans() (features/infrastructure-sizing.js),
  // which needs QPS/concurrency/availability inputs this standalone panel
  // doesn't collect. This mirrors that file's OWN conventions where it can
  // (bandwidth/required-GB as a single-stream tok/s estimate, a batch-size
  // -> batchEfficiency curve, purchaseKrw + 3x annual energy + 3x maintenance
  // for a 3-year TCO, monthly = threeYearTcoKrw / 36) so the two flows stay
  // conceptually consistent even though this one is much simpler.
  function estimateLocal(tier, monthlyOutputTokens) {
    const config = LOCAL_TIER_CONFIG[tier] || LOCAL_TIER_CONFIG.balanced;
    const models = typeof GENERATIVE_MODELS !== "undefined" ? GENERATIVE_MODELS : [];
    const gpus = typeof GPU_PRESETS !== "undefined" ? GPU_PRESETS : [];
    const quants = typeof QUANTS !== "undefined" ? QUANTS : [];
    const model = models.find((item) => item.name === config.modelName);
    const gpu = gpus.find((item) => item.id === config.gpuId);
    const quant = quants.find((item) => item.id === config.quantId);
    if (!model || !gpu || !quant) return null;

    // ~8% overhead beyond raw quantized weight size, same factor used
    // elsewhere in the app's own weight-footprint math.
    const requiredWeightsGb = model.params * quant.bytesPerB * 1.08;
    const vram = Number(gpu.gpuUsableMemoryGb || gpu.vram || 0);
    const singleStreamSpeed = Math.max(8, Number(gpu.bandwidth || 0) / Math.max(1, requiredWeightsGb));
    const batchEfficiency = 1 + Math.log2(LOCAL_BATCH_SIZE) * 0.32;
    const safeTokS = singleStreamSpeed * batchEfficiency * LOCAL_UTILIZATION_TARGET;
    const monthlyCapacityPerGpu = safeTokS * SECONDS_PER_MONTH;
    const gpuCount = Math.max(1, Math.ceil(Math.max(0, Number(monthlyOutputTokens) || 0) / monthlyCapacityPerGpu));

    const market = typeof gpuMarketReference === "function"
      ? gpuMarketReference(gpu)
      : { priceUsd: 0, powerW: 300, priceKind: "calculated-reference" };
    const koreanRows = typeof KOREAN_GPU_MARKET !== "undefined" ? KOREAN_GPU_MARKET : [];
    const koreanMarket = koreanRows.find((row) => row.gpuId === gpu.id);
    const unitPriceKrw = koreanMarket?.lowestKrw || koreanMarket?.newKrw || Math.round(market.priceUsd * apiExchangeRate());
    const priceSource = koreanMarket
      ? { kind: "korean-market", updatedAt: koreanMarket.updatedAt, url: koreanMarket.sourceUrl }
      : { kind: market.priceKind, updatedAt: "", url: gpu.sourceUrl || "" };

    const purchaseKrw = unitPriceKrw * gpuCount;
    const powerW = market.powerW;
    const annualEnergyKrw = Math.round((powerW / 1000) * 24 * 365 * LOCAL_ELECTRICITY_KRW_PER_KWH * gpuCount);
    const maintenanceKrw = (purchaseKrw * LOCAL_MAINTENANCE_PCT) / 100;
    const threeYearTcoKrw = Math.round(purchaseKrw + annualEnergyKrw * 3 + maintenanceKrw * 3);
    const monthlyLocalKrw = threeYearTcoKrw / 36;
    const monthlyRunningKrw = annualEnergyKrw / 12 + maintenanceKrw / 12;

    return {
      tier, model, gpu, quant, gpuCount,
      requiredWeightsGb, vram, headroomGb: vram - requiredWeightsGb,
      singleStreamSpeed, safeTokS, monthlyCapacityPerGpu,
      unitPriceKrw, priceSource, powerW,
      purchaseKrw, annualEnergyKrw, threeYearTcoKrw, monthlyLocalKrw, monthlyRunningKrw,
    };
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
      <div class="api-cost-purpose-row">
        <label class="field api-cost-purpose-field"><span id="apiCostWorkloadLabel"></span>
          <select id="apiCostWorkload">
            <option value="general"></option>
            <option value="rag"></option>
            <option value="coding"></option>
            <option value="reasoning"></option>
            <option value="batch"></option>
          </select>
        </label>
        <div class="api-cost-tier-hint-row">
          <p class="api-cost-tier-hint" id="apiCostTierHint"></p>
          <label class="field api-cost-tier-inline"><span id="apiCostTierLabel"></span>
            <select id="apiCostTier">
              <option value="economy"></option>
              <option value="balanced"></option>
              <option value="flagship"></option>
            </select>
          </label>
        </div>
      </div>
      <div class="simple-data-coverage api-cost-usage-summary" id="apiCostUsageSummary" aria-label="비교 조건"></div>
      <div class="api-cost-verdict" id="apiCostVerdict"></div>
      <div class="api-cost-candidates" id="apiCostTable"></div>
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
      <div class="api-cost-local" id="apiCostLocal"></div>
      <div class="api-cost-breakeven" id="apiCostBreakeven"></div>
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

  // Compact "candidate cards" for the default "3 models, one per provider,
  // matching the selected quality tier" view -- this is the primary thing
  // the panel shows before anyone expands anything. Cards (rather than a
  // dense table row) put the monthly cost front and center, with
  // provider/model/rate details as secondary text -- a decision-screen
  // layout instead of a spreadsheet-style comparison. The "cheapest" badge
  // here is scoped to the 3 cards actually shown (cheapest within this
  // tier), not the global cheapest across all 9 -- the global cheapest is
  // almost always the economy tier, which wouldn't appear at all while
  // looking at, say, the flagship tier, leaving no card flagged.
  function apiCostCandidateCard(row, language, isCheapest) {
    const en = language === "en";
    const tierLabel = TIER_LABEL[row.tier]?.[en ? "en" : "ko"] || row.tier;
    const note = row.note?.[en ? "en" : "ko"] || "";
    return `<article class="api-cost-candidate-card${isCheapest ? " is-cheapest" : ""}">
      <span class="api-cost-candidate-provider">${escapeHtml(row.provider)}</span>
      <strong class="api-cost-candidate-cost">${escapeHtml(formatKrw(row.monthlyCostKrw))}<small>${escapeHtml(formatUsd(row.monthlyCostUsd))} · ${en ? "per month" : "월 예상"}</small></strong>
      <span class="api-cost-candidate-name">
        <a href="${escapeAttr(row.sourceUrl)}" target="_blank" rel="noreferrer" title="${escapeAttr(note)}">${escapeHtml(row.name)}</a>
        ${isCheapest ? `<span class="placement-primary-badge">${en ? "Cheapest" : "최저가"}</span>` : ""}
      </span>
      <span class="api-cost-candidate-rates">${en ? "Tier" : "등급"} ${escapeHtml(tierLabel)} · ${en ? "in" : "입력"} $${row.inputPerMTokUsd.toFixed(2)}/1M · ${en ? "out" : "출력"} $${row.outputPerMTokUsd.toFixed(2)}/1M</span>
    </article>`;
  }

  function renderCandidateCards(compactRows, language) {
    const en = language === "en";
    if (!compactRows.length) {
      return `<p class="api-cost-empty">${en ? "No tracked model in this tier." : "이 등급에 해당하는 모델이 없습니다."}</p>`;
    }
    const cheapestUsd = compactRows.reduce((min, row) => Math.min(min, row.monthlyCostUsd), Infinity);
    return compactRows.map((row) => apiCostCandidateCard(row, language, row.monthlyCostUsd === cheapestUsd)).join("");
  }

  // "결론" banner -- the plain-language verdict this panel leads with, so a
  // user doesn't have to read every row of the table below to work out
  // which side is cheaper. Every figure here is derived from the same
  // cheapestApiMonthlyKrw / localEstimate values the rest of the panel
  // already computes -- nothing new is calculated here except the
  // break-even request volume (linear in requests, since the usage inputs
  // hold input/output tokens-per-request fixed).
  function renderVerdictBanner(monthlyRequests, cheapestApiMonthlyKrw, localEstimate, language) {
    const en = language === "en";
    if (!localEstimate || !cheapestApiMonthlyKrw) return "";
    const apiFavorable = cheapestApiMonthlyKrw <= localEstimate.monthlyLocalKrw;
    const diffKrw = Math.abs(cheapestApiMonthlyKrw - localEstimate.monthlyLocalKrw);
    const numberLocale = en ? "en-US" : "ko-KR";
    const headline = apiFavorable
      ? (en ? "At this usage, using the API is cheaper" : "현재 조건에서는 API 사용이 유리합니다")
      : (en ? "At this usage, self-hosting (Local) is cheaper" : "현재 조건에서는 Local 구축이 유리합니다");
    const diffSentence = apiFavorable
      ? (en ? `API is about ${formatKrw(diffKrw)} cheaper per month` : `API가 월 ${formatKrw(diffKrw)} 더 저렴`)
      : (en ? `Local is about ${formatKrw(diffKrw)} cheaper per month` : `Local이 월 ${formatKrw(diffKrw)} 더 저렴`);

    const costPerRequestKrw = monthlyRequests > 0 ? cheapestApiMonthlyKrw / monthlyRequests : 0;
    const breakevenRequests = costPerRequestKrw > 0 ? localEstimate.monthlyLocalKrw / costPerRequestKrw : null;
    let breakevenSentence = "";
    if (breakevenRequests && monthlyRequests > 0) {
      const breakevenText = Math.round(breakevenRequests).toLocaleString(numberLocale);
      breakevenSentence = apiFavorable
        ? (en
          ? `If monthly usage grows past about ${breakevenText} requests, reconsider self-hosting.`
          : `월 사용량이 약 ${breakevenText}건 이상이면 Local 구축을 다시 검토하세요.`)
        : (en
          ? `If monthly usage falls below about ${breakevenText} requests, the API becomes cheaper instead.`
          : `월 사용량이 약 ${breakevenText}건 아래로 줄어들면 API가 더 유리해집니다.`);
    }

    return `
      <p class="api-cost-verdict-headline">${headline}</p>
      <p class="api-cost-verdict-usage">${en ? "Monthly" : "월"} ${Math.round(monthlyRequests).toLocaleString(numberLocale)}${en ? " requests" : "회"}</p>
      <div class="api-cost-verdict-figures">
        <span>${en ? "Cheapest API" : "API 최저 비용"}<strong>${escapeHtml(formatKrw(cheapestApiMonthlyKrw))}${en ? "/mo" : "/월"}</strong></span>
        <span>${en ? "Local (amortized)" : "Local 환산 비용"}<strong>${escapeHtml(formatKrw(localEstimate.monthlyLocalKrw))}${en ? "/mo" : "/월"}</strong></span>
        <span class="api-cost-verdict-diff">${en ? "Difference" : "차이"}<strong>${escapeHtml(diffSentence)}</strong></span>
      </div>
      ${breakevenSentence ? `<p class="api-cost-verdict-breakeven">${escapeHtml(breakevenSentence)}</p>` : ""}
    `;
  }

  // Simple break-even visualization: the cheapest same-tier API model's
  // cost scales linearly with monthly requests (fixed input/output tokens
  // per request), while Local is a flat amortized monthly cost -- so there
  // is exactly one crossover point. Rendered as a small inline SVG line
  // chart across 4 usage multiples (0.25x/1x/4x/16x today's usage), the
  // same multiples platform-v3.js's build-vs-buy comparison already uses,
  // so the two views stay conceptually consistent.
  const BREAKEVEN_MULTIPLIERS = [0.25, 1, 4, 16];
  function renderBreakevenViz(monthlyRequests, cheapestApiMonthlyKrw, localEstimate, language) {
    const en = language === "en";
    if (!localEstimate || !cheapestApiMonthlyKrw || monthlyRequests <= 0) return "";
    const numberLocale = en ? "en-US" : "ko-KR";
    const costPerRequestKrw = cheapestApiMonthlyKrw / monthlyRequests;
    const points = BREAKEVEN_MULTIPLIERS.map((multiplier) => {
      const requests = monthlyRequests * multiplier;
      return { multiplier, requests, apiCostKrw: costPerRequestKrw * requests };
    });
    const localFlatKrw = localEstimate.monthlyLocalKrw;
    const maxRequests = points[points.length - 1].requests;
    const maxCostKrw = Math.max(...points.map((point) => point.apiCostKrw), localFlatKrw) * 1.1 || 1;

    const width = 640;
    const height = 200;
    const padLeft = 56;
    const padRight = 20;
    const padTop = 16;
    const padBottom = 34;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;
    const xScale = (requests) => padLeft + (maxRequests > 0 ? (requests / maxRequests) * plotWidth : 0);
    const yScale = (costKrw) => padTop + plotHeight - (costKrw / maxCostKrw) * plotHeight;

    const apiLinePoints = points.map((point) => `${xScale(point.requests)},${yScale(point.apiCostKrw)}`).join(" ");
    const localY = yScale(localFlatKrw);
    const currentX = xScale(monthlyRequests);
    const currentApiY = yScale(costPerRequestKrw * monthlyRequests);

    const breakevenRequests = costPerRequestKrw > 0 ? localFlatKrw / costPerRequestKrw : null;
    const breakevenInRange = breakevenRequests !== null && breakevenRequests >= 0 && breakevenRequests <= maxRequests;
    const breakevenX = breakevenInRange ? xScale(breakevenRequests) : null;
    const breakevenLabel = breakevenRequests !== null
      ? new Intl.NumberFormat(numberLocale, { notation: "compact", maximumFractionDigits: 1 }).format(breakevenRequests)
      : "";

    const xTicks = points.map((point) => {
      const label = new Intl.NumberFormat(numberLocale, { notation: "compact", maximumFractionDigits: 1 }).format(point.requests);
      return `<text x="${xScale(point.requests)}" y="${height - 10}" class="api-cost-chart-tick" text-anchor="middle">${escapeHtml(label)}</text>`;
    }).join("");

    return `
      <h3>${en ? "API vs Local cost by usage" : "사용량별 API vs Local 비용"}</h3>
      <svg viewBox="0 0 ${width} ${height}" role="img" class="api-cost-chart" aria-label="${en ? "Chart comparing API cost (rising with usage) and Local flat cost across usage levels" : "사용량이 늘수록 상승하는 API 비용과 고정된 Local 비용을 비교하는 그래프"}">
        <line x1="${padLeft}" y1="${localY}" x2="${padLeft + plotWidth}" y2="${localY}" class="api-cost-chart-local-line" />
        <polyline points="${apiLinePoints}" class="api-cost-chart-api-line" fill="none" />
        ${breakevenInRange ? `<line x1="${breakevenX}" y1="${padTop}" x2="${breakevenX}" y2="${padTop + plotHeight}" class="api-cost-chart-breakeven-line" />
        <text x="${breakevenX}" y="${padTop - 4}" class="api-cost-chart-breakeven-label" text-anchor="middle">${en ? "Break-even" : "손익분기"} ${escapeHtml(breakevenLabel)}</text>` : ""}
        <circle cx="${currentX}" cy="${currentApiY}" r="4" class="api-cost-chart-current-dot" />
        <text x="${currentX}" y="${currentApiY - 10}" class="api-cost-chart-current-label" text-anchor="middle">${en ? "Now" : "현재"}</text>
        <text x="${padLeft + plotWidth}" y="${localY - 8}" class="api-cost-chart-local-label" text-anchor="end">${en ? "Local (flat)" : "Local (고정)"}</text>
        ${xTicks}
      </svg>
      <p class="api-cost-chart-caption">${en ? "X-axis: monthly requests (0.25x-16x today's usage). Y-axis: monthly cost." : "가로축: 월 요청 수(현재의 0.25배~16배). 세로축: 월 비용."}</p>
    `;
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

  // Renders the "자체 구축(Local) 비용" section for the currently selected
  // tier -- the actual Local content this tab was missing (previously only
  // a text link out to the separate infra sizing flow). cheapestApiMonthlyKrw
  // is the cheapest same-tier API model's monthly KRW cost, used both for the
  // plain cost-comparison sentence and as the payback-months denominator.
  function renderLocalSection(local, cheapestApiMonthlyKrw, language) {
    const en = language === "en";
    if (!local) {
      return `<p class="api-cost-disclaimer">${en ? "Local reference data is unavailable for this tier." : "이 등급의 Local 참고 데이터를 불러올 수 없습니다."}</p>`;
    }
    const priceLabel = local.priceSource.kind === "korean-market"
      ? (en ? `Korean market price (checked ${local.priceSource.updatedAt})` : `국내 시세 (${local.priceSource.updatedAt} 확인)`)
      : (en ? "Reference price estimate" : "참고 가격 추정치");
    const monthlySavingsKrw = cheapestApiMonthlyKrw - local.monthlyLocalKrw;
    const tierLabel = TIER_LABEL[local.tier]?.[en ? "en" : "ko"] || local.tier;
    const verdict = monthlySavingsKrw >= 0
      ? (en
        ? `Local costs about ${formatKrw(Math.abs(monthlySavingsKrw))} less per month than the cheapest ${tierLabel}-tier API model (3-year amortized).`
        : `이 등급 API 최저가 대비 Local이 3년 분할 상환 기준 월 약 ${formatKrw(Math.abs(monthlySavingsKrw))} 더 저렴합니다.`)
      : (en
        ? `Local costs about ${formatKrw(Math.abs(monthlySavingsKrw))} more per month than the cheapest ${tierLabel}-tier API model (3-year amortized).`
        : `이 등급 API 최저가 대비 Local이 3년 분할 상환 기준 월 약 ${formatKrw(Math.abs(monthlySavingsKrw))} 더 비쌉니다.`);
    const paybackDenominator = cheapestApiMonthlyKrw - local.monthlyRunningKrw;
    const paybackMonths = paybackDenominator > 0 ? Math.ceil(local.purchaseKrw / paybackDenominator) : null;
    const paybackText = paybackMonths
      ? (en
        ? `At this usage level, the hardware cost would pay back in about ${paybackMonths.toLocaleString("en-US")} months compared to paying for the API instead.`
        : `이 사용량 기준, 하드웨어 구매비는 API를 계속 쓰는 경우와 비교했을 때 약 ${paybackMonths.toLocaleString("ko-KR")}개월 만에 회수됩니다.`)
      : (en
        ? "At this usage level, self-hosting wouldn't pay back the hardware cost -- the API stays cheaper."
        : "이 사용량에서는 자체 구축이 하드웨어 구매비를 회수하지 못합니다 -- API 쪽이 계속 더 저렴합니다.");
    const sourceLink = local.priceSource.url
      ? ` -- <a href="${escapeAttr(local.priceSource.url)}" target="_blank" rel="noreferrer">${en ? "source" : "출처"}</a>`
      : "";
    return `
      <h3>${en ? "Self-hosted (Local) cost" : "자체 구축(Local) 비용"}</h3>
      <div class="simple-data-coverage">
        <span>${en ? "Reference model" : "기준 모델"} <strong>${escapeHtml(local.model.name)}</strong></span>
        <span>${en ? "Reference GPU" : "기준 GPU"} <strong>${escapeHtml(local.gpu.name)}${local.gpuCount > 1 ? ` x${local.gpuCount}` : ""}</strong></span>
        <span>${en ? "Quant" : "양자화"} <strong>${escapeHtml(local.quant.label)}</strong></span>
        <span>${en ? "Purchase cost" : "구매 비용"} <strong>${escapeHtml(formatKrw(local.purchaseKrw))}</strong></span>
        <span>${en ? "Monthly (3-yr amortized)" : "월 비용(3년 분할)"} <strong>${escapeHtml(formatKrw(local.monthlyLocalKrw))}</strong></span>
      </div>
      <p class="api-cost-local-verdict">${verdict}</p>
      <p class="api-cost-payback">${paybackText}</p>
      <p class="api-cost-disclaimer">${en
        ? `Assumes 24/7 operation, ₩150/kWh electricity, 8%/year maintenance over a 3-year amortization, and a single-stream, memory-bandwidth-based throughput estimate (batch ${LOCAL_BATCH_SIZE}, ${Math.round(LOCAL_UTILIZATION_TARGET * 100)}% utilization). GPU price: ${priceLabel}${sourceLink}.`
        : `24시간 상시 가동, 전기료 150원/kWh, 유지비 연 8%(3년 분할 상각), 대역폭 기반 단일 스트림 처리량 추정(배치 ${LOCAL_BATCH_SIZE}, 가동률 ${Math.round(LOCAL_UTILIZATION_TARGET * 100)}%) 가정입니다. GPU 가격: ${priceLabel}${sourceLink}.`
      }</p>
    `;
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
    panel.querySelector("#apiCostWorkloadLabel").textContent = en ? "Purpose" : "사용 목적";
    panel.querySelector("#apiCostTierLabel").textContent = en ? "Tier" : "등급 변경";
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
      <span><strong>${escapeHtml(tierLabelForSummary)}</strong> ${en ? "tier" : "등급"}</span>
    `;

    // Default view: only the 3 models (one per provider) in the selected
    // quality tier -- the data file tracks exactly one model per
    // provider per tier, so filtering by tier alone already yields the
    // "one per provider" set with no extra dedupe logic needed.
    const compactRows = allRows.filter((row) => row.tier === viewState.tier);

    // Same-tier Local estimate, plus the cheapest same-tier API model's KRW
    // monthly cost as the comparison baseline for the verdict banner, the
    // plain cost-difference sentence, the payback-months figure, and the
    // break-even chart -- computed up front so the "결론" banner (which
    // leads the panel) can use the exact same numbers as everything below it.
    const cheapestApiMonthlyKrw = compactRows.length
      ? compactRows.reduce((min, row) => Math.min(min, row.monthlyCostKrw), Infinity)
      : 0;
    const localEstimate = estimateLocal(viewState.tier, monthlyOutputTokens);

    panel.querySelector("#apiCostVerdict").innerHTML = renderVerdictBanner(monthlyRequests, cheapestApiMonthlyKrw, localEstimate, uiLanguage);
    panel.querySelector("#apiCostTable").innerHTML = renderCandidateCards(compactRows, uiLanguage);

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

    panel.querySelector("#apiCostLocal").innerHTML = renderLocalSection(localEstimate, cheapestApiMonthlyKrw, uiLanguage);
    panel.querySelector("#apiCostBreakeven").innerHTML = renderBreakevenViz(monthlyRequests, cheapestApiMonthlyKrw, localEstimate, uiLanguage);

    const meta = window.LLM_GPU_CHECKER_DATA?.apiPricingMeta;
    const caveat = meta?.basis?.[en ? "en" : "ko"] || "";
    panel.querySelector("#apiCostCaveat").textContent = `${caveat}${caveat ? " " : ""}${en ? `(checked ${meta?.verifiedAt || ""})` : `(확인일 ${meta?.verifiedAt || ""})`}`;
    panel.querySelector("#apiCostBridge").innerHTML = en
      ? `The Local figures above use one reference GPU per tier. For a precise sizing that accounts for concurrent users and target latency, try <button type="button" class="ghost-button" data-core-task="infra">the infra sizing estimate</button>.`
      : `위 Local 수치는 등급별 기준 GPU 1종을 기준으로 한 값입니다. 동시 사용자·응답 목표까지 반영한 정밀 견적은 <button type="button" class="ghost-button" data-core-task="infra">인프라 견적</button>에서 확인하세요.`;
  }

  window.AIHardwareApiCost = { estimate, estimateLocal, ensureApiCostPanel, renderApiCostEstimator, TIER_LABEL, formatUsd, formatKrw };
})();
