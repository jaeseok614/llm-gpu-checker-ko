(() => {
  function normalize(value) {
    return String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/[^a-z0-9가-힣]+/g, "");
  }

  function findDuplicate(query, items = []) {
    const key = normalize(query);
    if (!key) return null;
    return items.find((item) => {
      const names = [item.name, item.id, ...(item.aliases || [])].map(normalize);
      return names.includes(key);
    }) || null;
  }

  function issueUrl(kind, name = "") {
    const title = kind === "model" ? `[Model request] ${name}` : kind === "price" ? `[Price report] ${name}` : `[GPU request] ${name}`;
    const body = kind === "price"
      ? `GPU: ${name}\nPrice (KRW): \nCondition: new / used\nSource URL: \nChecked date: `
      : `Requested item: ${name}\nOfficial source URL: \nReason / use case: `;
    const params = new URLSearchParams({ title, body });
    return `https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?${params}`;
  }

  function coverage(gpus = [], marketRows = []) {
    const verified = new Set(marketRows.filter((row) => row.sourceUrl && row.updatedAt).map((row) => row.gpuId));
    return {
      total: gpus.filter((gpu) => gpu.id !== "custom").length,
      verified: verified.size,
      missing: gpus.filter((gpu) => gpu.id !== "custom" && !verified.has(gpu.id)),
    };
  }

  window.AIHardwareCatalogRequests = { normalize, findDuplicate, issueUrl, coverage };
})();
