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
    { id: "tr-7970x", name: "AMD Threadripper 7970X", cores: 32, score: 210, tdpW: 350, socket: "sTR5", priceKrw: 3650000 },
    { id: "trpro-7975wx", name: "AMD Threadripper Pro 7975WX", cores: 32, score: 225, tdpW: 350, socket: "sTR5", priceKrw: 5150000 },
    { id: "xeon-w7-2595x", name: "Intel Xeon W7-2595X", cores: 26, score: 195, tdpW: 250, socket: "LGA4677", priceKrw: 3950000 },
    { id: "epyc-9455", name: "AMD EPYC 9455", cores: 48, score: 340, tdpW: 300, socket: "SP5", priceKrw: 7800000 },
    { id: "epyc-9655", name: "AMD EPYC 9655", cores: 96, score: 620, tdpW: 400, socket: "SP5", priceKrw: 16800000 },
    { id: "xeon-6767p", name: "Intel Xeon 6767P", cores: 64, score: 430, tdpW: 350, socket: "LGA4710", priceKrw: 11200000 },
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
    { id: "plat1600", name: "1600W Platinum ATX 3.1", watts: 1600, atx: 3.1, connector: "12V-2x6 x2", priceKrw: 690000 },
    { id: "redundant-2400", name: "2400W Redundant Platinum", watts: 2400, redundant: true, priceKrw: 1800000 },
    { id: "redundant-3200", name: "3200W Redundant Titanium", watts: 3200, redundant: true, priceKrw: 2900000 },
  ],
  case: [
    { id: "compact-matx", name: "Compact mATX", form: "mATX", clearanceMm: 300, slots: 3, priceKrw: 69000 },
    { id: "airflow-atx", name: "Airflow ATX", form: "ATX", clearanceMm: 360, slots: 4, priceKrw: 119000 },
    { id: "large-atx", name: "Large ATX", form: "ATX", clearanceMm: 420, slots: 4, priceKrw: 189000 },
    { id: "workstation-eatx", name: "E-ATX AI Workstation", form: "E-ATX", clearanceMm: 480, slots: 7, priceKrw: 420000 },
    { id: "rack-4u-4gpu", name: "4U 4-GPU Rack Server", form: "4U", clearanceMm: 450, slots: 8, priceKrw: 6500000 },
    { id: "rack-8gpu", name: "HGX 8-GPU Server Chassis", form: "8U", clearanceMm: 500, slots: 16, priceKrw: 24000000 },
  ],
  memory: [
    { id: "ddr5-64", name: "DDR5 64GB", capacityGb: 64, ecc: false, priceKrw: 240000 },
    { id: "ddr5-128", name: "DDR5 128GB", capacityGb: 128, ecc: false, priceKrw: 520000 },
    { id: "ecc-256", name: "ECC RDIMM 256GB", capacityGb: 256, ecc: true, priceKrw: 1450000 },
    { id: "ecc-512", name: "ECC RDIMM 512GB", capacityGb: 512, ecc: true, priceKrw: 3100000 },
    { id: "ecc-1024", name: "ECC RDIMM 1TB", capacityGb: 1024, ecc: true, priceKrw: 6900000 },
    { id: "ecc-2048", name: "ECC RDIMM 2TB", capacityGb: 2048, ecc: true, priceKrw: 14500000 },
  ],
  storage: [
    { id: "nvme-2tb", name: "NVMe 2TB", capacityTb: 2, enterprise: false, priceKrw: 220000 },
    { id: "ent-nvme-3.84", name: "Enterprise NVMe 3.84TB", capacityTb: 3.84, enterprise: true, priceKrw: 920000 },
    { id: "ent-nvme-7.68", name: "Enterprise NVMe 7.68TB", capacityTb: 7.68, enterprise: true, priceKrw: 1780000 },
    { id: "ent-nvme-15.36", name: "Enterprise NVMe 15.36TB", capacityTb: 15.36, enterprise: true, priceKrw: 3950000 },
    { id: "archive-48tb", name: "RAID Archive 48TB", capacityTb: 48, enterprise: true, priceKrw: 6200000 },
  ],
  nic: [
    { id: "nic-10g", name: "10GbE NIC", speedGbps: 10, priceKrw: 180000 },
    { id: "nic-25g", name: "25GbE Dual-port NIC", speedGbps: 25, priceKrw: 590000 },
    { id: "nic-100g", name: "100GbE Dual-port NIC", speedGbps: 100, priceKrw: 1650000 },
    { id: "nic-200g", name: "200GbE / HDR NIC", speedGbps: 200, priceKrw: 3200000 },
    { id: "nic-400g", name: "400GbE / NDR NIC", speedGbps: 400, priceKrw: 5900000 },
  ],
  ups: [
    { id: "ups-1500", name: "Online UPS 1.5kVA", capacityVa: 1500, priceKrw: 850000 },
    { id: "ups-3000", name: "Online UPS 3kVA", capacityVa: 3000, priceKrw: 1850000 },
    { id: "ups-6000", name: "Rack UPS 6kVA", capacityVa: 6000, priceKrw: 5900000 },
    { id: "ups-10000", name: "3-phase UPS 10kVA", capacityVa: 10000, priceKrw: 14500000 },
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
