window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

window.LLM_GPU_CHECKER_DATA.quantizations = [
  { id: "auto", label: "자동 추천", bits: null, bytesPerB: null, rank: 0 },
  { id: "iq2_xxs", label: "IQ2_XXS", bits: 2.1, bytesPerB: 0.28, rank: 0.7 },
  { id: "q2", label: "Q2_K", bits: 2.7, bytesPerB: 0.36, rank: 1 },
  { id: "q3_k_s", label: "Q3_K_S", bits: 3.4, bytesPerB: 0.43, rank: 1.8 },
  { id: "q3", label: "Q3_K_M", bits: 3.8, bytesPerB: 0.48, rank: 2 },
  { id: "q4_0", label: "Q4_0", bits: 4.5, bytesPerB: 0.56, rank: 3 },
  { id: "q4_k_s", label: "Q4_K_S", bits: 4.6, bytesPerB: 0.58, rank: 3.1 },
  { id: "q4", label: "Q4_K_M", bits: 4.8, bytesPerB: 0.6, rank: 3.2 },
  { id: "q5_0", label: "Q5_0", bits: 5.5, bytesPerB: 0.69, rank: 4 },
  { id: "q5_k_s", label: "Q5_K_S", bits: 5.5, bytesPerB: 0.69, rank: 4.1 },
  { id: "q5", label: "Q5_K_M", bits: 5.6, bytesPerB: 0.7, rank: 4.2 },
  { id: "q6", label: "Q6_K", bits: 6.6, bytesPerB: 0.83, rank: 5 },
  { id: "q8", label: "Q8_0", bits: 8.5, bytesPerB: 1.06, rank: 6 },
  { id: "fp16", label: "FP16/BF16", bits: 16, bytesPerB: 2.0, rank: 7 },
];
