const KOREAN_GPU_MARKET = [
  {
    gpuId: "rtx5090-32",
    newKrw: 6998000,
    usedKrw: 5249000,
    lowestKrw: 6998000,
    updatedAt: "2026-07-30",
    sourceName: "다나와 · ZOTAC SOLID OC",
    sourceUrl: "https://prod.danawa.com/info/?pcode=74996477",
    usedPriceMethod: "신품 최저가의 75% 계산 참고값",
  },
  {
    gpuId: "rtx5070ti-16",
    newKrw: 1084950,
    usedKrw: 813700,
    lowestKrw: 1084950,
    updatedAt: "2026-07-30",
    sourceName: "다나와 · RTX 5070 Ti 목록",
    sourceUrl: "https://prod.danawa.com/list/?cate=11455109",
    usedPriceMethod: "신품 최저가의 75% 계산 참고값",
  },
  {
    gpuId: "rx9070xt-16",
    newKrw: 990000,
    usedKrw: 742500,
    lowestKrw: 990000,
    updatedAt: "2026-07-30",
    sourceName: "다나와 · RX 9070 XT 목록",
    sourceUrl: "https://prod.danawa.com/list/?cate=11455184",
    usedPriceMethod: "신품 최저가의 75% 계산 참고값",
  },
];

const SYSTEM_PART_CATALOG = {
  cpu: [
    { id: "r5-7600", name: "AMD Ryzen 5 7600", cores: 6, score: 52, tdpW: 88, socket: "AM5", priceKrw: 245000 },
    { id: "r7-9700x", name: "AMD Ryzen 7 9700X", cores: 8, score: 76, tdpW: 105, socket: "AM5", priceKrw: 485000 },
    { id: "r9-9950x", name: "AMD Ryzen 9 9950X", cores: 16, score: 120, tdpW: 230, socket: "AM5", priceKrw: 890000 },
    { id: "i5-14600k", name: "Intel Core i5-14600K", cores: 14, score: 72, tdpW: 181, socket: "LGA1700", priceKrw: 395000 },
    { id: "u9-285k", name: "Intel Core Ultra 9 285K", cores: 24, score: 112, tdpW: 250, socket: "LGA1851", priceKrw: 790000 },
  ],
  motherboard: [
    { id: "b650-atx", name: "B650 ATX · AM5", socket: "AM5", form: "ATX", priceKrw: 220000 },
    { id: "x870-atx", name: "X870 ATX · AM5", socket: "AM5", form: "ATX", priceKrw: 390000 },
    { id: "z790-atx", name: "Z790 ATX · LGA1700", socket: "LGA1700", form: "ATX", priceKrw: 330000 },
    { id: "z890-atx", name: "Z890 ATX · LGA1851", socket: "LGA1851", form: "ATX", priceKrw: 410000 },
  ],
  psu: [
    { id: "gold750", name: "750W Gold ATX 3.1", watts: 750, atx: 3.1, connector: "12V-2x6", priceKrw: 145000 },
    { id: "gold850", name: "850W Gold ATX 3.1", watts: 850, atx: 3.1, connector: "12V-2x6", priceKrw: 175000 },
    { id: "gold1000", name: "1000W Gold ATX 3.1", watts: 1000, atx: 3.1, connector: "12V-2x6", priceKrw: 245000 },
    { id: "plat1200", name: "1200W Platinum ATX 3.1", watts: 1200, atx: 3.1, connector: "12V-2x6", priceKrw: 390000 },
  ],
  case: [
    { id: "compact-matx", name: "Compact mATX", form: "mATX", clearanceMm: 300, slots: 3, priceKrw: 69000 },
    { id: "airflow-atx", name: "Airflow ATX", form: "ATX", clearanceMm: 360, slots: 4, priceKrw: 119000 },
    { id: "large-atx", name: "Large ATX", form: "ATX", clearanceMm: 420, slots: 4, priceKrw: 189000 },
  ],
};

const GPU_PHYSICAL_REFERENCE = {
  "rtx5090-32": { lengthMm: 332, slots: 3.5, connector: "12V-2x6", recommendedPsuW: 1000 },
  "rtx5080-16": { lengthMm: 330, slots: 3.5, connector: "12V-2x6", recommendedPsuW: 850 },
  "rtx5070ti-16": { lengthMm: 332, slots: 3, connector: "12V-2x6", recommendedPsuW: 750 },
  "rtx4090-24": { lengthMm: 336, slots: 3.5, connector: "12VHPWR", recommendedPsuW: 1000 },
  "rx9070xt-16": { lengthMm: 320, slots: 3, connector: "8-pin x2", recommendedPsuW: 750 },
  "rx9070-16": { lengthMm: 320, slots: 3, connector: "8-pin x2", recommendedPsuW: 750 },
  "rx7900xtx-24": { lengthMm: 330, slots: 3, connector: "8-pin x3", recommendedPsuW: 850 },
  "arcb580-12": { lengthMm: 272, slots: 2.5, connector: "8-pin x2", recommendedPsuW: 650 },
};

window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};
window.LLM_GPU_CHECKER_DATA.koreanGpuMarket = KOREAN_GPU_MARKET;
window.LLM_GPU_CHECKER_DATA.systemPartCatalog = SYSTEM_PART_CATALOG;
window.LLM_GPU_CHECKER_DATA.gpuPhysicalReference = GPU_PHYSICAL_REFERENCE;
