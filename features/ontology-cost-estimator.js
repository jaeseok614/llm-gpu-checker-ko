/**
 * "Ontology construction cost" -- a standalone core-task mode, separate
 * from every other mode in this app (including "API vs Local", which
 * answers a monthly-serving-traffic question). This one answers a
 * different, one-time-batch question: "if I feed my own document corpus
 * through an LLM to build a structured ontology/knowledge graph (entities,
 * relations, taxonomy) out of it, roughly what would that cost?" It
 * deliberately reuses data/api-models.js (the same per-token hosted-API
 * pricing catalog the "API vs Local" screen reads) rather than inventing a
 * second pricing catalog, since the underlying unit cost (input/output
 * tokens through a hosted model) is identical -- only the WORKLOAD shape
 * differs (a fixed corpus processed a handful of times, not a recurring
 * monthly request volume), which is why this needs its own tab instead of
 * a mode inside the "API vs Local" panel (see features/api-cost-estimator.js).
 *
 * Cost model: ontology construction is rarely a single LLM call over the
 * raw text. A realistic pipeline re-reads the corpus across a few
 * distinct passes -- e.g. (1) extract entities/relations/concepts per
 * chunk, (2) consolidate/deduplicate those extractions into one merged
 * schema, (3) validate/refine the merged result against the source text
 * again -- and each pass both re-reads roughly the full corpus (input)
 * and produces a smaller structured output. Extracted triples/JSON run far
 * more compact than the source prose, so output is modeled as a fixed
 * fraction of input (OUTPUT_RATIO) rather than a second free-form input --
 * this keeps the form to two real choices (corpus size, pipeline depth)
 * instead of a spreadsheet, at the cost of being a rough planning number
 * rather than a quote. See #ontologyCostCaveat in the rendered panel for
 * the same caveat surfaced to the user.
 */
(() => {
  const TIER_LABEL = {
    flagship: { ko: "플래그십", en: "Flagship" },
    balanced: { ko: "균형형", en: "Balanced" },
    economy: { ko: "저가형", en: "Economy" },
  };
  const TIER_ORDER = ["economy", "balanced", "flagship"];

  // Extracted structured output (entities/relations/triples as JSON) runs
  // far more compact than the source prose it was drawn from -- 30% of
  // input token count is a rough, documented planning assumption, not a
  // measured constant. Kept as one shared constant (not user-configurable)
  // so every pass profile below scales consistently.
  const OUTPUT_RATIO = 0.3;

  const PASS_PROFILES = {
    single: { passes: 1, label: { ko: "추출만 (1패스)", en: "Extraction only (1 pass)" } },
    standard: { passes: 2, label: { ko: "추출 + 스키마 통합 (2패스)", en: "Extraction + schema merge (2 passes)" } },
    thorough: { passes: 3, label: { ko: "추출 + 통합 + 검증 (3패스)", en: "Extraction + merge + validation (3 passes)" } },
  };
  const PASS_PROFILE_ORDER = ["single", "standard", "thorough"];

  // Rough words-per-page -> tokens-per-page planning constant, used only to
  // show a human-readable "~N페이지 분량" hint next to the token input --
  // never fed into the cost formula itself, which always works in tokens.
  const TOKENS_PER_PAGE = 650;

  let viewState = { docTokens: 500000, passProfile: "thorough", tier: "balanced" };

  function apiModels() {
    return window.LLM_GPU_CHECKER_DATA?.apiModels || [];
  }

  function apiExchangeRate() {
    return Math.max(1, Number(window.LLM_GPU_CHECKER_DATA?.priceDataMeta?.exchangeRateKrwPerUsd) || 1400);
  }

  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 10 ? 2 : 0 }).format(value);
  }

  function formatKrw(value) {
    // "₩" rather than "원" for the same reason api-cost-estimator.js uses
    // it -- reads correctly in both languages, never trips the "no Korean
    // text left" i18n audit in English mode.
    return `₩${Math.round(value).toLocaleString("ko-KR")}`;
  }

  // Pure math, no DOM -- reused directly by tests. Given a total document
  // token count and a pass-profile key, returns every API model's cost for
  // processing that corpus through that many passes, cheapest first.
  function estimateOntologyCost({ docTokens, passProfileKey }) {
    const profile = PASS_PROFILES[passProfileKey] || PASS_PROFILES.thorough;
    const tokens = Math.max(0, Number(docTokens) || 0);
    const totalInputTokens = tokens * profile.passes;
    const totalOutputTokens = totalInputTokens * OUTPUT_RATIO;
    const rate = apiExchangeRate();
    return apiModels()
      .map((model) => {
        const costUsd = (totalInputTokens / 1_000_000) * model.inputPerMTokUsd
          + (totalOutputTokens / 1_000_000) * model.outputPerMTokUsd;
        return { ...model, totalInputTokens, totalOutputTokens, costUsd, costKrw: costUsd * rate };
      })
      .sort((a, b) => a.costUsd - b.costUsd);
  }

  function ensureOntologyCostPanel() {
    if (typeof $ !== "function") return null;
    if ($("ontologyCostPanel")) return $("ontologyCostPanel");
    const mount = document.querySelector(".app-shell");
    if (!mount) return null;
    const panel = document.createElement("section");
    // Reuse the "API vs Local" panel's own classes (gpu-advisor-panel,
    // api-cost-panel, api-cost-candidates, api-cost-candidate-card,
    // studio-question-grid, simple-data-coverage, studio-form-note)
    // instead of adding a near-duplicate CSS section -- this panel's
    // visual shape (question grid -> candidate cards -> caveat note) is
    // deliberately the same, and every one of those classes is selector-
    // scoped by class name, not by #apiCostPanel's id, so nothing new
    // needs to be added to styles.css (already close to its size budget)
    // for this to look right.
    panel.className = "gpu-advisor-panel api-cost-panel";
    panel.id = "ontologyCostPanel";
    panel.hidden = true;
    panel.setAttribute("aria-labelledby", "ontologyCostTitle");
    panel.innerHTML = `
      <div class="gpu-insights-head">
        <div>
          <span class="section-kicker" id="ontologyCostKicker"></span>
          <h2 id="ontologyCostTitle"></h2>
          <p id="ontologyCostNote"></p>
        </div>
      </div>
      <div class="studio-question-grid">
        <label class="field"><span id="ontologyCostDocTokensLabel"></span><input id="ontologyCostDocTokens" type="number" min="0" step="10000" value="500000"></label>
        <label class="field"><span id="ontologyCostPassLabel"></span>
          <select id="ontologyCostPassProfile">
            <option value="single"></option>
            <option value="standard"></option>
            <option value="thorough"></option>
          </select>
        </label>
        <label class="field"><span id="ontologyCostTierLabel"></span>
          <select id="ontologyCostTier">
            <option value="economy"></option>
            <option value="balanced"></option>
            <option value="flagship"></option>
          </select>
        </label>
      </div>
      <div class="simple-data-coverage" id="ontologyCostUsageSummary" aria-label="처리 조건"></div>
      <div class="api-cost-candidates" id="ontologyCostTable" role="list" aria-label="제공사별 예상 비용"></div>
      <p class="studio-form-note" id="ontologyCostCaveat"></p>
    `;
    mount.appendChild(panel);
    panel.querySelector("#ontologyCostDocTokens").addEventListener("input", (event) => {
      viewState.docTokens = event.target.value;
      renderOntologyCostEstimator();
    });
    panel.querySelector("#ontologyCostPassProfile").addEventListener("change", (event) => {
      viewState.passProfile = event.target.value;
      renderOntologyCostEstimator();
    });
    panel.querySelector("#ontologyCostTier").addEventListener("change", (event) => {
      viewState.tier = event.target.value;
      renderOntologyCostEstimator();
    });
    return panel;
  }

  // Mirrors apiCostCandidateCard()'s exact DOM shape (features/api-cost-
  // estimator.js) -- same class names, same structure -- so this reuses
  // that panel's CSS with zero new rules. Not selectable (no click
  // handler/aria-selected toggle here, unlike the API panel's cards):
  // this panel has nothing downstream -- verdict banner, breakeven chart
  // -- that a "selected candidate" would drive, so the badge only ever
  // reflects "cheapest," never "cheapest · selected".
  function ontologyCandidateCard(row, language, isCheapest) {
    const en = language === "en";
    const tierLabel = TIER_LABEL[row.tier]?.[en ? "en" : "ko"] || row.tier;
    const note = row.note?.[en ? "en" : "ko"] || "";
    const badgeText = isCheapest ? (en ? "Cheapest" : "최저가") : "";
    const classes = ["api-cost-candidate-card"];
    if (isCheapest) classes.push("is-cheapest");
    return `<div role="listitem" class="${classes.join(" ")}" data-provider="${escapeAttr(row.provider)}">
      <span class="api-cost-candidate-provider">${escapeHtml(row.provider)}</span>
      <strong class="api-cost-candidate-cost">${escapeHtml(formatUsd(row.costUsd))}<small>${escapeHtml(formatKrw(row.costKrw))}</small></strong>
      <span class="api-cost-candidate-name">
        <span class="api-cost-candidate-name-text" title="${escapeAttr(note)}">${escapeHtml(row.name)}</span>
        ${badgeText ? `<span class="placement-primary-badge">${escapeHtml(badgeText)}</span>` : ""}
      </span>
      <span class="api-cost-candidate-rates">${en ? "Tier" : "등급"} ${escapeHtml(tierLabel)} · ${en ? "in" : "입력"} $${row.inputPerMTokUsd.toFixed(2)}/1M · ${en ? "out" : "출력"} $${row.outputPerMTokUsd.toFixed(2)}/1M</span>
    </div>`;
  }

  function renderOntologyCostEstimator() {
    const panel = ensureOntologyCostPanel();
    if (!panel) return;
    const en = uiLanguage === "en";
    panel.querySelector("#ontologyCostKicker").textContent = en ? "ONTOLOGY COST" : "온톨로지 구축 비용";
    panel.querySelector("#ontologyCostTitle").textContent = en ? "Ontology construction cost" : "온톨로지 구축 비용";
    panel.querySelector("#ontologyCostNote").textContent = en
      ? "Estimate what it costs to turn your own documents into a structured ontology/knowledge graph via a hosted LLM -- a one-time batch job, not a monthly running cost."
      : "내 문서를 LLM으로 구조화된 온톨로지·지식그래프로 만들 때 드는 비용을 추정합니다. 매달 반복되는 비용이 아니라 1회성 배치 작업 기준입니다.";
    panel.querySelector("#ontologyCostDocTokensLabel").textContent = en ? "Document corpus size (tokens)" : "처리할 문서 총 분량 (토큰 수)";
    panel.querySelector("#ontologyCostPassLabel").textContent = en ? "Pipeline depth" : "처리 단계";
    panel.querySelector("#ontologyCostTierLabel").textContent = en ? "Model tier" : "모델 등급";

    const docTokensInput = panel.querySelector("#ontologyCostDocTokens");
    if (document.activeElement !== docTokensInput) docTokensInput.value = String(viewState.docTokens);

    const passSelect = panel.querySelector("#ontologyCostPassProfile");
    [...passSelect.options].forEach((option) => {
      option.textContent = PASS_PROFILES[option.value]?.label[en ? "en" : "ko"] || option.value;
    });
    passSelect.value = viewState.passProfile;

    const tierSelect = panel.querySelector("#ontologyCostTier");
    [...tierSelect.options].forEach((option) => {
      option.textContent = TIER_LABEL[option.value]?.[en ? "en" : "ko"] || option.value;
    });
    tierSelect.value = viewState.tier;

    const docTokens = Math.max(0, Number(viewState.docTokens) || 0);
    const rows = estimateOntologyCost({ docTokens, passProfileKey: viewState.passProfile }).filter((row) => row.tier === viewState.tier);
    const cheapestUsd = rows.length ? Math.min(...rows.map((row) => row.costUsd)) : 0;

    const approxPages = Math.round(docTokens / TOKENS_PER_PAGE).toLocaleString(en ? "en-US" : "ko-KR");
    const totalInputTokens = rows[0]?.totalInputTokens ?? 0;
    const totalOutputTokens = rows[0]?.totalOutputTokens ?? 0;
    panel.querySelector("#ontologyCostUsageSummary").textContent = en
      ? `~${approxPages} pages · total input ${Math.round(totalInputTokens).toLocaleString("en-US")} tokens · total output ${Math.round(totalOutputTokens).toLocaleString("en-US")} tokens`
      : `약 ${approxPages}페이지 분량 · 총 입력 ${Math.round(totalInputTokens).toLocaleString("ko-KR")} 토큰 · 총 출력 ${Math.round(totalOutputTokens).toLocaleString("ko-KR")} 토큰`;

    panel.querySelector("#ontologyCostTable").innerHTML = rows
      .map((row) => ontologyCandidateCard(row, uiLanguage, row.costUsd === cheapestUsd))
      .join("");

    panel.querySelector("#ontologyCostCaveat").textContent = en
      ? "Planning estimate only: pass count and the 30% output-token ratio are documented assumptions, not measurements -- actual chunking strategy, retries, and validation depth change real cost. No prompt caching or batch discounts are modeled."
      : "참고용 추정치입니다. 패스 횟수와 출력 토큰 비율(입력 대비 30%)은 실측이 아닌 가정값이며, 실제 청킹 전략·재시도·검증 깊이에 따라 비용이 달라질 수 있습니다. 프롬프트 캐싱·배치 할인은 반영하지 않았습니다.";
  }

  window.AIHardwareOntologyCost = {
    estimateOntologyCost,
    PASS_PROFILES,
    PASS_PROFILE_ORDER,
    TIER_LABEL,
    TIER_ORDER,
    ensureOntologyCostPanel,
    renderOntologyCostEstimator,
    formatUsd,
    formatKrw,
  };
})();
