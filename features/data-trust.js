(() => {
  const DAY_MS = 24 * 60 * 60 * 1000;

  function ageDays(dateValue, asOf = new Date()) {
    const timestamp = Date.parse(dateValue);
    if (!Number.isFinite(timestamp)) return null;
    return Math.max(0, Math.floor((asOf.getTime() - timestamp) / DAY_MS));
  }

  function priceCoverage(gpus = [], rows = [], asOf = new Date()) {
    const byGpu = new Map(rows.map((row) => [row.gpuId, row]));
    const result = { total: gpus.length, sourced: 0, fresh: 0, aging: 0, stale: 0, missing: 0 };
    gpus.forEach((gpu) => {
      const row = byGpu.get(gpu.id);
      const age = row ? ageDays(row.updatedAt, asOf) : null;
      if (!row?.sourceUrl || age === null) {
        result.missing += 1;
        return;
      }
      result.sourced += 1;
      if (age <= 30) result.fresh += 1;
      else if (age <= 90) result.aging += 1;
      else result.stale += 1;
    });
    result.coveragePct = result.total ? Math.round(result.sourced / result.total * 100) : 0;
    return result;
  }

  function validateMarketRows(rows = []) {
    const errors = [];
    const ids = new Set();
    rows.forEach((row, index) => {
      const label = row?.gpuId || `row ${index + 1}`;
      if (!row?.gpuId) errors.push(`${label}: gpuId is required`);
      else if (ids.has(row.gpuId)) errors.push(`${label}: duplicate gpuId`);
      else ids.add(row.gpuId);
      if (!Number.isFinite(Date.parse(row?.updatedAt))) errors.push(`${label}: invalid updatedAt`);
      if (!/^https:\/\//.test(row?.sourceUrl || "")) errors.push(`${label}: HTTPS sourceUrl is required`);
      for (const key of ["newKrw", "usedKrw", "lowestKrw"]) {
        if (!Number.isFinite(Number(row?.[key])) || Number(row[key]) <= 0) errors.push(`${label}: ${key} must be positive`);
      }
    });
    return errors;
  }

  function freshness(updatedAt, asOf = new Date()) {
    const days = ageDays(updatedAt, asOf);
    if (days === null) return { id: "missing", days: null, ko: "확인일 없음", en: "No review date" };
    if (days <= 30) return { id: "fresh", days, ko: `${days}일 전 확인`, en: `Checked ${days} days ago` };
    if (days <= 90) return { id: "aging", days, ko: `${days}일 전 확인 · 재확인 권장`, en: `Checked ${days} days ago · review recommended` };
    return { id: "stale", days, ko: `${days}일 경과 · 가격 재확인 필요`, en: `${days} days old · price recheck required` };
  }

  function scoreGpu(gpu = {}, marketRow = null) {
    const checks = [
      [25, Boolean(gpu.sourceUrl), "official source"],
      [15, Number(gpu.vram || gpu.gpuUsableMemoryGb) > 0, "memory"],
      [15, Number(gpu.bandwidth) > 0, "bandwidth"],
      [10, Number(gpu.tdp || gpu.tgpMaxW || gpu.powerW) > 0, "power"],
      [10, Boolean(gpu.architecture), "architecture"],
      [10, Array.isArray(gpu.runtimes) && gpu.runtimes.length > 0, "runtime"],
      [5, Boolean(gpu.verifiedAt), "review date"],
      [10, Boolean(marketRow?.sourceUrl && marketRow?.updatedAt), "market price"],
    ];
    const score = checks.reduce((sum, [weight, pass]) => sum + (pass ? weight : 0), 0);
    return { score, missing: checks.filter(([, pass]) => !pass).map(([, , label]) => label) };
  }

  function scoreModel(model = {}, benchmarkRows = []) {
    const checks = [
      [25, Boolean(model.sourceUrl || model.modelCardUrl), "model card"],
      [15, Number(model.params) > 0, "parameters"],
      [10, Boolean(model.license), "license"],
      [10, Number(model.context || model.contextLength || model.maxContext) > 0 || model.type !== "generative", "context"],
      [10, Boolean(model.releaseDate || model.updatedAt), "release date"],
      [10, Boolean(model.capabilities || model.tags?.length), "capabilities"],
      [10, Boolean(model.runtime || model.runtimes?.length || model.commandRuntime), "runtime"],
      [10, benchmarkRows.length > 0, "measurement"],
    ];
    const score = checks.reduce((sum, [weight, pass]) => sum + (pass ? weight : 0), 0);
    return { score, missing: checks.filter(([, pass]) => !pass).map(([, , label]) => label) };
  }

  function completenessLabel(score, language = "ko") {
    const level = score >= 85 ? "high" : score >= 65 ? "medium" : "low";
    const labels = {
      ko: { high: "높음", medium: "보통", low: "보강 필요" },
      en: { high: "High", medium: "Medium", low: "Needs work" },
    };
    return { level, text: labels[language === "en" ? "en" : "ko"][level] };
  }

  window.AIHardwareDataTrust = {
    ageDays,
    priceCoverage,
    validateMarketRows,
    freshness,
    scoreGpu,
    scoreModel,
    completenessLabel,
  };
})();
