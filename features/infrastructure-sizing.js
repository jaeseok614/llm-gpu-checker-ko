(() => {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));

  function sizeCandidate({ gpu, model, estimate, state, profile, market }) {
    const requiredGb = Math.max(1, Number(estimate?.requiredGb || 1));
    const vram = Math.max(1, Number(gpu.gpuUsableMemoryGb || gpu.vram || 1));
    const singleStreamSpeed = Math.max(8, Number(estimate?.speed || estimate?.throughput || 0), Number(gpu.bandwidth || 400) / requiredGb);
    const requestedRps = Math.max(Number(state.siQps || 0), Number(state.siConcurrency || 1) / Math.max(1, Number(state.siTargetSeconds || 8)));
    const batchSize = clamp(state.siMaxBatch || Math.ceil(Number(state.siConcurrency || 1) / 2), 1, 16);
    const batchEfficiency = Math.min(2.2, 1 + Math.log2(batchSize) * .32);
    const utilizationTarget = profile.id === "economy" ? .78 : profile.id === "recommended" ? .7 : .62;
    const growth = 1 + Number(state.siGrowthPct || 0) / 100;
    const tokenDemand = requestedRps * Math.max(1, Number(state.siOutputTokens || 500)) * growth;
    const safeGpuTokS = singleStreamSpeed * batchEfficiency * utilizationTarget;
    const memoryCount = Math.ceil(requiredGb * profile.memoryMargin / (vram * .92));
    const productionGpuCount = Math.max(1, memoryCount, Math.ceil(tokenDemand * profile.capacityMargin / safeGpuTokS));
    const gpuPerNode = vram >= 80 ? 8 : 4;
    const reserveGpuCount = state.siAvailability === "single"
      ? 0
      : state.siAvailability === "nplus1"
        ? 1
        : Math.max(1, Math.ceil(productionGpuCount / gpuPerNode));
    const nonProdGpuCount = state.siDevProd ? Math.max(1, Math.ceil(productionGpuCount * .15)) : 0;
    const gpuCount = productionGpuCount + reserveGpuCount + nonProdGpuCount;
    const nodes = Math.ceil(gpuCount / gpuPerNode);
    const gpuPerServer = Math.ceil(gpuCount / nodes);
    const capacityRps = productionGpuCount * safeGpuTokS / Math.max(1, Number(state.siOutputTokens || 500));
    const utilization = requestedRps / Math.max(.01, capacityRps);
    const queueState = utilization >= .9 ? "critical" : utilization >= .75 ? "watch" : "healthy";
    const failoverProduction = Math.max(0, productionGpuCount - Math.max(1, Math.ceil(productionGpuCount / Math.max(1, nodes))));
    const failoverRps = state.siAvailability === "single" ? 0 : (failoverProduction + reserveGpuCount) * safeGpuTokS / Math.max(1, Number(state.siOutputTokens || 500));
    const cpuCores = Math.max(24, Math.ceil(gpuCount * (profile.id === "economy" ? 8 : 12) / 8) * 8);
    const ramGb = Math.ceil(Math.max(256, requiredGb * productionGpuCount * 1.3, gpuCount * 96) / 64) * 64;
    const storageTb = Math.max(2, Math.ceil((requiredGb * 3 + Number(state.siVectorDataGb || 0) + Number(state.siLogGbDay || 0) * Number(state.siRetentionDays || 0)) / 1024));
    const network = nodes > 1 ? (gpuCount > 8 ? "400GbE / InfiniBand" : "200GbE") : (gpuCount > 2 ? "100GbE" : "25GbE");
    const powerW = Math.ceil(((Number(market.powerW || 350) * gpuCount) + cpuCores * 12 + nodes * 500) / 500) * 500;
    const gpuPriceUsd = Math.max(2500, Number(market.priceUsd || 0) || vram * 180);
    const purchaseKrw = Math.round((gpuPriceUsd * gpuCount + nodes * 18000 + storageTb * 600 + nodes * 3500) * 1400);
    const annualEnergyKrw = Math.round(powerW / 1000 * Math.min(8760, Number(state.siOperatingHours || 24) * 365) * Number(state.siElectricityKrw || 150));
    const threeYearTcoKrw = Math.round(purchaseKrw + annualEnergyKrw * 3 + purchaseKrw * Number(state.siMaintenancePct || 8) / 100 * 3);
    return {
      gpu, model, estimate, requiredGb, singleStreamSpeed, requestedRps, batchSize, batchEfficiency,
      utilizationTarget, tokenDemand, productionGpuCount, reserveGpuCount, nonProdGpuCount, gpuCount,
      gpuPerNode, gpuPerServer, nodes, capacityRps, utilization, queueState, failoverRps,
      cpuCores, cpuSockets: cpuCores > 96 ? 2 : 1, ramGb, storageTb, network, powerW,
      purchaseKrw, annualEnergyKrw, threeYearTcoKrw,
    };
  }

  function choosePlans(candidates, profiles) {
    const pool = candidates.filter((item) => Number.isFinite(item.purchaseKrw)).sort((a, b) => a.purchaseKrw - b.purchaseKrw);
    if (!pool.length) return [];
    const economy = pool[0];
    const recommended = pool
      .filter((item) => item.capacityRps >= economy.capacityRps * 1.1)
      .sort((a, b) => (a.purchaseKrw + a.powerW * 2000) - (b.purchaseKrw + b.powerW * 2000))[0] || pool[Math.min(1, pool.length - 1)];
    let scalable = pool
      .filter((item) => item.capacityRps >= recommended.capacityRps * 1.25 && item.purchaseKrw >= recommended.purchaseKrw)
      .sort((a, b) => b.capacityRps - a.capacityRps || a.purchaseKrw - b.purchaseKrw)[0]
      || pool.filter((item) => item.purchaseKrw >= recommended.purchaseKrw).sort((a, b) => b.capacityRps - a.capacityRps)[0]
      || recommended;
    if (scalable.gpu.id === recommended.gpu.id && scalable.gpuCount === recommended.gpuCount) {
      const nextProduction = Math.max(recommended.productionGpuCount + 1, Math.ceil(recommended.productionGpuCount * 1.35));
      const extraProduction = nextProduction - recommended.productionGpuCount;
      const nextGpuCount = recommended.gpuCount + extraProduction;
      const scale = nextGpuCount / recommended.gpuCount;
      scalable = {
        ...recommended,
        productionGpuCount: nextProduction,
        gpuCount: nextGpuCount,
        nodes: Math.ceil(nextGpuCount / recommended.gpuPerNode),
        gpuPerServer: Math.ceil(nextGpuCount / Math.ceil(nextGpuCount / recommended.gpuPerNode)),
        capacityRps: recommended.capacityRps * (nextProduction / recommended.productionGpuCount),
        failoverRps: recommended.failoverRps * (nextProduction / recommended.productionGpuCount),
        purchaseKrw: Math.round(recommended.purchaseKrw * scale),
        annualEnergyKrw: Math.round(recommended.annualEnergyKrw * scale),
        threeYearTcoKrw: Math.round(recommended.threeYearTcoKrw * scale),
        powerW: Math.ceil(recommended.powerW * scale / 500) * 500,
      };
    }
    return [economy, recommended, scalable].map((plan, index) => ({ ...plan, ...profiles[index] }));
  }

  window.AIHardwareInfraSizing = { sizeCandidate, choosePlans };
})();
