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

  window.AIHardwareDataTrust = { ageDays, priceCoverage, validateMarketRows };
})();
