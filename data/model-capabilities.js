window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

(() => {
  const data = window.LLM_GPU_CHECKER_DATA;
  const USE_CASES = {
    general: { workload: "generative", ko: "일반 대화 / 비서", en: "Chat / assistant" },
    korean: { workload: "shared", ko: "한국어", en: "Korean" },
    coding: { workload: "generative", ko: "코딩", en: "Coding" },
    reasoning: { workload: "shared", ko: "추론 / 수학", en: "Reasoning / math" },
    long: { workload: "shared", ko: "긴 문서", en: "Long context" },
    vision: { workload: "shared", ko: "이미지 이해", en: "Image understanding" },
    retrieval: { workload: "shared", ko: "문서 검색 / RAG", en: "Document search / RAG" },
    multilingual: { workload: "shared", ko: "다국어", en: "Multilingual" },
    codeRetrieval: { workload: "shared", ko: "코드 검색", en: "Code search" },
    lightweight: { workload: "shared", ko: "가벼운 로컬 실행", en: "Lightweight local use" },
    quality: { workload: "shared", ko: "품질 우선", en: "Quality first" },
    speed: { workload: "shared", ko: "속도 우선", en: "Speed first" },
    document: { workload: "vision", ko: "문서 / PDF", en: "Documents / PDFs" },
    table: { workload: "vision", ko: "표 / 레이아웃", en: "Tables / layout" },
    handwriting: { workload: "vision", ko: "손글씨", en: "Handwriting" },
    math: { workload: "vision", ko: "수식 / 마크다운", en: "Math / Markdown" },
    video: { workload: "vision", ko: "비디오 이해", en: "Video understanding" },
    grounding: { workload: "vision", ko: "객체 위치 / 화면 조작", en: "Grounding / GUI" },
    image: { workload: "imageGeneration", ko: "일반 이미지 생성", en: "General image generation" },
    imageToVideo: { workload: "videoGeneration", ko: "이미지로 비디오 생성", en: "Image-to-video" },
    lipSync: { workload: "avatarGeneration", ko: "립싱크", en: "Lip sync" },
    talkingHead: { workload: "avatarGeneration", ko: "말하는 아바타", en: "Talking avatar" },
    portrait: { workload: "avatarGeneration", ko: "사진 애니메이션", en: "Portrait animation" },
    realtime: { workload: "shared", ko: "실시간 처리", en: "Real-time" },
    transcription: { workload: "audioStt", ko: "음성 받아쓰기", en: "Transcription" },
    accuracy: { workload: "audioStt", ko: "정확도 우선 받아쓰기", en: "Accuracy-first transcription" },
    natural: { workload: "audioTts", ko: "자연스러운 안내 음성", en: "Natural narration" },
    voiceCloning: { workload: "audioTts", ko: "목소리 복제", en: "Voice cloning" },
  };

  const GROUPS = [
    ["generative", data.models || []],
    ["embedding", data.embeddingModels || []],
    ["reranker", data.rerankerModels || []],
    ["ocr-pipeline", (data.ocrModels || []).filter((model) => model.type === "ocr-pipeline")],
    ["document-vlm", (data.ocrModels || []).filter((model) => ["ocr-vlm", "document-vlm"].includes(model.type))],
    ["general-vlm", (data.ocrModels || []).filter((model) => model.type === "general-vlm")],
    ["image-generation", (data.ocrModels || []).filter((model) => model.type === "image-generation")],
    ["video-generation", (data.ocrModels || []).filter((model) => model.type === "video-generation")],
    ["avatar-generation", (data.ocrModels || []).filter((model) => model.type === "avatar-generation")],
    ["audio-stt", (data.audioModels || []).filter((model) => model.type === "audio-stt")],
    ["audio-tts", (data.audioModels || []).filter((model) => model.type === "audio-tts")],
  ];

  const TYPE_DEFAULTS = {
    generative: { input: ["text"], output: ["text"], useCases: ["general"] },
    embedding: { input: ["text"], output: ["embedding"], useCases: ["retrieval"] },
    reranker: { input: ["text-pair"], output: ["score"], useCases: ["retrieval"] },
    "ocr-pipeline": { input: ["image", "document"], output: ["text"], useCases: ["document"] },
    "document-vlm": { input: ["image", "document", "text"], output: ["text"], useCases: ["document"] },
    "general-vlm": { input: ["image", "video", "text"], output: ["text"], useCases: ["vision"] },
    "image-generation": { input: ["text", "image"], output: ["image"], useCases: ["image"] },
    "video-generation": { input: ["text", "image"], output: ["video"], useCases: ["video"] },
    "avatar-generation": { input: ["audio", "image", "video"], output: ["video"], useCases: ["talkingHead"] },
    "audio-stt": { input: ["audio"], output: ["text"], useCases: ["transcription"] },
    "audio-tts": { input: ["text", "reference-audio"], output: ["audio"], useCases: ["natural"] },
  };

  const TAG_TO_USE_CASE = {
    general: "general", korean: "korean", coding: "coding", reasoning: "reasoning",
    long: "long", vision: "vision", retrieval: "retrieval", multilingual: "multilingual",
    codeRetrieval: "codeRetrieval", document: "document", pdf: "document", table: "table",
    layout: "table", handwriting: "handwriting", math: "math", markdown: "math",
    video: "video", grounding: "grounding", gui: "grounding", "lip-sync": "lipSync",
    "talking-head": "talkingHead", "single-image": "portrait", "portrait-animation": "portrait",
    realtime: "realtime",
  };

  const unique = (values) => [...new Set(values.filter(Boolean))];
  const modelText = (model) => {
    const summary = typeof model.summary === "object"
      ? `${model.summary.ko || ""} ${model.summary.en || ""}`
      : model.summary || "";
    return `${model.name || ""} ${model.provider || ""} ${model.maker || ""} ${summary}`.normalize("NFKC").toLowerCase();
  };

  function qualityTier(model, type) {
    const params = Number(model.params || 0);
    if (["audio-stt", "audio-tts", "embedding", "reranker"].includes(type)) return params >= .5 ? "high" : params >= .15 ? "balanced" : "light";
    if (["image-generation", "video-generation", "avatar-generation"].includes(type)) return params >= 5 ? "high" : params >= 1 ? "balanced" : "light";
    return params >= 30 ? "high" : params >= 7 ? "balanced" : "light";
  }

  function languages(model) {
    const tags = model.tags || [];
    const language = String(model.language || "").toLowerCase();
    const values = [];
    if (tags.includes("korean") || language.includes("korean")) values.push("ko");
    if (tags.includes("multilingual") || language.includes("multilingual")) values.push("multilingual");
    if (language.includes("english")) values.push("en");
    return unique(values.length ? values : ["unknown"]);
  }

  function resolve(model, type) {
    const defaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.generative;
    const text = modelText(model);
    const useCases = [];
    const evidence = {};
    const add = (id, kind) => {
      if (!id || !USE_CASES[id]) return;
      useCases.push(id);
      evidence[id] = evidence[id] === "type" ? "type" : kind;
    };
    defaults.useCases.forEach((id) => add(id, "type"));
    (model.useCases || []).forEach((id) => add(id, "metadata"));
    (model.tags || []).forEach((tag) => add(TAG_TO_USE_CASE[tag], "metadata"));

    const params = Number(model.params || 0);
    const realtime = Number(model.realtimeBase || 0);
    const multilingual = languages(model).includes("multilingual");
    if (multilingual) add("multilingual", "metadata");
    if (type === "audio-stt") {
      if (realtime >= 8 || (model.tags || []).includes("realtime")) add("realtime", realtime ? "metadata" : "tag");
      if (params >= .7 || /large|canary|distil-large/.test(text)) add("accuracy", "inferred");
      if (params <= .5 || /tiny|small|mini|distil/.test(text)) add("lightweight", "inferred");
    }
    if (type === "audio-tts") {
      if (realtime >= 15 || (model.tags || []).includes("realtime")) add("realtime", realtime ? "metadata" : "tag");
      if (params <= .15 || /kokoro|melo|piper|small|mini/.test(text)) add("lightweight", "inferred");
      if (/voice cloning|음성 복제|xtts|fish speech|clone/.test(text)) add("voiceCloning", "metadata");
    }
    if (type === "image-generation") {
      if (params >= 3 || /\bxl\b|flux.*dev|quality/.test(text)) add("quality", "inferred");
      if (/schnell|turbo|lightning|lcm|fast/.test(text) || params <= 2) add("speed", "inferred");
      if (params <= 1.5 || /tiny|small|mini|schnell/.test(text)) add("lightweight", "inferred");
    }
    if (type === "video-generation") {
      if (params >= 5 || /quality|pro/.test(text)) add("quality", "inferred");
      if (params <= 2 || /fast|turbo|light/.test(text)) add("speed", "inferred");
      if (params <= 2 || /tiny|small|mini|light/.test(text)) add("lightweight", "inferred");
      if (/image-conditioned|image based|image-to-video|\bi2v\b/.test(text)) add("imageToVideo", "metadata");
    }
    if (type === "avatar-generation" && params >= 2) add("quality", "inferred");
    if (/light|tiny|small|mini|schnell|distil|경량|초경량/.test(text)) add("lightweight", "inferred");

    const supports = unique([
      ...(model.tags || []),
      /voice cloning|음성 복제|xtts|fish speech|clone/.test(text) ? "voice-cloning" : "",
      /image-conditioned|image based|image-to-video|\bi2v\b/.test(text) ? "image-to-video" : "",
      /flash attention/i.test(text) || model.supportsFlashAttention ? "flash-attention" : "",
    ]);
    const latencyTier = realtime >= 15 || (model.tags || []).includes("realtime")
      ? "realtime"
      : ["video-generation", "image-generation"].includes(type)
        ? "batch"
        : params <= 3 ? "interactive" : "standard";
    const inferredCount = Object.values(evidence).filter((kind) => kind === "inferred").length;
    return {
      useCases: unique(useCases),
      useCaseEvidence: evidence,
      capabilityConfidence: inferredCount === 0 ? "high" : inferredCount <= 2 ? "medium" : "low",
      languages: languages(model),
      inputModality: [...defaults.input],
      outputModality: [...defaults.output],
      qualityTier: qualityTier(model, type),
      latencyTier,
      supports,
    };
  }

  const capabilities = {};
  GROUPS.forEach(([fallbackType, models]) => {
    models.forEach((model) => {
      const type = model.type || fallbackType;
      capabilities[`${type}:${model.name}`] = resolve(model, type);
    });
  });
  data.useCaseDefinitions = USE_CASES;
  data.modelCapabilities = capabilities;
})();
