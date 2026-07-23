window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

const MODEL_METADATA_SOURCES = {
  qwen25: "https://qwenlm.github.io/blog/qwen2.5/",
  qwen3: "https://qwenlm.github.io/blog/qwen3/",
  qwen3Report: "https://arxiv.org/abs/2505.09388",
  llama31: "https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md",
  llama32: "https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/MODEL_CARD.md",
  llama33: "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct",
  gemma3: "https://deepmind.google/models/gemma/gemma-3/",
  gemmaReleases: "https://ai.google.dev/gemma/docs/releases",
  phi4: "https://huggingface.co/microsoft/phi-4",
  deepseekR1: "https://github.com/deepseek-ai/DeepSeek-R1",
  deepseekR1News: "https://api-docs.deepseek.com/news/news250120",
  deepseekV3News: "https://api-docs.deepseek.com/zh-cn/news/news1226",
  mistralSmall31: "https://huggingface.co/mistralai/Mistral-Small-3.1-24B-Instruct-2503",
  mistralSmall31News: "https://mistral.ai/news/mistral-small-3-1/",
  mistralChangelog: "https://docs.mistral.ai/resources/changelogs",
  mistralNemo: "https://legal.mistral.ai/ai-governance/models/open-mistral-nemo-2407",
  mistral7b: "https://legal.mistral.ai/ai-governance/models/mistral-7-b",
  mistralLarge2: "https://mistral.ai/news/mistral-large-2407/",
  mixtral: "https://mistral.ai/news/mixtral-of-experts/",
  exaone35: "https://huggingface.co/LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct",
  exaone35Small: "https://huggingface.co/LGAI-EXAONE/EXAONE-3.5-2.4B-Instruct",
  exaone40: "https://github.com/LG-AI-EXAONE/EXAONE-4.0",
  kanana15: "https://github.com/kakao/kanana",
  ax40: "https://huggingface.co/skt/A.X-4.0-Light",
  solar: "https://www.upstage.ai/news/solar-10-7b-emerges-as-worlds-top-pre-trained-llm",
  solarNim: "https://build.nvidia.com/upstage/solar-10_7b-instruct/modelcard",
  trillion: "https://huggingface.co/trillionlabs/Trillion-7B-preview",
};

function quality(label, metric, value, sourceUrl, note = "공식 품질") {
  return {
    label,
    metric,
    value,
    note,
    sourceUrl,
  };
}

function meta(releaseDate, sourceUrl, qualityBenchmark) {
  const record = { releaseDate, sourceUrl };
  if (qualityBenchmark) record.qualityBenchmark = qualityBenchmark;
  return record;
}

function same(record, names) {
  return Object.fromEntries(names.map((name) => [name, record]));
}

window.LLM_GPU_CHECKER_DATA.modelMetadata = {
  ...same(meta("2024-09-19", MODEL_METADATA_SOURCES.qwen25), [
    "Qwen2.5 0.5B Instruct",
    "Qwen2.5 1.5B Instruct",
    "Qwen2.5 3B Instruct",
    "Qwen2.5 14B Instruct",
  ]),
  "Qwen2.5 7B Instruct": meta(
    "2024-09-19",
    MODEL_METADATA_SOURCES.qwen25,
    quality("MMLU 77.23", "MMLU (0-shot, CoT)", 77.23, MODEL_METADATA_SOURCES.kanana15, "외부 평가"),
  ),
  "Qwen2.5 32B Instruct": meta(
    "2024-09-19",
    MODEL_METADATA_SOURCES.qwen25,
    quality("MMLU 84.40", "MMLU (0-shot, CoT)", 84.4, MODEL_METADATA_SOURCES.kanana15, "외부 평가"),
  ),
  "Qwen2.5 72B Instruct": meta(
    "2024-09-19",
    MODEL_METADATA_SOURCES.qwen25,
    quality("MMLU 87.14", "MMLU (0-shot, CoT)", 87.14, MODEL_METADATA_SOURCES.kanana15, "외부 평가"),
  ),

  ...same(meta("2025-04-29", MODEL_METADATA_SOURCES.qwen3), [
    "Qwen3 0.6B",
    "Qwen3 1.7B",
    "Qwen3 4B",
    "Qwen3 8B",
    "Qwen3 14B",
  ]),
  "Qwen3 30B A3B": meta(
    "2025-04-29",
    MODEL_METADATA_SOURCES.qwen3,
    quality("MMLU-Pro 61.49", "MMLU-Pro", 61.49, MODEL_METADATA_SOURCES.qwen3Report),
  ),
  "Qwen3 32B": meta(
    "2025-04-29",
    MODEL_METADATA_SOURCES.qwen3,
    quality("MMLU-Pro 65.54", "MMLU-Pro", 65.54, MODEL_METADATA_SOURCES.qwen3Report),
  ),
  "Qwen3 235B A22B": meta(
    "2025-04-29",
    MODEL_METADATA_SOURCES.qwen3,
    quality("MMLU-Pro 68.18", "MMLU-Pro", 68.18, MODEL_METADATA_SOURCES.qwen3Report),
  ),
  "Qwen3 235B A22B Thinking": meta(
    "2025-04-29",
    MODEL_METADATA_SOURCES.qwen3,
    quality("AIME24 85.7", "AIME 2024", 85.7, MODEL_METADATA_SOURCES.qwen3Report),
  ),

  "Llama 3.2 1B Instruct": meta(
    "2024-10-24",
    MODEL_METADATA_SOURCES.llama32,
    quality("MMLU 49.3", "MMLU (5-shot)", 49.3, MODEL_METADATA_SOURCES.llama32),
  ),
  "Llama 3.2 3B Instruct": meta(
    "2024-10-24",
    MODEL_METADATA_SOURCES.llama32,
    quality("MMLU 63.4", "MMLU (5-shot)", 63.4, MODEL_METADATA_SOURCES.llama32),
  ),
  "Llama 3.1 8B Instruct": meta(
    "2024-07-23",
    MODEL_METADATA_SOURCES.llama31,
    quality("MMLU-Pro 48.3", "MMLU-Pro (CoT, 5-shot)", 48.3, MODEL_METADATA_SOURCES.llama31),
  ),
  "Llama 3.1 70B Instruct": meta(
    "2024-07-23",
    MODEL_METADATA_SOURCES.llama31,
    quality("MMLU-Pro 66.4", "MMLU-Pro (CoT, 5-shot)", 66.4, MODEL_METADATA_SOURCES.llama31),
  ),
  "Llama 3.1 405B Instruct": meta(
    "2024-07-23",
    MODEL_METADATA_SOURCES.llama31,
    quality("MMLU-Pro 73.3", "MMLU-Pro (CoT, 5-shot)", 73.3, MODEL_METADATA_SOURCES.llama31),
  ),
  "Llama 3.3 70B Instruct": meta(
    "2024-12-06",
    MODEL_METADATA_SOURCES.llama33,
    quality("MMLU-Pro 68.9", "MMLU Pro (CoT, 5-shot)", 68.9, MODEL_METADATA_SOURCES.llama33),
  ),

  "Gemma 2 2B IT": meta(
    "2024-07-31",
    MODEL_METADATA_SOURCES.gemmaReleases,
    quality("MMLU-Pro 15.6", "MMLU-Pro", 15.6, MODEL_METADATA_SOURCES.gemma3),
  ),
  "Gemma 2 9B IT": meta(
    "2024-06-27",
    MODEL_METADATA_SOURCES.gemmaReleases,
    quality("MMLU-Pro 46.8", "MMLU-Pro", 46.8, MODEL_METADATA_SOURCES.gemma3),
  ),
  "Gemma 2 27B IT": meta(
    "2024-06-27",
    MODEL_METADATA_SOURCES.gemmaReleases,
    quality("MMLU-Pro 56.9", "MMLU-Pro", 56.9, MODEL_METADATA_SOURCES.gemma3),
  ),
  "Gemma 3 1B IT": meta(
    "2025-03-12",
    MODEL_METADATA_SOURCES.gemma3,
    quality("MMLU-Pro 14.7", "MMLU-Pro", 14.7, MODEL_METADATA_SOURCES.gemma3),
  ),
  "Gemma 3 4B IT": meta(
    "2025-03-12",
    MODEL_METADATA_SOURCES.gemma3,
    quality("MMLU-Pro 43.6", "MMLU-Pro", 43.6, MODEL_METADATA_SOURCES.gemma3),
  ),
  "Gemma 3 12B IT": meta(
    "2025-03-12",
    MODEL_METADATA_SOURCES.gemma3,
    quality("MMLU-Pro 60.6", "MMLU-Pro", 60.6, MODEL_METADATA_SOURCES.gemma3),
  ),
  "Gemma 3 27B IT": meta(
    "2025-03-12",
    MODEL_METADATA_SOURCES.gemma3,
    quality("MMLU-Pro 67.5", "MMLU-Pro", 67.5, MODEL_METADATA_SOURCES.gemma3),
  ),

  "Phi-4 14B": meta(
    "2024-12-12",
    MODEL_METADATA_SOURCES.phi4,
    quality("MMLU 84.8", "MMLU", 84.8, MODEL_METADATA_SOURCES.phi4),
  ),

  "DeepSeek V3": meta(
    "2024-12-26",
    MODEL_METADATA_SOURCES.deepseekV3News,
    quality("MMLU-Pro 75.9", "MMLU-Pro (EM)", 75.9, MODEL_METADATA_SOURCES.deepseekR1),
  ),
  "DeepSeek R1": meta(
    "2025-01-20",
    MODEL_METADATA_SOURCES.deepseekR1News,
    quality("MMLU-Pro 84.0", "MMLU-Pro (EM)", 84, MODEL_METADATA_SOURCES.deepseekR1),
  ),
  "DeepSeek R1 Distill Qwen 7B": meta(
    "2025-01-20",
    MODEL_METADATA_SOURCES.deepseekR1News,
    quality("AIME24 55.5", "AIME 2024 pass@1", 55.5, MODEL_METADATA_SOURCES.deepseekR1, "공식 증류"),
  ),
  "DeepSeek R1 Distill Llama 8B": meta(
    "2025-01-20",
    MODEL_METADATA_SOURCES.deepseekR1News,
    quality("AIME24 50.4", "AIME 2024 pass@1", 50.4, MODEL_METADATA_SOURCES.deepseekR1, "공식 증류"),
  ),
  "DeepSeek R1 Distill Qwen 14B": meta(
    "2025-01-20",
    MODEL_METADATA_SOURCES.deepseekR1News,
    quality("AIME24 69.7", "AIME 2024 pass@1", 69.7, MODEL_METADATA_SOURCES.deepseekR1, "공식 증류"),
  ),
  "DeepSeek R1 Distill Qwen 32B": meta(
    "2025-01-20",
    MODEL_METADATA_SOURCES.deepseekR1News,
    quality("AIME24 72.6", "AIME 2024 pass@1", 72.6, MODEL_METADATA_SOURCES.deepseekR1, "공식 증류"),
  ),
  "DeepSeek R1 Distill Llama 70B": meta(
    "2025-01-20",
    MODEL_METADATA_SOURCES.deepseekR1News,
    quality("AIME24 70.0", "AIME 2024 pass@1", 70, MODEL_METADATA_SOURCES.deepseekR1, "공식 증류"),
  ),

  "Mistral 7B Instruct": meta("2023-09-27", MODEL_METADATA_SOURCES.mistral7b),
  "Mixtral 8x7B Instruct": meta("2023-12-11", MODEL_METADATA_SOURCES.mixtral),
  "Mistral Nemo 12B Instruct": meta("2024-07-18", MODEL_METADATA_SOURCES.mistralNemo),
  "Mistral Large 2 123B": meta("2024-07-24", MODEL_METADATA_SOURCES.mistralLarge2),
  "Mistral Small 3.1 24B": meta(
    "2025-03-17",
    MODEL_METADATA_SOURCES.mistralSmall31News,
    quality("MMLU-Pro 66.76", "MMLU Pro (5-shot CoT)", 66.76, MODEL_METADATA_SOURCES.mistralSmall31),
  ),
  "Mistral Small 3.2 24B": meta("2025-06-20", MODEL_METADATA_SOURCES.mistralChangelog),
  "Devstral Small 24B": meta("2025-05-21", MODEL_METADATA_SOURCES.mistralChangelog),

  "EXAONE 3.5 2.4B Instruct": meta(
    "2024-12-09",
    MODEL_METADATA_SOURCES.exaone35Small,
    quality("LiveBench 33.0", "LiveBench", 33, MODEL_METADATA_SOURCES.exaone35Small),
  ),
  "EXAONE 3.5 7.8B Instruct": meta(
    "2024-12-09",
    MODEL_METADATA_SOURCES.exaone35,
    quality("LiveBench 39.8", "LiveBench", 39.8, MODEL_METADATA_SOURCES.exaone35),
  ),
  "EXAONE 4.0 1.2B": meta(
    "2025-07-15",
    MODEL_METADATA_SOURCES.exaone40,
    quality("MMLU-Pro 59.3", "MMLU-Pro", 59.3, MODEL_METADATA_SOURCES.exaone40),
  ),
  "EXAONE 4.0 32B": meta(
    "2025-07-15",
    MODEL_METADATA_SOURCES.exaone40,
    quality("MMLU-Pro 81.8", "MMLU-Pro", 81.8, MODEL_METADATA_SOURCES.exaone40),
  ),

  "Kanana 1.5 8B Instruct": meta(
    "2025-05-23",
    MODEL_METADATA_SOURCES.kanana15,
    quality("KMMLU 48.28", "KMMLU (0-shot, CoT)", 48.28, MODEL_METADATA_SOURCES.kanana15, "공식 한국어"),
  ),
  "A.X 4.0 Light 7B": meta("2025-07-03", MODEL_METADATA_SOURCES.ax40),
  "A.X 4.0 72B": meta(
    "2025-07-03",
    MODEL_METADATA_SOURCES.ax40,
    quality("KMMLU 78.32", "KMMLU", 78.32, MODEL_METADATA_SOURCES.ax40, "공식 한국어"),
  ),
  "SOLAR 10.7B Instruct": meta(
    "2023-12-13",
    MODEL_METADATA_SOURCES.solarNim,
    quality("Avg 74.2", "Open LLM Leaderboard average", 74.2, MODEL_METADATA_SOURCES.solar, "공식 발표"),
  ),
  "Trillion 7B Preview": meta(
    "2025-06",
    MODEL_METADATA_SOURCES.trillion,
    quality("Avg 66.5", "Average performance", 66.5, MODEL_METADATA_SOURCES.trillion, "공식 평가"),
  ),
};

function mergeModelMetadata(records) {
  for (const [name, metadata] of Object.entries(records)) {
    window.LLM_GPU_CHECKER_DATA.modelMetadata[name] = {
      ...(window.LLM_GPU_CHECKER_DATA.modelMetadata[name] || {}),
      ...metadata,
    };
  }
}

function cardDate(releaseDate) {
  return {
    releaseDate,
    releaseNote: "모델 카드",
  };
}

mergeModelMetadata({
  "TinyLlama 1.1B Chat": {
    releaseDate: "2024-01-04",
    sourceUrl: "https://huggingface.co/TinyLlama/TinyLlama_v1.1",
    qualityBenchmark: quality("Avg 53.63", "TinyLlama reported average", 53.63, "https://huggingface.co/TinyLlama/TinyLlama_v1.1", "공식 평가"),
  },
  "SmolLM2 1.7B Instruct": {
    releaseDate: "2025-02-05",
    sourceUrl: "https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B",
  },
  "Phi-3.5 Mini Instruct": {
    releaseDate: "2024-08-20",
    sourceUrl: "https://huggingface.co/microsoft/Phi-3.5-mini-instruct",
  },
  "Phi-4 Mini Instruct": {
    releaseDate: "2025-02",
    sourceUrl: "https://huggingface.co/microsoft/Phi-4-mini-instruct",
    qualityBenchmark: quality("MMLU-Pro 52.8", "MMLU-Pro (0-shot, CoT)", 52.8, "https://huggingface.co/microsoft/Phi-4-mini-instruct"),
  },
  "Mistral 7B Instruct": {
    releaseDate: "2023-09-27",
    sourceUrl: "https://legal.mistral.ai/ai-governance/models/mistral-7-b",
  },
  "Mistral Nemo 12B Instruct": {
    qualityBenchmark: quality("MMLU 68.0", "MMLU (5-shot)", 68, "https://developer.nvidia.com/blog/power-text-generation-applications-with-mistral-nemo-12b-running-on-a-single-gpu/", "공식 파트너"),
  },
  "StarCoder2 15B": {
    releaseDate: "2024-02-28",
    sourceUrl: "https://huggingface.co/bigcode/starcoder2-15b",
    qualityBenchmark: quality("HumanEval 46", "HumanEval pass@1", 46, "https://developer.nvidia.com/blog/unlock-your-llm-coding-potential-with-starcoder2/", "공식 파트너"),
  },
  "Codestral 22B": {
    releaseDate: "2024-05-29",
    sourceUrl: "https://mistral.ai/news/codestral/",
  },
  "Qwen2.5 Coder 1.5B Instruct": {
    releaseDate: "2024-11-12",
    sourceUrl: "https://qwenlm.github.io/blog/qwen2.5-coder-family/",
  },
  "Qwen2.5 Coder 7B Instruct": {
    releaseDate: "2024-11-12",
    sourceUrl: "https://qwenlm.github.io/blog/qwen2.5-coder-family/",
  },
  "Qwen2.5 Coder 14B Instruct": {
    releaseDate: "2024-11-12",
    sourceUrl: "https://qwenlm.github.io/blog/qwen2.5-coder-family/",
  },
  "Qwen2.5 Coder 32B Instruct": {
    releaseDate: "2024-11-12",
    sourceUrl: "https://qwenlm.github.io/blog/qwen2.5-coder-family/",
  },
  "Qwen2.5 72B Coder": {
    releaseDate: "2024-11-12",
    sourceUrl: "https://qwenlm.github.io/blog/qwen2.5-coder-family/",
  },
  "Qwen3 Coder 30B A3B": {
    releaseDate: "2025-07",
    sourceUrl: "https://github.com/QwenLM/Qwen3-Coder",
  },
  "Qwen3-Coder 480B A35B Instruct": {
    releaseDate: "2025-07",
    sourceUrl: "https://github.com/QwenLM/Qwen3-Coder",
  },
  "CodeLlama 7B Instruct": {
    releaseDate: "2023-08-24",
    sourceUrl: "https://ai.meta.com/blog/code-llama-large-language-model-coding/",
  },
  "CodeLlama 13B Instruct": {
    releaseDate: "2023-08-24",
    sourceUrl: "https://ai.meta.com/blog/code-llama-large-language-model-coding/",
  },
  "CodeLlama 34B Instruct": {
    releaseDate: "2023-08-24",
    sourceUrl: "https://ai.meta.com/blog/code-llama-large-language-model-coding/",
  },
  "DeepSeek Coder V2 Lite 16B": {
    releaseDate: "2024-06-17",
    sourceUrl: "https://github.com/deepseek-ai/DeepSeek-Coder-V2",
  },
  "DeepSeek Coder V2 236B": {
    releaseDate: "2024-06-17",
    sourceUrl: "https://github.com/deepseek-ai/DeepSeek-Coder-V2",
  },
  "Mixtral 8x22B Instruct": {
    releaseDate: "2024-04-17",
    sourceUrl: "https://mistral.ai/news/mixtral-8x22b/",
  },
  "Command R 35B": {
    releaseDate: "2024-03-11",
    sourceUrl: "https://huggingface.co/CohereForAI/c4ai-command-r-v01",
  },
  "Command R+ 104B": {
    releaseDate: "2024-04-04",
    sourceUrl: "https://huggingface.co/CohereForAI/c4ai-command-r-plus",
  },
  "Aya Expanse 8B": {
    releaseDate: "2024-10-23",
    sourceUrl: "https://huggingface.co/CohereForAI/aya-expanse-8b",
  },
  "Aya Expanse 32B": {
    releaseDate: "2024-10-23",
    sourceUrl: "https://huggingface.co/CohereForAI/aya-expanse-32b",
  },
  "OLMo 2 7B Instruct": {
    releaseDate: "2024-11-26",
    sourceUrl: "https://huggingface.co/allenai/OLMo-2-1124-7B-Instruct",
  },
  "OLMo 2 13B Instruct": {
    releaseDate: "2024-11-26",
    sourceUrl: "https://huggingface.co/allenai/OLMo-2-1124-13B-Instruct",
  },
  "OLMoE 1B-7B Instruct": {
    releaseDate: "2024-09-05",
    sourceUrl: "https://huggingface.co/allenai/OLMoE-1B-7B-0924-Instruct",
  },
  "Falcon 7B Instruct": {
    releaseDate: "2023-05-25",
    sourceUrl: "https://huggingface.co/tiiuae/falcon-7b-instruct",
  },
  "Falcon 40B Instruct": {
    releaseDate: "2023-05-25",
    sourceUrl: "https://huggingface.co/tiiuae/falcon-40b-instruct",
  },
  "Falcon 180B Chat": {
    releaseDate: "2023-09-06",
    sourceUrl: "https://huggingface.co/tiiuae/falcon-180B-chat",
  },
  "Jamba 1.5 Mini": {
    releaseDate: "2024-08-22",
    sourceUrl: "https://huggingface.co/ai21labs/AI21-Jamba-1.5-Mini",
  },
  "Jamba 1.5 Large": {
    releaseDate: "2024-08-22",
    sourceUrl: "https://huggingface.co/ai21labs/AI21-Jamba-1.5-Large",
  },
  "NVIDIA Nemotron 4 15B": {
    releaseDate: "2024-06-14",
    sourceUrl: "https://huggingface.co/nvidia/Nemotron-4-15B-Instruct",
  },
  "Llama 3.1 Nemotron 70B": {
    releaseDate: "2024-10-15",
    sourceUrl: "https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
  },

  "Llama 3.2 11B Vision Instruct": {
    releaseDate: "2024-09-25",
    sourceUrl: MODEL_METADATA_SOURCES.llama32,
  },
  "Llama 3.2 90B Vision Instruct": {
    releaseDate: "2024-09-25",
    sourceUrl: MODEL_METADATA_SOURCES.llama32,
  },
  "Qwen2.5-VL 3B Instruct": {
    releaseDate: "2025-01-26",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-VL-3B-Instruct",
  },
  "Qwen2.5-VL 7B Instruct": {
    releaseDate: "2025-01-26",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct",
  },
  "Qwen2.5-VL 32B Instruct": {
    releaseDate: "2025-03-21",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct",
    qualityBenchmark: quality("OCRBench v2 57.2/59.1", "OCRBench v2 en/zh", 58.15, "https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct"),
  },
  "Qwen2.5-VL 72B Instruct": {
    releaseDate: "2025-01-27",
    sourceUrl: "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct",
    qualityBenchmark: quality("OCRBench v2 61.5/63.7", "OCRBench v2 en/zh", 62.6, "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct"),
  },
  "Pixtral 12B": {
    releaseDate: "2024-09-17",
    sourceUrl: "https://mistral.ai/news/pixtral-12b/",
    qualityBenchmark: quality("MMMU 52.5", "MMMU reasoning", 52.5, "https://mistral.ai/news/pixtral-12b/"),
  },
  "Pixtral Large 124B": {
    releaseDate: "2024-11-18",
    sourceUrl: "https://huggingface.co/mistralai/Pixtral-Large-Instruct-2411",
  },
  "MiniCPM-V 2.6 8B": {
    releaseDate: "2024-08-06",
    sourceUrl: "https://huggingface.co/openbmb/MiniCPM-V-2_6",
  },
  "InternVL2.5 8B": {
    releaseDate: "2024-12-10",
    sourceUrl: "https://huggingface.co/OpenGVLab/InternVL2_5-8B",
  },
  "InternVL2.5 26B": {
    releaseDate: "2024-12-10",
    sourceUrl: "https://huggingface.co/OpenGVLab/InternVL2_5-26B",
  },
  "InternVL2.5 78B": {
    releaseDate: "2024-12-10",
    sourceUrl: "https://huggingface.co/OpenGVLab/InternVL2_5-78B",
  },
  "Phi-3.5 Vision Instruct": {
    releaseDate: "2024-08-20",
    sourceUrl: "https://huggingface.co/microsoft/Phi-3.5-vision-instruct",
  },

  "PP-OCRv6 Tiny": {
    releaseDate: "2026-06-11",
    sourceUrl: "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html",
    qualityBenchmark: quality("OCR Acc 73.5", "Text recognition weighted accuracy", 73.5, "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html"),
  },
  "PP-OCRv6 Small": {
    releaseDate: "2026-06-11",
    sourceUrl: "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html",
    qualityBenchmark: quality("OCR Acc 81.3", "Text recognition weighted accuracy", 81.3, "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html"),
  },
  "PP-OCRv6 Medium": {
    releaseDate: "2026-06-11",
    sourceUrl: "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html",
    qualityBenchmark: quality("OCR Acc 83.2", "Text recognition weighted accuracy", 83.2, "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html"),
  },
  "PP-StructureV3 Basic": {
    releaseDate: "2025-06-26",
    sourceUrl: "https://paddlepaddle.github.io/PaddleOCR/v3.0.1/en/version3.x/algorithm/PP-StructureV3/PP-StructureV3.html",
  },
  "GOT-OCR2.0": {
    releaseDate: "2024-09-03",
    sourceUrl: "https://huggingface.co/docs/transformers/model_doc/got_ocr2",
  },
  "Surya OCR 2": {
    releaseDate: "2025-02",
    sourceUrl: "https://github.com/datalab-to/surya",
  },
  "deepseek-ai/deepseek-vl2": {
    releaseDate: "2024-12-13",
    sourceUrl: "https://github.com/deepseek-ai/DeepSeek-VL2",
  },
  "cross-encoder/mmarco-mMiniLMv2-L6-H384-v1": cardDate("2022-06-01"),
});

mergeModelMetadata({
  "Qwen/Qwen3-Embedding-0.6B": {
    ...cardDate("2025-06-03"),
    qualityBenchmark: quality("MTEB Multi 64.33", "MTEB Multilingual Mean(Task)", 64.33, "https://huggingface.co/Qwen/Qwen3-Embedding-8B"),
  },
  "Qwen/Qwen3-Embedding-4B": {
    ...cardDate("2025-06-03"),
    qualityBenchmark: quality("MTEB Multi 69.45", "MTEB Multilingual Mean(Task)", 69.45, "https://huggingface.co/Qwen/Qwen3-Embedding-8B"),
  },
  "Qwen/Qwen3-Embedding-8B": {
    ...cardDate("2025-06-03"),
    qualityBenchmark: quality("MTEB Multi 70.58", "MTEB Multilingual Mean(Task)", 70.58, "https://huggingface.co/Qwen/Qwen3-Embedding-8B"),
  },
  "BAAI/bge-m3": {
    ...cardDate("2024-01-27"),
    qualityBenchmark: quality("MTEB Multi 59.56", "MTEB Multilingual Mean(Task)", 59.56, "https://huggingface.co/Qwen/Qwen3-Embedding-8B", "외부 비교"),
  },
  "intfloat/multilingual-e5-large-instruct": {
    ...cardDate("2024-02-08"),
    qualityBenchmark: quality("MTEB Multi 63.22", "MTEB Multilingual Mean(Task)", 63.22, "https://huggingface.co/Qwen/Qwen3-Embedding-8B", "외부 비교"),
  },
  "Alibaba-NLP/gte-Qwen2-1.5B-instruct": {
    ...cardDate("2024-06-29"),
    qualityBenchmark: quality("MTEB Multi 59.45", "MTEB Multilingual Mean(Task)", 59.45, "https://huggingface.co/Qwen/Qwen3-Embedding-8B", "외부 비교"),
  },
  "Alibaba-NLP/gte-Qwen2-7B-instruct": {
    ...cardDate("2024-06-15"),
    qualityBenchmark: quality("MTEB Multi 62.51", "MTEB Multilingual Mean(Task)", 62.51, "https://huggingface.co/Qwen/Qwen3-Embedding-8B", "외부 비교"),
  },
  "jinaai/jina-embeddings-v3": {
    ...cardDate("2024-09-05"),
    qualityBenchmark: quality("MTEB Eng 65.52", "MTEB English average", 65.52, "https://jina.ai/models/jina-embeddings-v3/"),
  },
  "google/embeddinggemma-300m": {
    ...cardDate("2025-07-17"),
    qualityBenchmark: quality("MTEB Multi ~61", "MTEB Multilingual Mean(Task)", 61, "https://deepmind.google/models/gemma/embeddinggemma/", "공식 그래프"),
  },

  "jinaai/jina-reranker-v2-base-multilingual": {
    ...cardDate("2024-06-19"),
    qualityBenchmark: quality("BEIR 53.17", "BEIR nDCG@10 average", 53.17, "https://huggingface.co/jinaai/jina-reranker-v2-base-multilingual/blob/refs%2Fpr%2F8/README.md"),
  },
  "BAAI/bge-reranker-v2-m3": {
    ...cardDate("2024-03-15"),
    qualityBenchmark: quality("BEIR 53.65", "BEIR nDCG@10 average", 53.65, "https://huggingface.co/jinaai/jina-reranker-v2-base-multilingual/blob/refs%2Fpr%2F8/README.md", "외부 비교"),
  },
  "mixedbread-ai/mxbai-rerank-base-v2": {
    ...cardDate("2025-03-03"),
    qualityBenchmark: quality("BEIR 55.57", "BEIR nDCG@10 average", 55.57, "https://www.mixedbread.com/blog/mxbai-rerank-v2"),
  },
  "mixedbread-ai/mxbai-rerank-large-v2": {
    ...cardDate("2025-03-03"),
    qualityBenchmark: quality("BEIR 57.49", "BEIR nDCG@10 average", 57.49, "https://www.mixedbread.com/blog/mxbai-rerank-v2"),
  },
  "mixedbread-ai/mxbai-rerank-large-v1": {
    ...cardDate("2024-02-29"),
    qualityBenchmark: quality("BEIR 49.32", "BEIR nDCG@10 average", 49.32, "https://www.mixedbread.com/blog/mxbai-rerank-v2"),
  },
  "BAAI/bge-reranker-v2-gemma": {
    ...cardDate("2024-03-16"),
    qualityBenchmark: quality("BEIR 55.38", "BEIR nDCG@10 average", 55.38, "https://www.mixedbread.com/blog/mxbai-rerank-v2", "외부 비교"),
  },

  "PP-OCRv6 Tiny": qualityOnly("OCR Acc 73.5", "Text recognition weighted accuracy", 73.5, "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html"),
  "PP-OCRv6 Small": qualityOnly("OCR Acc 81.3", "Text recognition weighted accuracy", 81.3, "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html"),
  "PP-OCRv6 Medium": qualityOnly("OCR Acc 83.2", "Text recognition weighted accuracy", 83.2, "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html"),

  "PaddlePaddle/PaddleOCR-VL-1.6": {
    ...cardDate("2026-05-27"),
    qualityBenchmark: quality("96.33", "OmniDocBench v1.6", 96.33, "https://www.paddleocr.ai/main/en/version3.x/algorithm/PaddleOCR-VL/PaddleOCR-VL-1.6.html", "OmniDocBench v1.6"),
  },
  "PaddlePaddle/PaddleOCR-VL-0.9B": {
    ...cardDate("2025-10-16"),
    qualityBenchmark: quality("92.56", "OmniDocBench v1.5", 92.56, "https://www.paddleocr.ai/latest/en/version3.x/algorithm/PaddleOCR-VL/PaddleOCR-VL.html", "OmniDocBench v1.5"),
  },
  "opendatalab/MinerU2.5-Pro-2604-1.2B": {
    ...cardDate("2026-04-02"),
    qualityBenchmark: quality("93.04", "OmniDocBench v1.6", 93.04, "https://github.com/opendatalab/OmniDocBench", "OmniDocBench v1.6"),
  },
  "deepseek-ai/DeepSeek-OCR-2": {
    ...cardDate("2026-01-27"),
    qualityBenchmark: quality("90.25", "OmniDocBench v1.6", 90.25, "https://github.com/opendatalab/OmniDocBench", "OmniDocBench v1.6"),
  },
  "rednote-hilab/dots.ocr": {
    ...cardDate("2025-07-30"),
    qualityBenchmark: quality("90.77", "OmniDocBench v1.6", 90.77, "https://github.com/opendatalab/OmniDocBench", "OmniDocBench v1.6"),
  },
  "Qwen/Qwen2.5-VL-32B-Instruct": {
    ...cardDate("2025-03-21"),
    qualityBenchmark: quality("OCRBench v2 57.2/59.1", "OCRBench v2 en/zh", 58.15, "https://huggingface.co/Qwen/Qwen2.5-VL-32B-Instruct"),
  },
  "Qwen/Qwen2.5-VL-72B-Instruct": {
    ...cardDate("2025-01-27"),
    qualityBenchmark: quality("OCRBench v2 61.5/63.7", "OCRBench v2 en/zh", 62.6, "https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct"),
  },
  "Qwen/Qwen3-VL-4B-Instruct": {
    ...cardDate("2025-10-11"),
    qualityBenchmark: quality("OCRBench v2 60.68/59.13", "OCRBench v2 en/zh", 59.91, "https://huggingface.co/baidu/Qianfan-OCR", "외부 비교"),
  },
});

function qualityOnly(label, metric, value, sourceUrl, note = "공식 품질") {
  return {
    qualityBenchmark: quality(label, metric, value, sourceUrl, note),
  };
}

mergeModelMetadata({
  "BAAI/bge-large-en-v1.5": {
    ...cardDate("2023-09-12"),
    qualityBenchmark: quality("MTEB 64.23", "MTEB English average (56)", 64.23, "https://huggingface.co/BAAI/bge-large-en-v1.5"),
  },
  "BAAI/bge-base-en-v1.5": {
    ...cardDate("2023-09-11"),
    qualityBenchmark: quality("MTEB 63.55", "MTEB English average (56)", 63.55, "https://huggingface.co/BAAI/bge-base-en-v1.5"),
  },
  "BAAI/bge-small-en-v1.5": {
    ...cardDate("2023-09-12"),
    qualityBenchmark: quality("MTEB 62.17", "MTEB English average (56)", 62.17, "https://huggingface.co/BAAI/bge-small-en-v1.5"),
  },
  "intfloat/multilingual-e5-base": {
    ...cardDate("2023-05-19"),
    qualityBenchmark: quality("Mr.TyDi 65.9", "Mr. TyDi MRR@10 average", 65.9, "https://huggingface.co/intfloat/multilingual-e5-base", "공식 발표"),
  },
  "intfloat/multilingual-e5-small": {
    ...cardDate("2023-06-30"),
    qualityBenchmark: quality("Mr.TyDi 64.4", "Mr. TyDi MRR@10 average", 64.4, "https://huggingface.co/intfloat/multilingual-e5-base", "공식 발표"),
  },
  "intfloat/e5-large-v2": {
    ...cardDate("2023-05-19"),
    qualityBenchmark: quality("MTEB 62.25", "MTEB English average (56)", 62.25, "https://huggingface.co/intfloat/e5-large-v2", "공식 발표"),
  },
  "intfloat/e5-base-v2": {
    ...cardDate("2023-05-19"),
    qualityBenchmark: quality("MTEB 61.5", "MTEB English average (56)", 61.5, "https://huggingface.co/intfloat/e5-base-v2", "공식 발표"),
  },
  "intfloat/e5-small-v2": {
    ...cardDate("2023-05-19"),
    qualityBenchmark: quality("MTEB 59.93", "MTEB English average (56)", 59.93, "https://huggingface.co/intfloat/e5-small-v2", "공식 발표"),
  },
  "Alibaba-NLP/gte-multilingual-base": cardDate("2024-07-20"),
  "thenlper/gte-large": {
    ...cardDate("2023-07-27"),
    qualityBenchmark: quality("MTEB 63.13", "MTEB English average (56)", 63.13, "https://huggingface.co/thenlper/gte-large"),
  },
  "thenlper/gte-base": {
    ...cardDate("2023-07-27"),
    qualityBenchmark: quality("MTEB 62.39", "MTEB English average (56)", 62.39, "https://huggingface.co/thenlper/gte-base"),
  },
  "jinaai/jina-embeddings-v5-text-small": cardDate("2026-01-22"),
  "jinaai/jina-embeddings-v5-text-nano": cardDate("2026-01-22"),
  "Snowflake/snowflake-arctic-embed-l-v2.0": {
    ...cardDate("2024-11-08"),
    qualityBenchmark: quality("BEIR 55.6", "BEIR nDCG@10 average (15)", 55.6, "https://huggingface.co/Snowflake/snowflake-arctic-embed-l-v2.0"),
  },
  "Snowflake/snowflake-arctic-embed-m-v2.0": cardDate("2024-11-08"),
  "nomic-ai/nomic-embed-text-v1.5": {
    ...cardDate("2024-02-10"),
    qualityBenchmark: quality("MTEB 62.28", "MTEB English average (768d)", 62.28, "https://huggingface.co/nomic-ai/nomic-embed-text-v1.5"),
  },
  "mixedbread-ai/mxbai-embed-large-v1": {
    ...cardDate("2024-03-07"),
    qualityBenchmark: quality("MTEB 64.68", "MTEB English average (56)", 64.68, "https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1"),
  },
  "sentence-transformers/all-mpnet-base-v2": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("MTEB 57.78", "MTEB English average (56)", 57.78, "https://huggingface.co/BAAI/bge-large-en-v1.5", "외부 비교"),
  },
  "sentence-transformers/all-MiniLM-L6-v2": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("MTEB 56.26", "MTEB English average (56)", 56.26, "https://huggingface.co/thenlper/gte-large", "외부 비교"),
  },
  "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2": cardDate("2022-03-02"),
  "sentence-transformers/LaBSE": cardDate("2022-03-02"),
  "jinaai/jina-embeddings-v4": cardDate("2025-05-07"),
  "BAAI/bge-multilingual-gemma2": cardDate("2024-07-25"),
  "BAAI/bge-en-icl": cardDate("2024-07-25"),
  "BAAI/bge-code-v1": cardDate("2025-05-15"),
  "Alibaba-NLP/gte-large-en-v1.5": {
    ...cardDate("2024-04-20"),
    qualityBenchmark: quality("MTEB-en 65.39", "MTEB English average (56)", 65.39, "https://huggingface.co/Alibaba-NLP/gte-large-en-v1.5"),
  },
  "Alibaba-NLP/gte-base-en-v1.5": {
    ...cardDate("2024-04-20"),
    qualityBenchmark: quality("MTEB-en 64.11", "MTEB English average (56)", 64.11, "https://huggingface.co/Alibaba-NLP/gte-base-en-v1.5"),
  },
  "intfloat/e5-mistral-7b-instruct": cardDate("2023-12-20"),
  "Salesforce/SFR-Embedding-Mistral": cardDate("2024-01-24"),
  "Salesforce/SFR-Embedding-2_R": cardDate("2024-06-14"),
  "GritLM/GritLM-7B": cardDate("2024-02-11"),
  "WhereIsAI/UAE-Large-V1": {
    ...cardDate("2023-12-04"),
    qualityBenchmark: quality("MTEB 64.64", "MTEB Leaderboard average", 64.64, "https://huggingface.co/WhereIsAI/UAE-Large-V1", "공식 발표"),
  },
  "NovaSearch/stella_en_1.5B_v5": cardDate("2024-07-12"),
  "NovaSearch/stella_en_400M_v5": cardDate("2024-07-12"),
  "nomic-ai/nomic-embed-text-v2-moe": cardDate("2025-04-30"),
  "nomic-ai/modernbert-embed-base": cardDate("2024-12-29"),
  "ibm-granite/granite-embedding-311m-multilingual-r2": cardDate("2026-04-20"),
  "ibm-granite/granite-embedding-97m-multilingual-r2": cardDate("2026-04-20"),
  "ibm-granite/granite-embedding-english-r2": {
    ...cardDate("2025-07-17"),
    qualityBenchmark: quality("Avg 59.5", "MTEB-v2 Retrieval/CoIR/MLDR/LongEmbed/TableIR/MTRAG average", 59.5, "https://huggingface.co/ibm-granite/granite-embedding-english-r2"),
  },
  "ibm-granite/granite-embedding-small-english-r2": cardDate("2025-07-17"),
  "ibm-granite/granite-embedding-278m-multilingual": cardDate("2024-12-04"),
  "ibm-granite/granite-embedding-107m-multilingual": cardDate("2024-12-04"),
  "nlpai-lab/KURE-v1": {
    ...cardDate("2024-12-18"),
    qualityBenchmark: quality("NDCG@10 69.47", "한국어 검색 벤치마크 평균 NDCG@10 (top-k10)", 69.47, "https://huggingface.co/nlpai-lab/KURE-v1", "공식 발표"),
  },
  "nlpai-lab/KoE5": cardDate("2024-09-24"),
  "dragonkue/BGE-m3-ko": cardDate("2024-09-17"),
  "dragonkue/snowflake-arctic-embed-l-v2.0-ko": cardDate("2025-03-07"),
  "dragonkue/multilingual-e5-small-ko-v2": cardDate("2025-06-10"),
  "dragonkue/colbert-ko-0.1b": cardDate("2026-01-25"),
  "maidalun1020/bce-embedding-base_v1": cardDate("2023-12-29"),
  "sentence-transformers/paraphrase-multilingual-mpnet-base-v2": cardDate("2022-03-02"),
  "sentence-transformers/multi-qa-mpnet-base-dot-v1": cardDate("2022-03-02"),

  "Qwen/Qwen3-Reranker-0.6B": {
    ...cardDate("2025-05-29"),
    qualityBenchmark: quality("MTEB-R 65.80", "MTEB-R (retrieval subset) average", 65.8, "https://huggingface.co/Qwen/Qwen3-Reranker-0.6B", "공식 발표"),
  },
  "Qwen/Qwen3-Reranker-4B": {
    ...cardDate("2025-06-03"),
    qualityBenchmark: quality("MTEB-R 69.76", "MTEB-R (retrieval subset) average", 69.76, "https://huggingface.co/Qwen/Qwen3-Reranker-0.6B", "공식 발표"),
  },
  "Qwen/Qwen3-Reranker-8B": {
    ...cardDate("2025-05-29"),
    qualityBenchmark: quality("MTEB-R 69.02", "MTEB-R (retrieval subset) average", 69.02, "https://huggingface.co/Qwen/Qwen3-Reranker-0.6B", "공식 발표"),
  },
  "BAAI/bge-reranker-v2-minicpm-layerwise": cardDate("2024-03-16"),
  "Alibaba-NLP/gte-multilingual-reranker-base": {
    ...cardDate("2024-07-20"),
    qualityBenchmark: quality("MTEB-R 59.51", "MTEB-R (retrieval subset) average", 59.51, "https://huggingface.co/Qwen/Qwen3-Reranker-0.6B", "외부 비교"),
  },
  "BAAI/bge-reranker-large": {
    ...cardDate("2023-09-12"),
    qualityBenchmark: quality("Avg 66.09", "C-MTEB Reranking 6개 태스크 평균", 66.09, "https://huggingface.co/BAAI/bge-large-en-v1.5", "공식 발표"),
  },
  "BAAI/bge-reranker-base": {
    ...cardDate("2023-09-11"),
    qualityBenchmark: quality("Avg 65.42", "C-MTEB Reranking 6개 태스크 평균", 65.42, "https://huggingface.co/BAAI/bge-large-en-v1.5", "공식 발표"),
  },
  "cross-encoder/ms-marco-MiniLM-L-12-v2": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("NDCG@10 74.31", "TREC DL 2019 NDCG@10", 74.31, "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2", "공식 발표"),
  },
  "cross-encoder/ms-marco-MiniLM-L-6-v2": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("NDCG@10 74.30", "TREC DL 2019 NDCG@10", 74.3, "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2", "공식 발표"),
  },
  "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1": cardDate("2022-06-01"),
  "BAAI/bge-reranker-v2.5-gemma2-lightweight": cardDate("2024-07-25"),
  "Alibaba-NLP/gte-reranker-modernbert-base": {
    ...cardDate("2025-01-20"),
    qualityBenchmark: quality("BEIR 56.73", "BEIR nDCG@10 15개 데이터셋 평균", 56.73, "https://huggingface.co/Alibaba-NLP/gte-reranker-modernbert-base", "공식 발표"),
  },
  "ibm-granite/granite-embedding-reranker-english-r2": {
    ...cardDate("2025-08-04"),
    qualityBenchmark: quality("BEIR 55.8", "BEIR 평균 (granite-embedding-english-r2 retriever)", 55.8, "https://huggingface.co/ibm-granite/granite-embedding-reranker-english-r2", "공식 발표"),
  },
  "jinaai/jina-reranker-v1-tiny-en": {
    ...cardDate("2024-04-15"),
    qualityBenchmark: quality("NDCG@10 48.54", "BEIR 17개 데이터셋 NDCG@10 평균", 48.54, "https://huggingface.co/jinaai/jina-reranker-v1-turbo-en", "공식 발표"),
  },
  "jinaai/jina-reranker-v1-turbo-en": {
    ...cardDate("2024-04-15"),
    qualityBenchmark: quality("NDCG@10 49.60", "BEIR 17개 데이터셋 NDCG@10 평균", 49.6, "https://huggingface.co/jinaai/jina-reranker-v1-turbo-en", "공식 발표"),
  },
  "maidalun1020/bce-reranker-base_v1": cardDate("2023-12-29"),
  "dragonkue/bge-reranker-v2-m3-ko": {
    ...cardDate("2024-10-16"),
    qualityBenchmark: quality("F1 91.23", "한국어 금융 벤치마크 Top-1 F1 (AutoRAG)", 91.23, "https://huggingface.co/dragonkue/bge-reranker-v2-m3-ko", "공식 발표"),
  },
  "upskyy/ko-reranker-8k": {
    ...cardDate("2024-08-16"),
    qualityBenchmark: quality("F1 86.84", "한국어 금융 벤치마크 Top-1 F1 (AutoRAG)", 86.84, "https://huggingface.co/dragonkue/bge-reranker-v2-m3-ko", "외부 비교"),
  },
  "upskyy/ko-reranker": {
    ...cardDate("2024-08-16"),
    qualityBenchmark: quality("F1 83.33", "한국어 금융 벤치마크 Top-1 F1 (AutoRAG)", 83.33, "https://huggingface.co/dragonkue/bge-reranker-v2-m3-ko", "외부 비교"),
  },
  "Dongjin-kr/ko-reranker": {
    ...cardDate("2023-12-22"),
    qualityBenchmark: quality("F1 85.09", "한국어 금융 벤치마크 Top-1 F1 (AutoRAG)", 85.09, "https://huggingface.co/dragonkue/bge-reranker-v2-m3-ko", "외부 비교"),
  },
  "cross-encoder/ms-marco-MiniLM-L-4-v2": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("NDCG@10 73.04", "TREC DL 2019 NDCG@10", 73.04, "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2", "공식 발표"),
  },
  "cross-encoder/ms-marco-MiniLM-L-2-v2": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("NDCG@10 71.01", "TREC DL 2019 NDCG@10", 71.01, "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2", "공식 발표"),
  },
  "cross-encoder/ms-marco-electra-base": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("NDCG@10 71.99", "TREC DL 2019 NDCG@10", 71.99, "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2", "공식 발표"),
  },
  "cross-encoder/stsb-roberta-large": cardDate("2022-03-02"),
  "cross-encoder/nli-deberta-v3-base": cardDate("2022-03-02"),
  "cross-encoder/quora-roberta-base": cardDate("2022-03-02"),
  "cross-encoder/ms-marco-TinyBERT-L-2-v2": {
    ...cardDate("2022-03-02"),
    qualityBenchmark: quality("NDCG@10 69.84", "TREC DL 2019 NDCG@10", 69.84, "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L6-v2", "공식 발표"),
  },

  "rednote-hilab/dots.mocr": cardDate("2026-03-19"),
  "allenai/olmOCR-2-7B-1025": cardDate("2025-10-06"),
  "Qwen/Qwen3-VL-2B-Instruct": cardDate("2025-10-19"),
  "Qwen/Qwen3-VL-8B-Instruct": cardDate("2025-10-11"),
  "deepseek-ai/deepseek-vl2-tiny": cardDate("2024-12-13"),
  "deepseek-ai/deepseek-vl2-small": cardDate("2024-12-13"),
  "deepseek-ai/deepseek-vl-7b-chat": cardDate("2024-03-07"),
  "Qwen/Qwen2.5-VL-3B-Instruct": cardDate("2025-01-26"),
  "Qwen/Qwen2.5-VL-7B-Instruct": cardDate("2025-01-26"),
  "Qwen/Qwen2-VL-2B-Instruct": cardDate("2024-08-28"),
  "Qwen/Qwen2-VL-7B-Instruct": cardDate("2024-08-28"),
  "meta-llama/Llama-3.2-11B-Vision-Instruct": cardDate("2024-09-18"),
  "meta-llama/Llama-3.2-90B-Vision-Instruct": cardDate("2024-09-19"),
  "mistralai/Pixtral-12B-Base-2409": cardDate("2024-10-17"),
  "mistralai/Pixtral-Large-Instruct-2411": cardDate("2024-11-14"),
  "llava-hf/llava-onevision-qwen2-7b-ov-hf": cardDate("2024-08-13"),
  "llava-hf/llava-onevision-qwen2-72b-ov-hf": cardDate("2024-08-13"),
  "allenai/Molmo-7B-D-0924": cardDate("2024-09-25"),
  "allenai/Molmo-72B-0924": cardDate("2024-09-25"),
  "HuggingFaceTB/SmolVLM2-2.2B-Instruct": cardDate("2025-02-08"),
  "HuggingFaceTB/SmolVLM2-500M-Video-Instruct": cardDate("2025-02-11"),
  "microsoft/Phi-4-multimodal-instruct": cardDate("2025-02-24"),
  "CohereLabs/aya-vision-8b": cardDate("2025-03-02"),
  "CohereLabs/aya-vision-32b": cardDate("2025-03-02"),
  "zai-org/GLM-4.1V-9B-Thinking": cardDate("2025-06-28"),
  "zai-org/glm-4v-9b": cardDate("2024-06-04"),
  "openbmb/MiniCPM-V-4.6": cardDate("2026-04-13"),
  "OpenGVLab/InternVL3_5-4B": cardDate("2025-08-25"),
  "OpenGVLab/InternVL3_5-8B": cardDate("2025-08-25"),
  "moonshotai/Kimi-VL-A3B-Instruct": cardDate("2025-04-09"),
});

mergeModelMetadata({
  "Ministral 3B Instruct": {
    releaseDate: "2024-10-09",
    sourceUrl: "https://docs.mistral.ai/models/model-cards/ministral-3b-24-1",
  },
  "GLM-4 9B Chat": {
    releaseDate: "2024-06-05",
    sourceUrl: "https://github.com/zai-org/GLM-4",
  },
  "Yi 1.5 9B Chat": {
    releaseDate: "2024-05",
    sourceUrl: "https://huggingface.co/01-ai/Yi-1.5-9B",
  },
  "Yi 1.5 34B Chat": {
    releaseDate: "2024-05",
    sourceUrl: "https://huggingface.co/01-ai/Yi-1.5-9B",
  },
  "EEVE Korean 10.8B": {
    releaseDate: "2024-02-22",
    sourceUrl: "https://huggingface.co/yanolja/EEVE-Korean-10.8B-v1.0",
    qualityBenchmark: quality("LogicKor 5.86", "LogicKor overall", 5.86, "https://lk.instruct.kr/", "외부 한국어"),
  },
  "Llama-3-Korean-Bllossom-8B": {
    releaseDate: "2024-06-18",
    sourceUrl: "https://huggingface.co/MLP-KTLim/llama-3-Korean-Bllossom-8B",
    qualityBenchmark: quality("LogicKor 6.93", "LogicKor overall", 6.93, "https://huggingface.co/MLP-KTLim/llama-3-Korean-Bllossom-8B", "공식 한국어"),
  },
  "Llama-3-Korean-Bllossom-70B": {
    releaseDate: "2024-04-25",
    sourceUrl: "https://huggingface.co/Bllossom/llama-3-Korean-Bllossom-70B",
    qualityBenchmark: quality("LogicKor 5.85", "LogicKor overall", 5.85, "https://lk.instruct.kr/", "외부 한국어"),
  },
  "HyperCLOVAX SEED Think 14B": {
    releaseDate: "2025-07-21",
    sourceUrl: "https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Think-14B",
    qualityBenchmark: quality("Korean Avg 0.7269", "Korean/culture benchmark average", 0.7269, "https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Think-14B", "공식 한국어"),
  },
  "Zephyr 7B Beta": {
    releaseDate: "2023-10-26",
    sourceUrl: "https://huggingface.co/HuggingFaceH4/zephyr-7b-beta",
    qualityBenchmark: quality("MT-Bench 7.34", "MT-Bench score", 7.34, "https://huggingface.co/HuggingFaceH4/zephyr-7b-beta", "공개 평가"),
  },
  "OpenChat 3.5 7B": {
    releaseDate: "2024-01-06",
    sourceUrl: "https://huggingface.co/openchat/openchat-3.5-0106",
    qualityBenchmark: quality("Avg 64.5", "OpenChat benchmark average", 64.5, "https://huggingface.co/openchat/openchat-3.5-0106", "공식 평가"),
  },
  "Nous Hermes 3 Llama 3.1 8B": {
    releaseDate: "2024-08-15",
    sourceUrl: "https://huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B",
    qualityBenchmark: quality("MMLU-Pro 23.77", "Open LLM Leaderboard MMLU-Pro", 23.77, "https://huggingface.co/NousResearch/Hermes-3-Llama-3.1-8B", "공개 평가"),
  },
  "EXAONE Deep 7.8B": {
    releaseDate: "2025-02-06",
    sourceUrl: "https://huggingface.co/LGAI-EXAONE/EXAONE-Deep-7.8B",
    qualityBenchmark: quality("AIME24 70.0", "AIME 2024 pass@1", 70, "https://huggingface.co/OpenLLM-Korea/EXAONE-Deep-32B", "공식/미러"),
  },
  "EXAONE Deep 32B": {
    releaseDate: "2025-02-06",
    sourceUrl: "https://huggingface.co/LGAI-EXAONE/EXAONE-Deep-32B",
    qualityBenchmark: quality("AIME24 72.1", "AIME 2024 pass@1", 72.1, "https://huggingface.co/OpenLLM-Korea/EXAONE-Deep-32B", "공식/미러"),
  },
  "Devstral 2 123B": {
    releaseDate: "2025-12-09",
    sourceUrl: "https://docs.mistral.ai/resources/changelogs",
  },
  "DeepSeek V3.2": {
    releaseDate: "2025-12-01",
    sourceUrl: "https://api-docs.deepseek.com/news/news251201",
  },
  "Kimi K2": {
    releaseDate: "2025-07-11",
    sourceUrl: "https://huggingface.co/moonshotai/Kimi-K2-Instruct",
    qualityBenchmark: quality("MMLU-Pro 81", "MMLU-Pro", 81, "https://huggingface.co/moonshotai/Kimi-K2-Instruct", "공개 평가"),
  },
  "Kimi K2 Thinking": {
    releaseDate: "2025-11-08",
    sourceUrl: "https://platform.kimi.ai/blog/posts/Kimi_API_Newsletter",
  },
  "GLM-5.2": {
    releaseDate: "2026-06-16",
    sourceUrl: "https://docs.bigmodel.cn/cn/update/new-releases",
  },
  "GPT-OSS 20B": {
    releaseDate: "2025-08-05",
    sourceUrl: "https://openai.com/index/introducing-gpt-oss/",
  },
  "GPT-OSS 120B": {
    releaseDate: "2025-08-05",
    sourceUrl: "https://openai.com/index/introducing-gpt-oss/",
  },
  "Llama 4 Scout 17B Active": {
    releaseDate: "2025-04-05",
    sourceUrl: "https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E",
    qualityBenchmark: quality("MMLU-Pro 74.3", "MMLU Pro instruction", 74.3, "https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E", "공식 평가"),
  },
  "Llama 4 Maverick 17B Active": {
    releaseDate: "2025-04-05",
    sourceUrl: "https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E",
    qualityBenchmark: quality("MMLU-Pro 80.5", "MMLU Pro instruction", 80.5, "https://huggingface.co/meta-llama/Llama-4-Maverick-17B-128E", "공식 평가"),
  },
  "Gemma 4 E2B IT Thinking": {
    releaseDate: "2026-03-31",
    sourceUrl: "https://ai.google.dev/gemma/docs/releases",
    qualityBenchmark: quality("MMMLU 60.0", "MMMLU multilingual Q&A", 60, "https://deepmind.google/models/gemma/gemma-4/", "공식 평가"),
  },
  "Gemma 4 E4B IT Thinking": {
    releaseDate: "2026-03-31",
    sourceUrl: "https://ai.google.dev/gemma/docs/releases",
    qualityBenchmark: quality("MMMLU 69.4", "MMMLU multilingual Q&A", 69.4, "https://deepmind.google/models/gemma/gemma-4/", "공식 평가"),
  },
  "Gemma 4 12B IT Thinking": {
    releaseDate: "2026-06-03",
    sourceUrl: "https://blog.google/innovation-and-ai/technology/developers-tools/introducing-gemma-4-12B/",
  },
  "Gemma 4 26B A4B IT Thinking": {
    releaseDate: "2026-03-31",
    sourceUrl: "https://ai.google.dev/gemma/docs/releases",
    qualityBenchmark: quality("MMMLU 82.6", "MMMLU multilingual Q&A", 82.6, "https://deepmind.google/models/gemma/gemma-4/", "공식 평가"),
  },
  "Gemma 4 31B IT Thinking": {
    releaseDate: "2026-03-31",
    sourceUrl: "https://ai.google.dev/gemma/docs/releases",
    qualityBenchmark: quality("MMMLU 85.2", "MMMLU multilingual Q&A", 85.2, "https://deepmind.google/models/gemma/gemma-4/", "공식 평가"),
  },
  "Qwen3-Next 80B A3B Instruct": {
    releaseDate: "2025-09-10",
    sourceUrl: "https://qwen.ai/blog?from=research.latest-&id=4074cca80393150c248e508aa62983f9cb7d27cd",
    qualityBenchmark: quality("MMLU-Pro 80.6", "MMLU-Pro", 80.6, "https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct"),
  },
  "Qwen3.5 27B": {
    releaseDate: "2026-02-24",
    sourceUrl: "https://github.com/QwenLM/Qwen3.6/blob/main/README.md",
  },
  "Qwen3.5 35B A3B": {
    releaseDate: "2026-02-24",
    sourceUrl: "https://github.com/QwenLM/Qwen3.6/blob/main/README.md",
  },
  "Qwen3.5 122B A10B": {
    releaseDate: "2026-02-24",
    sourceUrl: "https://github.com/QwenLM/Qwen3.6/blob/main/README.md",
  },
  "Qwen3.5 397B A17B": {
    releaseDate: "2026-02-16",
    sourceUrl: "https://home.alibabagroup.com/en-US/document-1960233590314762240",
  },
  "Qwen3.6 27B": {
    releaseDate: "2026-04-22",
    sourceUrl: "https://github.com/QwenLM/Qwen3.6/blob/main/README.md",
  },
  "Qwen3.6 35B A3B": {
    releaseDate: "2026-04-16",
    sourceUrl: "https://github.com/QwenLM/Qwen3.6/blob/main/README.md",
  },
  "Mistral Small 4 119B A6B": {
    releaseDate: "2026-03-16",
    sourceUrl: "https://legal.mistral.ai/ai-governance/models",
  },
  "Mistral Medium 3.5 128B": {
    releaseDate: "2026-04-29",
    sourceUrl: "https://legal.mistral.ai/ai-governance/models/mistral-medium-3",
  },
  "Mistral Large 3 675B A41B": {
    releaseDate: "2025-12-02",
    sourceUrl: "https://mistral.ai/fr/news/mistral-3/",
  },
  "Ministral 3 3B": {
    releaseDate: "2025-12-02",
    sourceUrl: "https://legal.mistral.ai/ai-governance/models/ministral-3-3b",
  },
  "Ministral 3 8B": {
    releaseDate: "2025-12-02",
    sourceUrl: "https://docs.mistral.ai/resources/changelogs",
  },
  "Ministral 3 14B": {
    releaseDate: "2025-12-02",
    sourceUrl: "https://docs.mistral.ai/resources/changelogs",
  },
  "Magistral Small 1.2 24B": {
    releaseDate: "2025-09-18",
    sourceUrl: "https://docs.mistral.ai/models/model-cards/magistral-small-1-2-25-09",
  },
  "Granite 4.1 3B": {
    releaseDate: "2026-04-29",
    sourceUrl: "https://huggingface.co/ibm-granite/granite-4.1-3b",
  },
  "Granite 4.1 8B": {
    releaseDate: "2026-04-29",
    sourceUrl: "https://research.ibm.com/blog/granite-4-1-ai-foundation-models",
  },
  "GLM-4.5 Air 106B A12B": {
    releaseDate: "2025-07-28",
    sourceUrl: "https://docs.z.ai/release-notes/new-released",
    qualityBenchmark: quality("Avg 59.8", "12-benchmark aggregate", 59.8, "https://huggingface.co/zai-org/GLM-4.5-Air", "공식 평가"),
  },
  "LLaVA 1.6 Mistral 7B": {
    releaseDate: "2024-01-30",
    sourceUrl: "https://huggingface.co/llava-hf/llava-v1.6-mistral-7b-hf",
  },
  "LLaVA-NeXT 34B": {
    releaseDate: "2024-01-30",
    sourceUrl: "https://huggingface.co/llava-hf/llava-v1.6-34b-hf",
  },
  "Liquid LFM 3B": {
    releaseDate: "2024-09-30",
    sourceUrl: "https://www.liquid.ai/blog/liquid-foundation-models-our-first-series-of-generative-ai-models",
  },
  "Liquid LFM 40B": {
    releaseDate: "2024-09-30",
    sourceUrl: "https://www.liquid.ai/blog/liquid-foundation-models-our-first-series-of-generative-ai-models",
  },
});
