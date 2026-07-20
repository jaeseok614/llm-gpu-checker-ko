const DATA = window.LLM_GPU_CHECKER_DATA || {};
const GPU_PRESETS = DATA.gpus || [];
const QUANTS = DATA.quantizations || [];
const MODELS = DATA.models || [];

const GRADE_META = {
  S: { label: "쾌적", className: "grade-s", score: 5, color: "#13795b" },
  A: { label: "잘 돌아감", className: "grade-a", score: 4, color: "#225ea8" },
  B: { label: "가능", className: "grade-b", score: 3, color: "#5f4bb6" },
  C: { label: "빡빡함", className: "grade-c", score: 2, color: "#9a6700" },
  D: { label: "오프로딩", className: "grade-d", score: 1, color: "#9a6700" },
  F: { label: "부적합", className: "grade-f", score: 0, color: "#ba2f2f" },
};

const SUMMARY_FILTERS = [
  { id: "all", label: "전체", grades: ["S", "A", "B", "C", "D", "F"] },
  { id: "S", label: "쾌적", grades: ["S"] },
  { id: "A", label: "잘 돌아감", grades: ["A"] },
  { id: "B", label: "가능", grades: ["B"] },
  {
    id: "conditional",
    label: "조건부",
    grades: ["C", "D"],
    title: "빡빡함: VRAM 여유가 적어 컨텍스트나 동시 요청 제한이 필요합니다. 오프로딩: 일부 연산을 시스템 RAM 또는 CPU에서 처리합니다.",
  },
  { id: "F", label: "부적합", grades: ["F"] },
];

const KV_PRECISION_META = {
  fp16: { label: "FP16", factor: 1 },
  fp8: { label: "FP8", factor: 0.55 },
  q8: { label: "Q8", factor: 0.6 },
  q4: { label: "Q4", factor: 0.35 },
};

const RUNTIME_LABELS = {
  llamacpp: "llama.cpp / Ollama",
  vllm: "vLLM",
  transformers: "Transformers",
};

let detectedHardwareLabel = "";
let activeSummaryFilter = "all";
let selectedModelKey = "";
let viewMode = "list";

const $ = (id) => document.getElementById(id);

function init() {
  populateSelects();
  applyUrlState();
  bindEvents();
  render({ syncUrl: false });
}

function populateSelects() {
  $("gpuPreset").innerHTML = GPU_PRESETS.map(
    (gpu) => `<option value="${escapeAttr(gpu.id)}">${escapeHtml(gpu.name)}</option>`,
  ).join("");
  $("gpuPreset").value = "rtx4090-24";

  $("quantization").innerHTML = QUANTS.map(
    (quant) => `<option value="${escapeAttr(quant.id)}">${escapeHtml(quant.label)}</option>`,
  ).join("");
  $("quantization").value = "auto";

  const providers = [...new Set(MODELS.map((model) => model.maker))].sort((a, b) => a.localeCompare(b));
  $("providerFilter").innerHTML = [
    `<option value="all">전체 공급사</option>`,
    ...providers.map((provider) => `<option value="${escapeAttr(provider)}">${escapeHtml(provider)}</option>`),
  ].join("");

  const licenses = [...new Set(MODELS.map((model) => model.license))].sort((a, b) => a.localeCompare(b));
  $("licenseFilter").innerHTML = [
    `<option value="all">전체 라이선스</option>`,
    ...licenses.map((license) => `<option value="${escapeAttr(license)}">${escapeHtml(license)}</option>`),
  ].join("");

  applyPreset("rtx4090-24");
}

function bindEvents() {
  ["vramGb", "gpuCount", "ramGb", "bandwidth"].forEach((id) => {
    $(id).addEventListener("input", () => {
      detectedHardwareLabel = "직접 입력 기준";
      render();
    });
  });

  ["contextSize", "concurrency", "outputTokens", "kvPrecision", "quantization", "runtimeMode", "taskFilter", "providerFilter", "licenseFilter", "gradeFilter", "sortBy"].forEach((id) => {
    $(id).addEventListener("change", render);
  });

  $("searchInput").addEventListener("input", render);

  $("gpuPreset").addEventListener("change", (event) => {
    applyPreset(event.target.value);
    render();
  });

  $("detectGpuButton").addEventListener("click", detectGpu);
  $("toggleHardwareEditor").addEventListener("click", () => togglePanel("hardwareEditor", "toggleHardwareEditor"));
  $("toggleAdvancedSettings").addEventListener("click", () => togglePanel("advancedEditor", "toggleAdvancedSettings"));

  $("summaryGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-summary-filter]");
    if (!button) return;
    activeSummaryFilter = button.dataset.summaryFilter;
    render();
  });

  $("listViewButton").addEventListener("click", () => setViewMode("list"));
  $("cardViewButton").addEventListener("click", () => setViewMode("card"));

  $("modelResults").addEventListener("click", (event) => {
    const target = event.target.closest("[data-model-key]");
    if (!target) return;
    selectedModelKey = target.dataset.modelKey;
    render();
  });

  $("drawerBackdrop").addEventListener("click", closeModelDetail);
  $("modelDetail").addEventListener("click", (event) => {
    if (event.target.closest("[data-close-detail]")) closeModelDetail();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selectedModelKey) closeModelDetail();
  });

  window.addEventListener("popstate", () => {
    applyUrlState();
    render({ syncUrl: false });
  });
}

function togglePanel(panelId, buttonId) {
  const panel = $(panelId);
  const button = $(buttonId);
  panel.hidden = !panel.hidden;
  button.setAttribute("aria-expanded", String(!panel.hidden));
}

function setViewMode(nextMode) {
  viewMode = nextMode === "card" ? "card" : "list";
  render();
}

function applyPreset(id) {
  const preset = GPU_PRESETS.find((gpu) => gpu.id === id) || GPU_PRESETS[0];
  if (!preset) return;

  $("vramGb").value = preset.vram;
  $("ramGb").value = preset.ram;
  $("bandwidth").value = preset.bandwidth;
  $("gpuCount").value = 1;
  detectedHardwareLabel = `${preset.name} 기준`;
}

function getHardware() {
  const vram = clampNumber($("vramGb").value, 2, 640, 24);
  const count = clampNumber($("gpuCount").value, 1, 16, 1);
  const ram = clampNumber($("ramGb").value, 8, 2048, 64);
  const bandwidth = clampNumber($("bandwidth").value, 100, 12000, 1008);
  const context = clampNumber($("contextSize").value, 4096, 1048576, 8192);
  const concurrency = clampNumber($("concurrency").value, 1, 64, 1);
  const outputTokens = clampNumber($("outputTokens").value, 128, 8192, 512);
  const kvPrecision = $("kvPrecision").value;
  const kvMeta = KV_PRECISION_META[kvPrecision] || KV_PRECISION_META.fp16;
  const runtime = $("runtimeMode").value;
  const preset = GPU_PRESETS.find((gpu) => gpu.id === $("gpuPreset").value) || GPU_PRESETS[0];

  return { vram, count, ram, bandwidth, context, concurrency, outputTokens, kvPrecision, kvMeta, runtime, preset };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function estimateModel(model, quantId, hardware) {
  const fallbackQuant = QUANTS.find((item) => item.id === "q4") || QUANTS.find((item) => item.id !== "auto");
  const quant = quantId === "auto"
    ? recommendQuant(model, hardware)
    : QUANTS.find((item) => item.id === quantId) || fallbackQuant;
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const weightsGb = model.params * quant.bytesPerB * 1.08;
  const contextLimitTokens = model.context * 1024;
  const contextSupported = hardware.context <= contextLimitTokens;
  const kvGb = estimateKvCacheGb(model, hardware);
  const runtimeOverheadGb = runtimeFactor.base
    + Math.min(runtimeFactor.cap, weightsGb * runtimeFactor.weightRatio)
    + Math.max(0, hardware.concurrency - 1) * runtimeFactor.requestOverhead;
  const requiredGb = weightsGb + kvGb + runtimeOverheadGb;
  const effectiveVram = hardware.vram * hardware.count * (hardware.count > 1 ? 0.92 : 1);
  const pressure = requiredGb / effectiveVram;
  const ramAssist = hardware.ram * 0.45;
  const offloadRoom = effectiveVram + ramAssist;
  const grade = contextSupported ? gradeFromPressure(pressure, requiredGb, offloadRoom) : "F";
  const speedStats = estimateSpeed(model, quant, hardware, grade);
  const latencySeconds = speedStats.perRequest > 0 ? hardware.outputTokens / speedStats.perRequest : 0;
  const firstTokenSeconds = estimateFirstTokenSeconds(model, hardware, grade);
  const reason = buildReason(grade, requiredGb, effectiveVram, model, hardware, contextLimitTokens, contextSupported);

  return {
    model,
    quant,
    weightsGb,
    kvGb,
    runtimeOverheadGb,
    requiredGb,
    effectiveVram,
    pressure,
    grade,
    speed: speedStats.perRequest,
    throughput: speedStats.total,
    latencySeconds,
    firstTokenSeconds,
    contextLimitTokens,
    contextSupported,
    reason,
  };
}

function getRuntimeFactor(runtime) {
  if (runtime === "vllm") return { base: 2.6, cap: 5.5, weightRatio: 0.1, requestOverhead: 0.12, concurrencyEfficiency: 0.78 };
  if (runtime === "transformers") return { base: 2.2, cap: 4.5, weightRatio: 0.09, requestOverhead: 0.18, concurrencyEfficiency: 0.38 };
  return { base: 1.2, cap: 3.0, weightRatio: 0.06, requestOverhead: 0.08, concurrencyEfficiency: 0.55 };
}

function estimateKvCacheGb(model, hardware) {
  const contextMultiplier = hardware.context / 4096;
  const concurrencyMultiplier = hardware.concurrency;
  return model.active * 0.09 * contextMultiplier * concurrencyMultiplier * hardware.kvMeta.factor;
}

function recommendQuant(model, hardware) {
  const preferredIds = ["q6", "q5", "q4", "q3", "q2"];
  const qualityFirst = preferredIds
    .map((id) => QUANTS.find((item) => item.id === id))
    .filter(Boolean);
  const effectiveVram = hardware.vram * hardware.count * (hardware.count > 1 ? 0.92 : 1);

  for (const quant of qualityFirst) {
    const provisional = estimateWithQuant(model, quant, hardware);
    if (provisional.requiredGb <= effectiveVram * 0.85) return quant;
  }

  for (const quant of qualityFirst) {
    const provisional = estimateWithQuant(model, quant, hardware);
    if (provisional.requiredGb <= effectiveVram) return quant;
  }

  for (const quant of qualityFirst) {
    const provisional = estimateWithQuant(model, quant, hardware);
    if (provisional.requiredGb <= effectiveVram + hardware.ram * 0.45) return quant;
  }

  return QUANTS.find((item) => item.id === "q2") || qualityFirst[qualityFirst.length - 1];
}

function estimateWithQuant(model, quant, hardware) {
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const weightsGb = model.params * quant.bytesPerB * 1.08;
  const kvGb = estimateKvCacheGb(model, hardware);
  const runtimeOverheadGb = runtimeFactor.base
    + Math.min(runtimeFactor.cap, weightsGb * runtimeFactor.weightRatio)
    + Math.max(0, hardware.concurrency - 1) * runtimeFactor.requestOverhead;
  return { requiredGb: weightsGb + kvGb + runtimeOverheadGb };
}

function gradeFromPressure(pressure, requiredGb, offloadRoom) {
  if (pressure <= 0.7) return "S";
  if (pressure <= 0.85) return "A";
  if (pressure <= 1) return "B";
  if (pressure <= 1.12) return "C";
  if (requiredGb <= offloadRoom) return "D";
  return "F";
}

function estimateSpeed(model, quant, hardware, grade) {
  if (grade === "F") return { perRequest: 0, total: 0 };

  const multiGpuPenalty = hardware.count > 1 ? 0.76 : 1;
  const runtimePenalty = hardware.runtime === "vllm" ? 1.1 : hardware.runtime === "transformers" ? 0.78 : 1;
  const offloadPenalty = grade === "D" ? 0.22 : grade === "C" ? 0.55 : 1;
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const activeBytes = Math.max(model.active * quant.bytesPerB, 1);
  const raw = (hardware.bandwidth * hardware.count * multiGpuPenalty * runtimePenalty) / (activeBytes * 4);
  const total = raw * (1 + (hardware.concurrency - 1) * runtimeFactor.concurrencyEfficiency) * offloadPenalty;

  return {
    perRequest: total / hardware.concurrency,
    total,
  };
}

function estimateFirstTokenSeconds(model, hardware, grade) {
  if (grade === "F") return 0;

  const runtimeMultiplier = hardware.runtime === "vllm" ? 0.85 : hardware.runtime === "transformers" ? 1.2 : 1;
  const pressureMultiplier = grade === "D" ? 2.4 : grade === "C" ? 1.6 : 1;
  const contextSeconds = (hardware.context / 8192) * 0.08;
  const modelSeconds = Math.min(5, model.active * 0.025);
  const concurrencySeconds = Math.max(0, hardware.concurrency - 1) * 0.025;
  return (0.18 + modelSeconds + contextSeconds + concurrencySeconds) * runtimeMultiplier * pressureMultiplier;
}

function buildReason(grade, requiredGb, effectiveVram, model, hardware, contextLimitTokens, contextSupported) {
  if (!contextSupported) {
    return `선택한 ${formatContext(hardware.context)} 컨텍스트가 모델 한도 ${formatContext(contextLimitTokens)}를 초과합니다.`;
  }
  if (grade === "F") {
    return `동시 ${hardware.concurrency}명 기준 필요 VRAM 추정치가 ${formatGb(requiredGb)}로 총 VRAM ${formatGb(effectiveVram)}를 크게 초과합니다.`;
  }
  if (grade === "D") {
    return `동시 ${hardware.concurrency}명 기준 GPU 단독 적재는 어렵고 RAM 오프로딩 전제가 필요합니다.`;
  }
  if (grade === "C") {
    return `총 VRAM에 거의 맞습니다. 동시 요청, 컨텍스트 길이, KV cache 정밀도를 낮추는 편이 안정적입니다.`;
  }
  if (model.params >= 60 && hardware.count === 1) {
    return `대형 모델이지만 ${formatGb(effectiveVram)} VRAM에서 선택 양자화 기준 실행 가능 범위입니다.`;
  }
  return `선택한 GPU에서 ${model.params}B급 모델을 ${formatContext(hardware.context)}, 동시 ${hardware.concurrency}명 기준으로 실행 가능한 범위입니다.`;
}

function getFilteredEstimates() {
  const hardware = getHardware();
  const selectedQuant = $("quantization").value;
  const task = $("taskFilter").value;
  const provider = $("providerFilter").value;
  const license = $("licenseFilter").value;
  const gradeChoice = $("gradeFilter").value;
  const search = $("searchInput").value.trim().toLowerCase();
  const summaryFilter = SUMMARY_FILTERS.find((item) => item.id === activeSummaryFilter) || SUMMARY_FILTERS[0];

  let estimates = MODELS.map((model) => estimateModel(model, selectedQuant, hardware));

  if (summaryFilter.id !== "all") {
    estimates = estimates.filter((estimate) => summaryFilter.grades.includes(estimate.grade));
  }

  if (task !== "all") {
    estimates = estimates.filter((estimate) => estimate.model.tags.includes(task));
  }

  if (provider !== "all") {
    estimates = estimates.filter((estimate) => estimate.model.maker === provider);
  }

  if (license !== "all") {
    estimates = estimates.filter((estimate) => estimate.model.license === license);
  }

  if (search) {
    estimates = estimates.filter((estimate) => {
      const haystack = [
        estimate.model.name,
        estimate.model.maker,
        estimate.model.license,
        estimate.model.summary,
        formatParams(estimate.model.params),
        estimate.model.tags.map(tagLabel).join(" "),
        estimate.model.tags.join(" "),
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }

  if (gradeChoice === "fit") {
    estimates = estimates.filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score);
  } else if (GRADE_META[gradeChoice]) {
    estimates = estimates.filter((estimate) => estimate.grade === gradeChoice);
  }

  return sortEstimates(estimates);
}

function sortEstimates(estimates) {
  const sortBy = $("sortBy").value;
  return [...estimates].sort((a, b) => {
    if (sortBy === "speed") return b.speed - a.speed || gradeSort(a, b) || a.requiredGb - b.requiredGb;
    if (sortBy === "quality") return gradeSort(a, b) || b.model.params - a.model.params || b.speed - a.speed;
    if (sortBy === "vramAsc") return a.requiredGb - b.requiredGb || gradeSort(a, b);
    if (sortBy === "sizeDesc") return b.model.params - a.model.params || gradeSort(a, b);
    if (sortBy === "latest") return modelFreshnessScore(b.model) - modelFreshnessScore(a.model) || gradeSort(a, b);

    return recommendationScore(b) - recommendationScore(a) || gradeSort(a, b) || a.pressure - b.pressure;
  });
}

function gradeSort(a, b) {
  return GRADE_META[b.grade].score - GRADE_META[a.grade].score;
}

function modelFreshnessScore(model) {
  const text = model.name.toLowerCase();
  let score = 0;
  if (text.includes("gpt-oss")) score += 720;
  if (text.includes("qwen3")) score += 700;
  if (text.includes("deepseek v3.2")) score += 690;
  if (text.includes("llama 4")) score += 680;
  if (text.includes("gemma 3")) score += 660;
  if (text.includes("phi-4")) score += 650;
  if (text.includes("mistral small 3.1")) score += 640;
  if (text.includes("devstral")) score += 630;
  if (text.includes("qwen2.5")) score += 600;
  if (text.includes("llama 3.3")) score += 590;
  if (text.includes("llama 3.2")) score += 570;
  if (text.includes("llama 3.1")) score += 560;
  if (text.includes("gemma 2")) score += 540;
  return score + Math.min(model.params, 1000) / 1000;
}

function recommendationScore(estimate) {
  const gradeBonus = {
    S: 34,
    A: 32,
    B: 28,
    C: 14,
    D: 8,
    F: 0,
  }[estimate.grade];
  const usefulSize = Math.min(estimate.model.params, 34) * 1.7;
  const tagBonus = [
    estimate.model.tags.includes("korean") ? 5 : 0,
    estimate.model.tags.includes("coding") ? 4 : 0,
    estimate.model.tags.includes("reasoning") ? 4 : 0,
    estimate.model.tags.includes("long") ? 2 : 0,
  ].reduce((sum, value) => sum + value, 0);
  const speedBonus = Math.min(estimate.speed, 90) / 6;
  const pressurePenalty = estimate.pressure > 0.95 ? (estimate.pressure - 0.95) * 22 : 0;

  return gradeBonus + usefulSize + tagBonus + speedBonus - pressurePenalty;
}

function render(options = {}) {
  const { syncUrl = true } = options;
  const hardware = getHardware();
  const allEstimates = MODELS.map((model) => estimateModel(model, $("quantization").value, hardware));
  const estimates = getFilteredEstimates();

  renderHardware(hardware, allEstimates);
  renderSummary(allEstimates);
  renderResults(estimates);
  renderDetail();
  renderViewToggle();

  if (syncUrl) syncUrlState();
}

function renderHardware(hardware, allEstimates) {
  const totalVram = hardware.vram * hardware.count;
  const runnableCount = allEstimates.filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score).length;
  const quant = QUANTS.find((item) => item.id === $("quantization").value);
  const quantLabel = quant ? quant.label : "자동 추천";
  const basis = `${formatContext(hardware.context)} · 동시 ${hardware.concurrency}명 · ${RUNTIME_LABELS[hardware.runtime] || hardware.runtime} · ${quantLabel}`;
  const headerSummary = `${formatGb(totalVram)} · RAM ${formatGb(hardware.ram)} · ${formatContext(hardware.context)} · 실행 가능 ${runnableCount}개`;
  const headlineParts = [hardware.preset.name, `RAM ${formatGb(hardware.ram)}`, `GPU ${hardware.count}개`];

  $("hardwareHeadline").innerHTML = headlineParts
    .map((part, index) => `
      <span class="hardware-piece">
        ${index > 0 ? `<span class="dot-separator" aria-hidden="true">·</span>` : ""}
        ${escapeHtml(part)}
      </span>
    `)
    .join("");
  $("hardwareSubline").textContent = `현재 기준: ${basis}`;
  $("hardwareStatus").textContent = detectedHardwareLabel ? `${detectedHardwareLabel} · ${headerSummary}` : headerSummary;
}

function renderSummary(estimates) {
  const counts = { all: estimates.length, S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  estimates.forEach((estimate) => {
    counts[estimate.grade] += 1;
  });

  $("summaryGrid").innerHTML = SUMMARY_FILTERS.map((filter) => {
    const count = filter.id === "all"
      ? counts.all
      : filter.grades.reduce((sum, grade) => sum + counts[grade], 0);
    const isActive = filter.id === activeSummaryFilter;
    return `
      <button
        type="button"
        class="summary-chip ${isActive ? "is-active" : ""}"
        data-summary-filter="${escapeAttr(filter.id)}"
        title="${escapeAttr(filter.title || "")}"
        aria-pressed="${isActive}"
      >
        <span>${escapeHtml(filter.label)}</span>
        <strong>${count}</strong>
      </button>
    `;
  }).join("");
}

function renderResults(estimates) {
  const recommendationRanks = getRecommendationRanks();
  $("resultMeta").textContent = `모델 ${estimates.length}개 · ${viewMode === "list" ? "목록 보기" : "카드 보기"}`;

  if (!estimates.length) {
    $("modelResults").className = "model-results";
    $("modelResults").innerHTML = `<div class="empty-state">조건에 맞는 모델이 없습니다.</div>`;
    return;
  }

  if (viewMode === "card") {
    $("modelResults").className = "model-results card-mode";
    $("modelResults").innerHTML = estimates
      .map((estimate) => renderModelCard(estimate, recommendationRanks.get(modelKey(estimate.model))))
      .join("");
    return;
  }

  $("modelResults").className = "model-results list-mode";
  $("modelResults").innerHTML = `
    <div class="model-list-head" aria-hidden="true">
      <span>모델</span>
      <span>등급</span>
      <span>권장 양자화</span>
      <span>필요 VRAM</span>
      <span>예상 속도</span>
      <span>컨텍스트</span>
      <span></span>
    </div>
    ${estimates.map((estimate) => renderModelRow(estimate, recommendationRanks.get(modelKey(estimate.model)))).join("")}
  `;
}

function renderModelRow(estimate, recommendationRank) {
  const meta = GRADE_META[estimate.grade];
  const tags = renderTags(estimate.model, 3);
  const key = modelKey(estimate.model);

  return `
    <button type="button" class="model-row" data-model-key="${escapeAttr(key)}">
      <span class="model-cell model-name-cell">
        <strong>
          ${recommendationRank ? `<span class="recommend-badge">추천 ${recommendationRank}</span>` : ""}
          ${escapeHtml(estimate.model.name)}
        </strong>
        <span class="model-meta">${escapeHtml(estimate.model.maker)} · ${escapeHtml(estimate.model.license)}</span>
        <span class="tag-row compact-tags">${tags}</span>
      </span>
      <span class="model-cell"><span class="grade-pill ${meta.className}">${meta.label}</span></span>
      <span class="model-cell">${escapeHtml(estimate.quant.label)}</span>
      <span class="model-cell">${formatGb(estimate.requiredGb)}</span>
      <span class="model-cell">${formatSpeed(estimate.speed)}</span>
      <span class="model-cell">${formatContext(estimate.contextLimitTokens)}</span>
      <span class="row-chevron" aria-hidden="true">›</span>
    </button>
  `;
}

function renderModelCard(estimate, recommendationRank) {
  const meta = GRADE_META[estimate.grade];
  const key = modelKey(estimate.model);
  const tags = renderTags(estimate.model, 4);

  return `
    <button type="button" class="compact-card" data-model-key="${escapeAttr(key)}">
      <span class="compact-card-head">
        <span>
          <strong>
            ${recommendationRank ? `<span class="recommend-badge">추천 ${recommendationRank}</span>` : ""}
            ${escapeHtml(estimate.model.name)}
          </strong>
          <span>${escapeHtml(estimate.model.maker)} · ${escapeHtml(estimate.model.license)}</span>
        </span>
        <span class="grade-pill ${meta.className}">${meta.label}</span>
      </span>
      <span class="compact-specs">
        <span>${escapeHtml(estimate.quant.label)}</span>
        <span>VRAM ${formatGb(estimate.requiredGb)}</span>
        <span>${formatSpeed(estimate.speed)}</span>
        <span>${formatContext(estimate.contextLimitTokens)}</span>
      </span>
      <span class="tag-row">${tags}</span>
      <span class="compact-summary">${escapeHtml(estimate.model.summary)}</span>
    </button>
  `;
}

function getRecommendationRanks() {
  const hardware = getHardware();
  const selectedQuant = $("quantization").value;
  const ranked = MODELS
    .map((model) => estimateModel(model, selectedQuant, hardware))
    .filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score)
    .sort((a, b) => recommendationScore(b) - recommendationScore(a) || gradeSort(a, b) || a.pressure - b.pressure)
    .slice(0, 3);

  return new Map(ranked.map((estimate, index) => [modelKey(estimate.model), index + 1]));
}

function renderDetail() {
  const detail = $("modelDetail");
  const backdrop = $("drawerBackdrop");

  if (!selectedModelKey) {
    detail.hidden = true;
    backdrop.hidden = true;
    detail.innerHTML = "";
    return;
  }

  const model = getModelByKey(selectedModelKey);
  if (!model) {
    selectedModelKey = "";
    detail.hidden = true;
    backdrop.hidden = true;
    detail.innerHTML = "";
    return;
  }

  const hardware = getHardware();
  const estimate = estimateModel(model, $("quantization").value, hardware);
  const meta = GRADE_META[estimate.grade];
  const safetyGb = estimateSafetyGb(estimate);
  const totalWithSafety = estimate.requiredGb + safetyGb;

  detail.hidden = false;
  backdrop.hidden = false;
  detail.innerHTML = `
    <div class="detail-head">
      <button type="button" class="back-button" data-close-detail>← 모델 목록</button>
      <button type="button" class="icon-button" data-close-detail aria-label="상세 닫기">×</button>
    </div>

    <div class="detail-title">
      <span class="grade-pill ${meta.className}">${meta.label}</span>
      <h2>${escapeHtml(model.name)}</h2>
      <p>${escapeHtml(model.maker)} · ${escapeHtml(model.license)} · ${model.tags.map(tagLabel).map(escapeHtml).join(" · ")}</p>
    </div>

    <div class="detail-summary-grid">
      ${renderDetailMetric("권장 설정", `${estimate.quant.label} · ${formatContext(hardware.context)} · 동시 ${hardware.concurrency}명`)}
      ${renderDetailMetric("예상 VRAM", `${formatGb(estimate.requiredGb)} / ${formatGb(estimate.effectiveVram)}`)}
      ${renderDetailMetric("예상 속도", formatSpeed(estimate.speed))}
      ${renderDetailMetric("첫 응답", formatDuration(estimate.firstTokenSeconds))}
    </div>

    <section class="detail-section">
      <h3>양자화별 비교</h3>
      <div class="detail-table quant-table">
        <div class="detail-row detail-table-head">
          <span>양자화</span>
          <span>예상 VRAM</span>
          <span>예상 속도</span>
          <span>품질</span>
          <span>실행 상태</span>
        </div>
        ${renderQuantRows(model, hardware, estimate.quant.id)}
      </div>
    </section>

    <section class="detail-section">
      <h3>VRAM 상세 분석</h3>
      <div class="memory-breakdown">
        ${renderMemoryLine("모델 가중치", estimate.weightsGb, totalWithSafety)}
        ${renderMemoryLine("KV cache", estimate.kvGb, totalWithSafety)}
        ${renderMemoryLine("런타임 오버헤드", estimate.runtimeOverheadGb, totalWithSafety)}
        ${renderMemoryLine("권장 여유분", safetyGb, totalWithSafety)}
      </div>
      <div class="memory-total">
        <span>총 예상 확보 VRAM</span>
        <strong>${formatGb(totalWithSafety)}</strong>
      </div>
      <p class="detail-note">${escapeHtml(estimate.reason)}</p>
    </section>

    <section class="detail-section">
      <h3>실행 방식별 비교</h3>
      <div class="runtime-grid">
        ${renderRuntimeRows(model, hardware)}
      </div>
    </section>

    <section class="detail-section">
      <h3>실행 명령어</h3>
      <pre class="command-block"><code>${escapeHtml(buildOllamaCommand(model, estimate.quant, hardware))}
${escapeHtml(buildLlamaCppCommand(model, estimate.quant, hardware))}</code></pre>
    </section>

    <section class="detail-section">
      <h3>모델 정보</h3>
      <div class="model-info-grid">
        ${renderInfoItem("파라미터", formatParams(model.params))}
        ${renderInfoItem("활성 파라미터", formatParams(model.active))}
        ${renderInfoItem("최대 컨텍스트", formatContext(estimate.contextLimitTokens))}
        ${renderInfoItem("라이선스", model.license)}
      </div>
      <div class="external-links">
        ${renderExternalLink("Hugging Face", `https://huggingface.co/models?search=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink("Ollama", `https://ollama.com/search?q=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink("공식 문서 검색", `https://www.google.com/search?q=${encodeURIComponent(`${model.name} official`)}`)}
      </div>
    </section>
  `;
}

function renderDetailMetric(label, value) {
  return `
    <div class="detail-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderQuantRows(model, hardware, recommendedQuantId) {
  return QUANTS
    .filter((quant) => quant.id !== "auto")
    .map((quant) => {
      const estimate = estimateModel(model, quant.id, hardware);
      const meta = GRADE_META[estimate.grade];
      return `
        <div class="detail-row">
          <span>${escapeHtml(quant.label)}</span>
          <span>${formatGb(estimate.requiredGb)}</span>
          <span>${formatSpeed(estimate.speed)}</span>
          <span>${quantQualityLabel(quant, recommendedQuantId)}</span>
          <span><span class="grade-pill ${meta.className}">${meta.label}</span></span>
        </div>
      `;
    })
    .join("");
}

function quantQualityLabel(quant, recommendedQuantId) {
  if (quant.id === recommendedQuantId) return "권장";
  if (quant.id === "fp16") return "원본";
  if (quant.rank >= 6) return "우수";
  if (quant.rank >= 5) return "매우 높음";
  if (quant.rank >= 4) return "높음";
  if (quant.rank >= 3) return "보통";
  return "낮음";
}

function renderMemoryLine(label, value, total) {
  const width = Math.max(3, Math.min(100, (value / total) * 100));
  return `
    <div class="memory-line">
      <div class="memory-label">
        <span>${escapeHtml(label)}</span>
        <strong>${formatGb(value)}</strong>
      </div>
      <div class="memory-bar"><span style="--bar-width: ${width}%"></span></div>
    </div>
  `;
}

function renderRuntimeRows(model, hardware) {
  const selectedQuant = $("quantization").value;
  const scenarios = [
    { label: "llama.cpp / Ollama", hardware: { ...hardware, runtime: "llamacpp" } },
    { label: "vLLM 단일 요청", hardware: { ...hardware, runtime: "vllm", concurrency: 1 } },
    { label: `vLLM 동시 요청 ${hardware.concurrency}명`, hardware: { ...hardware, runtime: "vllm" } },
    { label: "Transformers", hardware: { ...hardware, runtime: "transformers" } },
  ];

  return scenarios.map((scenario) => {
    const estimate = estimateModel(model, selectedQuant, scenario.hardware);
    const meta = GRADE_META[estimate.grade];
    return `
      <div class="runtime-card">
        <span>${escapeHtml(scenario.label)}</span>
        <strong>${formatSpeed(estimate.speed)}</strong>
        <small>${formatGb(estimate.requiredGb)} · ${meta.label}</small>
      </div>
    `;
  }).join("");
}

function renderInfoItem(label, value) {
  return `
    <div class="info-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderExternalLink(label, href) {
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function estimateSafetyGb(estimate) {
  return Math.min(4, Math.max(0.8, estimate.effectiveVram * 0.08));
}

function closeModelDetail() {
  selectedModelKey = "";
  render();
}

function renderViewToggle() {
  const isList = viewMode === "list";
  $("listViewButton").classList.toggle("is-active", isList);
  $("cardViewButton").classList.toggle("is-active", !isList);
  $("listViewButton").setAttribute("aria-pressed", String(isList));
  $("cardViewButton").setAttribute("aria-pressed", String(!isList));
}

function renderTags(model, limit) {
  return model.tags
    .slice(0, limit)
    .map((tag) => `<span class="tag">${escapeHtml(tagLabel(tag))}</span>`)
    .join("");
}

function tagLabel(tag) {
  const labels = {
    general: "대화",
    korean: "한국어",
    coding: "코딩",
    reasoning: "추론",
    long: "긴 문서",
    edge: "경량",
    vision: "비전",
  };
  return labels[tag] || tag;
}

function modelKey(model) {
  return String(model.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getModelByKey(key) {
  return MODELS.find((model) => modelKey(model) === key) || null;
}

function formatGb(value) {
  if (Math.abs(value - Math.round(value)) < 0.05) return `${Math.round(value)} GB`;
  if (value >= 100) return `${Math.round(value)} GB`;
  return `${value.toFixed(1)} GB`;
}

function formatContext(tokens) {
  if (tokens >= 1048576) return `${Math.round(tokens / 1048576)}M`;
  return `${Math.round(tokens / 1024)}K`;
}

function formatParams(value) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}B`;
}

function formatSpeed(value) {
  if (!value) return "불가";
  if (value < 1) return `${value.toFixed(1)} tok/s`;
  return `${Math.round(value)} tok/s`;
}

function formatDuration(seconds) {
  if (!seconds) return "불가";
  if (seconds < 1) return `${seconds.toFixed(1)}초`;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}초`;
  return `${Math.floor(seconds / 60)}분 ${Math.round(seconds % 60)}초`;
}

function buildOllamaCommand(model, quant, hardware) {
  return `ollama run ${buildOllamaModelName(model)} # ${quant.label}, ${formatContext(hardware.context)}`;
}

function buildLlamaCppCommand(model, quant, hardware) {
  return `llama-cli -m ./models/${toSlug(model.name)}-${quant.label}.gguf -c ${hardware.context} -ngl 999`;
}

function buildOllamaModelName(model) {
  const lower = model.name.toLowerCase();
  const size = extractModelSize(model.name);

  if (lower.includes("qwen2.5 coder")) return `qwen2.5-coder:${size}`;
  if (lower.includes("qwen2.5-vl")) return `qwen2.5vl:${size}`;
  if (lower.includes("qwen2.5")) return `qwen2.5:${size}`;
  if (lower.includes("qwen3 coder")) return `qwen3-coder:${size}`;
  if (lower.includes("qwen3")) return `qwen3:${size}`;
  if (lower.includes("llama 3.3")) return `llama3.3:${size}`;
  if (lower.includes("llama 3.2")) return `llama3.2:${size}`;
  if (lower.includes("llama 3.1")) return `llama3.1:${size}`;
  if (lower.includes("gemma 3")) return `gemma3:${size}`;
  if (lower.includes("gemma 2")) return `gemma2:${size}`;
  if (lower.includes("mistral")) return `mistral:${size}`;
  if (lower.includes("phi-4")) return `phi4:${size}`;
  if (lower.includes("phi-3.5")) return `phi3.5:${size}`;

  return `${toSlug(model.name)}:${size || "latest"}`;
}

function extractModelSize(name) {
  const match = String(name).match(/(\d+(?:\.\d+)?)B/i);
  if (!match) return "latest";
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return "latest";
  return `${value % 1 === 0 ? value.toFixed(0) : value.toString()}b`;
}

function toSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function syncUrlState() {
  if (!window.history || !window.location) return;

  const params = new URLSearchParams();
  params.set("gpu", $("gpuPreset").value);
  params.set("vram", String(getHardware().vram));
  params.set("ram", String(getHardware().ram));
  params.set("count", String(getHardware().count));
  params.set("bandwidth", String(getHardware().bandwidth));
  params.set("ctx", String(getHardware().context));
  params.set("con", String(getHardware().concurrency));
  params.set("out", String(getHardware().outputTokens));
  params.set("kv", getHardware().kvPrecision);
  params.set("runtime", getHardware().runtime);
  params.set("quant", $("quantization").value);
  params.set("task", $("taskFilter").value);
  params.set("provider", $("providerFilter").value);
  params.set("license", $("licenseFilter").value);
  params.set("grade", $("gradeFilter").value);
  params.set("fit", activeSummaryFilter);
  params.set("sort", $("sortBy").value);
  params.set("view", viewMode);
  if (selectedModelKey) params.set("model", selectedModelKey);

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const gpuId = params.get("gpu");
  if (setSelectIfValid("gpuPreset", gpuId)) applyPreset(gpuId);

  setValueIfPresent("vramGb", params.get("vram"));
  setValueIfPresent("ramGb", params.get("ram"));
  setValueIfPresent("gpuCount", params.get("count"));
  setValueIfPresent("bandwidth", params.get("bandwidth"));
  setSelectIfValid("contextSize", params.get("ctx"));
  setSelectIfValid("concurrency", params.get("con"));
  setSelectIfValid("outputTokens", params.get("out"));
  setSelectIfValid("kvPrecision", params.get("kv"));
  setSelectIfValid("runtimeMode", params.get("runtime"));
  setSelectIfValid("quantization", params.get("quant"));
  setSelectIfValid("taskFilter", params.get("task"));
  setSelectIfValid("providerFilter", params.get("provider"));
  setSelectIfValid("licenseFilter", params.get("license"));
  setSelectIfValid("gradeFilter", params.get("grade"));
  setSelectIfValid("sortBy", params.get("sort"));

  const fit = params.get("fit");
  if (SUMMARY_FILTERS.some((item) => item.id === fit)) activeSummaryFilter = fit;

  const nextView = params.get("view");
  viewMode = nextView === "card" ? "card" : "list";

  const model = params.get("model");
  selectedModelKey = model && getModelByKey(model) ? model : "";
}

function setSelectIfValid(id, value) {
  if (!value) return false;
  const select = $(id);
  if (![...select.options].some((option) => option.value === value)) return false;
  select.value = value;
  return true;
}

function setValueIfPresent(id, value) {
  if (value === null || value === "") return;
  $(id).value = value;
}

async function detectGpu() {
  const status = $("hardwareStatus");
  status.textContent = "PC 정보를 감지하는 중입니다";

  try {
    const webGpuInfo = await getWebGpuInfo();
    const webGlInfo = getWebGlInfo();
    const detectedText = [webGpuInfo, webGlInfo].filter(Boolean).join(" ");
    const matchedPreset = findGpuPresetForText(detectedText);
    const browserRam = getBrowserMemoryGb();

    if (matchedPreset) {
      $("gpuPreset").value = matchedPreset.id;
      $("vramGb").value = matchedPreset.vram;
      $("bandwidth").value = matchedPreset.bandwidth;
      $("gpuCount").value = 1;
      $("ramGb").value = browserRam && browserRam > matchedPreset.ram ? browserRam : matchedPreset.ram;

      detectedHardwareLabel = `감지: ${summarizeDetectedGpu(detectedText)} → ${matchedPreset.name} 추정 매칭`;
      render();
      return;
    }

    if (browserRam) {
      $("ramGb").value = Math.max(Number($("ramGb").value), browserRam);
    }

    detectedHardwareLabel = detectedText
      ? `감지: ${summarizeDetectedGpu(detectedText)} · 프리셋 매칭 실패`
      : "브라우저가 GPU 모델명을 공개하지 않습니다";
    render();
  } catch (error) {
    detectedHardwareLabel = "GPU 감지 권한 또는 브라우저 설정을 확인하세요";
    render();
  }
}

async function getWebGpuInfo() {
  try {
    if (!navigator.gpu) return "";
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return "";

    let info = adapter.info || {};
    if (!info.vendor && typeof adapter.requestAdapterInfo === "function") {
      info = await adapter.requestAdapterInfo();
    }

    return [info.vendor, info.architecture, info.device, info.description]
      .filter(Boolean)
      .join(" ");
  } catch (error) {
    return "";
  }
}

function getWebGlInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "";

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return "";

    return [
      gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
    ]
      .filter(Boolean)
      .join(" ");
  } catch (error) {
    return "";
  }
}

function getBrowserMemoryGb() {
  if (typeof navigator.deviceMemory !== "number") return null;
  return clampNumber(navigator.deviceMemory, 1, 2048, null);
}

function findGpuPresetForText(text) {
  const normalizedDetected = normalizeGpuText(text);
  if (!normalizedDetected) return null;

  const candidates = GPU_PRESETS
    .filter((gpu) => gpu.id !== "custom")
    .map((gpu) => ({
      gpu,
      key: normalizeGpuText(gpu.name),
      familyKey: normalizeGpuText(gpu.name.replace(/\b\d+(\.\d+)?\s*gb\b/gi, "")),
      coreKey: getGpuCoreKey(gpu.name),
    }))
    .sort((a, b) => b.familyKey.length - a.familyKey.length || b.gpu.vram - a.gpu.vram);

  return candidates.find(({ key }) => normalizedDetected.includes(key))?.gpu
    || candidates.find(({ familyKey }) => normalizedDetected.includes(familyKey))?.gpu
    || candidates
      .sort((a, b) => b.coreKey.length - a.coreKey.length || b.gpu.vram - a.gpu.vram)
      .find(({ coreKey }) => coreKey && normalizedDetected.includes(coreKey))?.gpu
    || null;
}

function normalizeGpuText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\b(nvidia|amd|intel|apple|geforce|radeon|graphics|gpu|direct3d\d*|angle|metal|opencl|vulkan|pci-e|pcie|sxm|mobile|laptop|family|renderer|vendor|tm|r)\b/g, " ")
    .replace(/\b\d+(\.\d+)?\s*gb\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(ti)\b/g, "ti")
    .replace(/\s+/g, " ")
    .trim();
}

function getGpuCoreKey(text) {
  const normalized = normalizeGpuText(text);
  const patterns = [
    /\brtx pro \d{4} blackwell\b/,
    /\brtx \d{4} ti super\b/,
    /\brtx \d{4} ti\b/,
    /\brtx \d{4} super\b/,
    /\brtx \d{4}\b/,
    /\bquadrotx \d{4}\b/,
    /\btitan rtx\b/,
    /\b(b200|b100|h200|h100 nvl|h100|a100|l40s|l40|l4|a40|a30|a10|t4|v100|p100)\b/,
    /\bmi(325x|300x|250x|210)\b/,
    /\bw(7900|7800|7700|6800)\b/,
    /\brx \d{4} xtx\b/,
    /\brx \d{4} xt\b/,
    /\brx \d{4} gre\b/,
    /\brx \d{4}\b/,
    /\bdata center max \d{4}\b/,
    /\bdata center flex \d{3}\b/,
    /\barc a\d{3}\b/,
    /\bm\d ultra\b/,
    /\bm\d max\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return match[0];
  }
  return "";
}

function summarizeDetectedGpu(text) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return "GPU 이름 제한";
  if (compact.length <= 80) return compact;
  return `${compact.slice(0, 77)}...`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

document.addEventListener("DOMContentLoaded", init);
