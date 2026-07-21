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
