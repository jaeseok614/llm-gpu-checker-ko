window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

window.LLM_GPU_CHECKER_DATA.precisions = {
  encoder: [
    { id: "auto", label: "자동 추천", bytesPerParam: null, activationBytes: null, rank: 0, quality: "자동" },
    { id: "fp32", label: "FP32", bytesPerParam: 4, activationBytes: 4, rank: 5, quality: "원본", computeKey: "fp32Tflops", speedFactor: 0.72 },
    { id: "fp16", label: "FP16", bytesPerParam: 2, activationBytes: 2, rank: 4, quality: "권장", computeKey: "fp16Tflops", speedFactor: 1 },
    { id: "bf16", label: "BF16", bytesPerParam: 2, activationBytes: 2, rank: 4, quality: "권장", computeKey: "bf16Tflops", speedFactor: 0.96 },
    { id: "int8", label: "INT8", bytesPerParam: 1, activationBytes: 2, rank: 3, quality: "경량", computeKey: "int8Tops", speedFactor: 1.35 },
    { id: "int4", label: "INT4", bytesPerParam: 0.5, activationBytes: 2, rank: 2, quality: "초경량", computeKey: "int8Tops", speedFactor: 1.55 },
  ],
  ocr: [
    { id: "auto", label: "자동 추천", bytesPerParam: null, activationBytes: null, rank: 0, quality: "자동" },
    { id: "fp32", label: "FP32", bytesPerParam: 4, activationBytes: 4, rank: 5, quality: "원본", computeKey: "fp32Tflops", speedFactor: 0.68 },
    { id: "fp16", label: "FP16", bytesPerParam: 2, activationBytes: 2, rank: 4, quality: "권장", computeKey: "fp16Tflops", speedFactor: 1 },
    { id: "bf16", label: "BF16", bytesPerParam: 2, activationBytes: 2, rank: 4, quality: "권장", computeKey: "bf16Tflops", speedFactor: 0.94 },
    { id: "int8", label: "INT8", bytesPerParam: 1, activationBytes: 2, rank: 3, quality: "경량", computeKey: "int8Tops", speedFactor: 1.28 },
  ],
};

window.LLM_GPU_CHECKER_DATA.encoderRuntimeProfiles = {
  pytorch: {
    label: "PyTorch 직접 실행",
    shortLabel: "PyTorch",
    baseOverheadGb: 0.9,
    hiddenFactor: 8.2,
    attentionFactor: 1,
    batchOverheadGb: 0.018,
    fixedLatencyMs: 24,
    computeEfficiency: 0.28,
    bandwidthEfficiency: 0.52,
    concurrencyEfficiency: 0.45,
  },
  sentenceTransformers: {
    label: "Sentence Transformers",
    shortLabel: "ST",
    baseOverheadGb: 0.75,
    hiddenFactor: 7.2,
    attentionFactor: 0.9,
    batchOverheadGb: 0.014,
    fixedLatencyMs: 18,
    computeEfficiency: 0.34,
    bandwidthEfficiency: 0.6,
    concurrencyEfficiency: 0.52,
  },
  tei: {
    label: "Text Embeddings Inference",
    shortLabel: "TEI",
    baseOverheadGb: 1.15,
    hiddenFactor: 6.2,
    attentionFactor: 0.72,
    batchOverheadGb: 0.012,
    fixedLatencyMs: 12,
    computeEfficiency: 0.44,
    bandwidthEfficiency: 0.68,
    concurrencyEfficiency: 0.72,
  },
  onnx: {
    label: "ONNX / OpenVINO",
    shortLabel: "ONNX",
    baseOverheadGb: 0.58,
    hiddenFactor: 5.4,
    attentionFactor: 0.7,
    batchOverheadGb: 0.01,
    fixedLatencyMs: 10,
    computeEfficiency: 0.38,
    bandwidthEfficiency: 0.66,
    concurrencyEfficiency: 0.58,
  },
};

window.LLM_GPU_CHECKER_DATA.ocrResolutionPresets = {
  "a4-200": { label: "A4 200 DPI", width: 1654, height: 2339 },
  "a4-300": { label: "A4 300 DPI", width: 2480, height: 3508 },
  "screen-1080": { label: "웹/스크린샷 1080p", width: 1920, height: 1080 },
  receipt: { label: "영수증/라벨", width: 1024, height: 2048 },
  custom: { label: "직접 입력", width: null, height: null },
};
