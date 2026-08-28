window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

// Closed/hosted API model pricing, for the "API 비용 계산기" (API cost
// calculator) and the self-host-vs-API comparison inside the infra sizing
// studio. This is a DIFFERENT kind of catalog from every other data file in
// this repo: these models never run on the user's own GPU, so there is no
// VRAM/bandwidth sizing question for them at all -- the only thing that
// matters is per-token price. Keep this file's schema deliberately separate
// from data/models.js (the local-inference catalog) rather than merging them,
// since mixing "needs a GPU" and "needs no GPU" rows into one list would
// break every VRAM-fit calculation in the app that assumes every row in that
// catalog is something you host yourself.
//
// Pricing basis for every row below: the STANDARD (non-batch, non-priority,
// non-cached, non-data-residency) per-token rate from each provider's own
// pricing page, fetched directly on the verifiedAt date. None of this
// reflects prompt caching, batch discounts, long-context surcharges past
// each provider's stated threshold, or regional pricing multipliers -- the
// API cost estimator surfaces this as a "표준가 기준, 캐싱/배치 미반영" caveat
// rather than claiming false precision. One flagship + one balanced + one
// economy tier per provider, matching the 3 major hosted-API providers a
// Korean AI infra team would actually be comparing self-hosting against.
window.LLM_GPU_CHECKER_DATA.apiModels = [
  {
    id: "openai-gpt-5.6-sol",
    provider: "OpenAI",
    name: "GPT-5.6 Sol",
    tier: "flagship",
    inputPerMTokUsd: 5.0,
    cachedInputPerMTokUsd: 0.5,
    outputPerMTokUsd: 30.0,
    note: {
      ko: "OpenAI 플래그십 에이전트/추론 모델. 컨텍스트 270K 토큰 이하 표준가 기준",
      en: "OpenAI's flagship agentic/reasoning model. Standard rate for prompts up to 270K tokens",
    },
    sourceUrl: "https://openai.com/api/pricing/",
    verifiedAt: "2026-08-28",
  },
  {
    id: "openai-gpt-5.6-terra",
    provider: "OpenAI",
    name: "GPT-5.6 Terra",
    tier: "balanced",
    inputPerMTokUsd: 2.0,
    cachedInputPerMTokUsd: 0.2,
    outputPerMTokUsd: 12.0,
    note: {
      ko: "대량 처리에 맞춘 균형형 모델. 컨텍스트 270K 토큰 이하 표준가 기준",
      en: "Balanced model tuned for high-volume work. Standard rate for prompts up to 270K tokens",
    },
    sourceUrl: "https://openai.com/api/pricing/",
    verifiedAt: "2026-08-28",
  },
  {
    id: "openai-gpt-5.6-luna",
    provider: "OpenAI",
    name: "GPT-5.6 Luna",
    tier: "economy",
    inputPerMTokUsd: 0.2,
    cachedInputPerMTokUsd: 0.02,
    outputPerMTokUsd: 1.2,
    note: {
      ko: "가장 저렴한 상시 처리용 모델. 컨텍스트 270K 토큰 이하 표준가 기준",
      en: "The cheapest everyday-use model. Standard rate for prompts up to 270K tokens",
    },
    sourceUrl: "https://openai.com/api/pricing/",
    verifiedAt: "2026-08-28",
  },
  {
    id: "anthropic-claude-opus-5",
    provider: "Anthropic",
    name: "Claude Opus 5",
    tier: "flagship",
    inputPerMTokUsd: 5.0,
    cachedInputPerMTokUsd: 0.5,
    outputPerMTokUsd: 25.0,
    note: {
      ko: "Anthropic 플래그십 모델. 1M 토큰 컨텍스트까지 표준가 동일 적용",
      en: "Anthropic's flagship model. Standard rate applies uniformly up to the 1M-token context window",
    },
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-08-28",
  },
  {
    id: "anthropic-claude-sonnet-5",
    provider: "Anthropic",
    name: "Claude Sonnet 5",
    tier: "balanced",
    inputPerMTokUsd: 2.0,
    cachedInputPerMTokUsd: 0.2,
    outputPerMTokUsd: 10.0,
    note: {
      ko: "가장 널리 쓰이는 프로덕션 모델. $2/$10 요금은 2026-08-31 도입가로 시작해 정식 요금으로 확정됨(원래 예정이던 $3/$15 인상은 취소)",
      en: "The most widely used production model. The $2/$10 rate started as introductory pricing through 2026-08-31 and became the standard price (the previously planned increase to $3/$15 was cancelled)",
    },
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-08-28",
  },
  {
    id: "anthropic-claude-haiku-4.5",
    provider: "Anthropic",
    name: "Claude Haiku 4.5",
    tier: "economy",
    inputPerMTokUsd: 1.0,
    cachedInputPerMTokUsd: 0.1,
    outputPerMTokUsd: 5.0,
    note: {
      ko: "가장 저렴한 Anthropic 상시 처리용 모델",
      en: "Anthropic's cheapest everyday-use model",
    },
    sourceUrl: "https://platform.claude.com/docs/en/about-claude/pricing",
    verifiedAt: "2026-08-28",
  },
  {
    id: "google-gemini-3.1-pro-preview",
    provider: "Google",
    name: "Gemini 3.1 Pro Preview",
    tier: "flagship",
    inputPerMTokUsd: 2.0,
    cachedInputPerMTokUsd: 0.2,
    outputPerMTokUsd: 12.0,
    note: {
      ko: "Google 플래그십 모델. 프롬프트 200K 토큰 이하 표준가 기준(200K 초과 시 입력 $4.00/출력 $18.00로 인상)",
      en: "Google's flagship model. Standard rate for prompts up to 200K tokens (rises to $4.00 input / $18.00 output above 200K)",
    },
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    verifiedAt: "2026-08-28",
  },
  {
    id: "google-gemini-3.7-flash",
    provider: "Google",
    name: "Gemini 3.7 Flash",
    tier: "balanced",
    inputPerMTokUsd: 0.75,
    cachedInputPerMTokUsd: 0.075,
    outputPerMTokUsd: 3.75,
    note: {
      ko: "에이전트/멀티모달 작업용 균형형 모델. 이 요금은 2026-12-31까지이며 2027-01-01부터 입력 $1.50/출력 $7.50로 인상 예정(공지된 가격)",
      en: "Balanced model for agentic/multimodal work. This rate applies through 2026-12-31; a scheduled increase to $1.50 input / $7.50 output takes effect 2027-01-01",
    },
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    verifiedAt: "2026-08-28",
  },
  {
    id: "google-gemini-3.5-flash-lite",
    provider: "Google",
    name: "Gemini 3.5 Flash-Lite",
    tier: "economy",
    inputPerMTokUsd: 0.3,
    cachedInputPerMTokUsd: 0.03,
    outputPerMTokUsd: 2.5,
    note: {
      ko: "대량 처리·번역·단순 작업에 맞춘 가장 저렴한 Google 모델",
      en: "Google's cheapest model, optimized for high-volume, translation, and simple tasks",
    },
    sourceUrl: "https://ai.google.dev/gemini-api/docs/pricing",
    verifiedAt: "2026-08-28",
  },
];

// Shared caveats surfaced once in the UI rather than repeated per row.
window.LLM_GPU_CHECKER_DATA.apiPricingMeta = {
  basis: {
    ko: "각 제공사 공식 가격 페이지의 표준(비배치·비캐싱·기본 리전) 요금 기준. 프롬프트 캐싱, 배치 처리 할인, 장문 컨텍스트 할증, 리전별 가산은 반영하지 않은 참고용 추정치입니다.",
    en: "Based on each provider's official standard (non-batch, non-cached, default-region) per-token rate. Prompt caching, batch discounts, long-context surcharges, and regional multipliers are not reflected -- this is a reference estimate only.",
  },
  verifiedAt: "2026-08-28",
};
