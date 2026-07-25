const DATA = window.LLM_GPU_CHECKER_DATA || {};
const GPU_PRESETS = DATA.gpus || [];
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
const VISION_MODEL_TYPES = new Set(["ocr-pipeline", "ocr-vlm", "document-vlm", "general-vlm"]);
const VISION_WORKLOADS = new Set(["ocrPipeline", "documentVlm", "generalVlm"]);
const WORKLOAD_ALIASES = { ocr: "ocrPipeline" };
const OCR_PIPELINE_MODELS = OCR_MODELS.filter((model) => model.type === "ocr-pipeline");
const DOCUMENT_VLM_MODELS = OCR_MODELS.filter((model) => model.type === "ocr-vlm" || model.type === "document-vlm");
const GENERAL_VLM_MODELS = OCR_MODELS.filter((model) => model.type === "general-vlm");

function withModelMetadata(model, type) {
  const metadata = MODEL_METADATA[`${type}:${model.name}`] || MODEL_METADATA[model.name] || {};
  return { ...model, ...metadata, type };
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
// Which quick-recommend (빠른 추천) card is expanded inline, kept separate
// from selectedModelKey so it never opens the expert-mode drawer/inspector.
let simpleExpandedKey = "";
let viewMode = "list";
let settingsExpanded = false;
let compareKeys = [];
let compareModalOpen = false;
const MAX_COMPARE_MODELS = 3;
let benchmarkSearchQuery = "";
let benchmarkCompareKeys = [];
const MAX_BENCHMARK_COMPARE = 6;
let appMode = "simple";
let hasPrimaryGpuSelection = false;
let uiLanguage = "ko";

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

const ENGLISH_UI_REPLACEMENTS = [
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
  ["아직 선택된 모델이 없습니다.", "No models selected yet."],
  ["선택된 모델", "Selected models"],
  ["보유 GPU 목록", "GPU inventory"],
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
  return pairs.map(([from, to]) => {
    const lookbehind = hangulStart.test(from) ? `(?<![${HANGUL_RANGE}])` : "";
    const lookahead = hangulEnd.test(from) ? `(?![${HANGUL_RANGE}])` : "";
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
  appMode = mode;
  refreshAppModeUi();
  render();
}

function setUiLanguage(language) {
  uiLanguage = language === "en" ? "en" : "ko";
  try { window.localStorage?.setItem("ai-hardware-fit-language", uiLanguage); } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("lang", uiLanguage);
  window.history.replaceState({}, "", url);
  document.documentElement.lang = uiLanguage;
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
  // count hint) BEFORE the dictionary sweep below, so translateDynamicUi
  // only ever sees fully-Korean or fully-English text nodes to swap —
  // never a half-translated leftover from the previous render() call.
  renderOnboardingQuickPicks();
  translateDynamicUi(uiLanguage);
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

function refreshAppModeUi() {
  const isSimple = appMode === "simple";
  $("simpleModePanel").hidden = !isSimple;
  $("expertModeSection").hidden = isSimple;
  $("calculationBasisStrip").hidden = isSimple;
  // Drives the desktop (>=1536px) split-view layout in styles.css: only the
  // "전체 모델 탐색" (expert) mode gets a fixed right-hand inspector panel
  // beside the model list, and only once a model is actually selected —
  // otherwise the list permanently loses width to an empty placeholder
  // panel, which reads as the whole page being narrower/"cut off" compared
  // to 빠른 추천's full-width layout. Quick-recommend mode keeps the
  // existing fixed-overlay detail drawer untouched.
  document.body.classList.toggle("model-workbench-active", !isSimple && Boolean(selectedModelKey));
  document.querySelectorAll("[data-app-mode]").forEach((button) => {
    const active = button.dataset.appMode === appMode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function init() {
  restoreImportedHfModels();
  populateSelects();
  applyUrlState();
  restoreUiLanguage();
  bindEvents();
  refreshAppModeUi();
  refreshHfImportUi();
  renderGpuInventory();
  renderPlacementModelList();
  renderPlacementSelectedChips();
  render({ syncUrl: false });
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
  return (
    presets.find((gpu) => gpu.name === trimmed) ||
    presets.find((gpu) => gpu.name.toLowerCase() === trimmed.toLowerCase()) ||
    null
  );
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
  $("settingsToggle").addEventListener("click", () => {
    settingsExpanded = !settingsExpanded;
    refreshWorkloadUi();
  });

  ["vramGb", "gpuCount", "secondaryGpuCount", "ramGb", "bandwidth", "reservedVramGb", "safetyMarginGb"].forEach((id) => {
    $(id).addEventListener("input", () => {
      render();
    });
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
  $("simpleModeResult").addEventListener("click", (event) => {
    if (event.target.closest("[data-focus-primary-gpu]")) {
      focusPrimaryGpuSelector();
      return;
    }
    const copyCommand = event.target.closest("[data-copy-command]");
    if (copyCommand) {
      copyTextToClipboard(copyCommand.dataset.copyCommand, copyCommand);
      return;
    }
    // Share/download buttons inside an expanded accordion card reuse the
    // same detail-body markup as the drawer, so handle them here too.
    if (event.target.closest("[data-share-link]")) {
      copyTextToClipboard(window.location.href, event.target.closest("[data-share-link]"));
      return;
    }
    if (event.target.closest("[data-download-share-card]")) {
      downloadShareCard(simpleExpandedKey, event.target.closest("[data-download-share-card]"));
      return;
    }
    const target = event.target.closest("[data-model-key]");
    if (!target) return;
    // Quick-recommend cards expand inline (accordion) instead of opening the
    // shared drawer/inspector, so this uses its own state var.
    simpleExpandedKey = simpleExpandedKey === target.dataset.modelKey ? "" : target.dataset.modelKey;
    render();
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
      }
    } else if (target.classList.contains("gpu-inventory-preset-search")) {
      const preset = findGpuPresetByName(target.value, false);
      if (preset) {
        gpuInventorySearchRows.delete(rowId);
        updateGpuInventoryRow(rowId, "presetId", preset.id);
        renderGpuInventory();
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
    renderPlacementModelList();
  });

  $("placementModelList").addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-model-key]");
    if (!checkbox) return;
    togglePlacementModel(checkbox.dataset.modelKey);
  });

  $("placementModelSelected").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-placement-key]");
    if (!button) return;
    togglePlacementModel(button.dataset.removePlacementKey);
  });

  $("quantRecommendations").addEventListener("click", (event) => {
    const target = event.target.closest("[data-model-key]");
    if (!target) return;
    selectedModelKey = target.dataset.modelKey;
    render();
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
    selectedModelKey = target.dataset.modelKey;
    render();
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
      compareModalOpen = true;
      render();
      return;
    }
    if (event.target.closest("[data-clear-compare]")) {
      compareKeys = [];
      compareModalOpen = false;
      render();
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
  $("vramGb").value = preset.vram;
  $("ramGb").value = preset.ram;
  $("bandwidth").value = preset.bandwidth;
  $("gpuCount").value = 1;
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
  { id: "gpu-row-2", presetId: "rtx4090-24", count: 1 },
];
let gpuInventoryIdCounter = 2;
let gpuInventorySearchRows = new Set();
let placementActiveType = "generative";
let placementSearchQuery = "";
let placementSelectedKeys = new Set();

const PLACEMENT_DEFAULT_WORKLOADS = {
  embedding: { type: "embedding", inputTokens: 384, batchSize: 32, maxBatchTokens: 16384, runtime: "tei" },
  reranker: { type: "reranker", queryTokens: 64, docTokens: 512, candidates: 40, batchSize: 16, runtime: "tei" },
  vision: { width: 1654, height: 2339, batchSize: 1, featureSet: "basic" },
};

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
  renderGpuInventory();
}

function removeGpuInventoryRow(rowId) {
  if (gpuInventoryRows.length <= 1) return;
  gpuInventorySearchRows.delete(rowId);
  gpuInventoryRows = gpuInventoryRows.filter((row) => row.id !== rowId);
  renderGpuInventory();
}

function updateGpuInventoryRow(rowId, field, value) {
  const row = gpuInventoryRows.find((item) => item.id === rowId);
  if (!row) return;
  if (field === "presetId") row.presetId = value;
  if (field === "count") row.count = clampNumber(value, 1, 8, 1);
}

function getModelsForPlacementType(type) {
  if (type === "embedding") return EMBEDDING_MODELS;
  if (type === "reranker") return RERANKER_MODELS;
  if (type === "vision") return OCR_MODELS;
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
  return null;
}

function renderPlacementModelList() {
  const container = $("placementModelList");
  if (!container) return;
  const query = placementSearchQuery.trim().toLowerCase();
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
      return `
        <span class="placement-chip">
          ${escapeHtml(model.name)}
          <button type="button" data-remove-placement-key="${escapeAttr(key)}" aria-label="선택 해제">×</button>
        </span>
      `;
    })
    .join("");
}

function togglePlacementModel(key) {
  if (placementSelectedKeys.has(key)) placementSelectedKeys.delete(key);
  else placementSelectedKeys.add(key);
  renderPlacementModelList();
  renderPlacementSelectedChips();
}

function setPlacementActiveType(type) {
  placementActiveType = type;
  document.querySelectorAll("[data-placement-type]").forEach((button) => {
    const isActive = button.dataset.placementType === type;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  renderPlacementModelList();
}

function getPlacementBaselineOptions(model, hardware) {
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
        requiredGb: estimateOcrWithPrecision(model, hardware, workload, precision).requiredGb,
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
  if (model.type === "embedding") {
    const estimate = estimateEncoderWithPrecision(model, budgetHardware, getPlacementWorkload(model), setting);
    return { kind: "throughput", unit: "doc/s", value: estimate.speed, tokenUnit: "tok/s", tokenValue: estimate.throughput };
  }
  if (model.type === "reranker") {
    const estimate = estimateRerankerWithPrecision(model, budgetHardware, getPlacementWorkload(model), setting);
    return { kind: "throughput", unit: "pair/s", value: estimate.speed };
  }
  const workload = getPlacementWorkload(model);
  const estimate = estimateOcrWithPrecision(model, budgetHardware, workload, setting);
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

function computeGpuPlacement(gpuRows, modelKeys) {
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

  // Best-Fit Decreasing: 가장 큰(무거운) 모델부터 배치해야 나중에 자투리 공간 낭비가 줄어듭니다.
  modelOptions.sort((a, b) => b.bestRequiredGb - a.bestRequiredGb);

  const unplaced = [];
  for (const { model, options } of modelOptions) {
    let bestChoice = null;
    for (const gpu of gpus) {
      const fit = [...options].reverse().find((option) => option.requiredGb <= gpu.remaining);
      if (!fit) continue;
      const leftover = gpu.remaining - fit.requiredGb;
      if (!bestChoice || leftover < bestChoice.leftover) {
        bestChoice = { gpu, setting: fit.setting, label: fit.label, requiredGb: fit.requiredGb, leftover };
      }
    }
    if (bestChoice) {
      bestChoice.gpu.remaining -= bestChoice.requiredGb;
      bestChoice.gpu.placements.push({ model, setting: bestChoice.setting, label: bestChoice.label, requiredGb: bestChoice.requiredGb });
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

function runGpuPlacement() {
  const modelKeys = [...placementSelectedKeys];
  const result = $("gpuPlacementResult");
  const baselineEl = $("gpuPlacementBaseline");
  const exportEl = $("gpuPlacementExport");
  if (!result) return;

  if (!modelKeys.length) {
    result.innerHTML = `<p class="gpu-placement-empty">동시에 띄울 모델을 하나 이상 선택해주세요.</p>`;
    if (baselineEl) {
      baselineEl.hidden = true;
      baselineEl.textContent = "";
    }
    if (exportEl) {
      exportEl.hidden = true;
      exportEl.innerHTML = "";
    }
    return;
  }

  const placement = computeGpuPlacement(gpuInventoryRows, modelKeys);
  result.innerHTML = renderGpuPlacementResult(placement);
  renderPlacementExport(placement);

  if (baselineEl) {
    const text = renderPlacementBaseline(computePlacementBaseline(placement));
    baselineEl.textContent = text;
    baselineEl.hidden = !text;
  }
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

function renderPlacementBaseline(baseline) {
  if (!baseline || (!baseline.concurrencyBaseline && !baseline.throughputBaseline)) return "";
  const parts = [];
  if (baseline.concurrencyBaseline) {
    const b = baseline.concurrencyBaseline;
    parts.push(`공통 동시 접속 기준 ${b.recommendedN}명 (병목: GPU${b.gpuIndex + 1} ${b.modelName})`);
  }
  if (baseline.throughputBaseline) {
    const b = baseline.throughputBaseline;
    parts.push(`처리량 병목 ${formatThroughput(b.value, b.unit)} (GPU${b.gpuIndex + 1} ${b.modelName})`);
  }
  return parts.join(" · ");
}

function renderPlacementCapacityLine(capacity) {
  if (!capacity) return "";
  if (capacity.kind === "concurrency") {
    return `동시 처리 여유: 권장 ${capacity.recommendedN}명 · 최대 ${capacity.maxN}명 (최대 시 ${formatThroughput(capacity.speedAtMax.total, "tok/s")})`;
  }
  return `처리량 여유: 약 ${formatThroughput(capacity.value, capacity.unit)}${capacity.tokenValue ? ` · ${formatThroughput(capacity.tokenValue, capacity.tokenUnit)}` : ""}`;
}

function renderGpuPlacementResult(placement) {
  const gpuCards = placement.gpus
    .map((gpu) => {
      const rows = gpu.placements.length
        ? gpu.placements
            .map(
              (item) => `
                <div class="gpu-placement-model-row">
                  <span>${escapeHtml(item.model.name)} · ${escapeHtml(item.label)}</span>
                  <span>${escapeHtml(formatGb(item.requiredGb))}</span>
                </div>
                <div class="gpu-placement-capacity-line">${escapeHtml(renderPlacementCapacityLine(item.capacity))}</div>
              `,
            )
            .join("")
        : `<p class="gpu-placement-empty">이 GPU에는 배치된 모델이 없습니다.</p>`;

      return `
        <div class="gpu-placement-card">
          <div class="gpu-placement-card-head">
            <span>GPU ${gpu.index + 1} · ${escapeHtml(gpu.preset.name)}${gpu.count > 1 ? ` × ${gpu.count}` : ""}</span>
            <small>여유 ${escapeHtml(formatGb(gpu.remaining))} / 총 ${escapeHtml(formatGb(gpu.capacityGb))}</small>
          </div>
          ${rows}
        </div>
      `;
    })
    .join("");

  const unplacedBlock = placement.unplaced.length
    ? `
      <div class="gpu-placement-unplaced">
        <strong>배치하지 못한 모델 ${placement.unplaced.length}개</strong>
        ${placement.unplaced
          .map(
            (item) => `<div class="gpu-placement-model-row"><span>${escapeHtml(item.model.name)}</span><span>최소 ${escapeHtml(formatGb(item.minRequiredGb))} 필요</span></div>`,
          )
          .join("")}
        <p>GPU를 추가하거나, 다른 모델과 함께 띄우지 말고 순차 실행하는 것을 고려해보세요.</p>
      </div>
    `
    : "";

  return gpuCards + unplacedBlock;
}

// 배치 계산 결과를 실제로 복사/붙여넣기 할 수 있는 실행 명령어와 docker-compose 초안으로 만듭니다.
// 모델 상세 화면에서 이미 검증된 커맨드 빌더(buildOllamaCommand 등)를 그대로 재사용해
// 개별 모델 페이지의 실행 예시와 항상 같은 명령어를 보여줍니다.
function buildPlacementDeploymentScript(placement) {
  const hardware = getHardware();
  const lines = [
    "#!/usr/bin/env bash",
    "# AI Hardware Fit — 배치 계산 결과 기반 실행 명령어 초안",
    "# 추정 배치입니다. 실제 배포 전 각 모델의 라이선스와 최신 실행 옵션을 다시 확인하세요.",
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
    lines.push("# ===== 배치하지 못한 모델 (GPU 여유 부족) =====");
    placement.unplaced.forEach((item) => {
      lines.push(`# ${item.model.name} — 최소 ${formatGb(item.minRequiredGb)} 필요`);
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
    # 최초 기동 후 아래 명령으로 모델을 내려받으세요:
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
      services.push(`  # GPU ${gpu.index + 1}에 배치된 OCR/VLM 모델 ${visionItems.length}개(${visionItems.map((item) => item.model.name).join(", ")})는
  # 모델마다 실행 방식(vLLM, Transformers, 전용 CLI 등)이 달라 표준 서비스로 자동 생성하지 않습니다.
  # 실행 명령어(.sh) 또는 앱의 모델 상세 화면 "실행 예시"를 참고해 직접 구성하세요.`);
    }
  });

  const volumesBlock = volumeNames.length
    ? `\n\nvolumes:\n${volumeNames.map((name) => `  ${name}:`).join("\n")}`
    : "";

  return `# AI Hardware Fit — 배치 계산 결과 기반 docker-compose 초안 (참고용)
# 추정 배치이며 nvidia-container-toolkit 설치가 필요합니다.
# 실제 운영 전 리소스 한도, 포트 충돌, 각 모델 라이선스를 반드시 다시 확인하세요.
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

  target.hidden = false;
  target.innerHTML = `
    <details class="gpu-placement-export-panel">
      <summary>실행 설정 내보내기 (실행 명령어 · docker-compose 초안)</summary>
      <div class="gpu-placement-export-body">
        <p>배치 계산 결과를 기준으로 만든 초안입니다. 실제 배포 전 각 모델의 라이선스, 최신 실행 옵션, GPU 리소스를 다시 확인하세요.</p>

        <div class="export-block-head">
          <span>실행 명령어 (.sh)</span>
          <div class="export-block-actions">
            <button type="button" class="ghost-button" data-copy-target="placementExportScript">복사</button>
            <button type="button" class="ghost-button" data-download-target="placementExportScript" data-download-filename="ai-hardware-fit-run.sh">다운로드</button>
          </div>
        </div>
        <pre class="command-block" id="placementExportScript"><code>${escapeHtml(script)}</code></pre>

        <div class="export-block-head">
          <span>docker-compose.yml 초안 (Ollama · TEI)</span>
          <div class="export-block-actions">
            <button type="button" class="ghost-button" data-copy-target="placementExportCompose">복사</button>
            <button type="button" class="ghost-button" data-download-target="placementExportCompose" data-download-filename="docker-compose.yml">다운로드</button>
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
    button.textContent = "복사됨";
    setTimeout(() => {
      button.textContent = original;
    }, 1500);
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(restoreLabel).catch(() => fallbackCopyToClipboard(text, restoreLabel));
  } else {
    fallbackCopyToClipboard(text, restoreLabel);
  }
}

function renderShareActions() {
  return `
    <div class="detail-share-actions">
      <span>이 결과를 공유하세요</span>
      <div>
        <button type="button" class="ghost-button" data-share-link>결과 링크 복사</button>
        <button type="button" class="ghost-button" data-download-share-card>요약 카드 PNG</button>
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
    if (select?.value !== "custom") syncPresetForInput(input.id);
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

  const compute = estimateHardwareCompute(preset, bandwidth);
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

function estimateHardwareCompute(preset, bandwidth) {
  if (preset?.fp16Tflops || preset?.bf16Tflops || preset?.int8Tops) {
    return {
      fp32Tflops: preset.fp32Tflops || Math.max(4, preset.fp16Tflops * 0.5),
      fp16Tflops: preset.fp16Tflops || Math.max(8, bandwidth * 0.12),
      bf16Tflops: preset.bf16Tflops || preset.fp16Tflops || Math.max(8, bandwidth * 0.1),
      int8Tops: preset.int8Tops || Math.max(16, bandwidth * 0.24),
    };
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
  return {
    fp32Tflops: fp16Tflops * 0.5,
    fp16Tflops,
    bf16Tflops: fp16Tflops * 0.92,
    int8Tops: fp16Tflops * 2,
  };
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
  if (model.type === "embedding") return estimateEncoderModel(model, hardware, getWorkloadSettings());
  if (model.type === "reranker") return estimateRerankerModel(model, hardware, getWorkloadSettings());
  if (isVisionModel(model)) return estimateOcrModel(model, hardware, getWorkloadSettings());
  return normalizeGenerativeEstimate(estimateModel(model, $("quantization").value, hardware));
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
  const precision = resolvePrecision(
    model,
    precisionId,
    OCR_PRECISIONS,
    (candidate) => estimateOcrWithPrecision(model, hardware, workload, candidate),
  );
  return estimateOcrWithPrecision(model, hardware, workload, precision);
}

function estimateOcrWithPrecision(model, hardware, workload, precision) {
  const effectiveVram = getEffectiveVram(hardware);
  const megapixels = (workload.width * workload.height) / 1e6;
  const profile = model.profiles?.[precision.id] || model.profiles?.fp16 || {};
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

  const activationGb = workload.batchSize * megapixels * (profile.activationGbPerMegapixel || 0.2) * featureMultiplier;
  const runtimeOverheadGb = (profile.baseRuntimeGb || 0.8) * featureMultiplier
    + Math.max(0, workload.batchSize - 1) * (profile.batchOverheadGb || 0.06);
  const requiredGb = weightsGb + kvGb + activationGb + imageBufferGb + runtimeOverheadGb;
  const pressure = getVramPressure(requiredGb, effectiveVram);
  const grade = gradeFromPressure(pressure, requiredGb, effectiveVram + hardware.ram * 0.3);
  const pagesPerSecond = estimateOcrThroughput(model, hardware, workload, precision, megapixels, grade, featureMultiplier);
  const secondsPerPage = pagesPerSecond > 0 ? 1 / pagesPerSecond : 0;
  const reason = buildOcrReason(model, workload, grade, requiredGb, effectiveVram, megapixels);

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
    settingLabel: `${precision.label} · ${ocrFeatureLabel(workload.featureSet)}`,
    speedLabel: `${formatThroughput(pagesPerSecond, "page/s")} · ${formatDuration(secondsPerPage)}/page`,
    limitLabel: `${formatMegapixels(megapixels)}`,
    unitLabel: "page/s",
    reason,
    megapixels,
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
  if (workload.inputTokens > model.maxTokens) {
    return `선택한 ${formatContext(workload.inputTokens)} 입력 길이가 모델 한도 ${formatContext(model.maxTokens)}를 초과합니다.`;
  }
  if (microBatch < workload.batchSize) {
    return `TEI식 최대 배치 토큰 기준으로 ${workload.batchSize}개 요청을 ${microBatch}개 micro-batch로 나누어 계산했습니다.`;
  }
  if (grade === "F") return `Peak VRAM ${formatGb(requiredGb)}가 가용 VRAM ${formatGb(effectiveVram)}와 RAM 보조 범위를 초과합니다.`;
  if (grade === "D") return `GPU 단독 처리보다 RAM/CPU 보조나 배치 축소가 필요한 범위입니다.`;
  if (grade === "C") return `배치 또는 입력 길이를 조금 낮추면 더 안정적인 임베딩 처리량을 기대할 수 있습니다.`;
  return `${workload.inputTokens} 토큰, 배치 ${workload.batchSize} 기준으로 GPU 메모리 안에 들어오는 임베딩 워크로드입니다.`;
}

function buildRerankerReason(model, workload, grade, requiredGb, effectiveVram, pairTokens) {
  if (pairTokens > model.maxTokens) {
    return `질의+문서 ${formatContext(pairTokens)} 입력이 모델 한도 ${formatContext(model.maxTokens)}를 초과합니다.`;
  }
  if (pairTokens > (model.recommendedTokens || model.maxTokens)) {
    return `모델 한도 안에는 들어가지만 권장 입력 ${formatContext(model.recommendedTokens || model.maxTokens)}보다 길어 지연시간이 커질 수 있습니다.`;
  }
  if (grade === "F") return `리랭커 peak VRAM ${formatGb(requiredGb)}가 가용 VRAM ${formatGb(effectiveVram)}를 크게 초과합니다.`;
  if (grade === "D") return `후보 ${workload.candidates}개를 처리하려면 배치 축소나 CPU/RAM 보조를 고려해야 합니다.`;
  return `후보 ${workload.candidates}개를 배치 ${workload.batchSize}로 나누어 ${Math.ceil(workload.candidates / workload.batchSize)}회 추론하는 기준입니다.`;
}

function buildOcrReason(model, workload, grade, requiredGb, effectiveVram, megapixels) {
  if (grade === "F") return `${formatMegapixels(megapixels)} 이미지의 peak VRAM ${formatGb(requiredGb)}가 가용 VRAM ${formatGb(effectiveVram)}와 RAM 보조 범위를 초과합니다.`;
  if (grade === "D") return `GPU 단독 처리보다 CPU/RAM 보조 또는 배치 페이지 축소가 필요한 OCR 워크로드입니다.`;
  if (grade === "C") return `이미지 해상도나 배치가 높아 VRAM 여유가 작습니다. DPI 또는 배치 페이지를 낮추는 편이 안정적입니다.`;
  return `${formatMegapixels(megapixels)}, 배치 ${workload.batchSize}페이지 기준으로 실행 가능한 OCR 워크로드입니다.`;
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

  if (capacity.maxN <= 0) {
    return `
      <section class="detail-section">
        <h3>동시 처리 용량 (베타)</h3>
        <p class="detail-note">현재 설정(${escapeHtml(quant.label)} · ${escapeHtml(formatContext(hardware.context))})에서는 이 GPU VRAM 단독으로 1명도 여유 있게 처리하기 어렵습니다. 양자화를 낮추거나 컨텍스트 길이를 줄여보세요.</p>
      </section>
    `;
  }

  return `
    <section class="detail-section">
      <h3>동시 처리 용량 (베타)</h3>
      <div class="detail-summary-grid">
        ${renderDetailMetric("권장 동시 인원", `${capacity.recommendedN}명`, "VRAM 여유 있게(등급 A 이내)")}
        ${renderDetailMetric("이론적 최대 인원", `${capacity.maxN}명`, "GPU VRAM 한계치(등급 B 경계)")}
        ${renderDetailMetric("권장 인원 기준 처리량", formatThroughput(capacity.speedAtRecommended.total, "tok/s"), `1인당 약 ${formatSpeed(capacity.speedAtRecommended.perRequest)}`)}
        ${renderDetailMetric("최대 인원 기준 처리량", formatThroughput(capacity.speedAtMax.total, "tok/s"), `1인당 약 ${formatSpeed(capacity.speedAtMax.perRequest)}`)}
      </div>
      <p class="detail-note">KV cache와 VRAM 여유만 반영한 이론치입니다. 실제 동시접속 처리량은 vLLM·TGI 등 서빙 프레임워크의 연속 배칭 효율, 요청 길이 분포, 스케줄링 정책에 따라 크게 달라질 수 있으니 참고용으로만 사용하세요.</p>
    </section>
  `;
}

function buildReason(grade, requiredGb, effectiveVram, model, hardware, contextLimitTokens, contextSupported) {
  if (!contextSupported) {
    return `선택한 ${formatContext(hardware.context)} 컨텍스트가 모델 한도 ${formatContext(contextLimitTokens)}를 초과합니다.`;
  }
  if (grade === "F") {
    return `동시 ${hardware.concurrency}명 기준 필요 VRAM 추정치가 ${formatGb(requiredGb)}로 가용 VRAM ${formatGb(effectiveVram)}를 크게 초과합니다.`;
  }
  if (grade === "D") {
    return `동시 ${hardware.concurrency}명 기준 GPU 단독 적재는 어렵고 RAM 오프로딩 전제가 필요합니다.`;
  }
  if (grade === "C") {
    return `가용 VRAM에 거의 맞습니다. 동시 요청, 컨텍스트 길이, KV cache 정밀도를 낮추는 편이 안정적입니다.`;
  }
  if (model.params >= 60 && hardware.count === 1) {
    return `대형 모델이지만 예약/여유분 제외 가용 VRAM ${formatGb(effectiveVram)}에서 선택 양자화 기준 실행 가능 범위입니다.`;
  }
  return `선택한 GPU에서 ${model.params}B급 모델을 ${formatContext(hardware.context)}, 동시 ${hardware.concurrency}명 기준으로 실행 가능한 범위입니다.`;
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
  const text = model.name.toLowerCase();
  let score = 0;
  if (text.includes("mineru2.5-pro-2604")) score += 760;
  if (text.includes("paddleocr-vl-1.6")) score += 755;
  if (text.includes("deepseek-ocr-2")) score += 750;
  if (text.includes("qwen3-vl")) score += 745;
  if (text.includes("glm-4.1v")) score += 742;
  if (text.includes("internvl3.5")) score += 740;
  if (text.includes("deepseek-vl2")) score += 739;
  if (text.includes("minicpm-v-4.6")) score += 738;
  if (text.includes("kimi-vl")) score += 736;
  if (text.includes("qwen3-embedding") || text.includes("qwen3-reranker")) score += 735;
  if (text.includes("embeddinggemma")) score += 734;
  if (text.includes("jina-embeddings-v4")) score += 733;
  if (text.includes("granite-embedding") && text.includes("-r2")) score += 732;
  if (text.includes("mxbai-rerank") && text.includes("-v2")) score += 731;
  if (text.includes("bge-reranker-v2.5")) score += 731;
  if (text.includes("jina-embeddings-v5")) score += 730;
  if (text.includes("bge-code-v1")) score += 729;
  if (text.includes("olmocr-2")) score += 728;
  if (text.includes("gte-reranker-modernbert") || text.includes("modernbert-embed")) score += 727;
  if (text.includes("gte-qwen2")) score += 725;
  if (text.includes("dots.ocr")) score += 724;
  if (text.includes("sfr-embedding-2")) score += 723;
  if (text.includes("qwen2.5-vl")) score += 722;
  if (text.includes("phi-4-multimodal")) score += 721;
  if (text.includes("gpt-oss")) score += 720;
  if (text.includes("aya-vision")) score += 719;
  if (text.includes("smolvlm2")) score += 718;
  if (text.includes("pixtral-large")) score += 716;
  if (text.includes("pixtral")) score += 714;
  if (text.includes("llava-onevision")) score += 712;
  if (text.includes("molmo")) score += 710;
  if (text.includes("llama-3.2") && text.includes("vision")) score += 708;
  if (text.includes("qwen2-vl")) score += 706;
  if (text.includes("qwen3")) score += 700;
  if (text.includes("deepseek v3.2")) score += 690;
  if (text.includes("llama 4")) score += 680;
  if (text.includes("gemma 3")) score += 660;
  if (text.includes("phi-4")) score += 650;
  if (text.includes("gemma 4")) score += 675;
  if (text.includes("qwen3.6")) score += 646;
  if (text.includes("qwen3.5")) score += 645;
  if (text.includes("mistral small 4")) score += 674;
  if (text.includes("mistral medium 3.5")) score += 673;
  if (text.includes("mistral large 3")) score += 672;
  if (text.includes("ministral 3")) score += 671;
  if (text.includes("magistral small 1.2")) score += 671;
  if (text.includes("mistral small 3.1")) score += 640;
  if (text.includes("mistral small 3.2")) score += 640;
  if (text.includes("qwen3-next")) score += 638;
  if (text.includes("qwen3-coder")) score += 637;
  if (text.includes("granite 4.1")) score += 667;
  if (text.includes("glm-4.5")) score += 666;
  if (text.includes("kimi k2 thinking")) score += 665;
  if (text.includes("a.x 4.0")) score += 664;
  if (text.includes("exaone 4.0")) score += 663;
  if (text.includes("hyperclovax")) score += 662;
  if (text.includes("kanana 1.5")) score += 661;
  if (text.includes("trillion 7b")) score += 658;
  if (text.includes("bllossom-70b")) score += 657;
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

  if (exactMatch) {
    return {
      label: "높음",
      className: "confidence-high",
      spread: 0.08,
      reason: `동일 모델/조건의 출처 연결 ${benchmarkEvidenceLabel(exactMatch)}값이 있습니다.`,
      matchedRow: exactMatch,
    };
  }

  if (benchmarkRows.length > 0) {
    return {
      label: "보통",
      className: "confidence-medium",
      spread: 0.18,
      reason: "같은 모델의 다른 실행 조건 사용자/자체 측정을 참고할 수 있습니다.",
    };
  }

  if (isVisionModel(model) && model.reference?.pagesPerSecond) {
    return {
      label: "보통",
      className: "confidence-medium",
      spread: 0.18,
      reason: "모델별 OCR/VLM 외부 공개 참고값을 기준으로 보정합니다.",
    };
  }

  return {
    label: "낮음",
    className: "confidence-low",
    spread: 0.32,
    reason: "모델별 사용자/자체 측정 없이 파라미터, VRAM, 대역폭 기반 계산식으로 추정합니다.",
  };
}

function getModelReleaseInfo(model) {
  if (model.releaseDate) {
    const year = Number(String(model.releaseDate).slice(0, 4));
    const note = model.releaseNote || "공식";
    return {
      label: model.releaseDate,
      note,
      className: releaseClassName(year),
      title: note === "모델 카드" ? "공식 릴리스일이 아니라 공개 모델 카드의 createdAt 기준입니다." : "모델 데이터에 등록된 출시일입니다.",
    };
  }

  const year = inferModelYear(model);
  if (!year) {
    return {
      label: "미기재",
      note: "출시일 없음",
      className: "release-unknown",
      title: "정확한 출시일 메타데이터가 아직 없습니다.",
    };
  }

  return {
    label: `${year} 계열`,
    note: "세대 추정",
    className: releaseClassName(year),
    title: "정확한 출시일이 아니라 모델명과 공개 세대 기준의 보수적 표시입니다.",
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
  if (!estimate.speed) return "불가";
  const spread = confidence.spread ?? 0.32;
  const unit = estimate.unitLabel || "tok/s";
  const low = estimate.speed * (1 - spread);
  const high = estimate.speed * (1 + spread);
  return `약 ${formatMetricNumber(low, unit, false)}~${formatMetricNumber(high, unit, true)}`;
}

function formatMetricNumber(value, unit, includeUnit) {
  let text;
  if (value >= 1000) text = Math.round(value).toLocaleString("ko-KR");
  else if (value >= 10) text = String(Math.round(value));
  else text = value.toFixed(1);
  return includeUnit ? `${text} ${unit}` : text;
}

function buildGradeTooltip(estimate) {
  const meta = GRADE_META[estimate.grade];
  const margin = estimate.effectiveVram - estimate.requiredGb;
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
  if (onboardingScreen) onboardingScreen.hidden = hasPrimaryGpuSelection;
  if (hardwarePanel) hardwarePanel.hidden = !hasPrimaryGpuSelection;
  if (resultsPanel) resultsPanel.hidden = !hasPrimaryGpuSelection;

  const hardware = getHardware();
  const allEstimates = hasPrimaryGpuSelection
    ? getActiveModels().map((model) => estimateAnyModel(model, hardware))
    : [];
  const estimates = hasPrimaryGpuSelection ? getFilteredEstimates() : [];

  refreshWorkloadUi();
  renderHardware(hardware, allEstimates);
  renderSummary(allEstimates);
  renderSimpleMode(hardware, allEstimates);
  renderCalculationBasisStrip(hardware);
  renderQuantizationRecommendations(estimates);
  renderResults(estimates, allEstimates);
  renderCompareBar(allEstimates);
  renderCompareModal(allEstimates);
  renderActiveFilterChips(estimates, allEstimates);
  renderDetail();
  renderViewToggle();
  renderBenchmarkSheet();
  const benchmarkSheet = $("benchmarkSheet");
  if (benchmarkSheet) benchmarkSheet.hidden = !hasPrimaryGpuSelection;

  if (syncUrl) syncUrlState();
  if (uiLanguage === "en") setUiLanguage("en");
}

function renderHardware(hardware, allEstimates) {
  if (!hasPrimaryGpuSelection) {
    $("settingsToggle").hidden = true;
    $("hardwareHeadline").textContent = "GPU를 선택해 주세요";
    $("hardwareMeta").textContent = `GPU 프리셋 ${GPU_PRESETS.length}개 또는 직접 입력`;
    $("hardwareSubline").textContent = "선택 즉시 현재 환경에 맞는 모델을 계산합니다.";
    $("gpuSourceLinks").hidden = true;
    $("gpuSourceLinks").innerHTML = "";
    return;
  }

  $("settingsToggle").hidden = false;

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
}

function buildHardwareBasis(hardware) {
  if (activeWorkload === "embedding") {
    const workload = getWorkloadSettings();
    const precision = getPrecisionLabel(workload.precisionId, ENCODER_PRECISIONS);
    const runtime = ENCODER_RUNTIME_PROFILES[workload.runtime]?.label || workload.runtime;
    return `${workload.inputTokens} 토큰 · 배치 ${workload.batchSize}개 · ${runtime} · ${precision}`;
  }
  if (activeWorkload === "reranker") {
    const workload = getWorkloadSettings();
    const precision = getPrecisionLabel(workload.precisionId, ENCODER_PRECISIONS);
    const runtime = ENCODER_RUNTIME_PROFILES[workload.runtime]?.label || workload.runtime;
    return `질의 ${workload.queryTokens} + 문서 ${workload.docTokens} · 후보 ${workload.candidates}개 · ${runtime} · ${precision}`;
  }
  if (isVisionWorkload(activeWorkload)) {
    const workload = getWorkloadSettings();
    const precision = getPrecisionLabel(workload.precisionId, OCR_PRECISIONS);
    return `${workload.width}x${workload.height} · 배치 ${workload.batchSize}페이지 · ${ocrFeatureLabel(workload.featureSet)} · ${precision}`;
  }

  const quant = QUANTS.find((item) => item.id === $("quantization").value);
  const quantLabel = quant ? quant.label : "자동 추천";
  return `${formatContext(hardware.context)} · 동시 ${hardware.concurrency}명 · ${RUNTIME_LABELS[hardware.runtime] || hardware.runtime} · ${quantLabel}`;
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
      </div>
    `;
    return;
  }

  exploreActions.hidden = false;
  // If a previous pick set no longer contains the expanded model (purpose/
  // priority changed), collapse rather than leaving a dangling reference.
  if (simpleExpandedKey && !picks.some((estimate) => modelKey(estimate.model) === simpleExpandedKey)) {
    simpleExpandedKey = "";
  }

  target.innerHTML = picks.map((estimate, index) => {
    const confidence = getEstimateConfidence(estimate.model, estimate, hardware);
    const meta = GRADE_META[estimate.grade];
    const licensePolicy = getLicensePolicy(estimate.model);
    const reasons = buildRecommendationReasons(estimate).slice(0, 3).map(localizeRecommendationReason);
    const key = modelKey(estimate.model);
    const isExpanded = simpleExpandedKey === key;
    const ctaLabel = isExpanded
      ? (uiLanguage === "en" ? "Hide details" : "상세 접기")
      : t("detailCalculation");

    return `
      <div class="simple-pick-card ${index === 0 ? "is-top-pick" : ""} ${isExpanded ? "is-expanded" : ""}">
        <button type="button" class="simple-pick-card-toggle" data-model-key="${escapeAttr(key)}" aria-expanded="${isExpanded ? "true" : "false"}">
          <span class="simple-pick-rank">${uiLanguage === "en" ? `Rank ${index + 1}` : `${index + 1}순위`}</span>
          <span class="simple-pick-head">
            <strong>${escapeHtml(estimate.model.name)}</strong>
            <span class="grade-pill ${meta.className}">${meta.label}</span>
          </span>
          <span class="simple-pick-specs">
            <span>${escapeHtml(estimate.model.maker)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))}</span>
            <span>VRAM ${formatGb(estimate.requiredGb)}</span>
            <span>${escapeHtml(formatSpeedRange(estimate, confidence))}</span>
            <span>${uiLanguage === "en" ? `Estimated · ${confidence.label}` : `추정 · ${confidence.label}`}</span>
          </span>
          ${reasons.length ? `<span class="simple-pick-reasons">${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</span>` : ""}
        </button>
        <span class="simple-pick-actions">
          <span class="simple-pick-cta" data-model-key="${escapeAttr(key)}">${escapeHtml(ctaLabel)} ${isExpanded ? "↑" : "→"}</span>
          <span class="simple-pick-copy" role="button" tabindex="0" data-copy-command="${escapeAttr(estimate.model.type === "generative" ? buildOllamaCommand(estimate.model, estimate.quant, hardware) : buildNonGenerativeCommand(estimate.model, estimate))}">${uiLanguage === "en" ? "Copy run command" : "실행 명령어 복사"}</span>
        </span>
        ${isExpanded ? `<div class="simple-pick-detail">${buildSimplePickDetailBodyHtml(estimate.model, hardware)}</div>` : ""}
      </div>
    `;
  }).join("");
}

function buildSimplePickDetailBodyHtml(model, hardware) {
  return model.type === "generative"
    ? buildGenerativeDetailBodyHtml(model, hardware)
    : buildNonGenerativeDetailBodyHtml(model, hardware);
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

  return `
    <div class="detail-title">
      <span class="grade-pill ${meta.className}" title="${escapeAttr(buildGradeTooltip(estimate))}">${meta.label}</span>
      <h2>${escapeHtml(model.name)}</h2>
      <p>${escapeHtml(model.maker)} · ${escapeHtml(model.license)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))} · ${model.tags.map(tagLabel).map(escapeHtml).join(" · ")}</p>
      <p class="detail-description">${escapeHtml(modelSummary(model))}</p>
    </div>

    ${renderShareActions()}

    <div class="detail-summary-grid">
      ${renderDetailMetric("실행 판정", meta.label)}
      ${renderDetailMetric("권장 설정", `${estimate.quant.label} · ${formatContext(hardware.context)} · 동시 ${hardware.concurrency}명`)}
      ${renderDetailMetric("계산 VRAM", `${formatGb(estimate.requiredGb)} / 가용 ${formatGb(estimate.effectiveVram)}`)}
      ${renderDetailMetric("VRAM 여유", formatGb(Math.abs(estimate.effectiveVram - estimate.requiredGb)), estimate.effectiveVram >= estimate.requiredGb ? "남음" : "부족")}
      ${renderDetailMetric("추정 속도", formatSpeedRange(estimate, confidence), `신뢰도 ${confidence.label}`)}
      ${renderDetailMetric("첫 응답", formatDuration(estimate.firstTokenSeconds))}
    </div>
    <section class="detail-section">
      <h3>실제 측정과 차이가 나는 이유</h3>
      <p class="detail-note">추정 속도는 대역폭 대비 활성 파라미터 기준 단순 계산이라 실제와 다를 수 있습니다. 특히 오프로딩이 걸리는 경우, 양자화 방식(IQ 계열 vs K 계열)이 다른 경우, 매우 긴 컨텍스트를 쓰는 경우 실제 측정과 몇 배 차이가 날 수 있으니 참고용으로만 사용하세요.</p>
    </section>

    <section class="detail-section">
      <h3>추천 이유</h3>
      ${renderRecommendationReasonList(recommendationReasons, estimate)}
    </section>

    ${renderEvidenceSection(model, estimate, hardware, confidence)}

    <section class="detail-section">
      <h3>판정 근거</h3>
      ${renderFitRationale(estimate, hardware)}
      <p class="detail-note">${escapeHtml(estimate.reason)}</p>
    </section>

    ${renderConcurrencySection(model, estimate.quant, hardware)}

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
      ${renderMemoryMap(
        [
          { key: "weights", label: "모델 가중치", value: estimate.weightsGb },
          { key: "kv", label: "KV cache", value: estimate.kvGb },
          { key: "runtime", label: "런타임 오버헤드", value: estimate.runtimeOverheadGb },
          { key: "free", label: "여유", value: Math.max(0, hardware.availableVram - estimate.requiredGb) },
        ],
        Math.max(hardware.availableVram, estimate.requiredGb),
      )}
      <div class="memory-breakdown">
        ${renderMemoryLine("모델 가중치", estimate.weightsGb, breakdownTotal)}
        ${renderMemoryLine("KV cache", estimate.kvGb, breakdownTotal)}
        ${renderMemoryLine("런타임 오버헤드", estimate.runtimeOverheadGb, breakdownTotal)}
      </div>
      <div class="memory-total">
        <span>모델 필요 VRAM</span>
        <strong>${formatGb(estimate.requiredGb)}</strong>
      </div>
      ${renderVramBudget(hardware, estimate)}
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

    ${renderLicenseSection(model)}

    <section class="detail-section">
      <h3>모델 정보</h3>
      <div class="model-info-grid">
        ${renderInfoItem("파라미터", formatParams(model.params))}
        ${renderInfoItem("활성 파라미터", formatParams(model.active))}
        ${renderInfoItem("최대 컨텍스트", formatContext(estimate.contextLimitTokens))}
        ${renderInfoItem("라이선스", `${model.license} · ${licenseCommercialLabel(licensePolicy)}`)}
        ${renderInfoItem("출시/세대", `${release.label} · ${release.note}`)}
        ${renderInfoItem("대표 공개 평가", `${benchmark.label} · ${benchmark.note}`)}
        ${renderInfoItem("데이터 갱신", DATA_UPDATED_AT)}
        ${renderInfoItem("측정 상태", findBenchmarksForModel(model).length ? "사용자/자체 측정값 있음" : "사용자/자체 측정값 없음")}
      </div>
      <div class="external-links">
        ${renderExternalLink("Hugging Face", `https://huggingface.co/models?search=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink("Ollama", `https://ollama.com/search?q=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink("공식 문서 검색", `https://www.google.com/search?q=${encodeURIComponent(`${model.name} official`)}`)}
        ${renderExternalLink("스펙 오류 신고", BENCHMARK_META.reportUrl || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose")}
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
  const detailKind = model.type === "embedding" ? "임베딩" : model.type === "reranker" ? "리랭커" : ocrTypeLabel(model.type);

  return `
    <div class="detail-title">
      <span class="grade-pill ${meta.className}" title="${escapeAttr(buildGradeTooltip(estimate))}">${meta.label}</span>
      <h2>${escapeHtml(model.name)}</h2>
      <p>${escapeHtml(model.maker)} · ${escapeHtml(model.license)} · ${escapeHtml(licenseCommercialLabel(licensePolicy))} · ${model.tags.map(tagLabel).map(escapeHtml).join(" · ")}</p>
      <p class="detail-description">${escapeHtml(modelSummary(model))}</p>
    </div>

    ${renderShareActions()}

    <div class="detail-summary-grid">
      ${renderDetailMetric("실행 판정", meta.label)}
      ${renderDetailMetric("권장 설정", estimate.settingLabel)}
      ${renderDetailMetric("계산 VRAM", `${formatGb(estimate.requiredGb)} / 가용 ${formatGb(estimate.effectiveVram)}`)}
      ${renderDetailMetric("VRAM 여유", formatGb(Math.abs(estimate.effectiveVram - estimate.requiredGb)), estimate.effectiveVram >= estimate.requiredGb ? "남음" : "부족")}
      ${renderDetailMetric("추정 처리량", formatSpeedRange(estimate, confidence), `신뢰도 ${confidence.label}`)}
      ${renderDetailMetric(model.type === "reranker" ? "질의당 지연" : "처리 지연", formatDuration(estimate.firstTokenSeconds))}
    </div>

    <section class="detail-section">
      <h3>추천 이유</h3>
      ${renderRecommendationReasonList(recommendationReasons, estimate)}
    </section>

    ${renderEvidenceSection(model, estimate, hardware, confidence)}

    <section class="detail-section">
      <h3>판정 근거</h3>
      ${renderFitRationale(estimate, hardware)}
      <p class="detail-note">${escapeHtml(estimate.reason)}</p>
    </section>

    <section class="detail-section">
      <h3>정밀도별 비교</h3>
      <div class="detail-table">
        <div class="detail-row detail-table-head">
          <span>정밀도</span>
          <span>Peak VRAM</span>
          <span>예상 처리량</span>
          <span>품질</span>
          <span>실행 상태</span>
        </div>
        ${renderPrecisionRows(model, hardware, estimate.precision.id)}
      </div>
    </section>

    <section class="detail-section">
      <h3>${detailKind} 메모리 분석</h3>
      ${renderMemoryMap(
        buildNonGenerativeMemorySegments(estimate, hardware),
        Math.max(hardware.availableVram, estimate.requiredGb),
      )}
      <div class="memory-breakdown">
        ${renderNonGenerativeMemoryLines(estimate, breakdownTotal)}
      </div>
      <div class="memory-total">
        <span>모델 필요 VRAM</span>
        <strong>${formatGb(estimate.requiredGb)}</strong>
      </div>
      ${renderVramBudget(hardware, estimate)}
    </section>

    <section class="detail-section">
      <h3>${isVisionModel(model) ? "기능별 비교" : "실행 방식별 비교"}</h3>
      <div class="runtime-grid">
        ${renderNonGenerativeScenarioRows(model, hardware)}
      </div>
    </section>

    <section class="detail-section">
      <h3>계산 근거</h3>
      <pre class="formula-block"><code>${escapeHtml(buildFormulaText(model.type))}</code></pre>
    </section>

    <section class="detail-section">
      <h3>실행 예시</h3>
      <pre class="command-block"><code>${escapeHtml(buildNonGenerativeCommand(model, estimate))}</code></pre>
    </section>

    ${renderLicenseSection(model)}

    <section class="detail-section">
      <h3>모델 정보</h3>
      <div class="model-info-grid">
        ${renderInfoItem("파라미터", formatParams(model.params || 0))}
        ${renderInfoItem(isVisionModel(model) ? "처리 유형" : "최대 입력", isVisionModel(model) ? ocrTypeLabel(model.type) : formatContext(model.maxTokens))}
        ${renderInfoItem("구조", model.hiddenSize ? `${model.layers || model.decoderLayers || "-"} layers · hidden ${model.hiddenSize}` : "pipeline")}
        ${renderInfoItem("라이선스", `${model.license} · ${licenseCommercialLabel(licensePolicy)}`)}
        ${renderInfoItem("출시/세대", `${release.label} · ${release.note}`)}
        ${renderInfoItem("대표 공개 평가", `${benchmark.label} · ${benchmark.note}`)}
        ${renderInfoItem("데이터 갱신", DATA_UPDATED_AT)}
        ${renderInfoItem("측정 상태", findBenchmarksForModel(model).length ? "사용자/자체 측정값 있음" : model.reference?.pagesPerSecond ? "외부 공개 참고값 있음" : "사용자/자체 측정값 없음")}
      </div>
      <div class="external-links">
        ${model.sourceUrl ? renderExternalLink("공식/모델 카드", model.sourceUrl) : ""}
        ${renderExternalLink("Hugging Face 검색", `https://huggingface.co/models?search=${encodeURIComponent(model.name)}`)}
        ${renderExternalLink("스펙 오류 신고", BENCHMARK_META.reportUrl || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose")}
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
  const other = (estimate.activationGb || 0) + (estimate.attentionGb || 0) + (estimate.imageBufferGb || 0) + (estimate.outputGb || 0);
  const segments = [
    {
      key: "weights",
      label: estimate.model.type === "ocr-pipeline" ? "상주 모델/모듈" : "모델 가중치",
      value: estimate.weightsGb,
    },
  ];
  if (estimate.kvGb) segments.push({ key: "kv", label: "KV cache", value: estimate.kvGb });
  if (other > 0) segments.push({ key: "other", label: "기타 버퍼", value: other });
  segments.push({ key: "runtime", label: "런타임 오버헤드", value: estimate.runtimeOverheadGb });
  segments.push({ key: "free", label: "여유", value: Math.max(0, hardware.availableVram - estimate.requiredGb) });
  return segments;
}

function renderNonGenerativeMemoryLines(estimate, totalWithSafety) {
  const rows = [
    renderMemoryLine(estimate.model.type === "ocr-pipeline" ? "상주 모델/모듈" : "모델 가중치", estimate.weightsGb, totalWithSafety),
  ];
  if (estimate.kvGb) rows.push(renderMemoryLine("Decoder KV cache", estimate.kvGb, totalWithSafety));
  if (estimate.activationGb) rows.push(renderMemoryLine("활성화 메모리", estimate.activationGb, totalWithSafety));
  if (estimate.attentionGb) rows.push(renderMemoryLine("Attention 작업공간", estimate.attentionGb, totalWithSafety));
  if (estimate.imageBufferGb) rows.push(renderMemoryLine("이미지 버퍼", estimate.imageBufferGb, totalWithSafety));
  if (estimate.outputGb) rows.push(renderMemoryLine("출력/점수 버퍼", estimate.outputGb, totalWithSafety));
  rows.push(renderMemoryLine("런타임 오버헤드", estimate.runtimeOverheadGb, totalWithSafety));
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

# TEI 사용 시 /rerank endpoint로 후보 문서를 전달하세요.`;
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

# PDF to Markdown 파이프라인에서 페이지 이미지를 모델 입력으로 전달하세요.`;
  }
  if (lowerName.includes("deepseek-ocr")) {
    return `vllm serve deepseek-ai/DeepSeek-OCR-2

# Transformers 또는 SGLang 런타임도 모델 카드 예시를 기준으로 사용할 수 있습니다.`;
  }
  if (lowerName.includes("deepseek-vl2")) {
    return `git clone https://github.com/deepseek-ai/DeepSeek-VL2
cd DeepSeek-VL2
pip install -e .
CUDA_VISIBLE_DEVICES=0 python inference.py --model_path "${model.name}"

# MoE 모델이라 total parameter와 activated parameter가 다릅니다. 큰 모델은 A100/H100급 VRAM을 기준으로 보세요.`;
  }
  if (lowerName.includes("deepseek-vl-7b")) {
    return `from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True).cuda()

# 이전 세대 DeepSeek-VL 비교군입니다. 최신 운영 후보는 DeepSeek-VL2 계열을 먼저 보세요.`;
  }
  if (lowerName.includes("qwen2.5-vl") || lowerName.includes("qwen2-vl")) {
    return `pip install qwen-vl-utils[decord]
vllm serve ${model.name}

# 이미지, 비디오, 문서 OCR-like extraction에 사용할 수 있습니다.`;
  }
  if (lowerName.includes("qwen3-vl")) {
    return `vllm serve ${model.name}

# 문서 이미지와 "Extract this page as Markdown." 같은 프롬프트를 함께 전달하세요.`;
  }
  if (lowerName.includes("llama-3.2") && lowerName.includes("vision")) {
    return `from transformers import MllamaForConditionalGeneration, AutoProcessor

processor = AutoProcessor.from_pretrained("${model.name}")
model = MllamaForConditionalGeneration.from_pretrained("${model.name}", device_map="auto")

# Meta 라이선스와 지역 제한 조건을 배포 전에 확인하세요.`;
  }
  if (lowerName.includes("pixtral-large")) {
    return `vllm serve ${model.name} \\
  --config-format mistral \\
  --load-format mistral \\
  --tokenizer-mode mistral \\
  --tensor-parallel-size 8 \\
  --limit-mm-per-prompt '{"image": 10}'

# Pixtral Large는 vLLM/tensor parallel 서버 환경을 권장합니다.`;
  }
  if (lowerName.includes("pixtral")) {
    return `vllm serve ${model.name}

# 128K context와 가변 해상도 이미지를 쓰는 Pixtral 계열 비교군입니다.`;
  }
  if (lowerName.includes("llava-onevision")) {
    return `vllm serve ${model.name}

# 단일 이미지, 다중 이미지, 비디오 시나리오를 같은 계열에서 비교하세요.`;
  }
  if (lowerName.includes("molmo")) {
    return `from transformers import AutoProcessor, AutoModelForCausalLM

processor = AutoProcessor.from_pretrained("${model.name}", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True, device_map="auto")

# 이미지 이해와 pointing/grounding 비교용 모델입니다.`;
  }
  if (lowerName.includes("smolvlm2")) {
    return `from transformers import pipeline

pipe = pipeline("image-text-to-text", model="${model.name}", device_map="auto")
result = pipe("./page.png", text="Read the document and summarize key fields.")

# 저VRAM/온디바이스 비전 테스트에 적합합니다.`;
  }
  if (lowerName.includes("phi-4-multimodal")) {
    return `from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("${model.name}", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True, device_map="auto")

# 이미지와 오디오 입력을 같이 다루는 멀티모달 모델입니다.`;
  }
  if (lowerName.includes("aya-vision")) {
    return `vllm serve ${model.name}

# 다국어 이미지 QA와 OCR-like 추출을 테스트할 때 사용하세요.`;
  }
  if (lowerName.includes("glm-4.1v") || lowerName.includes("glm-4v")) {
    return `from transformers import AutoProcessor, AutoModelForCausalLM

processor = AutoProcessor.from_pretrained("${model.name}", trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained("${model.name}", trust_remote_code=True, device_map="auto")

# 문서, 비디오, GUI 에이전트 작업의 멀티모달 reasoning 비교군입니다.`;
  }
  if (lowerName.includes("internvl") || lowerName.includes("kimi-vl") || lowerName.includes("minicpm-v")) {
    return `vllm serve ${model.name}

# 이미지 질의응답, 문서 요약, OCR-like extraction 용도로 프롬프트를 구성하세요.`;
  }
  if (lowerName.includes("olmocr")) {
    return `olmocr ./localworkspace --markdown --pdfs ./document.pdf --model allenai/olmOCR-2-7B-1025

# PDF를 Markdown으로 변환하는 배치 파이프라인 기준입니다.`;
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

# 배포 저장소별 CLI 이름이 다를 수 있으므로 모델 카드의 최신 예시를 확인하세요.`;
  }
  if (lowerName.includes("paddle") || lowerName.includes("pp-")) {
    return `paddleocr ocr -i ./document.pdf --device gpu

# 문서 구조 분석은 PP-StructureV3 파이프라인으로 실행하세요.`;
  }
  if (lowerName.includes("surya")) {
    return `surya_ocr ./document.pdf --images --langs ko,en

# GPU Docker 실행 시 Surya 공식 README의 Docker 옵션을 확인하세요.`;
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
  const evidenceLabels = [
    publicReferenceCount ? `외부 공개 참고값 ${publicReferenceCount}개` : "",
    userMeasurementCount ? `사용자 측정 ${userMeasurementCount}개` : "",
    projectMeasurementCount ? `자체 측정 ${projectMeasurementCount}개` : "",
  ].filter(Boolean);
  const evidenceLabel = evidenceLabels.length ? evidenceLabels.join(" · ") : "등록된 외부 참고·측정값 없음";

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
      <h3>계산값과 근거 구분</h3>
      <div class="evidence-grid">
        <div class="evidence-card estimate-card">
          <span>계산 추정</span>
          <strong>${formatGb(estimate.requiredGb)} · ${escapeHtml(formatSpeedRange(estimate, confidence))}</strong>
          <small>신뢰도 ${escapeHtml(confidence.label)} · ${escapeHtml(confidence.reason)}</small>
          <small>${escapeHtml(formatHardwareName(hardware, true))} · ${escapeHtml(buildHardwareBasis(hardware))}</small>
        </div>
        <div class="evidence-card measured-card">
          <span>외부 참고·측정 근거</span>
          <strong>${escapeHtml(evidenceLabel)}</strong>
          ${renderBenchmarkMiniRows(measuredRows, reference, qualityBenchmark)}
        </div>
      </div>
      ${errorLine}
    </section>
  `;
}

function renderEstimateErrorLine(estimateValue, measuredValue, unit, measurementLabel = "사용자 측정") {
  const errorPct = ((estimateValue - measuredValue) / measuredValue) * 100;
  const sign = errorPct >= 0 ? "+" : "";
  return `
    <div class="estimate-error-line">
      <span>예상 ${escapeHtml(formatMetricNumber(estimateValue, unit, true))}</span>
      <span>vs ${escapeHtml(measurementLabel)} ${escapeHtml(formatMetricNumber(measuredValue, unit, true))}</span>
      <strong>추정 오차 ${sign}${errorPct.toFixed(1)}%</strong>
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
  const entries = rows.slice(0, 3).map((row) => `
    <div>
      <span>${escapeHtml(benchmarkEvidenceLabel(row))} · ${escapeHtml(row.gpu || row.gpuId || "GPU 미기재")} · ${escapeHtml(formatBenchmarkRuntime(row))}</span>
      <strong>${escapeHtml(formatBenchmarkMetric(row))}</strong>
      <small>${escapeHtml(row.date || "날짜 미기재")}${row.sourceUrl ? " · 출처 링크 있음" : ""}</small>
    </div>
  `);
  if (qualityBenchmark) {
    entries.push(`
      <div>
        <span>외부 공개 참고값 · ${escapeHtml(qualityBenchmark.metric || "대표 공개 평가")} · ${escapeHtml(qualityBenchmark.note || "공식 발표")}</span>
        <strong>${escapeHtml(qualityBenchmark.label)}</strong>
        <small>${qualityBenchmark.sourceUrl ? "출처 링크 있음 · " : ""}속도 측정과 분리 표시</small>
      </div>
    `);
  }
  if (reference) {
    entries.push(`
      <div>
        <span>외부 공개 참고값 · ${escapeHtml(reference.gpu)} · ${escapeHtml(reference.setting)}</span>
        <strong>${escapeHtml(reference.metric)}</strong>
        <small>사용자/자체 측정과 분리 표시</small>
      </div>
    `);
  }
  if (entries.length) {
    return `<div class="benchmark-mini-table">${entries.join("")}</div>`;
  }

  return `
    <small>이 모델의 외부 공개 참고값과 사용자/자체 측정값은 아직 없습니다. 상세 수치는 계산 추정으로만 표시합니다.</small>
    ${BENCHMARK_META.reportingPaused
      ? `<small>${escapeHtml(BENCHMARK_META.reportingStatus || "신규 벤치마크 제보 일시 중단")}</small>`
      : `<div class="external-links evidence-links">${renderExternalLink("벤치마크 제보", BENCHMARK_META.reportUrl || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose")}</div>`}
  `;
}

function renderFitRationale(estimate, hardware) {
  const meta = GRADE_META[estimate.grade];
  const margin = estimate.effectiveVram - estimate.requiredGb;
  return `
    <div class="fit-rationale-grid">
      ${renderInfoItem("판정", meta.label)}
      ${renderInfoItem("필요 VRAM", formatGb(estimate.requiredGb))}
      ${renderInfoItem("가용 VRAM", formatGb(estimate.effectiveVram))}
      ${renderInfoItem(margin >= 0 ? "남는 VRAM" : "부족 VRAM", formatGb(Math.abs(margin)))}
      ${renderInfoItem("사용률", formatPercent(estimate.pressure))}
      ${renderInfoItem("계산 조건", buildHardwareBasis(hardware))}
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
  if (quant.id === recommendedQuantId) return "권장";
  if (quant.id === "fp16") return "원본";
  if (quant.rank >= 6) return "우수";
  if (quant.rank >= 5) return "매우 높음";
  if (quant.rank >= 4) return "높음";
  if (quant.rank >= 3) return "보통";
  return "낮음";
}

function precisionQualityLabel(precision, recommendedPrecisionId) {
  if (precision.id === recommendedPrecisionId) return "권장";
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
      <div class="memmap-title">VRAM 메모리 맵 · 총 ${formatGb(safeCapacity)}</div>
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
  const remainder = hardware.availableVram - estimate.requiredGb;
  const deltaLabel = remainder >= 0 ? "실행 후 잔여" : "가용 대비 부족";
  const deltaValue = Math.abs(remainder);
  const gpuPoolLabel = hardware.heterogeneous
    ? `이기종 병렬 반영 (${Math.round(hardware.shardingEfficiency * 100)}%)`
    : hardware.count > 1
      ? `병렬 반영 VRAM (${Math.round(hardware.shardingEfficiency * 100)}%)`
      : "계산 기준 VRAM";
  return `
    <div class="vram-budget-grid">
      ${renderInfoItem("총 GPU VRAM", formatGb(hardware.totalVram))}
      ${renderInfoItem(gpuPoolLabel, formatGb(hardware.baseEffectiveVram))}
      ${renderInfoItem("다른 작업 예약", formatGb(hardware.reservedVram))}
      ${renderInfoItem("안전 여유분", formatGb(hardware.safetyMarginGb))}
      ${renderInfoItem("모델 가용 VRAM", formatGb(hardware.availableVram))}
      ${renderInfoItem(deltaLabel, formatGb(deltaValue))}
      ${hardware.crossVendor ? renderInfoItem("런타임 호환성", "GPU 제조사 혼용 지원 확인 필요") : ""}
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
  return `
    <section class="detail-section license-section">
      <h3>라이선스 및 상업 이용</h3>
      <div class="license-summary-card">
        <div class="license-badges">
          <span class="license-badge license-${escapeAttr(policy.commercialUse)}">${escapeHtml(licenseCommercialLabel(policy))}</span>
          <span class="license-badge license-openness">${escapeHtml(licenseOpennessLabel(policy))}</span>
        </div>
        <strong>${escapeHtml(model.license)}</strong>
        <p>${escapeHtml(licenseSummary(policy))}</p>
        <small>${escapeHtml(LICENSE_META.disclaimer || "참고용 요약입니다. 실제 배포 전 최신 원문 약관을 확인하세요.")}</small>
        ${sourceUrl ? `<div class="external-links">${renderExternalLink("라이선스 원문 확인", sourceUrl)}</div>` : ""}
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

function renderBenchmarkSheet() {
  const table = $("benchmarkTable");
  if (!table) return;
  const benchmarkRows = BENCHMARKS.map((row) => ({ ...row, rowType: benchmarkEvidenceLabel(row) }));
  const userMeasurementRows = benchmarkRows.filter((row) => row.rowType === "사용자 측정");
  const projectMeasurementRows = benchmarkRows.filter((row) => row.rowType === "자체 측정");
  const externalBenchmarkRows = benchmarkRows.filter((row) => row.rowType === "외부 공개 참고값");
  const qualityRows = collectQualityBenchmarks();
  const referenceRows = collectReferenceBenchmarks();
  const rows = [...qualityRows, ...externalBenchmarkRows, ...referenceRows, ...userMeasurementRows, ...projectMeasurementRows];
  rows.forEach((row, index) => { row.rowKey = String(index); });
  const errorStats = computeBenchmarkErrorStats();
  const externalReferenceCount = qualityRows.length + externalBenchmarkRows.length + referenceRows.length;

  const benchmarkTypeLabel = uiLanguage === "en" ? "External public reference" : "외부 공개 참고값";
  const userTypeLabel = uiLanguage === "en" ? "User measurement" : "사용자 측정";
  const projectTypeLabel = uiLanguage === "en" ? "Project measurement" : "자체 측정";
  $("benchmarkMeta").textContent = `${t("updated")} ${DATA_UPDATED_AT} · ${benchmarkTypeLabel} ${externalReferenceCount}${uiLanguage === "en" ? "" : "개"} · ${userTypeLabel} ${userMeasurementRows.length}${uiLanguage === "en" ? "" : "개"} · ${projectTypeLabel} ${projectMeasurementRows.length}${uiLanguage === "en" ? "" : "개"}${errorStats ? ` · ${uiLanguage === "en" ? "Average estimate error" : "평균 추정 오차"} ${errorStats.avgAbsErrorPct.toFixed(1)}%` : ""}`;

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
        <span>${t("gpu")}</span>
        <span>${t("conditions")}</span>
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
          <span>${escapeHtml(row.gpu || row.gpuId || "-")}</span>
          <span>${escapeHtml(row.setting || row.runtime || row.workload || "-")}</span>
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

function closeModelDetail() {
  selectedModelKey = "";
  render();
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
  if (!value) return "불가";
  if (value < 1) return `${value.toFixed(1)} tok/s`;
  return `${Math.round(value)} tok/s`;
}

function formatThroughput(value, unit) {
  if (!value) return `불가`;
  if (value >= 1000) return `${Math.round(value).toLocaleString("ko-KR")} ${unit}`;
  if (value >= 10) return `${Math.round(value)} ${unit}`;
  return `${value.toFixed(1)} ${unit}`;
}

function formatMegapixels(value) {
  return `${value.toFixed(value >= 10 ? 0 : 1)} MP`;
}

function formatDuration(seconds) {
  if (!seconds) return "불가";
  if (seconds < 1) return `${seconds.toFixed(1)}초`;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}초`;
  return `${Math.floor(seconds / 60)}분 ${Math.round(seconds % 60)}초`;
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
  if (value === "document-vlm" || value === "ocr-vlm") return "문서 특화 VLM";
  if (value === "general-vlm") return "범용 VLM";
  return "OCR 파이프라인";
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
  params.set("ui", appMode);
  params.set("lang", uiLanguage);
  params.set("mode", activeWorkload);
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

  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", nextUrl);
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const uiParam = params.get("ui");
  appMode = uiParam === "expert" || uiParam === "simple"
    ? uiParam
    : params.get("model")
      ? "expert"
      : "simple";

  const modeParam = params.get("mode");
  const mode = WORKLOAD_ALIASES[modeParam] || modeParam;
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

  syncPresetControls();

  const model = params.get("model");
  selectedModelKey = hasPrimaryGpuSelection && model && getModelByKey(model) ? model : "";
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
