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
const UI_COPY_V15 = {
  "core.intro.kicker": { ko: "처음 오셨나요?", en: "New here?" },
  "core.intro.title": { ko: "가지고 있는 GPU가 있나요, 아니면 실행할 모델부터 정하고 싶나요?", en: "Do you already have a GPU, or do you want to start with a model?" },
  "core.intro.note": { ko: "하나를 선택하면 필요한 입력만 단계별로 보여드립니다.", en: "Choose one path and we will show only the inputs you need." },
  "core.finder.title": { ko: "내 GPU에서 실행할 모델 찾기", en: "Find models for my GPU" },
  "core.finder.note": { ko: "가지고 있는 GPU로 가능한 모델 확인", en: "Check what runs on hardware you already own" },
  "core.modelFinder.title": { ko: "실행할 모델에 맞는 GPU 찾기", en: "Find a GPU for my model" },
  "core.modelFinder.note": { ko: "모델·예산·전력 기준 구매 후보 확인", en: "Compare buying options by model, budget, and power" },
  "core.infra.title": { ko: "AI 인프라 간편 견적", en: "Quick AI infrastructure estimate" },
  "core.infra.note": { ko: "서비스와 사용자 수로 전체 구성 자동 추천", en: "Size a complete system from service type and users" },
  "core.placement.title": { ko: "여러 모델 함께 배치", en: "Place multiple models together" },
  "core.placement.note": { ko: "LLM·RAG·VLM·음성 모델을 여러 GPU에 배치", en: "Place LLM, RAG, VLM, and voice models across GPUs" },
  "core.advanced": { ko: "고급 도구", en: "Advanced tools" },
  "core.aria.section": { ko: "주요 작업 선택", en: "Choose a primary task" },
  "core.aria.tabs": { ko: "주요 작업", en: "Primary tasks" },
  "core.aria.demos": { ko: "샘플로 시작", en: "Start with a sample" },
  "core.demo.gpu": { ko: "RTX 3060으로 체험", en: "Try with an RTX 3060" },
  "core.demo.infra": { ko: "사내 RAG 30명 예시", en: "30-user internal RAG example" },
  "workload.audioStt": { ko: "음성 인식", en: "Speech recognition" },
  "workload.audioTts": { ko: "음성 합성", en: "Speech synthesis" },
  "workload.avatarGeneration": { ko: "아바타·립싱크", en: "Avatar · lip sync" },
  "benchmark.dashboard": { ko: "벤치마크 데이터 현황", en: "Benchmark coverage dashboard" },
  "benchmark.submit": { ko: "측정값 제보", en: "Submit a measurement" },
  "advisor.currentPrice": { ko: "현재 GPU 시세 (USD)", en: "Current GPU market price (USD)" },
};
function uiText(key) {
  return UI_COPY_V15[key]?.[uiLanguage === "en" ? "en" : "ko"] || key;
}
function applyV15Translations() {
  const en = uiLanguage === "en";
  const intro = document.querySelector(".core-task-intro");
  if (intro) {
    const [kicker, title, note] = intro.children;
    if (kicker) kicker.textContent = uiText("core.intro.kicker");
    if (title) title.textContent = uiText("core.intro.title");
    if (note) note.textContent = uiText("core.intro.note");
  }
  const gpuDemo = document.querySelector("[data-demo-gpu]");
  if (gpuDemo) gpuDemo.textContent = uiText("core.demo.gpu");
  const infraDemo = document.querySelector("[data-demo-infra]");
  if (infraDemo) infraDemo.textContent = uiText("core.demo.infra");
  const taskSection = document.querySelector(".core-task-switcher");
  taskSection?.setAttribute("aria-label", uiText("core.aria.section"));
  taskSection?.querySelector(".core-task-actions")?.setAttribute("aria-label", uiText("core.aria.tabs"));
  const demos = taskSection?.querySelector(".core-task-demos");
  demos?.setAttribute("aria-label", uiText("core.aria.demos"));
  const advancedSummary = demos?.querySelector(".advanced-entry > summary");
  if (advancedSummary) advancedSummary.textContent = uiText("core.advanced");
  if ($("advisorCurrentPriceLabel")) $("advisorCurrentPriceLabel").textContent = uiText("advisor.currentPrice");
  Object.assign(WORKLOAD_META.audioStt, {
    label: uiText("workload.audioStt"),
    statusLabel: "STT",
    modelCountLabel: en ? "Speech recognition models" : "음성 인식 모델",
    searchPlaceholder: en ? "Search STT model, provider, or language" : "STT 모델, 제공자, 언어 검색",
    listHeaders: en
      ? ["Status", "Model", "Release / language", "Summary", "Provider · license", "Precision", "Estimated VRAM", "Realtime factor", "Audio", ""]
      : ["상태", "모델", "출시/언어", "요약", "제공자·라이선스", "정밀도", "계산 VRAM", "실시간 배속", "오디오", ""],
  });
  Object.assign(WORKLOAD_META.audioTts, {
    label: uiText("workload.audioTts"),
    statusLabel: "TTS",
    modelCountLabel: en ? "Speech synthesis models" : "음성 합성 모델",
    searchPlaceholder: en ? "Search TTS model, provider, or language" : "TTS 모델, 제공자, 언어 검색",
    listHeaders: en
      ? ["Status", "Model", "Release / language", "Summary", "Provider · license", "Precision", "Estimated VRAM", "Realtime factor", "Audio", ""]
      : ["상태", "모델", "출시/언어", "요약", "제공자·라이선스", "정밀도", "계산 VRAM", "실시간 배속", "오디오", ""],
  });
  refreshCoreTaskUi();
}
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
  return { ...model, ...metadata, type };
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

const MESSAGES = {
  ko: {
    settings: "상세 설정",
    closeSettings: "상세 설정 닫기",
    allProviders: "전체 공급사",
    allLicenses: "전체 라이선스",
    allTasks: "전체 작업",
    searchModel: "모델명, 제조사, 태그 검색",
    quickRecommendations: "빠른 추천",
    exploreAll: "전체 모델 탐색",
    generative: "생성형 LLM",
    embedding: "임베딩",
    reranker: "리랭커",
    ocrVlm: "OCR·VLM",
    documentVlm: "문서 VLM",
    generalVlm: "범용 VLM",
    imageGeneration: "이미지 생성",
    videoGeneration: "비디오 생성",
    avatarGeneration: "아바타·립싱크",
    currentGpu: "현재 GPU",
    quickTitle: "3단계 빠른 추천",
    quickSubtitle: "GPU에 맞는 모델 3개를 바로 추천합니다",
    quickDescription: "위에서 GPU를 선택하고 용도와 우선순위를 고르면 현재 워크로드의 실행 가능한 모델만 추립니다.",
    currentCondition: "현재 조건에서 실행 가능한 모델을 권장 양자화로 묶었습니다.",
    detailCalculation: "상세 계산 보기",
    gpuRequired: "GPU 선택 필요",
    chooseGpu: "GPU 선택하기",
    benchmarkSheet: "벤치마크 시트",
    benchmarkIntro: "계산 추정, 외부 공개 참고값, 사용자 측정, 자체 측정을 근거별로 분리합니다.",
    updated: "업데이트",
    type: "구분",
    model: "모델",
    gpu: "GPU",
    conditions: "조건",
    environment: "환경",
    scaleRelease: "규모/출시",
    metric: "지표",
    source: "출처",
    view: "보기",
    clearFilters: "선택 해제",
  },
  en: {
    settings: "Detailed settings",
    closeSettings: "Close settings",
    allProviders: "All providers",
    allLicenses: "All licenses",
    allTasks: "All tasks",
    searchModel: "Search model, maker, or tag",
    quickRecommendations: "Quick recommendations",
    exploreAll: "Explore all models",
    generative: "Generative LLM",
    embedding: "Embedding",
    reranker: "Reranker",
    ocrVlm: "OCR · VLM",
    documentVlm: "Document VLM",
    generalVlm: "General VLM",
    imageGeneration: "Image generation",
    videoGeneration: "Video generation",
    avatarGeneration: "Avatar · lip sync",
    currentGpu: "Current GPU",
    quickTitle: "3-step quick recommendations",
    quickSubtitle: "Get 3 models recommended for your GPU",
    quickDescription: "Choose a GPU, purpose, and priority above to show only runnable models for this workload.",
    currentCondition: "Runnable models grouped with recommended quantization for the current setup.",
    detailCalculation: "View detailed calculation",
    gpuRequired: "No GPU selected",
    chooseGpu: "Select a GPU",
    benchmarkSheet: "Benchmark sheet",
    benchmarkIntro: "Estimates, external public references, user measurements, and project measurements are shown separately.",
    updated: "Updated",
    type: "Type",
    model: "Model",
    gpu: "GPU",
    conditions: "Conditions",
    environment: "Environment",
    scaleRelease: "Scale/Release",
    metric: "Metric",
    source: "Source",
    view: "View",
    clearFilters: "Clear selection",
  },
};

function t(key) {
  return MESSAGES[uiLanguage]?.[key] || MESSAGES.ko[key] || key;
}

function localizedText(value, fallback = "") {
  if (value && typeof value === "object") {
    return value[uiLanguage] || value.ko || value.en || fallback;
  }
  return value || fallback;
}

function modelSummary(model) {
  const explicit = localizedText(model?.summary, "");
  if (uiLanguage !== "en" || (model?.summary && typeof model.summary === "object")) return explicit;
  const workload = model?.type === "embedding" ? "embedding" : model?.type === "reranker" ? "reranker" : model?.type?.includes("vlm") ? "vision-language" : model?.type === "ocr-pipeline" ? "OCR" : "language";
  const tags = (model?.tags || []).slice(0, 3).map(tagLabel).join(", ");
  return `${workload} model for ${tags || "general local AI workloads"}. The Korean description is available in the Korean interface.`;
}

function licenseCommercialLabel(policy) {
  if (uiLanguage !== "en") return localizedText(policy?.commercialLabel, "");
  const map = {
    "상업 이용 가능": "Commercial use allowed",
    "조건부 상업 이용": "Conditional commercial use",
    "연구·비상업 전용": "Research / non-commercial only",
    "비상업 이용만": "Non-commercial use only",
    "약관 확인 필요": "Review terms",
  };
  return localizedText(policy?.commercialLabel, "") in map ? map[localizedText(policy.commercialLabel)] : localizedText(policy?.commercialLabel, "");
}

function licenseOpennessLabel(policy) {
  if (uiLanguage !== "en") return localizedText(policy?.opennessLabel, "");
  const map = { "오픈소스": "Open source", "공개 가중치": "Open weights", "연구용 공개 가중치": "Research weights", "비상업 공개": "Non-commercial", "라이선스 미표기": "License not stated" };
  const value = localizedText(policy?.opennessLabel, "");
  return map[value] || value;
}

function licenseSummary(policy) {
  const value = localizedText(policy?.summary, "");
  if (uiLanguage !== "en" || (policy?.summary && typeof policy.summary === "object")) return value;
  return "Review the latest license and model-specific terms before commercial distribution.";
}

const UI_TRANSLATIONS = {
  en: {
    "계산 기준": "Methodology",
    "데이터 출처": "Data sources",
    "벤치마크": "Benchmarks",
    "상세 설정": "Detailed settings",
    "내 GPU에서 돌아가는 AI 모델 찾기": "Find AI models for your GPU",
    "내 GPU": "My GPU",
    "내 실행 환경": "My setup",
    "GPU를 선택해 주세요": "Select a GPU",
    "결과 링크 복사": "Copy result link",
    "요약 카드 PNG": "Download PNG card",
    "전체 모델에서 비교하기": "Compare all models",
    "RTX 3060 링크": "RTX 3060 link",
    "English": "한국어",
  },
  ko: {
    "Methodology": "계산 기준",
    "Data sources": "데이터 출처",
    "Benchmarks": "벤치마크",
    "Detailed settings": "상세 설정",
    "Find AI models for your GPU": "내 GPU에서 돌아가는 AI 모델 찾기",
    "My GPU": "내 GPU",
    "My setup": "내 실행 환경",
    "Select a GPU": "GPU를 선택해 주세요",
    "Copy result link": "결과 링크 복사",
    "Download PNG card": "요약 카드 PNG",
    "Compare all models": "전체 모델에서 비교하기",
    "RTX 3060 link": "RTX 3060 링크",
    "한국어": "English",
  },
};

// Static <option> presets whose entire label is just "숫자+단위" (e.g. "40개",
// "16쌍"). These can't go through the generic dictionary/regex sweep below:
// the exact same "N개" shape is reused across unrelated presets (embedding
// batch, reranker candidates, ...) with different meanings, so one shared
// rule would mislabel one preset using another's wording. Keyed by the
// option's stable `value` attribute (not its text) and written directly on
// every language switch, so unlike the dictionary-cache mechanism above this
// never gets stuck on a stale/partial translation after toggling back and
// forth.
const pluralize = (value, singular, plural) => `${value} ${Number(value) === 1 ? singular : plural}`;

const PRESET_OPTION_LABELS = {
  concurrencyPreset: { ko: (v) => `${v}명`, en: (v) => `${v} concurrent` },
  embeddingBatchSizePreset: { ko: (v) => `${v}개`, en: (v) => pluralize(v, "text", "texts") },
  rerankerCandidatesPreset: { ko: (v) => `${v}개`, en: (v) => pluralize(v, "candidate", "candidates") },
  rerankerBatchSizePreset: { ko: (v) => `${v}쌍`, en: (v) => pluralize(v, "pair", "pairs") },
  ocrBatchSizePreset: { ko: (v) => `${v}페이지`, en: (v) => pluralize(v, "page", "pages") },
  placementTargetConcurrency: { ko: (v) => (v ? `${v}명` : "설정 안 함"), en: (v) => (v ? pluralize(v, "user", "users") : "Not set") },
};

function translatePresetOptionLabels(language) {
  Object.entries(PRESET_OPTION_LABELS).forEach(([selectId, labels]) => {
    const select = $(selectId);
    if (!select) return;
    [...select.options].forEach((option) => {
      if (option.value === "custom") return; // "직접" already handled by the dictionary sweep
      option.textContent = language === "en" ? labels.en(option.value) : labels.ko(option.value);
    });
  });
}

const ENGLISH_UI_REPLACEMENTS = [
  ["찾는 GPU가 아직 목록에 없나요?", "Can't find your GPU yet?"],
  ["직접 사양을 입력해 바로 계산하거나, 이름을 채운 상태로 추가 요청을 보낼 수 있습니다.", "Enter specifications to calculate now, or submit a prefilled GPU request."],
  ["직접 사양 입력", "Enter specifications"],
  ["GPU 추가 요청", "Request a GPU"],
  ["GPU 상세·비교", "GPU details and comparison"],
  ["현재 GPU의 사양과 대안을 비교하세요", "Compare your GPU specifications and alternatives"],
  ["Current GPU의 사양과 대안을 비교하세요", "Compare your GPU specifications and alternatives"],
  ["GPU 비교 열기", "Open GPU comparison"],
  ["GPU 비교 닫기", "Close GPU comparison"],
  ["비교 GPU 선택", "Select a GPU to compare"],
  ["비교 GPU 1", "Comparison GPU 1"],
  ["비교 GPU 2", "Comparison GPU 2"],
  ["비교 GPU 3", "Comparison GPU 3"],
  ["아키텍처", "Architecture"],
  ["메모리", "Memory"],
  ["대역폭", "Bandwidth"],
  ["런타임", "Runtime"],
  ["전력 범위", "Power range"],
  ["노트북 TGP", "Laptop TGP"],
  ["GPU 계산 메모리", "GPU-usable memory"],
  ["실행 가능 모델", "Runnable models"],
  ["최대 후보", "Largest candidate"],
  ["추정 속도 중앙값", "Median estimated speed"],
  ["이 GPU로 할 수 있는 작업", "What this GPU can do"],
  ["현재 모델 종류", "Current model type"],
  ["이미지 생성", "Image generation"],
  ["비디오 생성", "Video generation"],
  ["경량 튜닝", "Lightweight fine-tuning"],
  ["생성 스텝", "Generation steps"],
  ["비디오 프레임", "Video frames"],
  ["LoRA 개수", "LoRA count"],
  ["메모리 절약", "Memory strategy"],
  ["GPU 단독", "GPU only"],
  ["순차 CPU 오프로딩", "Sequential CPU offload"],
  ["VAE 타일링", "VAE tiling"],
  ["실측 제보 대기", "Awaiting measurements"],
  ["전용 VRAM", "Dedicated VRAM"],
  ["GPU 계산 기준", "GPU-usable"],
  ["통합 전체", "Unified total"],
  ["선택", "selected"],
  ["내 GPU에서 돌아가는 AI 모델 찾기", "Find AI models for your GPU"],
  ["상태", "Status"],
  ["출시/세대", "Release/Gen"],
  ["대표 공개 평가", "Public benchmark"],
  ["공급사/라이선스", "Provider/License"],
  ["권장 설정", "Recommended settings"],
  ["계산 VRAM", "Calculated VRAM"],
  ["추정 속도", "Estimated throughput"],
  ["추정 처리량", "Estimated throughput"],
  ["이미지", "Image"],
  ["상세 닫기", "Close details"],
  ["이 결과를 공유하세요", "Share this result"],
  ["추천 이유", "Why this model"],
  ["계산값과 근거", "Estimate and evidence"],
  ["판정 근거", "Decision rationale"],
  ["VRAM 여유", "VRAM headroom"],
  ["남음", "Remaining"],
  ["부족", "Shortage"],
  ["신뢰도", "Confidence"],
  ["처리 지연", "Processing latency"],
  ["질의당 지연", "Latency per query"],
  ["정밀도별 비교", "Precision comparison"],
  ["예상 VRAM", "Expected VRAM"],
  ["예상 속도", "Expected speed"],
  ["예상 처리량", "Expected throughput"],
  ["품질", "Quality"],
  ["실행 상태", "Run status"],
  ["실행 방식별 비교", "Runtime comparison"],
  ["기능별 비교", "Feature comparison"],
  ["VRAM 상세 분석", "VRAM breakdown"],
  ["모델 필요 VRAM", "Model required VRAM"],
  ["실행 명령어", "Run command"],
  ["실행 예시", "Example command"],
  ["계산 근거", "Method details"],
  ["모델 정보", "Model information"],
  ["라이선스 및 상업 이용", "License and commercial use"],
  ["라이선스 원문 확인", "View license"],
  ["스펙 오류 신고", "Report a spec issue"],
  ["공식/모델 카드", "Official/model card"],
  ["Hugging Face 검색", "Search Hugging Face"],
  ["측정 상태", "Measurement status"],
  ["데이터 갱신", "Data updated"],
  ["문서 특화 VLM 메모리 분석", "Document-specialized VLM memory analysis"],
  ["문서 특화 VLM", "Document-specialized VLM"],
  ["총 GPU VRAM", "Total GPU VRAM"],
  ["다른 작업 예약", "Reserved for other work"],
  ["실행 후 잔여", "Remaining after run"],
  ["계산 Conditions", "Calculation conditions"],
  ["텍스트 OCR", "Text OCR"],
  ["레이아웃 포함", "With layout"],
  ["표/수식 포함", "With tables/formulas"],
  ["문서 파싱 전체", "Full document parsing"],
  ["가능", "Possible"],
  ["잘 돌아감", "Runs well"],
  ["쾌적", "Comfortable"],
  ["부적합", "Not suitable"],
  ["오프로딩", "Offloading"],
  ["문서", "Document"],
  ["한국어", "Korean"],
  ["표", "Table"],
  ["수식", "Formula"],
  ["필기", "Handwriting"],
  ["레이아웃", "Layout"],
  ["상업 이용·수정·배포", "Commercial use, modification, and distribution"],
  ["오픈소스", "Open source"],
  ["파라미터", "Parameters"],
  ["처리 유형", "Workload type"],
  ["구조", "Architecture"],
  ["Custom 확인", "verify the custom"],
  ["문서 크기", "Document size"],
  ["이미지 너비", "Image width"],
  ["이미지 높이", "Image height"],
  ["배치 페이지", "Batch pages"],
  ["페이지", "pages"],
  ["정밀도", "Precision"],
  ["처리 기능", "Processing"],
  ["현재 계산 기준", "Current settings"],
  ["조건 변경", "Change settings"],
  ["A4", "A4"],
  ["배치", "batch"],
  ["실행 가능한", "runnable"],
  ["실행 판정", "Run verdict"],
  ["빠른 추천", "Quick recommendations"],
  ["전체 모델 탐색", "Explore all models"],
  ["전체 모델에서 비교하기", "Compare all models"],
  ["상세 설정", "Detailed settings"],
  ["기본 하드웨어", "Primary hardware"],
  ["보조 GPU 수", "Secondary GPU count"],
  ["보조 GPU", "Secondary GPU"],
  ["메모리 보정", "Memory adjustments"],
  ["고급 도구", "Advanced tools"],
  ["계산 기준", "Methodology"],
  ["데이터 출처", "Data sources"],
  ["벤치마크", "Benchmarks"],
  ["생성형 LLM", "Generative LLM"],
  ["임베딩", "Embedding"],
  ["리랭커", "Reranker"],
  ["OCR·VLM", "OCR · VLM"],
  ["문서 VLM", "Document VLM"],
  ["범용 VLM", "General VLM"],
  ["내 GPU", "My GPU"],
  ["내 실행 환경", "My setup"],
  ["GPU를 선택해 주세요", "Select a GPU"],
  ["GPU 선택 필요", "No GPU selected"],
  ["GPU 프리셋을 선택하면 추천을 시작합니다.", "Select a GPU preset to start recommendations."],
  ["선택 즉시 현재 환경에 맞는 모델을 계산합니다.", "Results update immediately for your setup."],
  ["결과 링크 복사", "Copy result link"],
  ["요약 카드 PNG", "Download PNG card"],
  ["RTX 3060 링크", "RTX 3060 link"],
  ["VRAM", "VRAM"],
  ["시스템 RAM", "System RAM"],
  ["GPU 수", "GPU count"],
  ["사용 중 VRAM", "Reserved VRAM"],
  ["안전 여유분", "Safety margin"],
  ["대역폭 GB/s", "Bandwidth GB/s"],
  ["실행 방식", "Runtime"],
  ["양자화", "Quantization"],
  ["컨텍스트 토큰", "Context tokens"],
  ["동시 요청 프리셋", "Concurrent requests preset"],
  ["동시 요청 직접 입력", "Custom concurrent requests"],
  ["목표 동시 사용자 직접 입력", "Custom target concurrent users"],
  ["동시 요청", "Concurrent requests"],
  ["평균 출력 프리셋", "Average output preset"],
  ["평균 출력 직접 입력", "Custom average output"],
  ["평균 출력 토큰", "Average output tokens"],
  ["평균 입력 길이 프리셋", "Average input length preset"],
  ["평균 입력 길이 직접 입력", "Custom average input length"],
  ["평균 입력 길이", "Average input length"],
  ["정밀도/런타임", "Precision/Runtime"],
  ["정밀도/기능", "Precision/Features"],
  ["정밀도", "Precision"],
  ["검색해서 선택", "Search to select"],
  ["GPU 모델명 검색", "Search GPU model name"],
  ["모델명, 제조사로 검색", "Search by model name or maker"],
  ["모델명, 제조사, 태그 검색", "Search model, maker, or tag"],
  ["임베딩 모델명, 제조사, 태그 검색", "Search embedding model, maker, or tag"],
  ["리랭커 모델명, 제조사, 태그 검색", "Search reranker model, maker, or tag"],
  ["OCR 파이프라인, 제조사, 태그 검색", "Search OCR pipeline, maker, or tag"],
  ["문서 VLM, 제조사, 태그 검색", "Search document VLM, maker, or tag"],
  ["범용 VLM, 제조사, 태그 검색", "Search general VLM, maker, or tag"],
  ["검색", "Search"],
  ["전체 등급", "All grades"],
  ["전체 작업", "All tasks"],
  ["전체 공급사", "All providers"],
  ["전체 라이선스", "All licenses"],
  ["전체 이용 조건", "All usage terms"],
  ["전체 해제", "Clear all"],
  ["종합 추천", "Overall recommendation"],
  ["최신 모델순", "Newest first"],
  ["파라미터 큰 순", "Largest parameters first"],
  ["속도 우선", "Speed first"],
  ["품질 우선", "Quality first"],
  ["여유 VRAM 우선", "VRAM headroom first"],
  ["균형 잡힌 추천", "Balanced recommendation"],
  ["일반 대화 / 비서", "General chat / assistant"],
  ["긴 문서 / RAG", "Long documents / RAG"],
  ["코딩 모델 우선", "Coding models first"],
  ["한국어 모델 우선", "Korean models first"],
  ["한국어 특화", "Korean-focused"],
  ["이미지 / 문서 인식", "Image / document understanding"],
  ["추론 / 수학", "Reasoning / math"],
  ["문서 파싱 전체", "Full document parsing"],
  ["텍스트 OCR", "Text OCR"],
  ["영수증/라벨", "Receipts / labels"],
  ["웹/스크린샷 1080p", "Web / screenshot 1080p"],
  ["배치 계산", "Calculate placement"],
  ["무엇을 하시나요?", "What would you like to do?"],
  ["원하는 작업부터 선택하세요", "Choose the task you want to start with"],
  ["내 GPU에 맞는 모델 찾기", "Find models for my GPU"],
  ["빠른 추천과 전체 모델 탐색", "Quick recommendations and full catalog"],
  ["여러 모델 함께 돌리기", "Run multiple models together"],
  ["AI 스택 배치 플래너", "AI Stack Placement Planner"],
  ["LLM·임베딩·리랭커·OCR/VLM을 보유 GPU에 나눠 배치합니다.", "Place LLM, embedding, reranker, OCR, and VLM workloads across your GPUs."],
  ["사용 가이드", "Quick guide"],
  ["처음에는 균형형으로 시작하세요", "Start with the balanced plan"],
  ["RAG·문서 AI·여러 LLM 중 가까운 구성을 선택합니다.", "Choose the closest starting point: RAG, document AI, or multiple LLMs."],
  ["보유 GPU와 동시에 실행할 모델을 확인합니다.", "Review your GPUs and the models that will run together."],
  ["운영 방식과 목표 동시 사용자를 정합니다.", "Choose a usage pattern and target concurrency."],
  ["배치 계산 후 병목과 세 가지 대안을 비교합니다.", "Calculate placement, then compare the bottleneck and three alternatives."],
  ["한 요청이 여러 모델을 순서대로 사용", "One request passes through multiple models in sequence"],
  ["모델마다 별도 API와 사용자를 운영", "Each model runs as a separate API for its own users"],
  ["설치해 두고 한 번에 하나만 실행", "Keep models installed but run only one at a time"],
  ["결과는 계산 추정치입니다. 실제 운영 전에는 내 환경에서 검증하세요.", "Results are calculated estimates. Validate them in your environment before production."],
  ["파이프라인", "Pipeline"],
  ["독립 서비스", "Independent services"],
  ["순차 실행", "One at a time"],
  ["모델 찾기로 돌아가기", "Back to model finder"],
  ["처음이라면 여기서 시작하세요", "Start here if this is your first time"],
  ["AI 스택을 GPU에 배치해 보세요", "Place an AI stack across your GPUs"],
  ["보유 GPU와 함께 실행할 모델을 선택하면 GPU별 배치, 권장 동시 접속, 예상 처리량, 병목과 개선 방법을 계산합니다.", "Choose your GPUs and models to calculate placement, recommended concurrency, throughput, bottlenecks, and improvements."],
  ["RAG 기본 구성", "Basic RAG stack"],
  ["LLM + 임베딩 + 리랭커", "LLM + embedding + reranker"],
  ["문서 AI 구성", "Document AI stack"],
  ["LLM/VLM + OCR + 임베딩", "LLM/VLM + OCR + embedding"],
  ["여러 LLM 서비스", "Multiple LLM services"],
  ["여러 모델을 독립 API로 운영", "Run multiple models as independent APIs"],
  ["AI 아바타 채팅", "AI avatar chat"],
  ["STT + LLM + TTS + 아바타 영상", "STT + LLM + TTS + avatar video"],
  ["아바타·립싱크 모델", "Avatar · lip-sync models"],
  ["아바타·립싱크", "Avatar · lip sync"],
  ["아바타, 립싱크, talking-head 모델 검색", "Search avatar, lip-sync, or talking-head models"],
  ["직접 선택", "Build manually"],
  ["원하는 GPU와 모델을 직접 구성", "Choose your own GPUs and models"],
  ["하드웨어", "Hardware"],
  ["보유한 GPU와 수량을 입력하세요.", "Enter the GPUs you own and their quantities."],
  ["모델 선택", "Model selection"],
  ["검색하거나 워크로드 종류를 골라 함께 실행할 모델을 추가하세요.", "Search or choose a workload to add models that will run together."],
  ["운영 목표", "Operating goals"],
  ["기본 목표 세 가지만 선택하면 계산할 수 있습니다.", "Choose the three basic goals to calculate a placement."],
  ["세부 조건", "Advanced conditions"],
  ["배치 결과", "Placement result"],
  ["결론과 배치안을 먼저 보고, 필요할 때 계산 상세를 펼치세요.", "Review the conclusion and plans first, then expand calculation details when needed."],
  ["계산 상세 보기", "View calculation details"],
  ["AI 스택 배치", "AI stack placement"],
  ["LLM과 RAG 모델 함께 배치", "Place LLM and RAG models together"],
  ["GPU에 함께 배치", "Place together on GPUs"],
  ["아직 선택된 모델이 없습니다.", "No models selected yet."],
  ["선택된 모델", "Selected models"],
  ["보유 GPU 목록", "GPU inventory"],
  ["배치 기준", "Placement strategy"],
  ["운영 방식", "Usage pattern"],
  ["목표 동시 사용자", "Target concurrent users"],
  ["최소 VRAM 여유율", "Minimum VRAM headroom"],
  ["양자화·정밀도 자동 변경 허용", "Allow automatic quantization/precision changes"],
  ["컨텍스트 자동 축소 허용", "Allow automatic context reduction"],
  ["독립 서비스 모델 복제 허용", "Allow independent-service replicas"],
  ["3개 배치안 비교", "Compare 3 plans"],
  ["주 모델(우선 배정)", "Primary model (priority)"],
  ["균형 우선", "Balanced"],
  ["모델 수 우선", "Model count"],
  ["처리량 우선", "Throughput"],
  ["주 모델 우선", "Primary model"],
  ["모델별 성능지표 시트", "Per-model benchmark sheet"],
  ["불러온 모델 지우기", "Clear imported models"],
  ["상세 계산 보기", "View detailed calculation"],
  ["계산 추정, 외부 공개 참고값, 사용자 측정, 자체 측정을 근거별로 분리합니다.", "Estimates, external public references, user measurements, and project measurements are shown separately."],
  ["업데이트", "Updated"],
  ["구분", "Type"],
  ["모델", "Model"],
  ["조건", "Conditions"],
  ["지표", "Metric"],
  ["출처", "Source"],
  ["공식 평가", "Official evaluation"],
  ["공식 발표", "Official report"],
  ["공식 품질", "Official quality"],
  ["보기", "View"],
  ["상업 이용 가능", "Commercial use allowed"],
  ["조건부 상업 이용", "Conditional commercial use"],
  ["비상업·연구용", "Non-commercial / research"],
  ["약관 확인 필요", "Review terms"],
  ["비상업 이용만", "Non-commercial use only"],
  ["연구·비상업 전용", "Research / non-commercial only"],
  ["연구·테스트 전용", "Research / testing only"],
  ["등록 후 상업 이용", "Commercial use after registration"],
  ["모델별 확인 필요", "Check per model"],
  ["수정 조항 확인", "Review modified terms"],
  ["가능 이상", "Good or better"],
  ["쾌적", "Comfortable"],
  ["잘 돌아감", "Runs well"],
  ["빡빡함", "Tight"],
  ["오프로딩 전제", "Requires offloading"],
  ["오프로딩", "Offloading"],
  ["조건부", "Conditional"],
  ["부적합", "Not suitable"],
  ["현재 조건 부적합", "Not suitable under current settings"],
  ["계산 추정치", "Estimated calculation"],
  ["외부 공개 참고값", "External public reference"],
  ["사용자 측정", "User measurement"],
  ["자체 측정", "Project measurement"],
  ["MoE 활성 파라미터 낮음", "Low MoE active params"],
  ["RAG/검색", "RAG / search"],
  ["속도 우수", "Fast"],
  ["용도", "Purpose"],
  ["우선순위", "Priority"],
  ["GPU 설정이나 우선순위를 바꿔 다시 확인해 보세요.", "Try changing your GPU settings or priority and check again."],
  ["출시/세대", "Release/Gen"],
  ["대표 공개 평가", "Public benchmark"],
  ["공급사/라이선스", "Provider/License"],
  ["권장 설정", "Recommended settings"],
  ["계산 VRAM", "Calculated VRAM"],
  ["추정 속도", "Estimated speed"],
  ["추정 처리량", "Estimated throughput"],
  ["상태", "Status"],
  ["직접 입력", "Custom"],
  ["직접", "Custom"],
  ["이미지 너비", "Image width"],
  ["이미지 높이", "Image height"],
  ["이미지", "Image"],
  ["수량", "Count"],
  ["선택", "Select"],
  ["+ GPU 추가", "+ Add GPU"],
  ["비교 보기", "Compare view"],
  ["경량", "Lightweight"],
  ["긴 문서", "Long context"],
  ["대화", "Chat"],
  ["비전", "Vision"],
  ["오디오", "Audio"],
  ["추론", "Reasoning"],
  ["코딩", "Coding"],
  ["Hugging Face 공개 LLM 직접 계산", "Direct Hugging Face LLM calculation"],
  ["모델 주소 또는 ID", "Model URL or ID"],
  ["가중치 정보 가져오기", "Fetch weight info"],
  [
    "Hugging Face 공개 API의 생성형 LLM safetensors 파라미터 수와 config를 사용합니다. 비공개·접근 승인 필요 모델은 불러올 수 없습니다.",
    "Uses the public Hugging Face API's generative LLM safetensors parameter count and config. Private or gated models can't be loaded.",
  ],
  ["여러 GPU에 모델 동시 배치 추천 (베타)", "Multi-GPU model placement recommendation (beta)"],
  [
    "보유한 GPU 여러 대에 LLM·임베딩·리랭커·OCR/VLM 모델을 어떤 GPU에 올리면 좋을지 계산합니다. 각 모델은 기본 부하(동시 1명 또는 기본 배치) 기준 필요 VRAM으로 배치하며, 실제 서빙 프레임워크·스케줄링에 따라 달라질 수 있는 참고용 추정치입니다.",
    "Calculates which GPU each LLM, embedding, reranker, or OCR/VLM model should run on across multiple GPUs you own. Each model is placed based on the VRAM required at its base load (1 concurrent request or default batch); actual results are reference estimates that vary by serving framework and scheduling.",
  ],
  ["동시에 띄울 모델 검색 후 클릭해서 선택 (여러 종류 섞어서 선택 가능)", "Search and click to select models to run together (mixing types is fine)"],
  ["빡빡함: VRAM 여유가 적어 컨텍스트나 동시 요청 제한이 필요합니다. 오프로딩: 일부 연산을 시스템 RAM 또는 CPU에서 처리합니다.", "Tight: limited VRAM headroom requires reducing context or concurrent requests. Offloading: some computation runs on system RAM or CPU."],
  ["상단 메뉴", "Top navigation"],
  ["언어 선택", "Language"],
  ["하드웨어 설정", "Hardware settings"],
  ["기본 GPU", "Primary GPU"],
  ["GPU 종류 검색", "Search GPU type"],
  ["GPU 종류", "GPU type"],
  ["이 GPU 개수", "Number of this GPU"],
  ["GPU 제거", "Remove GPU"],
  ["배치할 모델 종류", "Model types to place"],
  ["사용 모드", "Mode"],
  ["모델 종류", "Model type"],
  ["컨텍스트 프리셋", "Context preset"],
  ["컨텍스트 직접 입력", "Custom context"],
  ["임베딩 배치 프리셋", "Embedding batch preset"],
  ["임베딩 배치 직접 입력", "Custom embedding batch"],
  ["최대 배치 토큰 프리셋", "Max batch tokens preset"],
  ["최대 배치 토큰 직접 입력", "Custom max batch tokens"],
  ["최대 배치 토큰", "Max batch tokens"],
  ["질의 길이 프리셋", "Query length preset"],
  ["질의 길이 직접 입력", "Custom query length"],
  ["질의 길이", "Query length"],
  ["문서 길이 프리셋", "Document length preset"],
  ["문서 길이 직접 입력", "Custom document length"],
  ["문서 길이", "Document length"],
  ["후보 문서 프리셋", "Candidate docs preset"],
  ["후보 문서 직접 입력", "Custom candidate docs"],
  ["후보 문서", "Candidate docs"],
  ["리랭커 배치 프리셋", "Reranker batch preset"],
  ["리랭커 배치 직접 입력", "Custom reranker batch"],
  ["배치 크기", "Batch size"],
  ["OCR 배치 페이지 프리셋", "OCR batch pages preset"],
  ["OCR 배치 페이지 직접 입력", "Custom OCR batch pages"],
  ["배치 페이지", "Batch pages"],
  ["모델 검색 결과", "Model search results"],
  ["데이터 범위", "Data coverage"],
  ["실행 등급", "Run grade"],
  ["작업 유형", "Task type"],
  ["공급사", "Provider"],
  ["라이선스", "License"],
  ["상업 이용 조건", "Commercial use terms"],
  ["정렬", "Sort"],
  ["보기 방식", "View mode"],
  ["목록 보기", "List view"],
  ["카드 보기", "Card view"],
  ["문서 크기", "Document size"],
  ["처리 기능", "Processing"],
  ["레이아웃 포함", "With layout"],
  ["표/수식 포함", "With tables/formulas"],
  ["비교에 추가 (최대 3개)", "Add to compare (max 3)"],
  ["조건 변경", "Change settings"],
  ["현재 계산 기준", "Current settings"],
  ["추천 시작하기", "Get started"],
  ["위에서 사용할 GPU를 먼저 선택해 주세요.", "Select the GPU to use above first."],
  ["GPU 선택", "Select GPU"],
  ["양자화별 추천", "Recommendation by quantization"],
  [
    "현재 조건에서 실행 가능한 모델을 권장 양자화로 묶었습니다.",
    "Runnable models under your current settings, grouped by recommended quantization.",
  ],
  ["모델을 누르면 상세 계산을 엽니다.", "Click a model to see the detailed calculation."],
  ["PyTorch 직접 실행", "PyTorch (direct)"],
  ["최고 품질", "Highest quality"],
  ["가장 빠른 모델", "Fastest model"],
  ["사용 안 함", "Not used"],
  ["GPU를 선택하세요", "Select a GPU"],
  ["공식 카드", "Official card"],
  ["추정 · 낮음", "Estimated · Low"],
  ["전체", "All"],
  ["공식 모델 카드", "Official model card"],
  ["공식 벤치마크 논문", "Official benchmark paper"],
  ["공식 기술 보고서 비교", "Official tech report comparison"],
  ["공식 기술 보고서", "Official tech report"],
  ["공식 비교표", "Official comparison table"],
  ["공식 비교", "Official comparison"],
  ["공식 증류", "Official distillation"],
  ["공식 논문", "Official paper"],
  ["공식 그래프", "Official graph"],
  ["공식 파트너", "Official partner"],
  ["공식 한국어", "Official (Korean)"],
  ["공식/미러", "Official/mirror"],
  ["공식", "Official"],
  ["외부 평가", "External eval"],
  ["외부 한국어", "External (Korean)"],
  ["외부 비교", "External comparison"],
  ["공개 평가", "Public evaluation"],
  ["품질 지표", "Quality metric"],
  ["불가", "N/A"],
  ["비교표", "comparison table"],
  ["최대 승률", "max win rate"],
  ["문서 OCR F1", "Document OCR F1"],
  ["필요 VRAM", "Required VRAM"],
  ["남는 VRAM", "Remaining VRAM"],
  ["부족 VRAM", "VRAM shortfall"],
  [
    "계산값은 로컬 추정치입니다. 실제 결과는 ",
    "Calculated values are local estimates. Actual results can vary significantly based on ",
  ],
  ["모델 아키텍처(MoE·attention 구조 등)", "model architecture (MoE, attention structure, etc.)"],
  [
    ", 드라이버, CUDA/ROCm, 프레임워크, 배치 크기, 예약 VRAM, KV cache, OCR 전처리 설정에 따라 크게 달라질 수 있으며, 특히 속도(tok/s)는 실제 측정과 배 단위로 차이가 날 수 있으니 상대 비교·참고용으로만 사용하세요.",
    ", drivers, CUDA/ROCm, framework, batch size, reserved VRAM, KV cache, and OCR preprocessing settings — especially speed (tok/s), which can differ from real measurements by multiples. Use these for relative comparison and reference only.",
  ],
  ["모델 데이터에 등록된 출시일입니다.", "This is the release date recorded in the model data."],
  [
    "공식 릴리스일이 아니라 공개 모델 카드의 createdAt 기준입니다.",
    "Based on the public model card's createdAt date, not the official release date.",
  ],
  [
    "서로 다른 GPU를 함께 쓰는 경우 메모리 분할·통신 손실을 보수적으로 반영합니다.",
    "Conservatively accounts for memory partitioning and communication loss when combining different GPUs.",
  ],
  ["예: Qwen/Qwen2.5-1.5B-Instruct", "e.g. Qwen/Qwen2.5-1.5B-Instruct"],
  [
    "위에서 GPU를 선택하고 용도와 우선순위를 고르면 현재 워크로드의 실행 가능한 모델만 추립니다.",
    "Select a GPU above, then choose a purpose and priority to see only runnable models for this workload.",
  ],
  ["VRAM 여유 우선", "VRAM headroom first"],
  ["벤치마크 시트", "Benchmark sheet"],
  ["모델 상세 분석", "Model details"],
  ["모델 비교", "Model comparison"],
  ["자체 평가", "self-reported"],
  ["연동", "integrated"],
  ["평균", "avg"],
  ["통합메모리", "unified memory"],
  ["채굴카드", "mining card"],
  ["VRAM 메모리 맵", "VRAM memory map"],
  ["기타 버퍼", "Other buffers"],
  ["모델 가중치", "Model weights"],
  ["상주 모델/모듈", "Resident model/module"],
  ["런타임 오버헤드", "Runtime overhead"],
  ["여유", "Free"],
  ["시작하기: GPU 선택", "Get started: choose a GPU"],
  ["내 GPU를 선택하면 바로 계산을 시작합니다", "Select your GPU to start calculating"],
  [
    "VRAM과 대역폭을 기준으로 실행 가능한 AI 모델과 예상 속도를 바로 계산합니다.",
    "See runnable AI models and estimated speed based on your VRAM and bandwidth.",
  ],
  ["자주 찾는 GPU", "Popular GPUs"],
  ["다른 GPU 검색", "Search other GPUs"],
  ["예: RTX 4070, A100, M3 Max", "e.g. RTX 4070, A100, M3 Max"],
  ["시작하기", "Get started"],
  ["모델명, GPU, 지표로 검색", "Search by model, GPU, or metric"],
];

// Hangul syllable + jamo range, used to guard dictionary substring matches
// below so we never translate half of a Korean word. Without this guard,
// replacing a short entry like "모델" ("model") inside "모델을"/"모델별" would
// leave a dangling Korean particle glued onto the English word (e.g.
// "Model을"), which reads as broken text rather than a simple missing
// translation.
const HANGUL_RANGE = "\\uAC00-\\uD7A3\\u3131-\\u318E";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileBoundarySafeReplacements(pairs) {
  const hangulStart = new RegExp(`^[${HANGUL_RANGE}]`);
  const hangulEnd = new RegExp(`[${HANGUL_RANGE}]$`);
  // Same idea as the Hangul guard, but for Latin words: without it, a short
  // bare entry like ["임베딩", "Embedding"] reversed for the en→ko direction
  // becomes a plain "Embedding" match with no boundary check, which also
  // matches the "Embedding" prefix inside the longer proper noun "Text
  // Embeddings Inference" -- replacing just the prefix and leaving a
  // dangling "s" behind ("Text 임베딩s Inference"). Guard Latin-letter edges
  // the same way so short entries never eat into a longer English word.
  const latinStart = /^[A-Za-z]/;
  const latinEnd = /[A-Za-z]$/;
  return pairs.map(([from, to]) => {
    const lookbehind = hangulStart.test(from) ? `(?<![${HANGUL_RANGE}])` : latinStart.test(from) ? "(?<![A-Za-z])" : "";
    const lookahead = hangulEnd.test(from) ? `(?![${HANGUL_RANGE}])` : latinEnd.test(from) ? "(?![A-Za-z])" : "";
    return { regex: new RegExp(`${lookbehind}${escapeRegExp(from)}${lookahead}`, "g"), to };
  });
}

function translateDynamicUi(language = "en") {
  const pairs = ENGLISH_UI_REPLACEMENTS.map(([from, to]) => (language === "en" ? [from, to] : [to, from]))
    .sort((a, b) => b[0].length - a[0].length);
  const compiled = compileBoundarySafeReplacements(pairs);
  const replaceText = (value) => {
    // The template/regex rules below run BEFORE the dictionary's boundary-safe
    // substring pass. Several of them embed short Korean words (e.g. "모델",
    // "출처") that also exist as bare dictionary entries; if the dictionary
    // ran first it would consume those words out from under the more
    // specific template match, breaking it. Running templates first avoids
    // that ordering conflict — whatever Korean survives the templates is
    // handled generically by the dictionary afterward.
    let text = value;
    if (language === "en") {
      text = text
        .replace(/가용 VRAM\s+([\d.]+)\s*GB/g, "Available VRAM $1 GB")
        .replace(/RAM\s+([\d.]+)\s*GB/g, "RAM $1 GB")
        .replace(/GPU\s+(\d+)개/g, "GPUs: $1")
        .replace(/(\d+)K\s*·\s*동시\s*(\d+)명\s*·\s*llama\.cpp \/ Ollama\s*·\s*자동 추천/g, "$1K · $2 concurrent · llama.cpp / Ollama · Auto")
        .replace(/질의 (\d+) \+ 문서 (\d+) · 후보 (\d+)개/g, "Query $1 + Document $2 · $3 candidates")
        .replace(/(\d+)단계 빠른 추천/g, "$1-step quick recommendations")
        .replace(/GPU에 맞는 모델 (\d+)개를 바로 추천합니다/g, "Get $1 models recommended for your GPU")
        .replace(/(\d+)순위/g, "Rank $1")
        .replace(/약\s*([\d.]+)~([\d.]+)\s*tok\/s/g, "Approx. $1–$2 tok/s")
        .replace(/VRAM 여유\s*([\d.]+)%/g, "$1% VRAM headroom")
        .replace(/가용 VRAM 안에 들어옴/g, "Fits available VRAM")
        .replace(/한국어 지원/g, "Korean support")
        .replace(/코딩 적합/g, "Good for coding")
        .replace(/추론 태그/g, "Reasoning tag")
        .replace(/모델 (\d+)개/g, "$1 models")
        .replace(/(\d+)개 모델/g, "$1 models")
        .replace(/현재 GPU/g, "Current GPU")
        .replace(/GPU 프리셋/g, "GPU presets")
        .replace(/출처 연결 평가/g, "Cited evaluations")
        .replace(/AI 모델/g, "AI models")
        .replace(/자동 추천/g, "Auto recommendation")
        // Grade label "가능" ("Possible") only when it stands alone as a whole
        // line/value — never mid-sentence, where "가능" usually just means
        // "available/possible" as an ordinary adjective (e.g. "선택 가능").
        .replace(/(^|\n)가능(?=\n|$)/g, "$1Possible")
        .replace(/^(.+) 비교에 추가$/, "Add $1 to compare")
        .replace(/^(.+) 비교에서 제거$/, "Remove $1 from compare")
        .replace(
          /^(.+?) 기준입니다\. 로컬 추론 속도 측정과 분리된 외부 공개 참고값입니다\.(?:\s*출처: (\S+))?$/,
          (_, metric, url) => `Based on ${metric}. External public reference, separate from local speed measurements.${url ? ` Source: ${url}` : ""}`,
        )
        .replace(/속도와 처리량은 오른쪽 추정 처리량 열에서 별도로 표시합니다\./g, "Speed and throughput are shown separately in the estimated throughput column.")
        .replace(/공식 모델 카드나 논문에서 확인되는 (.+?)가 아직 등록되지 않았습니다\./g, "No official $1 has been recorded yet from the model card or paper.")
        .replace(/동일 OCR 정확도 기준의 공개 점수가 아직 등록되지 않았습니다\./g, "No public score using the same OCR accuracy standard has been recorded yet.")
        .replace(/문서 VLM 탭은 OmniDocBench 계열 점수만 같은 열에 표시합니다\./g, "The Document VLM tab only shows OmniDocBench-family scores in this column.")
        .replace(/범용 VLM 탭은 OCRBench v2 계열 점수만 같은 열에 표시합니다\./g, "The General VLM tab only shows OCRBench v2-family scores in this column.")
        .replace(/MTEB 없음/g, "No MTEB")
        .replace(/BEIR\/MIRACL 없음/g, "No BEIR/MIRACL")
        .replace(/공개 점수 없음/g, "No public score")
        .replace(/동일 기준 없음/g, "No matching standard")
        .replace(/(\d+)K 컨텍스트/g, "$1K context")
        .replace(/(\d+K?) 토큰/g, "$1 tokens")
        .replace(/비교 \((\d+)\/(\d+)\)/g, "Compare ($1/$2)")
        .replace(/사용률\s*([\d.]+)%/g, "Utilization $1%")
        .replace(/^현재 (.+·.+) 기준$/gm, "Current: $1")
        .replace(/ · (\d+)개(?![가-힣])/g, " · $1");
    } else {
      text = text
        .replace(/Available VRAM\s+([\d.]+)\s*GB/g, "가용 VRAM $1 GB")
        .replace(/RAM\s+([\d.]+)\s*GB/g, "RAM $1 GB")
        .replace(/GPUs:\s*(\d+)/g, "GPU $1개")
        .replace(/(\d+)K\s*·\s*(\d+) concurrent\s*·\s*llama\.cpp \/ Ollama\s*·\s*Auto/g, "$1K · 동시 $2명 · llama.cpp / Ollama · 자동 추천")
        .replace(/Query (\d+) \+ Document (\d+) · (\d+) candidates/g, "질의 $1 + 문서 $2 · 후보 $3개")
        .replace(/(\d+)-step quick recommendations/g, "$1단계 빠른 추천")
        .replace(/Get (\d+) models recommended for your GPU/g, "GPU에 맞는 모델 $1개를 바로 추천합니다")
        .replace(/Rank (\d+)/g, "$1순위")
        .replace(/Approx\.\s*([\d.]+)–([\d.]+) tok\/s/g, "약 $1~$2 tok/s")
        .replace(/([\d.]+)% VRAM headroom/g, "VRAM 여유 $1%")
        .replace(/Fits available VRAM/g, "가용 VRAM 안에 들어옴")
        .replace(/Korean support/g, "한국어 지원")
        .replace(/Good for coding/g, "코딩 적합")
        .replace(/Reasoning tag/g, "추론 태그")
        .replace(/(\d+) models/g, "모델 $1개")
        .replace(/Current GPU/g, "현재 GPU")
        .replace(/GPU presets/g, "GPU 프리셋")
        .replace(/Cited evaluations/g, "출처 연결 평가")
        .replace(/AI models/g, "AI 모델")
        .replace(/Auto recommendation/g, "자동 추천")
        .replace(/(^|\n)Possible(?=\n|$)/g, "$1가능")
        .replace(/^Add (.+) to compare$/, "$1 비교에 추가")
        .replace(/^Remove (.+) from compare$/, "$1 비교에서 제거")
        .replace(
          /^Based on (.+?)\. External public reference, separate from local speed measurements\.(?:\s*Source: (\S+))?$/,
          (_, metric, url) => `${metric} 기준입니다. 로컬 추론 속도 측정과 분리된 외부 공개 참고값입니다.${url ? ` 출처: ${url}` : ""}`,
        )
        .replace(/Speed and throughput are shown separately in the estimated throughput column\./g, "속도와 처리량은 오른쪽 추정 처리량 열에서 별도로 표시합니다.")
        .replace(/No official (.+?) has been recorded yet from the model card or paper\./g, "공식 모델 카드나 논문에서 확인되는 $1가 아직 등록되지 않았습니다.")
        .replace(/No public score using the same OCR accuracy standard has been recorded yet\./g, "동일 OCR 정확도 기준의 공개 점수가 아직 등록되지 않았습니다.")
        .replace(/The Document VLM tab only shows OmniDocBench-family scores in this column\./g, "문서 VLM 탭은 OmniDocBench 계열 점수만 같은 열에 표시합니다.")
        .replace(/The General VLM tab only shows OCRBench v2-family scores in this column\./g, "범용 VLM 탭은 OCRBench v2 계열 점수만 같은 열에 표시합니다.")
        .replace(/No MTEB/g, "MTEB 없음")
        .replace(/No BEIR\/MIRACL/g, "BEIR/MIRACL 없음")
        .replace(/No public score/g, "공개 점수 없음")
        .replace(/No matching standard/g, "동일 기준 없음")
        .replace(/(\d+)K context/g, "$1K 컨텍스트")
        .replace(/(\d+) tokens/g, "$1 토큰")
        .replace(/Compare \((\d+)\/(\d+)\)/g, "비교 ($1/$2)")
        .replace(/Utilization\s*([\d.]+)%/g, "사용률 $1%")
        .replace(/^Current: (.+)$/gm, "현재 $1 기준");
    }
    text = compiled.reduce((current, { regex, to }) => current.replace(regex, to), text);
    // Cleanup pass: after the dictionary translates the surrounding label to
    // English (e.g. "외부 공개 참고값" → "External public reference"), strip
    // the leftover Korean counter word "개" glued to a trailing count (e.g.
    // "reference 334개" → "reference 334"). Requires a Latin letter right
    // before the number so this never touches standalone Korean option
    // values like "8개" in the settings dropdowns.
    if (language === "en") text = text.replace(/([A-Za-z])\s(\d+)개(?![가-힣])/g, "$1 $2");
    return text;
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    if (node.parentElement?.closest("script,style")) return;
    node.nodeValue = replaceText(node.nodeValue);
  });
  document.querySelectorAll("[placeholder],[aria-label],[title]").forEach((node) => {
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      if (node.hasAttribute(attribute)) node.setAttribute(attribute, replaceText(node.getAttribute(attribute)));
    });
  });
}

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
  document.body.classList.toggle("placement-task-active", placementActive);
  document.body.classList.toggle("finder-task-active", coreTaskMode === "finder");
  document.body.classList.toggle("model-finder-task-active", modelFinderActive);
  document.body.classList.toggle("infra-task-active", infraActive);
  document.querySelectorAll("[data-core-task]").forEach((button) => {
    const active = button.dataset.coreTask === coreTaskMode;
    button.classList.toggle("is-active", active);
    if (button.closest("[role='tablist']")) button.setAttribute("aria-selected", String(active));
  });
  const finderButton = document.querySelector('.core-task-actions [data-core-task="finder"]');
  if (finderButton) {
    finderButton.querySelector("span").textContent = uiText("core.finder.title");
    finderButton.querySelector("small").textContent = uiText("core.finder.note");
  }
  const modelFinderButton = document.querySelector('[data-core-task="modelFinder"]');
  if (modelFinderButton) {
    modelFinderButton.querySelector("span").textContent = uiText("core.modelFinder.title");
    modelFinderButton.querySelector("small").textContent = uiText("core.modelFinder.note");
  }
    const infraButton = document.querySelector('[data-core-task="infra"]');
  if (infraButton) {
    infraButton.querySelector("span").textContent = uiText("core.infra.title");
      infraButton.querySelector("small").textContent = uiText("core.infra.note");
    }
    const placementButton = document.querySelector('[data-core-task="placement"]');
    if (placementButton) {
      placementButton.querySelector("span").textContent = uiText("core.placement.title");
      placementButton.querySelector("small").textContent = uiText("core.placement.note");
    }
  const sttTab = document.querySelector('[data-workload-tab="audioStt"]');
  const ttsTab = document.querySelector('[data-workload-tab="audioTts"]');
  const avatarTab = document.querySelector('[data-workload-tab="avatarGeneration"]');
  if (sttTab) sttTab.textContent = uiText("workload.audioStt");
  if (ttsTab) ttsTab.textContent = uiText("workload.audioTts");
  if (avatarTab) avatarTab.textContent = uiText("workload.avatarGeneration");
  if ($("gpuPlacementPanel")) $("gpuPlacementPanel").hidden = !placementActive;
  if ($("decisionStudio")) $("decisionStudio").hidden = !infraActive;
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
  coreTaskMode = mode === "modelFinder" || mode === "infra" ? mode : "finder";
  refreshCoreTaskUi();
  render();
  if (coreTaskMode === "infra" && typeof renderDecisionStudio === "function") renderDecisionStudio();
  if (coreTaskMode === "modelFinder") $("gpuAdvisorPanel")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  if (coreTaskMode === "infra") $("decisionStudio")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

function setUiLanguage(language) {
  uiLanguage = language === "en" ? "en" : "ko";
  try { window.localStorage?.setItem("ai-hardware-fit-language", uiLanguage); } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("lang", uiLanguage);
  window.history.replaceState({}, "", url);
  document.documentElement.lang = uiLanguage;
  applyV15Translations();
  const dictionary = UI_TRANSLATIONS[uiLanguage];
  const selectors = [".header-nav a", ".eyebrow", "h1", "#settingsToggle", "#simpleOpenExpert", "[data-share-link]", "[data-download-share-card]", "[data-share-3060]", ".primary-gpu-control > .field > span", ".section-kicker"];
  document.querySelectorAll(selectors.join(",")).forEach((node) => {
    const source = node.dataset.i18nSource || node.textContent.trim();
    node.dataset.i18nSource = source;
    if (dictionary[source]) node.textContent = dictionary[source];
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
  // Same reasoning for the multi-GPU placement result, its 3-plan comparison,
  // and the run-command/docker-compose export — all free-form sentences (and
  // the export panel's <pre> code blocks) that only re-running the real
  // render functions can translate correctly.
  if ($("gpuPlacementResult")?.innerHTML.trim() && placementSelectedKeys.size) runGpuPlacement();
  else if (!$("gpuPlacementPlanCompare")?.hidden) comparePlacementPlans();
  translatePresetOptionLabels(uiLanguage);
  translateDynamicUi(uiLanguage);
  // Refresh the theme-toggle button labels ("라이트"/"다크" vs "Light"/"Dark"),
  // which depend on uiLanguage but live outside the dictionary sweep above.
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

function ensureGpuAdvisorPanel() {
  if (!$("benchmarkDashboard") && $("benchmarkSheet")) {
    const dashboard = document.createElement("section");
    dashboard.id = "benchmarkDashboard";
    dashboard.className = "benchmark-dashboard";
    dashboard.setAttribute("aria-labelledby", "benchmarkDashboardTitle");
    document.querySelector(".app-shell")?.appendChild(dashboard);
  }
  if (!$("mediaOptimization") && $("mediaOffload")) {
    const field = document.createElement("label");
    field.className = "field media-generation-field";
    field.innerHTML = `<span id="mediaOptimizationLabel">생성 최적화</span><select id="mediaOptimization"><option value="standard">기본</option><option value="attention">Sage/Flash Attention</option><option value="cache">TeaCache</option><option value="combined">Attention + TeaCache</option></select>`;
    $("mediaOffload").closest(".field")?.insertAdjacentElement("afterend", field);
  }
  if ($("gpuAdvisorPanel")) return;
  const results = $("resultsPanel");
  if (!results) return;
  const panel = document.createElement("section");
  panel.className = "gpu-advisor-panel";
  panel.id = "gpuAdvisorPanel";
  panel.hidden = true;
  panel.setAttribute("aria-labelledby", "gpuAdvisorTitle");
  panel.innerHTML = `
    <div class="gpu-insights-head">
      <div>
        <span class="section-kicker">GPU ADVISOR</span>
        <h2 id="gpuAdvisorTitle"></h2>
        <p id="gpuAdvisorDescription"></p>
      </div>
    </div>
    <div class="gpu-advisor-controls">
      <label class="field"><span id="advisorModelCategoryLabel"></span><select id="advisorModelCategory"></select></label>
      <label class="field advisor-model-search-field"><span id="advisorModelSearchLabel"></span><input id="advisorModelSearch" type="search" autocomplete="off"></label>
      <label class="field advisor-model-select-field"><span id="advisorModelLabel"></span><select id="advisorModel"></select><small id="advisorModelCount" aria-live="polite"></small></label>
      <label class="field"><span id="advisorBudgetLabel"></span><input id="advisorBudgetUsd" type="number" min="0" max="100000" step="50" value="2000"></label>
      <label class="field"><span id="advisorCurrentPriceLabel"></span><input id="advisorCurrentPriceUsd" type="number" min="0" max="100000" step="10" value="0"></label>
      <label class="field"><span id="advisorElectricityLabel"></span><input id="advisorElectricityRate" type="number" min="0" max="5" step="0.01" value="0.15"></label>
      <label class="field"><span id="advisorHoursLabel"></span><input id="advisorHoursMonth" type="number" min="1" max="744" step="1" value="120"></label>
      <label class="field"><span id="advisorVendorLabel"></span><select id="advisorVendor"><option value="all">All</option><option>NVIDIA</option><option>AMD</option><option>Intel</option><option>Apple</option></select></label>
      <label class="field"><span id="advisorFormFactorLabel"></span><select id="advisorFormFactor"><option value="all">All</option><option value="desktop">Desktop</option><option value="laptop">Laptop</option><option value="datacenter">Data center</option><option value="integrated">Unified memory</option></select></label>
    </div>
    <div class="gpu-advisor-result" id="gpuAdvisorResult" role="region" aria-live="polite"></div>
  `;
  results.parentNode.insertBefore(panel, results);
  // Model results belong directly below the workload tabs. GPU details are
  // supporting information, and Advisor is exposed as its own top-level task.
  const hardwarePanel = $("hardwarePanel");
  if (hardwarePanel?.parentNode === results.parentNode) {
    hardwarePanel.insertAdjacentElement("afterend", results);
  }
  $("advisorModelCategory").innerHTML = ADVISOR_MODEL_CATEGORIES
    .map((category) => `<option value="${category.id}">${escapeHtml(category.en)}</option>`)
    .join("");
  refreshAdvisorModelOptions();
}

const ADVISOR_MODEL_CATEGORIES = [
  { id: "all", ko: "전체", en: "All" },
  { id: "llm", ko: "LLM", en: "LLM" },
  { id: "vlm", ko: "VLM", en: "VLM" },
  { id: "image", ko: "이미지 생성", en: "Image generation" },
  { id: "video", ko: "비디오 생성", en: "Video generation" },
  { id: "avatar-generation", ko: "아바타·립싱크", en: "Avatar / lip sync" },
  { id: "embedding", ko: "임베딩", en: "Embedding" },
  { id: "reranker", ko: "리랭커", en: "Reranker" },
  { id: "ocr", ko: "OCR", en: "OCR" },
  { id: "stt", ko: "음성 인식", en: "Speech to text" },
  { id: "tts", ko: "음성 합성", en: "Text to speech" },
];

function getAdvisorModelCategory(model) {
  if (!model.type || model.type === "generative") return "llm";
  if (model.type === "document-vlm" || model.type === "general-vlm") return "vlm";
  if (model.type === "image-generation") return "image";
  if (model.type === "video-generation") return "video";
  if (model.type === "avatar-generation") return "avatar-generation";
  if (model.type === "ocr-pipeline") return "ocr";
  if (model.type === "audio-stt") return "stt";
  if (model.type === "audio-tts") return "tts";
  return model.type;
}

function getAdvisorModelSearchText(model) {
  return [
    model.name,
    model.provider,
    model.publisher,
    model.family,
    model.type,
    ...(Array.isArray(model.tags) ? model.tags : []),
  ].filter(Boolean).join(" ").normalize("NFKC").toLocaleLowerCase();
}

function refreshAdvisorModelOptions(preferredKey = $("advisorModel")?.value) {
  const select = $("advisorModel");
  if (!select) return [];
  const category = $("advisorModelCategory")?.value || "all";
  const tokens = ($("advisorModelSearch")?.value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const models = getAllModels().filter((model) => {
    if (category !== "all" && getAdvisorModelCategory(model) !== category) return false;
    const searchText = getAdvisorModelSearchText(model);
    return tokens.every((token) => searchText.includes(token));
  });
  select.innerHTML = models
    .map((model) => `<option value="${escapeAttr(modelKey(model))}">${escapeHtml(model.name)}</option>`)
    .join("");
  if (preferredKey && models.some((model) => modelKey(model) === preferredKey)) select.value = preferredKey;
  select.disabled = models.length === 0;
  const count = $("advisorModelCount");
  if (count) count.textContent = uiLanguage === "en" ? `${models.length} models` : `${models.length}개 모델`;
  return models;
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
  return (
    presets.find((gpu) => gpu.name === trimmed) ||
    presets.find((gpu) => gpu.name.toLowerCase() === trimmed.toLowerCase()) ||
    presets.find((gpu) => [gpu.id, gpu.name, ...(gpu.aliases || [])].some((value) => normalizeGpuSearchText(value) === normalized)) ||
    presets.find((gpu) => [gpu.name, ...(gpu.aliases || [])].some((value) => normalizeGpuSearchText(value).includes(normalized))) ||
    null
  );
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
  const missing = raw.length >= 2 && !findGpuPresetByName(raw, false);
  target.hidden = !missing;
  const requestLink = target.querySelector("[data-request-gpu]");
  if (requestLink) requestLink.href = gpuRequestUrl(raw);
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
      $("simplePurpose").value = "general";
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

let gpuInventoryRows = [
  { id: "gpu-row-1", presetId: "rtx4090-24", count: 1 },
];
let gpuInventoryIdCounter = 1;
let gpuInventorySearchRows = new Set();
let placementInventorySeeded = false;
let placementBuilderStarted = false;
let placementModelBrowserOpened = false;
let placementActiveType = "generative";
let placementSearchQuery = "";
let placementSelectedKeys = new Set();
let placementStrategy = "balanced";
// "pipeline": one shared request flows through every selected model, so the
// model with the least headroom sets the pace for all of them (the app's
// original, only behavior). "independent": each model is its own service
// called separately — show each model's own concurrency instead of
// collapsing to one shared minimum. "alternate": only one model is ever
// loaded at a time, so models never actually share VRAM — each is
// evaluated against a whole GPU on its own (see computeAlternatePlacement).
let placementUsageMode = "independent";
let placementTargetN = null;
let placementPrimaryKey = "";
let placementMinHeadroomPct = 15;
let placementAllowQuantChange = true;
let placementAllowContextReduction = false;
let placementAllowReplication = false;
const placementModelConfigs = new Map();
let lastPlacementRun = null;
const placementAdjustmentRegistry = new Map();

const PLACEMENT_DEFAULT_WORKLOADS = {
  embedding: { type: "embedding", inputTokens: 384, batchSize: 32, maxBatchTokens: 16384, runtime: "tei" },
  reranker: { type: "reranker", queryTokens: 64, docTokens: 512, candidates: 40, batchSize: 16, runtime: "tei" },
  vision: { width: 1654, height: 2339, batchSize: 1, featureSet: "basic" },
};

const PLACEMENT_STARTER_PRESETS = {
  rag: {
    usage: "pipeline",
    strategy: "balanced",
    target: 4,
    modelNames: ["Qwen3 4B", "Qwen/Qwen3-Embedding-0.6B", "Qwen/Qwen3-Reranker-0.6B"],
  },
  document: {
    usage: "pipeline",
    strategy: "balanced",
    target: 2,
    modelNames: ["Qwen3 4B", "allenai/olmOCR-2-7B-1025", "PP-OCRv6 Medium", "Qwen/Qwen3-Embedding-0.6B"],
  },
  "multi-llm": {
    usage: "independent",
    strategy: "throughput",
    target: 4,
    modelNames: ["Llama 3.2 3B Instruct", "Qwen3 4B", "SmolLM2 1.7B Instruct"],
  },
  "voice-avatar": {
    usage: "pipeline",
    strategy: "throughput",
    target: 2,
    modelNames: ["Whisper small", "Qwen3 4B", "Kokoro-82M", "TMElyralab/MuseTalk 1.5"],
  },
};

function allPlacementModels() {
  return [...GENERATIVE_MODELS, ...EMBEDDING_MODELS, ...RERANKER_MODELS, ...OCR_MODELS, ...AUDIO_MODELS];
}

function clearPlacementResults() {
  lastPlacementRun = null;
  ["gpuPlacementResult", "gpuPlacementPlanCompare", "gpuPlacementDiagnosis", "gpuPlacementExport", "placementResultOverview"].forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.innerHTML = "";
    if (id !== "gpuPlacementResult" && id !== "placementResultOverview") element.hidden = true;
  });
  if ($("gpuPlacementBaseline")) {
    $("gpuPlacementBaseline").innerHTML = "";
    $("gpuPlacementBaseline").hidden = true;
  }
  if ($("placementResultStage")) $("placementResultStage").hidden = true;
}

function applyPlacementStarter(starterId) {
  placementBuilderStarted = true;
  placementModelBrowserOpened = false;
  if (starterId === "custom") {
    renderPlacementWorkspaceUi();
    renderPlacementModelList();
    syncUrlState();
    return;
  }
  const preset = PLACEMENT_STARTER_PRESETS[starterId];
  if (!preset) return;
  const models = allPlacementModels();
  placementSelectedKeys.clear();
  placementModelConfigs.clear();
  preset.modelNames.forEach((name) => {
    const model = models.find((candidate) => candidate.name === name);
    if (!model) return;
    const key = modelKey(model);
    placementSelectedKeys.add(key);
    getPlacementModelConfig(key);
  });
  placementUsageMode = preset.usage;
  placementStrategy = preset.strategy;
  placementTargetN = preset.target;
  placementPrimaryKey = "";
  placementActiveType = "generative";
  clearPlacementResults();
  renderPlacementModelList();
  renderPlacementSelectedChips();
  renderPlacementPrimarySelect();
  setPlacementUsageMode(placementUsageMode);
  setPlacementStrategy(placementStrategy);
  const target = $("placementTargetConcurrency");
  if (target) {
    target.value = String(preset.target);
    $("placementTargetConcurrencyCustom").value = String(preset.target);
  }
  renderPlacementWorkspaceUi();
  syncUrlState();
}

function renderPlacementWorkspaceUi() {
  const welcome = $("placementWelcome");
  const builder = $("placementBuilder");
  if (!welcome || !builder) return;
  const showBuilder = placementBuilderStarted || placementSelectedKeys.size > 0;
  welcome.hidden = showBuilder;
  builder.hidden = !showBuilder;
  const resultReady = Boolean(lastPlacementRun);
  if ($("placementResultStage")) $("placementResultStage").hidden = !resultReady;
  document.querySelectorAll(".placement-stepper li").forEach((item, index) => {
    const step = index + 1;
    const ready = step === 1
      || (step === 2 && gpuInventoryRows.length > 0)
      || (step === 3 && placementSelectedKeys.size > 0)
      || (step === 4 && resultReady);
    item.classList.toggle("is-ready", ready);
  });
}

function renderGpuInventory() {
  const container = $("gpuInventoryList");
  if (!container) return;
  container.innerHTML = gpuInventoryRows
    .map((row) => {
      const isSearch = gpuInventorySearchRows.has(row.id);
      return `
        <div class="gpu-inventory-row">
          <div class="field-control-pair${isSearch ? " is-custom" : ""}">
            <select class="gpu-inventory-preset" data-row-id="${escapeAttr(row.id)}" aria-label="GPU 종류">
              ${GPU_PRESETS.filter((gpu) => gpu.id !== "custom")
                .map(
                  (gpu) => `<option value="${escapeAttr(gpu.id)}" ${!isSearch && gpu.id === row.presetId ? "selected" : ""}>${escapeHtml(gpu.name)}</option>`,
                )
                .join("")}
              <option value="__search__" ${isSearch ? "selected" : ""}>GPU 모델명 검색</option>
            </select>
            <input type="text" class="gpu-inventory-preset-search" list="gpuFixedPresetOptions" data-row-id="${escapeAttr(row.id)}" autocomplete="off" aria-label="GPU 종류 검색" placeholder="GPU 모델명 검색" ${isSearch ? "" : "hidden"} />
          </div>
          <input type="number" class="gpu-inventory-count" data-row-id="${escapeAttr(row.id)}" min="1" max="8" step="1" value="${row.count}" aria-label="이 GPU 개수" />
          <button type="button" class="icon-button gpu-inventory-remove" data-row-id="${escapeAttr(row.id)}" aria-label="GPU 제거" ${gpuInventoryRows.length <= 1 ? "disabled" : ""}>×</button>
        </div>
      `;
    })
    .join("");
}

function addGpuInventoryRow() {
  gpuInventoryIdCounter += 1;
  gpuInventoryRows.push({ id: `gpu-row-${gpuInventoryIdCounter}`, presetId: "rtx4090-24", count: 1 });
  placementInventorySeeded = true;
  clearPlacementResults();
  renderGpuInventory();
  renderPlacementSelectedChips();
  renderPlacementWorkspaceUi();
  syncUrlState();
}

function removeGpuInventoryRow(rowId) {
  if (gpuInventoryRows.length <= 1) return;
  gpuInventorySearchRows.delete(rowId);
  gpuInventoryRows = gpuInventoryRows.filter((row) => row.id !== rowId);
  placementInventorySeeded = true;
  clearPlacementResults();
  for (const config of placementModelConfigs.values()) {
    if (config.pinnedGpu !== "" && Number(config.pinnedGpu) >= gpuInventoryRows.length) config.pinnedGpu = "";
  }
  renderGpuInventory();
  renderPlacementSelectedChips();
  renderPlacementWorkspaceUi();
  syncUrlState();
}

function updateGpuInventoryRow(rowId, field, value) {
  const row = gpuInventoryRows.find((item) => item.id === rowId);
  if (!row) return;
  if (field === "presetId") row.presetId = value;
  if (field === "count") row.count = clampNumber(value, 1, 8, 1);
  placementInventorySeeded = true;
  clearPlacementResults();
  syncUrlState();
}

function getModelsForPlacementType(type) {
  if (type === "embedding") return EMBEDDING_MODELS;
  if (type === "reranker") return RERANKER_MODELS;
  if (type === "vision") return OCR_MODELS;
  if (type === "avatar-generation") return AVATAR_GENERATION_MODELS;
  if (type === "audio-stt") return AUDIO_STT_MODELS;
  if (type === "audio-tts") return AUDIO_TTS_MODELS;
  return GENERATIVE_MODELS;
}

function getPlacementPrecisions(model, precisionOptions) {
  const supportedIds = new Set(model.precisions || []);
  return precisionOptions.filter(
    (precision) => precision.id !== "auto" && (!supportedIds.size || supportedIds.has(precision.id)),
  );
}

function getPlacementWorkload(model) {
  if (model.type === "embedding") {
    return {
      ...PLACEMENT_DEFAULT_WORKLOADS.embedding,
      inputTokens: Math.min(PLACEMENT_DEFAULT_WORKLOADS.embedding.inputTokens, model.maxTokens || Infinity),
    };
  }
  if (model.type === "reranker") {
    const maxPairTokens = Math.max(2, (model.maxTokens || 579) - 3);
    const queryTokens = Math.max(1, Math.min(64, Math.floor(maxPairTokens * 0.12)));
    return {
      ...PLACEMENT_DEFAULT_WORKLOADS.reranker,
      queryTokens,
      docTokens: Math.max(1, maxPairTokens - queryTokens),
    };
  }
  if (isVisionModel(model)) {
    return { type: model.type, ...PLACEMENT_DEFAULT_WORKLOADS.vision };
  }
  if (model.type === "audio-stt" || model.type === "audio-tts") {
    return { type: model.type };
  }
  return null;
}

function renderPlacementModelList() {
  const container = $("placementModelList");
  if (!container) return;
  const query = placementSearchQuery.trim().toLowerCase();
  if (!placementModelBrowserOpened && !query) {
    container.innerHTML = `
      <div class="placement-model-gate">
        <strong>${uiLanguage === "en" ? "The full catalog stays hidden until you need it." : "필요할 때만 전체 모델 목록을 여세요."}</strong>
        <span>${uiLanguage === "en" ? "Search by model name above, or choose a workload category to browse." : "위 검색창에 모델명을 입력하거나 워크로드 종류를 선택해 탐색하세요."}</span>
        <button type="button" class="ghost-button" data-open-placement-browser>${uiLanguage === "en" ? "Browse this category" : "현재 종류 모델 보기"}</button>
      </div>
    `;
    return;
  }
  const pool = getModelsForPlacementType(placementActiveType);
  const filtered = query
    ? pool.filter((model) =>
        `${model.name} ${model.maker || ""} ${(model.tags || []).join(" ")}`.toLowerCase().includes(query),
      )
    : pool;

  if (!filtered.length) {
    container.innerHTML = `<p class="gpu-placement-empty">검색 결과가 없습니다.</p>`;
    return;
  }

  container.innerHTML = filtered
    .slice(0, 150)
    .map((model) => {
      const key = modelKey(model);
      const checked = placementSelectedKeys.has(key);
      return `
        <label class="placement-model-item ${checked ? "is-checked" : ""}">
          <input type="checkbox" data-model-key="${escapeAttr(key)}" ${checked ? "checked" : ""} />
          <span>${escapeHtml(model.name)}</span>
          <small>${escapeHtml(model.maker || "")}${model.params ? ` · ${model.params}B` : ""}</small>
        </label>
      `;
    })
    .join("");
}

function getPlacementModelConfig(key) {
  if (!placementModelConfigs.has(key)) {
    placementModelConfigs.set(key, {
      requestShare: 100,
      minConcurrency: 1,
      pinnedGpu: "",
      preferredSetting: "auto",
      contextTokens: null,
      allowReplica: true,
    });
  }
  return placementModelConfigs.get(key);
}

function renderPlacementSettingOptions(model, config) {
  const options = getPlacementBaselineOptions(model, { ...getHardware(), concurrency: 1 });
  return [
    `<option value="auto">${uiLanguage === "en" ? "Recommended / auto" : "권장 설정 / 자동"}</option>`,
    ...options.map((option) => (
      `<option value="${escapeAttr(option.setting.id)}" ${config.preferredSetting === option.setting.id ? "selected" : ""}>${escapeHtml(option.label)}</option>`
    )),
  ].join("");
}

function renderPlacementSelectedChips() {
  const container = $("placementModelSelected");
  if (!container) return;
  if (!placementSelectedKeys.size) {
    container.innerHTML = `<p class="gpu-placement-empty">아직 선택된 모델이 없습니다.</p>`;
    return;
  }
  container.innerHTML = [...placementSelectedKeys]
    .map((key) => {
      const model = getModelByKey(key);
      if (!model) return "";
      const config = getPlacementModelConfig(key);
      const isGenerative = !model.type || model.type === "generative";
      const contextValue = config.contextTokens || getHardware().context || 8192;
      return `
        <details class="placement-model-config" data-placement-config-key="${escapeAttr(key)}">
          <summary>
            <span>${escapeHtml(model.name)}</span>
            <small>${escapeHtml(model.maker || "")}</small>
            <button type="button" data-remove-placement-key="${escapeAttr(key)}" aria-label="${uiLanguage === "en" ? "Remove selection" : "선택 해제"}">×</button>
          </summary>
          <div class="placement-model-config-grid">
            <label class="field">
              <span>${uiLanguage === "en" ? "Preferred setting" : "선호 양자화/정밀도"}</span>
              <select data-placement-config-field="preferredSetting">${renderPlacementSettingOptions(model, config)}</select>
            </label>
            <label class="field">
              <span>${uiLanguage === "en" ? "Request share (%)" : "요청 비율 (%)"}</span>
              <input type="number" min="1" max="1000" step="1" value="${config.requestShare}" data-placement-config-field="requestShare" ${placementUsageMode === "independent" ? "" : "disabled"} />
            </label>
            <label class="field">
              <span>${uiLanguage === "en" ? "Minimum concurrency" : "최소 동시 접속"}</span>
              <input type="number" min="0" max="256" step="1" value="${config.minConcurrency}" data-placement-config-field="minConcurrency" />
            </label>
            <label class="field">
              <span>${uiLanguage === "en" ? "Pin to GPU" : "GPU 고정"}</span>
              <select data-placement-config-field="pinnedGpu">
                <option value="">${uiLanguage === "en" ? "No pin" : "고정 안 함"}</option>
                ${gpuInventoryRows.map((row, index) => {
                  const preset = GPU_PRESETS.find((gpu) => gpu.id === row.presetId);
                  return `<option value="${index}" ${String(config.pinnedGpu) === String(index) ? "selected" : ""}>GPU ${index + 1}${preset ? ` · ${escapeHtml(preset.name)}` : ""}</option>`;
                }).join("")}
              </select>
            </label>
            ${isGenerative ? `
              <label class="field">
                <span>${uiLanguage === "en" ? "Preferred context" : "선호 컨텍스트"}</span>
                <input type="number" min="2048" max="${Math.max(2048, model.maxContext || 1048576)}" step="1024" value="${contextValue}" data-placement-config-field="contextTokens" />
              </label>
            ` : ""}
            <label class="placement-model-replica">
              <input type="checkbox" data-placement-config-field="allowReplica" ${config.allowReplica ? "checked" : ""} ${placementUsageMode === "independent" ? "" : "disabled"} />
              <span>${uiLanguage === "en" ? "Allow replicas for this model" : "이 모델 복제 허용"}</span>
            </label>
          </div>
        </details>
      `;
    })
    .join("");
}

function togglePlacementModel(key) {
  if (placementSelectedKeys.has(key)) {
    placementSelectedKeys.delete(key);
    placementModelConfigs.delete(key);
  } else {
    placementSelectedKeys.add(key);
    getPlacementModelConfig(key);
  }
  clearPlacementResults();
  renderPlacementModelList();
  renderPlacementSelectedChips();
  renderPlacementPrimarySelect();
  renderPlacementWorkspaceUi();
  syncUrlState();
}

// Keeps the "주 모델" dropdown in sync with whatever's currently selected
// for placement — options are rebuilt from placementSelectedKeys every call,
// and the previous choice is kept only if that model is still selected.
function renderPlacementPrimarySelect() {
  const select = $("placementPrimaryModel");
  if (!select) return;
  const placeholder = uiLanguage === "en" ? "None" : "지정 안 함";
  const keys = [...placementSelectedKeys];
  if (placementPrimaryKey && !keys.includes(placementPrimaryKey)) placementPrimaryKey = "";
  select.innerHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...keys.map((key) => {
      const model = getModelByKey(key);
      return model ? `<option value="${escapeAttr(key)}">${escapeHtml(model.name)}</option>` : "";
    }),
  ].join("");
  select.value = placementPrimaryKey;
}

function setPlacementStrategy(strategy) {
  placementStrategy = ["compact", "throughput", "primary"].includes(strategy) ? strategy : "balanced";
  if (placementStrategy === "primary" && !placementPrimaryKey && placementSelectedKeys.size) {
    placementPrimaryKey = [...placementSelectedKeys][0];
    renderPlacementPrimarySelect();
  }
  document.querySelectorAll("[data-placement-strategy]").forEach((button) => {
    const isActive = button.dataset.placementStrategy === placementStrategy;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  // Re-run immediately if a result is already showing, so switching the
  // toggle updates the placement without a second click on "배치 계산".
  if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
  else syncUrlState();
}

const PLACEMENT_USAGE_HINTS = {
  pipeline: {
    ko: "선택한 모델들이 하나로 이어져 요청 한 건을 함께 처리한다고 가정합니다. 가장 여유가 적은 모델이 전체 처리 속도를 정합니다.",
    en: "Assumes the selected models form a single pipeline handling one request together — whichever model has the least headroom sets the pace for all of them.",
  },
  independent: {
    ko: "각 모델을 서로 다른 사용자가 독립적으로 호출하는 별도 서비스로 간주합니다. 하나의 공통 기준 대신 모델별 동시 접속 여유를 각각 보여줍니다.",
    en: "Treats each model as a separate service called independently — shows each model's own concurrency headroom instead of one shared number.",
  },
  alternate: {
    ko: "한 번에 모델 하나만 올려서 교체해가며 쓴다고 가정합니다. 모델끼리 VRAM을 나눠 쓰지 않고, 각자 GPU 전체를 기준으로 계산합니다.",
    en: "Assumes only one model is loaded at a time and you swap between them — each model is evaluated against a whole GPU on its own, without sharing VRAM with the others.",
  },
};

function setPlacementUsageMode(mode) {
  placementUsageMode = ["pipeline", "independent", "alternate"].includes(mode) ? mode : "independent";
  document.querySelectorAll("[data-placement-usage]").forEach((button) => {
    const isActive = button.dataset.placementUsage === placementUsageMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  const hintEl = $("gpuPlacementUsageHint");
  if (hintEl) hintEl.textContent = PLACEMENT_USAGE_HINTS[placementUsageMode][uiLanguage === "en" ? "en" : "ko"];
  const replicationControl = $("placementAllowReplication");
  if (replicationControl) {
    replicationControl.disabled = placementUsageMode !== "independent";
    replicationControl.closest("label")?.classList.toggle("is-disabled", replicationControl.disabled);
  }
  renderPlacementSelectedChips();
  if ($("gpuPlacementResult")?.innerHTML.trim()) runGpuPlacement();
  else syncUrlState();
}

function setPlacementActiveType(type) {
  placementActiveType = type;
  placementModelBrowserOpened = true;
  document.querySelectorAll("[data-placement-type]").forEach((button) => {
    const isActive = button.dataset.placementType === type;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  renderPlacementModelList();
}

function getPlacementBaselineOptions(model, hardware) {
  if (model.type === "audio-stt" || model.type === "audio-tts") {
    const estimate = estimateAudioModel(model, { ...hardware, concurrency: 1 });
    return [{
      setting: { id: "fp16", label: "FP16", rank: 4 },
      label: "FP16",
      requiredGb: estimate.requiredGb,
    }];
  }
  if (model.type === "embedding") {
    const workload = getPlacementWorkload(model);
    return getPlacementPrecisions(model, ENCODER_PRECISIONS)
      .map((precision) => ({
        setting: precision,
        label: precision.label,
        requiredGb: estimateEncoderWithPrecision(model, hardware, workload, precision).requiredGb,
      }))
      .sort((a, b) => a.requiredGb - b.requiredGb);
  }
  if (model.type === "reranker") {
    const workload = getPlacementWorkload(model);
    return getPlacementPrecisions(model, ENCODER_PRECISIONS)
      .map((precision) => ({
        setting: precision,
        label: precision.label,
        requiredGb: estimateRerankerWithPrecision(model, hardware, workload, precision).requiredGb,
      }))
      .sort((a, b) => a.requiredGb - b.requiredGb);
  }
  if (isVisionModel(model)) {
    const workload = getPlacementWorkload(model);
    return getPlacementPrecisions(model, OCR_PRECISIONS)
      .map((precision) => ({
        setting: precision,
        label: precision.label,
        requiredGb: estimateVisionWithPrecision(model, hardware, workload, precision).requiredGb,
      }))
      .sort((a, b) => a.requiredGb - b.requiredGb);
  }
  const singleUserHardware = { ...hardware, concurrency: 1 };
  return QUANTS
    .filter((quant) => quant.id !== "auto")
    .map((quant) => ({
      setting: quant,
      label: quant.label,
      requiredGb: estimateWithQuant(model, quant, singleUserHardware).requiredGb,
    }))
    .sort((a, b) => a.requiredGb - b.requiredGb);
}

function getPlacementCapacity(model, setting, hardware, budgetGb) {
  if (!model.type || model.type === "generative") {
    return { kind: "concurrency", ...computeConcurrencyBounds(model, setting, { ...hardware, concurrency: 1 }, budgetGb) };
  }
  const budgetHardware = { ...hardware, availableVram: budgetGb, baseEffectiveVram: budgetGb };
  if (model.type === "audio-stt" || model.type === "audio-tts") {
    const estimate = estimateAudioModel(model, budgetHardware);
    return { kind: "throughput", unit: "× realtime", value: estimate.speed };
  }
  if (model.type === "embedding") {
    const estimate = estimateEncoderWithPrecision(model, budgetHardware, getPlacementWorkload(model), setting);
    return { kind: "throughput", unit: "doc/s", value: estimate.speed, tokenUnit: "tok/s", tokenValue: estimate.throughput };
  }
  if (model.type === "reranker") {
    const estimate = estimateRerankerWithPrecision(model, budgetHardware, getPlacementWorkload(model), setting);
    return { kind: "throughput", unit: "pair/s", value: estimate.speed };
  }
  const workload = getPlacementWorkload(model);
  const estimate = estimateVisionWithPrecision(model, budgetHardware, workload, setting);
  return { kind: "throughput", unit: "page/s", value: estimate.speed };
}

function buildGpuPlacementHardware(baseHardware, gpu, availableVram) {
  const { preset, count, capacityGb } = gpu;
  const compute = estimateHardwareCompute(preset, preset.bandwidth);
  const computeTotal = Object.fromEntries(
    Object.entries(compute).map(([key, value]) => [key, value * count]),
  );

  return {
    ...baseHardware,
    vram: preset.vram,
    primaryCount: count,
    secondaryCount: 0,
    count,
    ram: preset.ram,
    bandwidth: preset.bandwidth,
    reservedVram: 0,
    safetyMarginGb: 0,
    totalVram: preset.vram * count,
    baseEffectiveVram: capacityGb,
    availableVram,
    preset,
    secondaryPreset: null,
    heterogeneous: false,
    crossVendor: false,
    shardingEfficiency: count > 1 ? 0.92 : 1,
    aggregateBandwidth: preset.bandwidth * count,
    compute,
    computeTotal,
  };
}

// strategy "balanced" (default) spreads models across GPUs so remaining VRAM
// stays even (worst-fit: for each model, pick the GPU that has the MOST
// leftover room after placing it) — this avoids the "GPU 1 crammed full,
// GPU 2 sitting mostly empty" outcome that a naive tight-pack produces.
// strategy "compact" keeps the previous best-fit behavior (minimize
// leftover), which packs more models onto fewer GPUs at the cost of one GPU
// running close to its limit while another goes unused ("모델 보존형" — most
// likely to fit every selected model somewhere).
// strategy "throughput" picks, for each model, whichever available GPU
// would actually give IT the highest recommended concurrency/throughput
// right now (a real capacity read via buildGpuPlacementHardware +
// getPlacementCapacity, not just a leftover-VRAM proxy) — favors total
// output over an even spread or a tight pack.
function computeGreedyGpuPlacement(gpuRows, modelKeys, strategy = "balanced", primaryKey = "") {
  const hardwareBase = getHardware();
  const singleUserHardware = { ...hardwareBase, concurrency: 1 };

  const gpus = gpuRows.map((row, index) => {
    const preset = GPU_PRESETS.find((gpu) => gpu.id === row.presetId) || GPU_PRESETS[0];
    const count = clampNumber(row.count, 1, 8, 1);
    const capacityGb = preset.vram * count * 0.92; // 예약분/오버헤드 여유 반영
    return {
      index,
      preset,
      count,
      capacityGb,
      remaining: capacityGb,
      placements: [],
    };
  });

  const models = modelKeys.map((key) => getModelByKey(key)).filter(Boolean);

  const modelOptions = models.map((model) => {
    const options = getPlacementBaselineOptions(model, singleUserHardware);
    return { model, options, bestRequiredGb: options[0]?.requiredGb ?? Infinity };
  });

  // 가장 큰(무거운) 모델부터 배치해야 나중에 자투리 공간 낭비가 줄어듭니다 (Decreasing).
  modelOptions.sort((a, b) => b.bestRequiredGb - a.bestRequiredGb);

  // 주 모델이 지정된 경우, 크기 순서와 무관하게 맨 먼저 배치해 GPU 중 가장
  // 여유가 많은 곳을 우선적으로 차지하도록 합니다 (다른 모델들이 그 뒤를 채움).
  if (primaryKey) {
    const primaryIndex = modelOptions.findIndex((entry) => modelKey(entry.model) === primaryKey);
    if (primaryIndex > 0) {
      const [primaryEntry] = modelOptions.splice(primaryIndex, 1);
      modelOptions.unshift(primaryEntry);
    }
  }

  const unplaced = [];
  for (const { model, options } of modelOptions) {
    const isPrimary = primaryKey && modelKey(model) === primaryKey;
    let bestChoice = null;
    for (const gpu of gpus) {
      const fit = [...options].reverse().find((option) => option.requiredGb <= gpu.remaining);
      if (!fit) continue;
      const leftover = gpu.remaining - fit.requiredGb;
      // The primary model always goes on whichever GPU currently has the
      // most room, regardless of strategy — everyone else still follows the
      // chosen strategy's scoring rule (higher score always wins below).
      let score;
      if (isPrimary) {
        score = leftover;
      } else if (strategy === "compact") {
        score = -leftover;
      } else if (strategy === "throughput") {
        const hw = buildGpuPlacementHardware(singleUserHardware, gpu, gpu.remaining);
        const capacity = getPlacementCapacity(model, fit.setting, hw, gpu.remaining);
        score = capacity.kind === "concurrency" ? capacity.recommendedN : capacity.value;
      } else {
        score = leftover;
      }
      if (!bestChoice || score > bestChoice.score) {
        bestChoice = { gpu, setting: fit.setting, label: fit.label, requiredGb: fit.requiredGb, leftover, score };
      }
    }
    if (bestChoice) {
      bestChoice.gpu.remaining -= bestChoice.requiredGb;
      bestChoice.gpu.placements.push({ model, setting: bestChoice.setting, label: bestChoice.label, requiredGb: bestChoice.requiredGb, isPrimary });
    } else {
      unplaced.push({ model, minRequiredGb: options[0]?.requiredGb ?? 0 });
    }
  }

  // 배치가 끝난 뒤: 같은 GPU를 공유하는 다른 모델은 기본 부하 그대로 두고,
  // 이 모델에게 GPU의 남은 여유를 몰아줬을 때 병목 없이 어디까지 처리할 수 있는지 계산합니다.
  for (const gpu of gpus) {
    for (const placement of gpu.placements) {
      const budgetGb = gpu.remaining + placement.requiredGb;
      const placementHardware = buildGpuPlacementHardware(singleUserHardware, gpu, budgetGb);
      placement.capacity = getPlacementCapacity(placement.model, placement.setting, placementHardware, budgetGb);
    }
  }

  return { gpus, unplaced };
}

function getPlacementContextCandidates(model, config) {
  if (model.type && model.type !== "generative") return [null];
  const modelMax = model.maxContext || 1048576;
  const preferred = Math.min(modelMax, Math.max(2048, config.contextTokens || getHardware().context || 8192));
  if (!placementAllowContextReduction) return [preferred];
  const values = [preferred];
  let next = preferred;
  while (next > 2048 && values.length < 5) {
    next = Math.max(2048, Math.floor(next / 2 / 1024) * 1024);
    if (!values.includes(next)) values.push(next);
  }
  return values;
}

function getPlacementSearchCandidates(model, config, baseHardware, maxCapacityGb) {
  const contexts = getPlacementContextCandidates(model, config);
  const all = [];

  contexts.forEach((contextTokens) => {
    const contextHardware = contextTokens ? { ...baseHardware, context: contextTokens } : baseHardware;
    let options = getPlacementBaselineOptions(model, contextHardware);
    const requested = config.preferredSetting;
    const selected = requested !== "auto"
      ? options.find((option) => option.setting.id === requested)
      : null;
    const preferred = selected || [...options].sort((a, b) => (b.setting.rank || 0) - (a.setting.rank || 0))[0];

    if (!placementAllowQuantChange) {
      options = preferred ? [preferred] : [];
    } else if (selected) {
      options = options.filter((option) => (option.setting.rank || 0) <= (selected.setting.rank || 0));
    }

    for (const option of options) {
      if (!Number.isFinite(option.requiredGb) || option.requiredGb > maxCapacityGb + 0.001) continue;
      const settingDelta = Math.max(0, (preferred?.setting.rank || 0) - (option.setting.rank || 0));
      const preferredContext = contexts[0] || contextTokens;
      const contextDelta = contextTokens && preferredContext
        ? Math.max(0, Math.log2(preferredContext / contextTokens))
        : 0;
      all.push({
        ...option,
        contextTokens,
        qualityRank: option.setting.rank || 0,
        changeCost: settingDelta + contextDelta * 1.5,
        isPreferredSetting: option.setting.id === preferred?.setting.id,
        contextReduced: Boolean(contextTokens && preferredContext && contextTokens < preferredContext),
      });
    }
  });

  const deduped = [...new Map(
    all
      .sort((a, b) => b.qualityRank - a.qualityRank || b.contextTokens - a.contextTokens || a.requiredGb - b.requiredGb)
      .map((candidate) => [`${candidate.setting.id}:${candidate.contextTokens || 0}:${candidate.requiredGb.toFixed(3)}`, candidate]),
  ).values()];

  // Preserve both the highest-quality and smallest-memory ends of the
  // frontier while bounding browser work for very large selections.
  if (deduped.length <= 10) return deduped;
  const sampled = [];
  const indexes = [0, 1, 2, Math.floor(deduped.length * 0.35), Math.floor(deduped.length * 0.55), Math.floor(deduped.length * 0.75), deduped.length - 3, deduped.length - 2, deduped.length - 1];
  indexes.forEach((index) => {
    const candidate = deduped[Math.max(0, Math.min(deduped.length - 1, index))];
    if (candidate && !sampled.includes(candidate)) sampled.push(candidate);
  });
  return sampled;
}

function placementVariance(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
}

function getPlacementPartialScore(state, strategy, primaryKey) {
  const usedGpuCount = state.placements.reduce((set, item) => set.add(item.gpuIndex), new Set()).size;
  const remainingVariance = placementVariance(state.remaining);
  const primaryPlaced = primaryKey && state.placements.some((item) => item.key === primaryKey) ? 1 : 0;
  const quality = state.placements.reduce((sum, item) => sum + item.candidate.qualityRank, 0);
  const changeCost = state.placements.reduce((sum, item) => sum + item.candidate.changeCost, 0);
  const requestWeight = state.placements.reduce((sum, item) => {
    const share = placementUsageMode === "independent" ? item.config.requestShare : 100;
    return sum + share * item.candidate.qualityRank;
  }, 0);
  const placed = state.placements.length;
  const unplaced = state.unplaced.length;

  if (strategy === "throughput") return placed * 1e9 - unplaced * 1e9 + requestWeight * 1e4 - changeCost * 100 - remainingVariance;
  if (strategy === "compact") return placed * 1e9 - unplaced * 1e9 + quality * 1e4 - usedGpuCount * 1000 - changeCost * 100;
  if (strategy === "primary") return primaryPlaced * 1e12 + placed * 1e9 - unplaced * 1e9 + quality * 1e4 - changeCost * 100 - remainingVariance;
  return placed * 1e9 - unplaced * 1e9 + primaryPlaced * 1e7 - changeCost * 1e4 - remainingVariance * 1000 + quality * 100;
}

function buildPlacementGpuRows(gpuRows) {
  const headroomRatio = Math.max(0, Math.min(0.4, placementMinHeadroomPct / 100));
  return gpuRows.map((row, index) => {
    const preset = GPU_PRESETS.find((gpu) => gpu.id === row.presetId) || GPU_PRESETS[0];
    const count = clampNumber(row.count, 1, 8, 1);
    const physicalCapacityGb = preset.vram * count;
    const reservedHeadroomGb = physicalCapacityGb * headroomRatio;
    const capacityGb = physicalCapacityGb - reservedHeadroomGb;
    return {
      index,
      preset,
      count,
      physicalCapacityGb,
      reservedHeadroomGb,
      capacityGb,
      remaining: capacityGb,
      placements: [],
    };
  });
}

function recomputePlacementCapacities(placement) {
  const hardwareBase = { ...getHardware(), concurrency: 1 };
  for (const gpu of placement.gpus) {
    for (const item of gpu.placements) {
      const budgetGb = gpu.remaining + item.requiredGb;
      const placementHardware = buildGpuPlacementHardware(
        item.contextTokens ? { ...hardwareBase, context: item.contextTokens } : hardwareBase,
        gpu,
        budgetGb,
      );
      item.capacity = getPlacementCapacity(item.model, item.setting, placementHardware, budgetGb);
    }
  }
  return placement;
}

function getPlacementServiceGroups(placement) {
  const groups = new Map();
  placement.gpus.forEach((gpu) => {
    gpu.placements.forEach((item) => {
      const key = modelKey(item.model);
      if (!groups.has(key)) groups.set(key, { key, model: item.model, config: item.config, items: [] });
      groups.get(key).items.push({ ...item, gpuIndex: gpu.index });
    });
  });
  return [...groups.values()].map((group) => {
    const concurrency = group.items.filter((item) => item.capacity?.kind === "concurrency");
    const throughput = group.items.filter((item) => item.capacity?.kind === "throughput");
    return {
      ...group,
      recommendedN: concurrency.length ? concurrency.reduce((sum, item) => sum + item.capacity.recommendedN, 0) : null,
      maxN: concurrency.length ? concurrency.reduce((sum, item) => sum + item.capacity.maxN, 0) : null,
      speed: concurrency.reduce((sum, item) => sum + (item.capacity.speedAtRecommended?.total || 0), 0),
      throughput: throughput.reduce((sum, item) => sum + (item.capacity.value || 0), 0),
      unit: throughput[0]?.capacity?.unit || null,
    };
  });
}

function getPlacementStats(placement) {
  const groups = getPlacementServiceGroups(placement);
  const concurrencyGroups = groups.filter((group) => group.recommendedN != null);
  const target = placementTargetN;
  const shortfallCount = concurrencyGroups.filter((group) => {
    const minimum = Math.max(group.config?.minConcurrency || 0, target || 0);
    return group.recommendedN < minimum;
  }).length;
  const minimumViolationCount = concurrencyGroups.filter((group) => (
    group.recommendedN < (group.config?.minConcurrency || 0)
  )).length + placement.unplaced.length;
  const zeroCount = concurrencyGroups.filter((group) => group.recommendedN <= 0).length;
  const serviceFloor = concurrencyGroups.length ? Math.min(...concurrencyGroups.map((group) => group.recommendedN)) : null;
  const weightedCapacity = groups.reduce((sum, group) => {
    const value = group.recommendedN ?? group.throughput ?? 0;
    const requestWeight = placementUsageMode === "independent" ? Math.max(1, group.config?.requestShare || 100) : 100;
    return sum + value * requestWeight;
  }, 0);
  const totalTokThroughput = groups.reduce((sum, group) => sum + group.speed, 0);
  const used = placement.gpus.filter((gpu) => gpu.placements.length);
  const headroomRatios = used.map((gpu) => gpu.capacityGb ? gpu.remaining / gpu.capacityGb : 0);
  const primaryGroup = groups.find((group) => group.key === placementPrimaryKey);
  const configuredFloor = Math.max(1, placementTargetN || 0, ...groups.map((group) => group.config?.minConcurrency || 0));
  return {
    groups,
    placedCount: groups.length,
    unplacedCount: placement.unplaced.length,
    zeroCount,
    shortfallCount,
    minimumViolationCount,
    serviceFloor,
    goalSatisfaction: serviceFloor == null ? 0 : Math.min(serviceFloor, configuredFloor),
    weightedCapacity,
    totalTokThroughput,
    headroomVariance: placementVariance(headroomRatios),
    usedGpuCount: used.length,
    primaryCapacity: primaryGroup ? (primaryGroup.recommendedN ?? primaryGroup.throughput ?? 0) : 0,
    primaryGoalSatisfaction: primaryGroup
      ? Math.min(primaryGroup.recommendedN ?? primaryGroup.throughput ?? 0, Math.max(1, placementTargetN || 0, primaryGroup.config?.minConcurrency || 0))
      : 0,
    changeCost: placement.gpus.flatMap((gpu) => gpu.placements).reduce((sum, item) => sum + (item.changeCost || 0), 0),
  };
}

function comparePlacementStats(a, b, strategy) {
  const tuples = {
    balanced: (value) => [-value.minimumViolationCount, -value.unplacedCount, -value.zeroCount, -value.shortfallCount, value.goalSatisfaction, -value.changeCost, -value.headroomVariance, value.weightedCapacity],
    throughput: (value) => [-value.minimumViolationCount, -value.unplacedCount, value.weightedCapacity, -value.shortfallCount, value.totalTokThroughput, -value.changeCost, -value.headroomVariance],
    compact: (value) => [-value.minimumViolationCount, value.placedCount, -value.unplacedCount, -value.usedGpuCount, -value.changeCost, value.weightedCapacity],
    primary: (value) => [-value.minimumViolationCount, value.primaryGoalSatisfaction, -value.unplacedCount, -value.zeroCount, -value.shortfallCount, value.goalSatisfaction, -value.changeCost, value.primaryCapacity, value.weightedCapacity],
  };
  const getTuple = tuples[strategy] || tuples.balanced;
  const left = getTuple(a);
  const right = getTuple(b);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return right[index] - left[index];
  }
  return 0;
}

function addPlacementReplicas(placement, strategy) {
  if (!placementAllowReplication || placementUsageMode !== "independent" || !["throughput", "primary"].includes(strategy)) return placement;
  const groupKeys = getPlacementServiceGroups(placement)
    .filter((group) => group.config?.allowReplica)
    .sort((a, b) => (b.config?.requestShare || 100) - (a.config?.requestShare || 100))
    .map((group) => group.key);

  for (const key of groupKeys) {
    const group = getPlacementServiceGroups(placement).find((candidate) => candidate.key === key);
    const original = group?.items[0];
    if (!original) continue;
    const requiredTarget = Math.max(placementTargetN || 0, group.config?.minConcurrency || 0);
    if (strategy !== "throughput" && group.recommendedN >= requiredTarget) continue;
    const targetGpu = placement.gpus
      .filter((gpu) => gpu.remaining >= original.requiredGb && !gpu.placements.some((item) => modelKey(item.model) === group.key))
      .sort((a, b) => b.remaining - a.remaining)[0];
    if (!targetGpu) continue;
    const trial = {
      ...placement,
      gpus: placement.gpus.map((gpu) => ({
        ...gpu,
        placements: gpu.placements.map((item) => ({ ...item })),
      })),
    };
    const trialGpu = trial.gpus.find((gpu) => gpu.index === targetGpu.index);
    trialGpu.remaining -= original.requiredGb;
    trialGpu.placements.push({
      ...original,
      capacity: null,
      isReplica: true,
      replicaIndex: group.items.length + 1,
    });
    recomputePlacementCapacities(trial);
    const beforeStats = getPlacementStats(placement);
    const afterStats = getPlacementStats(trial);
    const improvesCapacity = afterStats.weightedCapacity > beforeStats.weightedCapacity + 0.001;
    const preservesConstraints = afterStats.minimumViolationCount <= beforeStats.minimumViolationCount;
    const preservesPrimary = strategy !== "primary" || afterStats.primaryCapacity >= beforeStats.primaryCapacity;
    if (improvesCapacity && preservesConstraints && preservesPrimary) {
      placement.gpus = trial.gpus;
    }
  }
  return placement;
}

function finalizePlacementState(state, gpuTemplate, entries, strategy, searchMeta) {
  const gpus = gpuTemplate.map((gpu, index) => ({
    ...gpu,
    remaining: state.remaining[index],
    placements: [],
  }));
  state.placements.forEach((assignment) => {
    const { entry, candidate, gpuIndex } = assignment;
    gpus[gpuIndex].placements.push({
      model: entry.model,
      setting: candidate.setting,
      label: candidate.contextReduced
        ? `${candidate.label} · ${formatContext(candidate.contextTokens)}`
        : candidate.label,
      requiredGb: candidate.requiredGb,
      contextTokens: candidate.contextTokens,
      contextReduced: candidate.contextReduced,
      settingChanged: !candidate.isPreferredSetting,
      changeCost: candidate.changeCost,
      config: entry.config,
      isPrimary: entry.key === placementPrimaryKey,
      pinnedGpu: entry.config.pinnedGpu,
    });
  });
  const unplaced = state.unplaced.map((entry) => ({
    model: entry.model,
    minRequiredGb: (() => {
      const minimum = entry.candidates.reduce(
        (value, candidate) => Math.min(value, candidate.requiredGb),
        Infinity,
      );
      return Number.isFinite(minimum) ? minimum : 0;
    })(),
    reason: entry.config.pinnedGpu !== "" ? "pinned-capacity" : "capacity",
  }));
  const placement = recomputePlacementCapacities({
    gpus,
    unplaced,
    searchMeta,
    strategy,
    constraints: {
      minHeadroomPct: placementMinHeadroomPct,
      allowQuantChange: placementAllowQuantChange,
      allowContextReduction: placementAllowContextReduction,
      allowReplication: placementAllowReplication && placementUsageMode === "independent",
    },
  });
  addPlacementReplicas(placement, strategy);
  placement.stats = getPlacementStats(placement);
  return placement;
}

function computeGpuPlacement(gpuRows, modelKeys, strategy = "balanced", primaryKey = "") {
  const baseHardware = { ...getHardware(), concurrency: 1 };
  const gpuTemplate = buildPlacementGpuRows(gpuRows);
  const maxCapacityGb = Math.max(0, ...gpuTemplate.map((gpu) => gpu.capacityGb));
  const entries = modelKeys
    .map((key) => {
      const model = getModelByKey(key);
      if (!model) return null;
      const config = getPlacementModelConfig(key);
      return {
        key,
        model,
        config,
        candidates: getPlacementSearchCandidates(model, config, baseHardware, maxCapacityGb),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.key === primaryKey) return -1;
      if (b.key === primaryKey) return 1;
      const aMin = Math.min(...a.candidates.map((candidate) => candidate.requiredGb), Infinity);
      const bMin = Math.min(...b.candidates.map((candidate) => candidate.requiredGb), Infinity);
      return bMin - aMin;
    });

  let frontier = [{
    remaining: gpuTemplate.map((gpu) => gpu.capacityGb),
    placements: [],
    unplaced: [],
  }];
  let exploredStates = 1;
  let pruned = false;
  const beamWidth = entries.length <= 8 ? 5000 : 1400;

  for (const entry of entries) {
    const next = [];
    const pin = entry.config.pinnedGpu === "" ? null : Number(entry.config.pinnedGpu);
    for (const state of frontier) {
      let foundChoice = false;
      gpuTemplate.forEach((gpu, gpuIndex) => {
        if (pin != null && gpuIndex !== pin) return;
        entry.candidates.forEach((candidate) => {
          if (candidate.requiredGb > state.remaining[gpuIndex] + 0.0001) return;
          foundChoice = true;
          const remaining = [...state.remaining];
          remaining[gpuIndex] -= candidate.requiredGb;
          next.push({
            remaining,
            placements: [...state.placements, { entry, key: entry.key, config: entry.config, candidate, gpuIndex }],
            unplaced: state.unplaced,
          });
        });
      });
      // Keep an explicit unplaced branch so "model count" and target
      // feasibility are evaluated rather than silently forcing a bad fit.
      next.push({
        remaining: state.remaining,
        placements: state.placements,
        unplaced: [...state.unplaced, entry],
      });
      if (!foundChoice && !entry.candidates.length) exploredStates += 1;
    }
    exploredStates += next.length;
    next.sort((a, b) => getPlacementPartialScore(b, strategy, primaryKey) - getPlacementPartialScore(a, strategy, primaryKey));
    if (next.length > beamWidth) pruned = true;
    frontier = next.slice(0, beamWidth);
  }

  const finalists = frontier
    .slice(0, Math.min(frontier.length, 120))
    .map((state) => finalizePlacementState(state, gpuTemplate, entries, strategy, {
      mode: pruned ? "approximate" : "exact",
      exploredStates,
      candidateFrontier: frontier.length,
    }))
    .sort((a, b) => comparePlacementStats(a.stats, b.stats, strategy));

  const hardConstraintMatches = finalists.filter((placement) => placement.stats.minimumViolationCount === 0);
  const best = (hardConstraintMatches.length ? hardConstraintMatches : finalists)[0];
  if (best) return best;
  const fallback = computeGreedyGpuPlacement(gpuRows, modelKeys, strategy, primaryKey);
  fallback.searchMeta = { mode: "fallback", exploredStates, candidateFrontier: 0 };
  fallback.constraints = { minHeadroomPct: placementMinHeadroomPct };
  fallback.stats = getPlacementStats(fallback);
  return fallback;
}

function runGpuPlacement() {
  const modelKeys = [...placementSelectedKeys];
  const result = $("gpuPlacementResult");
  const baselineEl = $("gpuPlacementBaseline");
  const exportEl = $("gpuPlacementExport");
  if (!result) return;

  if (!modelKeys.length) {
    const emptyMessage = uiLanguage === "en"
      ? "Select at least one model to run together."
      : "동시에 띄울 모델을 하나 이상 선택해주세요.";
    result.innerHTML = `<p class="gpu-placement-empty">${escapeHtml(emptyMessage)}</p>`;
    if (baselineEl) {
      baselineEl.hidden = true;
      baselineEl.textContent = "";
    }
    if (exportEl) {
      exportEl.hidden = true;
      exportEl.innerHTML = "";
    }
    const emptyDiagnosisEl = $("gpuPlacementDiagnosis");
    if (emptyDiagnosisEl) {
      emptyDiagnosisEl.hidden = true;
      emptyDiagnosisEl.innerHTML = "";
    }
    if ($("gpuPlacementPlanCompare")) {
      $("gpuPlacementPlanCompare").hidden = true;
      $("gpuPlacementPlanCompare").innerHTML = "";
    }
    if ($("placementResultOverview")) $("placementResultOverview").innerHTML = "";
    if ($("placementResultStage")) $("placementResultStage").hidden = true;
    lastPlacementRun = null;
    renderPlacementWorkspaceUi();
    return;
  }

  const diagnosisEl = $("gpuPlacementDiagnosis");

  // "대체 모델" mode: models never coexist in VRAM, so there's no bin-packing,
  // no shared-GPU imbalance, and no single "공통" baseline to speak of — each
  // model is evaluated on its own against a whole GPU. Render that separate
  // (much simpler) path and skip the baseline/diagnosis/export UI, which all
  // assume the co-resident placement shape.
  if (placementUsageMode === "alternate") {
    const altPlacement = computeAlternatePlacement(gpuInventoryRows, modelKeys);
    result.innerHTML = renderAlternatePlacementResult(altPlacement);
    lastPlacementRun = { alternate: true, ...altPlacement };
    if ($("placementResultOverview")) {
      const placed = altPlacement.items.length;
      const failed = altPlacement.unplaced.length;
      $("placementResultOverview").innerHTML = `
        <span class="placement-overview-kicker">${escapeHtml(uiLanguage === "en" ? "Recommended: alternate use" : "추천: 순차 실행")}</span>
        <strong>${escapeHtml(uiLanguage === "en"
          ? `${placed} model(s) can run one at a time${failed ? `; ${failed} don't fit.` : "."}`
          : `${placed}개 모델을 한 번에 하나씩 실행할 수 있습니다${failed ? ` · ${failed}개는 배치할 수 없습니다.` : "."}`)}</strong>
        <p>${escapeHtml(uiLanguage === "en" ? "Models do not share VRAM in this mode." : "이 방식에서는 모델끼리 VRAM을 나눠 쓰지 않습니다.")}</p>
      `;
    }
    if ($("placementResultStage")) $("placementResultStage").hidden = false;
    if (baselineEl) {
      baselineEl.hidden = true;
      baselineEl.innerHTML = "";
    }
    if (diagnosisEl) {
      diagnosisEl.hidden = true;
      diagnosisEl.innerHTML = "";
    }
    if (exportEl) {
      exportEl.hidden = true;
      exportEl.innerHTML = "";
    }
    if ($("gpuPlacementPlanCompare")) {
      $("gpuPlacementPlanCompare").hidden = true;
      $("gpuPlacementPlanCompare").innerHTML = "";
    }
    renderPlacementWorkspaceUi();
    syncUrlState();
    return;
  }

  const placement = computeGpuPlacement(gpuInventoryRows, modelKeys, placementStrategy, placementPrimaryKey);
  lastPlacementRun = placement;
  result.innerHTML = renderGpuPlacementResult(placement);
  renderPlacementExport(placement);
  if ($("placementResultStage")) $("placementResultStage").hidden = false;

  if (baselineEl) {
    const baseline = computePlacementBaseline(placement);
    const html = placementUsageMode === "independent"
      ? renderPlacementBaselineIndependent(baseline, placement)
      : renderPlacementBaseline(baseline);
    baselineEl.innerHTML = html;
    baselineEl.hidden = !html;
  }

  if (diagnosisEl) {
    const diagnosis = diagnosePlacement(placement, placementStrategy, gpuInventoryRows, modelKeys);
    if ($("placementResultOverview")) $("placementResultOverview").innerHTML = renderPlacementResultOverview(placement, diagnosis);
    const html = renderPlacementDiagnosis(diagnosis);
    diagnosisEl.innerHTML = html;
    diagnosisEl.hidden = !html;
  }
  comparePlacementPlans();
  renderPlacementWorkspaceUi();
  syncUrlState();
}

function renderPlacementResultOverview(placement, diagnosis) {
  const stats = placement.stats || getPlacementStats(placement);
  const groups = stats.groups || [];
  const concurrency = groups.map((group) => group.recommendedN).filter((value) => value != null);
  const minN = concurrency.length ? Math.min(...concurrency) : null;
  const maxN = concurrency.length ? Math.max(...concurrency) : null;
  const failed = placement.unplaced.length;
  const targetMissed = placementTargetN != null && minN != null && minN < placementTargetN;
  const plan = PLACEMENT_PLAN_DEFS.find((item) => item.key === placementStrategy) || PLACEMENT_PLAN_DEFS[0];
  const planName = uiLanguage === "en" ? plan.titleEn : plan.titleKo;
  let conclusion;
  if (failed) {
    conclusion = uiLanguage === "en"
      ? `${failed} of ${placementSelectedKeys.size} selected model(s) could not be placed.`
      : `선택한 ${placementSelectedKeys.size}개 모델 중 ${failed}개를 배치할 수 없습니다.`;
  } else if (targetMissed) {
    conclusion = uiLanguage === "en"
      ? `All models fit, but the target of ${placementTargetN} concurrent users is not met.`
      : `선택한 모델을 모두 배치할 수 있지만 목표 ${placementTargetN}명에는 도달하지 못합니다.`;
  } else {
    conclusion = uiLanguage === "en"
      ? "All selected models fit the current hardware and operating constraints."
      : "선택한 모델을 현재 하드웨어와 운영 조건 안에 모두 배치할 수 있습니다.";
  }
  const capacity = minN != null
    ? (uiLanguage === "en"
        ? `Recommended stable concurrency: ${minN}${maxN !== minN ? `–${maxN}` : ""}`
        : `현재 안전 동시 접속: ${minN}${maxN !== minN ? `~${maxN}` : ""}명`)
    : (uiLanguage === "en"
        ? `Estimated total throughput: ${formatThroughput(stats.totalTokThroughput || 0, "tok/s")}`
        : `예상 총 처리량: ${formatThroughput(stats.totalTokThroughput || 0, "tok/s")}`);
  const bottleneck = diagnosis?.bottleneck
    ? (uiLanguage === "en" ? `Bottleneck: ${diagnosis.bottleneck.model.name}` : `병목 모델: ${diagnosis.bottleneck.model.name}`)
    : "";
  return `
    <span class="placement-overview-kicker">${escapeHtml(uiLanguage === "en" ? `Recommended: ${planName}` : `추천: ${planName}`)}</span>
    <strong>${escapeHtml(conclusion)}</strong>
    <div class="placement-overview-metrics">
      <span>${escapeHtml(capacity)}</span>
      ${bottleneck ? `<span>${escapeHtml(bottleneck)}</span>` : ""}
    </div>
  `;
}

const PLACEMENT_PLAN_DEFS = [
  { key: "balanced", titleKo: "균형형", titleEn: "Balanced", descKo: "GPU 간 여유 VRAM을 고르게 분산", descEn: "Spreads remaining VRAM evenly across GPUs" },
  { key: "throughput", titleKo: "처리량형", titleEn: "Throughput", descKo: "총 예상 처리량이 가장 높은 배치를 우선", descEn: "Prioritizes whichever placement gives the highest total throughput" },
  { key: "compact", titleKo: "모델 보존형", titleEn: "Model-preserving", descKo: "선택한 모델을 최대한 모두 담는 배치", descEn: "Packs in as many of the selected models as possible" },
  { key: "primary", titleKo: "주 모델형", titleEn: "Primary-first", descKo: "주 모델의 목표와 품질을 먼저 확보", descEn: "Reserves capacity and quality for the primary model first" },
];

// Runs the full placement computation once per strategy and boils each down
// to the handful of numbers the comparison cards need (common concurrency,
// total throughput, how many models didn't fit). Reuses computeGpuPlacement/
// computePlacementBaseline exactly as the single-result view does — nothing
// here is a separate, simplified estimate.
function computePlacementPlanSummary(gpuRows, modelKeys, strategy, primaryKey) {
  const placement = computeGpuPlacement(gpuRows, modelKeys, strategy, primaryKey);
  const baseline = computePlacementBaseline(placement);
  const stats = placement.stats || getPlacementStats(placement);
  return {
    placement,
    commonN: stats.serviceFloor ?? baseline?.concurrencyBaseline?.recommendedN ?? null,
    throughputBaseline: baseline?.throughputBaseline ?? null,
    totalTokThroughput: stats.totalTokThroughput,
    unplacedCount: placement.unplaced.length,
    shortfallCount: stats.shortfallCount,
    changeCost: stats.changeCost,
    searchMode: placement.searchMeta?.mode || "fallback",
    remaining: placement.gpus.map((gpu) => gpu.remaining),
    automaticChanges: placement.gpus.flatMap((gpu) => gpu.placements).filter((item) => item.settingChanged || item.contextReduced).length,
  };
}

function comparePlacementPlans() {
  const modelKeys = [...placementSelectedKeys];
  const container = $("gpuPlacementPlanCompare");
  if (!container) return;
  if (!modelKeys.length) {
    container.hidden = true;
    container.innerHTML = "";
    return;
  }
  const defs = PLACEMENT_PLAN_DEFS.filter((def) => ["balanced", "throughput", "primary"].includes(def.key));
  const primaryKeyForPlans = placementPrimaryKey || modelKeys[0] || "";
  const summaries = defs.map((def) => ({
    def,
    summary: computePlacementPlanSummary(gpuInventoryRows, modelKeys, def.key, primaryKeyForPlans),
  }));
  container.hidden = false;
  container.innerHTML = renderPlacementPlanCompare(summaries);
}

function renderPlacementPlanCompare(summaries) {
  const intro = uiLanguage === "en"
    ? "The same selected models, computed under three different placement strategies — apply whichever trade-off fits best."
    : "같은 모델을 세 가지 배치 기준으로 각각 계산한 결과입니다. 원하는 방식을 골라 바로 적용할 수 있습니다.";

  const cards = summaries
    .map(({ def, summary }) => {
      const title = uiLanguage === "en" ? def.titleEn : def.titleKo;
      const desc = uiLanguage === "en" ? def.descEn : def.descKo;
      const isActive = def.key === placementStrategy;

      const commonLine = summary.commonN != null
        ? (uiLanguage === "en" ? `Common concurrency: ${summary.commonN}` : `공통 동시 접속: ${summary.commonN}명`)
        : (uiLanguage === "en" ? "No concurrency-type models selected" : "동시 접속 대상 모델 없음");
      const throughputLine = summary.totalTokThroughput > 0
        ? (uiLanguage === "en" ? `Total throughput: ${formatThroughput(summary.totalTokThroughput, "tok/s")}` : `총 예상 처리량: ${formatThroughput(summary.totalTokThroughput, "tok/s")}`)
        : "";
      const unplacedLine = summary.unplacedCount > 0
        ? (uiLanguage === "en" ? `${summary.unplacedCount} model(s) don't fit anywhere` : `배치 못한 모델 ${summary.unplacedCount}개`)
        : (uiLanguage === "en" ? "All selected models fit" : "선택한 모델 전부 배치됨");
      const targetLine = summary.shortfallCount > 0
        ? (uiLanguage === "en" ? `${summary.shortfallCount} service(s) miss their target` : `목표 미달 서비스 ${summary.shortfallCount}개`)
        : (uiLanguage === "en" ? "Configured targets met" : "설정한 목표 충족");
      const searchLine = summary.searchMode === "exact"
        ? (uiLanguage === "en" ? "Exact candidate search" : "정확 후보 탐색")
        : (uiLanguage === "en" ? "Bounded approximate search" : "제한된 근사 탐색");
      const remainingLine = uiLanguage === "en"
        ? `Free VRAM: ${summary.remaining.map(formatGb).join(" / ")}`
        : `GPU별 여유: ${summary.remaining.map(formatGb).join(" / ")}`;
      const changesLine = uiLanguage === "en"
        ? `Automatic setting changes: ${summary.automaticChanges}`
        : `자동 설정 변경: ${summary.automaticChanges}개`;

      const buttonLabel = isActive
        ? (uiLanguage === "en" ? "Currently applied" : "현재 적용됨")
        : (uiLanguage === "en" ? "Apply this plan" : "이 배치안 적용");

      return `
        <div class="placement-plan-card${isActive ? " is-active" : ""}">
          <div class="placement-plan-card-head">
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(desc)}</p>
          </div>
          <div class="placement-plan-card-body">
            <p class="${summary.commonN === 0 ? "capacity-warning" : ""}">${escapeHtml(commonLine)}</p>
            ${throughputLine ? `<p>${escapeHtml(throughputLine)}</p>` : ""}
            <p class="${summary.unplacedCount > 0 ? "capacity-warning" : ""}">${escapeHtml(unplacedLine)}</p>
            <p class="${summary.shortfallCount > 0 ? "capacity-warning" : ""}">${escapeHtml(targetLine)}</p>
            <p>${escapeHtml(remainingLine)}</p>
            <p>${escapeHtml(changesLine)}</p>
            <p class="placement-plan-search-mode">${escapeHtml(searchLine)}</p>
          </div>
          <button type="button" class="ghost-button" data-apply-placement-plan="${escapeAttr(def.key)}" ${isActive ? "disabled" : ""}>${escapeHtml(buttonLabel)}</button>
        </div>
      `;
    })
    .join("");

  return `<p class="gpu-placement-plan-compare-intro">${escapeHtml(intro)}</p><div class="placement-plan-cards">${cards}</div>`;
}

// 배치된 모델 전체를 통틀어 "운영 시 병목 없이 공통으로 맞출 기준값"을 찾습니다.
// 생성형(동시 접속자 수)과 임베딩/리랭커/OCR(처리량)은 단위가 달라 하나로 합칠 수 없으므로,
// 각 종류 안에서 가장 낮은(가장 먼저 병목이 걸리는) 값을 기준으로 따로 안내합니다.
function computePlacementBaseline(placement) {
  const placedItems = placement.gpus.flatMap((gpu) => gpu.placements.map((item) => ({ ...item, gpuIndex: gpu.index })));
  if (!placedItems.length) return null;

  const concurrencyItems = placedItems.filter((item) => item.capacity?.kind === "concurrency");
  const throughputItems = placedItems.filter((item) => item.capacity?.kind === "throughput" && item.capacity.value > 0);

  let concurrencyBaseline = null;
  if (concurrencyItems.length) {
    const bottleneck = concurrencyItems.reduce((min, item) => (item.capacity.recommendedN < min.capacity.recommendedN ? item : min));
    concurrencyBaseline = { recommendedN: bottleneck.capacity.recommendedN, modelName: bottleneck.model.name, gpuIndex: bottleneck.gpuIndex };
  }

  let throughputBaseline = null;
  if (throughputItems.length) {
    const bottleneck = throughputItems.reduce((min, item) => (item.capacity.value < min.capacity.value ? item : min));
    throughputBaseline = { value: bottleneck.capacity.value, unit: bottleneck.capacity.unit, modelName: bottleneck.model.name, gpuIndex: bottleneck.gpuIndex };
  }

  return { concurrencyBaseline, throughputBaseline };
}

// True when a target concurrency is set and this value falls short of it —
// shared by the collapsed (pipeline) and per-model (independent) baseline
// renderers so "below target" gets the same warning treatment as "0명".
function isBelowPlacementTarget(recommendedN) {
  return placementTargetN != null && recommendedN != null && recommendedN < placementTargetN;
}

function renderPlacementBaseline(baseline) {
  if (!baseline || (!baseline.concurrencyBaseline && !baseline.throughputBaseline)) return "";
  const parts = [];
  if (baseline.concurrencyBaseline) {
    const b = baseline.concurrencyBaseline;
    const zero = b.recommendedN <= 0;
    const belowTarget = isBelowPlacementTarget(b.recommendedN);
    if (zero || belowTarget) {
      const reason = zero
        ? (uiLanguage === "en" ? "not recommended to run" : "운영 비권장")
        : (uiLanguage === "en" ? `only ${b.recommendedN} (target ${placementTargetN} not met)` : `${b.recommendedN}명(목표 ${placementTargetN}명 미달)`);
      const msg = uiLanguage === "en"
        ? `Common concurrency: ${reason} (bottleneck: GPU${b.gpuIndex + 1} ${b.modelName})${zero ? " — see the diagnosis below" : ""}`
        : `공통 동시 접속: ${reason} (병목: GPU${b.gpuIndex + 1} ${b.modelName})${zero ? " — 아래 진단을 확인하세요" : ""}`;
      parts.push(`<span class="capacity-warning">${escapeHtml(msg)}</span>`);
    } else {
      const msg = uiLanguage === "en"
        ? `Common concurrency baseline ${b.recommendedN} (bottleneck: GPU${b.gpuIndex + 1} ${b.modelName})`
        : `공통 동시 접속 기준 ${b.recommendedN}명 (병목: GPU${b.gpuIndex + 1} ${b.modelName})`;
      parts.push(escapeHtml(msg));
    }
  }
  if (baseline.throughputBaseline) {
    const b = baseline.throughputBaseline;
    const msg = uiLanguage === "en"
      ? `Throughput bottleneck ${formatThroughput(b.value, b.unit)} (GPU${b.gpuIndex + 1} ${b.modelName})`
      : `처리량 병목 ${formatThroughput(b.value, b.unit)} (GPU${b.gpuIndex + 1} ${b.modelName})`;
    parts.push(escapeHtml(msg));
  }
  return parts.join(" · ");
}

// "독립 서비스" usage mode: instead of collapsing every model down to the
// single worst-off one, show each model's own concurrency headroom, since
// they're assumed to be called independently rather than sharing one
// bottleneck.
function renderPlacementBaselineIndependent(baseline, placement) {
  const concurrencyGroups = getPlacementServiceGroups(placement).filter((group) => group.recommendedN != null);
  if (!concurrencyGroups.length) return renderPlacementBaseline(baseline);

  const label = uiLanguage === "en" ? "Per-model concurrency: " : "모델별 동시 접속: ";
  const parts = concurrencyGroups.map((group) => {
    const n = group.recommendedN;
    const minimum = Math.max(placementTargetN || 0, group.config?.minConcurrency || 0);
    const warn = n <= 0 || n < minimum;
    const replicaLabel = group.items.length > 1
      ? (uiLanguage === "en" ? ` · ${group.items.length} replicas` : ` · ${group.items.length}개 복제`)
      : "";
    const text = uiLanguage === "en" ? `${group.model.name} ${n}${replicaLabel}` : `${group.model.name} ${n}명${replicaLabel}`;
    return warn ? `<span class="capacity-warning">${escapeHtml(text)}</span>` : escapeHtml(text);
  });
  let html = escapeHtml(label) + parts.join(" · ");
  if (baseline?.throughputBaseline) {
    const b = baseline.throughputBaseline;
    const msg = uiLanguage === "en"
      ? ` · Throughput bottleneck ${formatThroughput(b.value, b.unit)} (GPU${b.gpuIndex + 1} ${b.modelName})`
      : ` · 처리량 병목 ${formatThroughput(b.value, b.unit)} (GPU${b.gpuIndex + 1} ${b.modelName})`;
    html += escapeHtml(msg);
  }
  return html;
}

function renderPlacementCapacityLine(capacity) {
  if (!capacity) return "";
  if (capacity.kind === "concurrency") {
    if (capacity.recommendedN <= 0) {
      const msg = uiLanguage === "en"
        ? `Fits in VRAM, but not recommended to run — max ${capacity.maxN} at a squeeze with no safety margin`
        : `VRAM에는 올라가지만 운영 비권장 · 억지로 최대 ${capacity.maxN}명(안전 여유 없음)`;
      return `<span class="capacity-warning">${escapeHtml(msg)}</span>`;
    }
    const msg = uiLanguage === "en"
      ? `Concurrency headroom: recommended ${capacity.recommendedN} · max ${capacity.maxN} (${formatThroughput(capacity.speedAtMax.total, "tok/s")} at max)`
      : `동시 처리 여유: 권장 ${capacity.recommendedN}명 · 최대 ${capacity.maxN}명 (최대 시 ${formatThroughput(capacity.speedAtMax.total, "tok/s")})`;
    return escapeHtml(msg);
  }
  const msg = uiLanguage === "en"
    ? `Throughput headroom: about ${formatThroughput(capacity.value, capacity.unit)}${capacity.tokenValue ? ` · ${formatThroughput(capacity.tokenValue, capacity.tokenUnit)}` : ""}`
    : `처리량 여유: 약 ${formatThroughput(capacity.value, capacity.unit)}${capacity.tokenValue ? ` · ${formatThroughput(capacity.tokenValue, capacity.tokenUnit)}` : ""}`;
  return escapeHtml(msg);
}

// Looks for a single-model relocation from the most-loaded GPU to the
// least-loaded GPU that would measurably improve balance without lowering
// the common concurrency baseline. Every number here comes from re-running
// buildGpuPlacementHardware/getPlacementCapacity (the same estimators the
// real placement uses) on the simulated after-state — nothing is hardcoded.
function suggestPlacementMove(placement) {
  if (placement.gpus.length < 2) return null;
  const loadedGpus = placement.gpus.filter((gpu) => gpu.placements.length);
  if (!loadedGpus.length) return null;

  const sourceGpu = [...loadedGpus].sort((a, b) => a.remaining - b.remaining)[0];
  const targetGpu = [...placement.gpus].filter((gpu) => gpu.index !== sourceGpu.index).sort((a, b) => b.remaining - a.remaining)[0];
  if (!targetGpu || targetGpu.remaining - sourceGpu.remaining < 1) return null;

  const beforeBaseline = computePlacementBaseline(placement);
  const beforeN = beforeBaseline?.concurrencyBaseline?.recommendedN ?? null;
  const balanceBefore = Math.abs(sourceGpu.remaining - targetGpu.remaining);

  const hardwareBase = getHardware();
  const singleUserHardware = { ...hardwareBase, concurrency: 1 };

  const recompute = (gpu, remaining, items) =>
    items.map((item) => {
      const budgetGb = remaining + item.requiredGb;
      const hw = buildGpuPlacementHardware(singleUserHardware, gpu, budgetGb);
      return { ...item, capacity: getPlacementCapacity(item.model, item.setting, hw, budgetGb) };
    });

  let best = null;
  for (const candidate of sourceGpu.placements) {
    if (candidate.requiredGb > targetGpu.remaining) continue;
    const newSourceRemaining = sourceGpu.remaining + candidate.requiredGb;
    const newTargetRemaining = targetGpu.remaining - candidate.requiredGb;
    const balanceAfter = Math.abs(newSourceRemaining - newTargetRemaining);
    if (balanceAfter >= balanceBefore) continue;

    const afterSourceItems = recompute(sourceGpu, newSourceRemaining, sourceGpu.placements.filter((item) => item !== candidate));
    const afterTargetItems = recompute(targetGpu, newTargetRemaining, [...targetGpu.placements, candidate]);
    const otherItems = placement.gpus
      .filter((gpu) => gpu.index !== sourceGpu.index && gpu.index !== targetGpu.index)
      .flatMap((gpu) => gpu.placements);
    const concurrencyAfterItems = [...afterSourceItems, ...afterTargetItems, ...otherItems].filter((item) => item.capacity?.kind === "concurrency");
    const afterN = concurrencyAfterItems.length ? Math.min(...concurrencyAfterItems.map((item) => item.capacity.recommendedN)) : null;
    if (afterN != null && beforeN != null && afterN < beforeN) continue; // never suggest a move that makes the bottleneck worse

    if (!best || balanceAfter < best.balanceAfter) {
      best = {
        model: candidate.model,
        fromGpuIndex: sourceGpu.index,
        toGpuIndex: targetGpu.index,
        beforeSourceRemaining: sourceGpu.remaining,
        beforeTargetRemaining: targetGpu.remaining,
        afterSourceRemaining: newSourceRemaining,
        afterTargetRemaining: newTargetRemaining,
        beforeN,
        afterN,
        balanceAfter,
      };
    }
  }
  return best;
}

function summarizePlacementForAdjustment(placement) {
  const stats = placement.stats || getPlacementStats(placement);
  return {
    remaining: placement.gpus.map((gpu) => gpu.remaining),
    serviceFloor: stats.serviceFloor,
    totalTokThroughput: stats.totalTokThroughput,
    weightedCapacity: stats.weightedCapacity,
    unplacedCount: stats.unplacedCount,
    zeroCount: stats.zeroCount,
    shortfallCount: stats.shortfallCount,
    headroomVariance: stats.headroomVariance,
  };
}

function adjustmentImprovement(before, after) {
  return (
    (before.unplacedCount - after.unplacedCount) * 1e8
    + (before.zeroCount - after.zeroCount) * 1e7
    + (before.shortfallCount - after.shortfallCount) * 1e6
    + ((after.serviceFloor || 0) - (before.serviceFloor || 0)) * 1e4
    + (after.weightedCapacity - before.weightedCapacity)
    + (before.headroomVariance - after.headroomVariance) * 100
  );
}

function simulatePlacementAdjustment(gpuRows, modelKeys, strategy, mutate, nextModelKeys = modelKeys) {
  const globals = {
    allowQuant: placementAllowQuantChange,
    allowContext: placementAllowContextReduction,
    allowReplication: placementAllowReplication,
    target: placementTargetN,
  };
  const configs = new Map([...placementModelConfigs].map(([key, config]) => [key, { ...config }]));
  try {
    mutate?.();
    return computeGpuPlacement(gpuRows, nextModelKeys, strategy, placementPrimaryKey);
  } finally {
    placementAllowQuantChange = globals.allowQuant;
    placementAllowContextReduction = globals.allowContext;
    placementAllowReplication = globals.allowReplication;
    placementTargetN = globals.target;
    placementModelConfigs.clear();
    configs.forEach((config, key) => placementModelConfigs.set(key, config));
  }
}

function diagnosePlacement(placement, strategy, gpuRows, modelKeys) {
  const stats = placement.stats || getPlacementStats(placement);
  const loadedGpus = placement.gpus.filter((gpu) => gpu.placements.length);
  if (!loadedGpus.length) return null;
  const before = summarizePlacementForAdjustment(placement);
  const remaining = loadedGpus.map((gpu) => gpu.remaining);
  const imbalanceGb = loadedGpus.length > 1 ? Math.max(...remaining) - Math.min(...remaining) : 0;
  const physicalTotal = loadedGpus.reduce((sum, gpu) => sum + (gpu.physicalCapacityGb || gpu.capacityGb), 0);
  const isImbalanced = loadedGpus.length > 1 && imbalanceGb > physicalTotal * 0.12;
  const status = stats.unplacedCount || stats.zeroCount || stats.shortfallCount
    ? "warning"
    : isImbalanced
      ? "unbalanced"
      : "balanced";
  const adjustments = [];
  if (status === "balanced") {
    placementAdjustmentRegistry.clear();
    return {
      status,
      isImbalanced,
      imbalanceGb,
      stats,
      adjustments,
      bottleneck: [...stats.groups].filter((group) => group.recommendedN != null).sort((a, b) => a.recommendedN - b.recommendedN)[0] || null,
      searchMeta: placement.searchMeta,
    };
  }

  const addAdjustment = (adjustment, afterPlacement) => {
    if (!afterPlacement) return;
    const after = summarizePlacementForAdjustment(afterPlacement);
    const improvement = adjustmentImprovement(before, after);
    if (improvement <= 0 && adjustment.kind !== "target") return;
    adjustments.push({ ...adjustment, before, after, improvement });
  };

  const move = suggestPlacementMove(placement);
  if (move) {
    const key = modelKey(move.model);
    const afterPlacement = simulatePlacementAdjustment(gpuRows, modelKeys, strategy, () => {
      getPlacementModelConfig(key).pinnedGpu = String(move.toGpuIndex);
    });
    addAdjustment({ kind: "pin", modelKey: key, modelName: move.model.name, gpuIndex: move.toGpuIndex }, afterPlacement);
  }

  if (!placementAllowQuantChange) {
    addAdjustment(
      { kind: "allow-quant" },
      simulatePlacementAdjustment(gpuRows, modelKeys, strategy, () => { placementAllowQuantChange = true; }),
    );
  }
  if (!placementAllowContextReduction && stats.shortfallCount + stats.zeroCount + stats.unplacedCount > 0) {
    addAdjustment(
      { kind: "allow-context" },
      simulatePlacementAdjustment(gpuRows, modelKeys, strategy, () => { placementAllowContextReduction = true; }),
    );
  }

  const bottleneck = [...stats.groups]
    .filter((group) => group.recommendedN != null)
    .sort((a, b) => a.recommendedN - b.recommendedN)[0];
  if (bottleneck && modelKeys.length > 1) {
    const reducedKeys = modelKeys.filter((key) => key !== bottleneck.key);
    addAdjustment(
      { kind: "remove", modelKey: bottleneck.key, modelName: bottleneck.model.name },
      simulatePlacementAdjustment(gpuRows, modelKeys, strategy, null, reducedKeys),
    );
  }

  if (placementTargetN != null && stats.serviceFloor != null && stats.serviceFloor < placementTargetN) {
    adjustments.push({
      kind: "target",
      nextTarget: Math.max(1, stats.serviceFloor),
      before,
      after: { ...before, serviceFloor: stats.serviceFloor, shortfallCount: 0 },
      improvement: 1,
    });
  }

  adjustments.sort((a, b) => b.improvement - a.improvement);
  placementAdjustmentRegistry.clear();
  adjustments.slice(0, 4).forEach((adjustment, index) => placementAdjustmentRegistry.set(`adjustment-${index}`, adjustment));

  return {
    status,
    isImbalanced,
    imbalanceGb,
    stats,
    adjustments: [...placementAdjustmentRegistry.entries()].map(([id, adjustment]) => ({ id, ...adjustment })),
    bottleneck,
    searchMeta: placement.searchMeta,
  };
}

function renderPlacementAdjustmentDelta(adjustment) {
  const beforeN = adjustment.before.serviceFloor;
  const afterN = adjustment.after.serviceFloor;
  const remainingBefore = adjustment.before.remaining.map(formatGb).join(" / ");
  const remainingAfter = adjustment.after.remaining.map(formatGb).join(" / ");
  const concurrency = beforeN != null || afterN != null
    ? (uiLanguage === "en" ? `Concurrency ${beforeN ?? "-"} → ${afterN ?? "-"}` : `동시 접속 ${beforeN ?? "-"}명 → ${afterN ?? "-"}명`)
    : "";
  const throughput = adjustment.before.totalTokThroughput || adjustment.after.totalTokThroughput
    ? (uiLanguage === "en"
        ? `Throughput ${formatThroughput(adjustment.before.totalTokThroughput, "tok/s")} → ${formatThroughput(adjustment.after.totalTokThroughput, "tok/s")}`
        : `총 처리량 ${formatThroughput(adjustment.before.totalTokThroughput, "tok/s")} → ${formatThroughput(adjustment.after.totalTokThroughput, "tok/s")}`)
    : "";
  const remaining = uiLanguage === "en"
    ? `Free VRAM by GPU ${remainingBefore} → ${remainingAfter}`
    : `GPU별 여유 VRAM ${remainingBefore} → ${remainingAfter}`;
  return [concurrency, throughput, remaining].filter(Boolean).map((line) => `<span>${escapeHtml(line)}</span>`).join("");
}

function placementAdjustmentLabel(adjustment) {
  if (adjustment.kind === "pin") {
    return uiLanguage === "en"
      ? `Move ${adjustment.modelName} to GPU ${adjustment.gpuIndex + 1}`
      : `${adjustment.modelName}을 GPU ${adjustment.gpuIndex + 1}로 이동`;
  }
  if (adjustment.kind === "allow-quant") return uiLanguage === "en" ? "Allow automatic precision changes" : "양자화·정밀도 자동 변경 허용";
  if (adjustment.kind === "allow-context") return uiLanguage === "en" ? "Allow automatic context reduction" : "컨텍스트 자동 축소 허용";
  if (adjustment.kind === "remove") return uiLanguage === "en" ? `Remove ${adjustment.modelName}` : `${adjustment.modelName} 제외`;
  if (adjustment.kind === "target") return uiLanguage === "en" ? `Adjust target to ${adjustment.nextTarget}` : `목표를 ${adjustment.nextTarget}명으로 조정`;
  return uiLanguage === "en" ? "Apply adjustment" : "조정 적용";
}

function renderPlacementDiagnosis(diagnosis) {
  if (!diagnosis) return "";
  const labels = {
    balanced: { ko: "균형", en: "Balanced" },
    unbalanced: { ko: "불균형", en: "Unbalanced" },
    warning: { ko: "운영 비권장", en: "Not recommended for serving" },
  };
  const statusLabel = labels[diagnosis.status][uiLanguage === "en" ? "en" : "ko"];
  const bottleneckText = diagnosis.bottleneck
    ? (uiLanguage === "en"
        ? `Bottleneck: ${diagnosis.bottleneck.model.name} (${diagnosis.bottleneck.recommendedN} recommended concurrent)`
        : `병목: ${diagnosis.bottleneck.model.name} (권장 동시 ${diagnosis.bottleneck.recommendedN}명)`)
    : "";
  const searchText = diagnosis.searchMeta?.mode === "exact"
    ? (uiLanguage === "en" ? "Exact candidate search" : "정확 후보 탐색")
    : (uiLanguage === "en" ? "Bounded approximate search" : "제한된 근사 탐색");
  const intro = diagnosis.status === "balanced"
    ? (uiLanguage === "en" ? "The selected constraints are met without a large GPU headroom gap." : "큰 GPU 여유 격차 없이 설정한 제약을 충족합니다.")
    : diagnosis.status === "unbalanced"
      ? (uiLanguage === "en" ? `Remaining VRAM differs by ${formatGb(diagnosis.imbalanceGb)} across active GPUs.` : `사용 중인 GPU의 여유 VRAM 차이가 ${formatGb(diagnosis.imbalanceGb)}입니다.`)
      : (uiLanguage === "en" ? "At least one model is unplaced, has zero safe concurrency, or misses its configured target." : "배치 실패, 안전 동시 접속 0명 또는 설정한 목표 미달 모델이 있습니다.");

  const adjustmentHtml = diagnosis.adjustments.length
    ? `
      <div class="placement-adjustment-list">
        ${diagnosis.adjustments.map((adjustment) => `
          <article class="placement-adjustment-card">
            <strong>${escapeHtml(placementAdjustmentLabel(adjustment))}</strong>
            <div class="placement-adjustment-delta">${renderPlacementAdjustmentDelta(adjustment)}</div>
            <button type="button" class="ghost-button" data-apply-placement-adjustment="${escapeAttr(adjustment.id)}">${uiLanguage === "en" ? "Apply" : "적용"}</button>
          </article>
        `).join("")}
      </div>
    `
    : diagnosis.status === "balanced"
      ? `<p class="gpu-placement-diagnosis-note">${uiLanguage === "en" ? "No adjustment is required for the selected objective and constraints." : "선택한 목표와 제약 기준에서 추가 조정이 필요하지 않습니다."}</p>`
    : `<p class="gpu-placement-diagnosis-note">${uiLanguage === "en" ? "No safe automatic adjustment improves this result. Consider adding a GPU or changing the selected models." : "현재 조건에서 안전하게 개선되는 자동 조정이 없습니다. GPU 추가 또는 선택 모델 변경을 검토하세요."}</p>`;

  return `
    <div class="gpu-placement-diagnosis-box is-${escapeAttr(diagnosis.status)}">
      <div class="placement-diagnosis-head">
        <strong>${uiLanguage === "en" ? "Placement diagnosis" : "배치 진단"}: ${escapeHtml(statusLabel)}</strong>
      </div>
      <p>${escapeHtml(intro)}</p>
      ${bottleneckText ? `<p>${escapeHtml(bottleneckText)}</p>` : ""}
      ${adjustmentHtml}
      <details class="placement-calculation-basis">
        <summary>${uiLanguage === "en" ? "Calculation constraints" : "계산 제약 및 근거"}</summary>
        <p>${escapeHtml(uiLanguage === "en"
          ? `Search method: ${searchText}; ${diagnosis.searchMeta?.exploredStates?.toLocaleString() || 0} candidate states checked.`
          : `계산 방식: ${searchText}으로 가능한 배치 ${diagnosis.searchMeta?.exploredStates?.toLocaleString() || 0}개 상태를 확인한 참고 결과입니다.`)}</p>
        <p>${uiLanguage === "en"
          ? `VRAM headroom ${placementMinHeadroomPct}% · precision changes ${placementAllowQuantChange ? "allowed" : "locked"} · context reduction ${placementAllowContextReduction ? "allowed" : "disabled"} · replicas ${placementAllowReplication && placementUsageMode === "independent" ? "allowed" : "disabled"}`
          : `VRAM 여유 ${placementMinHeadroomPct}% · 양자화 변경 ${placementAllowQuantChange ? "허용" : "고정"} · 컨텍스트 축소 ${placementAllowContextReduction ? "허용" : "사용 안 함"} · 복제 ${placementAllowReplication && placementUsageMode === "independent" ? "허용" : "사용 안 함"}`}</p>
      </details>
    </div>
  `;
}

function renderPlacementUnplacedBlock(unplaced) {
  if (!unplaced.length) return "";
  const title = uiLanguage === "en" ? `${unplaced.length} model(s) couldn't be placed` : `배치하지 못한 모델 ${unplaced.length}개`;
  const note = uiLanguage === "en"
    ? "Consider adding a GPU, or run this one on its own instead of alongside the others."
    : "GPU를 추가하거나, 다른 모델과 함께 띄우지 말고 순차 실행하는 것을 고려해보세요.";
  const needLabel = uiLanguage === "en" ? "needs at least" : "최소";
  return `
    <div class="gpu-placement-unplaced">
      <strong>${escapeHtml(title)}</strong>
      ${unplaced
        .map(
          (item) => `<div class="gpu-placement-model-row"><span>${escapeHtml(item.model.name)}</span><span>${escapeHtml(needLabel)} ${escapeHtml(formatGb(item.minRequiredGb))}${uiLanguage === "en" ? "" : " 필요"}</span></div>`,
        )
        .join("")}
      <p>${escapeHtml(note)}</p>
    </div>
  `;
}

function getPlacementItemMemoryParts(item, gpu) {
  const hardware = buildGpuPlacementHardware(
    item.contextTokens ? { ...getHardware(), concurrency: 1, context: item.contextTokens } : { ...getHardware(), concurrency: 1 },
    gpu,
    item.requiredGb,
  );
  let estimate = null;
  if (!item.model.type || item.model.type === "generative") {
    estimate = estimateWithQuant(item.model, item.setting, hardware);
  } else if (item.model.type === "embedding") {
    estimate = estimateEncoderWithPrecision(item.model, hardware, getPlacementWorkload(item.model), item.setting);
  } else if (item.model.type === "reranker") {
    estimate = estimateRerankerWithPrecision(item.model, hardware, getPlacementWorkload(item.model), item.setting);
  } else {
    estimate = estimateVisionWithPrecision(item.model, hardware, getPlacementWorkload(item.model), item.setting);
  }
  const weights = Math.max(0, estimate.weightsGb || estimate.residentGb || item.requiredGb * 0.72);
  const kv = Math.max(0, estimate.kvGb || estimate.decoderKvGb || 0);
  const runtime = Math.max(0, item.requiredGb - weights - kv);
  return { weights, kv, runtime };
}

function renderPlacementMemoryBar(gpu) {
  const totals = gpu.placements.reduce((sum, item) => {
    const parts = getPlacementItemMemoryParts(item, gpu);
    sum.weights += parts.weights;
    sum.kv += parts.kv;
    sum.runtime += parts.runtime;
    return sum;
  }, { weights: 0, kv: 0, runtime: 0 });
  const total = gpu.physicalCapacityGb || (gpu.capacityGb + (gpu.reservedHeadroomGb || 0));
  const segments = [
    { key: "weights", label: uiLanguage === "en" ? "Weights" : "가중치", value: totals.weights },
    { key: "kv", label: "KV", value: totals.kv },
    { key: "runtime", label: uiLanguage === "en" ? "Runtime" : "런타임", value: totals.runtime },
    { key: "safety", label: uiLanguage === "en" ? "Safety" : "안전 여유", value: gpu.reservedHeadroomGb || 0 },
    { key: "free", label: uiLanguage === "en" ? "Free" : "남음", value: gpu.remaining },
  ];
  return `
    <div class="placement-memory-map" role="img" aria-label="${escapeAttr(segments.map((segment) => `${segment.label} ${formatGb(segment.value)}`).join(", "))}">
      <div class="placement-memory-track">
        ${segments.map((segment) => `<span class="placement-memory-${escapeAttr(segment.key)}" style="width:${Math.max(0, Math.min(100, segment.value / Math.max(total, 0.1) * 100))}%"></span>`).join("")}
      </div>
      <div class="placement-memory-legend">
        ${segments.map((segment) => `<span><i class="placement-memory-${escapeAttr(segment.key)}"></i>${escapeHtml(segment.label)} ${escapeHtml(formatGb(segment.value))}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderGpuPlacementResult(placement) {
  const gpuCards = placement.gpus
    .map((gpu) => {
      const rows = gpu.placements.length
        ? gpu.placements
            .map(
              (item) => `
                <div class="gpu-placement-model-row">
                  <span>${escapeHtml(item.model.name)}${item.isPrimary ? ` <span class="placement-primary-badge">${escapeHtml(uiLanguage === "en" ? "Primary" : "주 모델")}</span>` : ""}${item.isReplica ? ` <span class="placement-replica-badge">${escapeHtml(uiLanguage === "en" ? `Replica ${item.replicaIndex}` : `복제 ${item.replicaIndex}`)}</span>` : ""} · ${escapeHtml(item.label)}${item.settingChanged ? ` · ${escapeHtml(uiLanguage === "en" ? "precision adjusted" : "정밀도 자동 조정")}` : ""}${item.contextReduced ? ` · ${escapeHtml(uiLanguage === "en" ? "context reduced" : "컨텍스트 축소")}` : ""}</span>
                  <span>${escapeHtml(formatGb(item.requiredGb))}</span>
                </div>
                <div class="gpu-placement-capacity-line">${renderPlacementCapacityLine(item.capacity)}</div>
              `,
            )
            .join("")
        : `<p class="gpu-placement-empty">${escapeHtml(uiLanguage === "en" ? "No models placed on this GPU." : "이 GPU에는 배치된 모델이 없습니다.")}</p>`;

      return `
        <div class="gpu-placement-card">
          <div class="gpu-placement-card-head">
            <span>GPU ${gpu.index + 1} · ${escapeHtml(gpu.preset.name)}${gpu.count > 1 ? ` × ${gpu.count}` : ""}</span>
            <small>${uiLanguage === "en" ? "free" : "여유"} ${escapeHtml(formatGb(gpu.remaining))} / ${uiLanguage === "en" ? "physical" : "물리"} ${escapeHtml(formatGb(gpu.physicalCapacityGb || gpu.capacityGb))}</small>
          </div>
          ${renderPlacementMemoryBar(gpu)}
          ${rows}
        </div>
      `;
    })
    .join("");
  const searchMeta = placement.searchMeta;
  const searchNote = searchMeta
    ? `<p class="placement-search-note">${escapeHtml(searchMeta.mode === "exact"
        ? (uiLanguage === "en" ? `Exact search · ${searchMeta.exploredStates.toLocaleString()} states` : `정확 탐색 · ${searchMeta.exploredStates.toLocaleString()}개 상태`)
        : (uiLanguage === "en" ? `Bounded approximate search · ${searchMeta.exploredStates.toLocaleString()} states` : `제한된 근사 탐색 · ${searchMeta.exploredStates.toLocaleString()}개 상태`))}</p>`
    : "";

  return searchNote + gpuCards + renderPlacementUnplacedBlock(placement.unplaced);
}

// "대체 모델" mode: models are never simultaneously resident, so each one is
// evaluated independently against a whole GPU's full capacity (no sharing,
// no bin-packing) — the estimator functions are the same ones the co-resident
// path uses, just called with the GPU's full capacityGb as the budget.
function computeAlternatePlacement(gpuRows, modelKeys) {
  const hardwareBase = getHardware();
  const singleUserHardware = { ...hardwareBase, concurrency: 1 };
  const gpus = buildPlacementGpuRows(gpuRows);

  const models = modelKeys.map((key) => getModelByKey(key)).filter(Boolean);
  const items = [];
  const unplaced = [];

  for (const model of models) {
    const key = modelKey(model);
    const config = getPlacementModelConfig(key);
    const options = getPlacementSearchCandidates(model, config, singleUserHardware, Math.max(...gpus.map((gpu) => gpu.capacityGb)));
    let best = null;
    for (const gpu of gpus) {
      if (config.pinnedGpu !== "" && Number(config.pinnedGpu) !== gpu.index) continue;
      for (const fit of options) {
        if (fit.requiredGb > gpu.capacityGb) continue;
        const hw = buildGpuPlacementHardware(
          fit.contextTokens ? { ...singleUserHardware, context: fit.contextTokens } : singleUserHardware,
          gpu,
          gpu.capacityGb,
        );
        const capacity = getPlacementCapacity(model, fit.setting, hw, gpu.capacityGb);
        const score = (capacity.kind === "concurrency" ? capacity.recommendedN : capacity.value) * config.requestShare - fit.changeCost;
        if (!best || score > best.score) {
          best = { gpu, setting: fit.setting, label: fit.label, requiredGb: fit.requiredGb, capacity, score, contextTokens: fit.contextTokens, config };
        }
      }
    }
    if (best) {
      items.push({ model, gpuIndex: best.gpu.index, gpu: best.gpu, setting: best.setting, label: best.label, requiredGb: best.requiredGb, capacity: best.capacity });
    } else {
      const minimum = options.reduce((value, option) => Math.min(value, option.requiredGb), Infinity);
      unplaced.push({ model, minRequiredGb: Number.isFinite(minimum) ? minimum : 0 });
    }
  }

  return { items, unplaced };
}

function renderAlternatePlacementResult(altPlacement) {
  if (!altPlacement.items.length && !altPlacement.unplaced.length) {
    return `<p class="gpu-placement-empty">${escapeHtml(uiLanguage === "en" ? "No models placed." : "배치된 모델이 없습니다.")}</p>`;
  }
  const runsOn = uiLanguage === "en" ? "Runs on" : "실행 GPU";
  const cards = altPlacement.items
    .map(
      (item) => `
        <div class="gpu-placement-card">
          <div class="gpu-placement-card-head">
            <span>${escapeHtml(item.model.name)} · ${escapeHtml(item.label)}</span>
            <small>${escapeHtml(runsOn)}: GPU ${item.gpuIndex + 1} · ${escapeHtml(gpuPlacementPresetLabel(item.gpu))} · ${escapeHtml(formatGb(item.requiredGb))}</small>
          </div>
          <div class="gpu-placement-capacity-line">${renderPlacementCapacityLine(item.capacity)}</div>
        </div>
      `,
    )
    .join("");
  return cards + renderPlacementUnplacedBlock(altPlacement.unplaced);
}

function gpuPlacementPresetLabel(gpu) {
  return `${gpu.preset.name}${gpu.count > 1 ? ` × ${gpu.count}` : ""}`;
}

// 배치 계산 결과를 실제로 복사/붙여넣기 할 수 있는 실행 명령어와 docker-compose 초안으로 만듭니다.
// 모델 상세 화면에서 이미 검증된 커맨드 빌더(buildOllamaCommand 등)를 그대로 재사용해
// 개별 모델 페이지의 실행 예시와 항상 같은 명령어를 보여줍니다.
function buildPlacementDeploymentScript(placement) {
  const hardware = getHardware();
  const lines = [
    "#!/usr/bin/env bash",
    uiLanguage === "en"
      ? "# AI Hardware Fit — draft run commands generated from the placement result"
      : "# AI Hardware Fit — 배치 계산 결과 기반 실행 명령어 초안",
    uiLanguage === "en"
      ? "# This is an estimated placement. Re-check each model's license and the latest run options before deploying."
      : "# 추정 배치입니다. 실제 배포 전 각 모델의 라이선스와 최신 실행 옵션을 다시 확인하세요.",
    "",
  ];

  placement.gpus.forEach((gpu) => {
    if (!gpu.placements.length) return;
    lines.push(`# ===== GPU ${gpu.index + 1} · ${gpu.preset.name}${gpu.count > 1 ? ` × ${gpu.count}` : ""} =====`);
    lines.push(`export CUDA_VISIBLE_DEVICES=${gpu.index}`);
    lines.push("");
    gpu.placements.forEach((item) => {
      lines.push(`# ${item.model.name} (${item.label})`);
      if (!item.model.type || item.model.type === "generative") {
        lines.push(buildOllamaCommand(item.model, item.setting, hardware));
        lines.push(buildLlamaCppCommand(item.model, item.setting, hardware));
      } else {
        const defaultBatchSize = PLACEMENT_DEFAULT_WORKLOADS[item.model.type]?.batchSize
          ?? PLACEMENT_DEFAULT_WORKLOADS.vision.batchSize;
        lines.push(buildNonGenerativeCommand(item.model, { precision: item.setting }, defaultBatchSize));
      }
      lines.push("");
    });
  });

  if (placement.unplaced.length) {
    lines.push(uiLanguage === "en"
      ? "# ===== Models that didn't fit (not enough GPU headroom) ====="
      : "# ===== 배치하지 못한 모델 (GPU 여유 부족) =====");
    placement.unplaced.forEach((item) => {
      lines.push(uiLanguage === "en"
        ? `# ${item.model.name} — needs at least ${formatGb(item.minRequiredGb)}`
        : `# ${item.model.name} — 최소 ${formatGb(item.minRequiredGb)} 필요`);
    });
    lines.push("");
  }

  return lines.join("\n");
}

// Ollama(생성형)와 TEI(임베딩/리랭커)만 표준 docker 서비스 패턴이 일정해서 compose로 생성합니다.
// OCR/VLM은 모델마다 vLLM, Transformers, 전용 CLI 등 실행 방식이 제각각이라 잘못된 서비스 정의를
// 만들지 않도록 compose에는 안내 주석만 남기고, 정확한 명령어는 위 .sh 스크립트를 참고하게 합니다.
function buildPlacementDockerCompose(placement) {
  const services = [];
  const volumeNames = [];
  let hostPort = 8081;

  placement.gpus.forEach((gpu) => {
    if (!gpu.placements.length) return;

    const generativeItems = gpu.placements.filter((item) => !item.model.type || item.model.type === "generative");
    const encoderItems = gpu.placements.filter((item) => item.model.type === "embedding" || item.model.type === "reranker");
    const visionItems = gpu.placements.filter((item) => item.model.type && !["generative", "embedding", "reranker"].includes(item.model.type));

    if (generativeItems.length) {
      const serviceName = `ollama-gpu${gpu.index + 1}`;
      const volumeName = `${serviceName}_data`;
      volumeNames.push(volumeName);
      const pullHint = generativeItems
        .map((item) => `    #   docker exec ${serviceName} ollama pull ${buildOllamaModelName(item.model)}  # ${item.model.name} (${item.label})`)
        .join("\n");
      const pullHintLabel = uiLanguage === "en"
        ? "# After the first startup, pull the model with:"
        : "# 최초 기동 후 아래 명령으로 모델을 내려받으세요:";
      services.push(`  ${serviceName}:
    image: ollama/ollama:latest
    container_name: ${serviceName}
    restart: unless-stopped
    ports:
      - "${hostPort}:11434"
    volumes:
      - ${volumeName}:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ["${gpu.index}"]
              capabilities: [gpu]
    ${pullHintLabel}
${pullHint}`);
      hostPort += 1;
    }

    encoderItems.forEach((item) => {
      const serviceName = `tei-${toSlug(item.model.name)}`;
      services.push(`  ${serviceName}:
    image: ghcr.io/huggingface/text-embeddings-inference:cuda-latest
    container_name: ${serviceName}
    restart: unless-stopped
    ports:
      - "${hostPort}:80"
    environment:
      - MODEL_ID=${item.model.name}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ["${gpu.index}"]
              capabilities: [gpu]`);
      hostPort += 1;
    });

    if (visionItems.length) {
      const names = visionItems.map((item) => item.model.name).join(", ");
      services.push(uiLanguage === "en"
        ? `  # The ${visionItems.length} OCR/VLM model(s) placed on GPU ${gpu.index + 1} (${names})
  # aren't auto-generated as a standard service since each one runs differently
  # (vLLM, Transformers, a dedicated CLI, etc.).
  # Use the run commands (.sh) or the model detail screen's "run example" to set these up manually.`
        : `  # GPU ${gpu.index + 1}에 배치된 OCR/VLM 모델 ${visionItems.length}개(${names})는
  # 모델마다 실행 방식(vLLM, Transformers, 전용 CLI 등)이 달라 표준 서비스로 자동 생성하지 않습니다.
  # 실행 명령어(.sh) 또는 앱의 모델 상세 화면 "실행 예시"를 참고해 직접 구성하세요.`);
    }
  });

  const volumesBlock = volumeNames.length
    ? `\n\nvolumes:\n${volumeNames.map((name) => `  ${name}:`).join("\n")}`
    : "";

  const header = uiLanguage === "en"
    ? `# AI Hardware Fit — draft docker-compose generated from the placement result (reference only)
# This is an estimated placement and requires nvidia-container-toolkit.
# Re-check resource limits, port conflicts, and each model's license before running this in production.`
    : `# AI Hardware Fit — 배치 계산 결과 기반 docker-compose 초안 (참고용)
# 추정 배치이며 nvidia-container-toolkit 설치가 필요합니다.
# 실제 운영 전 리소스 한도, 포트 충돌, 각 모델 라이선스를 반드시 다시 확인하세요.`;

  return `${header}
services:
${services.join("\n\n")}${volumesBlock}
`;
}

function renderPlacementExport(placement) {
  const target = $("gpuPlacementExport");
  if (!target) return;

  const hasPlacements = placement.gpus.some((gpu) => gpu.placements.length);
  if (!hasPlacements) {
    target.hidden = true;
    target.innerHTML = "";
    return;
  }

  const script = buildPlacementDeploymentScript(placement);
  const compose = buildPlacementDockerCompose(placement);
  const copyLabel = uiLanguage === "en" ? "Copy" : "복사";
  const downloadLabel = uiLanguage === "en" ? "Download" : "다운로드";

  target.hidden = false;
  target.innerHTML = `
    <details class="gpu-placement-export-panel">
      <summary>${escapeHtml(uiLanguage === "en" ? "Export run config (run commands · docker-compose draft)" : "실행 설정 내보내기 (실행 명령어 · docker-compose 초안)")}</summary>
      <div class="gpu-placement-export-body">
        <p>${escapeHtml(uiLanguage === "en"
          ? "A draft based on the current placement result. Re-check each model's license, the latest run options, and GPU resources before deploying."
          : "배치 계산 결과를 기준으로 만든 초안입니다. 실제 배포 전 각 모델의 라이선스, 최신 실행 옵션, GPU 리소스를 다시 확인하세요.")}</p>

        <div class="export-block-head">
          <span>${escapeHtml(uiLanguage === "en" ? "Run commands (.sh)" : "실행 명령어 (.sh)")}</span>
          <div class="export-block-actions">
            <button type="button" class="ghost-button" data-copy-target="placementExportScript">${escapeHtml(copyLabel)}</button>
            <button type="button" class="ghost-button" data-download-target="placementExportScript" data-download-filename="ai-hardware-fit-run.sh">${escapeHtml(downloadLabel)}</button>
          </div>
        </div>
        <pre class="command-block" id="placementExportScript"><code>${escapeHtml(script)}</code></pre>

        <div class="export-block-head">
          <span>${escapeHtml(uiLanguage === "en" ? "docker-compose.yml draft (Ollama · TEI)" : "docker-compose.yml 초안 (Ollama · TEI)")}</span>
          <div class="export-block-actions">
            <button type="button" class="ghost-button" data-copy-target="placementExportCompose">${escapeHtml(copyLabel)}</button>
            <button type="button" class="ghost-button" data-download-target="placementExportCompose" data-download-filename="docker-compose.yml">${escapeHtml(downloadLabel)}</button>
          </div>
        </div>
        <pre class="command-block" id="placementExportCompose"><code>${escapeHtml(compose)}</code></pre>
      </div>
    </details>
  `;
}

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
}

function renderBenchmarkDashboard() {
  const target = $("benchmarkDashboard");
  if (!target) return;
  const en = uiLanguage === "en";
  const measured = BENCHMARKS.filter((row) => benchmarkEvidenceType(row) !== "external");
  const external = BENCHMARKS.filter((row) => benchmarkEvidenceType(row) === "external");
  const gpuIds = new Set(measured.map((row) => row.gpuId).filter(Boolean));
  const modelNames = new Set(measured.map((row) => row.modelName || row.modelKey).filter(Boolean));
  const errors = computeBenchmarkErrorStats();
  const targets = ["rtx3060-12", "rtx4090-24", "rtx5090-32", "rx7900xtx-24", "ryzen-ai-max-plus-395-128", "arcb580-12", "m4max-128"]
    .filter((id) => !gpuIds.has(id))
    .map((id) => GPU_PRESETS.find((gpu) => gpu.id === id)?.name)
    .filter(Boolean);
  target.innerHTML = `
    <div class="gpu-insights-head">
      <div><span class="section-kicker">MEASURED DATA</span><h2 id="benchmarkDashboardTitle">${uiText("benchmark.dashboard")}</h2></div>
      <a class="ghost-button" href="https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml" target="_blank" rel="noreferrer">${uiText("benchmark.submit")}</a>
    </div>
    <div class="benchmark-dashboard-grid">
      <div><span>${en ? "Measured rows" : "실측 데이터"}</span><strong>${measured.length}</strong></div>
      <div><span>${en ? "GPU coverage" : "측정 GPU"}</span><strong>${gpuIds.size}</strong></div>
      <div><span>${en ? "Model coverage" : "측정 모델"}</span><strong>${modelNames.size}</strong></div>
      <div><span>${en ? "External references" : "외부 참고값"}</span><strong>${external.length}</strong></div>
      <div><span>${en ? "Average estimate error" : "평균 추정 오차"}</span><strong>${errors ? `${errors.avgAbsErrorPct.toFixed(1)}%` : "—"}</strong></div>
    </div>
    <p>${targets.length ? `${en ? "Priority measurements needed" : "우선 측정 필요"}: ${escapeHtml(targets.slice(0, 5).join(", "))}` : (en ? "Priority GPU coverage is complete." : "우선 GPU 측정 범위가 충족되었습니다.")}</p>
  `;
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
    .map((gpu) => `<a href="${escapeAttr(gpu.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(shortGpuName(gpu.name))} 스펙 출처</a>`)
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

function renderGpuAdvisor() {
  const panel = $("gpuAdvisorPanel");
  if (!panel) return;
  panel.hidden = coreTaskMode !== "modelFinder";
  if (panel.hidden) return;
  const en = uiLanguage === "en";
  $("gpuAdvisorTitle").textContent = en ? "GPU recommendations by model, budget, and power" : "예산·전력·모델 기준 GPU 추천";
  $("gpuAdvisorDescription").textContent = en
    ? "Choose a model and cost constraints to rank compatible GPUs by value, speed, and energy."
    : "원하는 모델과 비용 조건을 넣으면 적합한 GPU를 가격·속도·전력 기준으로 정렬합니다.";
  const labels = {
    advisorModelCategoryLabel: en ? "Model category" : "모델 종류",
    advisorModelSearchLabel: en ? "Search models" : "모델 검색",
    advisorModelLabel: en ? "Model to run" : "실행할 모델",
    advisorBudgetLabel: en ? "GPU budget (USD)" : "GPU 예산 (USD)",
    advisorElectricityLabel: en ? "Electricity (USD/kWh)" : "전기요금 (USD/kWh)",
    advisorHoursLabel: en ? "Hours per month" : "월 사용 시간",
    advisorVendorLabel: en ? "Vendor" : "제조사",
    advisorFormFactorLabel: en ? "Form factor" : "형태",
  };
  Object.entries(labels).forEach(([id, text]) => { if ($(id)) $(id).textContent = text; });
  if ($("advisorModelSearch")) $("advisorModelSearch").placeholder = en ? "Name, provider, or tag" : "이름·제공사·태그 부분검색";
  [...($("advisorModelCategory")?.options || [])].forEach((option) => {
    const category = ADVISOR_MODEL_CATEGORIES.find((item) => item.id === option.value);
    if (category) option.textContent = en ? category.en : category.ko;
  });
  if ($("advisorModelCount")) {
    const count = $("advisorModel").options.length;
    $("advisorModelCount").textContent = en ? `${count} models` : `${count}개 모델`;
  }
  const vendorOptions = en ? ["All", "NVIDIA", "AMD", "Intel", "Apple"] : ["전체", "NVIDIA", "AMD", "Intel", "Apple"];
  [...$("advisorVendor").options].forEach((option, index) => { option.textContent = vendorOptions[index]; });
  const formOptions = en ? ["All", "Desktop", "Laptop", "Data center", "Unified memory"] : ["전체", "데스크톱", "노트북", "데이터센터", "통합 메모리"];
  [...$("advisorFormFactor").options].forEach((option, index) => { option.textContent = formOptions[index]; });
  if ($("mediaOptimizationLabel")) $("mediaOptimizationLabel").textContent = en ? "Generation optimization" : "생성 최적화";
  if ($("mediaOptimization")) {
    const optionLabels = en
      ? ["Standard", "Sage/Flash Attention", "TeaCache", "Attention + TeaCache"]
      : ["기본", "Sage/Flash Attention", "TeaCache", "Attention + TeaCache"];
    [...$("mediaOptimization").options].forEach((option, index) => { option.textContent = optionLabels[index]; });
  }

  const model = getModelByKey($("advisorModel").value);
  if (!model) {
    $("gpuAdvisorResult").innerHTML = `<p class="empty-state">${en ? "No matching model. Try another category or search term." : "일치하는 모델이 없습니다. 종류나 검색어를 바꿔보세요."}</p>`;
    return;
  }
  const budget = clampNumber($("advisorBudgetUsd").value, 0, 100000, 2000);
  const rate = clampNumber($("advisorElectricityRate").value, 0, 5, 0.15);
  const hours = clampNumber($("advisorHoursMonth").value, 1, 744, 120);
  const vendor = $("advisorVendor").value;
  const formFactor = $("advisorFormFactor").value;
  const currentHardware = hasPrimaryGpuSelection ? getHardware() : null;
  const currentEstimate = currentHardware ? estimateAnyModelForHardware(model, currentHardware) : null;
  const currentSpeed = Number(currentEstimate?.speed || currentEstimate?.throughput || 0);
  const currentPrice = clampNumber($("advisorCurrentPriceUsd")?.value, 0, 100000, 0);
  const evaluatedCandidates = GPU_PRESETS
    .filter((gpu) => gpu.id !== "custom")
    .map((preset) => {
      const hardware = buildHardwareForPreset(preset);
      const estimate = estimateAnyModelForHardware(model, hardware);
      const market = gpuMarketReference(preset);
      const koreanMarket = KOREAN_GPU_MARKET.find((row) => row.gpuId === preset.id);
      const priceState = window.AIHardwareUI?.priceState({
        marketPrice: koreanMarket?.lowestKrw || 0,
        launchPrice: market.priceKind === "launch-reference" ? market.priceUsd : 0,
        updatedAt: koreanMarket?.updatedAt || "",
      }) || {
        kind: market.priceKind === "launch-reference" ? "launch" : "quote",
        label: market.priceKind === "launch-reference"
          ? (en ? "Launch-price reference" : "출시 가격 참고")
          : (en ? "No public Korean market price" : "공개 국내 시세 없음"),
        note: en ? "Enter a supplier quote or your own price" : "공급사 견적 또는 직접 입력으로 계산 가능",
      };
      const monthlyEnergy = market.powerW / 1000 * hours * rate;
      const fitsBudget = !market.priceUsd || market.priceUsd <= budget;
      const runnable = estimate && GRADE_META[estimate.grade]?.score >= GRADE_META.B.score;
      const speed = Number(estimate?.speed || estimate?.throughput || 0);
      const valueScore = runnable ? speed / Math.max(200, market.priceUsd || budget || 1000) : 0;
      const fitsVendor = vendor === "all" || preset.vendor === vendor;
      const fitsFormFactor = formFactor === "all" || preset.formFactor === formFactor;
      return { preset, estimate, market, koreanMarket, priceState, monthlyEnergy, fitsBudget, fitsVendor, fitsFormFactor, runnable, speed, valueScore };
    });
  const strictCandidates = evaluatedCandidates
    .filter((item) => item.runnable && item.fitsBudget && item.fitsVendor && item.fitsFormFactor)
    .sort((a, b) => b.valueScore - a.valueScore || b.speed - a.speed)
    .slice(0, 6);
  const showingAlternatives = strictCandidates.length === 0;
  const candidates = showingAlternatives
    ? evaluatedCandidates
      .filter((item) => item.runnable)
      .sort((a, b) => {
        const penalty = (item) => (item.fitsBudget ? 0 : 4) + (item.fitsVendor ? 0 : 2) + (item.fitsFormFactor ? 0 : 2);
        return penalty(a) - penalty(b) || b.valueScore - a.valueScore || b.speed - a.speed;
      })
      .slice(0, 6)
    : strictCandidates;

  $("gpuAdvisorResult").innerHTML = candidates.length ? `
    ${showingAlternatives ? `<div class="advisor-alternative-notice"><span>${en ? "No exact match. Showing the closest runnable alternatives." : "조건에 정확히 맞는 GPU가 없어 실행 가능한 가까운 대안을 보여드립니다."}</span><button type="button" class="ghost-button" data-advisor-relax>${en ? "Clear vendor and form filters" : "제조사·형태 필터 해제"}</button></div>` : ""}
    <div class="gpu-advisor-list">
      ${candidates.map((item, index) => `
        <article class="gpu-advisor-card">
          <div><span class="advisor-rank">#${index + 1}</span><strong>${escapeHtml(shortGpuName(item.preset.name))}</strong></div>
          <p>${escapeHtml(formatGb(item.preset.gpuUsableMemoryGb || item.preset.vram))} · ${escapeHtml(item.preset.vendor)} · ${escapeHtml(item.preset.formFactor)}</p>
          ${showingAlternatives ? `<p class="advisor-difference">${[
            !item.fitsVendor ? (en ? `Vendor alternative: ${item.preset.vendor}` : `제조사 대안: ${item.preset.vendor}`) : "",
            !item.fitsFormFactor ? (en ? `Form alternative: ${item.preset.formFactor}` : `형태 대안: ${item.preset.formFactor}`) : "",
            !item.fitsBudget ? (en ? "Above the selected budget" : "선택 예산 초과") : "",
          ].filter(Boolean).map((text) => `<span>${escapeHtml(text)}</span>`).join("")}</p>` : ""}
          <dl>
            <div><dt>${en ? "Estimated speed" : "예상 속도"}</dt><dd>${escapeHtml(formatThroughput(item.speed, item.estimate?.unitLabel || "tok/s"))}</dd></div>
            <div><dt>${en ? "Reference price" : "참고 가격"}</dt><dd class="price-state is-${escapeAttr(item.priceState.kind)}">${item.koreanMarket?.lowestKrw
              ? `${Math.round(item.koreanMarket.lowestKrw).toLocaleString(en ? "en-US" : "ko-KR")}${en ? " KRW" : "원"}`
              : item.priceState.kind === "launch"
                ? `$${item.market.priceUsd.toLocaleString("en-US")}`
                : item.priceState.label}<small>${escapeHtml(item.priceState.label)}${item.priceState.note ? ` · ${escapeHtml(item.priceState.note)}` : ""}</small></dd></div>
            <div><dt>${en ? "Monthly energy" : "월 전력비"}</dt><dd>$${item.monthlyEnergy.toFixed(2)}</dd></div>
            <div><dt>${en ? "Evidence" : "근거"}</dt><dd>${escapeHtml(gpuEvidenceLabel(item.preset, en))}</dd></div>
            <div><dt>${en ? "vs current GPU" : "현재 GPU 대비"}</dt><dd>${currentSpeed ? `${(item.speed / currentSpeed).toFixed(2)}×` : "—"}</dd></div>
            <div><dt>${en ? "Speed / $1K" : "가격 대비 속도"}</dt><dd>${(item.speed / Math.max(0.2, (item.market.priceUsd || currentPrice || budget) / 1000)).toFixed(1)}</dd></div>
          </dl>
          <button type="button" class="ghost-button" data-advisor-select-gpu="${escapeAttr(item.preset.id)}">${en ? "Use this GPU" : "이 GPU 선택"}</button>
        </article>
      `).join("")}
    </div>
    <p class="advisor-disclaimer">${en ? "A dated Korean market price is shown when available. Otherwise the UI clearly separates launch-price references from supplier-quote-required items. Energy cost uses the selected hours and rate." : "기준일이 있는 국내 시세만 시세로 표시하며, 나머지는 출시 가격 참고와 공급사 견적 필요 상태를 구분합니다. 전력비는 입력한 시간과 요금으로 계산합니다."}</p>
  ` : `<p class="empty-state">${en ? "No GPU with known specifications fits these conditions. Raise the budget or change a filter." : "현재 조건에 맞는 GPU가 없습니다. 예산을 높이거나 필터를 바꿔보세요."}</p>`;
  panel.querySelector("[data-advisor-relax]")?.addEventListener("click", () => {
    $("advisorVendor").value = "all";
    $("advisorFormFactor").value = "all";
    renderGpuAdvisor();
  });
  panel.querySelectorAll("[data-advisor-select-gpu]").forEach((button) => {
    button.addEventListener("click", () => {
      selectPrimaryGpu(button.dataset.advisorSelectGpu, { persist: true });
      render();
      $("hardwarePanel")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    });
  });
}

function renderGpuInsights(hardware) {
  const panel = $("gpuInsightsPanel");
  if (!panel) return;
  const show = hasPrimaryGpuSelection && coreTaskMode === "finder";
  panel.hidden = !show;
  if (!show) return;
  const preset = hardware.preset;
  const benchmarkRows = getGpuBenchmarkRows(preset);
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
    <div class="gpu-detail-fact">
      <span>${uiLanguage === "en" ? "Specification evidence" : "사양 근거"}</span>
      <strong>${preset.specStatus === "sourced" ? (uiLanguage === "en" ? "Official source linked" : "공식 출처 연결") : (uiLanguage === "en" ? "Estimated / needs review" : "추정값·검토 필요")}</strong>
      <small>${uiLanguage === "en" ? "Verified" : "검증일"}: ${escapeHtml(preset.verifiedAt || DATA_UPDATED_AT)}</small>
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

function computeSimpleRecommendations(allEstimates, purpose, priority) {
  let candidates = allEstimates.filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score);

  if (purpose && candidates.some((estimate) => estimate.model.tags.includes(purpose))) {
    candidates = candidates.filter((estimate) => estimate.model.tags.includes(purpose));
  }

  const sorted = [...candidates].sort((a, b) => {
    if (priority === "speed") return b.speed - a.speed || gradeSort(a, b) || a.requiredGb - b.requiredGb;
    if (priority === "quality") return gradeSort(a, b) || b.model.params - a.model.params || b.speed - a.speed;
    if (priority === "vramHeadroom") return (b.effectiveVram - b.requiredGb) - (a.effectiveVram - a.requiredGb) || gradeSort(a, b);
    return recommendationScore(b) - recommendationScore(a) || gradeSort(a, b) || a.pressure - b.pressure;
  });

  return sorted.slice(0, 3);
}

function getQuickRecommendationEstimates() {
  if (!hasPrimaryGpuSelection) return [];
  const hardware = getHardware();
  const estimates = getActiveModels().map((model) => estimateAnyModel(model, hardware));
  return computeSimpleRecommendations(
    estimates,
    $("simplePurpose")?.value || "general",
    $("simplePriority")?.value || "balanced",
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
    $("simplePurpose")?.value || "general",
    $("simplePriority")?.value || "balanced",
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
    const reasons = buildRecommendationReasons(estimate).slice(0, 3).map(localizeRecommendationReason);
    const key = modelKey(estimate.model);
    const isSelected = simpleExpandedKey === key;
    const ctaLabel = isSelected
      ? (uiLanguage === "en" ? "Viewing details" : "상세 보는 중")
      : t("detailCalculation");

    return `
      <div class="simple-pick-card ${index === 0 ? "is-top-pick" : ""} ${isSelected ? "is-selected" : ""}">
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
  const reasons = buildRecommendationReasons(estimate).slice(0, 4).map(localizeRecommendationReason);
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
      </section>
      <div class="simple-inspector-actions">
        <button type="button" class="primary-button" data-open-full-simple-detail="${escapeAttr(simpleExpandedKey)}">${en ? "Open full analysis" : "전체 상세 분석"}</button>
        <button type="button" class="ghost-button" data-share-model-link="${escapeAttr(simpleExpandedKey)}">${en ? "Copy result link" : "결과 링크 복사"}</button>
        <button type="button" class="ghost-button" data-download-simple-card="${escapeAttr(simpleExpandedKey)}">${en ? "Download PNG card" : "요약 카드 PNG"}</button>
      </div>
    </div>
  `;
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
        <small>추정 · ${escapeHtml(confidence.label)}</small>
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

  return `
    <div class="detail-title">
      <span class="grade-pill ${meta.className}" title="${escapeAttr(buildGradeTooltip(estimate))}">${meta.label}</span>
      <h2>${escapeHtml(model.name)}</h2>
      <p>${escapeHtml(model.maker)} · ${escapeHtml(model.license)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))} · ${model.tags.map(tagLabel).map(escapeHtml).join(" · ")}</p>
      <p class="detail-description">${escapeHtml(modelSummary(model))}</p>
    </div>

    ${renderShareActions(model)}

    <div class="detail-summary-grid">
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

const BENCHMARK_THROUGHPUT_FAMILIES = new Set(["tok/s", "doc/s", "pair/s", "page/s"]);
const BENCHMARK_DEFAULT_FAMILY_COUNT = 3;
const BENCHMARK_DEFAULT_ROWS_PER_FAMILY = 5;

// Most quality benchmarks in this dataset report a 0-100 score, but a few
// well-known ones use a different native scale — bars should fill against
// the metric's real ceiling, not just the highest value currently on
// screen, so the bar length is an honest read of "how good is this."
const BENCHMARK_SCORE_SCALE_OVERRIDES = {
  "MT-Bench": 10,
  LogicKor: 10,
  OCRBench: 1000,
  "Korean Avg": 1,
};
const BENCHMARK_DEFAULT_SCORE_SCALE = 100;

// Short, plain-language explanations shown under a chart group's title so
// unfamiliar benchmark names (MMLU-Pro, BEIR, ...) are legible at a glance.
const BENCHMARK_METRIC_DESCRIPTIONS = {
  ko: {
    "MMLU-Pro": "다양한 학문 분야 객관식 문제로 지식·추론 능력을 측정 (0~100점, 높을수록 좋음)",
    MMLU: "57개 과목 객관식 문제로 일반 지식을 측정하는 대표적 벤치마크 (0~100점, 높을수록 좋음)",
    MMMLU: "MMLU를 여러 언어로 번역해 다국어 지식을 측정 (0~100점, 높을수록 좋음)",
    KMMLU: "한국 현지 시험 문제 기반으로 한국어 지식을 측정하는 벤치마크 (0~100점, 높을수록 좋음)",
    "GPQA-D": "대학원 수준 과학 문제로 고난도 추론력을 측정 (0~100점, 높을수록 좋음)",
    GPQA: "대학원 수준 과학 문제로 고난도 추론력을 측정 (0~100점, 높을수록 좋음)",
    HumanEval: "코드 생성 정답률을 측정하는 프로그래밍 벤치마크 (0~100%, 높을수록 좋음)",
    MBPP: "짧은 파이썬 문제 풀이 정답률을 측정하는 프로그래밍 벤치마크 (0~100%, 높을수록 좋음)",
    "AIME24": "고난도 수학 경시대회 문제 정답률 (0~100%, 높을수록 좋음)",
    "AIME25": "고난도 수학 경시대회 문제 정답률 (0~100%, 높을수록 좋음)",
    MATH: "수학 문제 풀이 정답률을 측정하는 벤치마크 (0~100%, 높을수록 좋음)",
    GSM8K: "초중등 수준 산술 문장제 정답률을 측정 (0~100%, 높을수록 좋음)",
    BEIR: "여러 검색 과제를 모은 임베딩 검색 품질 벤치마크 (0~100, 높을수록 좋음)",
    "NDCG@10": "검색 결과 상위 10개의 순위 품질을 측정하는 지표 (0~100, 높을수록 좋음)",
    MTEB: "다양한 임베딩 과제를 모은 종합 벤치마크 (0~100, 높을수록 좋음)",
    IFEval: "복잡한 지시사항을 얼마나 정확히 따르는지 측정 (0~100%, 높을수록 좋음)",
    "MT-Bench": "여러 턴 대화 품질을 GPT가 채점하는 벤치마크 (0~10점, 높을수록 좋음)",
    LogicKor: "한국어 논리·추론 능력을 채점하는 벤치마크 (0~10점, 높을수록 좋음)",
    "Arena Hard": "어려운 실사용 질문에 대한 응답 품질을 비교 평가 (0~100, 높을수록 좋음)",
    OCRBench: "문서·장면 텍스트 인식 정확도를 종합 평가 (0~1000점, 높을수록 좋음)",
    "OCRBench v2": "OCRBench의 확장판으로 문서 인식 정확도를 평가 (0~100, 높을수록 좋음)",
    "OmniDocBench v1.5": "문서 파싱(텍스트·표·수식·레이아웃) 정확도를 종합 평가하는 벤치마크 (0~100, 높을수록 좋음)",
    "OmniDocBench v1.6": "문서 파싱(텍스트·표·수식·레이아웃) 정확도를 종합 평가하는 벤치마크 v1.6판 (0~100, 높을수록 좋음)",
    "OCR Acc": "텍스트 인식 가중 정확도 (0~100%, 높을수록 좋음)",
    "olmOCR-bench": "문서를 마크다운으로 변환하는 정확도를 종합 평가하는 벤치마크 (0~100, 높을수록 좋음)",
    DocVQA: "문서 이미지에 대한 질의응답 정확도를 측정 (0~100, 높을수록 좋음)",
    MMMU: "이미지가 포함된 대학 수준 문제로 멀티모달 이해력을 측정 (0~100, 높을수록 좋음)",
    "Korean Avg": "한국어 벤치마크 여러 개의 평균 점수 (0~1, 높을수록 좋음)",
    Avg: "여러 벤치마크의 평균 점수 (높을수록 좋음)",
    "tok/s": "초당 생성 토큰 수 (텍스트 생성 속도, 높을수록 빠름)",
    "doc/s": "초당 처리 문서 수 (임베딩 처리 속도, 높을수록 빠름)",
    "pair/s": "초당 처리 문서쌍 수 (리랭킹 처리 속도, 높을수록 빠름)",
    "page/s": "초당 처리 페이지 수 (OCR 처리 속도, 높을수록 빠름)",
  },
  en: {
    "MMLU-Pro": "Multiple-choice knowledge/reasoning test across academic subjects (0-100, higher is better)",
    MMLU: "The classic 57-subject multiple-choice knowledge benchmark (0-100, higher is better)",
    MMMLU: "MMLU translated into multiple languages to test multilingual knowledge (0-100, higher is better)",
    KMMLU: "Knowledge benchmark built from real Korean exam questions (0-100, higher is better)",
    "GPQA-D": "Graduate-level science questions testing hard reasoning (0-100, higher is better)",
    GPQA: "Graduate-level science questions testing hard reasoning (0-100, higher is better)",
    HumanEval: "Code-generation accuracy benchmark (0-100%, higher is better)",
    MBPP: "Short Python problem-solving accuracy benchmark (0-100%, higher is better)",
    AIME24: "Accuracy on hard math-competition problems (0-100%, higher is better)",
    AIME25: "Accuracy on hard math-competition problems (0-100%, higher is better)",
    MATH: "Math problem-solving accuracy benchmark (0-100%, higher is better)",
    GSM8K: "Grade-school arithmetic word-problem accuracy (0-100%, higher is better)",
    BEIR: "A collection of retrieval tasks used to grade embedding search quality (0-100, higher is better)",
    "NDCG@10": "Ranking quality of the top 10 search results (0-100, higher is better)",
    MTEB: "A broad suite of embedding tasks combined into one benchmark (0-100, higher is better)",
    IFEval: "How precisely a model follows complex instructions (0-100%, higher is better)",
    "MT-Bench": "Multi-turn conversation quality, graded by GPT (0-10, higher is better)",
    LogicKor: "Korean logic/reasoning ability benchmark (0-10, higher is better)",
    "Arena Hard": "Response quality on hard real-world questions, compared head-to-head (0-100, higher is better)",
    OCRBench: "Aggregate document/scene text-recognition accuracy (0-1000, higher is better)",
    "OCRBench v2": "An expanded version of OCRBench for document recognition accuracy (0-100, higher is better)",
    "OmniDocBench v1.5": "Aggregate document-parsing accuracy (text/tables/formulas/layout) (0-100, higher is better)",
    "OmniDocBench v1.6": "Aggregate document-parsing accuracy, v1.6 revision (0-100, higher is better)",
    "OCR Acc": "Weighted text-recognition accuracy (0-100%, higher is better)",
    "olmOCR-bench": "Aggregate accuracy for converting documents to markdown (0-100, higher is better)",
    DocVQA: "Question-answering accuracy over document images (0-100, higher is better)",
    MMMU: "College-level multimodal understanding with images (0-100, higher is better)",
    "Korean Avg": "Average score across several Korean-language benchmarks (0-1, higher is better)",
    Avg: "Average score across several benchmarks (higher is better)",
    "tok/s": "Tokens generated per second (text generation speed, higher is faster)",
    "doc/s": "Documents processed per second (embedding throughput, higher is faster)",
    "pair/s": "Document pairs processed per second (reranking throughput, higher is faster)",
    "page/s": "Pages processed per second (OCR throughput, higher is faster)",
  },
};

function benchmarkMetricDescription(family) {
  const dict = BENCHMARK_METRIC_DESCRIPTIONS[uiLanguage] || BENCHMARK_METRIC_DESCRIPTIONS.ko;
  return dict[family] || null;
}

function benchmarkScoreScaleMax(family, entries) {
  const assumed = BENCHMARK_SCORE_SCALE_OVERRIDES[family] ?? BENCHMARK_DEFAULT_SCORE_SCALE;
  const observedMax = Math.max(...entries.map((entry) => entry.value));
  // Safety net: if an unrecognized metric's real values exceed our assumed
  // ceiling, the assumption is wrong for this group — fall back to scaling
  // against the observed max rather than clamping everything to 100%.
  return { scaleMax: Math.max(assumed, observedMax), isAssumedScale: observedMax <= assumed };
}

function benchmarkGroupAnalysisText(family, sortedDesc) {
  if (sortedDesc.length < 2) return null;
  const best = sortedDesc[0];
  const worst = sortedDesc[sortedDesc.length - 1];
  if (best.value === worst.value) return null;
  const isThroughput = BENCHMARK_THROUGHPUT_FAMILIES.has(family);
  const diffPct = worst.value !== 0 ? Math.round(((best.value - worst.value) / Math.abs(worst.value)) * 100) : null;

  if (uiLanguage === "en") {
    const verb = isThroughput ? "fastest" : "highest";
    const tail = diffPct !== null && diffPct > 0 ? ` — ${diffPct}% ahead of ${worst.row.modelName}` : "";
    return `On ${family}, ${best.row.modelName} is ${verb} at ${best.value.toLocaleString()}${tail}.`;
  }
  const verb = isThroughput ? "가장 빠릅니다" : "가장 높습니다";
  const tail = diffPct !== null && diffPct > 0 ? ` (${worst.row.modelName} 대비 +${diffPct}%)` : "";
  return `${family} 기준 ${best.row.modelName}이(가) ${best.value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}로 ${verb}${tail}.`;
}

function renderBenchmarkChart(allRows, selectedRows) {
  const target = $("benchmarkChart");
  if (!target) return;
  const isDefault = !selectedRows;
  const sourceRows = isDefault ? allRows : selectedRows;
  const chartable = sourceRows
    .map((row) => ({ row, family: benchmarkMetricFamily(row), value: benchmarkMetricValue(row) }))
    .filter((entry) => entry.family && typeof entry.value === "number");

  if (!chartable.length) {
    target.hidden = true;
    target.innerHTML = "";
    return;
  }

  const groups = new Map();
  chartable.forEach((entry) => {
    const group = groups.get(entry.family) || [];
    group.push(entry);
    groups.set(entry.family, group);
  });

  let groupEntries = [...groups.entries()];
  if (isDefault) {
    // Nothing checked yet: surface the most-populated metric families so the
    // chart isn't empty, rather than requiring a selection first.
    groupEntries = groupEntries
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, BENCHMARK_DEFAULT_FAMILY_COUNT)
      .map(([family, entries]) => [
        family,
        [...entries].sort((a, b) => b.value - a.value).slice(0, BENCHMARK_DEFAULT_ROWS_PER_FAMILY),
      ]);
  }

  target.hidden = false;
  const intro = isDefault
    ? (uiLanguage === "en"
        ? "No rows selected yet — showing the top entries for the most common metrics below. Check rows in the table to compare specific models instead."
        : "아직 선택한 행이 없어 가장 많이 등장하는 지표의 상위 항목을 보여주고 있습니다. 표에서 체크하면 원하는 모델로 바뀝니다.")
    : (uiLanguage === "en"
        ? "Only rows sharing the exact same metric are grouped into one bar chart — different metrics are never compared directly."
        : "정확히 같은 지표를 가진 행끼리만 하나의 막대 그래프로 묶습니다. 서로 다른 지표는 직접 비교하지 않습니다.");

  target.innerHTML = `
    <p class="benchmark-chart-intro">${escapeHtml(intro)}</p>
    ${groupEntries.map(([family, entries]) => {
      const isThroughput = BENCHMARK_THROUGHPUT_FAMILIES.has(family);
      const sorted = [...entries].sort((a, b) => b.value - a.value);
      const analysis = benchmarkGroupAnalysisText(family, sorted);
      const description = benchmarkMetricDescription(family);
      // Throughput metrics (tok/s, ...) have no fixed ceiling, so bars stay
      // relative to whatever's on screen. Score-style metrics fill against
      // their real scale (100 for most, 10 for MT-Bench, etc.) so the bar
      // length honestly reflects the value instead of every close-together
      // score stretching to look ~100% full.
      const { scaleMax, isAssumedScale } = isThroughput
        ? { scaleMax: Math.max(...entries.map((entry) => entry.value)), isAssumedScale: false }
        : benchmarkScoreScaleMax(family, entries);
      return `
        <div class="benchmark-chart-group">
          <span class="benchmark-chart-group-title">${escapeHtml(family)}</span>
          ${description ? `<p class="benchmark-chart-group-description">${escapeHtml(description)}</p>` : ""}
          ${sorted.map(({ row, value }) => `
            <div class="benchmark-chart-bar-row">
              <span class="benchmark-chart-bar-label" title="${escapeAttr(`${row.modelName} · ${row.gpu || row.gpuId || ""}`)}">${escapeHtml(row.modelName)}</span>
              <span class="benchmark-chart-bar-track"><span class="benchmark-chart-bar-fill" style="width:${Math.max(2, Math.round((value / scaleMax) * 100))}%"></span></span>
              <span class="benchmark-chart-bar-value">${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${!isThroughput && isAssumedScale ? `<span class="benchmark-chart-bar-scale">/${scaleMax}</span>` : ""}</span>
            </div>
          `).join("")}
          ${analysis ? `<p class="benchmark-chart-group-analysis">${escapeHtml(analysis)}</p>` : ""}
        </div>
      `;
    }).join("")}
  `;
}

// Shared row-building logic for the benchmark sheet: assembles the same
// concatenated, rowKey-tagged row list every caller needs (the table/chart
// render below, and selectBenchmarkMetricFamily's quick-compare action) so
// rowKey values always line up regardless of who builds the list.
function buildBenchmarkSheetRows() {
  const benchmarkRows = BENCHMARKS.map((row) => ({ ...row, rowType: benchmarkEvidenceLabel(row) }));
  const userMeasurementRows = benchmarkRows.filter((row) => row.rowType === "사용자 측정");
  const projectMeasurementRows = benchmarkRows.filter((row) => row.rowType === "자체 측정");
  const externalBenchmarkRows = benchmarkRows.filter((row) => row.rowType === "외부 공개 참고값");
  const qualityRows = collectQualityBenchmarks();
  const referenceRows = collectReferenceBenchmarks();
  const rows = [...qualityRows, ...externalBenchmarkRows, ...referenceRows, ...userMeasurementRows, ...projectMeasurementRows];
  rows.forEach((row, index) => {
    row.rowKey = String(index);
    // qualityRows/referenceRows already carry params/active/releaseDate from
    // their source model; the raw BENCHMARKS-derived rows (external/user/
    // project measurements) only have modelName, so look the model up once
    // to fill in the same fields for the 규모/출시 column.
    if (row.params == null && row.releaseDate == null) {
      const model = getAllModels().find((item) => item.name === row.modelName);
      if (model) {
        row.params = model.params;
        row.active = model.active;
        row.releaseDate = model.releaseDate;
      }
    }
  });
  const externalReferenceCount = qualityRows.length + externalBenchmarkRows.length + referenceRows.length;
  return { rows, userMeasurementRows, projectMeasurementRows, externalReferenceCount };
}

// Populates the "지표로 비교할 모델 선택" dropdown with every metric family that
// has 2+ rows (families with a single row can never produce a real
// comparison, so they're left out). Picking one is a shortcut for manually
// hunting through checkboxes for rows that happen to share a metric.
function renderBenchmarkMetricFilterOptions(rows) {
  const select = $("benchmarkMetricFilter");
  if (!select) return;
  const counts = new Map();
  rows.forEach((row) => {
    const family = benchmarkMetricFamily(row);
    if (!family || typeof benchmarkMetricValue(row) !== "number") return;
    counts.set(family, (counts.get(family) || 0) + 1);
  });
  const families = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const placeholder = uiLanguage === "en" ? "Compare models by metric" : "지표로 비교할 모델 선택";
  const previousValue = select.value;
  select.innerHTML = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...families.map(
      ([family, count]) =>
        `<option value="${escapeAttr(family)}">${escapeHtml(family)} (${count}${uiLanguage === "en" ? "" : "개"})</option>`,
    ),
  ].join("");
  if (families.some(([family]) => family === previousValue)) select.value = previousValue;
}

// Selecting a metric from the dropdown checks every row that shares that
// exact metric family (capped at MAX_BENCHMARK_COMPARE, keeping the
// highest-value entries when there are more rows than the cap), so the
// chart below always renders a real multi-model comparison instead of the
// single-member groups that manual checkbox-picking often produces.
function selectBenchmarkMetricFamily(family) {
  if (!family) return;
  const { rows } = buildBenchmarkSheetRows();
  const matching = rows
    .map((row) => ({ row, value: benchmarkMetricValue(row) }))
    .filter((entry) => benchmarkMetricFamily(entry.row) === family && typeof entry.value === "number")
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_BENCHMARK_COMPARE);
  benchmarkCompareKeys = matching.map((entry) => entry.row.rowKey);
  renderBenchmarkSheet();
}

function renderBenchmarkSheet() {
  const table = $("benchmarkTable");
  if (!table) return;
  const { rows, userMeasurementRows, projectMeasurementRows, externalReferenceCount } = buildBenchmarkSheetRows();
  const errorStats = computeBenchmarkErrorStats();

  const benchmarkTypeLabel = uiLanguage === "en" ? "External public reference" : "외부 공개 참고값";
  const userTypeLabel = uiLanguage === "en" ? "User measurement" : "사용자 측정";
  const projectTypeLabel = uiLanguage === "en" ? "Project measurement" : "자체 측정";
  $("benchmarkMeta").textContent = `${t("updated")} ${DATA_UPDATED_AT} · ${benchmarkTypeLabel} ${externalReferenceCount}${uiLanguage === "en" ? "" : "개"} · ${userTypeLabel} ${userMeasurementRows.length}${uiLanguage === "en" ? "" : "개"} · ${projectTypeLabel} ${projectMeasurementRows.length}${uiLanguage === "en" ? "" : "개"}${errorStats ? ` · ${uiLanguage === "en" ? "Average estimate error" : "평균 추정 오차"} ${errorStats.avgAbsErrorPct.toFixed(1)}%` : ""}`;

  renderBenchmarkMetricFilterOptions(rows);

  // Drop selections for rows that no longer exist (defensive; row set only
  // changes with the underlying data, not with search/filtering).
  const validKeys = new Set(rows.map((row) => row.rowKey));
  benchmarkCompareKeys = benchmarkCompareKeys.filter((key) => validKeys.has(key));

  const compareBar = $("benchmarkCompareBar");
  if (compareBar) {
    if (!benchmarkCompareKeys.length) {
      compareBar.hidden = true;
      compareBar.innerHTML = "";
    } else {
      compareBar.hidden = false;
      const label = uiLanguage === "en"
        ? `${benchmarkCompareKeys.length} / ${MAX_BENCHMARK_COMPARE} selected for the chart below`
        : `아래 그래프에 ${benchmarkCompareKeys.length} / ${MAX_BENCHMARK_COMPARE}개 선택됨`;
      compareBar.innerHTML = `
        <span>${escapeHtml(label)}</span>
        <button type="button" class="ghost-button" data-clear-benchmark-compare>${t("clearFilters")}</button>
      `;
    }
  }
  renderBenchmarkChart(rows, benchmarkCompareKeys.length ? rows.filter((row) => benchmarkCompareKeys.includes(row.rowKey)) : null);

  const query = benchmarkSearchQuery.trim().toLowerCase();
  const visibleRows = query
    ? rows.filter((row) => [row.modelName, row.gpu, row.gpuId, row.metric, row.setting, row.runtime, row.workload]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query)))
    : rows;

  if (!rows.length) {
    table.innerHTML = `
      <div class="empty-state">
        ${uiLanguage === "en" ? "No external references or user/project measurements are registered. Estimates are shown separately in each detail panel." : "등록된 외부 공개 참고값과 사용자/자체 측정값이 없습니다. 계산 추정값은 상세 패널에서 별도로 표시됩니다."}
      </div>
    `;
    return;
  }

  if (!visibleRows.length) {
    table.innerHTML = `
      <div class="empty-state">
        ${uiLanguage === "en" ? "No benchmark rows match this search." : "검색 조건에 맞는 벤치마크 행이 없습니다."}
      </div>
    `;
    return;
  }

  table.innerHTML = `
    <div class="benchmark-table">
      <div class="benchmark-row benchmark-table-head">
        <span></span>
        <span>${t("type")}</span>
        <span>${t("model")}</span>
        <span>${t("environment")}</span>
        <span>${t("scaleRelease")}</span>
        <span>${t("metric")}</span>
        <span>${t("source")}</span>
      </div>
      ${visibleRows.map((row) => {
        const checked = benchmarkCompareKeys.includes(row.rowKey);
        const disabled = !checked && benchmarkCompareKeys.length >= MAX_BENCHMARK_COMPARE;
        const chartable = benchmarkMetricFamily(row) && typeof benchmarkMetricValue(row) === "number";
        return `
        <div class="benchmark-row">
          <span class="benchmark-row-select">
            ${chartable ? `<input type="checkbox" data-benchmark-key="${escapeAttr(row.rowKey)}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} title="${escapeAttr(uiLanguage === "en" ? "Add to chart (max 6)" : "그래프에 추가 (최대 6개)")}" aria-label="${escapeAttr(row.modelName)}" />` : ""}
          </span>
          <span><span class="data-kind ${row.rowType === "사용자 측정" || row.rowType === "자체 측정" ? "is-measured" : "is-reference"}"><span class="evidence-code">${benchmarkEvidenceCode(row.rowType)}</span>${escapeHtml(row.rowType === "외부 공개 참고값" ? benchmarkTypeLabel : row.rowType === "사용자 측정" ? userTypeLabel : projectTypeLabel)}</span></span>
          <span>${escapeHtml(row.modelName)}</span>
          <span>${escapeHtml(formatBenchmarkEnvironment(row))}</span>
          <span>${escapeHtml(formatBenchmarkScaleRelease(row))}</span>
          <span>${escapeHtml(formatBenchmarkMetric(row))}</span>
          <span>${row.sourceUrl ? renderExternalLink(t("view"), row.sourceUrl) : "-"}</span>
        </div>
      `;
      }).join("")}
    </div>
  `;
}

function collectQualityBenchmarks() {
  const seen = new Set();
  return Object.values(MODEL_GROUPS)
    .flat()
    .filter((model) => model.qualityBenchmark)
    .filter((model) => {
      const key = modelKey(model);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((model) => ({
      rowType: "외부 공개 참고값",
      modelName: model.name,
      gpu: "-",
      workload: model.type === "generative" ? WORKLOAD_META.generative.label : model.type || "-",
      setting: model.qualityBenchmark.note || "대표 공개 평가",
      metric: model.qualityBenchmark.label,
      sourceUrl: model.qualityBenchmark.sourceUrl,
      qualityValue: typeof model.qualityBenchmark.value === "number" ? model.qualityBenchmark.value : null,
      qualityMetricName: model.qualityBenchmark.metric || model.qualityBenchmark.label,
      params: model.params,
      active: model.active,
      releaseDate: model.releaseDate,
    }));
}

function collectReferenceBenchmarks() {
  return OCR_MODELS
    .filter((model) => model.reference?.pagesPerSecond)
    .map((model) => {
      const reference = getReferenceBenchmark(model);
      return {
        rowType: "외부 공개 참고값",
        modelName: model.name,
        gpuId: model.reference.gpuId,
        gpu: reference.gpu,
        workload: ocrTypeLabel(model.type),
        setting: reference.setting,
        pagesPerSecond: model.reference.pagesPerSecond,
        peakVramGb: model.reference.peakVramGb,
        sourceUrl: model.sourceUrl,
        params: model.params,
        active: model.active,
        releaseDate: model.releaseDate,
      };
    });
}

function getReferenceBenchmark(model) {
  const reference = model.reference;
  if (!reference?.pagesPerSecond) return null;
  const gpu = GPU_PRESETS.find((item) => item.id === reference.gpuId);
  const setting = [
    reference.width && reference.height ? `${reference.width}x${reference.height}` : "",
    reference.batch ? `batch ${reference.batch}` : "",
  ].filter(Boolean).join(" · ");
  return {
    gpu: gpu?.name || reference.gpuId || "GPU 미기재",
    setting: setting || ocrTypeLabel(model.type),
    metric: `${formatThroughput(reference.pagesPerSecond, "page/s")}${reference.peakVramGb ? ` · ${formatGb(reference.peakVramGb)}` : ""}`,
  };
}

function formatBenchmarkMetric(row) {
  if (row.tokensPerSecond) return `${formatThroughput(row.tokensPerSecond, "tok/s")}${row.peakVramGb ? ` · ${formatGb(row.peakVramGb)}` : ""}`;
  if (row.docsPerSecond) return `${formatThroughput(row.docsPerSecond, "doc/s")}${row.peakVramGb ? ` · ${formatGb(row.peakVramGb)}` : ""}`;
  if (row.pairsPerSecond) return `${formatThroughput(row.pairsPerSecond, "pair/s")}${row.peakVramGb ? ` · ${formatGb(row.peakVramGb)}` : ""}`;
  if (row.pagesPerSecond) return `${formatThroughput(row.pagesPerSecond, "page/s")}${row.peakVramGb ? ` · ${formatGb(row.peakVramGb)}` : ""}`;
  if (row.metric) return row.metric;
  return "-";
}

// GPU and condition used to be two separate columns, but for the large
// majority of rows (published quality benchmarks like MMLU) neither field is
// hardware-specific, so both sat empty/generic side by side. Merge them into
// one "환경" column and only show what's actually meaningful for the row.
function formatBenchmarkEnvironment(row) {
  const gpu = row.gpu && row.gpu !== "-" ? row.gpu : row.gpuId;
  const condition = row.setting || row.runtime || row.workload;
  if (gpu && condition) return `${gpu} · ${condition}`;
  return gpu || condition || "-";
}

// Frees up the space the empty GPU column used to take with something that's
// actually useful for every row: model scale (and active/MoE params, if
// smaller) plus release date, so the table can be scanned for recency/size
// without opening each model's detail panel.
function formatBenchmarkScaleRelease(row) {
  const parts = [];
  if (row.params) {
    parts.push(row.active && row.active < row.params
      ? `${formatParams(row.params)} A${formatParams(row.active)}`
      : formatParams(row.params));
  }
  if (row.releaseDate) parts.push(row.releaseDate);
  return parts.length ? parts.join(" · ") : "-";
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

document.addEventListener("DOMContentLoaded", init);
