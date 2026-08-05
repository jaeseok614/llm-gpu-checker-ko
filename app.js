const DATA = window.LLM_GPU_CHECKER_DATA || {};
const GPU_PRESETS = (DATA.gpus || []).map(normalizeGpuPreset);
const ONBOARDING_QUICK_GPU_IDS = [
  "rtx5090-32",
  "rtx4090-24",
  "rtx4080super-16",
  "rtx4070tisuper-16",
  "rtx4060ti-16",
  "rtx3090-24",
  "rtx3060-12",
  "rx7900xtx-24",
];
const QUANTS = DATA.quantizations || [];
const MODEL_METADATA = DATA.modelMetadata || {};
const LICENSE_POLICIES = DATA.licensePolicies || {};
const MODEL_LICENSE_POLICIES = DATA.modelLicensePolicies || {};
const LICENSE_META = DATA.licenseMeta || {};
const GENERATIVE_MODELS = (DATA.models || []).map((model) => withModelMetadata(model, "generative"));
const EMBEDDING_MODELS = (DATA.embeddingModels || []).map((model) => withModelMetadata(model, "embedding"));
const RERANKER_MODELS = (DATA.rerankerModels || []).map((model) => withModelMetadata(model, "reranker"));
const OCR_MODELS = (DATA.ocrModels || []).map((model) => withModelMetadata(model, model.type || "ocr-pipeline"));
const IMAGE_GENERATION_MODELS = OCR_MODELS.filter((model) => model.type === "image-generation");
const VIDEO_GENERATION_MODELS = OCR_MODELS.filter((model) => model.type === "video-generation");
const AVATAR_GENERATION_MODELS = OCR_MODELS.filter((model) => model.type === "avatar-generation");
const AUDIO_MODELS = (DATA.audioModels || []).map((model) => withModelMetadata(model, model.type));
const AUDIO_STT_MODELS = AUDIO_MODELS.filter((model) => model.type === "audio-stt");
const AUDIO_TTS_MODELS = AUDIO_MODELS.filter((model) => model.type === "audio-tts");
const ENCODER_PRECISIONS = DATA.precisions?.encoder || [];
const OCR_PRECISIONS = DATA.precisions?.ocr || [];
const ENCODER_RUNTIME_PROFILES = DATA.encoderRuntimeProfiles || {};
const OCR_RESOLUTION_PRESETS = DATA.ocrResolutionPresets || {};
const BENCHMARKS = DATA.benchmarks || [];
const BENCHMARK_META = DATA.benchmarkMeta || {};
const DATA_UPDATED_AT = BENCHMARK_META.updatedAt || "2026-07-23";
const HF_MODEL_STORAGE_KEY = "llm-gpu-checker-hf-models-v1";
const PRIMARY_GPU_STORAGE_KEY = "ai-hardware-fit-primary-gpu-v1";
const MAX_IMPORTED_HF_MODELS = 20;
const VISION_MODEL_TYPES = new Set(["ocr-pipeline", "ocr-vlm", "document-vlm", "general-vlm", "image-generation", "video-generation", "avatar-generation"]);
const VISION_WORKLOADS = new Set(["ocrPipeline", "documentVlm", "generalVlm", "imageGeneration", "videoGeneration", "avatarGeneration"]);
const WORKLOAD_ALIASES = { ocr: "ocrPipeline" };
const OCR_PIPELINE_MODELS = OCR_MODELS.filter((model) => model.type === "ocr-pipeline");
const DOCUMENT_VLM_MODELS = OCR_MODELS.filter((model) => model.type === "ocr-vlm" || model.type === "document-vlm");
const GENERAL_VLM_MODELS = OCR_MODELS.filter((model) => model.type === "general-vlm");

function withModelMetadata(model, type) {
  const metadata = MODEL_METADATA[`${type}:${model.name}`] || MODEL_METADATA[model.name] || {};
  const capabilities = DATA.modelCapabilities?.[`${type}:${model.name}`] || {
    useCases: [],
    languages: ["unknown"],
    inputModality: [],
    outputModality: [],
    qualityTier: "unknown",
    latencyTier: "unknown",
    supports: [],
  };
  return {
    maker: model.maker || model.provider || "",
    ...model,
    ...metadata,
    tags: Array.isArray(metadata.tags) ? metadata.tags : Array.isArray(model.tags) ? model.tags : [],
    capabilities,
    type,
  };
}

function normalizeGpuPreset(gpu) {
  const text = `${gpu.id || ""} ${gpu.name || ""}`.toLowerCase();
  const vendor = gpu.vendor || (
    /nvidia|geforce|quadro|tesla|rtx|gtx|dgx|h100|a100/.test(text) ? "NVIDIA"
      : /amd|radeon|ryzen|instinct|mi\d/.test(text) ? "AMD"
        : /apple|m\d(?:max|ultra)/.test(text) ? "Apple"
          : /intel|arc|flex/.test(text) ? "Intel"
            : "기타"
  );
  const memoryType = gpu.memoryType || (/통합메모리|unified|ryzen-ai|max-plus/.test(text) ? "unified" : "dedicated");
  const runtimeDefaults = vendor === "NVIDIA"
    ? ["CUDA"]
    : vendor === "AMD"
      ? (memoryType === "unified" ? ["Vulkan", "DirectML", "ROCm 확인"] : ["ROCm", "Vulkan"])
      : vendor === "Apple"
        ? ["Metal", "MLX"]
        : vendor === "Intel"
          ? ["OpenVINO", "oneAPI"]
          : [];
  return {
    aliases: [],
    vendor,
    memoryType,
    runtimes: runtimeDefaults,
    gpuUsableMemoryGb: gpu.vram,
    verifiedAt: gpu.verifiedAt || "2026-07-30",
    ...gpu,
  };
}

const GPU_MARKET_REFERENCE = {
  "rtx5090-32": [1999, 575], "rtx5080-16": [999, 360], "rtx5070ti-16": [749, 300],
  "rtx5070-12": [549, 250], "rtx5060ti-16": [429, 180], "rtx5060ti-8": [379, 180],
  "rtx5060-8": [299, 145], "rtx4090-24": [1599, 450], "rtx4080super-16": [999, 320],
  "rtx4070tisuper-16": [799, 285], "rtx4070super-12": [599, 220], "rtx4060ti-16": [499, 165],
  "rtx4060-8": [299, 115], "rtx3090-24": [1499, 350], "rtx3060-12": [329, 170],
  "rx9070xt-16": [599, 304], "rx9070-16": [549, 220], "rx7900xtx-24": [999, 355],
  "rx7900xt-20": [899, 315], "rx7800xt-16": [499, 263], "arcb580-12": [249, 190],
  "arcb570-10": [219, 150], "arca770-16": [349, 225],
};

function gpuMarketReference(gpu) {
  const [price, power] = GPU_MARKET_REFERENCE[gpu.id] || [];
  const memory = Number(gpu.gpuUsableMemoryGb || gpu.vram || 8);
  const inferredPrice = Math.round(Math.max(
    gpu.formFactor === "datacenter" ? 2500 : 149,
    memory * (gpu.formFactor === "datacenter" ? 185 : 52) + Number(gpu.bandwidth || 0) * 0.28,
  ) / 10) * 10;
  return {
    priceUsd: gpu.msrpUsd || price || inferredPrice,
    priceKind: gpu.msrpUsd || price ? "launch-reference" : "calculated-reference",
    powerW: gpu.tbpW || gpu.tgpReferenceW || power || Math.round(Math.max(75, gpu.bandwidth * 0.38)),
  };
}

function gpuEvidenceLabel(gpu, en = uiLanguage === "en") {
  if (gpu.sourceUrl && gpu.specStatus === "sourced") return en ? "Official/source-linked spec" : "공식·출처 연결 사양";
  if (gpu.sourceUrl && (gpu.specStatus === "family" || gpu.sourceScope === "family")) return en ? "Official product-family source · model details need review" : "제조사 공식 제품군 출처·개별 사양 검토 필요";
  if (gpu.sourceUrl) return en ? "Catalog source · review date recorded" : "카탈로그 출처·검증일 기록";
  if (gpu.verifiedAt) return en ? `Catalog estimate · checked ${gpu.verifiedAt}` : `카탈로그 추정·${gpu.verifiedAt} 확인`;
  return en ? "Calculated estimate · source needed" : "계산 추정·출처 보강 필요";
}

function getLicensePolicy(modelOrLicense) {
  const model = typeof modelOrLicense === "string" ? null : modelOrLicense;
  const license = typeof modelOrLicense === "string" ? modelOrLicense : modelOrLicense?.license;
  return MODEL_LICENSE_POLICIES[model?.name] || LICENSE_POLICIES[license] || {
    commercialUse: "review",
    commercialLabel: "약관 확인 필요",
    opennessLabel: "공개 범위 확인 필요",
    summary: "등록된 한국어 요약이 없습니다. 해당 모델 카드의 최신 LICENSE를 직접 확인하세요.",
    sourceUrl: model?.sourceUrl || "",
  };
}

const MODEL_GROUPS = {
  generative: GENERATIVE_MODELS,
  embedding: EMBEDDING_MODELS,
  reranker: RERANKER_MODELS,
  ocrPipeline: OCR_PIPELINE_MODELS,
  documentVlm: DOCUMENT_VLM_MODELS,
  generalVlm: GENERAL_VLM_MODELS,
  imageGeneration: IMAGE_GENERATION_MODELS,
  videoGeneration: VIDEO_GENERATION_MODELS,
  avatarGeneration: AVATAR_GENERATION_MODELS,
  audioStt: AUDIO_STT_MODELS,
  audioTts: AUDIO_TTS_MODELS,
};

const WORKLOAD_META = {
  generative: {
    label: "생성형 LLM",
    statusLabel: "LLM",
    modelCountLabel: "LLM 모델",
    searchPlaceholder: "모델명, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "권장 설정", "계산 VRAM", "추정 속도", "CTX", ""],
  },
  embedding: {
    label: "임베딩",
    statusLabel: "임베딩",
    modelCountLabel: "임베딩 모델",
    searchPlaceholder: "임베딩 모델명, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "정밀도/런타임", "계산 VRAM", "추정 처리량", "입력", ""],
  },
  reranker: {
    label: "리랭커",
    statusLabel: "리랭커",
    modelCountLabel: "리랭커 모델",
    searchPlaceholder: "리랭커 모델명, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "정밀도/런타임", "계산 VRAM", "추정 처리량", "입력", ""],
  },
  ocrPipeline: {
    label: "OCR",
    statusLabel: "OCR",
    modelCountLabel: "OCR 모델",
    searchPlaceholder: "OCR 파이프라인, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "정밀도/기능", "계산 VRAM", "추정 처리량", "이미지", ""],
  },
  documentVlm: {
    label: "문서 VLM",
    statusLabel: "문서 VLM",
    modelCountLabel: "문서 VLM 모델",
    searchPlaceholder: "문서 VLM, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "정밀도/기능", "계산 VRAM", "추정 처리량", "이미지", ""],
  },
  generalVlm: {
    label: "범용 VLM",
    statusLabel: "범용 VLM",
    modelCountLabel: "범용 VLM 모델",
    searchPlaceholder: "범용 VLM, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "정밀도/기능", "계산 VRAM", "추정 처리량", "이미지", ""],
  },
  imageGeneration: {
    label: "이미지 생성",
    statusLabel: "이미지",
    modelCountLabel: "이미지 생성 모델",
    searchPlaceholder: "이미지 생성 모델, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "정밀도/설정", "계산 VRAM", "추정 생성 속도", "해상도", ""],
  },
  videoGeneration: {
    label: "비디오 생성",
    statusLabel: "비디오",
    modelCountLabel: "비디오 생성 모델",
    searchPlaceholder: "비디오 생성 모델, 제조사, 태그 검색",
    listHeaders: ["상태", "모델", "출시/세대", "대표 공개 평가", "공급사/라이선스", "정밀도/설정", "계산 VRAM", "추정 생성 속도", "해상도", ""],
  },
  avatarGeneration: {
    label: "아바타·립싱크",
    statusLabel: "아바타",
    modelCountLabel: "아바타·립싱크 모델",
    searchPlaceholder: "아바타, 립싱크, talking-head 모델 검색",
    listHeaders: ["상태", "모델", "출시/세대", "요약", "공급사/라이선스", "정밀도/설정", "계산 VRAM", "추정 처리 속도", "해상도", ""],
  },
  audioStt: {
    label: "음성 인식",
    statusLabel: "STT",
    modelCountLabel: "음성 인식 모델",
    searchPlaceholder: "STT 모델, 제공자, 언어 검색",
    listHeaders: ["상태", "모델", "출시/언어", "요약", "제공자·라이선스", "정밀도", "계산 VRAM", "실시간 배속", "오디오", ""],
  },
  audioTts: {
    label: "음성 합성",
    statusLabel: "TTS",
    modelCountLabel: "음성 합성 모델",
    searchPlaceholder: "TTS 모델, 제공자, 언어 검색",
    listHeaders: ["상태", "모델", "출시/언어", "요약", "제공자·라이선스", "정밀도", "계산 VRAM", "실시간 배속", "오디오", ""],
  },
};

function getSimplePurposeOptions(workload = activeWorkload) {
  return window.AIHardwareQuickRecommendation?.getOptions(workload) || [];
}

function refreshSimplePurposeOptions(preferredValue = $("simplePurpose")?.value) {
  const select = $("simplePurpose");
  if (!select) return;
  const options = getSimplePurposeOptions();
  select.innerHTML = options
    .map((option) => `<option value="${escapeAttr(option.id)}">${escapeHtml(option[uiLanguage] || option.ko)}</option>`)
    .join("");
  select.value = options.some((option) => option.id === preferredValue) ? preferredValue : options[0].id;
  select.dataset.workload = activeWorkload;
}

const GRADE_META = {
  S: { label: "쾌적", className: "grade-s", score: 5, color: "#237655" },
  A: { label: "잘 돌아감", className: "grade-a", score: 4, color: "#2f6687" },
  B: { label: "가능", className: "grade-b", score: 3, color: "#5f6472" },
  C: { label: "빡빡함", className: "grade-c", score: 2, color: "#91621c" },
  D: { label: "오프로딩", className: "grade-d", score: 1, color: "#91621c" },
  F: { label: "부적합", className: "grade-f", score: 0, color: "#a53a3a" },
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

let activeWorkload = "generative";
let activeSummaryFilter = "all";
let selectedModelKey = "";
// Which quick-recommend card is shown in the dedicated compact inspector.
// This stays separate from selectedModelKey so opening a quick pick never
// disturbs the full-catalog detail state or reflows the three recommendation
// cards.
let simpleExpandedKey = "";
let viewMode = "list";
let settingsExpanded = false;
let compareKeys = [];
let compareModalOpen = false;
let dialogReturnFocus = null;
const MAX_COMPARE_MODELS = 4;
let benchmarkSearchQuery = "";
let benchmarkCompareKeys = [];
const MAX_BENCHMARK_COMPARE = 6;
let appMode = "simple";
let coreTaskMode = "finder";
let hasPrimaryGpuSelection = false;
let uiLanguage = "ko";
let uiTheme = "light";
let gpuCompareOpen = false;

const $ = (id) => document.getElementById(id);

function getStoredPrimaryGpuId() {
  try {
    const id = window.localStorage?.getItem(PRIMARY_GPU_STORAGE_KEY) || "";
    return GPU_PRESETS.some((gpu) => gpu.id === id && gpu.id !== "custom") ? id : "";
  } catch {
    return "";
  }
}

function rememberPrimaryGpuId(id) {
  try {
    if (id && id !== "custom" && GPU_PRESETS.some((gpu) => gpu.id === id)) {
      window.localStorage?.setItem(PRIMARY_GPU_STORAGE_KEY, id);
    } else {
      window.localStorage?.removeItem(PRIMARY_GPU_STORAGE_KEY);
    }
  } catch {
    // 저장소를 사용할 수 없어도 현재 세션의 계산은 그대로 동작합니다.
  }
}

function selectPrimaryGpu(id, { persist = false } = {}) {
  const preset = GPU_PRESETS.find((gpu) => gpu.id === id);
  if (!preset) {
    hasPrimaryGpuSelection = false;
    $("gpuPreset").value = "";
    if (persist) rememberPrimaryGpuId("");
    return false;
  }

  applyPreset(preset.id);
  hasPrimaryGpuSelection = true;
  if (persist) rememberPrimaryGpuId(preset.id);
  return true;
}

function focusPrimaryGpuSelector() {
  $("gpuPreset")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  $("gpuPreset")?.focus();
}

function selectOnboardingGpu(id) {
  const preset = GPU_PRESETS.find((gpu) => gpu.id === id);
  if (!preset) return;
  $("gpuPreset").value = preset.id;
  selectPrimaryGpu(preset.id, { persist: true });
  refreshSecondaryGpuUi();
  render();
}

function setAppMode(mode) {
  if (mode !== "simple" && mode !== "expert") return;
  coreTaskMode = "finder";
  appMode = mode;
  if (mode !== "simple") simpleExpandedKey = "";
  refreshCoreTaskUi();
  refreshAppModeUi();
  render();
  const panel = mode === "simple" ? $("simpleModePanel") : $("expertModeSection");
  window.requestAnimationFrame?.(() => panel?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
}

function refreshCoreTaskUi() {
  const placementActive = coreTaskMode === "placement";
  const modelFinderActive = coreTaskMode === "modelFinder";
  const infraActive = coreTaskMode === "infra";
  const communityActive = coreTaskMode === "community";
  document.body.classList.toggle("placement-task-active", placementActive);
  document.body.classList.toggle("finder-task-active", coreTaskMode === "finder");
  document.body.classList.toggle("model-finder-task-active", modelFinderActive);
  document.body.classList.toggle("infra-task-active", infraActive);
  document.body.classList.toggle("community-task-active", communityActive);
  document.querySelectorAll("[data-core-task]").forEach((button) => {
    const active = button.dataset.coreTask === coreTaskMode;
    button.classList.toggle("is-active", active);
    if (button.closest("[role='tablist']")) button.setAttribute("aria-selected", String(active));
  });
  const finderButton = document.querySelector('.core-task-actions [data-core-task="finder"]');
  if (finderButton) {
    finderButton.querySelector("span").textContent = uiText("core.finder.title");
    finderButton.querySelector("small").textContent = uiText("core.finder.note");
    finderButton.querySelector("em").textContent = uiText("core.finder.time");
  }
  const modelFinderButton = document.querySelector('[data-core-task="modelFinder"]');
  if (modelFinderButton) {
    modelFinderButton.querySelector("span").textContent = uiText("core.modelFinder.title");
    modelFinderButton.querySelector("small").textContent = uiText("core.modelFinder.note");
    modelFinderButton.querySelector("em").textContent = uiText("core.modelFinder.time");
  }
    const infraButton = document.querySelector('[data-core-task="infra"]');
  if (infraButton) {
    infraButton.querySelector("span").textContent = uiText("core.infra.title");
      infraButton.querySelector("small").textContent = uiText("core.infra.note");
      infraButton.querySelector("em").textContent = uiText("core.infra.time");
    }
    const placementButton = document.querySelector('[data-core-task="placement"]');
    if (placementButton) {
      placementButton.querySelector("span").textContent = uiText("core.placement.title");
      placementButton.querySelector("small").textContent = uiText("core.placement.note");
    }
    const communityButton = document.querySelector('[data-core-task="community"]');
    if (communityButton) {
      communityButton.querySelector("span").textContent = uiText("core.community.title");
      communityButton.querySelector("small").textContent = uiText("core.community.note");
      communityButton.querySelector("em").textContent = uiText("core.community.time");
    }
  const sttTab = document.querySelector('[data-workload-tab="audioStt"]');
  const ttsTab = document.querySelector('[data-workload-tab="audioTts"]');
  const avatarTab = document.querySelector('[data-workload-tab="avatarGeneration"]');
  if (sttTab) sttTab.textContent = uiText("workload.audioStt");
  if (ttsTab) ttsTab.textContent = uiText("workload.audioTts");
  if (avatarTab) avatarTab.textContent = uiText("workload.avatarGeneration");
  if ($("gpuPlacementPanel")) $("gpuPlacementPanel").hidden = !placementActive;
  if ($("decisionStudio")) $("decisionStudio").hidden = !infraActive;
  window.AIHardwareWorkspace?.apply(coreTaskMode);
  window.AIHardwareGuide?.render(
    coreTaskMode,
    coreTaskMode === "finder" && hasPrimaryGpuSelection ? (appMode === "expert" ? 2 : 1) : 0,
  );
}

function seedPlacementInventoryFromCurrentHardware() {
  if (!hasPrimaryGpuSelection || placementInventorySeeded) return;
  const primaryId = $("gpuPreset")?.value;
  if (!GPU_PRESETS.some((gpu) => gpu.id === primaryId && gpu.id !== "custom")) return;
  const rows = [{
    id: "gpu-row-1",
    presetId: primaryId,
    count: clampNumber($("gpuCount")?.value, 1, 8, 1),
  }];
  const secondaryId = $("secondaryGpuPreset")?.value;
  if (secondaryId && secondaryId !== "none" && GPU_PRESETS.some((gpu) => gpu.id === secondaryId)) {
    rows.push({
      id: "gpu-row-2",
      presetId: secondaryId,
      count: clampNumber($("secondaryGpuCount")?.value, 1, 8, 1),
    });
  }
  gpuInventoryRows = rows;
  gpuInventoryIdCounter = rows.length;
  placementInventorySeeded = true;
}

function openPlacementPlanner(modelKeys = [], { showBuilder = false, seedHardware = true } = {}) {
  if (seedHardware) seedPlacementInventoryFromCurrentHardware();
  let selectionChanged = false;
  modelKeys.filter((key) => getModelByKey(key)).forEach((key) => {
    if (!placementSelectedKeys.has(key)) selectionChanged = true;
    placementSelectedKeys.add(key);
    getPlacementModelConfig(key);
  });
  if (selectionChanged) clearPlacementResults();
  if (showBuilder || modelKeys.length || placementSelectedKeys.size) placementBuilderStarted = true;
  coreTaskMode = "placement";
  selectedModelKey = "";
  simpleExpandedKey = "";
  compareModalOpen = false;
  renderGpuInventory();
  renderPlacementModelList();
  renderPlacementSelectedChips();
  renderPlacementPrimarySelect();
  refreshCoreTaskUi();
  render();
  const panel = $("gpuPlacementPanel");
  if (typeof panel?.scrollIntoView === "function") panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setCoreTaskMode(mode) {
  if (mode === "placement") {
    openPlacementPlanner([], { showBuilder: false, seedHardware: true });
    return;
  }
  coreTaskMode = mode === "modelFinder" || mode === "infra" || mode === "community" ? mode : "finder";
  refreshCoreTaskUi();
  render();
  if (coreTaskMode === "infra" && typeof renderDecisionStudio === "function") renderDecisionStudio();
  if (coreTaskMode === "modelFinder") $("gpuAdvisorPanel")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  if (coreTaskMode === "infra") $("decisionStudio")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  if (coreTaskMode === "community") $("benchmarkDashboard")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

// 커뮤니티 제보 패널이 다른 모드에서는 숨겨져 있어(styles.css
// body.community-task-active 참고), 모델 상세의 "결과 JSON 붙여넣기" 같은
// 버튼(features/community-feedback.js)이 이 패널로 스크롤하기 전에 먼저
// community 모드로 전환할 수 있도록 별도 모듈에서 호출 가능한 진입점을 둔다.
window.AIHardwareCore = { setCoreTaskMode };

function setUiLanguage(language) {
  uiLanguage = language === "en" ? "en" : "ko";
  try { window.localStorage?.setItem("ai-hardware-fit-language", uiLanguage); } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("lang", uiLanguage);
  window.history.replaceState({}, "", url);
  document.documentElement.lang = uiLanguage;
  syncAdvisorCurrencyInputs();
  applyV15Translations();
  const dictionary = UI_TRANSLATIONS[uiLanguage];
  const selectors = [".header-nav a", ".eyebrow", "h1", "#settingsToggle", "#simpleOpenExpert", "[data-share-link]", "[data-download-share-card]", "[data-share-3060]", ".primary-gpu-control > .field > span", ".section-kicker"];
  document.querySelectorAll(selectors.join(",")).forEach((node) => {
    const source = node.dataset.i18nSource || node.textContent.trim();
    node.dataset.i18nSource = source;
    node.textContent = uiLanguage === "en" ? (dictionary[source] || source) : source;
  });
  const toggle = document.querySelector("[data-language-toggle]");
  if (toggle) {
    toggle.querySelectorAll("[data-lang]").forEach((button) => {
      const active = button.dataset.lang === uiLanguage;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  // Regenerate language-conditional dynamic text (e.g. the onboarding GPU
  // count hint, and the benchmark chart's metric descriptions/analysis
  // sentences, which are full free-form sentences that a word-by-word
  // dictionary sweep can never translate correctly) BEFORE the dictionary
  // sweep below, so translateDynamicUi only ever sees fully-Korean or
  // fully-English text nodes to swap — never a half-translated leftover
  // from the previous render() call. Calling renderBenchmarkSheet() here
  // (not the full render()) avoids recursing back into setUiLanguage(),
  // since render() itself calls setUiLanguage("en") at its end.
  renderOnboardingQuickPicks();
  renderBenchmarkSheet();
  renderBenchmarkDashboard();
  if (hasPrimaryGpuSelection) {
    const languageHardware = getHardware();
    const languageEstimates = getActiveModels().map((model) => estimateAnyModel(model, languageHardware));
    renderHardware(languageHardware, languageEstimates);
    renderSimpleMode(languageHardware, languageEstimates);
  }
  // Same reasoning for the multi-GPU placement result, its 3-plan comparison,
  // and the run-command/docker-compose export — all free-form sentences (and
  // the export panel's <pre> code blocks) that only re-running the real
  // render functions can translate correctly.
  if ($("gpuPlacementResult")?.innerHTML.trim() && placementSelectedKeys.size) runGpuPlacement();
  else if (!$("gpuPlacementPlanCompare")?.hidden) comparePlacementPlans();
  translatePresetOptionLabels(uiLanguage);
  translateDynamicUi(uiLanguage);
  // The generic sweep intentionally starts from the captured Korean source
  // so a second language switch is reversible. Re-apply keyed copy afterward
  // because these entries (for example "START IN 30 SECONDS") are complete
  // sentence replacements rather than dictionary fragments.
  applyV15Translations();
  // Purpose choices are workload-specific and should not pass through the
  // generic text replacement sweep. Rebuild them in the selected language.
  refreshSimplePurposeOptions();
  // Refresh the theme-toggle button labels ("라이트"/"다크" vs "Light"/"Dark"),
  // which depend on uiLanguage but live outside the dictionary sweep above.
  const themeToggle = document.querySelector("[data-theme-toggle]");
  if (themeToggle) themeToggle.setAttribute("aria-label", uiLanguage === "en" ? "Theme" : "테마 선택");
  const workspaceJourney = $("workspaceJourney");
  if (workspaceJourney) workspaceJourney.setAttribute("aria-label", uiLanguage === "en" ? "Current task progress" : "현재 작업 진행 단계");
  document.querySelectorAll("[data-theme-toggle] [data-theme]").forEach((button) => {
    button.textContent = THEME_TOGGLE_LABELS[button.dataset.theme][uiLanguage];
  });
  // Same deal for the placement-strategy tabs: set explicitly (after the
  // generic sweep above) rather than relying on it, since "모델 수 우선"
  // contains "모델" as a bare substring the sweep would otherwise mangle
  // into "Model 수 우선".
  document.querySelectorAll("[data-placement-strategy]").forEach((button) => {
    button.textContent = PLACEMENT_STRATEGY_LABELS[button.dataset.placementStrategy][uiLanguage];
  });
  // Usage-mode tab labels + hint paragraph, and the primary-model select's
  // placeholder option — same pattern, set explicitly after the sweep.
  document.querySelectorAll("[data-placement-usage]").forEach((button) => {
    button.textContent = PLACEMENT_USAGE_LABELS[button.dataset.placementUsage][uiLanguage];
  });
  const usageHintEl = $("gpuPlacementUsageHint");
  if (usageHintEl) usageHintEl.textContent = PLACEMENT_USAGE_HINTS[placementUsageMode][uiLanguage];
  renderPlacementModelList();
  renderPlacementPrimarySelect();
  renderPlacementSelectedChips();
  renderPlacementWorkspaceUi();
  if (hasPrimaryGpuSelection && $("hardwareCapabilitySummary")) {
    const languageHardware = getHardware();
    const languageEstimates = getActiveModels().map((model) => estimateAnyModel(model, languageHardware));
    renderHardwareCapabilities(languageHardware, languageEstimates);
  }
  if (hasPrimaryGpuSelection) renderGpuAdvisor();
  window.AIHardwareLocalization?.apply(uiLanguage);
  document.dispatchEvent(new CustomEvent("ai-hardware-languagechange", { detail: { language: uiLanguage } }));
}

function restoreUiLanguage() {
  const queryLanguage = new URLSearchParams(window.location.search).get("lang");
  if (queryLanguage === "en" || queryLanguage === "ko") {
    uiLanguage = queryLanguage;
  } else {
    try { uiLanguage = window.localStorage?.getItem("ai-hardware-fit-language") === "en" ? "en" : "ko"; } catch { uiLanguage = "ko"; }
  }
  setUiLanguage(uiLanguage);
}

const THEME_TOGGLE_LABELS = {
  light: { ko: "라이트", en: "Light" },
  dark: { ko: "다크", en: "Dark" },
};

const PLACEMENT_STRATEGY_LABELS = {
  balanced: { ko: "균형 우선", en: "Balanced" },
  compact: { ko: "모델 수 우선", en: "Compact" },
  throughput: { ko: "처리량 우선", en: "Throughput" },
  primary: { ko: "주 모델 우선", en: "Primary model" },
};

const PLACEMENT_USAGE_LABELS = {
  pipeline: { ko: "파이프라인", en: "Pipeline" },
  independent: { ko: "독립 서비스", en: "Independent services" },
  alternate: { ko: "대체 모델(순차 실행)", en: "Alternate (one at a time)" },
};

function setUiTheme(theme) {
  uiTheme = theme === "dark" ? "dark" : "light";
  try { window.localStorage?.setItem("ai-hardware-fit-theme", uiTheme); } catch {}
  if (uiTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const toggle = document.querySelector("[data-theme-toggle]");
  if (toggle) {
    toggle.querySelectorAll("[data-theme]").forEach((button) => {
      const active = button.dataset.theme === uiTheme;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = THEME_TOGGLE_LABELS[button.dataset.theme][uiLanguage];
    });
  }
}

function restoreUiTheme() {
  let storedTheme = null;
  try { storedTheme = window.localStorage?.getItem("ai-hardware-fit-theme"); } catch { storedTheme = null; }
  if (storedTheme === "dark" || storedTheme === "light") {
    setUiTheme(storedTheme);
  } else {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setUiTheme(prefersDark ? "dark" : "light");
  }
}

function refreshAppModeUi() {
  const isSimple = appMode === "simple";
  const finderActive = coreTaskMode === "finder";
  $("simpleModePanel").hidden = !finderActive || !isSimple;
  $("expertModeSection").hidden = !finderActive || isSimple;
  $("calculationBasisStrip").hidden = !finderActive || isSimple;
  // Drives the desktop (>=1536px) split-view layout in styles.css: only the
  // "전체 모델 탐색" (expert) mode gets a fixed right-hand inspector panel
  // beside the model list, and only once a model is actually selected —
  // otherwise the list permanently loses width to an empty placeholder
  // panel, which reads as the whole page being narrower/"cut off" compared
  // to 빠른 추천's full-width layout. Quick-recommend mode keeps the
  // existing fixed-overlay detail drawer untouched.
  document.body.classList.toggle("model-workbench-active", finderActive && !isSimple && Boolean(selectedModelKey));
  document.body.classList.toggle("simple-inspector-active", finderActive && isSimple && Boolean(simpleExpandedKey));
  document.querySelectorAll("[data-app-mode]").forEach((button) => {
    const active = button.dataset.appMode === appMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  const status = $("appModeStatus");
  if (status) {
    const modelCount = hasPrimaryGpuSelection ? getActiveModels().length.toLocaleString(uiLanguage === "en" ? "en-US" : "ko-KR") : "0";
    status.textContent = isSimple
      ? (uiLanguage === "en" ? "Quick view: three recommended models for the selected GPU." : "빠른 추천: 선택한 GPU에 맞는 모델 3개를 보여줍니다.")
      : (uiLanguage === "en" ? `Full catalog: browse and filter ${modelCount} models.` : `전체 모델 탐색: ${modelCount}개 모델을 검색하고 필터링할 수 있습니다.`);
  }
}

function init() {
  restoreUiTheme();
  restoreImportedHfModels();
  ensureGpuAdvisorPanel();
  populateSelects();
  applyUrlState();
  captureStaticTranslationSources();
  restoreUiLanguage();
  bindEvents();
  refreshCoreTaskUi();
  refreshAppModeUi();
  refreshHfImportUi();
  renderGpuInventory();
  renderPlacementModelList();
  renderPlacementSelectedChips();
  renderPlacementPrimarySelect();
  setPlacementUsageMode(placementUsageMode);
  renderPlacementWorkspaceUi();
  render({ syncUrl: false });
  if (placementSelectedKeys.size) {
    placementBuilderStarted = true;
    coreTaskMode = "placement";
    refreshCoreTaskUi();
    renderPlacementWorkspaceUi();
    runGpuPlacement();
  }
}

function populateSelects() {
  $("gpuPreset").innerHTML = [
    `<option value="">GPU를 선택하세요</option>`,
    ...GPU_PRESETS.map(
      (gpu) => `<option value="${escapeAttr(gpu.id)}">${escapeHtml(gpu.name)}</option>`,
    ),
  ].join("");
  $("gpuPreset").value = "";
  $("secondaryGpuPreset").innerHTML = [
    `<option value="none">사용 안 함</option>`,
    ...GPU_PRESETS
      .filter((gpu) => gpu.id !== "custom")
      .map((gpu) => `<option value="${escapeAttr(gpu.id)}">${escapeHtml(gpu.name)}</option>`),
    `<option value="__search__">GPU 모델명 검색</option>`,
  ].join("");
  $("secondaryGpuPreset").value = "none";
  const compareOptions = GPU_PRESETS
    .filter((gpu) => gpu.id !== "custom")
    .map((gpu) => `<option value="${escapeAttr(gpu.id)}">${escapeHtml(gpu.name)}</option>`)
    .join("");
  if ($("compareGpuA")) $("compareGpuA").innerHTML = `<option value="">비교 GPU 선택</option>${compareOptions}`;
  if ($("compareGpuB")) $("compareGpuB").innerHTML = `<option value="">비교 GPU 선택</option>${compareOptions}`;
  if ($("compareGpuC")) $("compareGpuC").innerHTML = `<option value="">비교 GPU 선택</option>${compareOptions}`;
  populateGpuPresetDatalist();
  renderOnboardingQuickPicks();

  $("quantization").innerHTML = QUANTS.map(
    (quant) => `<option value="${escapeAttr(quant.id)}">${escapeHtml(quant.label)}</option>`,
  ).join("");
  $("quantization").value = "auto";

  populatePrecisionSelect("encoderPrecision", ENCODER_PRECISIONS);
  populatePrecisionSelect("rerankerPrecision", ENCODER_PRECISIONS);
  populatePrecisionSelect("ocrPrecision", OCR_PRECISIONS);
  refreshWorkloadUi();
  refreshFilterOptions();

  refreshSecondaryGpuUi();
}

function renderOnboardingQuickPicks() {
  const target = $("onboardingQuickpicks");
  if (!target) return;
  const picks = ONBOARDING_QUICK_GPU_IDS
    .map((id) => GPU_PRESETS.find((gpu) => gpu.id === id))
    .filter(Boolean);
  target.innerHTML = picks
    .map(
      (gpu) => `
        <button type="button" class="onboarding-gpu-card" data-quick-gpu="${escapeAttr(gpu.id)}">
          <strong>${escapeHtml(shortGpuName(gpu.name))}</strong>
          <span>VRAM ${formatGb(gpu.vram)} · ${Math.round(gpu.bandwidth).toLocaleString("ko-KR")} GB/s</span>
        </button>
      `,
    )
    .join("");

  const hint = $("onboardingSearchHint");
  if (hint) {
    const count = GPU_PRESETS.filter((gpu) => gpu.id !== "custom").length;
    hint.textContent = uiLanguage === "en"
      ? `${count} GPU presets available · custom entry supported`
      : `GPU 프리셋 ${count}개 지원 · 직접 입력도 가능`;
  }
}

function populateGpuPresetDatalist() {
  const fixedList = $("gpuFixedPresetOptions");
  if (!fixedList) return;
  fixedList.innerHTML = GPU_PRESETS
    .filter((gpu) => gpu.id !== "custom")
    .map((gpu) => `<option value="${escapeAttr(gpu.name)}"></option>`)
    .join("");
}

function findGpuPresetByName(name, allowCustom = true) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return null;
  const presets = allowCustom ? GPU_PRESETS : GPU_PRESETS.filter((gpu) => gpu.id !== "custom");
  const normalized = normalizeGpuSearchText(trimmed);
  const direct = (
    presets.find((gpu) => gpu.name === trimmed) ||
    presets.find((gpu) => gpu.name.toLowerCase() === trimmed.toLowerCase()) ||
    presets.find((gpu) => [gpu.id, gpu.name, ...(gpu.aliases || [])].some((value) => normalizeGpuSearchText(value) === normalized)) ||
    presets.find((gpu) => [gpu.name, ...(gpu.aliases || [])].some((value) => normalizeGpuSearchText(value).includes(normalized))) ||
    null
  );
  if (direct) return direct;
  return window.AIHardwareCatalogSearch?.search(trimmed, presets, { limit: 1 })[0] || null;
}

function normalizeGpuSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\b(nvidia|amd|intel|apple|geforce|radeon|graphics|gpu)\b/g, "")
    .replace(/[^a-z0-9가-힣]+/g, "");
}

function gpuRequestUrl(name = "") {
  const title = `[GPU] ${String(name || "").trim()}`;
  return `https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml&title=${encodeURIComponent(title)}`;
}

function refreshGpuNotFoundUi(rawValue) {
  const target = $("onboardingGpuNotFound");
  if (!target) return;
  const raw = String(rawValue || "").trim();
  const normalized = normalizeGpuSearchText(raw);
  const exact = GPU_PRESETS.some((gpu) => gpu.id !== "custom"
    && [gpu.id, gpu.name, ...(gpu.aliases || [])].some((value) => normalizeGpuSearchText(value) === normalized));
  const missing = raw.length >= 2 && !exact;
  target.hidden = !missing;
  const requestLink = target.querySelector("[data-request-gpu]");
  if (requestLink) requestLink.href = gpuRequestUrl(raw);
  const suggestions = $("onboardingGpuSuggestions");
  if (!suggestions) return;
  if (!missing) {
    suggestions.innerHTML = "";
    return;
  }
  const search = window.AIHardwareCatalogSearch;
  const intent = search?.parseGpuIntent(raw) || {};
  const matches = search?.search(raw, GPU_PRESETS, {
    limit: 3,
    filter: (gpu) => gpu.id !== "custom"
      && (!intent.memoryMinGb || Number(gpu.gpuUsableMemoryGb || gpu.vram || 0) >= intent.memoryMinGb)
      && (!intent.vendor || String(gpu.vendor || "").toLowerCase() === intent.vendor)
      && (!intent.formFactor || (intent.formFactor === "unified"
        ? gpu.memoryType === "unified"
        : gpu.formFactor === intent.formFactor)),
  }) || [];
  suggestions.innerHTML = matches.length
    ? `${uiLanguage === "en" ? "<span>Did you mean?</span>" : "<span>혹시 이 GPU인가요?</span>"}${matches.map((gpu) => `<button type="button" class="ghost-button" data-suggest-gpu="${escapeAttr(gpu.id)}">${escapeHtml(gpu.name)}</button>`).join("")}`
    : "";
}

function syncGpuPresetSearchDisplay() {
  const isPrimarySearch = $("gpuPreset").value === "custom";
  if ($("gpuPresetSearch")) $("gpuPresetSearch").hidden = !isPrimarySearch;
  $("gpuPresetPair")?.classList.toggle("is-custom", isPrimarySearch);

  const isSecondarySearch = $("secondaryGpuPreset").value === "__search__";
  if ($("secondaryGpuPresetSearch")) $("secondaryGpuPresetSearch").hidden = !isSecondarySearch;
  $("secondaryGpuPresetPair")?.classList.toggle("is-custom", isSecondarySearch);
}

function populatePrecisionSelect(id, options) {
  const select = $(id);
  if (!select) return;
  select.innerHTML = options.map(
    (option) => `<option value="${escapeAttr(option.id)}">${escapeHtml(option.label)}</option>`,
  ).join("");
  select.value = "auto";
}

function restoreImportedHfModels() {
  try {
    const stored = JSON.parse(window.localStorage?.getItem(HF_MODEL_STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return;
    stored.slice(0, MAX_IMPORTED_HF_MODELS).forEach((record) => {
      const repoId = parseHfRepoId(record?.name);
      const params = Number(record?.params);
      if (!repoId || !Number.isFinite(params) || params <= 0) return;
      if (GENERATIVE_MODELS.some((model) => model.name === repoId)) return;
      GENERATIVE_MODELS.push({
        name: repoId,
        maker: String(record.maker || repoId.split("/")[0]),
        params,
        active: Math.min(params, Math.max(0.01, Number(record.active) || params)),
        context: Math.min(1024, Math.max(0.5, Number(record.context) || 8)),
        license: String(record.license || "원문 확인 필요"),
        tags: Array.isArray(record.tags) && record.tags.length ? record.tags.map(String) : ["general"],
        summary: String(record.summary || "Hugging Face 공개 API에서 불러온 사용자 모델입니다."),
        sourceUrl: `https://huggingface.co/${repoId}`,
        releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(record.releaseDate || "") ? record.releaseDate : "",
        type: "generative",
        hfImported: true,
      });
    });
  } catch {
    // localStorage를 사용할 수 없는 환경에서도 기본 계산기는 그대로 동작합니다.
  }
}

function persistImportedHfModels() {
  try {
    const imported = GENERATIVE_MODELS.filter((model) => model.hfImported);
    window.localStorage?.setItem(HF_MODEL_STORAGE_KEY, JSON.stringify(imported));
  } catch {
    // 저장이 차단된 브라우저에서는 현재 탭에서만 유지합니다.
  }
}

function parseHfRepoId(input) {
  let value = String(input || "").trim();
  if (!value) return "";
  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      if (url.hostname !== "huggingface.co" && url.hostname !== "www.huggingface.co") return "";
      value = url.pathname.replace(/^\/+/, "");
    }
  } catch {
    return "";
  }
  value = value.replace(/^models\//, "").split(/[?#]/)[0];
  const parts = value.split("/").filter(Boolean);
  if (parts.length < 2) return "";
  const repoId = `${parts[0]}/${parts[1]}`;
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repoId) ? repoId : "";
}

function normalizeHfLicense(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();
  const known = {
    "apache-2.0": "Apache 2.0",
    apache2: "Apache 2.0",
    mit: "MIT",
    "gpl-3.0": "GPL-3.0",
    "gpl-3.0-only": "GPL-3.0",
    "gpl-3.0-or-later": "GPL-3.0",
    "cc-by-nc-4.0": "CC BY-NC 4.0",
    "cc-by-nc": "CC BY-NC",
    gemma: "Gemma",
    "gemma-terms-of-use": "Gemma",
    "llama3.1": "Llama 3.1 Community",
    "llama3.2": "Llama 3.2 Community",
    "llama3.3": "Llama 3.3 Community",
    "llama4": "Llama 4 Community",
    qwen: "Qwen",
    "qwen-research": "Qwen Research",
    deepseek: "DeepSeek",
    "glm-4": "GLM-4",
    "openrail-m": "OpenRAIL-M",
    "creativeml-openrail-m": "OpenRAIL-M",
    "nvidia-open-model-license": "NVIDIA Open",
    falcon: "Falcon",
  };
  if (known[key]) return known[key];
  if (key.startsWith("llama")) return "Llama";
  if (key === "other" || !raw) return "원문 확인 필요";
  return raw;
}

function extractHfParameterCount(info) {
  const total = Number(info?.safetensors?.total);
  if (Number.isFinite(total) && total > 0) return total;
  const byDtype = info?.safetensors?.parameters;
  if (!byDtype || typeof byDtype !== "object") return 0;
  return Object.values(byDtype).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function extractHfContextTokens(config) {
  const candidates = [
    config?.max_position_embeddings,
    config?.max_seq_len,
    config?.max_sequence_length,
    config?.seq_length,
    config?.n_positions,
    config?.text_config?.max_position_embeddings,
  ].map(Number).filter((value) => Number.isFinite(value) && value >= 512 && value <= 1048576);
  return candidates[0] || 8192;
}

function estimateHfActiveParams(totalBillions, config) {
  const expertCount = Number(config?.num_local_experts || config?.num_experts || config?.n_routed_experts);
  const expertsPerToken = Number(config?.num_experts_per_tok || config?.num_experts_per_token || config?.num_selected_experts);
  const sharedExperts = Number(config?.n_shared_experts || config?.num_shared_experts || 0);
  if (!Number.isFinite(expertCount) || !Number.isFinite(expertsPerToken) || expertCount <= 1 || expertsPerToken <= 0) {
    return { active: totalBillions, inferredMoe: false };
  }
  const routedRatio = Math.min(1, (expertsPerToken + Math.max(0, sharedExperts)) / expertCount);
  const active = totalBillions * Math.min(1, 0.03 + routedRatio * 0.97);
  return { active: Math.max(0.01, Math.round(active * 1000) / 1000), inferredMoe: true };
}

function buildHfTags(repoId, info, config, contextTokens, totalBillions) {
  const text = [repoId, info?.pipeline_tag, ...(info?.tags || []), ...(config?.architectures || [])].join(" ").toLowerCase();
  const tags = new Set(["general"]);
  const languages = Array.isArray(info?.cardData?.language) ? info.cardData.language.map(String) : [String(info?.cardData?.language || "")];
  if (languages.some((language) => /^(ko|kor|korean)$/i.test(language))) tags.add("korean");
  if (/code|coder|fill-mask/.test(text)) tags.add("coding");
  if (/reason|thinking|math/.test(text)) tags.add("reasoning");
  if (/vision|visual|image|multimodal/.test(text)) tags.add("vision");
  if (contextTokens >= 32768) tags.add("long");
  if (totalBillions <= 4) tags.add("edge");
  return [...tags];
}

async function importHfModel(event) {
  event.preventDefault();
  const repoId = parseHfRepoId($("hfModelInput").value);
  if (!repoId) {
    setHfImportStatus("owner/repo 형식의 모델 ID 또는 huggingface.co 모델 주소를 입력해 주세요.", "error");
    return;
  }

  const existingImported = GENERATIVE_MODELS.find((model) => model.name === repoId && model.hfImported);
  if (!existingImported && GENERATIVE_MODELS.filter((model) => model.hfImported).length >= MAX_IMPORTED_HF_MODELS) {
    setHfImportStatus(`직접 불러온 모델은 최대 ${MAX_IMPORTED_HF_MODELS}개까지 저장할 수 있습니다.`, "error");
    return;
  }

  const button = $("hfImportButton");
  button.disabled = true;
  setHfImportStatus("Hugging Face에서 safetensors와 config를 확인하는 중입니다…", "loading");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 20000);

  try {
    const encodedRepo = repoId.split("/").map(encodeURIComponent).join("/");
    const query = new URLSearchParams();
    ["author", "cardData", "config", "createdAt", "pipeline_tag", "safetensors", "tags"].forEach((field) => query.append("expand", field));
    const response = await fetch(`https://huggingface.co/api/models/${encodedRepo}?${query.toString()}`, { signal: controller.signal });
    if (!response.ok) {
      if ([401, 403].includes(response.status)) throw new Error("접근 승인이 필요한 모델이라 공개 API로 읽을 수 없습니다.");
      if (response.status === 404) throw new Error("해당 Hugging Face 모델 저장소를 찾지 못했습니다.");
      throw new Error(`Hugging Face API 오류 (${response.status})`);
    }
    const info = await response.json();
    const supportedPipelines = new Set(["text-generation", "text2text-generation", "conversational"]);
    if (info.pipeline_tag && !supportedPipelines.has(info.pipeline_tag)) {
      throw new Error(`현재 직접 가져오기는 생성형 LLM만 지원합니다. 이 모델 유형은 ${info.pipeline_tag}입니다.`);
    }
    let config = info.config || {};
    try {
      const configResponse = await fetch(`https://huggingface.co/${encodedRepo}/resolve/main/config.json`, { signal: controller.signal });
      if (configResponse.ok) config = await configResponse.json();
    } catch {
      // 일부 저장소는 config.json이 없지만 API의 기본 정보만으로도 가져올 수 있습니다.
    }

    const parameterCount = extractHfParameterCount(info);
    if (!parameterCount) throw new Error("공개 safetensors 파라미터 수가 없어 자동 계산할 수 없습니다.");
    const params = Math.round((parameterCount / 1e9) * 1000) / 1000;
    const contextTokens = extractHfContextTokens(config);
    const activeInfo = estimateHfActiveParams(params, config);
    const releaseDate = /^\d{4}-\d{2}-\d{2}/.test(info.createdAt || "") ? info.createdAt.slice(0, 10) : "";
    const license = normalizeHfLicense(info.cardData?.license);
    const tags = buildHfTags(repoId, info, config, contextTokens, params);
    const summary = activeInfo.inferredMoe
      ? `Hugging Face 공개 API에서 불러온 모델입니다. 전체 ${params}B, MoE config 기반 활성 ${activeInfo.active}B 추정치입니다.`
      : `Hugging Face 공개 API에서 불러온 모델입니다. safetensors 기준 ${params}B 파라미터를 사용합니다.`;
    const importedModel = {
      name: repoId,
      maker: String(info.author || repoId.split("/")[0]),
      params,
      active: activeInfo.active,
      context: Math.max(0.5, contextTokens / 1024),
      license,
      tags,
      summary,
      sourceUrl: `https://huggingface.co/${repoId}`,
      releaseDate,
      type: "generative",
      hfImported: true,
    };

    const existingIndex = GENERATIVE_MODELS.findIndex((model) => model.name === repoId && model.hfImported);
    if (existingIndex >= 0) GENERATIVE_MODELS.splice(existingIndex, 1, importedModel);
    else GENERATIVE_MODELS.push(importedModel);
    persistImportedHfModels();
    activeWorkload = "generative";
    activeSummaryFilter = "all";
    $("searchInput").value = repoId;
    refreshWorkloadUi();
    refreshFilterOptions();
    selectedModelKey = modelKey(importedModel);
    refreshHfImportUi();
    setHfImportStatus(`${repoId}: ${params}B · 최대 ${formatContext(contextTokens)} · ${license}로 계산 목록에 추가했습니다.`, "success");
    render();
  } catch (error) {
    const message = error?.name === "AbortError" ? "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요." : error?.message;
    setHfImportStatus(message || "모델 정보를 가져오지 못했습니다.", "error");
  } finally {
    window.clearTimeout(timeoutId);
    button.disabled = false;
  }
}

function clearImportedHfModels() {
  const importedNames = new Set(GENERATIVE_MODELS.filter((model) => model.hfImported).map((model) => model.name));
  if (!importedNames.size) {
    setHfImportStatus("현재 브라우저에 저장된 직접 불러오기 모델이 없습니다.", "neutral");
    return;
  }
  for (let index = GENERATIVE_MODELS.length - 1; index >= 0; index -= 1) {
    if (GENERATIVE_MODELS[index].hfImported) GENERATIVE_MODELS.splice(index, 1);
  }
  try {
    window.localStorage?.removeItem(HF_MODEL_STORAGE_KEY);
  } catch {
    // 저장소 삭제가 막혀도 현재 목록에서는 제거됩니다.
  }
  if (selectedModelKey && !getModelByKey(selectedModelKey)) selectedModelKey = "";
  if (importedNames.has($("searchInput").value)) $("searchInput").value = "";
  refreshFilterOptions();
  refreshHfImportUi();
  setHfImportStatus(`${importedNames.size}개 모델을 현재 브라우저 목록에서 지웠습니다.`, "success");
  render();
}

function refreshHfImportUi() {
  const count = GENERATIVE_MODELS.filter((model) => model.hfImported).length;
  $("hfClearButton").disabled = count === 0;
  $("hfClearButton").textContent = count ? `불러온 모델 지우기 (${count})` : "불러온 모델 지우기";
}

function setHfImportStatus(message, type) {
  const target = $("hfImportStatus");
  target.textContent = message;
  target.className = type ? `is-${type}` : "";
}

function refreshFilterOptions() {
  const models = getActiveModels();
  const previousProvider = $("providerFilter").value;
  const previousLicense = $("licenseFilter").value;
  const previousTask = $("taskFilter").value;
  const providers = [...new Set(models.map((model) => model.maker))].sort((a, b) => a.localeCompare(b));
  const licenses = [...new Set(models.map((model) => model.license))].sort((a, b) => a.localeCompare(b));
  const tags = [...new Set(models.flatMap((model) => model.tags || []))].sort((a, b) => tagLabel(a).localeCompare(tagLabel(b)));

  $("providerFilter").innerHTML = [
    `<option value="all">${t("allProviders")}</option>`,
    ...providers.map((provider) => `<option value="${escapeAttr(provider)}">${escapeHtml(provider)}</option>`),
  ].join("");
  $("licenseFilter").innerHTML = [
    `<option value="all">${t("allLicenses")}</option>`,
    ...licenses.map((license) => {
      const policy = getLicensePolicy(license);
      return `<option value="${escapeAttr(license)}">${escapeHtml(license)} · ${escapeHtml(licenseCommercialLabel(policy))}</option>`;
    }),
  ].join("");
  $("taskFilter").innerHTML = [
    `<option value="all">${t("allTasks")}</option>`,
    ...tags.map((tag) => `<option value="${escapeAttr(tag)}">${escapeHtml(tagLabel(tag))}</option>`),
  ].join("");

  setSelectIfValid("providerFilter", previousProvider) || ($("providerFilter").value = "all");
  setSelectIfValid("licenseFilter", previousLicense) || ($("licenseFilter").value = "all");
  setSelectIfValid("taskFilter", previousTask) || ($("taskFilter").value = "all");
  $("searchInput").placeholder = t("searchModel");
}

function bindEvents() {
  document.querySelectorAll("[data-core-task]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.coreTask === "infra" && typeof window.loadInfrastructureStudio === "function") {
        window.AIHardwareUI?.announce(uiLanguage === "en" ? "Loading the infrastructure workspace…" : "인프라 견적 화면을 불러오는 중입니다.");
        window.loadInfrastructureStudio().then(() => setCoreTaskMode("infra")).catch(() => {});
        return;
      }
      setCoreTaskMode(button.dataset.coreTask);
    });
  });
  document.querySelectorAll("[data-demo-gpu]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = selectPrimaryGpu(button.dataset.demoGpu, { persist: true });
      if (!selected) return;
      coreTaskMode = "finder";
      appMode = "simple";
      refreshSecondaryGpuUi();
      refreshCoreTaskUi();
      refreshAppModeUi();
      render();
      window.AIHardwareUI?.announce(uiLanguage === "en"
        ? "Loaded the RTX 3060 quick-recommendation example."
        : "RTX 3060 빠른 추천 예시를 불러왔습니다.");
      $("simpleModePanel")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  });
  document.querySelectorAll("[data-demo-infra]").forEach((button) => {
    button.addEventListener("click", () => {
      const openExample = () => {
        setCoreTaskMode("infra");
        window.dispatchEvent(new CustomEvent("ai-hardware-fit:infra-demo", {
          detail: {
            scenario: button.dataset.demoInfra,
            users: Number(button.dataset.demoUsers) || 30,
          },
        }));
      };
      if (typeof window.loadInfrastructureStudio === "function") {
        window.AIHardwareUI?.announce(uiLanguage === "en" ? "Loading the example…" : "예시 견적을 불러오는 중입니다.");
        window.loadInfrastructureStudio().then(openExample).catch(() => {});
      } else {
        openExample();
      }
    });
  });
  document.querySelectorAll("[data-demo-model]").forEach((button) => {
    button.addEventListener("click", () => {
      setCoreTaskMode("modelFinder");
      const query = button.dataset.demoModel || "";
      const search = $("advisorModelSearch");
      if (search) search.value = query;
      const matches = refreshAdvisorModelOptions();
      if (!matches.length && search) {
        search.value = "Qwen";
        refreshAdvisorModelOptions();
      }
      renderGpuAdvisor();
      window.AIHardwareUI?.announce(uiLanguage === "en"
        ? "Loaded the Qwen 32B GPU recommendation example."
        : "Qwen 32B용 GPU 추천 예시를 불러왔습니다.");
      $("gpuAdvisorPanel")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  });

  $("openPlacementFromHardware")?.addEventListener("click", () => {
    openPlacementPlanner([], { showBuilder: false, seedHardware: true });
  });

  $("settingsToggle").addEventListener("click", () => {
    settingsExpanded = !settingsExpanded;
    refreshWorkloadUi();
  });

  ["vramGb", "gpuCount", "secondaryGpuCount", "ramGb", "bandwidth", "reservedVramGb", "safetyMarginGb", "powerLimitW"].forEach((id) => {
    $(id).addEventListener("input", () => {
      render();
    });
  });
  $("toggleGpuCompare")?.addEventListener("click", () => {
    gpuCompareOpen = !gpuCompareOpen;
    renderGpuInsights(getHardware());
  });
  ["compareGpuA", "compareGpuB", "compareGpuC"].forEach((id) => $(id)?.addEventListener("change", () => renderGpuInsights(getHardware())));
  $("advisorModelCategory")?.addEventListener("change", () => {
    refreshAdvisorModelOptions();
    renderGpuAdvisor();
  });
  $("advisorModelSearch")?.addEventListener("input", () => {
    refreshAdvisorModelOptions();
    renderGpuAdvisor();
  });
  ["advisorModel", "advisorBudgetUsd", "advisorCurrentPriceUsd", "advisorElectricityRate", "advisorHoursMonth", "advisorVendor", "advisorFormFactor"].forEach((id) => {
    $(id)?.addEventListener(id.startsWith("advisor") && $("advisorModel") === $(id) ? "change" : "input", renderGpuAdvisor);
    if (id === "advisorVendor" || id === "advisorFormFactor") $(id)?.addEventListener("change", renderGpuAdvisor);
  });

  [
    "contextSize",
    "concurrency",
    "outputTokens",
    "kvPrecision",
    "quantization",
    "runtimeMode",
    "embeddingInputTokens",
    "embeddingBatchSize",
    "encoderPrecision",
    "encoderRuntime",
    "embeddingBatchTokens",
    "rerankerQueryTokens",
    "rerankerDocTokens",
    "rerankerCandidates",
    "rerankerBatchSize",
    "rerankerPrecision",
    "rerankerRuntime",
    "ocrWidth",
    "ocrHeight",
    "ocrBatchSize",
    "ocrPrecision",
    "ocrFeatureSet",
    "mediaSteps",
    "mediaFrames",
    "mediaFps",
    "mediaLoraCount",
    "mediaOffload",
    "mediaOptimization",
    "taskFilter",
    "providerFilter",
    "licenseFilter",
    "licenseUseFilter",
    "gradeFilter",
    "sortBy",
  ].forEach((id) => {
    $(id).addEventListener("change", render);
  });

  ["ocrWidth", "ocrHeight"].forEach((id) => {
    $(id).addEventListener("input", () => {
      $("ocrResolutionPreset").value = "custom";
      render();
    });
  });

  document.querySelectorAll("[data-preset-target]").forEach((select) => {
    select.addEventListener("change", () => {
      if (select.value !== "custom") {
        $(select.dataset.presetTarget).value = select.value;
      }
      syncPresetControls();
      render();
    });
  });

  document.querySelectorAll("[data-direct-preset]").forEach((input) => {
    input.addEventListener("input", () => {
      syncPresetForInput(input.id);
      render();
    });
  });

  $("searchInput").addEventListener("input", render);

  $("gpuPreset").addEventListener("change", (event) => {
    const selected = selectPrimaryGpu(event.target.value, { persist: true });
    if (event.target.value === "custom") $("gpuPresetSearch").value = "";
    refreshSecondaryGpuUi();
    render();
    if (selected && event.target.value === "custom") {
      settingsExpanded = true;
      refreshWorkloadUi();
      $("gpuPresetSearch")?.focus();
    }
  });

  $("secondaryGpuPreset").addEventListener("change", () => {
    if ($("secondaryGpuPreset").value === "__search__") $("secondaryGpuPresetSearch").value = "";
    refreshSecondaryGpuUi();
    render();
    if ($("secondaryGpuPreset").value === "__search__") $("secondaryGpuPresetSearch")?.focus();
  });

  $("gpuPresetSearch").addEventListener("change", () => {
    const preset = findGpuPresetByName($("gpuPresetSearch").value, false);
    if (preset) {
      $("gpuPreset").value = preset.id;
      $("gpuPreset").dispatchEvent(new Event("change"));
    }
  });

  $("onboardingQuickpicks")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-quick-gpu]");
    if (!button) return;
    selectOnboardingGpu(button.dataset.quickGpu);
  });

  $("onboardingGpuSearch")?.addEventListener("change", (event) => {
    const preset = findGpuPresetByName(event.target.value, false);
    if (preset) selectOnboardingGpu(preset.id);
    refreshGpuNotFoundUi(event.target.value);
  });
  $("onboardingGpuSearch")?.addEventListener("input", (event) => refreshGpuNotFoundUi(event.target.value));
  $("onboardingGpuNotFound")?.addEventListener("click", (event) => {
    const suggestion = event.target.closest("[data-suggest-gpu]");
    if (suggestion) {
      selectOnboardingGpu(suggestion.dataset.suggestGpu);
      return;
    }
    if (!event.target.closest("[data-use-custom-gpu]")) return;
    selectOnboardingGpu("custom");
    settingsExpanded = true;
    refreshWorkloadUi();
  });

  $("secondaryGpuPresetSearch").addEventListener("change", () => {
    const raw = $("secondaryGpuPresetSearch").value.trim();
    if (!raw) {
      $("secondaryGpuPreset").value = "none";
      $("secondaryGpuPreset").dispatchEvent(new Event("change"));
      return;
    }
    const preset = findGpuPresetByName(raw, false);
    if (preset) {
      $("secondaryGpuPreset").value = preset.id;
      $("secondaryGpuPreset").dispatchEvent(new Event("change"));
    }
  });

  $("simplePurpose").addEventListener("change", () => render());
  $("simplePriority").addEventListener("change", () => render());
  $("simpleOpenPlacement")?.addEventListener("click", () => {
    openPlacementPlanner([], { showBuilder: true, seedHardware: true });
    applyPlacementStarter("rag");
  });
  $("simpleModeResult").addEventListener("click", (event) => {
    if (event.target.closest("[data-focus-primary-gpu]")) {
      focusPrimaryGpuSelector();
      return;
    }
    if (event.target.closest("[data-reset-simple-filters]")) {
      $("simplePurpose").value = getSimplePurposeOptions()[0].id;
      $("simplePriority").value = "balanced";
      render();
      window.AIHardwareUI?.announce(uiLanguage === "en" ? "Reset the recommendation filters." : "추천 조건을 초기화했습니다.");
      return;
    }
    const copyCommand = event.target.closest("[data-copy-command]");
    if (copyCommand) {
      copyTextToClipboard(copyCommand.dataset.copyCommand, copyCommand);
      return;
    }
    const target = event.target.closest("[data-model-key]");
    if (!target) return;
    // Keep all three cards fixed and swap only the dedicated inspector.
    const nextKey = simpleExpandedKey === target.dataset.modelKey ? "" : target.dataset.modelKey;
    if (!nextKey) {
      closeSimpleRecommendationPanel();
      return;
    }
    simpleExpandedKey = nextKey;
    render();
    $("simpleRecommendationPanel")?.focus();
  });
  $("simpleInspectorBackdrop")?.addEventListener("click", () => closeSimpleRecommendationPanel());
  $("simpleRecommendationPanel")?.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-simple-inspector]")) {
      closeSimpleRecommendationPanel();
      return;
    }
    const copyCommand = event.target.closest("[data-copy-command]");
    if (copyCommand) {
      copyTextToClipboard(copyCommand.dataset.copyCommand, copyCommand);
      return;
    }
    const shareButton = event.target.closest("[data-share-model-link]");
    if (shareButton) {
      copyTextToClipboard(buildModelShareUrl(shareButton.dataset.shareModelLink, "simple"), shareButton);
      return;
    }
    const downloadButton = event.target.closest("[data-download-simple-card]");
    if (downloadButton) {
      downloadShareCard(downloadButton.dataset.downloadSimpleCard, downloadButton);
      return;
    }
    const fullDetailButton = event.target.closest("[data-open-full-simple-detail]");
    if (fullDetailButton) {
      selectedModelKey = fullDetailButton.dataset.openFullSimpleDetail;
      simpleExpandedKey = "";
      appMode = "expert";
      render();
    }
  });
  $("simpleOpenExpert").addEventListener("click", () => setAppMode("expert"));
  $("simpleExploreActions").addEventListener("click", (event) => {
    if (event.target.closest("[data-share-link]")) {
      copyTextToClipboard(window.location.href, event.target.closest("[data-share-link]"));
      return;
    }
    if (event.target.closest("[data-download-share-card]")) {
      downloadShareCard("", event.target.closest("[data-download-share-card]"));
      return;
    }
    if (event.target.closest("[data-share-3060]")) {
      copyRecommendationLinkForGpu("rtx3060-12", event.target.closest("[data-share-3060]"));
    }
  });

  document.querySelector("[data-language-toggle]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-lang]");
    if (!button) return;
    setUiLanguage(button.dataset.lang);
  });

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme]");
    if (!button) return;
    setUiTheme(button.dataset.theme);
  });

  $("hfImportForm").addEventListener("submit", importHfModel);
  $("hfClearButton").addEventListener("click", clearImportedHfModels);

  $("addGpuInventoryButton").addEventListener("click", addGpuInventoryRow);
  $("runPlacementButton").addEventListener("click", runGpuPlacement);
  $("gpuPlacementExport").addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy-target]");
    if (copyButton) {
      const source = $(copyButton.dataset.copyTarget);
      if (source) copyTextToClipboard(source.textContent, copyButton);
      return;
    }
    const downloadButton = event.target.closest("[data-download-target]");
    if (downloadButton) {
      const source = $(downloadButton.dataset.downloadTarget);
      if (source) downloadTextFile(source.textContent, downloadButton.dataset.downloadFilename || "download.txt");
    }
  });
  $("gpuInventoryList").addEventListener("click", (event) => {
    const removeButton = event.target.closest(".gpu-inventory-remove");
    if (removeButton) removeGpuInventoryRow(removeButton.dataset.rowId);
  });
  $("gpuInventoryList").addEventListener("change", (event) => {
    const target = event.target;
    const rowId = target.dataset.rowId;
    if (target.classList.contains("gpu-inventory-preset")) {
      if (target.value === "__search__") {
        gpuInventorySearchRows.add(rowId);
        renderGpuInventory();
        document.querySelector(`.gpu-inventory-preset-search[data-row-id="${rowId}"]`)?.focus();
      } else {
        gpuInventorySearchRows.delete(rowId);
        updateGpuInventoryRow(rowId, "presetId", target.value);
        renderGpuInventory();
        renderPlacementSelectedChips();
      }
    } else if (target.classList.contains("gpu-inventory-preset-search")) {
      const preset = findGpuPresetByName(target.value, false);
      if (preset) {
        gpuInventorySearchRows.delete(rowId);
        updateGpuInventoryRow(rowId, "presetId", preset.id);
        renderGpuInventory();
        renderPlacementSelectedChips();
      }
    } else if (target.classList.contains("gpu-inventory-count")) {
      updateGpuInventoryRow(rowId, "count", target.value);
    }
  });

  document.querySelectorAll("[data-placement-type]").forEach((button) => {
    button.addEventListener("click", () => setPlacementActiveType(button.dataset.placementType));
  });

  $("placementModelSearch").addEventListener("input", (event) => {
    placementSearchQuery = event.target.value;
    if (placementSearchQuery.trim()) placementModelBrowserOpened = true;
    renderPlacementModelList();
  });

  $("gpuPlacementPanel")?.addEventListener("click", (event) => {
    const starter = event.target.closest("[data-placement-starter]");
    if (starter) {
      applyPlacementStarter(starter.dataset.placementStarter);
      return;
    }
    if (event.target.closest("[data-open-placement-browser]")) {
      placementModelBrowserOpened = true;
      renderPlacementModelList();
    }
  });

  $("placementModelList").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-model-key]");
    if (!checkbox) return;
    togglePlacementModel(checkbox.dataset.modelKey);
  });

  $("placementModelSelected").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-placement-key]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    togglePlacementModel(button.dataset.removePlacementKey);
  });
  const updatePlacementModelConfig = (event) => {
    const field = event.target.closest("[data-placement-config-field]");
    const wrapper = event.target.closest("[data-placement-config-key]");
    if (!field || !wrapper) return;
    const config = getPlacementModelConfig(wrapper.dataset.placementConfigKey);
    const key = field.dataset.placementConfigField;
    if (key === "requestShare") config.requestShare = clampNumber(field.value, 1, 1000, 100);
    else if (key === "minConcurrency") config.minConcurrency = clampNumber(field.value, 0, 256, 1);
    else if (key === "contextTokens") config.contextTokens = clampNumber(field.value, 2048, 1048576, 8192);
    else if (key === "allowReplica") config.allowReplica = field.checked;
    else config[key] = field.value;
    if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
    else syncUrlState();
  };
  $("placementModelSelected").addEventListener("change", updatePlacementModelConfig);

  document.querySelectorAll("[data-placement-strategy]").forEach((button) => {
    button.addEventListener("click", () => setPlacementStrategy(button.dataset.placementStrategy));
  });

  document.querySelectorAll("[data-placement-usage]").forEach((button) => {
    button.addEventListener("click", () => setPlacementUsageMode(button.dataset.placementUsage));
  });

  const updatePlacementTargetConcurrency = () => {
    const select = $("placementTargetConcurrency");
    if (!select || select.value === "") {
      placementTargetN = null;
    } else if (select.value === "custom") {
      placementTargetN = clampNumber($("placementTargetConcurrencyCustom").value, 1, 256, 32);
    } else {
      placementTargetN = clampNumber(select.value, 1, 256, 1);
    }
    if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
    else syncUrlState();
  };
  $("placementTargetConcurrency")?.addEventListener("change", updatePlacementTargetConcurrency);
  $("placementTargetConcurrencyCustom")?.addEventListener("input", updatePlacementTargetConcurrency);
  const updatePlacementHeadroom = () => {
    const preset = $("placementMinHeadroom");
    placementMinHeadroomPct = preset?.value === "custom"
      ? clampNumber($("placementMinHeadroomCustom")?.value, 0, 40, 15)
      : clampNumber(preset?.value, 0, 40, 15);
    if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
    else syncUrlState();
  };
  $("placementMinHeadroom")?.addEventListener("change", updatePlacementHeadroom);
  $("placementMinHeadroomCustom")?.addEventListener("input", updatePlacementHeadroom);
  $("placementAllowQuantChange")?.addEventListener("change", (event) => {
    placementAllowQuantChange = event.target.checked;
    if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
    else syncUrlState();
  });
  $("placementAllowContextReduction")?.addEventListener("change", (event) => {
    placementAllowContextReduction = event.target.checked;
    if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
    else syncUrlState();
  });
  $("placementAllowReplication")?.addEventListener("change", (event) => {
    placementAllowReplication = event.target.checked;
    if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
    else syncUrlState();
  });

  $("placementPrimaryModel")?.addEventListener("change", (event) => {
    placementPrimaryKey = event.target.value;
    if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
    else syncUrlState();
  });

  $("gpuPlacementDiagnosis")?.addEventListener("click", (event) => {
    const adjustmentButton = event.target.closest("[data-apply-placement-adjustment]");
    if (adjustmentButton) {
      const adjustment = placementAdjustmentRegistry.get(adjustmentButton.dataset.applyPlacementAdjustment);
      if (!adjustment) return;
      if (adjustment.kind === "pin") {
        getPlacementModelConfig(adjustment.modelKey).pinnedGpu = String(adjustment.gpuIndex);
      } else if (adjustment.kind === "allow-quant") {
        placementAllowQuantChange = true;
        if ($("placementAllowQuantChange")) $("placementAllowQuantChange").checked = true;
      } else if (adjustment.kind === "allow-context") {
        placementAllowContextReduction = true;
        if ($("placementAllowContextReduction")) $("placementAllowContextReduction").checked = true;
      } else if (adjustment.kind === "remove") {
        placementSelectedKeys.delete(adjustment.modelKey);
        placementModelConfigs.delete(adjustment.modelKey);
        if (placementPrimaryKey === adjustment.modelKey) placementPrimaryKey = "";
        renderPlacementModelList();
        renderPlacementPrimarySelect();
      } else if (adjustment.kind === "target") {
        placementTargetN = adjustment.nextTarget;
        const targetSelect = $("placementTargetConcurrency");
        const presetValues = ["1", "2", "4", "8", "16", "32", "64"];
        if (targetSelect) targetSelect.value = presetValues.includes(String(adjustment.nextTarget)) ? String(adjustment.nextTarget) : "custom";
        if ($("placementTargetConcurrencyCustom")) $("placementTargetConcurrencyCustom").value = String(adjustment.nextTarget);
      }
      renderPlacementSelectedChips();
      runGpuPlacement();
      return;
    }
    const button = event.target.closest("[data-apply-placement-strategy]");
    if (!button) return;
    setPlacementStrategy(button.dataset.applyPlacementStrategy);
  });

  $("comparePlacementPlansButton")?.addEventListener("click", comparePlacementPlans);

  $("gpuPlacementPlanCompare")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-apply-placement-plan]");
    if (!button) return;
    setPlacementStrategy(button.dataset.applyPlacementPlan);
  });

  $("quantRecommendations").addEventListener("click", (event) => {
    const target = event.target.closest("[data-model-key]");
    if (!target) return;
    dialogReturnFocus = target;
    selectedModelKey = target.dataset.modelKey;
    render();
    $("modelDetail")?.focus();
  });

  document.querySelectorAll("[data-app-mode]").forEach((button) => {
    button.addEventListener("click", () => setAppMode(button.dataset.appMode));
  });

  document.querySelectorAll("[data-workload-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextWorkload = button.dataset.workloadTab;
      if (!MODEL_GROUPS[nextWorkload] || nextWorkload === activeWorkload) return;
      activeWorkload = nextWorkload;
      activeSummaryFilter = "all";
      selectedModelKey = "";
      compareKeys = [];
      compareModalOpen = false;
      if (nextWorkload === "imageGeneration") {
        $("ocrResolutionPreset").value = "image-1024";
        applyOcrResolutionPreset("image-1024");
      } else if (nextWorkload === "videoGeneration" || nextWorkload === "avatarGeneration") {
        $("ocrResolutionPreset").value = "video-480";
        applyOcrResolutionPreset("video-480");
      }
      refreshWorkloadUi();
      refreshFilterOptions();
      render();
    });
  });

  $("ocrResolutionPreset").addEventListener("change", () => {
    applyOcrResolutionPreset($("ocrResolutionPreset").value);
    render();
  });

  $("summaryGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-summary-filter]");
    if (!button) return;
    activeSummaryFilter = button.dataset.summaryFilter;
    render();
  });

  $("calculationBasisStrip").addEventListener("click", (event) => {
    if (!event.target.closest("[data-open-settings]")) return;
    if (!hasPrimaryGpuSelection) {
      focusPrimaryGpuSelector();
      return;
    }
    settingsExpanded = true;
    refreshWorkloadUi();
    document.getElementById("settingsDrawer")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("activeFilterChips").addEventListener("click", (event) => {
    const button = event.target.closest("[data-clear-filter]");
    if (!button) return;
    clearFilter(button.dataset.clearFilter);
    render();
  });

  $("listViewButton").addEventListener("click", () => setViewMode("list"));
  $("cardViewButton").addEventListener("click", () => setViewMode("card"));

  $("modelResults").addEventListener("click", (event) => {
    if (event.target.closest("[data-focus-primary-gpu]")) {
      focusPrimaryGpuSelector();
      return;
    }
    const emptyAction = event.target.closest("[data-empty-action]");
    if (emptyAction) {
      applyEmptyAction(emptyAction.dataset.emptyAction);
      render();
      return;
    }

    const target = event.target.closest("[data-model-key]");
    if (!target) return;
    dialogReturnFocus = target;
    selectedModelKey = target.dataset.modelKey;
    render();
    $("modelDetail")?.focus();
  });

  $("modelResults").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-compare-key]");
    if (!checkbox) return;
    toggleCompareModel(checkbox.dataset.compareKey);
  });

  $("compareBar").addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-compare-key]");
    if (removeButton) {
      toggleCompareModel(removeButton.dataset.removeCompareKey);
      return;
    }
    if (event.target.closest("[data-open-compare]")) {
      dialogReturnFocus = event.target.closest("[data-open-compare]");
      compareModalOpen = true;
      render();
      $("compareModal")?.querySelector("[data-close-compare]")?.focus();
      return;
    }
    if (event.target.closest("[data-clear-compare]")) {
      compareKeys = [];
      compareModalOpen = false;
      render();
      return;
    }
    if (event.target.closest("[data-add-compare-to-placement]")) {
      openPlacementPlanner(compareKeys, { showBuilder: true, seedHardware: true });
    }
  });

  $("compareModalBackdrop").addEventListener("click", closeCompareModal);
  $("compareModal").addEventListener("click", (event) => {
    if (event.target.closest("[data-close-compare]")) {
      closeCompareModal();
      return;
    }
    const removeButton = event.target.closest("[data-remove-compare-key]");
    if (removeButton) toggleCompareModel(removeButton.dataset.removeCompareKey);
  });

  $("drawerBackdrop").addEventListener("click", closeModelDetail);
  $("modelDetail").addEventListener("click", (event) => {
    if (event.target.closest("[data-close-detail]")) closeModelDetail();
    if (event.target.closest("[data-add-detail-to-placement]")) {
      const key = event.target.closest("[data-add-detail-to-placement]").dataset.addDetailToPlacement || selectedModelKey;
      openPlacementPlanner([key], { showBuilder: true, seedHardware: true });
      return;
    }
    if (event.target.closest("[data-share-link]")) {
      copyTextToClipboard(window.location.href, event.target.closest("[data-share-link]"));
      return;
    }
    if (event.target.closest("[data-download-share-card]")) {
      downloadShareCard(selectedModelKey, event.target.closest("[data-download-share-card]"));
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (compareModalOpen) {
      closeCompareModal();
      return;
    }
    if (simpleExpandedKey) {
      closeSimpleRecommendationPanel();
      return;
    }
    if (selectedModelKey) closeModelDetail();
  });

  window.addEventListener("popstate", () => {
    applyUrlState();
    render({ syncUrl: false });
  });

  const benchmarkSearchInput = $("benchmarkSearch");
  if (benchmarkSearchInput) {
    benchmarkSearchInput.addEventListener("input", (event) => {
      benchmarkSearchQuery = event.target.value;
      renderBenchmarkSheet();
    });
  }

  const benchmarkMetricFilterEl = $("benchmarkMetricFilter");
  if (benchmarkMetricFilterEl) {
    benchmarkMetricFilterEl.addEventListener("change", (event) => {
      selectBenchmarkMetricFamily(event.target.value);
    });
  }

  const benchmarkTableEl = $("benchmarkTable");
  if (benchmarkTableEl) {
    benchmarkTableEl.addEventListener("change", (event) => {
      const checkbox = event.target.closest("[data-benchmark-key]");
      if (!checkbox) return;
      const key = checkbox.dataset.benchmarkKey;
      if (checkbox.checked) {
        if (!benchmarkCompareKeys.includes(key) && benchmarkCompareKeys.length < MAX_BENCHMARK_COMPARE) {
          benchmarkCompareKeys = [...benchmarkCompareKeys, key];
        }
      } else {
        benchmarkCompareKeys = benchmarkCompareKeys.filter((existing) => existing !== key);
      }
      renderBenchmarkSheet();
    });
  }

  const benchmarkCompareBarEl = $("benchmarkCompareBar");
  if (benchmarkCompareBarEl) {
    benchmarkCompareBarEl.addEventListener("click", (event) => {
      if (!event.target.closest("[data-clear-benchmark-compare]")) return;
      benchmarkCompareKeys = [];
      const metricFilterEl = $("benchmarkMetricFilter");
      if (metricFilterEl) metricFilterEl.value = "";
      renderBenchmarkSheet();
    });
  }
}


function clearFilter(kind) {
  if (kind === "all") {
    activeSummaryFilter = "all";
    $("gradeFilter").value = "all";
    $("taskFilter").value = "all";
    $("providerFilter").value = "all";
    $("licenseFilter").value = "all";
    $("licenseUseFilter").value = "all";
    $("searchInput").value = "";
    return;
  }
  if (kind === "summary") activeSummaryFilter = "all";
  if (kind === "grade") $("gradeFilter").value = "all";
  if (kind === "task") $("taskFilter").value = "all";
  if (kind === "provider") $("providerFilter").value = "all";
  if (kind === "license") $("licenseFilter").value = "all";
  if (kind === "licenseUse") $("licenseUseFilter").value = "all";
  if (kind === "search") $("searchInput").value = "";
}

function applyEmptyAction(action) {
  if (action === "include-conditional") {
    activeSummaryFilter = "all";
    $("gradeFilter").value = "all";
    return;
  }
  clearFilter("all");
}

function setViewMode(nextMode) {
  viewMode = nextMode === "card" ? "card" : "list";
  render();
}

function refreshWorkloadUi() {
  $("settingsDrawer").hidden = !settingsExpanded;
  $("settingsToggle").setAttribute("aria-expanded", String(settingsExpanded));
  $("settingsToggle").textContent = settingsExpanded ? t("closeSettings") : t("settings");

  document.querySelectorAll("[data-workload-tab]").forEach((button) => {
    const isActive = button.dataset.workloadTab === activeWorkload;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll("[data-workload-settings]").forEach((panel) => {
    const panelKey = panel.dataset.workloadSettings;
    panel.hidden = !settingsExpanded || (panelKey !== activeWorkload && !(panelKey === "vision" && isVisionWorkload(activeWorkload)));
  });
  document.querySelectorAll(".media-generation-field").forEach((field) => {
    field.hidden = !["imageGeneration", "videoGeneration", "avatarGeneration"].includes(activeWorkload);
  });
  if ($("mediaFrames")) $("mediaFrames").closest(".field").hidden = !["videoGeneration", "avatarGeneration"].includes(activeWorkload);
  if ($("mediaFps")) $("mediaFps").closest(".field").hidden = !["videoGeneration", "avatarGeneration"].includes(activeWorkload);

  refreshSimplePurposeOptions();
  syncPresetControls();
}

function applyOcrResolutionPreset(id) {
  const preset = OCR_RESOLUTION_PRESETS[id];
  if (!preset || !preset.width || !preset.height) return;
  $("ocrWidth").value = preset.width;
  $("ocrHeight").value = preset.height;
}

function applyPreset(id) {
  const preset = GPU_PRESETS.find((gpu) => gpu.id === id);
  if (!preset) return;

  $("gpuPreset").value = preset.id;
  $("vramGb").value = preset.gpuUsableMemoryGb || preset.vram;
  $("ramGb").value = preset.ram;
  $("bandwidth").value = preset.bandwidth;
  $("gpuCount").value = 1;
  if ($("powerLimitW")) $("powerLimitW").value = preset.tgpReferenceW || preset.tgpMaxW || 115;
}

function refreshSecondaryGpuUi() {
  const selectedId = $("secondaryGpuPreset").value;
  const enabled = selectedId !== "none" && GPU_PRESETS.some((gpu) => gpu.id === selectedId);
  $("secondaryGpuCount").disabled = !enabled;
  const selected = GPU_PRESETS.find((gpu) => gpu.id === selectedId);
  const primary = GPU_PRESETS.find((gpu) => gpu.id === $("gpuPreset").value);
  const crossVendor = selected && primary && gpuRuntimeFamily(selected) !== gpuRuntimeFamily(primary);
  $("secondaryGpuNote").textContent = crossVendor
    ? "GPU 제조사가 다릅니다. NVIDIA·AMD·Intel 혼용은 일반적인 단일 런타임에서 지원되지 않을 수 있으므로 메모리 참고값으로만 보세요."
    : selected
      ? `${selected.name}의 VRAM ${formatGb(selected.vram)}·대역폭 ${selected.bandwidth.toLocaleString("ko-KR")} GB/s를 더하고 이기종 통신 손실을 반영합니다.`
    : "서로 다른 GPU를 함께 쓰는 경우 메모리 분할·통신 손실을 보수적으로 반영합니다.";
  syncGpuPresetSearchDisplay();
}

function gpuRuntimeFamily(gpu) {
  const name = `${gpu?.id || ""} ${gpu?.name || ""}`.toLowerCase();
  if (/radeon|amd|mi\d|w\d{4}/.test(name)) return "amd";
  if (/intel|arc|flex|max\d/.test(name)) return "intel";
  if (/apple|m\dultra|m\dmax/.test(name)) return "apple";
  return "nvidia";
}

// ---- 멀티 GPU 모델 배치 추천 (베타) ----

function copyTextToClipboard(text, button) {
  const restoreLabel = () => {
    if (!button) return;
    const original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.textContent = uiLanguage === "en" ? "Copied" : "복사됨";
    setTimeout(() => {
      button.textContent = original;
    }, 1500);
    window.AIHardwareUI?.announce(
      uiLanguage === "en" ? "Copied to the clipboard." : "클립보드에 복사했습니다.",
      "success",
    );
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(restoreLabel).catch(() => fallbackCopyToClipboard(text, restoreLabel));
  } else {
    fallbackCopyToClipboard(text, restoreLabel);
  }
}

function renderShareActions(model) {
  const key = model ? modelKey(model) : "";
  return `
    <div class="detail-share-actions">
      <span>${uiLanguage === "en" ? "Use this result" : "이 결과 활용하기"}</span>
      <div>
        <button type="button" class="ghost-button" data-share-link>${uiLanguage === "en" ? "Copy result link" : "결과 링크 복사"}</button>
        <button type="button" class="ghost-button" data-download-share-card>${uiLanguage === "en" ? "Download PNG card" : "요약 카드 PNG"}</button>
        ${key ? `<button type="button" class="primary-button" data-add-detail-to-placement="${escapeAttr(key)}">${uiLanguage === "en" ? "Add to stack planner" : "배치에 추가"}</button>` : ""}
      </div>
    </div>
  `;
}

function copyRecommendationLinkForGpu(gpuId, button) {
  const url = new URL(window.location.href);
  url.searchParams.set("gpu", gpuId);
  url.searchParams.set("ui", "simple");
  url.searchParams.delete("model");
  copyTextToClipboard(url.toString(), button);
}

function getShareCardEntries(modelKeyOverride = "") {
  if (!hasPrimaryGpuSelection) return [];
  const hardware = getHardware();
  if (modelKeyOverride) {
    const model = getModelByKey(modelKeyOverride);
    if (!model) return [];
    const estimate = estimateAnyModel(model, hardware);
    return [{ model, estimate }];
  }
  return getQuickRecommendationEstimates().map((estimate) => ({ model: estimate.model, estimate }));
}

function canvasText(value, maxLength = 42) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function downloadShareCard(modelKeyOverride = "", button = null) {
  const entries = getShareCardEntries(modelKeyOverride);
  if (!entries.length) return;

  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  let context;
  try {
    context = canvas.getContext("2d");
  } catch {
    return;
  }
  if (!context) return;

  const hardware = getHardware();
  const purpose = $("simplePurpose")?.selectedOptions?.[0]?.textContent || "현재 조건";
  const priority = $("simplePriority")?.selectedOptions?.[0]?.textContent || "균형 잡힌 추천";
  const palette = ["#e8f1fb", "#eef2f6", "#e5f4ee"];
  context.fillStyle = "#f4f6f8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.fillRect(42, 34, 1116, 562);
  context.strokeStyle = "#d9e0e7";
  context.strokeRect(42, 34, 1116, 562);

  context.fillStyle = "#164a7b";
  context.font = "700 22px Pretendard, 'Noto Sans KR', sans-serif";
  context.fillText("AI HARDWARE FIT", 78, 78);
  context.fillStyle = "#18212b";
  context.font = "800 38px Pretendard, 'Noto Sans KR', sans-serif";
  context.fillText(modelKeyOverride ? "모델 실행 요약" : "내 GPU 추천 모델", 78, 132);
  context.fillStyle = "#667382";
  context.font = "600 18px Pretendard, 'Noto Sans KR', sans-serif";
  context.fillText(`${canvasText(formatHardwareName(hardware, true), 42)} · ${purpose} · ${priority}`, 78, 168);

  entries.forEach(({ model, estimate }, index) => {
    const y = 214 + index * 112;
    context.fillStyle = palette[index % palette.length];
    context.fillRect(78, y, 1044, 88);
    context.fillStyle = "#164a7b";
    context.font = "800 13px Pretendard, 'Noto Sans KR', sans-serif";
    context.fillText(modelKeyOverride ? "선택 모델" : `${index + 1}순위`, 100, y + 25);
    context.fillStyle = "#18212b";
    context.font = "700 22px Pretendard, 'Noto Sans KR', sans-serif";
    context.fillText(canvasText(model.name, 36), 100, y + 57);
    context.fillStyle = "#475569";
    context.font = "600 16px Pretendard, 'Noto Sans KR', sans-serif";
    const confidence = getEstimateConfidence(model, estimate, hardware);
    context.fillText(`${GRADE_META[estimate.grade].label} · VRAM ${formatGb(estimate.requiredGb)} · ${canvasText(formatSpeedRange(estimate, confidence), 28)}`, 720, y + 49);
  });

  context.fillStyle = "#667382";
  context.font = "500 14px Pretendard, 'Noto Sans KR', sans-serif";
  context.fillText("계산 추정치 · 실제 속도는 런타임·양자화·컨텍스트에 따라 달라질 수 있습니다.", 78, 560);

  let dataUrl;
  try {
    dataUrl = canvas.toDataURL("image/png");
  } catch {
    return;
  }
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `ai-hardware-fit-${modelKeyOverride ? "model" : "recommendations"}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (button) {
    const original = button.dataset.label || button.textContent;
    button.dataset.label = original;
    button.textContent = "저장됨";
    setTimeout(() => { button.textContent = original; }, 1500);
  }
}

function fallbackCopyToClipboard(text, done) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (error) {
    // 클립보드 API를 사용할 수 없는 환경에서는 조용히 무시합니다.
  }
  document.body.removeChild(textarea);
  done();
}

function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function syncPresetForInput(inputId) {
  const select = document.querySelector(`[data-preset-target="${inputId}"]`);
  if (!select) return;
  const value = $(inputId).value;
  select.value = [...select.options].some((option) => option.value === value) ? value : "custom";
}

function syncPresetControls() {
  document.querySelectorAll("[data-direct-preset]").forEach((input) => {
    const select = $(input.dataset.directPreset);
    if (select?.value !== "custom" && select?.value !== "") syncPresetForInput(input.id);
    const pair = input.closest(".field-control-pair");
    const isCustom = select?.value === "custom";
    input.hidden = !isCustom;
    pair?.classList.toggle("is-custom", Boolean(isCustom));
  });
}

function getHardware() {
  const vram = clampNumber($("vramGb").value, 2, 640, 24);
  const primaryCount = clampNumber($("gpuCount").value, 1, 16, 1);
  const ram = clampNumber($("ramGb").value, 8, 2048, 64);
  const bandwidth = clampNumber($("bandwidth").value, 100, 12000, 1008);
  const powerLimitW = clampNumber($("powerLimitW")?.value, 20, 600, 115);
  const reservedVram = clampNumber($("reservedVramGb").value, 0, 10240, 0);
  const safetyMarginGb = clampNumber($("safetyMarginGb").value, 0, 256, 2);
  const context = clampNumber($("contextSize").value, 512, 1048576, 8192);
  const concurrency = clampNumber($("concurrency").value, 1, 256, 1);
  const outputTokens = clampNumber($("outputTokens").value, 16, 65536, 512);
  const kvPrecision = $("kvPrecision").value;
  const kvMeta = KV_PRECISION_META[kvPrecision] || KV_PRECISION_META.fp16;
  const runtime = $("runtimeMode").value;
  const preset = GPU_PRESETS.find((gpu) => gpu.id === $("gpuPreset").value) || GPU_PRESETS[0];
  const secondaryPreset = GPU_PRESETS.find((gpu) => gpu.id === $("secondaryGpuPreset").value) || null;
  const secondaryCount = secondaryPreset ? clampNumber($("secondaryGpuCount").value, 1, 16, 1) : 0;
  const count = primaryCount + secondaryCount;
  const heterogeneous = Boolean(secondaryPreset && secondaryPreset.id !== preset?.id);
  const crossVendor = Boolean(secondaryPreset && gpuRuntimeFamily(secondaryPreset) !== gpuRuntimeFamily(preset));

  const compute = estimateHardwareCompute(preset, bandwidth, powerLimitW);
  const secondaryCompute = secondaryPreset ? estimateHardwareCompute(secondaryPreset, secondaryPreset.bandwidth) : null;
  const computeTotal = Object.fromEntries(
    ["fp32Tflops", "fp16Tflops", "bf16Tflops", "int8Tops"].map((key) => [
      key,
      compute[key] * primaryCount + (secondaryCompute?.[key] || 0) * secondaryCount,
    ]),
  );
  const totalVram = vram * primaryCount + (secondaryPreset?.vram || 0) * secondaryCount;
  const shardingEfficiency = count > 1 ? (heterogeneous ? 0.88 : 0.92) : 1;
  const baseEffectiveVram = totalVram * shardingEfficiency;
  const availableVram = Math.max(0, baseEffectiveVram - reservedVram - safetyMarginGb);
  const aggregateBandwidth = bandwidth * primaryCount + (secondaryPreset?.bandwidth || 0) * secondaryCount;

  return {
    vram,
    primaryCount,
    secondaryCount,
    count,
    ram,
    bandwidth,
    powerLimitW,
    reservedVram,
    safetyMarginGb,
    totalVram,
    baseEffectiveVram,
    availableVram,
    context,
    concurrency,
    outputTokens,
    kvPrecision,
    kvMeta,
    runtime,
    preset,
    secondaryPreset,
    heterogeneous,
    crossVendor,
    shardingEfficiency,
    aggregateBandwidth,
    compute,
    computeTotal,
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function estimateHardwareCompute(preset, bandwidth, powerLimitW = preset?.tgpReferenceW || preset?.tgpMaxW) {
  if (preset?.fp16Tflops || preset?.bf16Tflops || preset?.int8Tops) {
    const fixed = {
      fp32Tflops: preset.fp32Tflops || Math.max(4, preset.fp16Tflops * 0.5),
      fp16Tflops: preset.fp16Tflops || Math.max(8, bandwidth * 0.12),
      bf16Tflops: preset.bf16Tflops || preset.fp16Tflops || Math.max(8, bandwidth * 0.1),
      int8Tops: preset.int8Tops || Math.max(16, bandwidth * 0.24),
    };
    return applyTgpComputeScale(fixed, preset, powerLimitW);
  }

  const name = `${preset?.id || ""} ${preset?.name || ""}`.toLowerCase();
  let tensorFactor = 0.14;
  if (name.includes("b200") || name.includes("b100")) tensorFactor = 0.55;
  else if (name.includes("h200") || name.includes("h100")) tensorFactor = 0.42;
  else if (name.includes("a100")) tensorFactor = 0.2;
  else if (name.includes("rtx 50") || name.includes("blackwell")) tensorFactor = 0.22;
  else if (name.includes("rtx 40") || name.includes("ada")) tensorFactor = 0.17;
  else if (name.includes("rtx 30")) tensorFactor = 0.12;
  else if (name.includes("t4") || name.includes("v100")) tensorFactor = 0.09;
  else if (name.includes("mi3") || name.includes("mi2")) tensorFactor = 0.22;
  else if (name.includes("apple")) tensorFactor = 0.07;

  const fp16Tflops = Math.max(6, bandwidth * tensorFactor);
  return applyTgpComputeScale({
    fp32Tflops: fp16Tflops * 0.5,
    fp16Tflops,
    bf16Tflops: fp16Tflops * 0.92,
    int8Tops: fp16Tflops * 2,
  }, preset, powerLimitW);
}

function applyTgpComputeScale(compute, preset, powerLimitW) {
  if (preset?.formFactor !== "laptop" || !preset.tgpReferenceW) return compute;
  const bounded = clampNumber(powerLimitW, preset.tgpMinW || 20, preset.tgpMaxW || 600, preset.tgpReferenceW);
  const scale = Math.max(0.45, Math.min(1.12, Math.pow(bounded / preset.tgpReferenceW, 0.72)));
  return Object.fromEntries(Object.entries(compute).map(([key, value]) => [key, value * scale]));
}

function getActiveModels() {
  return MODEL_GROUPS[activeWorkload] || GENERATIVE_MODELS;
}

function getAllModels() {
  return Object.values(MODEL_GROUPS).flat();
}

function isVisionWorkload(workload) {
  return VISION_WORKLOADS.has(workload);
}

function isVisionModel(model) {
  return VISION_MODEL_TYPES.has(model.type);
}

function getWorkloadSettings() {
  if (activeWorkload === "embedding") {
    return {
      type: "embedding",
      inputTokens: clampNumber($("embeddingInputTokens").value, 1, 32768, 384),
      batchSize: clampNumber($("embeddingBatchSize").value, 1, 1024, 32),
      precisionId: $("encoderPrecision").value,
      runtime: $("encoderRuntime").value,
      maxBatchTokens: clampNumber($("embeddingBatchTokens").value, 512, 1048576, 16384),
    };
  }

  if (activeWorkload === "reranker") {
    return {
      type: "reranker",
      queryTokens: clampNumber($("rerankerQueryTokens").value, 1, 8192, 64),
      docTokens: clampNumber($("rerankerDocTokens").value, 1, 32768, 512),
      candidates: clampNumber($("rerankerCandidates").value, 1, 10000, 40),
      batchSize: clampNumber($("rerankerBatchSize").value, 1, 1024, 16),
      precisionId: $("rerankerPrecision").value,
      runtime: $("rerankerRuntime").value,
    };
  }

  if (isVisionWorkload(activeWorkload)) {
    return {
      type: activeWorkload,
      resolutionPreset: $("ocrResolutionPreset").value,
      width: clampNumber($("ocrWidth").value, 320, 10000, 1654),
      height: clampNumber($("ocrHeight").value, 320, 14000, 2339),
      batchSize: clampNumber($("ocrBatchSize").value, 1, 256, 1),
      precisionId: $("ocrPrecision").value,
      featureSet: $("ocrFeatureSet").value,
      steps: clampNumber($("mediaSteps")?.value, 1, 150, 28),
      frames: clampNumber($("mediaFrames")?.value, 1, 241, 81),
      fps: clampNumber($("mediaFps")?.value, 1, 60, 16),
      loraCount: clampNumber($("mediaLoraCount")?.value, 0, 8, 0),
      offload: $("mediaOffload")?.value || "none",
      optimization: $("mediaOptimization")?.value || "standard",
    };
  }

  return {
    type: "generative",
    context: getHardware().context,
    concurrency: getHardware().concurrency,
    outputTokens: getHardware().outputTokens,
    kvPrecision: getHardware().kvPrecision,
    runtime: getHardware().runtime,
    quantization: $("quantization").value,
  };
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
  const effectiveVram = getEffectiveVram(hardware);
  const pressure = getVramPressure(requiredGb, effectiveVram);
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
  const preferredIds = ["q6", "q5", "q5_k_s", "q5_0", "q4", "q4_k_s", "q4_0", "q3", "q3_k_s", "q2", "iq2_xxs"];
  const qualityFirst = preferredIds
    .map((id) => QUANTS.find((item) => item.id === id))
    .filter(Boolean);
  const effectiveVram = getEffectiveVram(hardware);

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

  return qualityFirst[qualityFirst.length - 1] || QUANTS.find((item) => item.id === "q2");
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

function estimateAnyModel(model, hardware) {
  let estimate;
  if (model.type === "embedding") estimate = estimateEncoderModel(model, hardware, getWorkloadSettings());
  else if (model.type === "reranker") estimate = estimateRerankerModel(model, hardware, getWorkloadSettings());
  else if (model.type === "audio-stt" || model.type === "audio-tts") estimate = estimateAudioModel(model, hardware);
  else if (isVisionModel(model)) estimate = estimateOcrModel(model, hardware, getWorkloadSettings());
  else estimate = normalizeGenerativeEstimate(estimateModel(model, $("quantization").value, hardware));
  return applyMeasuredCalibration(estimate, hardware);
}

function estimateAudioModel(model, hardware) {
  const weightsGb = model.params * 2 * 1.08;
  const runtimeOverheadGb = 1.1 + model.params * 0.35;
  const activationGb = Math.max(0.35, model.params * 0.7);
  const requiredGb = weightsGb + runtimeOverheadGb + activationGb;
  const effectiveVram = getEffectiveVram(hardware);
  const pressure = getVramPressure(requiredGb, effectiveVram);
  const grade = gradeFromPressure(pressure, requiredGb, effectiveVram + hardware.ram * 0.35);
  const computeScale = Math.sqrt(Math.max(0.05, hardware.computeTotal.fp16Tflops / 82));
  const bandwidthScale = Math.sqrt(Math.max(0.05, hardware.aggregateBandwidth / 504));
  const fitScale = grade === "F" ? 0 : grade === "D" ? 0.25 : grade === "C" ? 0.65 : 1;
  const speed = model.realtimeBase * computeScale * bandwidthScale * fitScale;
  return {
    model,
    precision: { id: "fp16", label: "FP16" },
    weightsGb,
    runtimeOverheadGb,
    activationGb,
    requiredGb,
    effectiveVram,
    pressure,
    grade,
    speed,
    throughput: speed,
    latencySeconds: speed ? 1 / speed : 0,
    firstTokenSeconds: speed ? 0.2 / speed : 0,
    contextLimitTokens: 0,
    contextSupported: true,
    settingLabel: "FP16 · GPU",
    speedLabel: `${speed.toFixed(speed >= 10 ? 0 : 1)}× realtime`,
    limitLabel: model.type === "audio-stt" ? "60 min audio" : "streaming",
    unitLabel: "x realtime",
    reason: grade === "F"
      ? (uiLanguage === "en" ? "The model exceeds available GPU and system memory." : "모델이 사용 가능한 GPU·시스템 메모리를 초과합니다.")
      : (uiLanguage === "en" ? "Estimated real-time factor for one audio stream." : "오디오 1개 스트림 기준 예상 실시간 배속입니다."),
  };
}

function applyMeasuredCalibration(estimate, hardware) {
  const calibration = getMeasuredCalibration(estimate.model, estimate, hardware);
  if (!calibration || !estimate.speed) return { ...estimate, calibration: null };
  const speed = estimate.speed * calibration.factor;
  const throughputRatio = estimate.speed > 0 ? speed / estimate.speed : 1;
  const latencySeconds = estimate.latencySeconds ? estimate.latencySeconds / throughputRatio : estimate.latencySeconds;
  const unitLabel = estimate.unitLabel || "tok/s";
  return {
    ...estimate,
    speed,
    throughput: estimate.throughput ? estimate.throughput * throughputRatio : speed,
    latencySeconds,
    speedLabel: formatThroughput(speed, unitLabel),
    calibration,
  };
}

function getMeasuredCalibration(model, estimate, hardware) {
  const rows = getGpuBenchmarkRows(hardware.preset)
    .filter((row) => benchmarkEvidenceType(row) !== "external")
    .filter((row) => row.modelName === model.name || row.modelKey === modelKey(model));
  const ratios = [];
  for (const row of rows) {
    const measured = getBenchmarkNumericValue(row);
    if (!measured || measured.unit !== (estimate.unitLabel || "tok/s")) continue;
    const preset = GPU_PRESETS.find((gpu) => gpu.id === row.gpuId) || hardware.preset;
    const raw = estimateBenchmarkRow(model, row, preset);
    if (!raw?.speed) continue;
    ratios.push(measured.value / raw.speed);
  }
  if (!ratios.length) return null;
  ratios.sort((a, b) => a - b);
  const median = medianValue(ratios);
  const deviations = ratios.map((value) => Math.abs(value - median)).sort((a, b) => a - b);
  const mad = medianValue(deviations);
  return {
    factor: Math.max(0.35, Math.min(2.5, median)),
    sampleCount: ratios.length,
    relativeMad: median ? mad / median : 0,
  };
}

function medianValue(values) {
  if (!values.length) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function normalizeGenerativeEstimate(estimate) {
  return {
    ...estimate,
    settingLabel: estimate.quant.label,
    speedLabel: formatSpeed(estimate.speed),
    limitLabel: formatContext(estimate.contextLimitTokens),
    unitLabel: "tok/s",
    latencyLabel: formatDuration(estimate.latencySeconds),
  };
}

function estimateEncoderModel(model, hardware, workload, precisionId = workload.precisionId) {
  const precision = resolvePrecision(
    model,
    precisionId,
    ENCODER_PRECISIONS,
    (candidate) => estimateEncoderWithPrecision(model, hardware, workload, candidate),
  );
  return estimateEncoderWithPrecision(model, hardware, workload, precision);
}

function estimateEncoderWithPrecision(model, hardware, workload, precision) {
  const runtime = ENCODER_RUNTIME_PROFILES[workload.runtime] || ENCODER_RUNTIME_PROFILES.tei;
  const effectiveVram = getEffectiveVram(hardware);
  const inputTokens = Math.min(workload.inputTokens, model.maxTokens);
  const microBatch = Math.max(1, Math.min(workload.batchSize, Math.floor(workload.maxBatchTokens / Math.max(1, inputTokens))));
  const microBatches = Math.ceil(workload.batchSize / microBatch);
  const weightsGb = model.params * precision.bytesPerParam * 1.08;
  const tokenStateGb = microBatch * inputTokens * model.hiddenSize * precision.activationBytes / 1e9;
  const activationGb = tokenStateGb * runtime.hiddenFactor;
  const attentionGb = model.supportsFlashAttention
    ? tokenStateGb * runtime.attentionFactor
    : microBatch * model.attentionHeads * inputTokens * inputTokens * precision.activationBytes * runtime.attentionFactor / 1e9;
  const outputGb = microBatch * model.embeddingDim * 4 / 1e9;
  const runtimeOverheadGb = runtime.baseOverheadGb + Math.max(0, microBatch - 1) * runtime.batchOverheadGb;
  const requiredGb = weightsGb + activationGb + attentionGb + outputGb + runtimeOverheadGb;
  const pressure = getVramPressure(requiredGb, effectiveVram);
  const grade = workload.inputTokens <= model.maxTokens
    ? gradeFromPressure(pressure, requiredGb, effectiveVram + hardware.ram * 0.35)
    : "F";
  const speed = estimateEncoderThroughput(model, hardware, runtime, precision, inputTokens, microBatch, weightsGb, activationGb, attentionGb, grade);
  const batchLatencySeconds = speed.batchSeconds * microBatches;
  const reason = buildEncoderReason(model, workload, grade, requiredGb, effectiveVram, microBatch);

  return {
    model,
    precision,
    runtime,
    weightsGb,
    activationGb,
    attentionGb,
    outputGb,
    runtimeOverheadGb,
    requiredGb,
    effectiveVram,
    pressure,
    grade,
    speed: speed.docsPerSecond,
    throughput: speed.tokensPerSecond,
    batchLatencySeconds,
    firstTokenSeconds: batchLatencySeconds,
    contextLimitTokens: model.maxTokens,
    contextSupported: workload.inputTokens <= model.maxTokens,
    settingLabel: `${precision.label} · ${runtime.shortLabel || runtime.label}`,
    speedLabel: `${formatThroughput(speed.docsPerSecond, "doc/s")} · ${formatThroughput(speed.tokensPerSecond, "tok/s")}`,
    limitLabel: formatContext(model.maxTokens),
    unitLabel: "doc/s",
    reason,
    microBatch,
    microBatches,
    inputTokens,
  };
}

function estimateRerankerModel(model, hardware, workload, precisionId = workload.precisionId) {
  const precision = resolvePrecision(
    model,
    precisionId,
    ENCODER_PRECISIONS,
    (candidate) => estimateRerankerWithPrecision(model, hardware, workload, candidate),
  );
  return estimateRerankerWithPrecision(model, hardware, workload, precision);
}

function estimateRerankerWithPrecision(model, hardware, workload, precision) {
  const runtime = ENCODER_RUNTIME_PROFILES[workload.runtime] || ENCODER_RUNTIME_PROFILES.tei;
  const effectiveVram = getEffectiveVram(hardware);
  const pairTokens = workload.queryTokens + workload.docTokens + 3;
  const batchSize = workload.batchSize;
  const weightsGb = model.params * precision.bytesPerParam * 1.08;
  const tokenStateGb = batchSize * Math.min(pairTokens, model.maxTokens) * model.hiddenSize * precision.activationBytes / 1e9;
  const activationGb = tokenStateGb * (runtime.hiddenFactor + 1.2);
  const attentionGb = model.supportsFlashAttention
    ? tokenStateGb * runtime.attentionFactor
    : batchSize * model.attentionHeads * pairTokens * pairTokens * precision.activationBytes * runtime.attentionFactor / 1e9;
  const scoreBufferGb = batchSize * 4 / 1e9;
  const runtimeOverheadGb = runtime.baseOverheadGb + Math.max(0, batchSize - 1) * runtime.batchOverheadGb;
  const requiredGb = weightsGb + activationGb + attentionGb + scoreBufferGb + runtimeOverheadGb;
  const pressure = getVramPressure(requiredGb, effectiveVram);
  const contextSupported = pairTokens <= model.maxTokens;
  const grade = contextSupported ? gradeFromPressure(pressure, requiredGb, effectiveVram + hardware.ram * 0.35) : "F";
  const speed = estimateEncoderThroughput(model, hardware, runtime, precision, Math.min(pairTokens, model.maxTokens), batchSize, weightsGb, activationGb, attentionGb, grade);
  const rerankPasses = Math.ceil(workload.candidates / batchSize);
  const queryLatencySeconds = speed.batchSeconds * rerankPasses;
  const pairsPerSecond = speed.docsPerSecond;
  const reason = buildRerankerReason(model, workload, grade, requiredGb, effectiveVram, pairTokens);

  return {
    model,
    precision,
    runtime,
    weightsGb,
    activationGb,
    attentionGb,
    outputGb: scoreBufferGb,
    runtimeOverheadGb,
    requiredGb,
    effectiveVram,
    pressure,
    grade,
    speed: pairsPerSecond,
    throughput: pairsPerSecond * pairTokens,
    batchLatencySeconds: speed.batchSeconds,
    latencySeconds: queryLatencySeconds,
    firstTokenSeconds: queryLatencySeconds,
    contextLimitTokens: model.maxTokens,
    contextSupported,
    settingLabel: `${precision.label} · ${runtime.shortLabel || runtime.label}`,
    speedLabel: `${formatThroughput(pairsPerSecond, "pair/s")} · 질의 ${formatDuration(queryLatencySeconds)}`,
    limitLabel: formatContext(model.recommendedTokens || model.maxTokens),
    unitLabel: "pair/s",
    reason,
    pairTokens,
    rerankPasses,
  };
}

function estimateEncoderThroughput(model, hardware, runtime, precision, tokens, batchSize, weightsGb, activationGb, attentionGb, grade) {
  if (grade === "F") return { docsPerSecond: 0, tokensPerSecond: 0, batchSeconds: 0 };

  const multiGpuPenalty = hardware.count > 1 ? (hardware.heterogeneous ? 0.72 : 0.82) : 1;
  const computeTflops = Math.max(1, hardware.computeTotal[precision.computeKey] || hardware.computeTotal.fp16Tflops) * multiGpuPenalty * precision.speedFactor;
  const flops = model.layers * (
    24 * batchSize * tokens * model.hiddenSize * model.hiddenSize
    + 4 * batchSize * tokens * tokens * model.hiddenSize
  );
  const computeSeconds = flops / (computeTflops * 1e12 * runtime.computeEfficiency);
  const bytesRead = Math.max(0.05, weightsGb + activationGb + attentionGb) * 1e9;
  const memorySeconds = bytesRead / (hardware.aggregateBandwidth * 1e9 * runtime.bandwidthEfficiency * multiGpuPenalty);
  const pressurePenalty = grade === "D" ? 3.8 : grade === "C" ? 1.7 : 1;
  const batchSeconds = (Math.max(computeSeconds, memorySeconds) + runtime.fixedLatencyMs / 1000) * pressurePenalty;
  const docsPerSecond = batchSeconds > 0 ? batchSize / batchSeconds : 0;
  const tokensPerSecond = docsPerSecond * tokens;

  return { docsPerSecond, tokensPerSecond, batchSeconds };
}

function estimateOcrModel(model, hardware, workload, precisionId = workload.precisionId) {
  if (model.type === "image-generation" || model.type === "video-generation" || model.type === "avatar-generation") {
    return estimateMediaModel(model, hardware, workload, precisionId);
  }
  const precision = resolvePrecision(
    model,
    precisionId,
    OCR_PRECISIONS,
    (candidate) => estimateOcrWithPrecision(model, hardware, workload, candidate),
  );
  return estimateOcrWithPrecision(model, hardware, workload, precision);
}

function estimateVisionWithPrecision(model, hardware, workload, precision) {
  return model.type === "image-generation" || model.type === "video-generation" || model.type === "avatar-generation"
    ? estimateMediaWithPrecision(model, hardware, workload, precision)
    : estimateOcrWithPrecision(model, hardware, workload, precision);
}

function estimateMediaModel(model, hardware, workload, precisionId = workload.precisionId) {
  const precision = resolvePrecision(
    model,
    precisionId,
    OCR_PRECISIONS,
    (candidate) => estimateMediaWithPrecision(model, hardware, workload, candidate),
  );
  return estimateMediaWithPrecision(model, hardware, workload, precision);
}

function estimateMediaWithPrecision(model, hardware, workload, precision) {
  const isVideo = model.type === "video-generation" || model.type === "avatar-generation";
  const megapixels = (workload.width * workload.height) / 1e6;
  const frames = isVideo ? workload.frames || 81 : 1;
  const steps = workload.steps || 28;
  const batchSize = workload.batchSize || 1;
  const profile = model.profiles?.[precision.id] || model.profiles?.fp16 || {};
  const effectiveVram = getEffectiveVram(hardware);
  const offloadFactor = workload.offload === "sequential" ? 0.58 : workload.offload === "tiled" ? 0.78 : 1;
  const weightsGb = model.params * precision.bytesPerParam * 1.08 * offloadFactor;
  const textEncoderGb = (model.textEncoderGb || Math.min(5.2, 0.5 + model.params * 0.22)) * offloadFactor;
  const vaeGb = (model.vaeGb || (isVideo ? 1.8 : 0.8)) * (workload.offload === "tiled" ? 0.55 : 1);
  const spatialActivationGb = batchSize * megapixels * (profile.activationGbPerMegapixel || 2.5);
  const temporalActivationGb = isVideo
    ? spatialActivationGb * Math.max(1, Math.sqrt(frames / 16)) * (model.temporalFactor || 1.25)
    : 0;
  const loraMemoryGb = (workload.loraCount || 0) * Math.max(0.18, model.params * 0.035);
  const runtimeOverheadGb = (profile.baseRuntimeGb || 2.5) + Math.max(0, batchSize - 1) * (profile.batchOverheadGb || 0.8);
  const activationGb = (spatialActivationGb + temporalActivationGb) * offloadFactor;
  const optimizationMemoryScale = workload.optimization === "attention" || workload.optimization === "combined" ? 0.82 : 1;
  const optimizedActivationGb = activationGb * optimizationMemoryScale;
  const requiredGb = weightsGb + textEncoderGb + vaeGb + optimizedActivationGb + loraMemoryGb + runtimeOverheadGb;
  const pressure = getVramPressure(requiredGb, effectiveVram);
  const grade = gradeFromPressure(pressure, requiredGb, effectiveVram + hardware.ram * (workload.offload === "none" ? 0.25 : 0.55));

  const reference = model.reference || {};
  const referenceRate = reference.pagesPerSecond || (isVideo ? 0.005 : 0.1);
  const referencePixels = Math.max(0.2, ((reference.width || 1024) * (reference.height || 1024)) / 1e6);
  const computeScale = Math.sqrt(Math.max(0.05, hardware.computeTotal.fp16Tflops / 170));
  const bandwidthScale = Math.sqrt(Math.max(0.05, hardware.aggregateBandwidth / (reference.bandwidth || 1008)));
  const resolutionScale = Math.pow(referencePixels / Math.max(0.2, megapixels), 0.9);
  const stepScale = model.type === "avatar-generation" ? 1 : 28 / Math.max(1, steps);
  const frameScale = isVideo ? 81 / Math.max(1, frames) : 1;
  const fitScale = grade === "F" ? 0 : grade === "D" ? 0.14 : grade === "C" ? 0.48 : 1;
  const offloadSpeedScale = workload.offload === "sequential" ? 0.28 : workload.offload === "tiled" ? 0.7 : 1;
  const optimizationSpeedScale = workload.optimization === "combined" ? 1.72 : workload.optimization === "cache" ? 1.45 : workload.optimization === "attention" ? 1.18 : 1;
  const speed = referenceRate * computeScale * bandwidthScale * resolutionScale * stepScale * frameScale * fitScale * offloadSpeedScale * optimizationSpeedScale;
  const latencySeconds = speed > 0 ? 1 / speed : 0;
  const unitLabel = isVideo ? "clip/s" : "image/s";
  const durationNote = isVideo
    ? `${formatDuration(latencySeconds)} / ${(frames / Math.max(1, workload.fps || 16)).toFixed(1)}s clip`
    : `${formatDuration(latencySeconds)} / image`;

  return {
    model,
    precision,
    weightsGb,
    textEncoderGb,
    vaeGb,
    activationGb: optimizedActivationGb,
    temporalActivationGb,
    loraMemoryGb,
    runtimeOverheadGb,
    requiredGb,
    effectiveVram,
    pressure,
    grade,
    speed,
    throughput: speed,
    latencySeconds,
    firstTokenSeconds: latencySeconds,
    contextLimitTokens: 0,
    contextSupported: true,
    settingLabel: `${precision.label} · ${workload.offload === "none" ? "GPU" : workload.offload}`,
    speedLabel: `${formatThroughput(speed, unitLabel)} · ${durationNote}`,
    limitLabel: isVideo ? `${workload.width}×${workload.height} · ${frames}f` : `${workload.width}×${workload.height}`,
    unitLabel,
    reason: buildMediaReason(model, workload, grade, requiredGb, effectiveVram),
    megapixels,
    frames,
    fps: workload.fps,
    steps,
  };
}

function buildMediaReason(model, workload, grade, requiredGb, effectiveVram) {
  const en = uiLanguage === "en";
  const kind = model.type === "avatar-generation"
    ? (en ? "avatar" : "아바타")
    : model.type === "video-generation" ? (en ? "video" : "비디오") : (en ? "image" : "이미지");
  if (grade === "F") return en
    ? `${kind} generation needs about ${formatGb(requiredGb)}, above the available ${formatGb(effectiveVram)} even with the selected memory strategy.`
    : `${kind} 생성에 약 ${formatGb(requiredGb)}가 필요해 선택한 메모리 전략에서도 가용 ${formatGb(effectiveVram)}를 초과합니다.`;
  if (grade === "D") return en
    ? "CPU offload is required and generation time can increase substantially."
    : "CPU 오프로딩이 필요하며 생성 시간이 크게 늘어날 수 있습니다.";
  if (grade === "C") return en
    ? "VRAM headroom is tight; reduce resolution, frames, steps, batch size, or LoRA count."
    : "VRAM 여유가 작습니다. 해상도·프레임·스텝·배치·LoRA 수를 줄이는 편이 안정적입니다.";
  return en
    ? `Runnable at ${workload.width}×${workload.height}${["video-generation", "avatar-generation"].includes(model.type) ? `, ${workload.frames} frames` : `, ${workload.steps} steps`}.`
    : `${workload.width}×${workload.height}${["video-generation", "avatar-generation"].includes(model.type) ? `, ${workload.frames}프레임` : `, ${workload.steps}스텝`} 기준 실행 가능한 범위입니다.`;
}

function estimateOcrWithPrecision(model, hardware, workload, precision) {
  const effectiveVram = getEffectiveVram(hardware);
  const megapixels = (workload.width * workload.height) / 1e6;
  const profile = model.profiles?.[precision.id] || model.profiles?.fp16 || {};
  const isImageGenerator = model.type === "image-generation";
  const isVideoGenerator = model.type === "video-generation";
  const frameMemoryFactor = isVideoGenerator ? Math.max(1, Math.sqrt(workload.frames || 81) / 3) : 1;
  const loraMemoryGb = (workload.loraCount || 0) * Math.max(0.2, model.params * 0.035);
  const offloadMemoryFactor = workload.offload === "sequential" ? 0.62 : workload.offload === "tiled" ? 0.78 : 1;
  const featureMultiplier = getOcrFeatureMultiplier(workload.featureSet, model);
  const imageBufferGb = workload.batchSize * workload.width * workload.height * 3 * precision.activationBytes * 2 / 1e9;
  let weightsGb = 0;
  let kvGb = 0;

  if (model.type !== "ocr-pipeline") {
    weightsGb = model.params * precision.bytesPerParam * 1.08;
    const imageTokens = estimateImageTokens(model, workload.width, workload.height);
    const totalTokens = imageTokens + 64 + Math.min(2048, model.maxOutputTokens || 1024);
    kvGb = 2 * model.decoderLayers * workload.batchSize * totalTokens * model.kvHeads * model.headDim * precision.activationBytes / 1e9;
  } else {
    weightsGb = (profile.residentWeightsGb || model.params * precision.bytesPerParam * 1.08) * featureMultiplier;
  }

  const activationGb = workload.batchSize * megapixels * (profile.activationGbPerMegapixel || 0.2) * featureMultiplier * frameMemoryFactor * offloadMemoryFactor;
  const runtimeOverheadGb = (profile.baseRuntimeGb || 0.8) * featureMultiplier
    + Math.max(0, workload.batchSize - 1) * (profile.batchOverheadGb || 0.06);
  const requiredGb = weightsGb * offloadMemoryFactor + kvGb + activationGb + imageBufferGb + runtimeOverheadGb + loraMemoryGb;
  const pressure = getVramPressure(requiredGb, effectiveVram);
  const grade = gradeFromPressure(pressure, requiredGb, effectiveVram + hardware.ram * 0.3);
  let pagesPerSecond = estimateOcrThroughput(model, hardware, workload, precision, megapixels, grade, featureMultiplier);
  if (isImageGenerator || isVideoGenerator) {
    const stepPenalty = Math.max(0.08, 28 / Math.max(1, workload.steps || 28));
    const framePenalty = isVideoGenerator ? Math.max(0.03, 81 / Math.max(1, workload.frames || 81)) : 1;
    const offloadPenalty = workload.offload === "sequential" ? 0.32 : workload.offload === "tiled" ? 0.72 : 1;
    pagesPerSecond *= stepPenalty * framePenalty * offloadPenalty;
  }
  const secondsPerPage = pagesPerSecond > 0 ? 1 / pagesPerSecond : 0;
  const reason = buildOcrReason(model, workload, grade, requiredGb, effectiveVram, megapixels);
  const outputUnit = isImageGenerator ? "image/s" : isVideoGenerator ? "clip/s" : "page/s";
  const durationUnit = isImageGenerator ? "image" : isVideoGenerator ? "clip" : "page";
  const settingSuffix = isImageGenerator || isVideoGenerator ? "Diffusers" : ocrFeatureLabel(workload.featureSet);

  return {
    model,
    precision,
    weightsGb,
    kvGb,
    activationGb,
    imageBufferGb,
    runtimeOverheadGb,
    requiredGb,
    effectiveVram,
    pressure,
    grade,
    speed: pagesPerSecond,
    throughput: pagesPerSecond,
    latencySeconds: secondsPerPage,
    firstTokenSeconds: secondsPerPage,
    contextLimitTokens: model.maxImageTokens || 0,
    contextSupported: true,
    settingLabel: `${precision.label} · ${settingSuffix}`,
    speedLabel: `${formatThroughput(pagesPerSecond, outputUnit)} · ${formatDuration(secondsPerPage)}/${durationUnit}`,
    limitLabel: `${formatMegapixels(megapixels)}`,
    unitLabel: outputUnit,
    reason,
    megapixels,
    frames: workload.frames,
    fps: workload.fps,
    steps: workload.steps,
    loraMemoryGb,
  };
}

function estimateOcrThroughput(model, hardware, workload, precision, megapixels, grade, featureMultiplier) {
  if (grade === "F") return 0;

  const reference = model.reference || {};
  const referenceBandwidth = reference.bandwidth || 1008;
  const referenceMegapixels = reference.width && reference.height ? reference.width * reference.height / 1e6 : 3.87;
  const referenceBatch = reference.batch || 1;
  const basePps = reference.pagesPerSecond || 1;
  const multiGpuPenalty = hardware.count > 1 ? (hardware.heterogeneous ? 0.72 : 0.82) : 1;
  const hardwareScale = Math.sqrt((hardware.aggregateBandwidth * multiGpuPenalty) / referenceBandwidth);
  const resolutionScale = Math.pow(referenceMegapixels / Math.max(0.2, megapixels), 0.85);
  const batchScale = referenceBatch > 1
    ? Math.log2(workload.batchSize + 1) / Math.log2(referenceBatch + 1)
    : 1 + Math.log2(workload.batchSize) * 0.32;
  const precisionScale = precision.speedFactor || 1;
  const fitPenalty = grade === "D" ? 0.2 : grade === "C" ? 0.55 : 1;
  return Math.max(0, basePps * hardwareScale * resolutionScale * Math.max(0.12, batchScale) * precisionScale * fitPenalty / featureMultiplier);
}

function resolvePrecision(model, precisionId, precisionOptions, estimateForPrecision) {
  const supported = precisionOptions.filter((precision) => precision.id !== "auto" && model.precisions.includes(precision.id));
  if (precisionId !== "auto") {
    return supported.find((precision) => precision.id === precisionId) || supported[0] || precisionOptions[1];
  }

  const priority = ["fp16", "bf16", "int8", "int4", "fp32"];
  const prioritized = priority
    .map((id) => supported.find((precision) => precision.id === id))
    .filter(Boolean);

  for (const candidate of prioritized) {
    const estimate = estimateForPrecision(candidate);
    if (GRADE_META[estimate.grade].score >= GRADE_META.B.score) return candidate;
  }

  for (const candidate of prioritized) {
    const estimate = estimateForPrecision(candidate);
    if (estimate.grade !== "F") return candidate;
  }

  for (const id of priority) {
    const candidate = supported.find((precision) => precision.id === id);
    if (candidate) return candidate;
  }
  const fallbackOrder = ["int4", "int8", "fp16", "bf16", "fp32"];
  return fallbackOrder.map((id) => supported.find((precision) => precision.id === id)).find(Boolean)
    || supported[0]
    || precisionOptions[1];
}

function getEffectiveVram(hardware) {
  if (Number.isFinite(hardware.availableVram)) return hardware.availableVram;
  return hardware.baseEffectiveVram || hardware.vram * hardware.count * (hardware.count > 1 ? 0.92 : 1);
}

function getVramPressure(requiredGb, effectiveVram) {
  return requiredGb / Math.max(0.1, effectiveVram);
}

function getOcrFeatureMultiplier(featureSet, model) {
  const supportsLayout = model.tags?.includes("layout");
  const supportsTable = model.tags?.includes("table") || model.tags?.includes("math");
  if (featureSet === "full") return supportsLayout || supportsTable ? 1.75 : 1.2;
  if (featureSet === "table") return supportsTable ? 1.45 : 1.15;
  if (featureSet === "layout") return supportsLayout ? 1.25 : 1.08;
  return 1;
}

function estimateImageTokens(model, width, height) {
  const patchSize = model.patchSize || 16;
  const mergeSize = model.mergeSize || 1;
  const rawTokens = Math.ceil(width / patchSize) * Math.ceil(height / patchSize) / (mergeSize * mergeSize);
  return Math.min(model.maxImageTokens || rawTokens, rawTokens);
}

function buildEncoderReason(model, workload, grade, requiredGb, effectiveVram, microBatch) {
  const en = uiLanguage === "en";
  if (workload.inputTokens > model.maxTokens) {
    return en
      ? `The selected ${formatContext(workload.inputTokens)} input length exceeds the model's ${formatContext(model.maxTokens)} limit.`
      : `선택한 ${formatContext(workload.inputTokens)} 입력 길이가 모델 한도 ${formatContext(model.maxTokens)}를 초과합니다.`;
  }
  if (microBatch < workload.batchSize) {
    return en
      ? `Based on TEI-style max batch tokens, ${workload.batchSize} requests were split into micro-batches of ${microBatch}.`
      : `TEI식 최대 배치 토큰 기준으로 ${workload.batchSize}개 요청을 ${microBatch}개 micro-batch로 나누어 계산했습니다.`;
  }
  if (grade === "F") return en
    ? `Peak VRAM of ${formatGb(requiredGb)} exceeds the available VRAM (${formatGb(effectiveVram)}) plus RAM-assist range.`
    : `Peak VRAM ${formatGb(requiredGb)}가 가용 VRAM ${formatGb(effectiveVram)}와 RAM 보조 범위를 초과합니다.`;
  if (grade === "D") return en
    ? "This is beyond GPU-only processing and needs RAM/CPU assistance or a smaller batch."
    : "GPU 단독 처리보다 RAM/CPU 보조나 배치 축소가 필요한 범위입니다.";
  if (grade === "C") return en
    ? "Lowering the batch size or input length a bit would give more stable embedding throughput."
    : "배치 또는 입력 길이를 조금 낮추면 더 안정적인 임베딩 처리량을 기대할 수 있습니다.";
  return en
    ? `An embedding workload that fits in GPU memory at ${workload.inputTokens} tokens, batch ${workload.batchSize}.`
    : `${workload.inputTokens} 토큰, 배치 ${workload.batchSize} 기준으로 GPU 메모리 안에 들어오는 임베딩 워크로드입니다.`;
}

function buildRerankerReason(model, workload, grade, requiredGb, effectiveVram, pairTokens) {
  const en = uiLanguage === "en";
  if (pairTokens > model.maxTokens) {
    return en
      ? `The query+document input of ${formatContext(pairTokens)} exceeds the model's ${formatContext(model.maxTokens)} limit.`
      : `질의+문서 ${formatContext(pairTokens)} 입력이 모델 한도 ${formatContext(model.maxTokens)}를 초과합니다.`;
  }
  if (pairTokens > (model.recommendedTokens || model.maxTokens)) {
    return en
      ? `Within the model limit, but longer than the recommended input of ${formatContext(model.recommendedTokens || model.maxTokens)} — latency may increase.`
      : `모델 한도 안에는 들어가지만 권장 입력 ${formatContext(model.recommendedTokens || model.maxTokens)}보다 길어 지연시간이 커질 수 있습니다.`;
  }
  if (grade === "F") return en
    ? `Reranker peak VRAM of ${formatGb(requiredGb)} greatly exceeds the available VRAM (${formatGb(effectiveVram)}).`
    : `리랭커 peak VRAM ${formatGb(requiredGb)}가 가용 VRAM ${formatGb(effectiveVram)}를 크게 초과합니다.`;
  if (grade === "D") return en
    ? `Processing ${workload.candidates} candidates needs a smaller batch or CPU/RAM assistance.`
    : `후보 ${workload.candidates}개를 처리하려면 배치 축소나 CPU/RAM 보조를 고려해야 합니다.`;
  return en
    ? `${workload.candidates} candidates split into batches of ${workload.batchSize}, run over ${Math.ceil(workload.candidates / workload.batchSize)} inference passes.`
    : `후보 ${workload.candidates}개를 배치 ${workload.batchSize}로 나누어 ${Math.ceil(workload.candidates / workload.batchSize)}회 추론하는 기준입니다.`;
}

function buildOcrReason(model, workload, grade, requiredGb, effectiveVram, megapixels) {
  const en = uiLanguage === "en";
  if (grade === "F") return en
    ? `Peak VRAM of ${formatGb(requiredGb)} for a ${formatMegapixels(megapixels)} image exceeds the available VRAM (${formatGb(effectiveVram)}) plus RAM-assist range.`
    : `${formatMegapixels(megapixels)} 이미지의 peak VRAM ${formatGb(requiredGb)}가 가용 VRAM ${formatGb(effectiveVram)}와 RAM 보조 범위를 초과합니다.`;
  if (grade === "D") return en
    ? "An OCR workload that needs CPU/RAM assistance or a smaller batch page count rather than GPU-only processing."
    : "GPU 단독 처리보다 CPU/RAM 보조 또는 배치 페이지 축소가 필요한 OCR 워크로드입니다.";
  if (grade === "C") return en
    ? "Image resolution or batch size leaves little VRAM headroom. Lowering DPI or batch pages would be more stable."
    : "이미지 해상도나 배치가 높아 VRAM 여유가 작습니다. DPI 또는 배치 페이지를 낮추는 편이 안정적입니다.";
  return en
    ? `A runnable OCR workload at ${formatMegapixels(megapixels)}, batch ${workload.batchSize} pages.`
    : `${formatMegapixels(megapixels)}, 배치 ${workload.batchSize}페이지 기준으로 실행 가능한 OCR 워크로드입니다.`;
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

  const multiGpuPenalty = hardware.count > 1 ? (hardware.heterogeneous ? 0.64 : 0.76) : 1;
  const runtimePenalty = hardware.runtime === "vllm" ? 1.1 : hardware.runtime === "transformers" ? 0.78 : 1;
  const offloadPenalty = grade === "D" ? 0.22 : grade === "C" ? 0.55 : 1;
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const activeBytes = Math.max(model.active * quant.bytesPerB, 1);
  const raw = (hardware.aggregateBandwidth * multiGpuPenalty * runtimePenalty) / (activeBytes * 4);
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

function computeConcurrencyBounds(model, quant, hardware, effectiveVramOverride) {
  // requiredGb(N) = A + N * B for N >= 1 (KV cache와 요청당 오버헤드가 선형이라는 전제 하의 역산)
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const weightsGb = model.params * quant.bytesPerB * 1.08;
  const contextMultiplier = hardware.context / 4096;
  const kvPerUnit = model.active * 0.09 * contextMultiplier * hardware.kvMeta.factor;
  const fixedOverhead = runtimeFactor.base + Math.min(runtimeFactor.cap, weightsGb * runtimeFactor.weightRatio);
  const requestOverhead = runtimeFactor.requestOverhead;
  const a = weightsGb + fixedOverhead - requestOverhead;
  const b = kvPerUnit + requestOverhead;
  const effectiveVram = effectiveVramOverride ?? getEffectiveVram(hardware);

  const solveN = (pressureThreshold) => {
    if (b <= 0) return 256;
    const n = Math.floor((effectiveVram * pressureThreshold - a) / b);
    return Math.max(0, Math.min(256, n));
  };

  const recommendedN = solveN(0.85);
  const maxN = solveN(1);

  const speedAt = (n) => {
    if (n <= 0) return { perRequest: 0, total: 0 };
    return estimateSpeed(model, quant, { ...hardware, concurrency: n }, "B");
  };

  return {
    recommendedN,
    maxN,
    speedAtRecommended: speedAt(recommendedN),
    speedAtMax: speedAt(maxN),
  };
}

function estimateConcurrencyCapacity(model, quant, hardware) {
  return computeConcurrencyBounds(model, quant, hardware);
}

function renderConcurrencySection(model, quant, hardware) {
  const capacity = estimateConcurrencyCapacity(model, quant, hardware);
  const title = uiLanguage === "en" ? "Concurrency capacity (beta)" : "동시 처리 용량 (베타)";

  if (capacity.maxN <= 0) {
    const note = uiLanguage === "en"
      ? `With the current settings (${quant.label} · ${formatContext(hardware.context)}), this GPU's VRAM alone can't comfortably handle even 1 concurrent user. Try a lower quantization or a shorter context length.`
      : `현재 설정(${quant.label} · ${formatContext(hardware.context)})에서는 이 GPU VRAM 단독으로 1명도 여유 있게 처리하기 어렵습니다. 양자화를 낮추거나 컨텍스트 길이를 줄여보세요.`;
    return `
      <section class="detail-section">
        <h3>${escapeHtml(title)}</h3>
        <p class="detail-note">${escapeHtml(note)}</p>
      </section>
    `;
  }

  const perUser = (speed) => uiLanguage === "en" ? `About ${formatSpeed(speed)} per user` : `1인당 약 ${formatSpeed(speed)}`;
  const footnote = uiLanguage === "en"
    ? "A theoretical estimate based only on KV cache and remaining VRAM. Real-world concurrent throughput can vary widely with the serving framework's continuous-batching efficiency (vLLM, TGI, etc.), request-length distribution, and scheduling policy — use this as a reference only."
    : "KV cache와 VRAM 여유만 반영한 이론치입니다. 실제 동시접속 처리량은 vLLM·TGI 등 서빙 프레임워크의 연속 배칭 효율, 요청 길이 분포, 스케줄링 정책에 따라 크게 달라질 수 있으니 참고용으로만 사용하세요.";

  return `
    <section class="detail-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="detail-summary-grid">
        ${renderDetailMetric(
          uiLanguage === "en" ? "Recommended concurrency" : "권장 동시 인원",
          uiLanguage === "en" ? pluralize(capacity.recommendedN, "user", "users") : `${capacity.recommendedN}명`,
          uiLanguage === "en" ? "Keeps VRAM headroom (within grade A)" : "VRAM 여유 있게(등급 A 이내)",
        )}
        ${renderDetailMetric(
          uiLanguage === "en" ? "Theoretical max users" : "이론적 최대 인원",
          uiLanguage === "en" ? pluralize(capacity.maxN, "user", "users") : `${capacity.maxN}명`,
          uiLanguage === "en" ? "GPU VRAM ceiling (grade B edge)" : "GPU VRAM 한계치(등급 B 경계)",
        )}
        ${renderDetailMetric(
          uiLanguage === "en" ? "Throughput at recommended concurrency" : "권장 인원 기준 처리량",
          formatThroughput(capacity.speedAtRecommended.total, "tok/s"),
          perUser(capacity.speedAtRecommended.perRequest),
        )}
        ${renderDetailMetric(
          uiLanguage === "en" ? "Throughput at max concurrency" : "최대 인원 기준 처리량",
          formatThroughput(capacity.speedAtMax.total, "tok/s"),
          perUser(capacity.speedAtMax.perRequest),
        )}
      </div>
      <p class="detail-note">${escapeHtml(footnote)}</p>
    </section>
  `;
}

function buildReason(grade, requiredGb, effectiveVram, model, hardware, contextLimitTokens, contextSupported) {
  const en = uiLanguage === "en";
  if (!contextSupported) {
    return en
      ? `The selected ${formatContext(hardware.context)} context exceeds the model's ${formatContext(contextLimitTokens)} limit.`
      : `선택한 ${formatContext(hardware.context)} 컨텍스트가 모델 한도 ${formatContext(contextLimitTokens)}를 초과합니다.`;
  }
  if (grade === "F") {
    return en
      ? `At ${hardware.concurrency} concurrent, the estimated required VRAM of ${formatGb(requiredGb)} greatly exceeds the available VRAM of ${formatGb(effectiveVram)}.`
      : `동시 ${hardware.concurrency}명 기준 필요 VRAM 추정치가 ${formatGb(requiredGb)}로 가용 VRAM ${formatGb(effectiveVram)}를 크게 초과합니다.`;
  }
  if (grade === "D") {
    return en
      ? `At ${hardware.concurrency} concurrent, this GPU alone can't hold the model — RAM offloading is required.`
      : `동시 ${hardware.concurrency}명 기준 GPU 단독 적재는 어렵고 RAM 오프로딩 전제가 필요합니다.`;
  }
  if (grade === "C") {
    return en
      ? "This nearly fills the available VRAM. It's more stable to lower concurrent requests, context length, or KV cache precision."
      : "가용 VRAM에 거의 맞습니다. 동시 요청, 컨텍스트 길이, KV cache 정밀도를 낮추는 편이 안정적입니다.";
  }
  if (model.params >= 60 && hardware.count === 1) {
    return en
      ? `A large model, but it's within the runnable range for the selected quantization on the available VRAM of ${formatGb(effectiveVram)} (after reservations/margin).`
      : `대형 모델이지만 예약/여유분 제외 가용 VRAM ${formatGb(effectiveVram)}에서 선택 양자화 기준 실행 가능 범위입니다.`;
  }
  return en
    ? `On the selected GPU, this ${model.params}B-class model is within the runnable range at ${formatContext(hardware.context)} and ${hardware.concurrency} concurrent.`
    : `선택한 GPU에서 ${model.params}B급 모델을 ${formatContext(hardware.context)}, 동시 ${hardware.concurrency}명 기준으로 실행 가능한 범위입니다.`;
}

function getFilteredEstimates() {
  const hardware = getHardware();
  const task = $("taskFilter").value;
  const provider = $("providerFilter").value;
  const license = $("licenseFilter").value;
  const licenseUse = $("licenseUseFilter").value;
  const gradeChoice = $("gradeFilter").value;
  const search = $("searchInput").value.trim().toLowerCase();
  const summaryFilter = SUMMARY_FILTERS.find((item) => item.id === activeSummaryFilter) || SUMMARY_FILTERS[0];

  let estimates = getActiveModels().map((model) => estimateAnyModel(model, hardware));

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

  if (licenseUse !== "all") {
    estimates = estimates.filter((estimate) => getLicensePolicy(estimate.model).commercialUse === licenseUse);
  }

  if (search) {
    estimates = estimates.filter((estimate) => {
      const confidence = getEstimateConfidence(estimate.model, estimate, hardware);
      const release = getModelReleaseInfo(estimate.model);
      const benchmark = getBenchmarkSummary(estimate.model, estimate, confidence);
      const haystack = [
        estimate.model.name,
        estimate.model.maker,
        estimate.model.license,
        licenseCommercialLabel(getLicensePolicy(estimate.model)),
        licenseOpennessLabel(getLicensePolicy(estimate.model)),
        modelSummary(estimate.model),
        release.label,
        release.note,
        benchmark.label,
        benchmark.note,
        formatParams(estimate.model.params || 0),
        estimate.settingLabel,
        estimate.limitLabel,
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
    if (sortBy === "vramAsc" || sortBy === "vramHeadroom") return (b.effectiveVram - b.requiredGb) - (a.effectiveVram - a.requiredGb) || gradeSort(a, b);
    if (sortBy === "koreanFirst") return tagSort(a, b, "korean") || recommendationScore(b) - recommendationScore(a);
    if (sortBy === "codingFirst") return tagSort(a, b, "coding") || recommendationScore(b) - recommendationScore(a);
    if (sortBy === "sizeDesc") return b.model.params - a.model.params || gradeSort(a, b);
    if (sortBy === "latest") return modelFreshnessScore(b.model) - modelFreshnessScore(a.model) || gradeSort(a, b);

    return recommendationScore(b) - recommendationScore(a) || gradeSort(a, b) || a.pressure - b.pressure;
  });
}

function gradeSort(a, b) {
  return GRADE_META[b.grade].score - GRADE_META[a.grade].score;
}

function tagSort(a, b, tag) {
  const aHas = a.model.tags.includes(tag) ? 1 : 0;
  const bHas = b.model.tags.includes(tag) ? 1 : 0;
  return bHas - aHas || gradeSort(a, b);
}

function modelFreshnessScore(model) {
  // Every model (LLM, embedding, reranker, OCR/VLM alike) carries a real
  // releaseDate merged in via withModelMetadata(), so sort on that directly
  // instead of hand-maintained name-keyword scoring -- the old version only
  // recognized a hardcoded list of LLM/VLM name patterns, silently missing
  // most embedding/reranker/OCR models (and anything added after the list
  // was last updated), so "최신 모델순" wasn't actually chronological for
  // those categories.
  const timestamp = /^\d{4}-\d{2}-\d{2}/.test(model.releaseDate || "") ? Date.parse(model.releaseDate) : 0;
  // Tiny param-size tie-break for same-day releases; timestamps differ by at
  // least a full day (86400000ms) so this never outweighs a real date gap.
  return timestamp + Math.min(model.params || 0, 1000) / 1000;
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
    estimate.model.tags.includes("retrieval") ? 3 : 0,
  ].reduce((sum, value) => sum + value, 0);
  const speedBonus = Math.min(estimate.speed, 90) / 6;
  const pressurePenalty = estimate.pressure > 0.95 ? (estimate.pressure - 0.95) * 22 : 0;

  return gradeBonus + usefulSize + tagBonus + speedBonus - pressurePenalty;
}

function buildRecommendationReasons(estimate) {
  const reasons = [];
  const headroomRatio = estimate.effectiveVram > 0
    ? Math.max(0, (estimate.effectiveVram - estimate.requiredGb) / estimate.effectiveVram)
    : 0;

  if (GRADE_META[estimate.grade].score >= GRADE_META.A.score) reasons.push(`VRAM 여유 ${formatPercent(headroomRatio)}`);
  else if (GRADE_META[estimate.grade].score >= GRADE_META.B.score) reasons.push("가용 VRAM 안에 들어옴");
  else if (estimate.grade === "D") reasons.push("오프로딩 전제");
  else if (estimate.grade === "F") reasons.push("현재 조건 부적합");

  if (estimate.model.tags.includes("korean")) reasons.push("한국어 지원");
  if (estimate.model.tags.includes("coding")) reasons.push("코딩 적합");
  if (estimate.model.tags.includes("reasoning")) reasons.push("추론 태그");
  if (estimate.model.tags.includes("retrieval")) reasons.push("RAG/검색");
  if (estimate.model.tags.includes("long")) reasons.push(`${escapeTextLabel(estimate.limitLabel)} 컨텍스트`);
  if (estimate.speed > 0 && estimate.speed >= 80) reasons.push("속도 우수");
  if (estimate.model.active && estimate.model.params && estimate.model.active < estimate.model.params * 0.5) reasons.push("MoE 활성 파라미터 낮음");

  return [...new Set(reasons)].slice(0, 4);
}

function normalizeBenchmarkRuntime(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("ollama") || normalized.includes("llama.cpp") || normalized === "llamacpp") return "llamacpp";
  if (normalized.includes("vllm")) return "vllm";
  if (normalized.includes("transformers")) return "transformers";
  return normalized;
}

function normalizeBenchmarkSetting(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function hasCompleteCalibrationConditions(row, model) {
  if (model.type && model.type !== "generative") return false;
  return Boolean(
    row.gpuId
    && row.runtime
    && row.quantization
    && Number.isFinite(Number(row.context))
    && Number.isFinite(Number(row.concurrency))
    && Number.isFinite(Number(row.inputTokens))
    && Number.isFinite(Number(row.outputTokens))
  );
}

function findExactMatchingBenchmark(benchmarkRows, model, estimate, hardware) {
  return (
    benchmarkRows.find((row) => {
      if (!hasCompleteCalibrationConditions(row, model)) return false;
      const singleGpu = hardware.primaryCount === 1 && !hardware.secondaryPreset;
      const sameGpu = Boolean(row.gpuId) && row.gpuId === hardware.preset.id && singleGpu;
      const sameRuntime = Boolean(row.runtime)
        && normalizeBenchmarkRuntime(row.runtime) === normalizeBenchmarkRuntime(hardware.runtime);
      const estimateSettings = [estimate.settingLabel, estimate.quant?.label]
        .filter(Boolean)
        .map(normalizeBenchmarkSetting);
      const sameSetting = model.type === "generative"
        ? Boolean(row.quantization) && estimateSettings.includes(normalizeBenchmarkSetting(row.quantization))
        : true;
      const sameContext = model.type === "generative"
        ? Number.isFinite(Number(row.context)) && Number(row.context) === hardware.context
        : true;
      const sameConcurrency = model.type === "generative"
        ? Number(row.concurrency ?? 1) === hardware.concurrency
        : true;
      const sameInputLength = model.type === "generative"
        ? Number(row.inputTokens) === hardware.context
        : true;
      const sameOutputLength = model.type === "generative"
        ? Number(row.outputTokens) === hardware.outputTokens
        : true;
      return sameGpu
        && sameRuntime
        && sameSetting
        && sameContext
        && sameConcurrency
        && sameInputLength
        && sameOutputLength;
    }) || null
  );
}

function getBenchmarkNumericValue(row) {
  if (!row) return null;
  if (row.tokensPerSecond) return { value: row.tokensPerSecond, unit: "tok/s" };
  if (row.docsPerSecond) return { value: row.docsPerSecond, unit: "doc/s" };
  if (row.pairsPerSecond) return { value: row.pairsPerSecond, unit: "pair/s" };
  if (row.pagesPerSecond) return { value: row.pagesPerSecond, unit: "page/s" };
  return null;
}

// Lightweight detail helper kept in the core bundle. The full benchmark
// charts remain lazy-loaded, but a directly opened model detail must still
// be able to describe its model-card reference before that workspace loads.
function getReferenceBenchmark(model) {
  const reference = model.reference;
  if (!reference?.pagesPerSecond) return null;
  const gpu = GPU_PRESETS.find((item) => item.id === reference.gpuId);
  const setting = [
    reference.width && reference.height ? `${reference.width}x${reference.height}` : "",
    reference.batch ? `batch ${reference.batch}` : "",
  ].filter(Boolean).join(" · ");
  return {
    gpu: gpu?.name || reference.gpuId || (uiLanguage === "en" ? "GPU not specified" : "GPU 미기재"),
    setting: setting || ocrTypeLabel(model.type),
    metric: `${formatThroughput(reference.pagesPerSecond, "page/s")}${reference.peakVramGb ? ` · ${formatGb(reference.peakVramGb)}` : ""}`,
  };
}

function getEstimateConfidence(model, estimate, hardware) {
  const benchmarkRows = findBenchmarksForModel(model);
  const exactMatch = findExactMatchingBenchmark(benchmarkRows, model, estimate, hardware);
  const en = uiLanguage === "en";
  const calibration = estimate.calibration || getMeasuredCalibration(model, estimate, hardware);

  if (calibration?.sampleCount >= 3) {
    const spread = Math.max(0.08, Math.min(0.3, calibration.relativeMad * 1.8 || 0.12));
    return {
      label: en ? "High" : "높음",
      className: "confidence-high",
      spread,
      reason: en
        ? `Calibrated with ${calibration.sampleCount} source-linked measurements on this GPU; the range reflects median absolute deviation.`
        : `이 GPU의 출처 연결 실측 ${calibration.sampleCount}건으로 보정했으며 범위는 중앙절대편차를 반영합니다.`,
      sampleCount: calibration.sampleCount,
    };
  }

  if (calibration?.sampleCount) {
    return {
      label: en ? "Medium" : "보통",
      className: "confidence-medium",
      spread: Math.max(0.16, Math.min(0.35, calibration.relativeMad * 2 || 0.22)),
      reason: en
        ? `Calibrated with ${calibration.sampleCount} source-linked measurement(s) on this GPU; more samples are needed.`
        : `이 GPU의 출처 연결 실측 ${calibration.sampleCount}건으로 보정했지만 표본이 더 필요합니다.`,
      sampleCount: calibration.sampleCount,
    };
  }

  if (exactMatch) {
    return {
      label: en ? "High" : "높음",
      className: "confidence-high",
      spread: 0.08,
      reason: en
        ? `A source-linked ${benchmarkEvidenceLabel(exactMatch)} value exists for the same model/conditions.`
        : `동일 모델/조건의 출처 연결 ${benchmarkEvidenceLabel(exactMatch)}값이 있습니다.`,
      matchedRow: exactMatch,
    };
  }

  if (benchmarkRows.length > 0) {
    return {
      label: en ? "Medium" : "보통",
      className: "confidence-medium",
      spread: 0.18,
      reason: en
        ? "User/project measurements for this same model under other run conditions can be used as a reference."
        : "같은 모델의 다른 실행 조건 사용자/자체 측정을 참고할 수 있습니다.",
    };
  }

  if (isVisionModel(model) && model.reference?.pagesPerSecond) {
    return {
      label: en ? "Medium" : "보통",
      className: "confidence-medium",
      spread: 0.18,
      reason: en
        ? "Calibrated against this model's external public OCR/VLM reference figures."
        : "모델별 OCR/VLM 외부 공개 참고값을 기준으로 보정합니다.",
    };
  }

  return {
    label: en ? "Low" : "낮음",
    className: "confidence-low",
    spread: 0.32,
    reason: en
      ? "Estimated from a formula based on parameters, VRAM, and bandwidth, without user/project measurements for this model."
      : "모델별 사용자/자체 측정 없이 파라미터, VRAM, 대역폭 기반 계산식으로 추정합니다.",
  };
}

function getModelReleaseInfo(model) {
  const en = uiLanguage === "en";
  if (model.releaseDate) {
    const isModelCard = model.releaseNote === "모델 카드";
    const note = en ? (isModelCard ? "Model card" : "Official") : (model.releaseNote || "공식");
    return {
      label: model.releaseDate,
      note,
      className: releaseClassName(Number(String(model.releaseDate).slice(0, 4))),
      title: en
        ? (isModelCard ? "Based on the public model card's createdAt, not an official release date." : "The release date registered in this model's data.")
        : (isModelCard ? "공식 릴리스일이 아니라 공개 모델 카드의 createdAt 기준입니다." : "모델 데이터에 등록된 출시일입니다."),
    };
  }

  const year = inferModelYear(model);
  if (!year) {
    return {
      label: en ? "Not stated" : "미기재",
      note: en ? "No release date" : "출시일 없음",
      className: "release-unknown",
      title: en ? "Accurate release-date metadata isn't available yet." : "정확한 출시일 메타데이터가 아직 없습니다.",
    };
  }

  return {
    label: en ? `${year} series` : `${year} 계열`,
    note: en ? "Estimated generation" : "세대 추정",
    className: releaseClassName(year),
    title: en
      ? "A conservative estimate based on the model name and public generation, not an exact release date."
      : "정확한 출시일이 아니라 모델명과 공개 세대 기준의 보수적 표시입니다.",
  };
}

function inferModelYear(model) {
  const text = `${model.name} ${model.maker}`.toLowerCase();
  if (/\b2604\b/.test(text)) return 2026;
  if (text.includes("qwen3.6") || text.includes("qwen3.5") || text.includes("deepseek v3.2")) return 2026;
  if (text.includes("llama 4") || text.includes("gemma 4") || text.includes("exaone 4.0")) return 2026;
  if (text.includes("glm-4.5") || text.includes("glm-4.1v") || text.includes("kimi k2")) return 2026;
  if (text.includes("mistral medium 3.5") || text.includes("mistral large 3") || text.includes("mistral small 4")) return 2026;
  if (text.includes("kanana 1.5") || text.includes("hyperclovax") || text.includes("trillion 7b")) return 2026;
  if (text.includes("paddleocr-vl-1.6") || text.includes("deepseek-ocr-2")) return 2026;
  if (text.includes("internvl3.5") || text.includes("minicpm-v-4.6")) return 2026;

  if (text.includes("qwen3") || text.includes("gemma 3") || text.includes("phi-4")) return 2025;
  if (text.includes("deepseek r1") || text.includes("devstral") || text.includes("gpt-oss")) return 2025;
  if (text.includes("embeddinggemma") || text.includes("jina-embeddings-v5") || text.includes("jina-embeddings-v4")) return 2025;
  if (text.includes("granite") && text.includes("r2")) return 2025;
  if (text.includes("bge-reranker-v2.5") || text.includes("mxbai-rerank") && text.includes("-v2")) return 2025;
  if (text.includes("qwen2.5-vl") || text.includes("olmocr-2") || text.includes("dots.ocr")) return 2025;
  if (text.includes("aya-vision") || text.includes("smolvlm2")) return 2025;

  if (text.includes("llama 3.3") || text.includes("llama 3.2") || text.includes("llama 3.1")) return 2024;
  if (text.includes("qwen2.5") || text.includes("gemma 2") || text.includes("mistral small 3")) return 2024;
  if (text.includes("mistral nemo") || text.includes("deepseek-vl2") || text.includes("qwen2-vl")) return 2024;
  if (text.includes("exaone 3.5") || text.includes("pixtral") || text.includes("llava-onevision")) return 2024;
  if (text.includes("molmo") || text.includes("bge-m3")) return 2024;

  if (text.includes("mistral 7b") || text.includes("codellama") || text.includes("solar")) return 2023;
  return null;
}

function releaseClassName(year) {
  if (year >= 2026) return "release-new";
  if (year >= 2025) return "release-recent";
  if (year >= 2024) return "release-current";
  if (year) return "release-older";
  return "release-unknown";
}

function benchmarkEvidenceType(row) {
  const value = String(row?.evidenceType || row?.measurementType || row?.sourceType || "user").trim().toLowerCase();
  if (["project", "self", "internal"].includes(value)) return "project";
  if (["external", "public", "reference", "public-reference"].includes(value)) return "external";
  return "user";
}

function benchmarkEvidenceLabel(row) {
  const type = benchmarkEvidenceType(row);
  if (type === "project") return "자체 측정";
  if (type === "external") return "외부 공개 참고값";
  return "사용자 측정";
}

function benchmarkEvidenceCode(rowType) {
  if (rowType === "자체 측정") return "SELF";
  if (rowType === "외부 공개 참고값") return "EXT";
  if (rowType === "사용자 측정") return "USER";
  return "EST";
}

function findBenchmarksForModel(model) {
  const key = modelKey(model);
  return BENCHMARKS.filter((row) => (
    benchmarkEvidenceType(row) !== "external"
    && (row.modelKey === key || row.modelName === model.name)
  ));
}

function getBenchmarkSummary(model, estimate, confidence) {
  if (model.qualityBenchmark) {
    return {
      label: model.qualityBenchmark.label,
      note: model.qualityBenchmark.note || "품질 지표",
      className: model.qualityBenchmark.note === "외부 평가" ? "benchmark-external" : "benchmark-quality",
      title: [
        `${model.qualityBenchmark.metric || "대표 공개 평가"} 기준입니다.`,
        "로컬 추론 속도 측정과 분리된 외부 공개 참고값입니다.",
        model.qualityBenchmark.sourceUrl ? `출처: ${model.qualityBenchmark.sourceUrl}` : "",
      ].filter(Boolean).join(" "),
    };
  }

  const fallback = qualityMissingLabel(model);
  return {
    label: "—",
    note: fallback.note,
    className: "benchmark-missing",
    title: `${fallback.title} 속도와 처리량은 오른쪽 추정 처리량 열에서 별도로 표시합니다.`,
  };
}

function qualityMissingLabel(model) {
  if (model.type === "embedding") {
    return {
      note: "MTEB 없음",
      title: "공식 모델 카드나 논문에서 확인되는 MTEB 계열 대표 공개 평가가 아직 등록되지 않았습니다.",
    };
  }
  if (model.type === "reranker") {
    return {
      note: "BEIR/MIRACL 없음",
      title: "공식 모델 카드나 논문에서 확인되는 BEIR 또는 MIRACL 계열 공개 점수가 아직 등록되지 않았습니다.",
    };
  }
  if (model.type === "ocr-pipeline") {
    return {
      note: "공개 점수 없음",
      title: "동일 OCR 정확도 기준의 공개 점수가 아직 등록되지 않았습니다.",
    };
  }
  if (model.type === "document-vlm" || model.type === "ocr-vlm") {
    return {
      note: "동일 기준 없음",
      title: "문서 VLM 탭은 OmniDocBench 계열 점수만 같은 열에 표시합니다.",
    };
  }
  if (model.type === "general-vlm") {
    return {
      note: "OCRBench v2 없음",
      title: "범용 VLM 탭은 OCRBench v2 계열 점수만 같은 열에 표시합니다.",
    };
  }
  return {
    note: "공개 점수 없음",
    title: "공식 모델 카드나 논문에서 확인되는 대표 공개 평가가 아직 등록되지 않았습니다.",
  };
}

function formatSpeedRange(estimate, confidence = getEstimateConfidence(estimate.model, estimate, getHardware())) {
  if (!estimate.speed) return uiLanguage === "en" ? "N/A" : "불가";
  const spread = confidence.spread ?? 0.32;
  const unit = estimate.unitLabel || "tok/s";
  const low = estimate.speed * (1 - spread);
  const high = estimate.speed * (1 + spread);
  return uiLanguage === "en"
    ? `Approx. ${formatMetricNumber(low, unit, false)}–${formatMetricNumber(high, unit, true)}`
    : `약 ${formatMetricNumber(low, unit, false)}~${formatMetricNumber(high, unit, true)}`;
}

function formatMetricNumber(value, unit, includeUnit) {
  let text;
  if (value >= 1000) text = Math.round(value).toLocaleString("ko-KR");
  else if (value >= 10) text = String(Math.round(value));
  else text = value.toFixed(1);
  return includeUnit ? `${text} ${unit}` : text;
}

const GRADE_LABEL_EN = { S: "Comfortable", A: "Runs well", B: "Possible", C: "Tight", D: "Offloading", F: "Not suitable" };

function buildGradeTooltip(estimate) {
  const meta = GRADE_META[estimate.grade];
  const margin = estimate.effectiveVram - estimate.requiredGb;
  const en = uiLanguage === "en";
  if (en) {
    return [
      GRADE_LABEL_EN[estimate.grade] || meta.label,
      `Required VRAM ${formatGb(estimate.requiredGb)}`,
      `Available VRAM ${formatGb(estimate.effectiveVram)}`,
      `${margin >= 0 ? "Remaining VRAM" : "VRAM shortfall"} ${formatGb(Math.abs(margin))}`,
      `Utilization ${formatPercent(estimate.pressure)}`,
      `Current basis: ${buildHardwareBasis(getHardware())}`,
    ].join("\n");
  }
  return [
    meta.label,
    `필요 VRAM ${formatGb(estimate.requiredGb)}`,
    `가용 VRAM ${formatGb(estimate.effectiveVram)}`,
    `${margin >= 0 ? "남는 VRAM" : "부족 VRAM"} ${formatGb(Math.abs(margin))}`,
    `사용률 ${formatPercent(estimate.pressure)}`,
    `현재 ${buildHardwareBasis(getHardware())} 기준`,
  ].join("\n");
}

function formatPercent(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function escapeTextLabel(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function render(options = {}) {
  const { syncUrl = true } = options;
  renderOnboardingQuickPicks();
  // Re-evaluate here (not just on mode switch) since selectedModelKey can
  // change between full render() calls and the split-view panel should
  // appear/disappear along with it.
  refreshAppModeUi();
  const onboardingScreen = $("onboardingScreen");
  const hardwarePanel = $("hardwarePanel");
  const resultsPanel = $("resultsPanel");
  const placementActive = coreTaskMode === "placement";
  const modelFinderActive = coreTaskMode === "modelFinder";
  const infraActive = coreTaskMode === "infra";
  if (onboardingScreen) onboardingScreen.hidden = placementActive || modelFinderActive || infraActive || hasPrimaryGpuSelection;
  if (hardwarePanel) hardwarePanel.hidden = modelFinderActive || infraActive || (!placementActive && !hasPrimaryGpuSelection);
  if (resultsPanel) resultsPanel.hidden = placementActive || modelFinderActive || infraActive || !hasPrimaryGpuSelection;
  refreshCoreTaskUi();
  renderPlacementWorkspaceUi();

  if (infraActive) {
    if (typeof renderDecisionStudio === "function") renderDecisionStudio();
    else window.loadInfrastructureStudio?.().then(() => renderDecisionStudio?.());
    if (syncUrl) syncUrlState();
    window.AIHardwareLocalization?.apply(uiLanguage);
    return;
  }
  if (placementActive) {
    renderGpuInventory();
    renderPlacementModelList();
    renderPlacementSelectedChips();
    renderPlacementPrimarySelect();
    if (syncUrl) syncUrlState();
    window.AIHardwareLocalization?.apply(uiLanguage);
    return;
  }
  if (modelFinderActive) {
    renderGpuAdvisor();
    if (syncUrl) syncUrlState();
    window.AIHardwareLocalization?.apply(uiLanguage);
    return;
  }

  const hardware = getHardware();
  const allEstimates = hasPrimaryGpuSelection
    ? getActiveModels().map((model) => estimateAnyModel(model, hardware))
    : [];
  const estimates = hasPrimaryGpuSelection ? getFilteredEstimates() : [];

  refreshWorkloadUi();
  renderHardware(hardware, allEstimates);
  renderGpuInsights(hardware);
  renderGpuAdvisor();
  renderSummary(allEstimates);
  renderSimpleMode(hardware, allEstimates);
  renderCalculationBasisStrip(hardware);
  renderQuantizationRecommendations(estimates);
  renderResults(estimates, allEstimates);
  renderCompareBar(allEstimates);
  renderCompareModal(allEstimates);
  renderActiveFilterChips(estimates, allEstimates);
  renderDetail();
  renderSimpleRecommendationPanel(hardware);
  renderViewToggle();
  renderBenchmarkSheet();
  renderBenchmarkDashboard();
  const benchmarkSheet = $("benchmarkSheet");
  if (benchmarkSheet) benchmarkSheet.hidden = placementActive || modelFinderActive || !hasPrimaryGpuSelection;
  if ($("benchmarkDashboard")) $("benchmarkDashboard").hidden = placementActive || modelFinderActive;

  if (syncUrl) syncUrlState();
  if (uiLanguage === "en") setUiLanguage("en");
  else window.AIHardwareLocalization?.apply(uiLanguage);
}

function renderHardware(hardware, allEstimates) {
  if (!hasPrimaryGpuSelection) {
    $("settingsToggle").hidden = true;
    $("hardwareHeadline").textContent = "GPU를 선택해 주세요";
    $("hardwareMeta").textContent = `GPU 프리셋 ${GPU_PRESETS.length}개 또는 직접 입력`;
    $("hardwareSubline").textContent = "선택 즉시 현재 환경에 맞는 모델을 계산합니다.";
    $("gpuSourceLinks").hidden = true;
    $("gpuSourceLinks").innerHTML = "";
    if ($("gpuRuntimeFacts")) $("gpuRuntimeFacts").hidden = true;
    if ($("hardwareCapabilitySummary")) $("hardwareCapabilitySummary").hidden = true;
    if ($("powerLimitField")) $("powerLimitField").hidden = true;
    return;
  }

  $("settingsToggle").hidden = false;
  if ($("powerLimitField")) $("powerLimitField").hidden = hardware.preset?.formFactor !== "laptop";

  const basis = buildHardwareBasis(hardware);
  const metaParts = [
    `가용 VRAM ${formatGb(hardware.availableVram)}`,
    `RAM ${formatGb(hardware.ram)}`,
    `GPU ${hardware.count}개${hardware.crossVendor ? " · 제조사 혼용 확인" : hardware.heterogeneous ? " · 이기종" : ""}`,
  ];

  $("hardwareHeadline").textContent = formatHardwareName(hardware);
  $("hardwareMeta").innerHTML = metaParts
    .map((part, index) => `
      <span class="hardware-piece">
        ${index > 0 ? `<span class="dot-separator" aria-hidden="true">·</span>` : ""}
        ${escapeHtml(part)}
      </span>
    `)
    .join("");
  $("hardwareSubline").textContent = basis;
  const sourceGpus = [hardware.preset, hardware.secondaryPreset].filter((gpu) => gpu?.sourceUrl);
  const sourceTarget = $("gpuSourceLinks");
  sourceTarget.hidden = sourceGpus.length === 0;
  sourceTarget.innerHTML = sourceGpus
    .map((gpu) => `<a href="${escapeAttr(gpu.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(shortGpuName(gpu.name))} ${uiLanguage === "en" ? "specifications source" : "스펙 출처"}</a>`)
    .join("");
  renderGpuRuntimeFacts(hardware);
  renderHardwareCapabilities(hardware, allEstimates);
}

function buildHardwareForPreset(preset) {
  const base = getHardware();
  const vram = preset.gpuUsableMemoryGb || preset.vram;
  const safetyMarginGb = Math.min(base.safetyMarginGb, Math.max(0, vram * 0.1));
  const availableVram = Math.max(0, vram - safetyMarginGb);
  const powerLimitW = preset.tgpReferenceW || preset.tgpMaxW || base.powerLimitW;
  const compute = estimateHardwareCompute(preset, preset.bandwidth, powerLimitW);
  return {
    ...base,
    vram,
    ram: preset.ram,
    bandwidth: preset.bandwidth,
    primaryCount: 1,
    secondaryCount: 0,
    count: 1,
    totalVram: vram,
    baseEffectiveVram: vram,
    availableVram,
    aggregateBandwidth: preset.bandwidth,
    preset,
    secondaryPreset: null,
    heterogeneous: false,
    crossVendor: false,
    shardingEfficiency: 1,
    compute,
    computeTotal: compute,
    powerLimitW,
  };
}

function gpuComparisonSnapshot(preset) {
  const hardware = buildHardwareForPreset(preset);
  const models = getActiveModels();
  const estimates = models.map((model) => estimateAnyModelForHardware(model, hardware));
  const runnable = estimates.filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score);
  const largest = [...runnable].sort((a, b) => (b.model.params || 0) - (a.model.params || 0))[0];
  const speedCandidates = runnable.filter((estimate) => estimate.speed > 0);
  const medianSpeed = speedCandidates.length
    ? [...speedCandidates].sort((a, b) => a.speed - b.speed)[Math.floor(speedCandidates.length / 2)].speed
    : 0;
  return { preset, hardware, runnable: runnable.length, largest, medianSpeed };
}

function estimateAnyModelForHardware(model, hardware) {
  const workload = getAdvisorWorkloadSettings(model, hardware);
  if (model.type === "embedding") return estimateEncoderModel(model, hardware, workload);
  if (model.type === "reranker") return estimateRerankerModel(model, hardware, workload);
  if (model.type === "audio-stt" || model.type === "audio-tts") return estimateAudioModel(model, hardware);
  if (isVisionModel(model)) return estimateOcrModel(model, hardware, workload);
  return normalizeGenerativeEstimate(estimateModel(model, $("quantization").value, {
    ...hardware,
    context: workload.context,
    concurrency: workload.concurrency,
    outputTokens: workload.outputTokens,
    kvPrecision: workload.kvPrecision,
  }));
}

function getAdvisorWorkloadSettings(model, hardware) {
  if (model.type === "embedding") {
    return {
      type: "embedding",
      inputTokens: clampNumber($("embeddingInputTokens")?.value, 1, 32768, 384),
      batchSize: clampNumber($("embeddingBatchSize")?.value, 1, 1024, 32),
      precisionId: $("encoderPrecision")?.value || "fp16",
      runtime: $("encoderRuntime")?.value || "tei",
      maxBatchTokens: clampNumber($("embeddingBatchTokens")?.value, 512, 1048576, 16384),
    };
  }
  if (model.type === "reranker") {
    return {
      type: "reranker",
      queryTokens: clampNumber($("rerankerQueryTokens")?.value, 1, 8192, 64),
      docTokens: clampNumber($("rerankerDocTokens")?.value, 1, 32768, 512),
      candidates: clampNumber($("rerankerCandidates")?.value, 1, 10000, 40),
      batchSize: clampNumber($("rerankerBatchSize")?.value, 1, 1024, 16),
      precisionId: $("rerankerPrecision")?.value || "fp16",
      runtime: $("rerankerRuntime")?.value || "tei",
    };
  }
  if (isVisionModel(model)) {
    return {
      type: model.type === "image-generation" ? "imageGeneration" : model.type === "video-generation" ? "videoGeneration" : model.type,
      resolutionPreset: $("ocrResolutionPreset")?.value || "custom",
      width: clampNumber($("ocrWidth")?.value, 320, 10000, model.type === "image-generation" ? 1024 : 832),
      height: clampNumber($("ocrHeight")?.value, 320, 14000, model.type === "image-generation" ? 1024 : 480),
      batchSize: clampNumber($("ocrBatchSize")?.value, 1, 256, 1),
      precisionId: $("ocrPrecision")?.value || "fp16",
      featureSet: $("ocrFeatureSet")?.value || "text",
      steps: clampNumber($("mediaSteps")?.value, 1, 150, 28),
      frames: clampNumber($("mediaFrames")?.value, 1, 241, 81),
      fps: clampNumber($("mediaFps")?.value, 1, 60, 16),
      loraCount: clampNumber($("mediaLoraCount")?.value, 0, 8, 0),
      offload: $("mediaOffload")?.value || "none",
      optimization: $("mediaOptimization")?.value || "standard",
    };
  }
  const modelContextLimit = Math.max(1024, Number(model.context || 0) * 1024 || hardware.context);
  return {
    type: "generative",
    // The Advisor starts from a model, so a context value inherited from a
    // previously selected GPU must not exceed that model's own context limit.
    // Otherwise even a tiny model can incorrectly make every GPU look
    // incompatible before the user has opened advanced settings.
    context: Math.min(hardware.context, modelContextLimit),
    concurrency: hardware.concurrency,
    outputTokens: hardware.outputTokens,
    kvPrecision: hardware.kvPrecision,
  };
}

function renderGpuInsights(hardware) {
  const panel = $("gpuInsightsPanel");
  if (!panel) return;
  const show = hasPrimaryGpuSelection && coreTaskMode === "finder";
  panel.hidden = !show;
  if (!show) return;
  const preset = hardware.preset;
  const benchmarkRows = getGpuBenchmarkRows(preset);
  const gpuTrust = window.AIHardwareDataTrust?.scoreGpu(
    preset,
    KOREAN_GPU_MARKET.find((row) => row.gpuId === preset.id),
  ) || { score: 0, missing: [] };
  const gpuTrustLabel = window.AIHardwareDataTrust?.completenessLabel(gpuTrust.score, uiLanguage)
    || { level: "low", text: uiLanguage === "en" ? "Needs work" : "보강 필요" };
  const evidence = window.AIHardwareEvidence?.sourceStatus(preset) || {
    id: preset.specStatus === "sourced" ? "official" : "missing",
    ko: preset.specStatus === "sourced" ? "공식 출처 연결" : "모델별 공식 출처 필요",
    en: preset.specStatus === "sourced" ? "Official source linked" : "Model-specific source needed",
  };
  const detail = $("gpuDetailSummary");
  detail.innerHTML = [
    [uiLanguage === "en" ? "Architecture" : "아키텍처", preset.architecture, preset.vendor],
    [uiLanguage === "en" ? "Memory" : "메모리", `${formatGb(preset.gpuUsableMemoryGb || preset.vram)} / ${formatGb(preset.vram)}`, preset.memoryType === "unified" ? (uiLanguage === "en" ? "GPU-usable / unified total" : "GPU 계산 기준 / 통합 전체") : (uiLanguage === "en" ? "Dedicated VRAM" : "전용 VRAM")],
    [uiLanguage === "en" ? "Bandwidth" : "대역폭", `${preset.bandwidth.toLocaleString("ko-KR")} GB/s`, preset.formFactor],
    [uiLanguage === "en" ? "Runtime" : "런타임", (preset.runtimes || []).join(" · "), benchmarkRows.length ? `${benchmarkRows.length} measurements` : (uiLanguage === "en" ? "Awaiting measurements" : "실측 제보 대기")],
    ...(preset.formFactor === "laptop" ? [[uiLanguage === "en" ? "Power range" : "전력 범위", `${preset.tgpMinW}–${preset.tgpMaxW}W`, `${hardware.powerLimitW}W ${uiLanguage === "en" ? "selected" : "선택"} `]] : []),
  ].map(([label, value, note]) => `
    <div class="gpu-detail-fact">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || (uiLanguage === "en" ? "Not specified" : "미기재"))}</strong>
      <small>${escapeHtml(note || "")}</small>
    </div>
  `).join("");

  detail.insertAdjacentHTML("beforeend", `
    <div class="gpu-detail-fact data-completeness is-${escapeAttr(gpuTrustLabel.level)}">
      <span>${uiLanguage === "en" ? "Data completeness" : "데이터 완성도"}</span>
      <strong>${gpuTrust.score}% · ${escapeHtml(gpuTrustLabel.text)}</strong>
      <small>${gpuTrust.missing.length
        ? `${uiLanguage === "en" ? "Missing" : "보강 항목"}: ${escapeHtml(gpuTrust.missing.join(", "))}`
        : (uiLanguage === "en" ? "Core specification fields are linked" : "핵심 사양 항목이 연결되었습니다")}</small>
    </div>
    <div class="gpu-detail-fact">
      <span>${uiLanguage === "en" ? "Specification evidence" : "사양 근거"}</span>
      <strong><span class="evidence-status is-${escapeAttr(evidence.id)}">${escapeHtml(uiLanguage === "en" ? evidence.en : evidence.ko)}</span></strong>
      <small>${uiLanguage === "en" ? "Verified" : "검증일"}: ${escapeHtml(preset.verifiedAt || DATA_UPDATED_AT)}${evidence.id !== "official" ? ` · <a href="${escapeAttr(window.AIHardwareEvidence?.issueUrl(preset) || gpuRequestUrl(preset.name))}" target="_blank" rel="noopener noreferrer">${uiLanguage === "en" ? "Improve source" : "출처 보강"}</a>` : ""}</small>
    </div>
  `);

  const toggle = $("toggleGpuCompare");
  toggle.setAttribute("aria-expanded", String(gpuCompareOpen));
  toggle.textContent = gpuCompareOpen
    ? (uiLanguage === "en" ? "Close GPU comparison" : "GPU 비교 닫기")
    : (uiLanguage === "en" ? "Open GPU comparison" : "GPU 비교 열기");
  $("gpuCompareBuilder").hidden = !gpuCompareOpen;
  if (!gpuCompareOpen) return;

  const selected = [preset.id, $("compareGpuA").value, $("compareGpuB").value, $("compareGpuC")?.value]
    .filter(Boolean)
    .filter((id, index, list) => list.indexOf(id) === index)
    .map((id) => GPU_PRESETS.find((gpu) => gpu.id === id))
    .filter(Boolean);
  const snapshots = selected.map(gpuComparisonSnapshot);
  $("gpuComparisonResult").innerHTML = `
    <table class="gpu-comparison-table">
      <thead><tr><th>${uiLanguage === "en" ? "Metric" : "항목"}</th>${snapshots.map((item) => `<th>${escapeHtml(shortGpuName(item.preset.name))}</th>`).join("")}</tr></thead>
      <tbody>
        ${renderGpuCompareRow(uiLanguage === "en" ? "GPU-usable memory" : "GPU 계산 메모리", snapshots, (item) => formatGb(item.hardware.vram))}
        ${renderGpuCompareRow(uiLanguage === "en" ? "Bandwidth" : "대역폭", snapshots, (item) => `${item.preset.bandwidth.toLocaleString("ko-KR")} GB/s`)}
        ${renderGpuCompareRow(uiLanguage === "en" ? "Runnable models" : "실행 가능 모델", snapshots, (item) => `${item.runnable}`)}
        ${renderGpuCompareRow(uiLanguage === "en" ? "Largest candidate" : "최대 후보", snapshots, (item) => item.largest ? `${item.largest.model.params}B · ${item.largest.model.name}` : "—")}
        ${renderGpuCompareRow(uiLanguage === "en" ? "Median estimated speed" : "추정 속도 중앙값", snapshots, (item) => item.medianSpeed ? formatThroughput(item.medianSpeed, item.largest?.unitLabel || "tok/s") : "—")}
        ${renderGpuCompareRow(uiLanguage === "en" ? "Runtime" : "런타임", snapshots, (item) => (item.preset.runtimes || []).join(", "))}
      </tbody>
    </table>
    <div class="gpu-mobile-comparison-cards">
      ${snapshots.map((item) => `
        <article>
          <strong>${escapeHtml(shortGpuName(item.preset.name))}</strong>
          <dl>
            <div><dt>${uiLanguage === "en" ? "Memory" : "메모리"}</dt><dd>${escapeHtml(formatGb(item.hardware.vram))}</dd></div>
            <div><dt>${uiLanguage === "en" ? "Bandwidth" : "대역폭"}</dt><dd>${item.preset.bandwidth.toLocaleString("ko-KR")} GB/s</dd></div>
            <div><dt>${uiLanguage === "en" ? "Runnable" : "실행 가능"}</dt><dd>${item.runnable}</dd></div>
            <div><dt>${uiLanguage === "en" ? "Median speed" : "중앙 속도"}</dt><dd>${item.medianSpeed ? escapeHtml(formatThroughput(item.medianSpeed, item.largest?.unitLabel || "tok/s")) : "—"}</dd></div>
          </dl>
        </article>
      `).join("")}
    </div>
  `;
}

function renderGpuCompareRow(label, snapshots, valueFor) {
  return `<tr><th>${escapeHtml(label)}</th>${snapshots.map((item) => `<td>${escapeHtml(valueFor(item))}</td>`).join("")}</tr>`;
}

function getGpuBenchmarkRows(gpu) {
  if (!gpu) return [];
  const aliases = [gpu.id, gpu.name, ...(gpu.aliases || [])].map(normalizeGpuSearchText);
  return BENCHMARKS.filter((row) => {
    if (row.gpuId && row.gpuId === gpu.id) return true;
    const rowGpu = normalizeGpuSearchText(row.gpu || "");
    return rowGpu && aliases.some((alias) => alias && (alias.includes(rowGpu) || rowGpu.includes(alias)));
  });
}

function renderGpuRuntimeFacts(hardware) {
  const target = $("gpuRuntimeFacts");
  if (!target) return;
  const preset = hardware.preset;
  const benchmarks = getGpuBenchmarkRows(preset);
  const measured = benchmarks.map(getBenchmarkNumericValue).filter(Boolean);
  let benchmarkFact = benchmarks.length ? `실측 ${benchmarks.length}건` : "실측 제보 대기";
  if (measured.length && measured.every((item) => item.unit === measured[0].unit)) {
    const values = measured.map((item) => item.value).sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
    benchmarkFact = `실측 ${values.length}건 · 중앙값 ${formatMetricNumber(median, measured[0].unit, true)}`;
  }
  const facts = [
    preset.vendor,
    preset.memoryType === "unified" ? `통합메모리 · GPU 계산 기준 ${formatGb(preset.gpuUsableMemoryGb || preset.vram)}` : "전용 VRAM",
    ...(preset.runtimes || []),
    benchmarkFact,
  ].filter(Boolean);
  target.hidden = facts.length === 0;
  target.innerHTML = facts.map((fact) => `<span>${escapeHtml(fact)}</span>`).join("");
}

function renderHardwareCapabilitiesLegacy(hardware, activeEstimates) {
  const target = $("hardwareCapabilitySummary");
  if (!target) return;
  const runnable = activeEstimates.filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score);
  const largest = [...runnable].sort((a, b) => (b.model.params || 0) - (a.model.params || 0))[0];
  const vram = hardware.availableVram;
  const imageStatus = vram >= 24 ? "FLUX급 가능" : vram >= 10 ? "SDXL급 가능" : "경량·오프로딩 권장";
  const videoStatus = vram >= 24 ? "5B급 비디오 가능" : vram >= 10 ? "1~2B급 저해상도" : "CPU 오프로딩 필요";
  const finetuneStatus = vram >= 48 ? "14B LoRA 후보" : vram >= 24 ? "7B LoRA 후보" : vram >= 12 ? "3B LoRA 후보" : "초경량 LoRA";
  const rows = [
    ["현재 모델 종류", `${runnable.length}개 실행 가능`, largest ? `최대 ${largest.model.params}B급 후보` : "설정 완화 필요"],
    ["이미지 생성", imageStatus, "1024px·배치 1 기준"],
    ["비디오 생성", videoStatus, "480p·81프레임 기준"],
    ["경량 튜닝", finetuneStatus, "QLoRA 기준 참고"],
  ];
  target.hidden = false;
  target.innerHTML = `
    <strong>이 GPU로 할 수 있는 작업</strong>
    <div class="hardware-capability-grid">
      ${rows.map(([label, value, note]) => `
        <div class="hardware-capability-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </div>
      `).join("")}
    </div>
  `;
}

// Keep capability copy language-native instead of relying on the generic DOM
// replacement pass, because values combine live counts with translated suffixes.
function renderHardwareCapabilities(hardware, activeEstimates) {
  const target = $("hardwareCapabilitySummary");
  if (!target) return;
  const runnable = activeEstimates.filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score);
  const largest = [...runnable].sort((a, b) => (b.model.params || 0) - (a.model.params || 0))[0];
  const vram = hardware.availableVram;
  const en = uiLanguage === "en";
  const imageStatus = vram >= 24
    ? (en ? "FLUX-class capable" : "FLUX급 가능")
    : vram >= 10
      ? (en ? "SDXL-class capable" : "SDXL급 가능")
      : (en ? "Lightweight models or offloading" : "경량 모델·오프로딩 권장");
  const videoStatus = vram >= 24
    ? (en ? "5B-class video capable" : "5B급 비디오 가능")
    : vram >= 10
      ? (en ? "1–2B low-resolution video" : "1~2B급 저해상도")
      : (en ? "CPU offloading required" : "CPU 오프로딩 필요");
  const finetuneStatus = vram >= 48
    ? (en ? "14B LoRA candidate" : "14B LoRA 후보")
    : vram >= 24
      ? (en ? "7B LoRA candidate" : "7B LoRA 후보")
      : vram >= 12
        ? (en ? "3B LoRA candidate" : "3B LoRA 후보")
        : (en ? "Ultra-light LoRA" : "초경량 LoRA");
  const rows = en ? [
    ["Current model type", `${runnable.length} runnable`, largest ? `Up to ${largest.model.params}B candidate` : "Relax settings"],
    ["Image generation", imageStatus, "At 1024px · batch 1"],
    ["Video generation", videoStatus, "At 480p · 81 frames"],
    ["Lightweight fine-tuning", finetuneStatus, "QLoRA reference"],
  ] : [
    ["현재 모델 종류", `${runnable.length}개 실행 가능`, largest ? `최대 ${largest.model.params}B급 후보` : "설정 완화 필요"],
    ["이미지 생성", imageStatus, "1024px·배치 1 기준"],
    ["비디오 생성", videoStatus, "480p·81프레임 기준"],
    ["경량 튜닝", finetuneStatus, "QLoRA 기준 참고"],
  ];
  target.hidden = false;
  target.innerHTML = `
    <strong>${en ? "What this GPU can do" : "이 GPU로 할 수 있는 작업"}</strong>
    <div class="hardware-capability-grid">
      ${rows.map(([label, value, note]) => `
        <div class="hardware-capability-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function buildHardwareBasis(hardware) {
  if (activeWorkload === "embedding") {
    const workload = getWorkloadSettings();
    const precision = getPrecisionLabel(workload.precisionId, ENCODER_PRECISIONS);
    const runtime = ENCODER_RUNTIME_PROFILES[workload.runtime]?.label || workload.runtime;
    return uiLanguage === "en"
      ? `${workload.inputTokens} tokens · batch ${workload.batchSize} · ${runtime} · ${precision}`
      : `${workload.inputTokens} 토큰 · 배치 ${workload.batchSize}개 · ${runtime} · ${precision}`;
  }
  if (activeWorkload === "reranker") {
    const workload = getWorkloadSettings();
    const precision = getPrecisionLabel(workload.precisionId, ENCODER_PRECISIONS);
    const runtime = ENCODER_RUNTIME_PROFILES[workload.runtime]?.label || workload.runtime;
    return uiLanguage === "en"
      ? `Query ${workload.queryTokens} + Document ${workload.docTokens} · ${workload.candidates} candidates · ${runtime} · ${precision}`
      : `질의 ${workload.queryTokens} + 문서 ${workload.docTokens} · 후보 ${workload.candidates}개 · ${runtime} · ${precision}`;
  }
  if (isVisionWorkload(activeWorkload)) {
    const workload = getWorkloadSettings();
    const precision = getPrecisionLabel(workload.precisionId, OCR_PRECISIONS);
    if (activeWorkload === "imageGeneration") {
      return `${workload.width}x${workload.height} · ${workload.steps}스텝 · LoRA ${workload.loraCount}개 · ${precision}`;
    }
    if (activeWorkload === "videoGeneration" || activeWorkload === "avatarGeneration") {
      return `${workload.width}x${workload.height} · ${workload.frames}프레임/${workload.fps}fps · ${workload.steps}스텝 · ${precision}`;
    }
    return uiLanguage === "en"
      ? `${workload.width}x${workload.height} · batch ${workload.batchSize} pages · ${ocrFeatureLabel(workload.featureSet)} · ${precision}`
      : `${workload.width}x${workload.height} · 배치 ${workload.batchSize}페이지 · ${ocrFeatureLabel(workload.featureSet)} · ${precision}`;
  }

  const quant = QUANTS.find((item) => item.id === $("quantization").value);
  const quantLabel = quant ? quant.label : (uiLanguage === "en" ? "Auto" : "자동 추천");
  return uiLanguage === "en"
    ? `${formatContext(hardware.context)} · ${hardware.concurrency} concurrent · ${RUNTIME_LABELS[hardware.runtime] || hardware.runtime} · ${quantLabel}`
    : `${formatContext(hardware.context)} · 동시 ${hardware.concurrency}명 · ${RUNTIME_LABELS[hardware.runtime] || hardware.runtime} · ${quantLabel}`;
}

function renderCalculationBasisStrip(hardware) {
  if (!hasPrimaryGpuSelection) {
    $("calculationBasisStrip").innerHTML = `
      <div>
        <span>추천 시작하기</span>
        <strong>위에서 사용할 GPU를 먼저 선택해 주세요.</strong>
      </div>
      <button type="button" class="primary-button" data-open-settings>GPU 선택</button>
    `;
    return;
  }

  const basis = buildHardwareBasis(hardware);
  $("calculationBasisStrip").innerHTML = `
    <div>
      <span>현재 계산 기준</span>
      <strong>${escapeHtml(formatHardwareName(hardware, true))} · 가용 VRAM ${formatGb(hardware.availableVram)} · ${escapeHtml(basis)}</strong>
    </div>
    <button type="button" class="ghost-button" data-open-settings>조건 변경</button>
  `;
}

function formatHardwareName(hardware, compact = false) {
  const primaryName = compact ? shortGpuName(hardware.preset.name) : hardware.preset.name;
  const primary = `${primaryName}${hardware.primaryCount > 1 ? ` ×${hardware.primaryCount}` : ""}`;
  if (!hardware.secondaryPreset) return primary;
  const secondaryName = compact ? shortGpuName(hardware.secondaryPreset.name) : hardware.secondaryPreset.name;
  return `${primary} + ${secondaryName}${hardware.secondaryCount > 1 ? ` ×${hardware.secondaryCount}` : ""}`;
}

function shortGpuName(name) {
  return String(name || "")
    .replace(/^NVIDIA\s+/i, "")
    .replace(/^GeForce\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderQuantizationRecommendations(estimates) {
  const target = $("quantRecommendations");
  if (activeWorkload !== "generative" || $("quantization").value !== "auto") {
    target.hidden = true;
    target.innerHTML = "";
    return;
  }

  const runnable = estimates.filter((estimate) => estimate.grade !== "F" && estimate.quant);
  const groups = new Map();
  runnable.forEach((estimate) => {
    const group = groups.get(estimate.quant.id) || { quant: estimate.quant, estimates: [] };
    group.estimates.push(estimate);
    groups.set(estimate.quant.id, group);
  });
  const recommendations = [...groups.values()]
    .map((group) => ({
      ...group,
      best: [...group.estimates].sort((a, b) => recommendationScore(b) - recommendationScore(a))[0],
    }))
    .sort((a, b) => b.quant.rank - a.quant.rank);

  if (!recommendations.length) {
    target.hidden = true;
    target.innerHTML = "";
    return;
  }

  target.hidden = false;
  target.innerHTML = `
    <div class="quant-recommendation-head">
      <div>
        <span>양자화별 추천</span>
        <strong>현재 조건에서 실행 가능한 모델을 권장 양자화로 묶었습니다.</strong>
      </div>
      <small>모델을 누르면 상세 계산을 엽니다.</small>
    </div>
    <div class="quant-recommendation-list">
      ${recommendations.map(({ quant, estimates: groupEstimates, best }) => {
        const grade = GRADE_META[best.grade];
        return `
          <button type="button" class="quant-recommendation-card" data-model-key="${escapeAttr(modelKey(best.model))}">
            <span>${escapeHtml(quant.label)} · ${groupEstimates.length}개</span>
            <strong>${escapeHtml(best.model.name)}</strong>
            <small><span class="grade-dot ${grade.className}"></span>${escapeHtml(grade.label)} · ${formatGb(best.requiredGb)} · ${escapeHtml(formatSpeed(best.speed))}</small>
          </button>
        `;
      }).join("")}
    </div>
  `;
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

function computeSimpleRecommendations(allEstimates, purpose, priority, workload = activeWorkload) {
  const allowedModels = new Set(MODEL_GROUPS[workload] || []);
  return window.AIHardwareQuickRecommendation.recommend({
    estimates: allEstimates,
    workload,
    purpose,
    priority,
    allowedModels,
    isRunnable: (estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score,
    compareByPriority: (a, b, selectedPriority) => {
      if (selectedPriority === "speed") return b.speed - a.speed || gradeSort(a, b) || a.requiredGb - b.requiredGb;
      if (selectedPriority === "quality") return gradeSort(a, b) || b.model.params - a.model.params || b.speed - a.speed;
      if (selectedPriority === "vramHeadroom") return (b.effectiveVram - b.requiredGb) - (a.effectiveVram - a.requiredGb) || gradeSort(a, b);
      return recommendationScore(b) - recommendationScore(a) || gradeSort(a, b) || a.pressure - b.pressure;
    },
  });
}

function buildSimpleRecommendationReasons(estimate, limit = 3) {
  const purposeReason = window.AIHardwareQuickRecommendation?.reason(
    estimate.model,
    $("simplePurpose")?.value,
    uiLanguage,
  );
  return [...new Set([
    purposeReason,
    ...buildRecommendationReasons(estimate).map(localizeRecommendationReason),
  ].filter(Boolean))].slice(0, limit);
}

function getQuickRecommendationEstimates() {
  if (!hasPrimaryGpuSelection) return [];
  const hardware = getHardware();
  const estimates = getActiveModels().map((model) => estimateAnyModel(model, hardware));
  return computeSimpleRecommendations(
    estimates,
    $("simplePurpose")?.value || getSimplePurposeOptions()[0].id,
    $("simplePriority")?.value || "balanced",
    activeWorkload,
  );
}

function renderSimpleMode(hardware, allEstimates) {
  const gpuReadout = $("simpleModeGpuReadout");
  if (gpuReadout) {
    gpuReadout.textContent = hasPrimaryGpuSelection ? formatHardwareName(hardware) : t("gpuRequired");
  }

  const coverageTarget = $("simpleDataCoverage");
  if (coverageTarget) {
    const catalogModels = Object.values(MODEL_GROUPS).flat().filter((model) => !model.hfImported);
    const qualityCount = catalogModels.filter((model) => model.qualityBenchmark).length;
    coverageTarget.innerHTML = `
      <span><strong>${GPU_PRESETS.length}</strong> ${uiLanguage === "en" ? "GPU presets" : "GPU 프리셋"}</span>
      <span><strong>${catalogModels.length}</strong> ${uiLanguage === "en" ? "AI models" : "AI 모델"}</span>
      <span><strong>${qualityCount}</strong> ${uiLanguage === "en" ? "Cited evaluations" : "출처 연결 평가"}</span>
    `;
  }

  const target = $("simpleModeResult");
  if (!target) return;
  const exploreActions = $("simpleExploreActions");

  if (!hasPrimaryGpuSelection) {
    exploreActions.hidden = true;
    target.innerHTML = `
      <div class="empty-state simple-gpu-empty">
        <strong>${uiLanguage === "en" ? "Select your GPU to start recommendations." : "내 GPU를 선택하면 추천을 시작합니다."}</strong>
        <span>${uiLanguage === "en" ? "Choose a GPU above to calculate VRAM and speed for 3 runnable models." : "상단에서 GPU 모델을 고르면 VRAM과 속도를 계산해 실행 가능한 모델 3개를 보여드립니다."}</span>
        <button type="button" class="primary-button" data-focus-primary-gpu>${t("chooseGpu")}</button>
      </div>
    `;
    return;
  }

  const picks = computeSimpleRecommendations(
    allEstimates,
    $("simplePurpose")?.value || getSimplePurposeOptions()[0].id,
    $("simplePriority")?.value || "balanced",
    activeWorkload,
  );

  if (!picks.length) {
    exploreActions.hidden = true;
    target.innerHTML = `
      <div class="empty-state">
        <strong>현재 조건에 맞는 모델이 없습니다.</strong>
        <span>GPU 설정이나 우선순위를 바꿔 다시 확인해 보세요.</span>
        <button type="button" class="primary-button" data-reset-simple-filters>${uiLanguage === "en" ? "Reset recommendation filters" : "추천 조건 초기화"}</button>
      </div>
    `;
    return;
  }

  exploreActions.hidden = false;
  // If a previous pick set no longer contains the selected model (purpose/
  // priority changed), close the inspector rather than leaving a dangling
  // reference.
  if (simpleExpandedKey && !picks.some((estimate) => modelKey(estimate.model) === simpleExpandedKey)) {
    simpleExpandedKey = "";
  }

  target.innerHTML = picks.map((estimate, index) => {
    const confidence = getEstimateConfidence(estimate.model, estimate, hardware);
    const evidence = window.AIHardwareUI?.evidenceState({
      kind: confidence.sampleCount ? "user" : confidence.matchedRow ? "external" : "estimate",
      sampleCount: confidence.sampleCount || (confidence.matchedRow ? 1 : 0),
      reason: confidence.reason,
    }) || {
      label: uiLanguage === "en" ? "Calculated estimate" : "계산 추정",
      errorPct: Math.round((confidence.spread || .4) * 100),
      reason: confidence.reason,
    };
    const meta = GRADE_META[estimate.grade];
    const licensePolicy = getLicensePolicy(estimate.model);
    const reasons = buildSimpleRecommendationReasons(estimate, 3);
    const key = modelKey(estimate.model);
    const isSelected = simpleExpandedKey === key;
    const ctaLabel = isSelected
      ? (uiLanguage === "en" ? "Viewing details" : "상세 보는 중")
      : t("detailCalculation");

    return `
      <div class="simple-pick-card ${index === 0 ? "is-top-pick" : ""} ${isSelected ? "is-selected" : ""}" data-workload="${escapeAttr(activeWorkload)}" data-model-type="${escapeAttr(estimate.model.type || "generative")}">
        <button type="button" class="simple-pick-card-toggle" data-model-key="${escapeAttr(key)}" aria-expanded="${isSelected ? "true" : "false"}" aria-controls="simpleRecommendationPanel">
          <span class="simple-pick-rank">${uiLanguage === "en" ? `Rank ${index + 1}` : `${index + 1}순위`}</span>
          <span class="simple-pick-head">
            <strong>${escapeHtml(estimate.model.name)}</strong>
            <span class="grade-pill ${meta.className}">${meta.label}</span>
          </span>
          <span class="simple-pick-specs">
            <span>${escapeHtml(estimate.model.maker)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))}</span>
            <span>VRAM ${formatGb(estimate.requiredGb)}</span>
            <span>${escapeHtml(formatSpeedRange(estimate, confidence))}</span>
            <span class="evidence-badge is-${escapeAttr(evidence.kind || "estimate")}" title="${escapeAttr(evidence.reason)}">${escapeHtml(evidence.label)} · ${uiLanguage === "en" ? "expected error" : "예상 오차"} ±${Math.round((confidence.spread || evidence.errorPct / 100 || .4) * 100)}%</span>
          </span>
          ${reasons.length ? `<span class="simple-pick-reasons">${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</span>` : ""}
        </button>
        <span class="simple-pick-actions">
          <span class="simple-pick-cta" data-model-key="${escapeAttr(key)}">${escapeHtml(ctaLabel)} ${isSelected ? "✓" : "→"}</span>
          <span class="simple-pick-copy" role="button" tabindex="0" data-copy-command="${escapeAttr(estimate.model.type === "generative" ? buildOllamaCommand(estimate.model, estimate.quant, hardware) : buildNonGenerativeCommand(estimate.model, estimate))}">${uiLanguage === "en" ? "Copy run command" : "실행 명령어 복사"}</span>
        </span>
      </div>
    `;
  }).join("");
  const topPick = picks[0];
  target.insertAdjacentHTML("beforeend", `
    <div class="mobile-decision-summary" aria-label="${uiLanguage === "en" ? "Selected recommendation summary" : "선택한 추천 요약"}">
      <span><small>${uiLanguage === "en" ? "Top recommendation" : "1순위 추천"}</small><strong>${escapeHtml(topPick.model.name)}</strong></span>
      <button type="button" class="primary-button" data-model-key="${escapeAttr(modelKey(topPick.model))}">${uiLanguage === "en" ? "View" : "보기"}</button>
    </div>`);
}

function buildModelShareUrl(key, mode = "expert") {
  const url = new URL(window.location.href);
  url.searchParams.set("model", key);
  url.searchParams.set("ui", mode);
  return url.toString();
}

function closeSimpleRecommendationPanel({ restoreFocus = true } = {}) {
  const previousKey = simpleExpandedKey;
  simpleExpandedKey = "";
  render();
  if (restoreFocus && previousKey) {
    [...document.querySelectorAll(".simple-pick-card-toggle")]
      .find((button) => button.dataset.modelKey === previousKey)
      ?.focus();
  }
}

function applyRunFeedbackLinks(container, model, estimate, hardware) {
  const feedback = window.AIHardwareCommunityFeedback;
  if (!container || !feedback) return;
  const workloadRuntime = {
    embedding: "sentence-transformers",
    reranker: "sentence-transformers / Transformers",
    "ocr-pipeline": "PaddleOCR / PyTorch",
    "ocr-vlm": "Transformers / PyTorch",
    "document-vlm": "Transformers / PyTorch",
    "general-vlm": "Transformers / PyTorch",
    "image-generation": "Diffusers / PyTorch",
    "video-generation": "Diffusers / PyTorch",
    "avatar-generation": "PyTorch",
    "audio-stt": "Transformers / PyTorch",
    "audio-tts": "PyTorch",
  };
  const runtime = model.type === "generative"
    ? (getWorkloadSettings()?.runtime || $("runtimeMode")?.value || "")
    : (workloadRuntime[model.type] || "PyTorch");
  const gpuName = formatHardwareName(hardware);
  container.querySelectorAll("[data-run-feedback]").forEach((link) => {
    link.href = feedback.feedbackUrl({
      outcome: link.dataset.runFeedback,
      model: model.name,
      gpu: gpuName,
      workload: WORKLOAD_META[activeWorkload]?.label || activeWorkload,
      purpose: $("simplePurpose")?.selectedOptions?.[0]?.textContent || "",
      runtime,
      setting: estimate.settingLabel || estimate.quant?.label || estimate.precision?.label || "",
      requiredGb: formatGb(estimate.requiredGb),
      estimatedSpeed: formatSpeedRange(estimate, getEstimateConfidence(model, estimate, hardware)),
    });
  });
  // "결과 JSON 붙여넣기" 버튼도 이 모델/GPU/런타임을 알고 있어야, 클릭했을 때
  // community-feedback.js가 빈 예시("Qwen3 8B" 등) 대신 지금 보고 있는 조합으로
  // 텍스트영역을 미리 채울 수 있다.
  container.querySelectorAll("[data-community-open]").forEach((el) => {
    el.dataset.communityModel = model.name;
    el.dataset.communityGpu = gpuName;
    el.dataset.communityRuntime = runtime;
  });
}

function renderSimpleRecommendationPanel(hardware) {
  const panel = $("simpleRecommendationPanel");
  const backdrop = $("simpleInspectorBackdrop");
  if (!panel || !backdrop) return;

  if (appMode !== "simple" || !simpleExpandedKey) {
    panel.hidden = true;
    backdrop.hidden = true;
    panel.innerHTML = "";
    document.body.classList.remove("simple-inspector-active");
    return;
  }

  const model = getModelByKey(simpleExpandedKey);
  if (!model) {
    simpleExpandedKey = "";
    panel.hidden = true;
    backdrop.hidden = true;
    panel.innerHTML = "";
    document.body.classList.remove("simple-inspector-active");
    return;
  }

  const estimate = estimateAnyModel(model, hardware);
  const meta = GRADE_META[estimate.grade];
  const confidence = getEstimateConfidence(model, estimate, hardware);
  const reasons = buildSimpleRecommendationReasons(estimate, 4);
  const licensePolicy = getLicensePolicy(model);
  const en = uiLanguage === "en";
  const setting = estimate.settingLabel || estimate.quant?.label || estimate.precision?.label || "-";
  const command = model.type === "generative"
    ? buildOllamaCommand(model, estimate.quant, hardware)
    : buildNonGenerativeCommand(model, estimate);
  const memoryParts = [
    { key: "weights", label: en ? "Weights" : "가중치", value: estimate.weightsGb || 0 },
    { key: "kv", label: "KV cache", value: estimate.kvGb || estimate.decoderKvGb || 0 },
    { key: "runtime", label: en ? "Runtime" : "런타임", value: estimate.runtimeOverheadGb || estimate.activationGb || 0 },
    { key: "free", label: en ? "Free" : "여유", value: Math.max(0, (estimate.effectiveVram || hardware.availableVram) - estimate.requiredGb) },
  ].filter((part) => part.value > 0);

  panel.hidden = false;
  backdrop.hidden = false;
  panel.setAttribute("aria-label", en ? "Quick recommendation details" : "빠른 추천 상세");
  panel.innerHTML = `
    <div class="simple-inspector-head">
      <div>
        <span class="simple-inspector-kicker">${en ? "Quick recommendation" : "빠른 추천 상세"}</span>
        <strong>${escapeHtml(model.name)}</strong>
      </div>
      <button type="button" class="icon-button" data-close-simple-inspector aria-label="${en ? "Close recommendation details" : "추천 상세 닫기"}">×</button>
    </div>
    <div class="simple-inspector-body">
      <div class="simple-inspector-title">
        <span class="grade-pill ${meta.className}">${escapeHtml(meta.label)}</span>
        <p>${escapeHtml(model.maker)} · ${escapeHtml(model.license)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))}</p>
        <p>${escapeHtml(modelSummary(model))}</p>
      </div>
      <div class="simple-inspector-metrics">
        ${renderDetailMetric(en ? "Run verdict" : "실행 판정", meta.label)}
        ${renderDetailMetric(en ? "Recommended setting" : "권장 설정", setting)}
        ${renderDetailMetric(en ? "Calculated VRAM" : "계산 VRAM", formatGb(estimate.requiredGb), `${en ? "Available" : "가용"} ${formatGb(estimate.effectiveVram || hardware.availableVram)}`)}
        ${renderDetailMetric(en ? "Estimated speed" : "예상 속도", formatSpeedRange(estimate, confidence), `${en ? "Confidence" : "신뢰도"} ${confidence.label}`)}
      </div>
      ${memoryParts.length ? `
        <section class="simple-inspector-section">
          <h3>${en ? "VRAM at a glance" : "VRAM 한눈에 보기"}</h3>
          ${renderMemoryMap(memoryParts, Math.max(hardware.availableVram, estimate.requiredGb))}
        </section>
      ` : ""}
      <section class="simple-inspector-section">
        <h3>${en ? "Why it was recommended" : "추천 이유"}</h3>
        <ul class="simple-inspector-reasons">${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
      </section>
      <section class="simple-inspector-section">
        <h3>${en ? "Run command" : "실행 명령어"}</h3>
        <pre class="command-block"><code>${escapeHtml(command)}</code></pre>
        <button type="button" class="ghost-button" data-copy-command="${escapeAttr(command)}">${en ? "Copy command" : "명령어 복사"}</button>
        <button type="button" class="ghost-button" data-community-open>${en ? "Submit this result" : "이 실행 결과 제보"}</button>
      </section>
      <section class="simple-inspector-section">
        ${window.AIHardwareCommunityFeedback?.buttons(uiLanguage) || ""}
        <p class="detail-note">${en
          ? "GitHub opens with the GPU, model, and calculated conditions prefilled. Remove anything you do not want to share."
          : "GPU·모델·계산 조건이 미리 채워진 GitHub 제보 화면이 열립니다. 공유하고 싶지 않은 항목은 지워 주세요."}</p>
      </section>
      <div class="simple-inspector-actions">
        <button type="button" class="primary-button" data-open-full-simple-detail="${escapeAttr(simpleExpandedKey)}">${en ? "Open full analysis" : "전체 상세 분석"}</button>
        <button type="button" class="ghost-button" data-share-model-link="${escapeAttr(simpleExpandedKey)}">${en ? "Copy result link" : "결과 링크 복사"}</button>
        <button type="button" class="ghost-button" data-download-simple-card="${escapeAttr(simpleExpandedKey)}">${en ? "Download PNG card" : "요약 카드 PNG"}</button>
      </div>
    </div>
  `;
  applyRunFeedbackLinks(panel, model, estimate, hardware);
}

function localizeRecommendationReason(reason) {
  if (uiLanguage !== "en") return reason;
  return String(reason)
    .replace("가용 VRAM 안에 들어옴", "Fits available VRAM")
    .replace("VRAM 여유", "VRAM headroom")
    .replace("한국어 지원", "Korean support")
    .replace("코딩 적합", "Good for coding")
    .replace("추론 태그", "Reasoning tag")
    .replace("긴 컨텍스트", "Long context")
    .replace("품질 평가 출처 있음", "Quality evaluation cited");
}

function renderResults(estimates, allEstimates = []) {
  const meta = WORKLOAD_META[activeWorkload];
  if (!hasPrimaryGpuSelection) {
    $("resultMeta").textContent = t("gpuRequired");
    $("modelResults").className = "model-results";
    $("modelResults").innerHTML = `
      <div class="empty-state">
        <strong>${uiLanguage === "en" ? "Select a GPU to calculate all models." : "GPU를 선택하면 전체 모델을 계산합니다."}</strong>
        <span>${uiLanguage === "en" ? "Choose the hardware preset to use above." : "상단의 GPU 프리셋에서 사용할 하드웨어를 먼저 선택해 주세요."}</span>
        <button type="button" class="primary-button" data-focus-primary-gpu>${t("chooseGpu")}</button>
      </div>
    `;
    return;
  }

  const shownCount = estimates.length.toLocaleString("ko-KR");
  const totalCount = allEstimates.length.toLocaleString("ko-KR");
  $("resultMeta").textContent = estimates.length === allEstimates.length
    ? `모델 ${shownCount}개`
    : `전체 ${totalCount}개 중 ${shownCount}개 표시`;

  if (!estimates.length) {
    $("modelResults").className = "model-results";
    $("modelResults").innerHTML = `
      <div class="empty-state">
        <strong>현재 조건에 맞는 모델이 없습니다.</strong>
        <span>등급, 작업, 공급사, 라이선스 또는 검색어를 줄이면 후보가 다시 표시됩니다.</span>
        <div class="empty-actions">
          <button type="button" class="ghost-button" data-empty-action="include-conditional">조건부 모델 포함</button>
          <button type="button" class="ghost-button" data-empty-action="clear">필터 초기화</button>
        </div>
      </div>
    `;
    return;
  }

  if (viewMode === "card") {
    $("modelResults").className = "model-results card-mode";
    $("modelResults").innerHTML = estimates
      .map((estimate) => renderModelCard(estimate))
      .join("");
    return;
  }

  $("modelResults").className = "model-results list-mode";
  $("modelResults").innerHTML = `
    <div class="model-list-head" aria-hidden="true">
      ${meta.listHeaders.map((header) => `<span>${escapeHtml(header)}</span>`).join("")}
    </div>
    ${estimates.map((estimate) => renderModelRow(estimate)).join("")}
  `;
}

function getCompareEstimates(allEstimates) {
  return compareKeys
    .map((key) => allEstimates.find((estimate) => modelKey(estimate.model) === key))
    .filter(Boolean);
}

function renderCompareBar(allEstimates) {
  const bar = $("compareBar");
  const items = getCompareEstimates(allEstimates);

  if (compareKeys.length && items.length !== compareKeys.length) {
    compareKeys = items.map((estimate) => modelKey(estimate.model));
  }

  if (!items.length) {
    bar.hidden = true;
    bar.innerHTML = "";
    return;
  }

  bar.hidden = false;
  bar.innerHTML = `
    <span class="compare-bar-label">비교 (${items.length}/${MAX_COMPARE_MODELS})</span>
    <div class="compare-bar-chips">
      ${items.map((estimate) => `
        <span class="compare-chip">
          ${escapeHtml(estimate.model.name)}
          <button type="button" data-remove-compare-key="${escapeAttr(modelKey(estimate.model))}" aria-label="${escapeAttr(estimate.model.name)} 비교에서 제거">×</button>
        </span>
      `).join("")}
    </div>
    <button type="button" class="primary-button compare-open-button" data-open-compare ${items.length < 2 ? "disabled" : ""}>비교 보기</button>
    <button type="button" class="ghost-button" data-add-compare-to-placement>GPU에 함께 배치</button>
    <button type="button" class="ghost-button" data-clear-compare>전체 해제</button>
  `;
}

function buildCompareSummaryLine(rows) {
  const feasible = rows.filter(({ estimate }) => GRADE_META[estimate.grade].score >= GRADE_META.B.score);
  const infeasible = rows.filter(({ estimate }) => GRADE_META[estimate.grade].score < GRADE_META.B.score);

  if (!feasible.length) {
    return uiLanguage === "en"
      ? "None of the compared models is runnable with the current GPU and VRAM settings."
      : "비교한 모델 중 현재 실행 환경(GPU·VRAM 설정)에서 실행 가능한 모델이 없습니다.";
  }

  const recommended = [...feasible].sort((a, b) => (
    recommendationScore(b.estimate) - recommendationScore(a.estimate)
    || GRADE_META[b.estimate.grade].score - GRADE_META[a.estimate.grade].score
    || a.estimate.requiredGb - b.estimate.requiredGb
  ))[0];
  const parts = [uiLanguage === "en"
    ? `We recommend ${recommended.estimate.model.name} for the current setup.`
    : `현재 환경에서는 ${recommended.estimate.model.name} 모델을 권장합니다.`];
  const otherFeasible = feasible.filter((row) => row !== recommended);

  if (otherFeasible.length) {
    parts.push(uiLanguage === "en"
      ? `${otherFeasible.map(({ estimate }) => estimate.model.name).join(", ")} are also runnable.`
      : `${otherFeasible.map(({ estimate }) => estimate.model.name).join(", ")}도 실행 가능합니다.`);
  }

  infeasible.forEach(({ estimate }) => {
    const deficitGb = estimate.requiredGb - estimate.effectiveVram;
    parts.push(deficitGb > 0
      ? (uiLanguage === "en" ? `${estimate.model.name} exceeds available VRAM by ${formatGb(deficitGb)}.` : `${estimate.model.name}은(는) 가용 VRAM을 ${formatGb(deficitGb)} 초과합니다.`)
      : (uiLanguage === "en" ? `${estimate.model.name} does not meet the recommended headroom.` : `${estimate.model.name}은(는) 안정적인 실행 여유 기준에 미달합니다.`));
  });

  return parts.join(" ");
}

function renderCompareModal(allEstimates) {
  const backdrop = $("compareModalBackdrop");
  const modal = $("compareModal");
  const items = getCompareEstimates(allEstimates);

  if (!compareModalOpen || items.length < 2) {
    backdrop.hidden = true;
    modal.hidden = true;
    modal.innerHTML = "";
    return;
  }

  const hardware = getHardware();
  const rows = items.map((estimate) => {
    const confidence = getEstimateConfidence(estimate.model, estimate, hardware);
    return {
      estimate,
      confidence,
      release: getModelReleaseInfo(estimate.model),
      benchmark: getBenchmarkSummary(estimate.model, estimate, confidence),
      licensePolicy: getLicensePolicy(estimate.model),
      meta: GRADE_META[estimate.grade],
      metric: estimate.model.qualityBenchmark?.metric || null,
    };
  });

  const comparableMetrics = rows.map((row) => row.metric).filter(Boolean);
  const benchmarksComparable = comparableMetrics.length === rows.length && new Set(comparableMetrics).size === 1;

  backdrop.hidden = false;
  modal.hidden = false;
  modal.innerHTML = `
    <div class="compare-modal-head">
      <div>
        <span class="section-kicker">Compare</span>
        <h2>모델 비교 (${rows.length}개)</h2>
      </div>
      <button type="button" class="icon-button" data-close-compare aria-label="비교 닫기">×</button>
    </div>
    <p class="compare-summary-line">${escapeHtml(buildCompareSummaryLine(rows))}</p>
    <div class="compare-table-wrap">
      <table class="compare-table">
        <thead>
          <tr>
            <th></th>
            ${rows.map(({ estimate }) => `
              <th>
                <strong>${escapeHtml(estimate.model.name)}</strong>
                <button type="button" class="compare-remove" data-remove-compare-key="${escapeAttr(modelKey(estimate.model))}" title="비교에서 제거" aria-label="${escapeAttr(estimate.model.name)} 비교에서 제거">×</button>
              </th>
            `).join("")}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>실행 등급</th>
            ${rows.map(({ meta: gradeMeta, estimate }) => `<td><span class="grade-pill ${gradeMeta.className}" title="${escapeAttr(buildGradeTooltip(estimate))}">${gradeMeta.label}</span></td>`).join("")}
          </tr>
          <tr>
            <th>공급사 / 라이선스</th>
            ${rows.map(({ estimate, licensePolicy }) => `
              <td>
                <span class="compare-primary">${escapeHtml(estimate.model.maker)} · ${escapeHtml(estimate.model.license)}</span>
                <span class="license-inline license-${escapeAttr(licensePolicy.commercialUse)}">${escapeHtml(licenseCommercialLabel(licensePolicy))}</span>
              </td>
            `).join("")}
          </tr>
          <tr>
            <th>출시/세대</th>
            ${rows.map(({ release }) => `<td><span class="compare-primary">${escapeHtml(release.label)}</span><span class="compare-secondary">${escapeHtml(release.note)}</span></td>`).join("")}
          </tr>
          <tr>
            <th>대표 공개 평가</th>
            ${rows.map(({ benchmark }) => `
              <td>
                <span class="compare-primary">${escapeHtml(benchmark.label)}</span>
                <span class="compare-secondary">${escapeHtml(benchmark.note)}</span>
                ${!benchmarksComparable && benchmark.label !== "—" ? `<span class="compare-caveat">서로 다른 벤치마크로 직접 비교할 수 없습니다.</span>` : ""}
              </td>
            `).join("")}
          </tr>
          <tr>
            <th>권장 설정</th>
            ${rows.map(({ estimate }) => `<td><span class="compare-primary">${escapeHtml(estimate.settingLabel)}</span></td>`).join("")}
          </tr>
          <tr>
            <th>필요 VRAM</th>
            ${rows.map(({ estimate }) => {
              const margin = estimate.effectiveVram - estimate.requiredGb;
              const marginLabel = margin >= 0 ? `가용 VRAM 대비 여유 ${formatGb(margin)}` : `${formatGb(Math.abs(margin))} 부족`;
              return `
                <td>
                  <strong class="compare-value">${formatGb(estimate.requiredGb)}</strong>
                  <span class="compare-secondary ${margin >= 0 ? "compare-positive" : "compare-negative"}">${escapeHtml(marginLabel)}</span>
                </td>
              `;
            }).join("")}
          </tr>
          <tr>
            <th>추정 속도</th>
            ${rows.map(({ estimate, confidence }) => {
              const unavailable = !estimate.speed;
              return `
                <td>
                  <strong class="compare-value ${unavailable ? "compare-negative" : ""}">${escapeHtml(formatSpeedRange(estimate, confidence))}</strong>
                  <span class="compare-secondary">${unavailable ? "GPU 여유 부족" : `신뢰도 ${escapeHtml(confidence.label)}`}</span>
                </td>
              `;
            }).join("")}
          </tr>
          <tr>
            <th>컨텍스트 한도</th>
            ${rows.map(({ estimate }) => `<td><span class="compare-primary">${escapeHtml(estimate.limitLabel)}</span></td>`).join("")}
          </tr>
          <tr>
            <th>태그</th>
            ${rows.map(({ estimate }) => `<td><div class="compare-tags">${renderTags(estimate.model, 6)}</div></td>`).join("")}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderActiveFilterChips(estimates, allEstimates) {
  const chips = [];
  const summary = SUMMARY_FILTERS.find((item) => item.id === activeSummaryFilter);
  const gradeValue = $("gradeFilter").value;
  const taskValue = $("taskFilter").value;
  const providerValue = $("providerFilter").value;
  const licenseValue = $("licenseFilter").value;
  const licenseUseValue = $("licenseUseFilter").value;
  const searchValue = $("searchInput").value.trim();

  if (summary && summary.id !== "all") chips.push({ key: "summary", label: `상태 ${summary.label}` });
  if (gradeValue !== "all") chips.push({ key: "grade", label: `등급 ${selectedOptionLabel("gradeFilter")}` });
  if (taskValue !== "all") chips.push({ key: "task", label: `작업 ${tagLabel(taskValue)}` });
  if (providerValue !== "all") chips.push({ key: "provider", label: `공급사 ${providerValue}` });
  if (licenseValue !== "all") chips.push({ key: "license", label: `라이선스 ${licenseValue}` });
  if (licenseUseValue !== "all") chips.push({ key: "licenseUse", label: `이용 조건 ${selectedOptionLabel("licenseUseFilter")}` });
  if (searchValue) chips.push({ key: "search", label: `검색 ${searchValue}` });

  const target = $("activeFilterChips");
  if (!chips.length) {
    target.hidden = true;
    target.innerHTML = "";
    return;
  }

  target.hidden = false;
  target.innerHTML = `
    <span>${allEstimates.length.toLocaleString("ko-KR")}개 중 ${estimates.length.toLocaleString("ko-KR")}개 표시</span>
    ${chips.map((chip) => `
      <button type="button" class="filter-chip" data-clear-filter="${escapeAttr(chip.key)}">
        ${escapeHtml(chip.label)} <span aria-hidden="true">×</span>
      </button>
    `).join("")}
    <button type="button" class="filter-clear" data-clear-filter="all">전체 해제</button>
  `;
}

function selectedOptionLabel(id) {
  const select = $(id);
  return select.options[select.selectedIndex]?.textContent || select.value;
}

function renderModelRow(estimate) {
  const meta = GRADE_META[estimate.grade];
  const tags = renderTags(estimate.model, 3);
  const key = modelKey(estimate.model);
  const confidence = getEstimateConfidence(estimate.model, estimate, getHardware());
  const release = getModelReleaseInfo(estimate.model);
  const benchmark = getBenchmarkSummary(estimate.model, estimate, confidence);
  const licensePolicy = getLicensePolicy(estimate.model);
  const recommendation = buildRecommendationReasons(estimate).slice(0, 3).join(" · ");
  const gradeTitle = buildGradeTooltip(estimate);
  const isSelected = selectedModelKey === key;
  const compareSelected = compareKeys.includes(key);
  const compareDisabled = !compareSelected && compareKeys.length >= MAX_COMPARE_MODELS;

  return `
    <button type="button" class="model-row ${isSelected ? "is-selected" : ""}" data-model-key="${escapeAttr(key)}">
      <span class="model-cell status-cell" data-label="상태">
        <input type="checkbox" class="compare-checkbox" data-compare-key="${escapeAttr(key)}" ${compareSelected ? "checked" : ""} ${compareDisabled ? "disabled" : ""} title="비교에 추가 (최대 ${MAX_COMPARE_MODELS}개)" aria-label="${escapeAttr(estimate.model.name)} 비교에 추가" onclick="event.stopPropagation()" />
        <span class="grade-pill ${meta.className}" title="${escapeAttr(gradeTitle)}">${meta.label}</span>
      </span>
      <span class="model-cell model-name-cell">
        <strong>${escapeHtml(estimate.model.name)}</strong>
        <span class="tag-row compact-tags">${tags}</span>
        <span class="recommendation-line">${escapeHtml(recommendation)}</span>
      </span>
      <span class="model-cell release-cell ${release.className}" data-label="출시/세대" title="${escapeAttr(release.title)}">
        <strong>${escapeHtml(release.label)}</strong>
        <small>${escapeHtml(release.note)}</small>
      </span>
      <span class="model-cell benchmark-cell ${benchmark.className}" data-label="대표 공개 평가" title="${escapeAttr(benchmark.title)}">
        <strong>${escapeHtml(benchmark.label)}</strong>
        <small>${escapeHtml(benchmark.note)}</small>
      </span>
      <span class="model-cell provider-cell" data-label="공급사/라이선스">
        <strong>${escapeHtml(estimate.model.maker)}</strong>
        <small>${escapeHtml(estimate.model.license)}</small>
        <span class="license-inline license-${escapeAttr(licensePolicy.commercialUse)}">${escapeHtml(licenseCommercialLabel(licensePolicy))}</span>
      </span>
      <span class="model-cell" data-label="${escapeAttr(WORKLOAD_META[activeWorkload].listHeaders[5])}">${escapeHtml(estimate.settingLabel)}</span>
      <span class="model-cell numeric-cell" data-label="${escapeAttr(WORKLOAD_META[activeWorkload].listHeaders[6])}">${formatGb(estimate.requiredGb)}</span>
      <span class="model-cell numeric-cell estimate-speed-cell" data-label="${escapeAttr(WORKLOAD_META[activeWorkload].listHeaders[7])}">
        <strong>${escapeHtml(formatSpeedRange(estimate, confidence))}</strong>
        <small>${uiLanguage === "en" ? "Estimated" : "추정"} · ${escapeHtml(confidence.label)}</small>
      </span>
      <span class="model-cell numeric-cell" data-label="${escapeAttr(WORKLOAD_META[activeWorkload].listHeaders[8])}">${escapeHtml(estimate.limitLabel)}</span>
      <span class="row-chevron" aria-hidden="true">›</span>
    </button>
  `;
}

function renderModelCard(estimate) {
  const meta = GRADE_META[estimate.grade];
  const key = modelKey(estimate.model);
  const tags = renderTags(estimate.model, 4);
  const confidence = getEstimateConfidence(estimate.model, estimate, getHardware());
  const release = getModelReleaseInfo(estimate.model);
  const benchmark = getBenchmarkSummary(estimate.model, estimate, confidence);
  const licensePolicy = getLicensePolicy(estimate.model);
  const recommendation = buildRecommendationReasons(estimate).slice(0, 3).join(" · ");
  const compareSelected = compareKeys.includes(key);
  const compareDisabled = !compareSelected && compareKeys.length >= MAX_COMPARE_MODELS;

  return `
    <button type="button" class="compact-card" data-model-key="${escapeAttr(key)}">
      <span class="compact-card-head">
        <span>
          <input type="checkbox" class="compare-checkbox" data-compare-key="${escapeAttr(key)}" ${compareSelected ? "checked" : ""} ${compareDisabled ? "disabled" : ""} title="비교에 추가 (최대 ${MAX_COMPARE_MODELS}개)" aria-label="${escapeAttr(estimate.model.name)} 비교에 추가" onclick="event.stopPropagation()" />
          <strong>${escapeHtml(estimate.model.name)}</strong>
          <span>${escapeHtml(estimate.model.maker)} · ${escapeHtml(estimate.model.license)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))}</span>
        </span>
        <span class="grade-pill ${meta.className}">${meta.label}</span>
      </span>
      <span class="compact-specs">
        <span>${escapeHtml(estimate.settingLabel)}</span>
        <span>출시 ${escapeHtml(release.label)}</span>
        <span>품질 ${escapeHtml(benchmark.label)}</span>
        <span>VRAM ${formatGb(estimate.requiredGb)}</span>
        <span>${escapeHtml(formatSpeedRange(estimate, confidence))}</span>
        <span>${escapeHtml(estimate.limitLabel)}</span>
      </span>
      <span class="tag-row">${tags}</span>
      <span class="recommendation-line">${escapeHtml(recommendation)}</span>
      <span class="compact-summary">${escapeHtml(modelSummary(estimate.model))}</span>
    </button>
  `;
}

function getRecommendationRanks() {
  const hardware = getHardware();
  const ranked = getActiveModels()
    .map((model) => estimateAnyModel(model, hardware))
    .filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score)
    .sort((a, b) => recommendationScore(b) - recommendationScore(a) || gradeSort(a, b) || a.pressure - b.pressure)
    .slice(0, 3);

  return new Map(ranked.map((estimate, index) => [modelKey(estimate.model), index + 1]));
}

function renderDetailEmptyStateHtml() {
  // Only ever visible in the desktop (>=1280px) split-view inspector panel —
  // styles.css forces #modelDetail to display:block there regardless of the
  // `hidden` attribute set below, so an unselected state must still render
  // something other than a blank white column. In every other layout
  // (narrower widths, quick-recommend mode) #modelDetail stays truly hidden
  // via the `hidden` attribute, so this markup never becomes visible there.
  return uiLanguage === "en"
    ? `
      <div class="detail-empty-state">
        <strong>Select a model</strong>
        <p>Pick a model from the list to see required VRAM, estimated speed, recommended settings, and the run command.</p>
      </div>
    `
    : `
      <div class="detail-empty-state">
        <strong>모델을 선택하세요</strong>
        <p>목록에서 모델을 선택하면 필요 VRAM, 예상 속도, 권장 설정과 실행 명령을 확인할 수 있습니다.</p>
      </div>
    `;
}

function renderDetail() {
  const detail = $("modelDetail");
  const backdrop = $("drawerBackdrop");

  if (!selectedModelKey) {
    detail.hidden = true;
    backdrop.hidden = true;
    detail.innerHTML = renderDetailEmptyStateHtml();
    return;
  }

  const model = getModelByKey(selectedModelKey);
  if (!model) {
    selectedModelKey = "";
    detail.hidden = true;
    backdrop.hidden = true;
    detail.innerHTML = renderDetailEmptyStateHtml();
    return;
  }

  const hardware = getHardware();
  if (model.type !== "generative") {
    renderNonGenerativeDetail(detail, backdrop, model, hardware);
    return;
  }

  detail.hidden = false;
  backdrop.hidden = true;
  detail.innerHTML = `
    <div class="detail-head">
      <button type="button" class="back-button" data-close-detail>상세 닫기</button>
      <button type="button" class="icon-button" data-close-detail aria-label="상세 닫기">×</button>
    </div>
    ${buildGenerativeDetailBodyHtml(model, hardware)}
  `;
}

// Shared by the drawer/inspector (renderDetail) and the quick-recommend
// inline accordion (renderSimpleMode) so both surfaces show identical
// content — only the surrounding chrome (close button vs. accordion toggle)
// differs.
function buildGenerativeDetailBodyHtml(model, hardware) {
  const estimate = estimateModel(model, $("quantization").value, hardware);
  const meta = GRADE_META[estimate.grade];
  const confidence = getEstimateConfidence(model, estimate, hardware);
  const release = getModelReleaseInfo(model);
  const benchmark = getBenchmarkSummary(model, estimate, confidence);
  const licensePolicy = getLicensePolicy(model);
  const recommendationReasons = buildRecommendationReasons(estimate);
  const breakdownTotal = Math.max(estimate.requiredGb, 0.1);
  const en = uiLanguage === "en";
  const modelTrust = window.AIHardwareDataTrust?.scoreModel(
    model,
    BENCHMARKS.filter((row) => row.model === model.name || row.modelName === model.name),
  ) || { score: 0, missing: [] };
  const modelTrustLabel = window.AIHardwareDataTrust?.completenessLabel(modelTrust.score, uiLanguage)
    || { level: "low", text: en ? "Needs work" : "보강 필요" };

  return `
    <div class="detail-title">
      <span class="grade-pill ${meta.className}" title="${escapeAttr(buildGradeTooltip(estimate))}">${meta.label}</span>
      <h2>${escapeHtml(model.name)}</h2>
      <p>${escapeHtml(model.maker)} · ${escapeHtml(model.license)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))} · ${model.tags.map(tagLabel).map(escapeHtml).join(" · ")}</p>
      <p class="detail-description">${escapeHtml(modelSummary(model))}</p>
    </div>

    ${renderShareActions(model)}

    <div class="detail-summary-grid">
      ${renderDetailMetric(en ? "Data completeness" : "데이터 완성도", `${modelTrust.score}% · ${modelTrustLabel.text}`, modelTrust.missing.length ? `${en ? "Missing" : "보강 항목"}: ${modelTrust.missing.join(", ")}` : "")}
      ${renderDetailMetric(en ? "Run verdict" : "실행 판정", meta.label)}
      ${renderDetailMetric(
        en ? "Recommended settings" : "권장 설정",
        en
          ? `${estimate.quant.label} · ${formatContext(hardware.context)} · ${hardware.concurrency} concurrent`
          : `${estimate.quant.label} · ${formatContext(hardware.context)} · 동시 ${hardware.concurrency}명`,
      )}
      ${renderDetailMetric(
        en ? "Calculated VRAM" : "계산 VRAM",
        en
          ? `${formatGb(estimate.requiredGb)} / available ${formatGb(estimate.effectiveVram)}`
          : `${formatGb(estimate.requiredGb)} / 가용 ${formatGb(estimate.effectiveVram)}`,
      )}
      ${renderDetailMetric(en ? "VRAM headroom" : "VRAM 여유", formatGb(Math.abs(estimate.effectiveVram - estimate.requiredGb)), en ? (estimate.effectiveVram >= estimate.requiredGb ? "Remaining" : "Shortage") : (estimate.effectiveVram >= estimate.requiredGb ? "남음" : "부족"))}
      ${renderDetailMetric(en ? "Estimated speed" : "추정 속도", formatSpeedRange(estimate, confidence), `${en ? "Confidence" : "신뢰도"} ${confidence.label}`)}
      ${renderDetailMetric(en ? "First response" : "첫 응답", formatDuration(estimate.firstTokenSeconds))}
    </div>
    <section class="detail-section">
      <h3>${en ? "Why this differs from real measurements" : "실제 측정과 차이가 나는 이유"}</h3>
      <p class="detail-note">${en
        ? "The estimated speed is a simple calculation based on bandwidth vs. active parameters, so it can differ from reality. Actual measurements can be off by several times, especially with offloading, a different quantization family (IQ vs. K series), or very long context — use this as a reference only."
        : "추정 속도는 대역폭 대비 활성 파라미터 기준 단순 계산이라 실제와 다를 수 있습니다. 특히 오프로딩이 걸리는 경우, 양자화 방식(IQ 계열 vs K 계열)이 다른 경우, 매우 긴 컨텍스트를 쓰는 경우 실제 측정과 몇 배 차이가 날 수 있으니 참고용으로만 사용하세요."}</p>
    </section>

    <section class="detail-section">
      <h3>${en ? "Why this model" : "추천 이유"}</h3>
      ${renderRecommendationReasonList(recommendationReasons, estimate)}
    </section>

    ${renderEvidenceSection(model, estimate, hardware, confidence)}

    <section class="detail-section">
      <h3>${en ? "Decision rationale" : "판정 근거"}</h3>
      ${renderFitRationale(estimate, hardware)}
      <p class="detail-note">${escapeHtml(estimate.reason)}</p>
    </section>

    ${renderConcurrencySection(model, estimate.quant, hardware)}

    <section class="detail-section">
      <h3>${en ? "Quantization comparison" : "양자화별 비교"}</h3>
      <div class="detail-table quant-table">
        <div class="detail-row detail-table-head">
          <span>${en ? "Quantization" : "양자화"}</span>
          <span>${en ? "Expected VRAM" : "예상 VRAM"}</span>
          <span>${en ? "Expected speed" : "예상 속도"}</span>
          <span>${en ? "Quality" : "품질"}</span>
          <span>${en ? "Run status" : "실행 상태"}</span>
        </div>
        ${renderQuantRows(model, hardware, estimate.quant.id)}
      </div>
    </section>

    <section class="detail-section">
      <h3>${en ? "VRAM breakdown" : "VRAM 상세 분석"}</h3>
      ${renderMemoryMap(
        [
          { key: "weights", label: en ? "Model weights" : "모델 가중치", value: estimate.weightsGb },
          { key: "kv", label: "KV cache", value: estimate.kvGb },
          { key: "runtime", label: en ? "Runtime overhead" : "런타임 오버헤드", value: estimate.runtimeOverheadGb },
          { key: "free", label: en ? "Free" : "여유", value: Math.max(0, hardware.availableVram - estimate.requiredGb) },
        ],
        Math.max(hardware.availableVram, estimate.requiredGb),
      )}
      <div class="memory-breakdown">
        ${renderMemoryLine(en ? "Model weights" : "모델 가중치", estimate.weightsGb, breakdownTotal)}
        ${renderMemoryLine("KV cache", estimate.kvGb, breakdownTotal)}
        ${renderMemoryLine(en ? "Runtime overhead" : "런타임 오버헤드", estimate.runtimeOverheadGb, breakdownTotal)}
      </div>
      <div class="memory-total">
        <span>${en ? "Model required VRAM" : "모델 필요 VRAM"}</span>
        <strong>${formatGb(estimate.requiredGb)}</strong>
      </div>
      ${renderVramBudget(hardware, estimate)}
    </section>

    <section class="detail-section">
      <h3>${en ? "Runtime comparison" : "실행 방식별 비교"}</h3>
      <div class="runtime-grid">
        ${renderRuntimeRows(model, hardware)}
      </div>
    </section>

    <section class="detail-section">
      <h3>${en ? "Run command" : "실행 명령어"}</h3>
      <pre class="command-block"><code>${escapeHtml(buildOllamaCommand(model, estimate.quant, hardware))}
${escapeHtml(buildLlamaCppCommand(model, estimate.quant, hardware))}</code></pre>
    </section>

    ${renderLicenseSection(model)}

    <section class="detail-section">
      <h3>${en ? "Model information" : "모델 정보"}</h3>
      <div class="model-info-grid">
        ${renderInfoItem(en ? "Parameters" : "파라미터", formatParams(model.params))}
        ${renderInfoItem(en ? "Active parameters" : "활성 파라미터", formatParams(model.active))}
        ${renderInfoItem(en ? "Max context" : "최대 컨텍스트", formatContext(estimate.contextLimitTokens))}
        ${renderInfoItem(en ? "License" : "라이선스", `${model.license} · ${licenseCommercialLabel(licensePolicy)}`)}
        ${renderInfoItem(en ? "Release/Gen" : "출시/세대", `${release.label} · ${release.note}`)}
        ${renderInfoItem(en ? "Public benchmark" : "대표 공개 평가", `${benchmark.label} · ${benchmark.note}`)}
        ${renderInfoItem(en ? "Data updated" : "데이터 갱신", DATA_UPDATED_AT)}
        ${renderInfoItem(en ? "Measurement status" : "측정 상태", findBenchmarksForModel(model).length ? (en ? "User/project measurements available" : "사용자/자체 측정값 있음") : (en ? "No user/project measurements" : "사용자/자체 측정값 없음"))}
      </div>
      <div class="external-links">
        ${renderExternalLink("Hugging Face", `https://huggingface.co/models?search=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink("Ollama", `https://ollama.com/search?q=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink(en ? "Search official docs" : "공식 문서 검색", `https://www.google.com/search?q=${encodeURIComponent(`${model.name} official`)}`)}
        ${renderExternalLink(en ? "Report a spec issue" : "스펙 오류 신고", BENCHMARK_META.reportUrl || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose")}
      </div>
    </section>
  `;
}

function renderNonGenerativeDetail(detail, backdrop, model, hardware) {
  detail.hidden = false;
  backdrop.hidden = true;
  detail.innerHTML = `
    <div class="detail-head">
      <button type="button" class="back-button" data-close-detail>상세 닫기</button>
      <button type="button" class="icon-button" data-close-detail aria-label="상세 닫기">×</button>
    </div>
    ${buildNonGenerativeDetailBodyHtml(model, hardware)}
  `;
}

// Shared by the drawer/inspector (renderNonGenerativeDetail) and the
// quick-recommend inline accordion (renderSimpleMode).
function buildNonGenerativeDetailBodyHtml(model, hardware) {
  const estimate = estimateAnyModel(model, hardware);
  const meta = GRADE_META[estimate.grade];
  const confidence = getEstimateConfidence(model, estimate, hardware);
  const release = getModelReleaseInfo(model);
  const benchmark = getBenchmarkSummary(model, estimate, confidence);
  const licensePolicy = getLicensePolicy(model);
  const recommendationReasons = buildRecommendationReasons(estimate);
  const breakdownTotal = Math.max(estimate.requiredGb, 0.1);
  const en = uiLanguage === "en";
  const modelTrust = window.AIHardwareDataTrust?.scoreModel(
    model,
    BENCHMARKS.filter((row) => row.model === model.name || row.modelName === model.name),
  ) || { score: 0, missing: [] };
  const modelTrustLabel = window.AIHardwareDataTrust?.completenessLabel(modelTrust.score, uiLanguage)
    || { level: "low", text: en ? "Needs work" : "보강 필요" };
  const detailKind = en
    ? (model.type === "embedding" ? "Embedding" : model.type === "reranker" ? "Reranker" : ocrTypeLabel(model.type))
    : (model.type === "embedding" ? "임베딩" : model.type === "reranker" ? "리랭커" : ocrTypeLabel(model.type));

  return `
    <div class="detail-title">
      <span class="grade-pill ${meta.className}" title="${escapeAttr(buildGradeTooltip(estimate))}">${meta.label}</span>
      <h2>${escapeHtml(model.name)}</h2>
      <p>${escapeHtml(model.maker)} · ${escapeHtml(model.license)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))} · ${model.tags.map(tagLabel).map(escapeHtml).join(" · ")}</p>
      <p class="detail-description">${escapeHtml(modelSummary(model))}</p>
    </div>

    ${renderShareActions(model)}

    <div class="detail-summary-grid">
      ${renderDetailMetric(en ? "Data completeness" : "데이터 완성도", `${modelTrust.score}% · ${modelTrustLabel.text}`, modelTrust.missing.length ? `${en ? "Missing" : "보강 항목"}: ${modelTrust.missing.join(", ")}` : "")}
      ${renderDetailMetric(en ? "Run verdict" : "실행 판정", meta.label)}
      ${renderDetailMetric(en ? "Recommended settings" : "권장 설정", estimate.settingLabel)}
      ${renderDetailMetric(
        en ? "Calculated VRAM" : "계산 VRAM",
        en
          ? `${formatGb(estimate.requiredGb)} / available ${formatGb(estimate.effectiveVram)}`
          : `${formatGb(estimate.requiredGb)} / 가용 ${formatGb(estimate.effectiveVram)}`,
      )}
      ${renderDetailMetric(en ? "VRAM headroom" : "VRAM 여유", formatGb(Math.abs(estimate.effectiveVram - estimate.requiredGb)), en ? (estimate.effectiveVram >= estimate.requiredGb ? "Remaining" : "Shortage") : (estimate.effectiveVram >= estimate.requiredGb ? "남음" : "부족"))}
      ${renderDetailMetric(en ? "Estimated throughput" : "추정 처리량", formatSpeedRange(estimate, confidence), `${en ? "Confidence" : "신뢰도"} ${confidence.label}`)}
      ${renderDetailMetric(
        en
          ? (model.type === "reranker" ? "Latency per query" : "Processing latency")
          : (model.type === "reranker" ? "질의당 지연" : "처리 지연"),
        formatDuration(estimate.firstTokenSeconds),
      )}
    </div>

    <section class="detail-section">
      <h3>${en ? "Why this model" : "추천 이유"}</h3>
      ${renderRecommendationReasonList(recommendationReasons, estimate)}
    </section>

    ${renderEvidenceSection(model, estimate, hardware, confidence)}

    <section class="detail-section">
      <h3>${en ? "Decision rationale" : "판정 근거"}</h3>
      ${renderFitRationale(estimate, hardware)}
      <p class="detail-note">${escapeHtml(estimate.reason)}</p>
    </section>

    <section class="detail-section">
      <h3>${en ? "Precision comparison" : "정밀도별 비교"}</h3>
      <div class="detail-table">
        <div class="detail-row detail-table-head">
          <span>${en ? "Precision" : "정밀도"}</span>
          <span>Peak VRAM</span>
          <span>${en ? "Expected throughput" : "예상 처리량"}</span>
          <span>${en ? "Quality" : "품질"}</span>
          <span>${en ? "Run status" : "실행 상태"}</span>
        </div>
        ${renderPrecisionRows(model, hardware, estimate.precision.id)}
      </div>
    </section>

    <section class="detail-section">
      <h3>${detailKind} ${en ? "memory analysis" : "메모리 분석"}</h3>
      ${renderMemoryMap(
        buildNonGenerativeMemorySegments(estimate, hardware),
        Math.max(hardware.availableVram, estimate.requiredGb),
      )}
      <div class="memory-breakdown">
        ${renderNonGenerativeMemoryLines(estimate, breakdownTotal)}
      </div>
      <div class="memory-total">
        <span>${en ? "Model required VRAM" : "모델 필요 VRAM"}</span>
        <strong>${formatGb(estimate.requiredGb)}</strong>
      </div>
      ${renderVramBudget(hardware, estimate)}
    </section>

    <section class="detail-section">
      <h3>${en ? (isVisionModel(model) ? "Feature comparison" : "Runtime comparison") : (isVisionModel(model) ? "기능별 비교" : "실행 방식별 비교")}</h3>
      <div class="runtime-grid">
        ${renderNonGenerativeScenarioRows(model, hardware)}
      </div>
    </section>

    <section class="detail-section">
      <h3>${en ? "Method details" : "계산 근거"}</h3>
      <pre class="formula-block"><code>${escapeHtml(buildFormulaText(model.type))}</code></pre>
    </section>

    <section class="detail-section">
      <h3>${en ? "Example command" : "실행 예시"}</h3>
      <pre class="command-block"><code>${escapeHtml(buildNonGenerativeCommand(model, estimate))}</code></pre>
    </section>

    ${renderLicenseSection(model)}

    <section class="detail-section">
      <h3>${en ? "Model information" : "모델 정보"}</h3>
      <div class="model-info-grid">
        ${renderInfoItem(en ? "Parameters" : "파라미터", formatParams(model.params || 0))}
        ${renderInfoItem(
          en ? (isVisionModel(model) ? "Processing type" : "Max input") : (isVisionModel(model) ? "처리 유형" : "최대 입력"),
          isVisionModel(model) ? ocrTypeLabel(model.type) : formatContext(model.maxTokens),
        )}
        ${renderInfoItem(en ? "Architecture" : "구조", model.hiddenSize ? `${model.layers || model.decoderLayers || "-"} layers · hidden ${model.hiddenSize}` : "pipeline")}
        ${renderInfoItem(en ? "License" : "라이선스", `${model.license} · ${licenseCommercialLabel(licensePolicy)}`)}
        ${renderInfoItem(en ? "Release/Gen" : "출시/세대", `${release.label} · ${release.note}`)}
        ${renderInfoItem(en ? "Public benchmark" : "대표 공개 평가", `${benchmark.label} · ${benchmark.note}`)}
        ${renderInfoItem(en ? "Data updated" : "데이터 갱신", DATA_UPDATED_AT)}
        ${renderInfoItem(
          en ? "Measurement status" : "측정 상태",
          findBenchmarksForModel(model).length
            ? (en ? "User/project measurements available" : "사용자/자체 측정값 있음")
            : model.reference?.pagesPerSecond
              ? (en ? "External public reference available" : "외부 공개 참고값 있음")
              : (en ? "No user/project measurements" : "사용자/자체 측정값 없음"),
        )}
      </div>
      <div class="external-links">
        ${model.sourceUrl ? renderExternalLink(en ? "Official/model card" : "공식/모델 카드", model.sourceUrl) : ""}
        ${renderExternalLink(en ? "Search Hugging Face" : "Hugging Face 검색", `https://huggingface.co/models?search=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink(en ? "Report a spec issue" : "스펙 오류 신고", BENCHMARK_META.reportUrl || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose")}
      </div>
    </section>
  `;
}

function renderPrecisionRows(model, hardware, recommendedPrecisionId) {
  const precisionOptions = isVisionModel(model) ? OCR_PRECISIONS : ENCODER_PRECISIONS;
  const supported = precisionOptions.filter((precision) => precision.id !== "auto" && model.precisions.includes(precision.id));
  return supported.map((precision) => {
    const estimate = model.type === "embedding"
      ? estimateEncoderModel(model, hardware, getWorkloadSettings(), precision.id)
      : model.type === "reranker"
        ? estimateRerankerModel(model, hardware, getWorkloadSettings(), precision.id)
        : estimateOcrModel(model, hardware, getWorkloadSettings(), precision.id);
    const meta = GRADE_META[estimate.grade];
    const confidence = getEstimateConfidence(model, estimate, hardware);
    return `
      <div class="detail-row">
        <span>${escapeHtml(precision.label)}</span>
        <span>${formatGb(estimate.requiredGb)}</span>
        <span>${escapeHtml(formatSpeedRange(estimate, confidence))}</span>
        <span>${precisionQualityLabel(precision, recommendedPrecisionId)}</span>
        <span><span class="grade-pill ${meta.className}">${meta.label}</span></span>
      </div>
    `;
  }).join("");
}

function buildNonGenerativeMemorySegments(estimate, hardware) {
  const en = uiLanguage === "en";
  const other = (estimate.activationGb || 0) + (estimate.attentionGb || 0) + (estimate.imageBufferGb || 0) + (estimate.outputGb || 0);
  const segments = [
    {
      key: "weights",
      label: estimate.model.type === "ocr-pipeline" ? (en ? "Resident models/modules" : "상주 모델/모듈") : (en ? "Model weights" : "모델 가중치"),
      value: estimate.weightsGb,
    },
  ];
  if (estimate.kvGb) segments.push({ key: "kv", label: "KV cache", value: estimate.kvGb });
  if (other > 0) segments.push({ key: "other", label: en ? "Other buffers" : "기타 버퍼", value: other });
  segments.push({ key: "runtime", label: en ? "Runtime overhead" : "런타임 오버헤드", value: estimate.runtimeOverheadGb });
  segments.push({ key: "free", label: en ? "Free" : "여유", value: Math.max(0, hardware.availableVram - estimate.requiredGb) });
  return segments;
}

function renderNonGenerativeMemoryLines(estimate, totalWithSafety) {
  const en = uiLanguage === "en";
  const rows = [
    renderMemoryLine(estimate.model.type === "ocr-pipeline" ? (en ? "Resident models/modules" : "상주 모델/모듈") : (en ? "Model weights" : "모델 가중치"), estimate.weightsGb, totalWithSafety),
  ];
  if (estimate.kvGb) rows.push(renderMemoryLine("Decoder KV cache", estimate.kvGb, totalWithSafety));
  if (estimate.activationGb) rows.push(renderMemoryLine(en ? "Activation memory" : "활성화 메모리", estimate.activationGb, totalWithSafety));
  if (estimate.attentionGb) rows.push(renderMemoryLine(en ? "Attention workspace" : "Attention 작업공간", estimate.attentionGb, totalWithSafety));
  if (estimate.imageBufferGb) rows.push(renderMemoryLine(en ? "Image buffer" : "이미지 버퍼", estimate.imageBufferGb, totalWithSafety));
  if (estimate.outputGb) rows.push(renderMemoryLine(en ? "Output/score buffer" : "출력/점수 버퍼", estimate.outputGb, totalWithSafety));
  rows.push(renderMemoryLine(en ? "Runtime overhead" : "런타임 오버헤드", estimate.runtimeOverheadGb, totalWithSafety));
  return rows.join("");
}

function renderNonGenerativeScenarioRows(model, hardware) {
  const workload = getWorkloadSettings();
  if (model.type === "embedding") {
    return ["sentenceTransformers", "tei", "onnx", "pytorch"].map((runtime) => {
      const estimate = estimateEncoderModel(model, hardware, { ...workload, runtime }, workload.precisionId);
      const meta = GRADE_META[estimate.grade];
      const confidence = getEstimateConfidence(model, estimate, hardware);
      return renderRuntimeCard(ENCODER_RUNTIME_PROFILES[runtime].label, formatSpeedRange(estimate, confidence), `${formatGb(estimate.requiredGb)} · ${meta.label}`);
    }).join("");
  }
  if (model.type === "reranker") {
    return ["sentenceTransformers", "tei", "onnx", "pytorch"].map((runtime) => {
      const estimate = estimateRerankerModel(model, hardware, { ...workload, runtime }, workload.precisionId);
      const meta = GRADE_META[estimate.grade];
      const confidence = getEstimateConfidence(model, estimate, hardware);
      return renderRuntimeCard(ENCODER_RUNTIME_PROFILES[runtime].label, formatSpeedRange(estimate, confidence), `${formatGb(estimate.requiredGb)} · ${meta.label}`);
    }).join("");
  }
  return ["text", "layout", "table", "full"].map((featureSet) => {
    const estimate = estimateOcrModel(model, hardware, { ...workload, featureSet }, workload.precisionId);
    const meta = GRADE_META[estimate.grade];
    const confidence = getEstimateConfidence(model, estimate, hardware);
    return renderRuntimeCard(ocrFeatureLabel(featureSet), formatSpeedRange(estimate, confidence), `${formatGb(estimate.requiredGb)} · ${meta.label}`);
  }).join("");
}

function renderRuntimeCard(label, value, note) {
  return `
    <div class="runtime-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </div>
  `;
}

function buildFormulaText(type) {
  if (type === "embedding") {
    return [
      "Embedding encoder estimate",
      "M_required = M_weights + M_activation + M_attention + M_output + M_runtime",
      "M_weights = P * bytes_precision * 1.08",
      "M_activation ~= batch * tokens * hidden * activation_bytes * hidden_factor",
      "FLOPs ~= layers * (24 * batch * tokens * hidden^2 + 4 * batch * tokens^2 * hidden)",
      "t_batch ~= max(FLOPs / (TFLOPS_eff * eta_compute), bytes / (BW * eta_mem)) + fixed_latency",
      "docs/s = batch / t_batch, tokens/s = docs/s * tokens",
    ].join("\n");
  }
  if (type === "reranker") {
    return [
      "Cross-encoder reranker estimate",
      "pair_tokens = query_tokens + document_tokens + special_tokens",
      "M_required = M_weights + M_activation(pair_tokens) + M_attention(pair_tokens) + M_runtime",
      "t_batch follows the same encoder FLOPs model",
      "query_latency ~= ceil(candidate_count / batch_size) * t_batch",
      "pair/s = batch_size / t_batch",
    ].join("\n");
  }
  if (type === "ocr-pipeline") {
    return [
      "Lightweight OCR pipeline estimate",
      "MP = image_width * image_height / 1e6",
      "M_peak ~= M_resident_modules + batch_pages * MP * alpha_model + M_image + M_runtime",
      "M_image = batch_pages * width * height * channels * precision_bytes * buffer_factor / 1e9",
      "Only the largest active stage is counted at peak because detection, recognition, and layout modules usually run sequentially.",
      "pages/s ~= reference_pps * sqrt(BW / BW_ref) * (MP_ref / MP)^0.85 * precision_factor * batch_factor * feature_factor^-1",
    ].join("\n");
  }
  if (type === "document-vlm" || type === "ocr-vlm") {
    return [
      "Document-specialized VLM estimate",
      "T_image ~= min(T_image_max, ceil(width / patch) * ceil(height / patch) / merge^2)",
      "T_total = T_image + T_prompt + T_output",
      "M_required = M_weights + M_vision_activation + M_image + M_decoder_KV + M_runtime",
      "M_decoder_KV = 2 * decoder_layers * batch_pages * T_total * kv_heads * head_dim * precision_bytes / 1e9",
      "seconds/page ~= image_preprocess + vision_encode + prefill(T_image + T_prompt) + decode(T_output) + layout_postprocess",
      "pages/s is calibrated from model-specific reference_pps and then scaled by bandwidth, megapixels, batch, precision, and selected document features.",
    ].join("\n");
  }
  return [
    "General vision-language model estimate",
    "T_image follows the model image strategy: dynamic-resolution, tiling, or compressed visual tokens.",
    "T_total = T_image + T_prompt + previous_conversation_tokens + T_output",
    "M_required = M_text_weights + M_vision_projector + M_vision_activation + M_image + M_decoder_KV + M_runtime",
    "M_decoder_KV = 2 * decoder_layers * batch_pages * T_total * kv_heads * head_dim * precision_bytes / 1e9",
    "For OCR-like document use, pages/s is a practical estimate; open-ended VQA latency can vary with generated token length.",
  ].join("\n");
}

function buildNonGenerativeCommand(model, estimate, batchSizeOverride) {
  const lowerName = model.name.toLowerCase();
  if (model.type === "avatar-generation") {
    if (lowerName.includes("musetalk")) {
      return `git clone https://github.com/TMElyralab/MuseTalk.git
cd MuseTalk
sh inference.sh v1.5 realtime

${uiLanguage === "en" ? "# Prepare the avatar once, then stream TTS audio clips into the realtime worker." : "# 아바타를 한 번 전처리한 뒤 TTS 음성 클립을 실시간 워커에 전달하세요."}`;
    }
    if (lowerName.includes("liveportrait")) {
      return `git clone https://github.com/KlingAIResearch/LivePortrait.git
cd LivePortrait
python inference.py --source ./portrait.jpg --driving ./motion.mp4

${uiLanguage === "en" ? "# Review and replace bundled face-detector weights when their terms do not allow your deployment." : "# 포함된 얼굴 검출 가중치 조건이 배포 목적과 맞지 않으면 검토 후 교체하세요."}`;
    }
    if (lowerName.includes("sadtalker")) {
      return `python inference.py --driven_audio ./speech.wav --source_image ./portrait.jpg --result_dir ./results`;
    }
    return `python inference.py --checkpoint_path ./checkpoints/wav2lip.pth --face ./avatar.mp4 --audio ./speech.wav

${uiLanguage === "en" ? "# The public Wav2Lip model is restricted to non-commercial use." : "# 공개 Wav2Lip 모델은 비상업적 용도로 제한됩니다."}`;
  }
  if (model.type === "audio-stt") {
    return `from transformers import pipeline

transcriber = pipeline(
    "automatic-speech-recognition",
    model="${model.name}",
    device="cuda",
)
result = transcriber("./speech.wav")`;
  }
  if (model.type === "audio-tts") {
    return `${uiLanguage === "en"
      ? `# Start a GPU-backed TTS worker for ${model.name} and stream its audio to the avatar service.`
      : `# ${model.name} GPU TTS 워커를 실행하고 스트리밍 음성을 아바타 서비스에 전달하세요.`}
# Check the model card for the current inference API and license terms.`;
  }
  if (model.type === "embedding") {
    const torchDtype = ["fp16", "bf16", "fp32"].includes(estimate.precision.id)
      ? estimate.precision.id.replace("fp", "float").replace("bf", "bfloat")
      : "float16";
    const batchSize = batchSizeOverride ?? getWorkloadSettings().batchSize ?? PLACEMENT_DEFAULT_WORKLOADS.embedding.batchSize;
    return `from sentence_transformers import SentenceTransformer

model = SentenceTransformer("${model.name}", model_kwargs={"torch_dtype": "${torchDtype}"})
embeddings = model.encode(texts, batch_size=${batchSize}, normalize_embeddings=True)

docker run --gpus all -p 8080:80 \\
  -e MODEL_ID=${model.name} \\
  ghcr.io/huggingface/text-embeddings-inference:cuda-latest`;
  }
  if (model.type === "reranker") {
    return `from FlagEmbedding import FlagReranker

reranker = FlagReranker("${model.name}", use_fp16=${String(estimate.precision.id === "fp16")})
scores = reranker.compute_score([["query", "passage"]], normalize=True)

${uiLanguage === "en" ? "# With TEI, pass candidate documents via the /rerank endpoint." : "# TEI 사용 시 /rerank endpoint로 후보 문서를 전달하세요."}`;
  }
  if (lowerName.includes("paddleocr-vl")) {
    const paddleVersion = lowerName.includes("1.6") ? "v1.6" : "v1";
    return `from paddleocr import PaddleOCRVL

pipeline = PaddleOCRVL(pipeline_version="${paddleVersion}")
output = pipeline.predict("./document.png")
for result in output:
    result.save_to_markdown(save_path="./output")
    result.save_to_json(save_path="./output")`;
  }
  if (lowerName.includes("mineru")) {
    return `vllm serve opendatalab/MinerU2.5-Pro-2604-1.2B

${uiLanguage === "en" ? "# In the PDF-to-Markdown pipeline, pass page images as the model input." : "# PDF to Markdown 파이프라인에서 페이지 이미지를 모델 입력으로 전달하세요."}`;
  }
  if (lowerName.includes("deepseek-ocr")) {
    return `vllm serve deepseek-ai/DeepSeek-OCR-2

${uiLanguage === "en" ? "# Transformers or the SGLang runtime can also be used — see the model card examples." : "# Transformers 또는 SGLang 런타임도 모델 카드 예시를 기준으로 사용할 수 있습니다."}`;
  }
  if (lowerName.includes("deepseek-vl2")) {
    return `git clone https://github.com/deepseek-ai/DeepSeek-VL2
cd DeepSeek-VL2
pip install -e .
CUDA_VISIBLE_DEVICES=0 python inference.py --model_path "${model.name}"

${uiLanguage === "en" ? "# This is a MoE model, so total and activated parameters differ. For larger sizes, plan around A100/H100-class VRAM." : "# MoE 모델이라 total parameter와 activated parameter가 다릅니다. 큰 모델은 A100/H100급 VRAM을 기준으로 보세요."}`;
  }
  if (lowerName.includes("deepseek-vl-7b")) {
    return `from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True).cuda()

${uiLanguage === "en" ? "# A previous-generation DeepSeek-VL comparison model. For a current production candidate, check the DeepSeek-VL2 family first." : "# 이전 세대 DeepSeek-VL 비교군입니다. 최신 운영 후보는 DeepSeek-VL2 계열을 먼저 보세요."}`;
  }
  if (lowerName.includes("qwen2.5-vl") || lowerName.includes("qwen2-vl")) {
    return `pip install qwen-vl-utils[decord]
vllm serve ${model.name}

${uiLanguage === "en" ? "# Usable for images, video, and document OCR-like extraction." : "# 이미지, 비디오, 문서 OCR-like extraction에 사용할 수 있습니다."}`;
  }
  if (lowerName.includes("qwen3-vl")) {
    return `vllm serve ${model.name}

${uiLanguage === "en" ? '# Pass a document image along with a prompt like "Extract this page as Markdown."' : '# 문서 이미지와 "Extract this page as Markdown." 같은 프롬프트를 함께 전달하세요.'}`;
  }
  if (lowerName.includes("llama-3.2") && lowerName.includes("vision")) {
    return `from transformers import MllamaForConditionalGeneration, AutoProcessor

processor = AutoProcessor.from_pretrained("${model.name}")
model = MllamaForConditionalGeneration.from_pretrained("${model.name}", device_map="auto")

${uiLanguage === "en" ? "# Check the Meta license and regional restrictions before deploying." : "# Meta 라이선스와 지역 제한 조건을 배포 전에 확인하세요."}`;
  }
  if (lowerName.includes("pixtral-large")) {
    return `vllm serve ${model.name} \\
  --config-format mistral \\
  --load-format mistral \\
  --tokenizer-mode mistral \\
  --tensor-parallel-size 8 \\
  --limit-mm-per-prompt '{"image": 10}'

${uiLanguage === "en" ? "# Pixtral Large is recommended to run on a vLLM/tensor-parallel server setup." : "# Pixtral Large는 vLLM/tensor parallel 서버 환경을 권장합니다."}`;
  }
  if (lowerName.includes("pixtral")) {
    return `vllm serve ${model.name}

${uiLanguage === "en" ? "# A Pixtral-family comparison model with 128K context and variable-resolution images." : "# 128K context와 가변 해상도 이미지를 쓰는 Pixtral 계열 비교군입니다."}`;
  }
  if (lowerName.includes("llava-onevision")) {
    return `vllm serve ${model.name}

${uiLanguage === "en" ? "# Compare single-image, multi-image, and video scenarios within the same family." : "# 단일 이미지, 다중 이미지, 비디오 시나리오를 같은 계열에서 비교하세요."}`;
  }
  if (lowerName.includes("molmo")) {
    return `from transformers import AutoProcessor, AutoModelForCausalLM

processor = AutoProcessor.from_pretrained("${model.name}", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True, device_map="auto")

${uiLanguage === "en" ? "# A model for comparing image understanding and pointing/grounding." : "# 이미지 이해와 pointing/grounding 비교용 모델입니다."}`;
  }
  if (lowerName.includes("smolvlm2")) {
    return `from transformers import pipeline

pipe = pipeline("image-text-to-text", model="${model.name}", device_map="auto")
result = pipe("./page.png", text="Read the document and summarize key fields.")

${uiLanguage === "en" ? "# Suited for low-VRAM/on-device vision testing." : "# 저VRAM/온디바이스 비전 테스트에 적합합니다."}`;
  }
  if (lowerName.includes("phi-4-multimodal")) {
    return `from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("${model.name}", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True, device_map="auto")

${uiLanguage === "en" ? "# A multimodal model that handles image and audio input together." : "# 이미지와 오디오 입력을 같이 다루는 멀티모달 모델입니다."}`;
  }
  if (lowerName.includes("aya-vision")) {
    return `vllm serve ${model.name}

${uiLanguage === "en" ? "# Use this for testing multilingual image QA and OCR-like extraction." : "# 다국어 이미지 QA와 OCR-like 추출을 테스트할 때 사용하세요."}`;
  }
  if (lowerName.includes("glm-4.1v") || lowerName.includes("glm-4v")) {
    return `from transformers import AutoProcessor, AutoModelForCausalLM

processor = AutoProcessor.from_pretrained("${model.name}", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True, device_map="auto")

${uiLanguage === "en" ? "# A comparison model for multimodal reasoning over documents, video, and GUI-agent tasks." : "# 문서, 비디오, GUI 에이전트 작업의 멀티모달 reasoning 비교군입니다."}`;
  }
  if (lowerName.includes("internvl") || lowerName.includes("kimi-vl") || lowerName.includes("minicpm-v")) {
    return `vllm serve ${model.name}

${uiLanguage === "en" ? "# Frame prompts for image QA, document summarization, and OCR-like extraction." : "# 이미지 질의응답, 문서 요약, OCR-like extraction 용도로 프롬프트를 구성하세요."}`;
  }
  if (lowerName.includes("olmocr")) {
    return `olmocr ./localworkspace --markdown --pdfs ./document.pdf --model allenai/olmOCR-2-7B-1025

${uiLanguage === "en" ? "# A batch pipeline for converting PDFs to Markdown." : "# PDF를 Markdown으로 변환하는 배치 파이프라인 기준입니다."}`;
  }
  if (lowerName.includes("dots.ocr") || lowerName.includes("dots.mocr")) {
    return `from transformers import pipeline

pipe = pipeline("image-text-to-text", model="${model.name}", trust_remote_code=True)
result = pipe(text=[{
    "role": "user",
    "content": [
        {"type": "image", "image": "./page.png"},
        {"type": "text", "text": "Parse this document into Markdown with layout."},
    ],
}])

${uiLanguage === "en" ? "# CLI names can differ by deployment repo — check the model card for the latest example." : "# 배포 저장소별 CLI 이름이 다를 수 있으므로 모델 카드의 최신 예시를 확인하세요."}`;
  }
  if (lowerName.includes("paddle") || lowerName.includes("pp-")) {
    return `paddleocr ocr -i ./document.pdf --device gpu

${uiLanguage === "en" ? "# Run document-structure analysis through the PP-StructureV3 pipeline." : "# 문서 구조 분석은 PP-StructureV3 파이프라인으로 실행하세요."}`;
  }
  if (lowerName.includes("surya")) {
    return `surya_ocr ./document.pdf --images --langs ko,en

${uiLanguage === "en" ? "# For GPU Docker runs, check the Docker options in the official Surya README." : "# GPU Docker 실행 시 Surya 공식 README의 Docker 옵션을 확인하세요."}`;
  }
  return `python got_ocr2_infer.py --image ./page.png --dtype ${estimate.precision.label}`;
}

function renderDetailMetric(label, value, note = "") {
  return `
    <div class="detail-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </div>
  `;
}

function renderRecommendationReasonList(reasons, estimate) {
  const items = reasons.length ? reasons : [estimate.reason];
  return `
    <div class="reason-list">
      ${items.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
    </div>
  `;
}

function renderEvidenceSection(model, estimate, hardware, confidence) {
  const measuredRows = findBenchmarksForModel(model);
  const reference = getReferenceBenchmark(model);
  const qualityBenchmark = model.qualityBenchmark;
  const userMeasurementCount = measuredRows.filter((row) => benchmarkEvidenceType(row) === "user").length;
  const projectMeasurementCount = measuredRows.filter((row) => benchmarkEvidenceType(row) === "project").length;
  const publicReferenceCount = Number(Boolean(qualityBenchmark)) + Number(Boolean(reference));
  const en = uiLanguage === "en";
  const evidenceLabels = [
    publicReferenceCount ? (en ? `${publicReferenceCount} external public reference(s)` : `외부 공개 참고값 ${publicReferenceCount}개`) : "",
    userMeasurementCount ? (en ? `${userMeasurementCount} user measurement(s)` : `사용자 측정 ${userMeasurementCount}개`) : "",
    projectMeasurementCount ? (en ? `${projectMeasurementCount} project measurement(s)` : `자체 측정 ${projectMeasurementCount}개`) : "",
  ].filter(Boolean);
  const evidenceLabel = evidenceLabels.length ? evidenceLabels.join(" · ") : (en ? "No external references or measurements registered" : "등록된 외부 참고·측정값 없음");

  const matchedMetric = getBenchmarkNumericValue(confidence.matchedRow);
  const errorLine = matchedMetric && estimate.speed
    ? renderEstimateErrorLine(
      estimate.speed,
      matchedMetric.value,
      matchedMetric.unit,
      benchmarkEvidenceLabel(confidence.matchedRow),
    )
    : "";

  return `
    <section class="detail-section">
      <h3>${en ? "Estimate and evidence" : "계산값과 근거 구분"}</h3>
      <div class="evidence-grid">
        <div class="evidence-card estimate-card">
          <span>${en ? "Calculated estimate" : "계산 추정"}</span>
          <strong>${formatGb(estimate.requiredGb)} · ${escapeHtml(formatSpeedRange(estimate, confidence))}</strong>
          <small>${en ? "Confidence" : "신뢰도"} ${escapeHtml(confidence.label)} · ${escapeHtml(confidence.reason)}</small>
          <small>${escapeHtml(formatHardwareName(hardware, true))} · ${escapeHtml(buildHardwareBasis(hardware))}</small>
        </div>
        <div class="evidence-card measured-card">
          <span>${en ? "External reference / measurement basis" : "외부 참고·측정 근거"}</span>
          <strong>${escapeHtml(evidenceLabel)}</strong>
          ${renderBenchmarkMiniRows(measuredRows, reference, qualityBenchmark)}
        </div>
      </div>
      ${errorLine}
    </section>
  `;
}

function renderEstimateErrorLine(estimateValue, measuredValue, unit, measurementLabel = (uiLanguage === "en" ? "User measurement" : "사용자 측정")) {
  const errorPct = ((estimateValue - measuredValue) / measuredValue) * 100;
  const sign = errorPct >= 0 ? "+" : "";
  const en = uiLanguage === "en";
  return `
    <div class="estimate-error-line">
      <span>${en ? "Estimated" : "예상"} ${escapeHtml(formatMetricNumber(estimateValue, unit, true))}</span>
      <span>vs ${escapeHtml(measurementLabel)} ${escapeHtml(formatMetricNumber(measuredValue, unit, true))}</span>
      <strong>${en ? "Estimate error" : "추정 오차"} ${sign}${errorPct.toFixed(1)}%</strong>
    </div>
  `;
}

function formatBenchmarkRuntime(row) {
  const tool = String(row.runtimeTool || "").toLowerCase();
  if (tool === "ollama") return "Ollama";
  if (tool === "llamacpp") return "llama.cpp";
  const normalized = normalizeBenchmarkRuntime(row.runtime);
  return RUNTIME_LABELS[normalized] || row.runtime || row.workload || "runtime";
}

function renderBenchmarkMiniRows(rows, reference, qualityBenchmark) {
  const en = uiLanguage === "en";
  const sourceLinkNote = en ? " · Source link available" : " · 출처 링크 있음";
  const entries = rows.slice(0, 3).map((row) => `
    <div>
      <span>${escapeHtml(benchmarkEvidenceLabel(row))} · ${escapeHtml(row.gpu || row.gpuId || (en ? "GPU not stated" : "GPU 미기재"))} · ${escapeHtml(formatBenchmarkRuntime(row))}</span>
      <strong>${escapeHtml(formatBenchmarkMetric(row))}</strong>
      <small>${escapeHtml(row.date || (en ? "Date not stated" : "날짜 미기재"))}${row.sourceUrl ? sourceLinkNote : ""}</small>
    </div>
  `);
  if (qualityBenchmark) {
    entries.push(`
      <div>
        <span>${en ? "External public reference" : "외부 공개 참고값"} · ${escapeHtml(qualityBenchmark.metric || (en ? "Representative public evaluation" : "대표 공개 평가"))} · ${escapeHtml(qualityBenchmark.note || (en ? "Official announcement" : "공식 발표"))}</span>
        <strong>${escapeHtml(qualityBenchmark.label)}</strong>
        <small>${qualityBenchmark.sourceUrl ? (en ? "Source link available · " : "출처 링크 있음 · ") : ""}${en ? "Shown separately from speed measurements" : "속도 측정과 분리 표시"}</small>
      </div>
    `);
  }
  if (reference) {
    entries.push(`
      <div>
        <span>${en ? "External public reference" : "외부 공개 참고값"} · ${escapeHtml(reference.gpu)} · ${escapeHtml(reference.setting)}</span>
        <strong>${escapeHtml(reference.metric)}</strong>
        <small>${en ? "Shown separately from user/project measurements" : "사용자/자체 측정과 분리 표시"}</small>
      </div>
    `);
  }
  if (entries.length) {
    return `<div class="benchmark-mini-table">${entries.join("")}</div>`;
  }

  return `
    <small>${en
      ? "No external public reference or user/project measurement exists for this model yet. Detail figures are shown as calculated estimates only."
      : "이 모델의 외부 공개 참고값과 사용자/자체 측정값은 아직 없습니다. 상세 수치는 계산 추정으로만 표시합니다."}</small>
    ${BENCHMARK_META.reportingPaused
      ? `<small>${escapeHtml(BENCHMARK_META.reportingStatus || (en ? "New benchmark submissions temporarily paused" : "신규 벤치마크 제보 일시 중단"))}</small>`
      : `<div class="external-links evidence-links">${renderExternalLink(en ? "Report a benchmark" : "벤치마크 제보", BENCHMARK_META.reportUrl || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose")}</div>`}
  `;
}

function renderFitRationale(estimate, hardware) {
  const meta = GRADE_META[estimate.grade];
  const margin = estimate.effectiveVram - estimate.requiredGb;
  const marginLabel = uiLanguage === "en"
    ? (margin >= 0 ? "Remaining VRAM" : "VRAM shortfall")
    : (margin >= 0 ? "남는 VRAM" : "부족 VRAM");
  return `
    <div class="fit-rationale-grid">
      ${renderInfoItem(uiLanguage === "en" ? "Verdict" : "판정", meta.label)}
      ${renderInfoItem(uiLanguage === "en" ? "Required VRAM" : "필요 VRAM", formatGb(estimate.requiredGb))}
      ${renderInfoItem(uiLanguage === "en" ? "Available VRAM" : "가용 VRAM", formatGb(estimate.effectiveVram))}
      ${renderInfoItem(marginLabel, formatGb(Math.abs(margin)))}
      ${renderInfoItem(uiLanguage === "en" ? "Utilization" : "사용률", formatPercent(estimate.pressure))}
      ${renderInfoItem(uiLanguage === "en" ? "Calculation conditions" : "계산 조건", buildHardwareBasis(hardware))}
    </div>
  `;
}

function renderQuantRows(model, hardware, recommendedQuantId) {
  return QUANTS
    .filter((quant) => quant.id !== "auto")
    .map((quant) => {
      const estimate = estimateModel(model, quant.id, hardware);
      const meta = GRADE_META[estimate.grade];
      const confidence = getEstimateConfidence(model, estimate, hardware);
      return `
        <div class="detail-row">
          <span>${escapeHtml(quant.label)}</span>
          <span>${formatGb(estimate.requiredGb)}</span>
          <span>${escapeHtml(formatSpeedRange(estimate, confidence))}</span>
          <span>${quantQualityLabel(quant, recommendedQuantId)}</span>
          <span><span class="grade-pill ${meta.className}">${meta.label}</span></span>
        </div>
      `;
    })
    .join("");
}

function quantQualityLabel(quant, recommendedQuantId) {
  if (quant.id === recommendedQuantId) return uiLanguage === "en" ? "Recommended" : "권장";
  if (quant.id === "fp16") return uiLanguage === "en" ? "Original" : "원본";
  if (quant.rank >= 6) return uiLanguage === "en" ? "Excellent" : "우수";
  if (quant.rank >= 5) return uiLanguage === "en" ? "Very high" : "매우 높음";
  if (quant.rank >= 4) return uiLanguage === "en" ? "High" : "높음";
  if (quant.rank >= 3) return uiLanguage === "en" ? "Medium" : "보통";
  return uiLanguage === "en" ? "Low" : "낮음";
}

const PRECISION_QUALITY_LABEL_EN = { "자동": "Auto", "원본": "Original", "권장": "Recommended", "경량": "Light", "초경량": "Ultra-light" };

function precisionQualityLabel(precision, recommendedPrecisionId) {
  if (precision.id === recommendedPrecisionId) return uiLanguage === "en" ? "Recommended" : "권장";
  if (uiLanguage === "en") return PRECISION_QUALITY_LABEL_EN[precision.quality] || precision.quality || "Comparison";
  return precision.quality || "비교";
}

function getPrecisionLabel(precisionId, precisionOptions) {
  return precisionOptions.find((precision) => precision.id === precisionId)?.label || "자동 추천";
}

function renderMemoryMap(segments, capacity) {
  const safeCapacity = Math.max(0.1, capacity);
  const bar = segments
    .map((segment) => {
      const width = Math.max(0, Math.min(100, (segment.value / safeCapacity) * 100));
      if (width <= 0) return "";
      return `<span class="memmap-seg memmap-${segment.key}" style="width:${width}%"></span>`;
    })
    .join("");
  const legend = segments
    .map(
      (segment) => `
        <div class="memmap-legend-item">
          <span class="memmap-swatch memmap-${segment.key}"></span>
          <span>${escapeHtml(segment.label)}</span>
          <strong class="num">${formatGb(segment.value)}</strong>
        </div>
      `,
    )
    .join("");
  return `
    <div class="memory-map">
      <div class="memmap-title">${uiLanguage === "en" ? `VRAM memory map · total ${formatGb(safeCapacity)}` : `VRAM 메모리 맵 · 총 ${formatGb(safeCapacity)}`}</div>
      <div class="memmap-bar">${bar}</div>
      <div class="memmap-legend">${legend}</div>
    </div>
  `;
}

function renderMemoryLine(label, value, total) {
  const safeTotal = Math.max(0.1, total, value);
  const width = Math.max(3, Math.min(100, (value / safeTotal) * 100));
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

function renderVramBudget(hardware, estimate) {
  const en = uiLanguage === "en";
  const remainder = hardware.availableVram - estimate.requiredGb;
  const deltaLabel = en
    ? (remainder >= 0 ? "Remaining after run" : "Shortfall vs. available")
    : (remainder >= 0 ? "실행 후 잔여" : "가용 대비 부족");
  const deltaValue = Math.abs(remainder);
  const gpuPoolLabel = en
    ? (hardware.heterogeneous
      ? `Heterogeneous parallel applied (${Math.round(hardware.shardingEfficiency * 100)}%)`
      : hardware.count > 1
        ? `Parallel-adjusted VRAM (${Math.round(hardware.shardingEfficiency * 100)}%)`
        : "Calculation-basis VRAM")
    : (hardware.heterogeneous
      ? `이기종 병렬 반영 (${Math.round(hardware.shardingEfficiency * 100)}%)`
      : hardware.count > 1
        ? `병렬 반영 VRAM (${Math.round(hardware.shardingEfficiency * 100)}%)`
        : "계산 기준 VRAM");
  return `
    <div class="vram-budget-grid">
      ${renderInfoItem(en ? "Total GPU VRAM" : "총 GPU VRAM", formatGb(hardware.totalVram))}
      ${renderInfoItem(gpuPoolLabel, formatGb(hardware.baseEffectiveVram))}
      ${renderInfoItem(en ? "Reserved for other work" : "다른 작업 예약", formatGb(hardware.reservedVram))}
      ${renderInfoItem(en ? "Safety margin" : "안전 여유분", formatGb(hardware.safetyMarginGb))}
      ${renderInfoItem(en ? "Model available VRAM" : "모델 가용 VRAM", formatGb(hardware.availableVram))}
      ${renderInfoItem(deltaLabel, formatGb(deltaValue))}
      ${hardware.crossVendor ? renderInfoItem(en ? "Runtime compatibility" : "런타임 호환성", en ? "Check mixed-GPU-vendor support" : "GPU 제조사 혼용 지원 확인 필요") : ""}
    </div>
  `;
}

function renderRuntimeRows(model, hardware) {
  const en = uiLanguage === "en";
  const selectedQuant = $("quantization").value;
  const scenarios = [
    { label: "llama.cpp / Ollama", hardware: { ...hardware, runtime: "llamacpp" } },
    { label: en ? "vLLM single request" : "vLLM 단일 요청", hardware: { ...hardware, runtime: "vllm", concurrency: 1 } },
    { label: en ? `vLLM ${pluralize(hardware.concurrency, "concurrent request", "concurrent requests")}` : `vLLM 동시 요청 ${hardware.concurrency}명`, hardware: { ...hardware, runtime: "vllm" } },
    { label: "Transformers", hardware: { ...hardware, runtime: "transformers" } },
  ];

  return scenarios.map((scenario) => {
    const estimate = estimateModel(model, selectedQuant, scenario.hardware);
    const meta = GRADE_META[estimate.grade];
    const confidence = getEstimateConfidence(model, estimate, scenario.hardware);
    return `
      <div class="runtime-card">
        <span>${escapeHtml(scenario.label)}</span>
        <strong>${escapeHtml(formatSpeedRange(estimate, confidence))}</strong>
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

function renderLicenseSection(model) {
  const policy = getLicensePolicy(model);
  const sourceUrl = model.hfImported ? model.sourceUrl : policy.sourceUrl || model.sourceUrl || "";
  const en = uiLanguage === "en";
  const disclaimer = en
    ? "A brief reference summary, not legal advice. Check the checkpoint's latest LICENSE and usage policy yourself before commercial deployment."
    : (LICENSE_META.disclaimer || "참고용 요약입니다. 실제 배포 전 최신 원문 약관을 확인하세요.");
  return `
    <section class="detail-section license-section">
      <h3>${en ? "License and commercial use" : "라이선스 및 상업 이용"}</h3>
      <div class="license-summary-card">
        <div class="license-badges">
          <span class="license-badge license-${escapeAttr(policy.commercialUse)}">${escapeHtml(licenseCommercialLabel(policy))}</span>
          <span class="license-badge license-openness">${escapeHtml(licenseOpennessLabel(policy))}</span>
        </div>
        <strong>${escapeHtml(model.license)}</strong>
        <p>${escapeHtml(licenseSummary(policy))}</p>
        <small>${escapeHtml(disclaimer)}</small>
        ${sourceUrl ? `<div class="external-links">${renderExternalLink(en ? "View license" : "라이선스 원문 확인", sourceUrl)}</div>` : ""}
      </div>
    </section>
  `;
}

function renderExternalLink(label, href) {
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function estimateBenchmarkRow(model, row, preset) {
  const baseHardware = getHardware();
  const gpu = { preset, count: 1, capacityGb: preset.vram * 0.92 };
  const hardware = buildGpuPlacementHardware(baseHardware, gpu, gpu.capacityGb);
  hardware.context = Number(row.context) || baseHardware.context;
  hardware.concurrency = Number(row.concurrency) || 1;
  hardware.outputTokens = Number(row.outputTokens) || baseHardware.outputTokens;
  hardware.runtime = row.runtime === "llama.cpp" ? "llamacpp" : (row.runtime || baseHardware.runtime);

  if (!model.type || model.type === "generative") {
    const quant = QUANTS.find((q) => q.label === row.quantization || q.id === row.quantization);
    if (!quant) return null;
    return normalizeGenerativeEstimate(estimateModel(model, quant.id, hardware));
  }
  if (model.type === "embedding") return estimateEncoderModel(model, hardware, PLACEMENT_DEFAULT_WORKLOADS.embedding);
  if (model.type === "reranker") return estimateRerankerModel(model, hardware, PLACEMENT_DEFAULT_WORKLOADS.reranker);
  if (isVisionModel(model)) return estimateOcrModel(model, hardware, PLACEMENT_DEFAULT_WORKLOADS.vision);
  return null;
}

// 사용자/자체 측정 행마다 같은 조건으로 추정치를 다시 계산해 |오차|를 모으고 평균을 냅니다.
// 외부 공개 참고값은 측정 오차 보정에 사용하지 않습니다.
function computeBenchmarkErrorStats() {
  const samples = [];
  for (const row of BENCHMARKS) {
    if (benchmarkEvidenceType(row) === "external") continue;
    const metric = getBenchmarkNumericValue(row);
    if (!metric || !row.gpuId) continue;
    const model = (row.modelKey && getModelByKey(row.modelKey)) || getAllModels().find((item) => item.name === row.modelName);
    if (!model) continue;
    if (!hasCompleteCalibrationConditions(row, model)) continue;
    const preset = GPU_PRESETS.find((item) => item.id === row.gpuId);
    if (!preset) continue;
    const estimate = estimateBenchmarkRow(model, row, preset);
    if (!estimate || !estimate.speed) continue;
    samples.push({ errorPct: ((estimate.speed - metric.value) / metric.value) * 100, gpuId: row.gpuId });
  }
  if (!samples.length) return null;
  const avgAbsErrorPct = samples.reduce((sum, sample) => sum + Math.abs(sample.errorPct), 0) / samples.length;
  return {
    avgAbsErrorPct,
    sampleCount: samples.length,
    gpuCoverage: new Set(samples.map((sample) => sample.gpuId)).size,
  };
}

function benchmarkMetricFamily(row) {
  if (row.tokensPerSecond) return "tok/s";
  if (row.docsPerSecond) return "doc/s";
  if (row.pairsPerSecond) return "pair/s";
  if (row.pagesPerSecond) return "page/s";
  if (typeof row.qualityValue === "number" && row.metric) {
    const stripped = String(row.metric).replace(/\s+[\d.]+%?$/, "").trim();
    return stripped || row.metric;
  }
  return null;
}

function benchmarkMetricValue(row) {
  if (row.tokensPerSecond) return row.tokensPerSecond;
  if (row.docsPerSecond) return row.docsPerSecond;
  if (row.pairsPerSecond) return row.pairsPerSecond;
  if (row.pagesPerSecond) return row.pagesPerSecond;
  if (typeof row.qualityValue === "number") return row.qualityValue;
  return null;
}

function benchmarkWorkspaceReady() {
  return Boolean(window.AIHardwareBenchmark);
}

function renderBenchmarkDashboard() {
  if (benchmarkWorkspaceReady()) window.AIHardwareBenchmark.renderDashboard();
}

function renderBenchmarkSheet() {
  if (benchmarkWorkspaceReady()) window.AIHardwareBenchmark.renderSheet();
}

function selectBenchmarkMetricFamily(family) {
  if (benchmarkWorkspaceReady()) {
    window.AIHardwareBenchmark.selectMetricFamily(family);
    return;
  }
  window.loadBenchmarkWorkspace?.().then(() => window.AIHardwareBenchmark?.selectMetricFamily(family));
}
function restoreDialogFocus(target) {
  window.requestAnimationFrame?.(() => {
    if (target?.isConnected) {
      target.focus();
      return;
    }
    const modelKeyValue = target?.dataset?.modelKey;
    const replacement = modelKeyValue
      ? [...document.querySelectorAll("[data-model-key]")].find((node) => node.dataset.modelKey === modelKeyValue)
      : document.querySelector("[data-open-compare]");
    replacement?.focus();
  });
}

function closeModelDetail() {
  selectedModelKey = "";
  render();
  const target = dialogReturnFocus;
  dialogReturnFocus = null;
  restoreDialogFocus(target);
}

function toggleCompareModel(key) {
  const index = compareKeys.indexOf(key);
  if (index >= 0) {
    compareKeys.splice(index, 1);
  } else {
    if (compareKeys.length >= MAX_COMPARE_MODELS) return;
    compareKeys.push(key);
  }
  if (compareKeys.length < 2) compareModalOpen = false;
  render();
}

function closeCompareModal() {
  compareModalOpen = false;
  render();
  const target = dialogReturnFocus;
  dialogReturnFocus = null;
  restoreDialogFocus(target);
}

function renderViewToggle() {
  const isList = viewMode === "list";
  $("listViewButton").classList.toggle("is-active", isList);
  $("cardViewButton").classList.toggle("is-active", !isList);
  $("listViewButton").setAttribute("aria-pressed", String(isList));
  $("cardViewButton").setAttribute("aria-pressed", String(!isList));
}

function renderTags(model, limit) {
  const tags = model.tags || [];
  const visible = tags.slice(0, limit);
  const hiddenCount = Math.max(0, tags.length - visible.length);
  return [
    ...visible.map((tag) => `<span class="tag">${escapeHtml(tagLabel(tag))}</span>`),
    hiddenCount ? `<span class="tag tag-more">+${hiddenCount}</span>` : "",
  ].join("");
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
    embedding: "임베딩",
    reranker: "리랭커",
    retrieval: "RAG/검색",
    sparse: "Sparse",
    dense: "Dense",
    multilingual: "다국어",
    matryoshka: "차원 축소",
    ocr: "OCR",
    document: "문서",
    layout: "레이아웃",
    table: "표",
    math: "수식",
    handwriting: "필기",
    documentVlm: "문서 VLM",
    generalVlm: "범용 VLM",
    "document-vlm": "문서 VLM",
    "general-vlm": "범용 VLM",
    vlm: "VLM",
    pdf: "PDF",
    markdown: "Markdown",
    chart: "차트",
    video: "비디오",
    grounding: "Grounding",
    audio: "오디오",
    gui: "GUI",
    seal: "인장",
    spotting: "영역 인식",
    coordinate: "좌표",
    screen: "화면",
    mobile: "온디바이스",
    agent: "에이전트",
    legacy: "비교군",
    classification: "분류",
    clustering: "클러스터링",
    matching: "문장 매칭",
    codeRetrieval: "코드 검색",
  };
  if (uiLanguage === "en") {
    const englishLabels = {
      general: "General", korean: "Korean", coding: "Coding", reasoning: "Reasoning", long: "Long context",
      edge: "Lightweight", vision: "Vision", embedding: "Embedding", reranker: "Reranker", retrieval: "RAG/Search",
      sparse: "Sparse", dense: "Dense", multilingual: "Multilingual", matryoshka: "Dimension reduction", ocr: "OCR",
      document: "Document", layout: "Layout", table: "Table", math: "Formula", handwriting: "Handwriting",
      documentVlm: "Document VLM", generalVlm: "General VLM", "document-vlm": "Document VLM", "general-vlm": "General VLM",
      vlm: "VLM", pdf: "PDF", markdown: "Markdown", chart: "Chart", video: "Video", grounding: "Grounding",
      audio: "Audio", gui: "GUI", seal: "Seal", spotting: "Region detection", coordinate: "Coordinates", screen: "Screen",
      mobile: "On-device", agent: "Agent", legacy: "Baseline", classification: "Classification", clustering: "Clustering",
      matching: "Sentence matching", codeRetrieval: "Code retrieval",
    };
    return englishLabels[tag] || tag;
  }
  return labels[tag] || tag;
}

function modelKey(model) {
  const slug = String(model.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return model.type && model.type !== "generative" ? `${model.type}-${slug}` : slug;
}

function getModelByKey(key) {
  return getAllModels().find((model) => modelKey(model) === key)
    || GENERATIVE_MODELS.find((model) => modelKey(model) === key)
    || null;
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
  if (value < 0.001) return `${Math.round(value * 1_000_000)}K`;
  if (value < 1) return `${Math.round(value * 1000)}M`;
  return `${value.toFixed(value >= 10 ? 0 : 1)}B`;
}

function formatSpeed(value) {
  if (!value) return uiLanguage === "en" ? "N/A" : "불가";
  if (value < 1) return `${value.toFixed(1)} tok/s`;
  return `${Math.round(value)} tok/s`;
}

function formatThroughput(value, unit) {
  if (!value) return uiLanguage === "en" ? "N/A" : "불가";
  if (value >= 1000) return `${Math.round(value).toLocaleString("ko-KR")} ${unit}`;
  if (value >= 10) return `${Math.round(value)} ${unit}`;
  return `${value.toFixed(1)} ${unit}`;
}

function formatMegapixels(value) {
  return `${value.toFixed(value >= 10 ? 0 : 1)} MP`;
}

function formatDuration(seconds) {
  const en = uiLanguage === "en";
  if (!seconds) return en ? "N/A" : "불가";
  if (seconds < 1) return en ? `${seconds.toFixed(1)}s` : `${seconds.toFixed(1)}초`;
  if (seconds < 60) return en ? `${seconds.toFixed(seconds < 10 ? 1 : 0)}s` : `${seconds.toFixed(seconds < 10 ? 1 : 0)}초`;
  return en
    ? `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
    : `${Math.floor(seconds / 60)}분 ${Math.round(seconds % 60)}초`;
}

function ocrFeatureLabel(value) {
  const labels = {
    text: "텍스트 OCR",
    layout: "레이아웃 포함",
    table: "표/수식 포함",
    full: "문서 파싱 전체",
  };
  return labels[value] || value;
}

function ocrTypeLabel(value) {
  const en = uiLanguage === "en";
  if (value === "document-vlm" || value === "ocr-vlm") return en ? "Document-specialized VLM" : "문서 특화 VLM";
  if (value === "general-vlm") return en ? "General VLM" : "범용 VLM";
  if (value === "avatar-generation") return en ? "Avatar · lip sync" : "아바타·립싱크";
  return en ? "OCR pipeline" : "OCR 파이프라인";
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

  const existingParams = new URLSearchParams(window.location.search);
  const params = new URLSearchParams();
  params.set("ui", appMode);
  params.set("lang", uiLanguage);
  params.set("mode", coreTaskMode === "placement" ? "placement" : coreTaskMode === "modelFinder" ? "modelFinder" : coreTaskMode === "infra" ? "infra" : activeWorkload);
  if (coreTaskMode === "placement") params.set("workload", activeWorkload);
  const hardware = getHardware();
  if (hasPrimaryGpuSelection) {
    params.set("gpu", $("gpuPreset").value);
    params.set("vram", String(hardware.vram));
    params.set("ram", String(hardware.ram));
    params.set("count", String(hardware.primaryCount));
    params.set("gpu2", hardware.secondaryPreset?.id || "none");
    params.set("count2", String(hardware.secondaryCount || 1));
    params.set("bandwidth", String(hardware.bandwidth));
    params.set("reserved", String(hardware.reservedVram));
    params.set("margin", String(hardware.safetyMarginGb));
    params.set("power", String(hardware.powerLimitW));
  }
  params.set("ctx", String(hardware.context));
  params.set("con", String(hardware.concurrency));
  params.set("out", String(hardware.outputTokens));
  params.set("kv", hardware.kvPrecision);
  params.set("runtime", hardware.runtime);
  params.set("quant", $("quantization").value);
  params.set("embTokens", $("embeddingInputTokens").value);
  params.set("embBatch", $("embeddingBatchSize").value);
  params.set("embPrecision", $("encoderPrecision").value);
  params.set("embRuntime", $("encoderRuntime").value);
  params.set("embBatchTokens", $("embeddingBatchTokens").value);
  params.set("rerankQuery", $("rerankerQueryTokens").value);
  params.set("rerankDoc", $("rerankerDocTokens").value);
  params.set("rerankCandidates", $("rerankerCandidates").value);
  params.set("rerankBatch", $("rerankerBatchSize").value);
  params.set("rerankPrecision", $("rerankerPrecision").value);
  params.set("rerankRuntime", $("rerankerRuntime").value);
  params.set("ocrPreset", $("ocrResolutionPreset").value);
  params.set("ocrWidth", $("ocrWidth").value);
  params.set("ocrHeight", $("ocrHeight").value);
  params.set("ocrBatch", $("ocrBatchSize").value);
  params.set("ocrPrecision", $("ocrPrecision").value);
  params.set("ocrFeature", $("ocrFeatureSet").value);
  params.set("mediaSteps", $("mediaSteps").value);
  params.set("mediaFrames", $("mediaFrames").value);
  params.set("mediaFps", $("mediaFps").value);
  params.set("mediaLora", $("mediaLoraCount").value);
  params.set("mediaOffload", $("mediaOffload").value);
  if ($("mediaOptimization")) params.set("mediaOptimization", $("mediaOptimization").value);
  if ($("advisorModel")) params.set("advisorModel", $("advisorModel").value);
  if ($("advisorModelCategory")) params.set("advisorCategory", $("advisorModelCategory").value);
  if ($("advisorModelSearch")?.value) params.set("advisorSearch", $("advisorModelSearch").value);
  if ($("advisorBudgetUsd")) params.set("budget", $("advisorBudgetUsd").value);
  if ($("advisorCurrentPriceUsd")) params.set("currentPrice", $("advisorCurrentPriceUsd").value);
  if ($("advisorElectricityRate")) params.set("electricity", $("advisorElectricityRate").value);
  if ($("advisorHoursMonth")) params.set("hours", $("advisorHoursMonth").value);
  if ($("advisorVendor")) params.set("advisorVendor", $("advisorVendor").value);
  if ($("advisorFormFactor")) params.set("advisorForm", $("advisorFormFactor").value);
  if ($("compareGpuA")?.value) params.set("compareA", $("compareGpuA").value);
  if ($("compareGpuB")?.value) params.set("compareB", $("compareGpuB").value);
  if ($("compareGpuC")?.value) params.set("compareC", $("compareGpuC").value);
  params.set("task", $("taskFilter").value);
  params.set("provider", $("providerFilter").value);
  params.set("license", $("licenseFilter").value);
  params.set("licenseUse", $("licenseUseFilter").value);
  params.set("grade", $("gradeFilter").value);
  params.set("fit", activeSummaryFilter);
  params.set("sort", $("sortBy").value);
  params.set("view", viewMode);
  params.set("purpose", $("simplePurpose").value);
  params.set("priority", $("simplePriority").value);
  if (selectedModelKey) params.set("model", selectedModelKey);
  else if (appMode === "simple" && simpleExpandedKey) params.set("model", simpleExpandedKey);
  if (placementSelectedKeys.size) {
    params.set("pgUsage", placementUsageMode);
    params.set("pgStrategy", placementStrategy);
    if (placementTargetN != null) params.set("pgTarget", String(placementTargetN));
    params.set("pgHeadroom", String(placementMinHeadroomPct));
    params.set("pgQuant", placementAllowQuantChange ? "1" : "0");
    params.set("pgContext", placementAllowContextReduction ? "1" : "0");
    params.set("pgReplicas", placementAllowReplication ? "1" : "0");
    if (placementPrimaryKey) params.set("pgPrimary", placementPrimaryKey);
    params.set("pgGpus", JSON.stringify(gpuInventoryRows.map((row) => ({ presetId: row.presetId, count: row.count }))));
    params.set("pgModels", JSON.stringify([...placementSelectedKeys]));
    params.set("pgConfig", JSON.stringify([...placementSelectedKeys].map((key) => [key, getPlacementModelConfig(key)])));
  }
  ["hub", "detail", "build", "studio", "studioState", "scenario", "users"].forEach((key) => {
    if (existingParams.get(key)) params.set(key, existingParams.get(key));
  });

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("mode");
  coreTaskMode = modeParam === "placement" || params.has("pgModels") ? "placement" : modeParam === "modelFinder" ? "modelFinder" : modeParam === "infra" ? "infra" : "finder";
  const uiParam = params.get("ui");
  appMode = uiParam === "expert" || uiParam === "simple"
    ? uiParam
    : params.get("model")
      ? "expert"
      : "simple";

  const requestedWorkload = modeParam === "placement" ? params.get("workload") : modeParam;
  const mode = WORKLOAD_ALIASES[requestedWorkload] || requestedWorkload;
  if (WORKLOAD_META[mode]) activeWorkload = mode;
  refreshWorkloadUi();
  refreshFilterOptions();

  const gpuId = params.get("gpu");
  const restoredFromUrl = gpuId ? selectPrimaryGpu(gpuId) : false;
  if (!restoredFromUrl) {
    const storedGpuId = getStoredPrimaryGpuId();
    if (storedGpuId) selectPrimaryGpu(storedGpuId);
  }

  if (hasPrimaryGpuSelection) {
    setValueIfPresent("vramGb", params.get("vram"));
    setValueIfPresent("ramGb", params.get("ram"));
    setValueIfPresent("gpuCount", params.get("count"));
    setSelectIfValid("secondaryGpuPreset", params.get("gpu2"));
    setValueIfPresent("secondaryGpuCount", params.get("count2"));
    setValueIfPresent("bandwidth", params.get("bandwidth"));
    setValueIfPresent("reservedVramGb", params.get("reserved"));
    setValueIfPresent("safetyMarginGb", params.get("margin"));
    setValueIfPresent("powerLimitW", params.get("power"));
  }
  refreshSecondaryGpuUi();
  setValueIfPresent("contextSize", params.get("ctx"));
  setValueIfPresent("concurrency", params.get("con"));
  setValueIfPresent("outputTokens", params.get("out"));
  setSelectIfValid("kvPrecision", params.get("kv"));
  setSelectIfValid("runtimeMode", params.get("runtime"));
  setSelectIfValid("quantization", params.get("quant"));
  setValueIfPresent("embeddingInputTokens", params.get("embTokens"));
  setValueIfPresent("embeddingBatchSize", params.get("embBatch"));
  setSelectIfValid("encoderPrecision", params.get("embPrecision"));
  setSelectIfValid("encoderRuntime", params.get("embRuntime"));
  setValueIfPresent("embeddingBatchTokens", params.get("embBatchTokens"));
  setValueIfPresent("rerankerQueryTokens", params.get("rerankQuery"));
  setValueIfPresent("rerankerDocTokens", params.get("rerankDoc"));
  setValueIfPresent("rerankerCandidates", params.get("rerankCandidates"));
  setValueIfPresent("rerankerBatchSize", params.get("rerankBatch"));
  setSelectIfValid("rerankerPrecision", params.get("rerankPrecision"));
  setSelectIfValid("rerankerRuntime", params.get("rerankRuntime"));
  setSelectIfValid("ocrResolutionPreset", params.get("ocrPreset"));
  setValueIfPresent("ocrWidth", params.get("ocrWidth"));
  setValueIfPresent("ocrHeight", params.get("ocrHeight"));
  setValueIfPresent("ocrBatchSize", params.get("ocrBatch"));
  setSelectIfValid("ocrPrecision", params.get("ocrPrecision"));
  setSelectIfValid("ocrFeatureSet", params.get("ocrFeature"));
  setValueIfPresent("mediaSteps", params.get("mediaSteps"));
  setValueIfPresent("mediaFrames", params.get("mediaFrames"));
  setValueIfPresent("mediaFps", params.get("mediaFps"));
  setValueIfPresent("mediaLoraCount", params.get("mediaLora"));
  setSelectIfValid("mediaOffload", params.get("mediaOffload"));
  setSelectIfValid("mediaOptimization", params.get("mediaOptimization"));
  setSelectIfValid("advisorModelCategory", params.get("advisorCategory"));
  setValueIfPresent("advisorModelSearch", params.get("advisorSearch"));
  refreshAdvisorModelOptions(params.get("advisorModel"));
  setValueIfPresent("advisorBudgetUsd", params.get("budget"));
  setValueIfPresent("advisorCurrentPriceUsd", params.get("currentPrice"));
  setValueIfPresent("advisorElectricityRate", params.get("electricity"));
  setValueIfPresent("advisorHoursMonth", params.get("hours"));
  setSelectIfValid("advisorVendor", params.get("advisorVendor"));
  setSelectIfValid("advisorFormFactor", params.get("advisorForm"));
  setSelectIfValid("compareGpuA", params.get("compareA"));
  setSelectIfValid("compareGpuB", params.get("compareB"));
  setSelectIfValid("compareGpuC", params.get("compareC"));
  setSelectIfValid("taskFilter", params.get("task"));
  setSelectIfValid("providerFilter", params.get("provider"));
  setSelectIfValid("licenseFilter", params.get("license"));
  setSelectIfValid("licenseUseFilter", params.get("licenseUse"));
  setSelectIfValid("gradeFilter", params.get("grade"));
  const sortParam = params.get("sort") === "vramAsc" ? "vramHeadroom" : params.get("sort");
  setSelectIfValid("sortBy", sortParam);

  const fit = params.get("fit");
  if (SUMMARY_FILTERS.some((item) => item.id === fit)) activeSummaryFilter = fit;

  const nextView = params.get("view");
  viewMode = nextView === "card" ? "card" : "list";
  setSelectIfValid("simplePurpose", params.get("purpose"));
  setSelectIfValid("simplePriority", params.get("priority"));
  restorePlacementUrlState(params);
  placementBuilderStarted = placementSelectedKeys.size > 0;

  syncPresetControls();

  const model = params.get("model");
  const validModelKey = hasPrimaryGpuSelection && model && getModelByKey(model) ? model : "";
  if (appMode === "simple") {
    simpleExpandedKey = validModelKey;
    selectedModelKey = "";
  } else {
    selectedModelKey = validModelKey;
    simpleExpandedKey = "";
  }
}

function restorePlacementUrlState(params) {
  const modelPayload = params.get("pgModels");
  if (!modelPayload) return;
  try {
    const models = JSON.parse(modelPayload);
    const validKeys = Array.isArray(models)
      ? models.filter((key) => typeof key === "string" && getModelByKey(key)).slice(0, 24)
      : [];
    placementSelectedKeys = new Set(validKeys);

    const gpuPayload = JSON.parse(params.get("pgGpus") || "[]");
    if (Array.isArray(gpuPayload) && gpuPayload.length) {
      const validRows = gpuPayload
        .filter((row) => row && GPU_PRESETS.some((gpu) => gpu.id === row.presetId))
        .slice(0, 8)
        .map((row, index) => ({
          id: `gpu-row-${index + 1}`,
          presetId: row.presetId,
          count: clampNumber(row.count, 1, 8, 1),
        }));
      if (validRows.length) {
        gpuInventoryRows = validRows;
        gpuInventoryIdCounter = validRows.length;
        placementInventorySeeded = true;
      }
    }

    placementModelConfigs.clear();
    const configs = JSON.parse(params.get("pgConfig") || "[]");
    if (Array.isArray(configs)) {
      configs.forEach(([key, raw]) => {
        if (!placementSelectedKeys.has(key) || !raw || typeof raw !== "object") return;
        placementModelConfigs.set(key, {
          requestShare: clampNumber(raw.requestShare, 1, 1000, 100),
          minConcurrency: clampNumber(raw.minConcurrency, 0, 256, 1),
          pinnedGpu: raw.pinnedGpu === "" || (
            Number.isInteger(Number(raw.pinnedGpu))
            && Number(raw.pinnedGpu) >= 0
            && Number(raw.pinnedGpu) < gpuInventoryRows.length
          ) ? String(raw.pinnedGpu ?? "") : "",
          preferredSetting: typeof raw.preferredSetting === "string" ? raw.preferredSetting : "auto",
          contextTokens: raw.contextTokens == null ? null : clampNumber(raw.contextTokens, 2048, 1048576, 8192),
          allowReplica: raw.allowReplica !== false,
        });
      });
    }
    validKeys.forEach(getPlacementModelConfig);

    placementUsageMode = ["pipeline", "independent", "alternate"].includes(params.get("pgUsage")) ? params.get("pgUsage") : "independent";
    placementStrategy = ["balanced", "compact", "throughput", "primary"].includes(params.get("pgStrategy")) ? params.get("pgStrategy") : "balanced";
    placementTargetN = params.has("pgTarget") ? clampNumber(params.get("pgTarget"), 1, 256, 1) : null;
    placementMinHeadroomPct = clampNumber(params.get("pgHeadroom"), 0, 40, 15);
    placementAllowQuantChange = params.get("pgQuant") !== "0";
    placementAllowContextReduction = params.get("pgContext") === "1";
    placementAllowReplication = params.get("pgReplicas") === "1";
    placementPrimaryKey = placementSelectedKeys.has(params.get("pgPrimary")) ? params.get("pgPrimary") : "";

    if ($("placementTargetConcurrency")) {
      const targetValue = placementTargetN == null ? "" : String(placementTargetN);
      const presets = [...$("placementTargetConcurrency").options].map((option) => option.value);
      $("placementTargetConcurrency").value = presets.includes(targetValue) ? targetValue : placementTargetN == null ? "" : "custom";
      $("placementTargetConcurrencyCustom").value = String(placementTargetN || 32);
    }
    if ($("placementMinHeadroom")) {
      const headroomValue = String(placementMinHeadroomPct);
      $("placementMinHeadroom").value = ["10", "15", "20"].includes(headroomValue) ? headroomValue : "custom";
      $("placementMinHeadroomCustom").value = headroomValue;
    }
    if ($("placementAllowQuantChange")) $("placementAllowQuantChange").checked = placementAllowQuantChange;
    if ($("placementAllowContextReduction")) $("placementAllowContextReduction").checked = placementAllowContextReduction;
    if ($("placementAllowReplication")) $("placementAllowReplication").checked = placementAllowReplication;
  } catch {
    placementSelectedKeys = new Set();
    placementModelConfigs.clear();
  }
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
