window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

// Cloud GPU rental reference pricing for the "API vs Local vs Cloud"
// comparison in features/api-cost-estimator.js. This is a THIRD kind of
// catalog, distinct from both data/gpus.js (hardware you own) and
// data/api-models.js (hosted per-token API pricing): renting a GPU by the
// hour from a cloud provider. One reference GPU per quality tier (matching
// the same tiers -- economy/balanced/flagship -- and reusing the same
// model+quant pick as LOCAL_TIER_CONFIG in api-cost-estimator.js, just
// with a cloud-rentable GPU instead of a consumer card bought outright),
// each with hourly USD rates from the three providers requested: RunPod,
// Vast.ai, and Lambda.
//
// `pricingKind` distinguishes two very different kinds of number:
// - "official": the provider's own published on-demand rate card (RunPod,
//   Lambda) -- a real, fixed, quotable price as of `updatedAt`.
// - "market-average": Vast.ai has no fixed price at all -- it's a
//   marketplace where individual hosts set their own rates, so this is a
//   representative/typical figure aggregated from public pricing trackers
//   on the date below, NOT an official quoted rate. Actual cost on Vast.ai
//   varies by host and can be meaningfully cheaper or pricier.
// A `null` hourlyUsd (Lambda in the economy tier) means that provider does
// not offer a comparable GPU at all -- Lambda's lineup is A100/H100/B200-
// class datacenter cards only, no consumer-tier GPUs like the RTX 4090.
window.LLM_GPU_CHECKER_DATA.cloudGpuPricing = [
  {
    tier: "economy",
    gpuId: "rtx4090-24",
    providers: [
      {
        provider: "RunPod",
        hourlyUsd: 0.74,
        pricingKind: "official",
        updatedAt: "2026-07-27",
        sourceUrl: "https://www.runpod.io/pricing",
        note: { ko: "Secure Cloud Pods, 온디맨드", en: "Secure Cloud Pods, on-demand" },
      },
      {
        provider: "Vast.ai",
        hourlyUsd: 0.35,
        pricingKind: "market-average",
        updatedAt: "2026-09-07",
        sourceUrl: "https://vast.ai/pricing/gpu/RTX-4090",
        note: { ko: "호스트별 입찰가 평균, 실제 가격은 다를 수 있음", en: "Average of host-set bids -- actual price varies by host" },
      },
      {
        provider: "Lambda",
        hourlyUsd: null,
        pricingKind: "unavailable",
        note: { ko: "Lambda는 소비자용 GPU를 제공하지 않음 (A100/H100/B200급만 취급)", en: "Lambda does not offer consumer-tier GPUs (A100/H100/B200-class only)" },
      },
    ],
  },
  {
    tier: "balanced",
    gpuId: "a100-pcie-80",
    providers: [
      {
        provider: "RunPod",
        hourlyUsd: 1.59,
        pricingKind: "official",
        updatedAt: "2026-07-27",
        sourceUrl: "https://www.runpod.io/pricing",
        note: { ko: "A100 PCIe/SXM 80GB, Secure Cloud Pods", en: "A100 PCIe/SXM 80GB, Secure Cloud Pods" },
      },
      {
        provider: "Vast.ai",
        hourlyUsd: 1.09,
        pricingKind: "market-average",
        updatedAt: "2026-09-07",
        sourceUrl: "https://vast.ai/pricing",
        note: { ko: "A100 80GB, 호스트별 입찰가 평균", en: "A100 80GB, average of host-set bids" },
      },
      {
        provider: "Lambda",
        hourlyUsd: 2.79,
        pricingKind: "official",
        updatedAt: "2026-09-07",
        sourceUrl: "https://lambda.ai/instances",
        note: { ko: "A100 SXM 80GB, 온디맨드", en: "A100 SXM 80GB, on-demand" },
      },
    ],
  },
  {
    tier: "flagship",
    gpuId: "h100-pcie-80",
    providers: [
      {
        provider: "RunPod",
        hourlyUsd: 2.89,
        pricingKind: "official",
        updatedAt: "2026-07-27",
        sourceUrl: "https://www.runpod.io/pricing",
        note: { ko: "H100 PCIe 80GB, Secure Cloud Pods", en: "H100 PCIe 80GB, Secure Cloud Pods" },
      },
      {
        provider: "Vast.ai",
        hourlyUsd: 1.89,
        pricingKind: "market-average",
        updatedAt: "2026-09-07",
        sourceUrl: "https://vast.ai/pricing",
        note: { ko: "H100 80GB, 호스트별 입찰가 평균", en: "H100 80GB, average of host-set bids" },
      },
      {
        provider: "Lambda",
        hourlyUsd: 3.99,
        pricingKind: "official",
        updatedAt: "2026-09-07",
        sourceUrl: "https://lambda.ai/instances",
        note: { ko: "H100 SXM 80GB, 온디맨드", en: "H100 SXM 80GB, on-demand" },
      },
    ],
  },
];

// Shared caveat surfaced once in the UI, mirroring apiPricingMeta's pattern
// in data/api-models.js.
window.LLM_GPU_CHECKER_DATA.cloudPricingMeta = {
  basis: {
    ko: "각 제공사 공식 요금 페이지의 온디맨드(정가) 기준. Vast.ai는 호스트가 개별적으로 가격을 매기는 마켓플레이스라 공식 정가가 없어 대표 평균값을 사용했습니다. 예약(장기 약정) 할인, 스팟/중단 가능 인스턴스 할인은 반영하지 않았습니다.",
    en: "Based on each provider's official on-demand (list) rate. Vast.ai has no official fixed price -- it's a marketplace where individual hosts set their own rates -- so a representative average is used instead. Reserved/long-term commitment discounts and spot/interruptible instance discounts are not reflected.",
  },
  verifiedAt: "2026-09-07",
};
