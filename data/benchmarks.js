window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

window.LLM_GPU_CHECKER_DATA.benchmarkMeta = {
  updatedAt: "2026-07-24",
  reportUrl: "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml",
  reportingPaused: false,
  reportingStatus: "GitHub Issue에서 신규 벤치마크 제보 접수 중",
  note: "User/project measurements require a source-linked run. External public references and estimator outputs are never stored as measurements.",
};

window.LLM_GPU_CHECKER_DATA.benchmarks = [
  { evidenceType: "external", modelName: "Qwen3 8B", gpu: "RTX 3060 12GB", workload: "generative", runtime: "llama.cpp", quantization: "Q4_K_XL", context: 16384, tokensPerSecond: 42, sourceUrl: "https://singhajit.com/llm-inference-speed-comparison/", note: "Hardware Corner 측정값을 인용한 외부 공개 참고값" },
  { evidenceType: "external", modelName: "Llama 3.1 8B Instruct", gpu: "RTX 3060 12GB", workload: "generative", runtime: "llama.cpp", quantization: "Q4_K_XL", context: 16384, tokensPerSecond: 42, sourceUrl: "https://singhajit.com/llm-inference-speed-comparison/", note: "Hardware Corner 측정값을 인용한 외부 공개 참고값" },
  { evidenceType: "external", modelName: "Qwen3 14B", gpu: "RTX 3060 12GB", workload: "generative", runtime: "llama.cpp", quantization: "Q4_K_XL", context: 16384, tokensPerSecond: 22.7, sourceUrl: "https://singhajit.com/llm-inference-speed-comparison/", note: "CUDA 12.8·16K 컨텍스트 외부 참고값" },
  { evidenceType: "external", modelName: "Qwen3 14B", gpu: "RTX 3060 12GB", workload: "generative", runtime: "llama.cpp", quantization: "Q4_K_M", context: 128, tokensPerSecond: 29.4, sourceUrl: "https://singhajit.com/llm-inference-speed-comparison/", note: "Vulkan·tg128 외부 참고값" },
  { evidenceType: "external", modelName: "Llama 3.1 8B Instruct", gpu: "RTX 4090 24GB", workload: "generative", runtime: "llama.cpp", quantization: "Q4_K_XL", context: 16384, tokensPerSecond: 104.3, sourceUrl: "https://singhajit.com/llm-inference-speed-comparison/", note: "Hardware Corner 측정값을 인용한 외부 공개 참고값" },
  { evidenceType: "external", modelName: "Qwen3 14B", gpu: "RTX 4090 24GB", workload: "generative", runtime: "llama.cpp", quantization: "Q4_K_XL", context: 16384, tokensPerSecond: 69.1, sourceUrl: "https://singhajit.com/llm-inference-speed-comparison/", note: "Hardware Corner 측정값을 인용한 외부 공개 참고값" },
  { evidenceType: "external", modelName: "Llama 3.1 8B Instruct", gpu: "RTX 4090 24GB", workload: "generative", runtime: "llama.cpp", quantization: "int4", context: 100, tokensPerSecond: 150, sourceUrl: "https://developer.nvidia.com/blog/?p=89663", note: "NVIDIA 내부 측정·입력 100/출력 100 토큰" },
  { evidenceType: "external", modelName: "Qwen3 32B", gpu: "RTX 5090 32GB", workload: "generative", runtime: "llama.cpp", quantization: "4-bit", context: 8192, tokensPerSecond: 69.45, sourceUrl: "https://llm-speed.com/m/qwen3-32b", note: "기여자 로컬 실행 기록·chat-short" },
  { evidenceType: "external", modelName: "Qwen3 32B", gpu: "RTX 5090 32GB", workload: "generative", runtime: "llama.cpp", quantization: "4-bit", context: 8192, tokensPerSecond: 62.3, sourceUrl: "https://llm-speed.com/m/qwen3-32b", note: "기여자 로컬 실행 기록·chat-long" },
  { evidenceType: "external", modelName: "Qwen3 32B", gpu: "RTX 5090 32GB", workload: "generative", runtime: "llama.cpp", quantization: "4-bit", context: 8192, tokensPerSecond: 66.64, sourceUrl: "https://llm-speed.com/m/qwen3-32b", note: "기여자 로컬 실행 기록·concurrent-decode" },
];
