/* AI Hardware Fit v2 product layer.
 * Kept separate from the estimator so reliability, purchasing, deep links,
 * and launch recipes can evolve without coupling to memory calculations.
 */
const PLATFORM_V2_COPY = {
  ko: {
    hub: "의사결정 허브",
    hubNote: "실측 신뢰도부터 구매 비용과 실행 설정까지 한곳에서 확인합니다.",
    reliability: "실측 신뢰도",
    benchmark: "벤치마크 2.0",
    detail: "상세 주소",
    purchase: "구매 Advisor",
    launch: "실행 도우미",
    measured: "실측",
    external: "외부 참고",
    samples: "표본",
    confidence: "95% 신뢰구간",
    median: "중앙값",
    range: "범위",
    insufficient: "동일 조건 실측이 2개 이상 쌓이면 신뢰구간을 제공합니다.",
    gpuCoverage: "GPU 커버리지",
    modelCoverage: "모델 커버리지",
    estimateError: "평균 절대 오차",
    filters: "데이터 필터",
    all: "전체",
    currentGpu: "현재 GPU",
    currentModel: "현재 모델",
    copyLink: "상세 링크 복사",
    copied: "복사됨",
    compare: "비교에 추가",
    purchaseIntro: "신품·중고 가격과 전기요금을 포함해 업그레이드 가치를 계산합니다.",
    currency: "통화",
    exchangeRate: "환율 (1 USD)",
    newPrice: "신품 가격",
    usedPrice: "중고 가격",
    currentResale: "현재 GPU 중고 처분가",
    years: "사용 기간",
    hours: "월 사용 시간",
    electricity: "전기요금 / kWh",
    acquisition: "실구매 비용",
    energy: "예상 전력비",
    tco: "총소유비용",
    payback: "성능 향상 1×당 비용",
    verdictWorth: "업그레이드 체감이 큽니다",
    verdictMaybe: "가격을 비교한 뒤 결정하세요",
    verdictSkip: "현재 GPU를 유지하는 편이 합리적입니다",
    launchIntro: "선택한 모델과 GPU에 맞는 시작 명령을 생성합니다.",
    runtime: "런타임",
    platform: "운영체제",
    copy: "복사",
    download: "설정 다운로드",
    noModel: "먼저 모델을 선택하세요.",
    noGpu: "먼저 GPU를 선택하세요.",
    evidenceEstimated: "추정값",
    evidenceMeasured: "실측 기반",
    search: "모델 또는 GPU 검색",
    onlyMeasured: "실측만",
    sort: "정렬",
    newest: "최신순",
    fastest: "속도순",
    trusted: "신뢰도순",
    empty: "조건에 맞는 데이터가 없습니다.",
    bandwidth: "대역폭",
    workload: "워크로드",
    speed: "속도",
    upgradeCandidate: "업그레이드 후보",
    performanceRatio: "성능 배수",
    build: "빌드 계산기",
    buildIntro: "CPU·RAM·파워·케이스와 부품 가격을 입력해 모델 실행 가능 여부와 업그레이드 순서를 계산합니다.",
    buildModel: "실행할 모델",
    buildGpu: "장착 GPU",
    cpuProfile: "CPU 등급",
    systemRam: "시스템 RAM",
    psuCapacity: "파워 용량",
    caseClearance: "케이스 GPU 장착 길이",
    gpuLength: "GPU 길이",
    componentPrices: "부품 가격 (USD)",
    gpuPrice: "GPU",
    cpuPrice: "CPU",
    motherboardPrice: "메인보드",
    ramPrice: "RAM",
    psuPrice: "파워",
    casePrice: "케이스",
    storagePrice: "저장장치",
    otherPrice: "기타",
    buildResult: "빌드 판정",
    runnable: "실행 가능",
    conditional: "조건부 실행",
    blocked: "구성 변경 필요",
    recommendedRam: "권장 RAM",
    recommendedPsu: "권장 파워",
    totalPrice: "전체 시스템 가격",
    upgradePriority: "업그레이드 우선순위",
    priorityGpu: "GPU VRAM",
    priorityRam: "시스템 RAM",
    priorityPsu: "파워 용량",
    priorityCase: "케이스 장착 공간",
    priorityCpu: "CPU",
    priorityNone: "현재 구성 유지",
    buildReasonGpu: "모델 가중치와 실행 메모리를 담기에는 GPU 메모리가 부족합니다.",
    buildReasonRam: "CPU 오프로딩과 운영체제 여유 공간을 위한 RAM이 부족합니다.",
    buildReasonPsu: "GPU 순간 부하와 시스템 여유분을 고려한 권장 파워보다 작습니다.",
    buildReasonCase: "GPU 길이가 케이스 장착 한도를 초과합니다.",
    buildReasonCpu: "오프로딩 또는 전처리 작업에 비해 CPU 여유가 부족합니다.",
    buildReasonNone: "선택 모델 기준으로 즉시 교체해야 할 핵심 부품이 없습니다.",
    referencePriceNote: "가격은 참고값입니다. 실제 구매가는 직접 입력하세요.",
  },
  en: {
    hub: "Decision hub",
    hubNote: "Review measured confidence, purchase cost, and launch settings in one place.",
    reliability: "Measurement confidence",
    benchmark: "Benchmark 2.0",
    detail: "Deep links",
    purchase: "Purchase Advisor",
    launch: "Launch assistant",
    measured: "Measured",
    external: "External reference",
    samples: "Samples",
    confidence: "95% confidence interval",
    median: "Median",
    range: "Range",
    insufficient: "A confidence interval appears after two measurements share the same conditions.",
    gpuCoverage: "GPU coverage",
    modelCoverage: "Model coverage",
    estimateError: "Mean absolute error",
    filters: "Data filters",
    all: "All",
    currentGpu: "Current GPU",
    currentModel: "Current model",
    copyLink: "Copy deep link",
    copied: "Copied",
    compare: "Add to comparison",
    purchaseIntro: "Evaluate upgrade value with new/used pricing and electricity cost.",
    currency: "Currency",
    exchangeRate: "Exchange rate (1 USD)",
    newPrice: "New price",
    usedPrice: "Used price",
    currentResale: "Current GPU resale value",
    years: "Ownership years",
    hours: "Hours per month",
    electricity: "Electricity / kWh",
    acquisition: "Net acquisition",
    energy: "Estimated energy",
    tco: "Total cost of ownership",
    payback: "Cost per 1× speed gain",
    verdictWorth: "This should feel like a meaningful upgrade",
    verdictMaybe: "Compare street prices before deciding",
    verdictSkip: "Keeping the current GPU is the rational choice",
    launchIntro: "Generate a starting command for the selected model and GPU.",
    runtime: "Runtime",
    platform: "Operating system",
    copy: "Copy",
    download: "Download config",
    noModel: "Select a model first.",
    noGpu: "Select a GPU first.",
    evidenceEstimated: "Estimate",
    evidenceMeasured: "Measurement-backed",
    search: "Search model or GPU",
    onlyMeasured: "Measured only",
    sort: "Sort",
    newest: "Newest",
    fastest: "Fastest",
    trusted: "Confidence",
    empty: "No data matches these filters.",
    bandwidth: "Bandwidth",
    workload: "Workload",
    speed: "Speed",
    upgradeCandidate: "Upgrade candidate",
    performanceRatio: "Performance ratio",
    build: "Build calculator",
    buildIntro: "Enter CPU, RAM, PSU, case clearance, and component prices to check model fit and upgrade order.",
    buildModel: "Model to run",
    buildGpu: "Installed GPU",
    cpuProfile: "CPU tier",
    systemRam: "System RAM",
    psuCapacity: "PSU capacity",
    caseClearance: "Case GPU clearance",
    gpuLength: "GPU length",
    componentPrices: "Component prices (USD)",
    gpuPrice: "GPU",
    cpuPrice: "CPU",
    motherboardPrice: "Motherboard",
    ramPrice: "RAM",
    psuPrice: "PSU",
    casePrice: "Case",
    storagePrice: "Storage",
    otherPrice: "Other",
    buildResult: "Build verdict",
    runnable: "Runnable",
    conditional: "Conditional",
    blocked: "Changes required",
    recommendedRam: "Recommended RAM",
    recommendedPsu: "Recommended PSU",
    totalPrice: "Total system price",
    upgradePriority: "Upgrade priority",
    priorityGpu: "GPU VRAM",
    priorityRam: "System RAM",
    priorityPsu: "PSU capacity",
    priorityCase: "Case clearance",
    priorityCpu: "CPU",
    priorityNone: "Keep this build",
    buildReasonGpu: "GPU memory is too small for the model weights and runtime memory.",
    buildReasonRam: "System RAM is too small for CPU offload and operating-system headroom.",
    buildReasonPsu: "PSU capacity is below the recommendation including GPU transients and system headroom.",
    buildReasonCase: "GPU length exceeds the case clearance.",
    buildReasonCpu: "CPU headroom is low for offload or preprocessing work.",
    buildReasonNone: "No core component needs an immediate replacement for the selected model.",
    referencePriceNote: "Prices are references. Enter the actual checkout prices.",
  },
};
const PLATFORM_V2_INITIAL_PARAMS = new URL(window.location.href).searchParams;

let platformBenchmarkQuery = "";
let platformBenchmarkMeasuredOnly = false;
let platformBenchmarkSort = "trusted";
let platformActiveTab = "reliability";
let platformPurchaseState = {
  targetGpuId: "",
  currency: "KRW",
  rate: 1400,
  newPrice: 0,
  usedPrice: 0,
  resale: 0,
  years: 3,
  hours: 120,
  electricity: 0.15,
};
let platformLaunchState = { runtime: "ollama", platform: "windows" };
const SYSTEM_CPU_PROFILES = [
  { id: "entry4", ko: "4코어 보급형", en: "Entry 4-core", cores: 4, score: 30, tdpW: 65, priceUsd: 100 },
  { id: "main6", ko: "6코어 메인스트림", en: "Mainstream 6-core", cores: 6, score: 48, tdpW: 88, priceUsd: 180 },
  { id: "performance8", ko: "8코어 고성능", en: "Performance 8-core", cores: 8, score: 65, tdpW: 125, priceUsd: 320 },
  { id: "creator12", ko: "12코어 크리에이터", en: "Creator 12-core", cores: 12, score: 82, tdpW: 170, priceUsd: 480 },
  { id: "workstation16", ko: "16코어 워크스테이션", en: "Workstation 16-core", cores: 16, score: 100, tdpW: 230, priceUsd: 700 },
  { id: "server32", ko: "32코어 서버", en: "Server 32-core", cores: 32, score: 140, tdpW: 280, priceUsd: 1400 },
];
let platformBuildState = {
  modelKey: "",
  gpuId: "",
  cpuProfileId: "performance8",
  ramGb: 64,
  psuW: 850,
  caseClearanceMm: 360,
  gpuLengthMm: 340,
  gpuPrice: 0,
  cpuPrice: 0,
  motherboardPrice: 180,
  ramPrice: 150,
  psuPrice: 130,
  casePrice: 110,
  storagePrice: 100,
  otherPrice: 80,
};

function platformText(key) {
  return PLATFORM_V2_COPY[uiLanguage === "en" ? "en" : "ko"][key] || key;
}

function benchmarkNumericValue(row) {
  return Number(row.tokensPerSecond || row.docsPerSecond || row.pairsPerSecond || row.pagesPerSecond || row.qualityValue || row.value || 0);
}

function benchmarkConditionKey(row) {
  return [
    row.workload || "generative",
    row.modelName || "",
    row.gpu || "",
    row.runtime || "",
    row.quantization || row.precision || "",
    row.context || "",
  ].join("|").toLowerCase();
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function calculateReliabilityStats(rows) {
  const values = rows.map(benchmarkNumericValue).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  const n = values.length;
  if (!n) return { count: 0, median: 0, min: 0, max: 0, mean: 0, ciLow: 0, ciHigh: 0, confidence: "insufficient" };
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const variance = n > 1 ? values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / (n - 1) : 0;
  const margin = n > 1 ? 1.96 * Math.sqrt(variance / n) : 0;
  return {
    count: n,
    median: percentile(values, 0.5),
    min: values[0],
    max: values[n - 1],
    mean,
    ciLow: Math.max(0, mean - margin),
    ciHigh: mean + margin,
    confidence: n >= 5 ? "high" : n >= 2 ? "medium" : "insufficient",
  };
}

function groupedReliabilityRows(rows = BENCHMARKS) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = benchmarkConditionKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.values()].map((items) => ({ rows: items, row: items[0], stats: calculateReliabilityStats(items) }));
}

function currentPlatformModel() {
  const advisorKey = $("advisorModel")?.value;
  return getModelByKey(advisorKey || selectedModelKey) || getAllModels()[0] || null;
}

function currentPlatformGpu() {
  const id = $("gpuPreset")?.value;
  return GPU_PRESETS.find((gpu) => gpu.id === id) || null;
}

function modelSlug(model) {
  return encodeURIComponent(modelKey(model));
}

function buildGpuDetailUrl(gpu) {
  const url = new URL(window.location.href);
  url.searchParams.set("detail", "gpu");
  url.searchParams.set("gpu", gpu.id);
  url.hash = "decisionHub";
  return url.toString();
}

function buildDedicatedModelUrl(model) {
  const url = new URL(window.location.href);
  url.searchParams.set("detail", "model");
  url.searchParams.set("model", modelKey(model));
  url.hash = "decisionHub";
  return url.toString();
}

function formatPlatformMoney(value, currency, rate) {
  const converted = currency === "KRW" ? value * rate : value;
  return new Intl.NumberFormat(uiLanguage === "en" ? "en-US" : "ko-KR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "KRW" ? 0 : 2,
  }).format(converted);
}

function calculateUpgradeTco({
  newPriceUsd = 0,
  usedPriceUsd = 0,
  currentResaleUsd = 0,
  targetPowerW = 0,
  currentPowerW = 0,
  years = 3,
  hoursPerMonth = 120,
  electricityUsdKwh = 0.15,
  targetSpeed = 0,
  currentSpeed = 0,
} = {}) {
  const purchasePrice = usedPriceUsd > 0 ? usedPriceUsd : newPriceUsd;
  const acquisition = Math.max(0, purchasePrice - currentResaleUsd);
  const targetEnergy = targetPowerW / 1000 * hoursPerMonth * 12 * years * electricityUsdKwh;
  const currentEnergy = currentPowerW / 1000 * hoursPerMonth * 12 * years * electricityUsdKwh;
  const energyDelta = targetEnergy - currentEnergy;
  const tco = acquisition + energyDelta;
  const speedRatio = currentSpeed > 0 ? targetSpeed / currentSpeed : 0;
  const gain = Math.max(0, speedRatio - 1);
  const costPerGain = gain > 0 ? tco / gain : Infinity;
  const verdict = speedRatio >= 1.8 && tco <= Math.max(800, purchasePrice)
    ? "worth"
    : speedRatio >= 1.3 && tco <= Math.max(1400, purchasePrice)
      ? "maybe"
      : "skip";
  return { purchasePrice, acquisition, targetEnergy, currentEnergy, energyDelta, tco, speedRatio, costPerGain, verdict };
}

function roundUpTo(value, step) {
  return Math.ceil(Math.max(0, value) / step) * step;
}

function calculateSystemBuild({
  estimate,
  gpuVramGb = 0,
  gpuPowerW = 0,
  cpuScore = 0,
  cpuPowerW = 0,
  ramGb = 0,
  psuW = 0,
  caseClearanceMm = 0,
  gpuLengthMm = 0,
  prices = {},
} = {}) {
  const requiredGb = Number(estimate?.requiredGb || 0);
  const offloadGb = Math.max(0, requiredGb - gpuVramGb);
  const minimumRamGb = roundUpTo(8 + offloadGb * 1.1, 8);
  const recommendedRamGb = Math.max(32, roundUpTo(16 + offloadGb * 1.35, 8));
  const recommendedPsuW = roundUpTo((gpuPowerW + cpuPowerW + 120) * 1.25, 50);
  const recommendedCpuScore = offloadGb > 0 ? 65 : 45;
  const gradeScore = Number(GRADE_META[estimate?.grade]?.score ?? 0);
  const caseFits = !gpuLengthMm || !caseClearanceMm || gpuLengthMm <= caseClearanceMm;
  const psuFits = !recommendedPsuW || psuW >= recommendedPsuW;
  const ramFits = ramGb >= minimumRamGb;
  const cpuFits = cpuScore >= recommendedCpuScore;
  const priorities = [];
  if (gradeScore === 0 || offloadGb > Math.max(8, ramGb * 0.45)) priorities.push({ id: "gpu", severity: 5, reasonKey: "buildReasonGpu" });
  if (!ramFits) priorities.push({ id: "ram", severity: 4, reasonKey: "buildReasonRam" });
  if (!psuFits) priorities.push({ id: "psu", severity: 4, reasonKey: "buildReasonPsu" });
  if (!caseFits) priorities.push({ id: "case", severity: 4, reasonKey: "buildReasonCase" });
  if (!cpuFits) priorities.push({ id: "cpu", severity: offloadGb > 0 ? 3 : 2, reasonKey: "buildReasonCpu" });
  if (!priorities.length) priorities.push({ id: "none", severity: 0, reasonKey: "buildReasonNone" });
  priorities.sort((a, b) => b.severity - a.severity);
  const hardBlocked = !caseFits || !psuFits || !ramFits || gradeScore === 0;
  const verdict = hardBlocked ? "blocked" : gradeScore <= 2 || offloadGb > 0 || !cpuFits ? "conditional" : "runnable";
  const totalPriceUsd = Object.values(prices).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  return {
    verdict,
    requiredGb,
    offloadGb,
    minimumRamGb,
    recommendedRamGb,
    recommendedPsuW,
    recommendedCpuScore,
    caseFits,
    psuFits,
    ramFits,
    cpuFits,
    priorities,
    totalPriceUsd,
  };
}

function safeModelRepo(model) {
  const source = String(model?.sourceUrl || "");
  const match = source.match(/huggingface\.co\/([^/?#]+\/[^/?#]+)/i);
  return match ? match[1] : model?.name || "MODEL_ID";
}

function quantForLaunch(model) {
  if (model?.type && model.type !== "generative") return "fp16";
  const hardware = getHardware();
  const estimate = model ? estimateModel(model, $("quantization")?.value || "auto", hardware) : null;
  return estimate?.setting?.id || estimate?.quant?.id || "Q4_K_M";
}

function generateLaunchRecipe({ runtime = "ollama", platform = "windows", model = currentPlatformModel(), gpu = currentPlatformGpu() } = {}) {
  if (!model) return { filename: "README.txt", command: platformText("noModel"), content: platformText("noModel") };
  const repo = safeModelRepo(model);
  const quant = quantForLaunch(model);
  const gpuCount = Math.max(1, Number($("gpuCount")?.value || 1));
  const context = Math.max(512, Number($("contextSize")?.value || 8192));
  const gpuEnv = gpuCount > 1
    ? (platform === "windows" ? `$env:CUDA_VISIBLE_DEVICES=\"${Array.from({ length: gpuCount }, (_, i) => i).join(",")}\"` : `export CUDA_VISIBLE_DEVICES=${Array.from({ length: gpuCount }, (_, i) => i).join(",")}`)
    : "";
  if (runtime === "ollama") {
    const tag = repo.split("/").pop().toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const content = `FROM hf.co/${repo}\nPARAMETER num_ctx ${context}\nPARAMETER num_gpu 999\n# Recommended precision: ${quant}\n`;
    return { filename: "Modelfile", command: `ollama create ${tag} -f Modelfile\nollama run ${tag}`, content };
  }
  if (runtime === "llamacpp") {
    const continuation = platform === "windows" ? "`" : "\\";
    const command = [gpuEnv, `llama-cli -hf ${repo}:${quant} ${continuation}`, `  -ngl 999 -c ${context} -fa on`].filter(Boolean).join("\n");
    return { filename: "run-llama.txt", command, content: command };
  }
  if (runtime === "vllm") {
    const command = [gpuEnv, `vllm serve ${repo} --tensor-parallel-size ${gpuCount} --max-model-len ${context} --dtype auto`].filter(Boolean).join("\n");
    return { filename: "run-vllm.txt", command, content: command };
  }
  const compose = `services:\n  model:\n    image: vllm/vllm-openai:latest\n    command: [\"--model\", \"${repo}\", \"--tensor-parallel-size\", \"${gpuCount}\", \"--max-model-len\", \"${context}\"]\n    ports: [\"8000:8000\"]\n    deploy:\n      resources:\n        reservations:\n          devices:\n            - capabilities: [gpu]\n`;
  return { filename: "compose.yaml", command: "docker compose up", content: compose };
}

function platformEscape(value) {
  return escapeHtml(String(value ?? ""));
}

function ensureDecisionHub() {
  if ($("decisionHub")) return $("decisionHub");
  const panel = document.createElement("section");
  panel.id = "decisionHub";
  panel.className = "decision-hub";
  panel.setAttribute("aria-labelledby", "decisionHubTitle");
  panel.innerHTML = `
    <div class="decision-hub-head">
      <div><span class="section-kicker">v2.0</span><h2 id="decisionHubTitle"></h2><p id="decisionHubNote"></p></div>
      <div class="decision-hub-tabs" role="tablist"></div>
    </div>
    <div id="decisionHubBody" class="decision-hub-body" aria-live="polite"></div>`;
  const benchmark = $("benchmarkSheet");
  benchmark?.parentNode?.insertBefore(panel, benchmark);
  return panel;
}

function renderReliabilityHub() {
  const measured = BENCHMARKS.filter((row) => benchmarkEvidenceType(row) !== "external");
  const rows = groupedReliabilityRows(measured);
  const gpuCoverage = new Set(measured.map((row) => row.gpu)).size;
  const modelCoverage = new Set(measured.map((row) => row.modelName)).size;
  const error = typeof computeBenchmarkErrorStats === "function" ? computeBenchmarkErrorStats() : null;
  return `
    <div class="hub-metric-grid">
      <article><span>${platformText("measured")}</span><strong>${measured.length}</strong><small>${platformText("samples")}</small></article>
      <article><span>${platformText("gpuCoverage")}</span><strong>${gpuCoverage}</strong><small>/ ${GPU_PRESETS.length}</small></article>
      <article><span>${platformText("modelCoverage")}</span><strong>${modelCoverage}</strong><small>/ ${getAllModels().length}</small></article>
      <article><span>${platformText("estimateError")}</span><strong>${error ? `${error.avgAbsErrorPct.toFixed(1)}%` : "—"}</strong><small>${error ? `${error.sampleCount} ${platformText("samples")}` : platformText("insufficient")}</small></article>
    </div>
    <div class="reliability-list">
      ${rows.length ? rows.slice(0, 12).map(({ row, stats }) => `
        <article class="reliability-card confidence-${stats.confidence}">
          <div><strong>${platformEscape(row.modelName)}</strong><span>${platformEscape(row.gpu)}</span></div>
          <dl>
            <div><dt>${platformText("samples")}</dt><dd>${stats.count}</dd></div>
            <div><dt>${platformText("median")}</dt><dd>${stats.median.toFixed(2)}</dd></div>
            <div><dt>${platformText("confidence")}</dt><dd>${stats.count > 1 ? `${stats.ciLow.toFixed(2)}–${stats.ciHigh.toFixed(2)}` : "—"}</dd></div>
            <div><dt>${platformText("range")}</dt><dd>${stats.min.toFixed(2)}–${stats.max.toFixed(2)}</dd></div>
          </dl>
        </article>`).join("") : `<p class="hub-empty">${platformText("insufficient")}</p>`}
    </div>`;
}

function renderBenchmarkV2Hub() {
  const query = platformBenchmarkQuery.trim().toLowerCase();
  let groups = groupedReliabilityRows(BENCHMARKS).filter(({ row }) => {
    if (platformBenchmarkMeasuredOnly && benchmarkEvidenceType(row) === "external") return false;
    return !query || `${row.modelName} ${row.gpu} ${row.runtime} ${row.quantization || ""}`.toLowerCase().includes(query);
  });
  groups.sort((a, b) => {
    if (platformBenchmarkSort === "fastest") return b.stats.median - a.stats.median;
    if (platformBenchmarkSort === "newest") return String(b.row.measuredAt || b.row.date || "").localeCompare(String(a.row.measuredAt || a.row.date || ""));
    return b.stats.count - a.stats.count || b.stats.median - a.stats.median;
  });
  return `
    <div class="benchmark-v2-toolbar">
      <label><span>${platformText("search")}</span><input id="platformBenchmarkSearch" type="search" value="${platformEscape(platformBenchmarkQuery)}"></label>
      <label class="check-field"><input id="platformMeasuredOnly" type="checkbox" ${platformBenchmarkMeasuredOnly ? "checked" : ""}><span>${platformText("onlyMeasured")}</span></label>
      <label><span>${platformText("sort")}</span><select id="platformBenchmarkSort">
        <option value="trusted" ${platformBenchmarkSort === "trusted" ? "selected" : ""}>${platformText("trusted")}</option>
        <option value="fastest" ${platformBenchmarkSort === "fastest" ? "selected" : ""}>${platformText("fastest")}</option>
        <option value="newest" ${platformBenchmarkSort === "newest" ? "selected" : ""}>${platformText("newest")}</option>
      </select></label>
    </div>
    <div class="benchmark-v2-list">${groups.length ? groups.slice(0, 30).map(({ row, stats }) => `
      <article>
        <div><strong>${platformEscape(row.modelName)}</strong><span>${platformEscape(row.gpu)}</span></div>
        <span class="evidence-pill ${benchmarkEvidenceType(row) === "external" ? "is-external" : "is-measured"}">${benchmarkEvidenceType(row) === "external" ? platformText("external") : platformText("measured")}</span>
        <span>${platformEscape(row.runtime || "—")} · ${platformEscape(row.quantization || row.precision || "—")}</span>
        <strong>${stats.median.toFixed(2)} ${row.tokensPerSecond ? "tok/s" : ""}</strong>
        <span>${stats.count} ${platformText("samples")}</span>
      </article>`).join("") : `<p class="hub-empty">${platformText("empty")}</p>`}</div>`;
}

function renderDetailHub() {
  const gpu = currentPlatformGpu();
  const model = currentPlatformModel();
  const gpuEstimate = gpu && model ? estimateAnyModelForHardware(model, buildHardwareForPreset(gpu)) : null;
  return `
    <div class="deep-link-grid">
      <article>
        <span>${platformText("currentGpu")}</span>
        <h3>${gpu ? platformEscape(shortGpuName(gpu.name)) : platformText("noGpu")}</h3>
        ${gpu ? `<dl>
          <div><dt>VRAM</dt><dd>${formatGb(gpu.gpuUsableMemoryGb || gpu.vram)}</dd></div>
          <div><dt>${platformText("bandwidth")}</dt><dd>${gpu.bandwidth} GB/s</dd></div>
          <div><dt>${platformText("runtime")}</dt><dd>${platformEscape((gpu.runtimes || []).join(", "))}</dd></div>
        </dl><button class="ghost-button" data-copy-deep-link="${platformEscape(buildGpuDetailUrl(gpu))}">${platformText("copyLink")}</button>` : ""}
      </article>
      <article>
        <span>${platformText("currentModel")}</span>
        <h3>${model ? platformEscape(model.name) : platformText("noModel")}</h3>
        ${model ? `<dl>
          <div><dt>${platformText("workload")}</dt><dd>${platformEscape(model.type || "generative")}</dd></div>
          <div><dt>VRAM</dt><dd>${gpuEstimate ? formatGb(gpuEstimate.requiredGb) : "—"}</dd></div>
          <div><dt>${platformText("speed")}</dt><dd>${gpuEstimate ? platformEscape(formatThroughput(gpuEstimate.speed || gpuEstimate.throughput || 0, gpuEstimate.unitLabel || "tok/s")) : "—"}</dd></div>
        </dl><button class="ghost-button" data-copy-deep-link="${platformEscape(buildDedicatedModelUrl(model))}">${platformText("copyLink")}</button>` : ""}
      </article>
    </div>`;
}

function renderPurchaseHub() {
  const currentGpu = currentPlatformGpu();
  const model = currentPlatformModel();
  if (!currentGpu || !model) return `<p class="hub-empty">${!currentGpu ? platformText("noGpu") : platformText("noModel")}</p>`;
  const targetGpu = GPU_PRESETS.find((item) => item.id === platformPurchaseState.targetGpuId)
    || GPU_PRESETS.find((item) => item.id === "rtx5090-32")
    || currentGpu;
  const market = gpuMarketReference(targetGpu);
  const koreanMarket = typeof studioMarket === "function" ? studioMarket(targetGpu.id) : null;
  const currentHardware = getHardware();
  const currentEstimate = estimateAnyModelForHardware(model, currentHardware);
  const targetEstimate = estimateAnyModelForHardware(model, buildHardwareForPreset(targetGpu));
  const values = {
    currency: platformPurchaseState.currency,
    rate: clampNumber(platformPurchaseState.rate, 100, 10000, 1400),
    newPrice: clampNumber(platformPurchaseState.newPrice, 0, 1000000, 0) || (koreanMarket?.newKrw ? koreanMarket.newKrw / clampNumber(platformPurchaseState.rate, 100, 10000, 1400) : market.priceUsd),
    usedPrice: clampNumber(platformPurchaseState.usedPrice, 0, 1000000, 0),
    resale: clampNumber(platformPurchaseState.resale, 0, 1000000, 0),
    years: clampNumber(platformPurchaseState.years, 1, 10, 3),
    hours: clampNumber(platformPurchaseState.hours, 1, 744, 120),
    electricity: clampNumber(platformPurchaseState.electricity, 0, 10, 0.15),
  };
  const result = calculateUpgradeTco({
    newPriceUsd: values.newPrice,
    usedPriceUsd: values.usedPrice,
    currentResaleUsd: values.resale,
    targetPowerW: market.powerW,
    currentPowerW: gpuMarketReference(currentHardware.preset || currentGpu).powerW,
    years: values.years,
    hoursPerMonth: values.hours,
    electricityUsdKwh: values.electricity,
    targetSpeed: Number(targetEstimate?.speed || targetEstimate?.throughput || 0),
    currentSpeed: Number(currentEstimate?.speed || currentEstimate?.throughput || 0),
  });
  const verdictKey = result.verdict === "worth" ? "verdictWorth" : result.verdict === "maybe" ? "verdictMaybe" : "verdictSkip";
  return `
    <p>${platformText("purchaseIntro")}</p>
    ${koreanMarket ? `<p class="market-source-note">${uiLanguage === "en" ? "Korean market snapshot" : "국내 시세 스냅샷"} · ${platformEscape(koreanMarket.updatedAt)} · <a href="${platformEscape(koreanMarket.sourceUrl)}" target="_blank" rel="noopener noreferrer">${platformEscape(koreanMarket.sourceName)}</a></p>` : ""}
    <div class="purchase-controls">
      <label><span>${platformText("upgradeCandidate")}</span><select id="purchaseTargetGpu">${GPU_PRESETS.filter((item) => item.id !== "custom").map((item) => `<option value="${platformEscape(item.id)}" ${item.id === targetGpu.id ? "selected" : ""}>${platformEscape(shortGpuName(item.name))}</option>`).join("")}</select></label>
      <label><span>${platformText("currency")}</span><select id="purchaseCurrency"><option value="KRW" ${values.currency === "KRW" ? "selected" : ""}>KRW ₩</option><option value="USD" ${values.currency === "USD" ? "selected" : ""}>USD $</option></select></label>
      <label><span>${platformText("exchangeRate")}</span><input id="purchaseExchangeRate" type="number" value="${values.rate}" min="100" step="10"></label>
      <label><span>${platformText("newPrice")} (USD)</span><input id="purchaseNewPrice" type="number" value="${values.newPrice}" min="0"></label>
      <label><span>${platformText("usedPrice")} (USD)</span><input id="purchaseUsedPrice" type="number" value="${values.usedPrice}" min="0"></label>
      <label><span>${platformText("currentResale")} (USD)</span><input id="purchaseCurrentResale" type="number" value="${values.resale}" min="0"></label>
      <label><span>${platformText("years")}</span><input id="purchaseYears" type="number" value="${values.years}" min="1" max="10"></label>
      <label><span>${platformText("hours")}</span><input id="purchaseHours" type="number" value="${values.hours}" min="1" max="744"></label>
      <label><span>${platformText("electricity")} (USD)</span><input id="purchaseElectricity" type="number" value="${values.electricity}" min="0" step="0.01"></label>
    </div>
    <div class="tco-summary">
      <article><span>${platformText("acquisition")}</span><strong>${formatPlatformMoney(result.acquisition, values.currency, values.rate)}</strong></article>
      <article><span>${platformText("energy")}</span><strong>${formatPlatformMoney(result.energyDelta, values.currency, values.rate)}</strong></article>
      <article><span>${platformText("tco")}</span><strong>${formatPlatformMoney(result.tco, values.currency, values.rate)}</strong></article>
      <article><span>${platformText("performanceRatio")}</span><strong>${result.speedRatio ? `${result.speedRatio.toFixed(2)}×` : "—"}</strong></article>
    </div>
    <div class="upgrade-verdict is-${result.verdict}"><strong>${platformText(verdictKey)}</strong><span>${Number.isFinite(result.costPerGain) ? `${platformText("payback")}: ${formatPlatformMoney(result.costPerGain, values.currency, values.rate)}` : ""}</span></div>`;
}

function renderBuildHub() {
  const models = getAllModels();
  const model = getModelByKey(platformBuildState.modelKey) || currentPlatformModel() || models[0];
  const gpu = GPU_PRESETS.find((item) => item.id === platformBuildState.gpuId) || currentPlatformGpu() || GPU_PRESETS.find((item) => item.id !== "custom");
  if (!model || !gpu) return `<p class="hub-empty">${!model ? platformText("noModel") : platformText("noGpu")}</p>`;
  const cpu = SYSTEM_CPU_PROFILES.find((item) => item.id === platformBuildState.cpuProfileId) || SYSTEM_CPU_PROFILES[2];
  const buildValues = {
    ramGb: clampNumber(platformBuildState.ramGb, 8, 2048, 64),
    psuW: clampNumber(platformBuildState.psuW, 100, 3000, 850),
    caseClearanceMm: clampNumber(platformBuildState.caseClearanceMm, 100, 1000, 360),
    gpuLengthMm: clampNumber(platformBuildState.gpuLengthMm, 0, 1000, 340),
  };
  const hardware = { ...buildHardwareForPreset(gpu), ram: buildValues.ramGb };
  const estimate = estimateAnyModelForHardware(model, hardware);
  const market = gpuMarketReference(gpu);
  const prices = {
    gpu: clampNumber(platformBuildState.gpuPrice, 0, 1000000, 0) || ((typeof studioMarket === "function" && studioMarket(gpu.id)?.lowestKrw) ? studioMarket(gpu.id).lowestKrw / Math.max(1, platformPurchaseState.rate) : market.priceUsd),
    cpu: clampNumber(platformBuildState.cpuPrice, 0, 1000000, 0) || cpu.priceUsd,
    motherboard: clampNumber(platformBuildState.motherboardPrice, 0, 1000000, 0),
    ram: clampNumber(platformBuildState.ramPrice, 0, 1000000, 0),
    psu: clampNumber(platformBuildState.psuPrice, 0, 1000000, 0),
    case: clampNumber(platformBuildState.casePrice, 0, 1000000, 0),
    storage: clampNumber(platformBuildState.storagePrice, 0, 1000000, 0),
    other: clampNumber(platformBuildState.otherPrice, 0, 1000000, 0),
  };
  const result = calculateSystemBuild({
    estimate,
    gpuVramGb: gpu.gpuUsableMemoryGb || gpu.vram,
    gpuPowerW: market.powerW,
    cpuScore: cpu.score,
    cpuPowerW: cpu.tdpW,
    ramGb: buildValues.ramGb,
    psuW: buildValues.psuW,
    caseClearanceMm: buildValues.caseClearanceMm,
    gpuLengthMm: buildValues.gpuLengthMm,
    prices,
  });
  const priorityLabels = {
    gpu: "priorityGpu",
    ram: "priorityRam",
    psu: "priorityPsu",
    case: "priorityCase",
    cpu: "priorityCpu",
    none: "priorityNone",
  };
  const currency = platformPurchaseState.currency;
  const rate = platformPurchaseState.rate;
  return `
    <p>${platformText("buildIntro")}</p>
    <div class="build-selector-grid">
      <label><span>${platformText("buildModel")}</span><select id="buildModel">${models.map((item) => `<option value="${platformEscape(modelKey(item))}" ${item === model ? "selected" : ""}>${platformEscape(item.name)}</option>`).join("")}</select></label>
      <label><span>${platformText("buildGpu")}</span><select id="buildGpu">${GPU_PRESETS.filter((item) => item.id !== "custom").map((item) => `<option value="${platformEscape(item.id)}" ${item.id === gpu.id ? "selected" : ""}>${platformEscape(shortGpuName(item.name))}</option>`).join("")}</select></label>
      <label><span>${platformText("cpuProfile")}</span><select id="buildCpuProfile">${SYSTEM_CPU_PROFILES.map((item) => `<option value="${item.id}" ${item.id === cpu.id ? "selected" : ""}>${platformEscape(item[uiLanguage === "en" ? "en" : "ko"])} · ${item.tdpW}W</option>`).join("")}</select></label>
      <label><span>${platformText("systemRam")} (GB)</span><input id="buildRamGb" type="number" min="8" max="2048" step="8" value="${buildValues.ramGb}"></label>
      <label><span>${platformText("psuCapacity")} (W)</span><input id="buildPsuW" type="number" min="100" max="3000" step="50" value="${buildValues.psuW}"></label>
      <label><span>${platformText("caseClearance")} (mm)</span><input id="buildCaseClearance" type="number" min="100" max="1000" step="1" value="${buildValues.caseClearanceMm}"></label>
      <label><span>${platformText("gpuLength")} (mm)</span><input id="buildGpuLength" type="number" min="0" max="1000" step="1" value="${buildValues.gpuLengthMm}"></label>
    </div>
    <fieldset class="build-price-fieldset">
      <legend>${platformText("componentPrices")}</legend>
      <div class="build-price-grid">
        ${[
          ["buildGpuPrice", "gpuPrice", prices.gpu],
          ["buildCpuPrice", "cpuPrice", prices.cpu],
          ["buildMotherboardPrice", "motherboardPrice", prices.motherboard],
          ["buildRamPrice", "ramPrice", prices.ram],
          ["buildPsuPrice", "psuPrice", prices.psu],
          ["buildCasePrice", "casePrice", prices.case],
          ["buildStoragePrice", "storagePrice", prices.storage],
          ["buildOtherPrice", "otherPrice", prices.other],
        ].map(([id, key, value]) => `<label><span>${platformText(key)}</span><input id="${id}" type="number" min="0" max="1000000" step="10" value="${value}"></label>`).join("")}
      </div>
      <small>${platformText("referencePriceNote")}</small>
    </fieldset>
    <div class="build-verdict is-${result.verdict}">
      <div><span>${platformText("buildResult")}</span><strong>${platformText(result.verdict)}</strong><small>${platformEscape(model.name)} · ${platformEscape(shortGpuName(gpu.name))} · ${estimate.grade}</small></div>
      <div><span>VRAM</span><strong>${formatGb(result.requiredGb)} / ${formatGb(gpu.gpuUsableMemoryGb || gpu.vram)}</strong><small>${result.offloadGb > 0 ? `CPU offload ${formatGb(result.offloadGb)}` : platformText("runnable")}</small></div>
      <div><span>${platformText("recommendedRam")}</span><strong>${result.recommendedRamGb} GB</strong><small>${buildValues.ramGb} GB ${result.ramFits ? "✓" : "!"}</small></div>
      <div><span>${platformText("recommendedPsu")}</span><strong>${result.recommendedPsuW} W</strong><small>${buildValues.psuW} W ${result.psuFits ? "✓" : "!"}</small></div>
      <div><span>${platformText("totalPrice")}</span><strong>${formatPlatformMoney(result.totalPriceUsd, currency, rate)}</strong><small>$${result.totalPriceUsd.toLocaleString("en-US")}</small></div>
    </div>
    <div class="build-priority">
      <h3>${platformText("upgradePriority")}</h3>
      <ol>${result.priorities.map((item) => `<li class="priority-${item.severity}"><strong>${platformText(priorityLabels[item.id])}</strong><span>${platformText(item.reasonKey)}</span></li>`).join("")}</ol>
    </div>`;
}

function renderLaunchHub() {
  const runtime = platformLaunchState.runtime;
  const platform = platformLaunchState.platform;
  const recipe = generateLaunchRecipe({ runtime, platform });
  return `
    <p>${platformText("launchIntro")}</p>
    <div class="launch-controls">
      <label><span>${platformText("runtime")}</span><select id="launchRuntime">
        <option value="ollama" ${runtime === "ollama" ? "selected" : ""}>Ollama</option>
        <option value="llamacpp" ${runtime === "llamacpp" ? "selected" : ""}>llama.cpp</option>
        <option value="vllm" ${runtime === "vllm" ? "selected" : ""}>vLLM</option>
        <option value="docker" ${runtime === "docker" ? "selected" : ""}>Docker Compose</option>
      </select></label>
      <label><span>${platformText("platform")}</span><select id="launchPlatform">
        <option value="windows" ${platform === "windows" ? "selected" : ""}>Windows PowerShell</option>
        <option value="linux" ${platform === "linux" ? "selected" : ""}>Linux / macOS</option>
      </select></label>
    </div>
    <div class="launch-output">
      <div><strong>${platformEscape(recipe.filename)}</strong><span><button class="ghost-button" data-copy-recipe>${platformText("copy")}</button><button class="ghost-button" data-download-recipe>${platformText("download")}</button></span></div>
      <pre tabindex="0"><code id="launchRecipeContent">${platformEscape(recipe.content)}</code></pre>
      ${recipe.command !== recipe.content ? `<pre tabindex="0"><code>${platformEscape(recipe.command)}</code></pre>` : ""}
    </div>`;
}

function renderDecisionHub() {
  const panel = ensureDecisionHub();
  $("decisionHubTitle").textContent = platformText("hub");
  $("decisionHubNote").textContent = platformText("hubNote");
  const tabs = [
    ["reliability", "reliability"],
    ["benchmark", "benchmark"],
    ["detail", "detail"],
    ["purchase", "purchase"],
    ["build", "build"],
    ["launch", "launch"],
  ];
  panel.querySelector(".decision-hub-tabs").innerHTML = tabs.map(([id, key]) =>
    `<button type="button" role="tab" data-platform-tab="${id}" aria-selected="${platformActiveTab === id}" class="${platformActiveTab === id ? "is-active" : ""}">${platformText(key)}</button>`
  ).join("");
  const renderers = {
    reliability: renderReliabilityHub,
    benchmark: renderBenchmarkV2Hub,
    detail: renderDetailHub,
    purchase: renderPurchaseHub,
    build: renderBuildHub,
    launch: renderLaunchHub,
  };
  $("decisionHubBody").innerHTML = renderers[platformActiveTab]();
  bindDecisionHubControls();
}

function downloadPlatformText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function syncPlatformBuildUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("hub", "build");
  url.searchParams.set("build", JSON.stringify(platformBuildState));
  window.history.replaceState({}, "", url);
}

function bindDecisionHubControls() {
  document.querySelectorAll("[data-platform-tab]").forEach((button) => button.addEventListener("click", () => {
    platformActiveTab = button.dataset.platformTab;
    const url = new URL(window.location.href);
    url.searchParams.set("hub", platformActiveTab);
    history.replaceState({}, "", url);
    renderDecisionHub();
  }));
  $("platformBenchmarkSearch")?.addEventListener("input", (event) => {
    platformBenchmarkQuery = event.target.value;
    renderDecisionHub();
    $("platformBenchmarkSearch")?.focus();
  });
  $("platformMeasuredOnly")?.addEventListener("change", (event) => {
    platformBenchmarkMeasuredOnly = event.target.checked;
    renderDecisionHub();
  });
  $("platformBenchmarkSort")?.addEventListener("change", (event) => {
    platformBenchmarkSort = event.target.value;
    renderDecisionHub();
  });
  document.querySelectorAll("[data-copy-deep-link]").forEach((button) => button.addEventListener("click", async () => {
    await copyTextToClipboard(button.dataset.copyDeepLink, button);
    button.textContent = platformText("copied");
  }));
  const purchaseFields = {
    purchaseCurrency: ["currency", String],
    purchaseTargetGpu: ["targetGpuId", String],
    purchaseExchangeRate: ["rate", Number],
    purchaseNewPrice: ["newPrice", Number],
    purchaseUsedPrice: ["usedPrice", Number],
    purchaseCurrentResale: ["resale", Number],
    purchaseYears: ["years", Number],
    purchaseHours: ["hours", Number],
    purchaseElectricity: ["electricity", Number],
  };
  Object.entries(purchaseFields).forEach(([id, [key, convert]]) => $(id)?.addEventListener("change", (event) => {
    platformPurchaseState[key] = convert(event.target.value);
    renderDecisionHub();
  }));
  $("launchRuntime")?.addEventListener("change", (event) => {
    platformLaunchState.runtime = event.target.value;
    renderDecisionHub();
  });
  $("launchPlatform")?.addEventListener("change", (event) => {
    platformLaunchState.platform = event.target.value;
    renderDecisionHub();
  });
  const buildFields = {
    buildModel: ["modelKey", String],
    buildGpu: ["gpuId", String],
    buildCpuProfile: ["cpuProfileId", String],
    buildRamGb: ["ramGb", Number],
    buildPsuW: ["psuW", Number],
    buildCaseClearance: ["caseClearanceMm", Number],
    buildGpuLength: ["gpuLengthMm", Number],
    buildGpuPrice: ["gpuPrice", Number],
    buildCpuPrice: ["cpuPrice", Number],
    buildMotherboardPrice: ["motherboardPrice", Number],
    buildRamPrice: ["ramPrice", Number],
    buildPsuPrice: ["psuPrice", Number],
    buildCasePrice: ["casePrice", Number],
    buildStoragePrice: ["storagePrice", Number],
    buildOtherPrice: ["otherPrice", Number],
  };
  Object.entries(buildFields).forEach(([id, [key, convert]]) => $(id)?.addEventListener("change", (event) => {
    platformBuildState[key] = convert(event.target.value);
    syncPlatformBuildUrl();
    renderDecisionHub();
  }));
  document.querySelector("[data-copy-recipe]")?.addEventListener("click", (event) => copyTextToClipboard($("launchRecipeContent")?.textContent || "", event.currentTarget));
  document.querySelector("[data-download-recipe]")?.addEventListener("click", () => {
    const runtime = $("launchRuntime")?.value || "ollama";
    const platform = $("launchPlatform")?.value || "windows";
    const recipe = generateLaunchRecipe({ runtime, platform });
    downloadPlatformText(recipe.filename, recipe.content);
  });
}

function applyPlatformDeepLink() {
  const params = new URL(window.location.href).searchParams;
  const value = (key) => params.get(key) || PLATFORM_V2_INITIAL_PARAMS.get(key);
  const hub = value("hub");
  if (["reliability", "benchmark", "detail", "purchase", "build", "launch"].includes(hub)) platformActiveTab = hub;
  const buildState = value("build");
  if (buildState) {
    try {
      const parsed = JSON.parse(buildState);
      if (parsed && typeof parsed === "object") {
        const safe = {};
        ["modelKey", "gpuId", "cpuProfileId"].forEach((key) => {
          if (typeof parsed[key] === "string" && parsed[key].length <= 200) safe[key] = parsed[key];
        });
        ["ramGb", "psuW", "caseClearanceMm", "gpuLengthMm", "gpuPrice", "cpuPrice", "motherboardPrice", "ramPrice", "psuPrice", "casePrice", "storagePrice", "otherPrice"].forEach((key) => {
          if (Number.isFinite(Number(parsed[key]))) safe[key] = Number(parsed[key]);
        });
        platformBuildState = { ...platformBuildState, ...safe };
      }
    } catch {}
  }
  const view = value("detail");
  if (view === "gpu" && value("gpu")) selectPrimaryGpu(value("gpu"), { persist: false });
  if (view === "model" && value("model")) {
    const model = getModelByKey(value("model"));
    if (model) {
      selectedModelKey = modelKey(model);
      if ($("advisorModel")) $("advisorModel").value = selectedModelKey;
    }
  }
}

function auditPlatformAccessibility(root = document) {
  const issues = [];
  root.querySelectorAll("button").forEach((button) => {
    if (!button.textContent.trim() && !button.getAttribute("aria-label")) issues.push("button-name");
  });
  root.querySelectorAll("img").forEach((image) => {
    if (!image.hasAttribute("alt")) issues.push("image-alt");
  });
  root.querySelectorAll("input, select").forEach((control) => {
    if (!control.id) return;
    const label = root.querySelector(`label[for="${control.id.replace(/["\\]/g, "\\$&")}"]`) || control.closest("label");
    if (!label && !control.getAttribute("aria-label")) issues.push(`field-label:${control.id}`);
  });
  return [...new Set(issues)];
}

function initPlatformV2() {
  applyPlatformDeepLink();
  renderDecisionHub();
  window.addEventListener("languagechange", renderDecisionHub);
  document.querySelector("[data-language-toggle]")?.addEventListener("click", () => queueMicrotask(renderDecisionHub));
  ["gpuPreset", "advisorModel", "contextSize", "gpuCount"].forEach((id) => $(id)?.addEventListener("change", renderDecisionHub));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPlatformV2);
} else {
  initPlatformV2();
}
