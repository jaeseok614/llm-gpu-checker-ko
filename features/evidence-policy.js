(() => {
  const PRIORITY_GPU_IDS = [
    "rtx5090-32", "rtx4090-24", "rtx3090-24", "rtx3060-12", "rtx5070ti-16",
    "rtx4060ti-16", "rx9070xt-16", "rx7900xtx-24", "ryzen-ai-max-plus-395-128",
    "ryzen-ai-max-plus-395-64", "rtx6000ada-48", "rtxpro6000blackwell-96",
    "h200-141", "h100-sxm-80", "h100-pcie-80", "a100-sxm-80", "l40s-48",
    "arcb580-12", "arcpro-b60-24", "m4max-128",
  ];
  const FAMILY_PATTERNS = [
    /\/laptops\/(?:40|50)-series\/?$/i,
    /\/graphics-cards\/(?:geforce|radeon)[^/]*\/?$/i,
    /\/products\/graphics\/[^/]+\/?$/i,
  ];

  function sourceStatus(gpu) {
    const url = String(gpu?.sourceUrl || "");
    if (!url) return { id: "missing", level: 0, ko: "모델별 공식 출처 필요", en: "Model-specific source needed" };
    if (FAMILY_PATTERNS.some((pattern) => pattern.test(url))) {
      return { id: "family", level: 1, ko: "제품군 공식 출처", en: "Official family source" };
    }
    if (/nvidia\.com|amd\.com|intel\.com|apple\.com/i.test(url)) {
      return { id: "official", level: 3, ko: "모델별 공식 출처", en: "Official model source" };
    }
    return { id: "external", level: 2, ko: "외부 사양 출처", en: "External specification source" };
  }

  function audit(gpus = [], marketRows = []) {
    const rows = gpus.filter((gpu) => gpu.id !== "custom").map((gpu) => ({
      gpu,
      source: sourceStatus(gpu),
      priority: PRIORITY_GPU_IDS.indexOf(gpu.id),
      hasMarket: marketRows.some((row) => row.gpuId === gpu.id && row.sourceUrl && row.updatedAt),
    }));
    return {
      total: rows.length,
      official: rows.filter((row) => row.source.id === "official").length,
      external: rows.filter((row) => row.source.id === "external").length,
      family: rows.filter((row) => row.source.id === "family").length,
      missing: rows.filter((row) => row.source.id === "missing").length,
      market: rows.filter((row) => row.hasMarket).length,
      priority: rows
        .filter((row) => row.priority >= 0)
        .sort((a, b) => a.priority - b.priority),
    };
  }

  function issueUrl(gpu) {
    const params = new URLSearchParams({
      template: "gpu-request.yml",
      title: `[GPU source] ${gpu?.name || ""}`,
    });
    return `https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?${params}`;
  }

  window.AIHardwareEvidence = { PRIORITY_GPU_IDS, sourceStatus, audit, issueUrl };
})();
