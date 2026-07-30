/* AI Hardware Fit v3 decision studio.
 * Guided recommendations, Korean market snapshots, custom models, component
 * compatibility, runtime guidance, and community measurements.
 */
const DECISION_STUDIO_COPY = {
  ko: {
    title: "구매 결정 스튜디오",
    note: "가격·목표 작업·시스템 호환성과 실측 근거를 한 흐름에서 비교합니다.",
    consulting: "인프라 견적",
    recommend: "맞춤 추천",
    market: "국내 시세",
    custom: "직접 모델",
    parts: "부품 호환",
    runtime: "런타임",
    community: "실측 제보",
  },
  en: {
    title: "Purchase decision studio",
    note: "Compare price, workload goals, system compatibility, and measured evidence in one flow.",
    consulting: "Infra sizing",
    recommend: "Guided picks",
    market: "Korean market",
    custom: "Custom model",
    parts: "Parts fit",
    runtime: "Runtime",
    community: "Measurements",
  },
};

const RUNTIME_COMPATIBILITY = {
  NVIDIA: {
    windows: { level: "easy", tools: "CUDA · llama.cpp · Ollama · TensorRT-LLM", noteKo: "대부분의 로컬 실행 도구를 바로 사용할 수 있습니다.", noteEn: "Most local runtimes work with minimal setup." },
    linux: { level: "easy", tools: "CUDA · vLLM · TensorRT-LLM · Docker", noteKo: "vLLM 서버와 다중 GPU 구성이 가장 수월합니다.", noteEn: "Best-supported path for vLLM servers and multi-GPU." },
  },
  AMD: {
    windows: { level: "hard", tools: "Vulkan · DirectML · llama.cpp", noteKo: "실행은 가능하지만 모델·드라이버별 호환 확인이 필요합니다.", noteEn: "Runnable, but model and driver compatibility needs checking." },
    linux: { level: "medium", tools: "ROCm · llama.cpp · 일부 vLLM", noteKo: "ROCm 지원 GPU와 배포판 조합을 먼저 확인하세요.", noteEn: "Confirm the ROCm GPU and distribution support matrix first." },
  },
  Intel: {
    windows: { level: "medium", tools: "OpenVINO · oneAPI · DirectML", noteKo: "OpenVINO 경로가 가장 안정적입니다.", noteEn: "OpenVINO is usually the most dependable path." },
    linux: { level: "medium", tools: "OpenVINO · oneAPI · llama.cpp SYCL", noteKo: "SYCL 빌드와 드라이버 버전을 맞춰야 합니다.", noteEn: "Match the SYCL build with the installed driver." },
  },
  Apple: {
    windows: { level: "blocked", tools: "—", noteKo: "Apple Silicon은 macOS에서 사용합니다.", noteEn: "Apple Silicon workloads run on macOS." },
    linux: { level: "easy", tools: "MLX · Metal · llama.cpp", noteKo: "macOS에서 MLX 또는 Metal 백엔드를 권장합니다.", noteEn: "Use MLX or the Metal backend on macOS." },
  },
};

let studioState = {
  tab: "consulting",
  category: "llm",
  modelKey: "",
  targetSpeed: 30,
  budgetKrw: 2000000,
  condition: "either",
  formFactor: "desktop",
  powerLimitW: 450,
  noise: "normal",
  imageSize: 1024,
  videoFrames: 81,
  customName: "",
  customUrl: "",
  customTotalB: 8,
  customActiveB: 8,
  customLayers: 32,
  customBits: 4,
  customContext: 8192,
  customVision: false,
  cpuId: "r7-9700x",
  motherboardId: "b650-atx",
  gpuId: "rtx5070ti-16",
  psuId: "gold850",
  caseId: "airflow-atx",
  ramGb: 64,
  runtimeOs: "windows",
  siScenario: "internal-rag",
  siProjectName: "사내 문서 RAG 구축",
  siIndustry: "제조·일반기업",
  siContact: "",
  siPurpose: "사내 문서 검색·질의응답",
  siDeployment: "onprem",
  siSecurity: "restricted",
  siExportAllowed: false,
  siServiceType: "rag",
  siTotalUsers: 100,
  siConcurrency: 10,
  siQps: 1.25,
  siInputTokens: 4096,
  siMaxInputTokens: 16384,
  siOutputTokens: 500,
  siTtftP95: 2,
  siTargetSeconds: 8,
  siLatencyP95: 12,
  siOperatingHours: 24,
  siAvailability: "ha",
  siGrowthPct: 30,
  siVectorDataGb: 500,
  siLogGbDay: 10,
  siRetentionDays: 90,
  siDevProd: true,
  siPcieGen: "gen5",
  siNetworkFabric: "ethernet",
  siBackup: "daily",
  siMonitoring: "standard",
  siCooling: "air",
  siUpsMinutes: 15,
  siElectricityKrw: 150,
  siMaintenancePct: 10,
  siMeasuredTtft: 0,
  siMeasuredSpeed: 0,
  siMeasuredErrorRate: 0,
  siMeasuredHours: 0,
  siCompanyName: "AI Infra Partner",
  siCustomerName: "",
  siEstimateVersion: 1,
  siStreaming: true,
  siMaxBatch: 8,
  siMinReplicas: 1,
  siMaxReplicas: 8,
  siAutoscale: true,
  siItlP95: 0.08,
  siFacilityKrwMonth: 350000,
  siSupportPct: 8,
  siUtilizationPct: 50,
  siCloudHourlyUsd: 3.5,
  siReportMode: "customer",
  siBenchmarkRuntime: "vllm",
  siBenchmarkPrompts: "512,4096,8192",
  siBenchmarkOutputs: "128,512",
  siBenchmarkConcurrency: "1,4,8,16",
  siMeasuredItl: 0,
  siMeasuredLatencyP95: 0,
  siBenchmarkSamples: 0,
  siBenchmarkOutliers: 0,
  siInputMode: "simple",
  siQualityPreset: "balanced",
  siUserPreset: 100,
  siSelectedPlan: "recommended",
  siBomCpuId: "",
  siBomCpuQty: 1,
  siBomMemoryId: "",
  siBomMemoryQty: 1,
  siBomStorageId: "",
  siBomStorageQty: 1,
  siBomNicId: "",
  siBomNicQty: 1,
  siBomPsuId: "",
  siBomPsuQty: 1,
  siBomUpsId: "",
  siBomUpsQty: 1,
  siBomCaseId: "",
  siBomCaseQty: 1,
  siBomExtraKrw: 0,
};

function studioCopy(key) {
  return DECISION_STUDIO_COPY[uiLanguage === "en" ? "en" : "ko"][key] || key;
}

function studioMarket(gpuId) {
  const recorded = KOREAN_GPU_MARKET.find((item) => item.gpuId === gpuId);
  if (recorded) return { ...recorded, priceKind: "market", estimated: false };
  const gpu = GPU_PRESETS.find((item) => item.id === gpuId);
  if (!gpu) return null;
  const reference = gpuMarketReference(gpu);
  const newKrw = Math.round(reference.priceUsd * 1400 / 10000) * 10000;
  return {
    gpuId,
    newKrw,
    usedKrw: Math.round(newKrw * 0.68 / 10000) * 10000,
    lowestKrw: newKrw,
    updatedAt: gpu.verifiedAt || DATA_UPDATED_AT,
    sourceName: reference.priceKind === "launch-reference" ? "출시가·MSRP 환산 참고" : "VRAM·등급 기반 계산 참고",
    sourceUrl: gpu.sourceUrl || "",
    usedPriceMethod: "계산 신품 참고가의 68% 적용",
    priceKind: reference.priceKind,
    estimated: true,
  };
}

function studioMoney(value) {
  const amount = Math.round(Number(value) || 0).toLocaleString(uiLanguage === "en" ? "en-US" : "ko-KR");
  return uiLanguage === "en" ? `KRW ${amount}` : `${amount}원`;
}

function studioWorkloadModels() {
  return getAllModels().filter((model) => {
    const category = typeof getAdvisorModelCategory === "function" ? getAdvisorModelCategory(model) : (model.type || "llm");
    return studioState.category === "all" || category === studioState.category;
  });
}

function studioSelectedModel() {
  const models = studioWorkloadModels();
  return getModelByKey(studioState.modelKey) || currentPlatformModel?.() || models[0] || getAllModels()[0];
}

function studioGpuScore(gpu, model) {
  const rawEstimate = estimateAnyModelForHardware(model, buildHardwareForPreset(gpu));
  const mediaScale = studioState.category === "image"
    ? Math.pow(Math.max(512, studioState.imageSize) / 1024, 2)
    : ["video", "avatar-generation"].includes(studioState.category)
      ? Math.max(1, studioState.videoFrames) / 81
      : 1;
  const estimate = rawEstimate ? {
    ...rawEstimate,
    requiredGb: Number(rawEstimate.requiredGb || 0) * (["video", "avatar-generation"].includes(studioState.category) ? 0.75 + mediaScale * 0.25 : mediaScale),
  } : null;
  const market = studioMarket(gpu.id);
  const speed = Number(estimate?.speed || estimate?.throughput || 0) / Math.max(0.25, mediaScale);
  const memory = Number(gpu.gpuUsableMemoryGb || gpu.vram || 0);
  const power = gpuMarketReference(gpu).powerW;
  const price = studioState.condition === "used" ? market?.usedKrw : market?.newKrw;
  return {
    gpu,
    estimate,
    market,
    speed,
    memory,
    power,
    price: price || market?.lowestKrw || 0,
    fit: Boolean(estimate && estimate.requiredGb <= memory * 0.96),
  };
}

function studioRecommendationSet() {
  const model = studioSelectedModel();
  let rows = GPU_PRESETS
    .filter((gpu) => gpu.id !== "custom")
    .map((gpu) => studioGpuScore(gpu, model))
    .filter((row) => row.fit && row.price <= studioState.budgetKrw)
    .filter((row) => !studioState.targetSpeed || row.speed >= studioState.targetSpeed)
    .filter((row) => studioState.formFactor === "all" || row.gpu.formFactor === studioState.formFactor)
    .filter((row) => !studioState.powerLimitW || row.power <= studioState.powerLimitW)
    .filter((row) => studioState.noise !== "quiet" || row.power <= 320);
  const byValue = [...rows].sort((a, b) => (b.speed / b.price) - (a.speed / a.price));
  const cheapest = [...rows].sort((a, b) => a.price - b.price || b.speed - a.speed)[0];
  const balanced = byValue.find((row) => row.gpu.id !== cheapest?.gpu.id) || byValue[0];
  const fastestRows = [...rows].sort((a, b) => b.speed - a.speed);
  const fastest = fastestRows.find((row) => ![cheapest?.gpu.id, balanced?.gpu.id].includes(row.gpu.id)) || fastestRows[0];
  return { model, rows, picks: [cheapest, balanced, fastest] };
}

function studioReason(row, kind) {
  const en = uiLanguage === "en";
  if (!row) return en ? "No GPU matches every selected condition." : "선택한 조건을 모두 만족하는 GPU가 없습니다.";
  const headroom = row.memory - Number(row.estimate?.requiredGb || 0);
  const labels = en
    ? ["It is the lowest-priced compatible option", "It has the strongest speed-to-price balance", "It is the fastest compatible option"]
    : ["실행 가능한 후보 중 구매 가격이 가장 낮고", "속도 대비 가격의 균형이 가장 좋고", "조건을 만족하는 후보 중 예상 속도가 가장 빠르고"];
  return en
    ? `${labels[kind]}, with ${Math.max(0, headroom).toFixed(1)} GB of estimated VRAM headroom.`
    : `${labels[kind]} 예상 VRAM 여유가 ${Math.max(0, headroom).toFixed(1)}GB라 추천합니다.`;
}

function renderStudioRecommend() {
  const models = studioWorkloadModels();
  const { model, picks } = studioRecommendationSet();
  const en = uiLanguage === "en";
  const currentGpu = currentPlatformGpu?.();
  const currentRow = currentGpu ? studioGpuScore(currentGpu, model) : null;
  const pickTitles = en ? ["Lowest cost", "Balanced", "Highest performance"] : ["최저 비용 추천", "균형 추천", "최고 성능 추천"];
  return `
    <div class="studio-question-grid">
      <label><span>${en ? "Workload" : "모델 종류"}</span><select id="studioCategory">
        ${[
          ["all", en ? "All" : "전체"], ["llm", "LLM"], ["vlm", "VLM"],
          ["image", en ? "Image generation" : "이미지 생성"], ["video", en ? "Video generation" : "비디오 생성"],
          ["embedding", en ? "Embedding" : "임베딩"], ["reranker", en ? "Reranker" : "리랭커"],
          ["ocr", "OCR"], ["avatar-generation", en ? "Avatar / lip sync" : "아바타·립싱크"], ["stt", "STT"], ["tts", "TTS"],
        ].map(([id, label]) => `<option value="${id}" ${studioState.category === id ? "selected" : ""}>${label}</option>`).join("")}
      </select></label>
      <label class="studio-wide"><span>${en ? "Model to run" : "실행할 모델"}</span><select id="studioModel">${models.map((item) => `<option value="${platformEscape(modelKey(item))}" ${modelKey(item) === modelKey(model) ? "selected" : ""}>${platformEscape(item.name)}</option>`).join("")}</select></label>
      <label><span>${en ? "Target speed" : "목표 속도"}</span><input id="studioTargetSpeed" type="number" min="0" value="${studioState.targetSpeed}"></label>
      <label><span>${en ? "Maximum budget (KRW)" : "최대 예산 (원)"}</span><input id="studioBudget" type="number" min="0" step="10000" value="${studioState.budgetKrw}"></label>
      <label><span>${en ? "Purchase condition" : "구매 조건"}</span><select id="studioCondition"><option value="either" ${studioState.condition === "either" ? "selected" : ""}>${en ? "New or used" : "신품·중고 모두"}</option><option value="new" ${studioState.condition === "new" ? "selected" : ""}>${en ? "New" : "신품"}</option><option value="used" ${studioState.condition === "used" ? "selected" : ""}>${en ? "Used reference" : "중고 참고가"}</option></select></label>
      <label><span>${en ? "System" : "형태"}</span><select id="studioFormFactor"><option value="all" ${studioState.formFactor === "all" ? "selected" : ""}>${en ? "All" : "전체"}</option><option value="desktop" ${studioState.formFactor === "desktop" ? "selected" : ""}>${en ? "Desktop" : "데스크톱"}</option><option value="laptop" ${studioState.formFactor === "laptop" ? "selected" : ""}>${en ? "Laptop" : "노트북"}</option></select></label>
      <label><span>${en ? "Power limit (W)" : "전력 제한 (W)"}</span><input id="studioPower" type="number" min="0" value="${studioState.powerLimitW}"></label>
      <label><span>${en ? "Noise preference" : "소음 선호"}</span><select id="studioNoise"><option value="normal" ${studioState.noise === "normal" ? "selected" : ""}>${en ? "Normal" : "일반"}</option><option value="quiet" ${studioState.noise === "quiet" ? "selected" : ""}>${en ? "Quiet / lower power" : "저소음·저전력"}</option></select></label>
      ${studioState.category === "image" ? `<label><span>${en ? "Image size" : "이미지 해상도"}</span><select id="studioImageSize">${[768, 1024, 1536].map((size) => `<option value="${size}" ${studioState.imageSize === size ? "selected" : ""}>${size}px</option>`).join("")}</select></label>` : ""}
      ${["video", "avatar-generation"].includes(studioState.category) ? `<label><span>${en ? "Video frames" : "비디오 프레임"}</span><input id="studioVideoFrames" type="number" min="1" max="241" value="${studioState.videoFrames}"></label>` : ""}
    </div>
    <div class="studio-pick-grid">
      ${picks.map((row, index) => `<article class="studio-pick-card ${index === 1 ? "is-featured" : ""}">
        <span>${pickTitles[index]}</span>
        <h3>${row ? platformEscape(shortGpuName(row.gpu.name)) : "—"}</h3>
        <p>${studioReason(row, index)}</p>
        ${row ? `<dl>
          <div><dt>${en ? "Price" : "참고 가격"}</dt><dd>${studioMoney(row.price)}</dd></div>
          <div><dt>${en ? "Estimated speed" : "예상 속도"}</dt><dd>${platformEscape(formatThroughput(row.speed, row.estimate?.unitLabel || "tok/s"))}</dd></div>
          <div><dt>VRAM</dt><dd>${formatGb(row.memory)} · ${row.estimate.grade}</dd></div>
          <div><dt>${en ? "Power" : "소비전력"}</dt><dd>${row.power}W</dd></div>
          <div><dt>${en ? "Setup" : "실행 난이도"}</dt><dd>${row.gpu.vendor === "NVIDIA" ? (en ? "Easy" : "쉬움") : (en ? "Check runtime" : "런타임 확인")}</dd></div>
          <div><dt>${en ? "vs current GPU" : "현재 GPU 대비"}</dt><dd>${currentRow?.speed ? `${(row.speed / currentRow.speed).toFixed(2)}×` : "—"}</dd></div>
        </dl><button type="button" class="ghost-button" data-studio-gpu="${row.gpu.id}">${en ? "Use this GPU" : "이 GPU 선택"}</button>` : ""}
      </article>`).join("")}
    </div>`;
}

function renderStudioMarket() {
  const en = uiLanguage === "en";
  const today = new Date("2026-07-30T00:00:00Z");
  const rows = GPU_PRESETS.filter((gpu) => gpu.id !== "custom").map((gpu) => {
    const market = studioMarket(gpu.id);
    const ageDays = Math.floor((today - new Date(`${market.updatedAt}T00:00:00Z`)) / 86400000);
    const stale = ageDays > 30;
    const model = studioSelectedModel();
    const score = studioGpuScore(gpu, model);
    return { market, gpu, stale, score };
  });
  const valueOrder = [...rows].sort((a, b) => (b.score.speed / b.market.lowestKrw) - (a.score.speed / a.market.lowestKrw));
  const vramOrder = [...rows].sort((a, b) => ((b.gpu.vram || 0) / b.market.lowestKrw) - ((a.gpu.vram || 0) / a.market.lowestKrw));
  return `
    <div class="studio-market-summary">
      <p>${en ? "KRW snapshots are source-linked. Used prices are calculation references, not live listings." : "원화 시세는 출처가 연결된 스냅샷입니다. 중고가는 실시간 매물이 아닌 계산 참고값입니다."}</p>
      <span>${en ? "Price model" : "가격 기준 모델"}: ${platformEscape(studioSelectedModel().name)}</span>
    </div>
    <div class="studio-table-wrap"><table class="studio-table"><thead><tr>
      <th>GPU</th><th>${en ? "New / lowest" : "신품 / 최저가"}</th><th>${en ? "Used reference" : "중고 참고가"}</th>
      <th>${en ? "Updated" : "갱신일"}</th><th>${en ? "Value rank" : "성능/가격"}</th><th>${en ? "VRAM rank" : "VRAM/가격"}</th><th>${en ? "Source" : "출처"}</th>
    </tr></thead><tbody>${rows.map(({ market, gpu, stale, score }) => `<tr>
      <td><strong>${platformEscape(shortGpuName(gpu.name))}</strong></td>
      <td>${studioMoney(market.newKrw)}<small>${studioMoney(market.lowestKrw)}</small></td>
      <td>${studioMoney(market.usedKrw)}<small>${platformEscape(market.usedPriceMethod)}</small></td>
      <td>${market.updatedAt}${stale ? `<span class="studio-stale">${en ? "Stale" : "오래됨"}</span>` : `<span class="studio-fresh">${en ? "Current" : "최신"}</span>`}</td>
      <td>#${valueOrder.findIndex((row) => row.market.gpuId === market.gpuId) + 1}<small>${score.speed ? `${(score.speed / market.lowestKrw * 1000000).toFixed(1)} / ₩1M` : "—"}</small></td>
      <td>#${vramOrder.findIndex((row) => row.market.gpuId === market.gpuId) + 1}<small>${((gpu.vram || 0) / market.lowestKrw * 1000000).toFixed(1)} GB / ₩1M</small></td>
      <td>${market.sourceUrl ? `<a href="${platformEscape(market.sourceUrl)}" target="_blank" rel="noopener noreferrer">${platformEscape(market.sourceName)}</a>` : platformEscape(market.sourceName)}${market.estimated ? `<small>${en ? "Calculated reference · vendor quote required" : "계산 참고가 · 공급사 견적 필요"}</small>` : ""}</td>
    </tr>`).join("")}</tbody></table></div>`;
}

function calculateCustomModel() {
  const totalB = Math.max(0.01, Number(studioState.customTotalB) || 8);
  const activeB = Math.min(totalB, Math.max(0.01, Number(studioState.customActiveB) || totalB));
  const layers = Math.max(1, Number(studioState.customLayers) || 32);
  const bits = Math.max(2, Number(studioState.customBits) || 4);
  const context = Math.max(512, Number(studioState.customContext) || 8192);
  const weightsGb = totalB * (bits / 8) * 1.08;
  const kvGb = activeB * (context / 8192) * (layers / 32) * 0.085;
  const visionGb = studioState.customVision ? 1.8 : 0;
  const runtimeGb = 2.2 + weightsGb * 0.08;
  const requiredGb = weightsGb + kvGb + visionGb + runtimeGb;
  const candidates = GPU_PRESETS
    .filter((gpu) => gpu.id !== "custom" && (gpu.gpuUsableMemoryGb || gpu.vram) >= requiredGb)
    .sort((a, b) => (a.gpuUsableMemoryGb || a.vram) - (b.gpuUsableMemoryGb || b.vram))
    .slice(0, 6);
  return { totalB, activeB, layers, bits, context, weightsGb, kvGb, visionGb, runtimeGb, requiredGb, candidates };
}

function renderStudioCustom() {
  const en = uiLanguage === "en";
  const result = calculateCustomModel();
  const issueBody = encodeURIComponent([
    `Model: ${studioState.customName || "Custom model"}`,
    `Source: ${studioState.customUrl || "Not provided"}`,
    `Total params: ${result.totalB}B`,
    `Active params: ${result.activeB}B`,
    `Layers: ${result.layers}`,
    `Precision: ${result.bits}-bit`,
    `Context: ${result.context}`,
    `Vision: ${studioState.customVision}`,
    `Estimated VRAM: ${result.requiredGb.toFixed(2)} GB`,
  ].join("\n"));
  return `
    <div class="studio-question-grid">
      <label><span>${en ? "Model name" : "모델명"}</span><input id="customName" value="${platformEscape(studioState.customName)}"></label>
      <label class="studio-wide"><span>Hugging Face URL</span><input id="customUrl" type="url" value="${platformEscape(studioState.customUrl)}" placeholder="https://huggingface.co/organization/model"></label>
      <label><span>${en ? "Total parameters (B)" : "총 파라미터 (B)"}</span><input id="customTotalB" type="number" min="0.01" step="0.1" value="${result.totalB}"></label>
      <label><span>${en ? "Active parameters (B)" : "활성 파라미터 (B)"}</span><input id="customActiveB" type="number" min="0.01" step="0.1" value="${result.activeB}"></label>
      <label><span>${en ? "Transformer layers" : "레이어 수"}</span><input id="customLayers" type="number" min="1" value="${result.layers}"></label>
      <label><span>${en ? "Precision" : "정밀도"}</span><select id="customBits">${[2, 3, 4, 5, 6, 8, 16].map((bits) => `<option value="${bits}" ${result.bits === bits ? "selected" : ""}>${bits}-bit</option>`).join("")}</select></label>
      <label><span>${en ? "Context tokens" : "컨텍스트 토큰"}</span><input id="customContext" type="number" min="512" step="512" value="${result.context}"></label>
      <label class="studio-check"><input id="customVision" type="checkbox" ${studioState.customVision ? "checked" : ""}><span>${en ? "Vision / VLM modules" : "이미지·VLM 모듈 포함"}</span></label>
    </div>
    <div class="custom-model-result">
      <article><span>${en ? "Estimated VRAM" : "예상 VRAM"}</span><strong>${result.requiredGb.toFixed(1)} GB</strong><small>${en ? "Includes 8% weight overhead and runtime headroom" : "가중치 8% 오버헤드와 런타임 여유 포함"}</small></article>
      <dl>
        <div><dt>${en ? "Weights" : "가중치"}</dt><dd>${result.weightsGb.toFixed(1)} GB</dd></div>
        <div><dt>KV cache</dt><dd>${result.kvGb.toFixed(1)} GB</dd></div>
        <div><dt>${en ? "Vision" : "비전"}</dt><dd>${result.visionGb.toFixed(1)} GB</dd></div>
        <div><dt>${en ? "Runtime" : "런타임"}</dt><dd>${result.runtimeGb.toFixed(1)} GB</dd></div>
      </dl>
      <div class="custom-gpu-list">${result.candidates.length ? result.candidates.map((gpu) => `<span>${platformEscape(shortGpuName(gpu.name))}</span>`).join("") : `<span>${en ? "Multi-GPU or CPU offload required" : "멀티 GPU 또는 CPU 오프로딩 필요"}</span>`}</div>
      <a class="primary-button" href="https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?title=${encodeURIComponent(`[Model] ${studioState.customName || "Custom model"}`)}&body=${issueBody}" target="_blank" rel="noopener noreferrer">${en ? "Submit this model" : "이 계산을 모델 제보로 전환"}</a>
    </div>`;
}

function studioPart(id, type) {
  return SYSTEM_PART_CATALOG[type].find((item) => item.id === id) || SYSTEM_PART_CATALOG[type][0];
}

function renderStudioParts() {
  const en = uiLanguage === "en";
  const cpu = studioPart(studioState.cpuId, "cpu");
  const board = studioPart(studioState.motherboardId, "motherboard");
  const psu = studioPart(studioState.psuId, "psu");
  const pcCase = studioPart(studioState.caseId, "case");
  const gpu = GPU_PRESETS.find((item) => item.id === studioState.gpuId) || GPU_PRESETS.find((item) => item.id === "rtx5070ti-16");
  const physical = GPU_PHYSICAL_REFERENCE[gpu.id] || { lengthMm: 340, slots: 3, connector: "unknown", recommendedPsuW: gpuMarketReference(gpu).powerW + 400 };
  const socketFits = cpu.socket === board.socket;
  const caseFits = physical.lengthMm <= pcCase.clearanceMm && (board.form === "mATX" || pcCase.form === "ATX");
  const psuFits = psu.watts >= physical.recommendedPsuW;
  const model = studioSelectedModel();
  const estimate = estimateAnyModelForHardware(model, buildHardwareForPreset(gpu));
  const cpuBottleneck = Number(estimate?.requiredGb || 0) > (gpu.vram || 0) && cpu.score < 75;
  const gpuPrice = studioMarket(gpu.id)?.lowestKrw || 0;
  const total = cpu.priceKrw + board.priceKrw + psu.priceKrw + pcCase.priceKrw + gpuPrice + Math.max(32, studioState.ramGb) * 2300;
  const checks = [
    [socketFits, en ? "CPU socket matches the motherboard" : "CPU와 메인보드 소켓 호환", `${cpu.socket} / ${board.socket}`],
    [caseFits, en ? "GPU and motherboard fit the case" : "GPU 길이·메인보드 케이스 호환", `${physical.lengthMm} / ${pcCase.clearanceMm} mm · ${physical.slots} slot`],
    [psuFits, en ? "PSU capacity meets the recommendation" : "권장 파워 용량 충족", `${psu.watts} / ${physical.recommendedPsuW} W · ${physical.connector}`],
    [!cpuBottleneck, en ? "CPU has enough offload headroom" : "CPU 오프로딩·전처리 여유", cpuBottleneck ? (en ? "Upgrade CPU" : "CPU 업그레이드 권장") : (en ? "Adequate" : "충분")],
  ];
  return `
    <div class="studio-question-grid">
      ${[
        ["partsCpu", "cpu", studioState.cpuId, en ? "CPU" : "CPU"],
        ["partsBoard", "motherboard", studioState.motherboardId, en ? "Motherboard" : "메인보드"],
        ["partsPsu", "psu", studioState.psuId, en ? "PSU" : "파워"],
        ["partsCase", "case", studioState.caseId, en ? "Case" : "케이스"],
      ].map(([id, type, value, label]) => `<label><span>${label}</span><select id="${id}">${SYSTEM_PART_CATALOG[type].map((item) => `<option value="${item.id}" ${item.id === value ? "selected" : ""}>${platformEscape(item.name)} · ${studioMoney(item.priceKrw)}</option>`).join("")}</select></label>`).join("")}
      <label class="studio-wide"><span>GPU</span><select id="partsGpu">${Object.keys(GPU_PHYSICAL_REFERENCE).map((id) => {
        const item = GPU_PRESETS.find((gpuItem) => gpuItem.id === id);
        return item ? `<option value="${id}" ${id === gpu.id ? "selected" : ""}>${platformEscape(shortGpuName(item.name))}</option>` : "";
      }).join("")}</select></label>
      <label><span>RAM (GB)</span><input id="partsRam" type="number" min="16" step="16" value="${studioState.ramGb}"></label>
    </div>
    <div class="parts-result">
      <div class="parts-check-list">${checks.map(([ok, label, detail]) => `<article class="${ok ? "is-ok" : "is-warning"}"><strong>${ok ? "✓" : "!"} ${label}</strong><span>${detail}</span></article>`).join("")}</div>
      <div class="parts-total"><span>${en ? "Reference system total" : "참고 시스템 합계"}</span><strong>${studioMoney(total)}</strong><small>${gpuPrice ? (en ? "Includes the sourced GPU price" : "출처가 있는 GPU 가격 포함") : (en ? "GPU market price unavailable" : "GPU 시세 미포함")}</small></div>
      <button type="button" class="ghost-button" data-save-build>${en ? "Save build on this device" : "이 기기에 견적 저장"}</button>
      <button type="button" class="ghost-button" data-share-studio>${en ? "Copy share link" : "견적 공유 링크 복사"}</button>
    </div>`;
}

function renderStudioRuntime() {
  const en = uiLanguage === "en";
  const gpu = GPU_PRESETS.find((item) => item.id === studioState.gpuId) || currentPlatformGpu?.() || GPU_PRESETS[0];
  const vendor = gpu.vendor || "NVIDIA";
  const info = RUNTIME_COMPATIBILITY[vendor]?.[studioState.runtimeOs] || RUNTIME_COMPATIBILITY.NVIDIA.windows;
  const model = studioSelectedModel();
  const modelId = model.hfRepo || model.repo || model.name.toLowerCase().replace(/\s+/g, "-");
  const command = vendor === "Apple"
    ? `python -m mlx_lm.generate --model ${modelId} --prompt "Hello"`
    : vendor === "Intel"
      ? `optimum-cli export openvino --model ${modelId} openvino_model`
      : `llama-cli -hf ${modelId} -ngl 999 -c ${Number(studioState.customContext) || 8192}`;
  const levelLabel = {
    easy: en ? "Easy" : "쉬움",
    medium: en ? "Some setup" : "설정 필요",
    hard: en ? "Advanced" : "난이도 높음",
    blocked: en ? "Unsupported" : "지원 안 됨",
  };
  return `
    <div class="studio-question-grid">
      <label class="studio-wide"><span>GPU</span><select id="runtimeGpu">${GPU_PRESETS.filter((item) => item.id !== "custom").map((item) => `<option value="${item.id}" ${item.id === gpu.id ? "selected" : ""}>${platformEscape(shortGpuName(item.name))}</option>`).join("")}</select></label>
      <label><span>${en ? "Operating system" : "운영체제"}</span><select id="runtimeOs"><option value="windows" ${studioState.runtimeOs === "windows" ? "selected" : ""}>Windows</option><option value="linux" ${studioState.runtimeOs === "linux" ? "selected" : ""}>Linux / macOS</option></select></label>
    </div>
    <div class="runtime-compat-card level-${info.level}">
      <div><span>${vendor} · ${studioState.runtimeOs === "windows" ? "Windows" : "Linux / macOS"}</span><strong>${levelLabel[info.level]}</strong></div>
      <h3>${platformEscape(info.tools)}</h3><p>${platformEscape(en ? info.noteEn : info.noteKo)}</p>
      <pre><code>${platformEscape(command)}</code></pre>
      ${info.level === "hard" ? `<strong class="runtime-warning">${en ? "It may fit in VRAM but still require driver or source-build work." : "VRAM에는 들어가도 드라이버 설치나 소스 빌드가 필요할 수 있습니다."}</strong>` : ""}
    </div>`;
}

function communityRows() {
  try {
    const parsed = JSON.parse(localStorage.getItem("ai-hardware-fit-community-benchmarks") || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function renderStudioCommunity() {
  const en = uiLanguage === "en";
  const rows = communityRows();
  return `
    <form id="communityBenchmarkForm" class="studio-question-grid">
      <label><span>${en ? "Contributor" : "기여자 이름"}</span><input name="contributor" required maxlength="60"></label>
      <label><span>${en ? "Model" : "모델"}</span><input name="modelName" required maxlength="120"></label>
      <label><span>GPU</span><select name="gpuId">${GPU_PRESETS.filter((item) => item.id !== "custom").map((item) => `<option value="${item.id}">${platformEscape(shortGpuName(item.name))}</option>`).join("")}</select></label>
      <label><span>${en ? "Runtime" : "런타임"}</span><input name="runtime" required placeholder="llama.cpp / vLLM"></label>
      <label><span>${en ? "Precision" : "정밀도"}</span><input name="precision" required placeholder="Q4_K_M / FP16"></label>
      <label><span>${en ? "Context" : "컨텍스트"}</span><input name="context" type="number" min="1" value="8192"></label>
      <label><span>${en ? "Measured speed" : "실측 속도"}</span><input name="speed" type="number" min="0.001" step="0.001" required></label>
      <label><span>${en ? "Driver / environment" : "드라이버·환경"}</span><input name="environment" required maxlength="160"></label>
      <label class="studio-wide"><span>${en ? "Evidence URL" : "근거 URL"}</span><input name="sourceUrl" type="url" required placeholder="https://..."></label>
      <button class="primary-button" type="submit">${en ? "Validate and save draft" : "검증하고 제보 초안 저장"}</button>
    </form>
    <p class="studio-form-note">${en ? "Drafts stay in this browser. Submit the generated issue to contribute it to the shared dataset." : "초안은 이 브라우저에 저장됩니다. 생성된 GitHub 이슈를 제출하면 공용 데이터 검토가 시작됩니다."}</p>
    <div class="community-row-list">${rows.length ? rows.map((row) => `<article class="${row.outlier ? "is-outlier" : ""}">
      <div><strong>${platformEscape(row.modelName)}</strong><span>${platformEscape(row.gpuName)}</span></div>
      <span>${platformEscape(row.runtime)} · ${platformEscape(row.precision)} · ${row.context}</span>
      <strong>${row.speed.toFixed(2)} tok/s</strong><span>${platformEscape(row.contributor)} · ${platformEscape(row.environment)}</span>
      ${row.outlier ? `<small>${en ? "Outlier: verify before merging" : "이상치 후보: 병합 전 재검증 필요"}</small>` : ""}
      <a href="${platformEscape(row.issueUrl)}" target="_blank" rel="noopener noreferrer">${en ? "Open contribution issue" : "제보 이슈 열기"}</a>
    </article>`).join("") : `<p class="hub-empty">${en ? "No local drafts yet." : "아직 이 브라우저에 저장된 제보 초안이 없습니다."}</p>`}</div>`;
}

const SI_SCENARIOS = {
  "ai-chatbot": {
    ko: "고객 상담 AI 챗봇", en: "Customer service chatbot", purpose: "고객 문의 응답·상담 자동화", purposeEn: "Customer Q&A and support automation",
    users: 100, concurrency: 12, input: 4096, output: 500, seconds: 6,
    availability: "ha", growth: 35, vector: 500, logs: 12, retention: 90, security: "standard", serviceType: "rag",
  },
  "internal-rag": {
    ko: "사내 문서 RAG", en: "Internal document RAG", purpose: "사내 문서 검색·질의응답", purposeEn: "Internal document search and Q&A",
    users: 100, concurrency: 10, input: 4096, output: 500, seconds: 8,
    availability: "ha", growth: 30, vector: 500, logs: 10, retention: 90, security: "restricted", serviceType: "rag",
  },
  "document-vlm": {
    ko: "문서 OCR·VLM", en: "Document OCR + VLM", purpose: "계약서·도면 OCR 및 시각 질의응답", purposeEn: "OCR and visual Q&A for contracts and drawings",
    users: 60, concurrency: 6, input: 8192, output: 350, seconds: 15,
    availability: "ha", growth: 25, vector: 1200, logs: 18, retention: 180, security: "restricted", serviceType: "ocr",
  },
  "private-assistant": {
    ko: "폐쇄망 AI 비서", en: "Air-gapped AI assistant", purpose: "폐쇄망 업무 지원·코드·요약", purposeEn: "Air-gapped work assistant for code and summarization",
    users: 250, concurrency: 20, input: 8192, output: 700, seconds: 10,
    availability: "nplus1", growth: 40, vector: 2000, logs: 30, retention: 365, security: "airgap", serviceType: "rag",
  },
  "image-studio": {
    ko: "AI 이미지 생성", en: "AI image generation", purpose: "마케팅·상품 이미지 생성 서비스", purposeEn: "Marketing and product image generation service",
    users: 50, concurrency: 5, input: 2048, output: 350, seconds: 20,
    availability: "ha", growth: 30, vector: 200, logs: 20, retention: 60, security: "standard", serviceType: "image",
  },
  "video-studio": {
    ko: "AI 영상 생성", en: "AI video generation", purpose: "홍보·교육용 AI 영상 생성", purposeEn: "AI video generation for marketing and training",
    users: 30, concurrency: 3, input: 2048, output: 500, seconds: 60,
    availability: "ha", growth: 30, vector: 300, logs: 40, retention: 60, security: "standard", serviceType: "video",
  },
  "voice-agent": {
    ko: "음성 상담 AI", en: "Voice AI agent", purpose: "STT·LLM·TTS 기반 실시간 음성 상담", purposeEn: "Real-time voice support with STT, LLM, and TTS",
    users: 100, concurrency: 15, input: 2048, output: 250, seconds: 3,
    availability: "ha", growth: 40, vector: 500, logs: 25, retention: 90, security: "restricted", serviceType: "voice",
  },
  "avatar-chat": {
    ko: "AI 아바타 채팅", en: "AI avatar chat", purpose: "STT·LLM·TTS·립싱크 실시간 아바타 대화", purposeEn: "Real-time avatar conversation with STT, LLM, TTS, and lip sync",
    users: 50, concurrency: 8, input: 2048, output: 250, seconds: 3,
    availability: "ha", growth: 40, vector: 500, logs: 35, retention: 90, security: "restricted", serviceType: "avatar",
  },
};

function siEnterpriseGpus() {
  const ids = ["rtx6000ada-48", "l40s-48", "h100-pcie-80", "rtxpro6000blackwell-96", "h200-141"];
  return ids.map((id) => GPU_PRESETS.find((gpu) => gpu.id === id)).filter(Boolean);
}

function siSelectedModel() {
  return getModelByKey(studioState.modelKey)
    || getAllModels().find((item) => item.name === "Qwen2.5 32B Instruct")
    || studioSelectedModel();
}

function siSizingPlan(gpu, model, profile) {
  const estimate = estimateAnyModelForHardware(model, buildHardwareForPreset(gpu));
  const requiredGb = Math.max(1, Number(estimate?.requiredGb || 1));
  const fallbackSpeed = Math.max(20, Number(gpu.bandwidth || 500) / requiredGb * 2);
  const speed = Math.max(fallbackSpeed, Number(estimate?.speed || estimate?.throughput || 0));
  const vram = Number(gpu.gpuUsableMemoryGb || gpu.vram || 1);
  const targetTokS = Math.max(1, studioState.siConcurrency * studioState.siOutputTokens / Math.max(1, studioState.siTargetSeconds));
  const growth = 1 + studioState.siGrowthPct / 100;
  const memoryCount = Math.ceil(requiredGb * profile.memoryMargin / (vram * 0.92));
  const throughputCount = Math.ceil(targetTokS * growth * profile.capacityMargin / speed);
  let gpuCount = Math.max(1, memoryCount, throughputCount);
  if (studioState.siAvailability === "ha") gpuCount = Math.max(2, gpuCount * 2);
  if (studioState.siAvailability === "nplus1") gpuCount += 1;
  if (studioState.siDevProd) gpuCount += Math.max(1, Math.ceil(gpuCount * 0.25));
  const gpuPerNode = vram >= 80 ? 8 : 4;
  const nodes = Math.ceil(gpuCount / gpuPerNode);
  const gpuPerServer = Math.ceil(gpuCount / nodes);
  const cpuCores = Math.max(24, gpuCount * (profile.id === "economy" ? 8 : 12));
  const cpuSockets = cpuCores > 96 ? 2 : 1;
  const ramGb = Math.ceil(Math.max(256, requiredGb * gpuCount * 1.5, gpuCount * 128) / 64) * 64;
  const storageTb = Math.max(2, Math.ceil((requiredGb * 3 + studioState.siVectorDataGb + studioState.siLogGbDay * studioState.siRetentionDays) / 1024));
  const network = nodes > 1 ? (gpuCount > 8 ? "400GbE / InfiniBand" : "200GbE / InfiniBand") : (gpuCount > 2 ? "100GbE" : "25GbE");
  const powerW = Math.ceil((gpuMarketReference(gpu).powerW * gpuCount + cpuCores * 18 + 700 * nodes) / 500) * 500;
  const sampleCount = BENCHMARKS.filter((row) => row.gpuId === gpu.id || row.gpu === gpu.name).length;
  const confidence = sampleCount >= 3 ? "높음" : sampleCount ? "중간" : "낮음";
  const normalCapacity = Math.max(1, Math.floor(speed * gpuCount / Math.max(1, studioState.siOutputTokens / studioState.siTargetSeconds)));
  const failedGpuCount = studioState.siAvailability === "single" ? Math.max(0, gpuCount - 1) : Math.max(1, gpuCount - gpuPerServer);
  const failoverCapacity = Math.max(0, Math.floor(speed * failedGpuCount / Math.max(1, studioState.siOutputTokens / studioState.siTargetSeconds)));
  const gpuPriceUsd = Math.max(2500, gpuMarketReference(gpu).priceUsd || (vram * 180));
  const purchaseKrw = Math.round((gpuPriceUsd * gpuCount + nodes * 18000 + storageTb * 600 + nodes * 3500) * 1400);
  const annualEnergyKrw = Math.round(powerW / 1000 * Math.min(8760, studioState.siOperatingHours * 365) * studioState.siElectricityKrw);
  const threeYearTcoKrw = Math.round(purchaseKrw + annualEnergyKrw * 3 + purchaseKrw * studioState.siMaintenancePct / 100 * 3);
  return {
    ...profile, gpu, estimate, requiredGb, speed, targetTokS, gpuCount, nodes, cpuCores, ramGb,
    gpuPerServer, cpuSockets, storageTb, network, powerW, sampleCount, confidence,
    capacity: normalCapacity, failoverCapacity, purchaseKrw, annualEnergyKrw, threeYearTcoKrw,
    placement: `${model.name} · ${profile.id === "economy" ? "tensor parallel" : "replica + tensor parallel"}`,
  };
}

function calculateSiSizing() {
  const model = siSelectedModel();
  const gpus = siEnterpriseGpus();
  const profiles = [
    { id: "economy", ko: "경제형", en: "Economy", memoryMargin: 1.1, capacityMargin: 1.0, gpuIndex: 0 },
    { id: "recommended", ko: "권장형", en: "Recommended", memoryMargin: 1.25, capacityMargin: 1.2, gpuIndex: 2 },
    { id: "scalable", ko: "확장형", en: "Scalable", memoryMargin: 1.4, capacityMargin: 1.45, gpuIndex: 4 },
  ];
  const plans = profiles.map((profile) => siSizingPlan(gpus[Math.min(profile.gpuIndex, gpus.length - 1)], model, profile));
  return { model, plans };
}

function applySimpleSizingPreset() {
  const models = getAllModels();
  const names = {
    economy: ["Qwen3 8B", "Qwen2.5 7B Instruct"],
    balanced: ["Qwen2.5 32B Instruct", "Qwen3 32B"],
    quality: ["Llama 3.3 70B Instruct", "Qwen2.5 72B Instruct"],
  };
  const selected = names[studioState.siQualityPreset].map((name) => models.find((model) => model.name === name)).find(Boolean);
  if (selected) studioState.modelKey = modelKey(selected);
  const users = Math.max(1, Number(studioState.siUserPreset) || 10);
  studioState.siTotalUsers = users;
  studioState.siConcurrency = Math.max(1, Math.ceil(users * (users <= 10 ? .2 : users <= 50 ? .12 : .1)));
  studioState.siQps = Math.max(.1, Number((studioState.siConcurrency / 8).toFixed(2)));
  studioState.siAvailability = users >= 50 ? "ha" : "single";
  studioState.siGrowthPct = users >= 100 ? 30 : 20;
  studioState.siDevProd = users >= 50;
}

function renderSelectedPlanDetail(model, plans) {
  const en = uiLanguage === "en";
  const plan = plans.find((item) => item.id === studioState.siSelectedPlan)
    || plans.find((item) => item.id === "recommended")
    || plans[0];
  if (!plan) return "";
  const market = studioMarket(plan.gpu.id);
  const unitKrw = Number(market?.lowestKrw || 0);
  const gpuSubtotal = unitKrw * plan.gpuCount;
  const baseInfra = Math.max(0, plan.purchaseKrw - gpuSubtotal);
  const parts = autoComponentRecommendation(plan);
  const label = en ? plan.en : plan.ko;
  const marketLabel = market?.estimated
    ? (en ? "Planning reference converted from MSRP/spec grade" : "출시가·사양 등급을 환산한 계획 참고가")
    : (en ? "Recorded Korean market reference" : "국내 시세 기록값");
  const sourceLinks = [
    market?.sourceUrl ? [en ? "GPU price/spec source" : "GPU 가격·사양 출처", market.sourceUrl] : null,
    model.sourceUrl ? [en ? "Model source" : "모델 출처", model.sourceUrl] : null,
    [en ? "AWS calculator" : "AWS 요금 계산기", "https://calculator.aws/"],
    [en ? "Azure calculator" : "Azure 요금 계산기", "https://azure.microsoft.com/pricing/calculator/"],
    [en ? "Google Cloud calculator" : "Google Cloud 요금 계산기", "https://cloud.google.com/products/calculator"],
  ].filter(Boolean);
  return `<section class="si-plan-detail" aria-live="polite">
    <div class="si-plan-detail-head"><div><span class="section-kicker">${en ? "SELECTED OPTION" : "선택한 구성안"}</span><h3>${label} · ${platformEscape(shortGpuName(plan.gpu.name))} × ${plan.gpuCount}</h3><p>${en ? "Click another option above to compare its sizing assumptions and cost evidence." : "위의 다른 구성안을 누르면 산정 조건과 비용 근거가 바로 바뀝니다."}</p></div><strong>${studioMoney(plan.threeYearTcoKrw)}<small>${en ? "3-year TCO estimate" : "3년 TCO 추정"}</small></strong></div>
    <div class="si-plan-detail-grid">
      <article><h4>${en ? "Why this option" : "이 구성안의 특징"}</h4><ul>
        <li>${plan.id === "economy" ? (en ? "Minimizes initial cost with a smaller safety margin." : "안전 여유를 줄여 초기 도입비를 우선합니다.") : plan.id === "scalable" ? (en ? "Keeps more capacity for traffic growth and expansion." : "트래픽 증가와 향후 증설을 위한 여유를 크게 확보합니다.") : (en ? "Balances availability, performance, and growth reserve." : "가용성·성능·성장 여유를 균형 있게 반영합니다.")}</li>
        <li>${en ? `${plan.nodes} server(s), ${plan.gpuPerServer} GPU/server, estimated capacity ${plan.capacity}.` : `${plan.nodes}대 서버, 서버당 GPU ${plan.gpuPerServer}개, 예상 동시 응답 ${plan.capacity}명입니다.`}</li>
        <li>${en ? `Failover capacity is ${plan.failoverCapacity}; PoC verification is required.` : `장애 시 잔여 처리량은 ${plan.failoverCapacity}이며 최종 확정 전 PoC가 필요합니다.`}</li>
      </ul></article>
      <article><h4>${en ? "Automatically selected infrastructure" : "자동 선택 인프라"}</h4><dl><div><dt>CPU</dt><dd>${parts.cpu} · ${plan.cpuCores}${en ? " cores+" : "코어+"}</dd></div><div><dt>RAM</dt><dd>${parts.memory}</dd></div><div><dt>${en ? "Storage" : "스토리지"}</dt><dd>${parts.storage}</dd></div><div><dt>${en ? "Network" : "네트워크"}</dt><dd>${parts.nic}</dd></div><div><dt>${en ? "Server / power" : "서버·전원"}</dt><dd>${parts.server} · ${parts.power}</dd></div></dl></article>
      <article><h4>${en ? "Cost basis" : "비용 산정 근거"}</h4><dl><div><dt>${en ? "GPU unit reference" : "GPU 1개 참고가"}</dt><dd>${unitKrw ? studioMoney(unitKrw) : (en ? "Quote required" : "견적 문의 필요")}</dd></div><div><dt>${en ? "GPU subtotal" : "GPU 소계"}</dt><dd>${studioMoney(gpuSubtotal)}</dd></div><div><dt>${en ? "Server/base infrastructure" : "서버·기반 인프라 가정"}</dt><dd>${studioMoney(baseInfra)}</dd></div><div><dt>${en ? "Annual energy" : "연 전력비"}</dt><dd>${studioMoney(plan.annualEnergyKrw)}</dd></div></dl><p>${marketLabel} · ${en ? "updated" : "기준일"} ${platformEscape(market?.updatedAt || DATA_UPDATED_AT)}</p></article>
    </div>
    <div class="si-source-links"><strong>${en ? "Verify prices and evidence" : "가격·근거 확인"}</strong>${sourceLinks.map(([name,url]) => `<a href="${platformEscape(url)}" target="_blank" rel="noopener noreferrer">${platformEscape(name)} ↗</a>`).join("")}</div>
    <p class="si-price-disclaimer">${en ? "These values are planning assumptions, not a vendor quote. Taxes, licenses, installation, support, exchange-rate changes, and volume discounts may change the final price." : "표시 금액은 벤더 확정 견적이 아닌 계획용 참고값입니다. 세금·라이선스·설치·지원·환율·수량 할인에 따라 최종 금액이 달라질 수 있습니다."}</p>
  </section>`;
}

function autoComponentRecommendation(plan) {
  const en = uiLanguage === "en";
  const cpu = plan.cpuCores <= 24 ? "Ryzen 9 / Core Ultra 9" : plan.cpuCores <= 64 ? "Threadripper Pro / Xeon W" : "AMD EPYC / Xeon Scalable";
  const server = plan.gpuCount <= 1 ? (en ? "AI workstation" : "AI 워크스테이션") : plan.gpuPerServer <= 4 ? (en ? "4U GPU server" : "4U GPU 서버") : (en ? "HGX 8-GPU server" : "HGX 8-GPU 서버");
  const memory = `${Math.max(64, plan.ramGb)}GB ${plan.gpuCount > 1 ? "ECC RDIMM" : "DDR5"}`;
  const storage = `Enterprise NVMe ${plan.storageTb}TB+`;
  const nic = plan.nodes > 1 ? plan.network : plan.gpuCount > 1 ? "25/100GbE" : "2.5/10GbE";
  const power = plan.powerW >= 3000 ? (en ? "Redundant PSU + three-phase power review" : "이중화 PSU + 3상 전원 검토") : `${Math.max(850, Math.ceil(plan.powerW / 100) * 100)}W ${en ? "power supply" : "급 전원"}`;
  return { cpu, server, memory, storage, nic, power };
}

const SI_BOM_TYPES = [
  ["cpu", "siBomCpuId", "siBomCpuQty", "CPU"],
  ["memory", "siBomMemoryId", "siBomMemoryQty", "RAM"],
  ["storage", "siBomStorageId", "siBomStorageQty", "Storage"],
  ["nic", "siBomNicId", "siBomNicQty", "Network"],
  ["psu", "siBomPsuId", "siBomPsuQty", "Power"],
  ["ups", "siBomUpsId", "siBomUpsQty", "UPS"],
  ["case", "siBomCaseId", "siBomCaseQty", "Server / case"],
];

function siBomAutoSelection(plan) {
  const perNodeCores = Math.ceil(plan.cpuCores / Math.max(1, plan.nodes));
  const perNodeRam = Math.ceil(plan.ramGb / Math.max(1, plan.nodes));
  const perNodePower = Math.ceil(plan.powerW / Math.max(1, plan.nodes));
  const cpu = SYSTEM_PART_CATALOG.cpu.find((item) => item.cores >= perNodeCores) || SYSTEM_PART_CATALOG.cpu.at(-1);
  const memory = SYSTEM_PART_CATALOG.memory.find((item) => item.capacityGb >= perNodeRam) || SYSTEM_PART_CATALOG.memory.at(-1);
  const storage = SYSTEM_PART_CATALOG.storage.find((item) => item.capacityTb >= plan.storageTb) || SYSTEM_PART_CATALOG.storage.at(-1);
  const targetNic = Number.parseInt(plan.network, 10) || 25;
  const nic = SYSTEM_PART_CATALOG.nic.find((item) => item.speedGbps >= targetNic) || SYSTEM_PART_CATALOG.nic.at(-1);
  const psu = SYSTEM_PART_CATALOG.psu.find((item) => item.watts >= perNodePower) || SYSTEM_PART_CATALOG.psu.at(-1);
  const ups = SYSTEM_PART_CATALOG.ups.find((item) => item.capacityVa >= perNodePower * 1.2) || SYSTEM_PART_CATALOG.ups.at(-1);
  const chassis = SYSTEM_PART_CATALOG.case.find((item) => plan.gpuPerServer <= 4 ? item.id === "rack-4u-4gpu" : item.id === "rack-8gpu") || SYSTEM_PART_CATALOG.case.at(-1);
  return {
    siBomCpuId: cpu.id, siBomCpuQty: Math.max(1, plan.nodes * plan.cpuSockets),
    siBomMemoryId: memory.id, siBomMemoryQty: Math.max(1, plan.nodes),
    siBomStorageId: storage.id, siBomStorageQty: Math.max(1, Math.ceil(plan.storageTb / storage.capacityTb)),
    siBomNicId: nic.id, siBomNicQty: Math.max(1, plan.nodes),
    siBomPsuId: psu.id, siBomPsuQty: Math.max(1, plan.nodes * Math.ceil(perNodePower / psu.watts)),
    siBomUpsId: ups.id, siBomUpsQty: Math.max(1, Math.ceil(plan.powerW * 1.2 / ups.capacityVa)),
    siBomCaseId: chassis.id, siBomCaseQty: Math.max(1, plan.nodes),
  };
}

function ensureSiBomSelection(plan) {
  if (!studioState.siBomCpuId) Object.assign(studioState, siBomAutoSelection(plan));
}

function siEditableBom(plan) {
  ensureSiBomSelection(plan);
  const rows = SI_BOM_TYPES.map(([type, idKey, qtyKey, label]) => {
    const item = SYSTEM_PART_CATALOG[type].find((part) => part.id === studioState[idKey]) || SYSTEM_PART_CATALOG[type][0];
    const quantity = Math.max(1, Math.round(Number(studioState[qtyKey]) || 1));
    return { type, idKey, qtyKey, label, item, quantity, subtotal: item.priceKrw * quantity };
  });
  const partsTotal = rows.reduce((sum, row) => sum + row.subtotal, 0);
  const gpuUnitKrw = Number(studioMarket(plan.gpu.id)?.lowestKrw || 0);
  const gpuTotal = gpuUnitKrw * plan.gpuCount;
  const extra = Math.max(0, Number(studioState.siBomExtraKrw) || 0);
  return { rows, partsTotal, gpuUnitKrw, gpuTotal, extra, total: partsTotal + gpuTotal + extra };
}

function renderEditableSiBom(plan) {
  const en = uiLanguage === "en";
  const bom = siEditableBom(plan);
  return `<section class="si-editable-bom">
    <div class="si-version-head"><div><span class="section-kicker">${en ? "EDITABLE BOM" : "편집용 부품 견적"}</span><h3>${en ? "Select components and quantities" : "CPU·RAM·전원 등을 직접 선택하세요"}</h3><p>${en ? "Reference prices are planning assumptions and can be adjusted with an extra-cost line." : "표시 가격은 계획용 참고값이며 설치·라이선스 등 추가 비용을 별도로 더할 수 있습니다."}</p></div><button type="button" class="ghost-button" data-si-bom-auto>${en ? "Reset to auto selection" : "자동 추천으로 초기화"}</button></div>
    <div class="si-bom-editor">${bom.rows.map((row) => `<label><span>${en ? row.label : ({ Storage: "스토리지", Network: "네트워크", Power: "파워", "Server / case": "서버·케이스" }[row.label] || row.label)}</span><select id="${row.idKey}">${SYSTEM_PART_CATALOG[row.type].map((item) => `<option value="${item.id}" ${item.id === row.item.id ? "selected" : ""}>${platformEscape(item.name)} · ${studioMoney(item.priceKrw)}</option>`).join("")}</select><span class="si-bom-qty"><input id="${row.qtyKey}" type="number" min="1" max="128" value="${row.quantity}" aria-label="${platformEscape(row.label)} ${en ? "quantity" : "수량"}"><b>× ${row.quantity} = ${studioMoney(row.subtotal)}</b></span></label>`).join("")}
      <label class="si-bom-extra"><span>${en ? "Installation · license · support" : "설치·라이선스·지원 추가 비용"}</span><input id="siBomExtraKrw" type="number" min="0" step="10000" value="${bom.extra}"><small>${en ? "Enter a negotiated or separately quoted amount." : "협의 금액이나 별도 견적 금액을 입력하세요."}</small></label>
    </div>
    <div class="si-bom-summary">
      <span>${en ? "Selected parts" : "선택 부품"}<strong>${studioMoney(bom.partsTotal)}</strong></span>
      <span>GPU ${plan.gpuCount} × ${bom.gpuUnitKrw ? studioMoney(bom.gpuUnitKrw) : (en ? "quote required" : "견적 필요")}<strong>${studioMoney(bom.gpuTotal)}</strong></span>
      <span>${en ? "Extra cost" : "추가 비용"}<strong>${studioMoney(bom.extra)}</strong></span>
      <span class="is-total">${en ? "Editable estimate total" : "편집 견적 합계"}<strong>${studioMoney(bom.total)}</strong></span>
    </div>
    <p class="studio-form-note">${en ? "Component prices are catalog references, not live vendor quotes. Confirm stock, tax, installation, and support before proposal submission." : "부품 가격은 실시간 판매가가 아닌 카탈로그 참고값입니다. 제안 전 재고·세금·설치·지원 비용을 확인하세요."}</p>
  </section>`;
}

function renderSimpleSizingWizard(model, plans) {
  const en = uiLanguage === "en";
  const recommended = plans.find((plan) => plan.id === "recommended") || plans[0];
  const parts = autoComponentRecommendation(recommended);
  const quality = [
    ["economy", en ? "Cost first" : "비용 우선", en ? "Smaller model and simpler server" : "가벼운 모델과 단순한 서버"],
    ["balanced", en ? "Balanced" : "균형 추천", en ? "Practical quality and response speed" : "품질과 응답 속도의 균형"],
    ["quality", en ? "Quality first" : "고품질", en ? "Larger model and more headroom" : "큰 모델과 넉넉한 확장 여유"],
  ];
  return `<section class="si-simple-wizard">
    <div class="si-wizard-head"><div><span class="section-kicker">${en ? "EASY ESTIMATE" : "간편 견적"}</span><h3>${en ? "Answer four simple questions" : "쉬운 질문 4개만 선택하세요"}</h3><p>${en ? "The model, GPU, CPU, RAM, storage, network, and power are selected automatically." : "모델·GPU·CPU·RAM·스토리지·네트워크·전원을 자동으로 골라드립니다."}</p></div><button type="button" class="ghost-button" data-si-input-mode="expert">${en ? "Open expert settings" : "전문가 설정 열기"}</button></div>
    <div class="si-wizard-step"><strong>1. ${en ? "What are you building?" : "무엇을 만드나요?"}</strong><div class="si-choice-grid">${Object.entries(SI_SCENARIOS).map(([id,row]) => `<button type="button" data-si-preset="${id}" class="${studioState.siScenario === id ? "is-active" : ""}">${en ? row.en : row.ko}</button>`).join("")}</div></div>
    <div class="si-wizard-step"><strong>2. ${en ? "What matters most?" : "무엇이 가장 중요한가요?"}</strong><div class="si-choice-grid">${quality.map(([id,title,note]) => `<button type="button" data-si-quality="${id}" class="${studioState.siQualityPreset === id ? "is-active" : ""}"><b>${title}</b><small>${note}</small></button>`).join("")}</div></div>
    <div class="si-wizard-step"><strong>3. ${en ? "How many people will use it?" : "몇 명이 사용하나요?"}</strong><div class="si-choice-grid si-user-choice-grid">${[10,50,100,300].map((value) => `<button type="button" data-si-users="${value}" class="${Number(studioState.siUserPreset) === value ? "is-active" : ""}">${value}${en ? " users" : "명"}</button>`).join("")}<label class="si-custom-users"><span>${en ? "Custom" : "직접 입력"}</span><span><input id="siCustomUsers" type="number" min="1" max="100000" step="1" value="${studioState.siUserPreset}" aria-label="${en ? "Custom number of users" : "사용자 수 직접 입력"}">${en ? "users" : "명"}</span></label></div></div>
    <div class="si-wizard-step"><strong>4. ${en ? "Where will it run?" : "어디에 구축하나요?"}</strong><div class="si-choice-grid">${[["onprem",en?"On-premises":"사내 서버"],["cloud",en?"Cloud":"클라우드"],["compare",en?"Compare both":"둘 다 비교"]].map(([id,label]) => `<button type="button" data-si-deployment="${id}" class="${studioState.siDeployment === id ? "is-active" : ""}">${label}</button>`).join("")}</div></div>
    <div class="si-auto-result"><div><span>${en ? "Automatically selected model" : "자동 선택 모델"}</span><strong>${platformEscape(model.name)}</strong><small>${en ? "You can change it in expert settings." : "전문가 설정에서 직접 바꿀 수 있습니다."}</small></div><div class="si-auto-parts"><span><b>GPU</b>${platformEscape(shortGpuName(recommended.gpu.name))} × ${recommended.gpuCount}</span><span><b>CPU</b>${parts.cpu}</span><span><b>RAM</b>${parts.memory}</span><span><b>Storage</b>${parts.storage}</span><span><b>Network</b>${parts.nic}</span><span><b>${en ? "Server / power" : "서버·전원"}</b>${en ? parts.server : parts.server} · ${parts.power}</span></div><p>${en ? "Why: the selected model memory, expected concurrency, failover, and growth reserve determine the parts automatically." : "선정 이유: 모델 메모리, 예상 동시 사용자, 장애 대비와 성장 여유를 기준으로 부품을 자동 선택했습니다."}</p></div>
  </section>`;
}

const SIZING_PROJECTS_KEY = "ai-infra-sizing-projects-v1";

function calculateRealtimeSla(plan) {
  const replicas = Math.max(1, plan.nodes, Number(studioState.siMinReplicas) || 1);
  const outputTokens = Math.max(1, Number(studioState.siOutputTokens) || 1);
  const perReplicaRps = Math.max(0.01, plan.speed / outputTokens);
  const capacityRps = perReplicaRps * replicas * Math.max(1, Number(studioState.siMaxBatch) || 1);
  const utilization = Math.max(0, Number(studioState.siQps) || 0) / capacityRps;
  const serviceSeconds = outputTokens / Math.max(1, plan.speed);
  const queueP95 = utilization >= 1
    ? serviceSeconds * (1 + (utilization - 1) * Math.max(1, studioState.siMaxBatch))
    : serviceSeconds * utilization / Math.max(0.05, 1 - utilization) * 0.35;
  const itlP95 = Math.max(0.005, 1 / Math.max(1, plan.speed) * 1.25);
  const ttftP95 = Math.max(0.15, Number(studioState.siTtftP95) || 0) + queueP95;
  const latencyP95 = ttftP95 + itlP95 * outputTokens;
  const requiredReplicas = Math.ceil((Number(studioState.siQps) || 0) * (1 + studioState.siGrowthPct / 100) / Math.max(0.01, perReplicaRps * Math.max(1, studioState.siMaxBatch) * 0.72));
  const stt = 0.42;
  const llm = ttftP95;
  const tts = 0.28;
  const lipsync = 0.18;
  const avatarFirstResponse = stt + llm + tts + lipsync;
  const avatarFps = Math.max(8, Math.min(60, 30 / Math.max(0.5, utilization)));
  return { replicas, capacityRps, utilization, queueP95, itlP95, ttftP95, latencyP95, requiredReplicas, stt, llm, tts, lipsync, avatarFirstResponse, avatarFps, realtime: avatarFps >= 24 && avatarFirstResponse <= studioState.siLatencyP95 };
}

function calculateTcoComparison(plan) {
  const utilization = Math.max(0.01, Math.min(1, studioState.siUtilizationPct / 100));
  const monthlyOnprem = plan.annualEnergyKrw / 12 + studioState.siFacilityKrwMonth + plan.purchaseKrw * (studioState.siMaintenancePct + studioState.siSupportPct) / 1200;
  const monthlyCloud = studioState.siCloudHourlyUsd * 1400 * plan.gpuCount * Math.min(730, studioState.siOperatingHours * 30) * utilization;
  const totals = (years, mode) => {
    if (mode === "onprem") return Math.round(plan.purchaseKrw + monthlyOnprem * 12 * years);
    if (mode === "cloud") return Math.round(monthlyCloud * 12 * years);
    return Math.round(plan.purchaseKrw * 0.6 + (monthlyOnprem * 0.6 + monthlyCloud * 0.4) * 12 * years);
  };
  const margin = monthlyCloud - monthlyOnprem;
  return { monthlyOnprem, monthlyCloud, breakEvenMonths: margin > 0 ? plan.purchaseKrw / margin : 0, onprem: [1, 3, 5].map((y) => totals(y, "onprem")), cloud: [1, 3, 5].map((y) => totals(y, "cloud")), hybrid: [1, 3, 5].map((y) => totals(y, "hybrid")) };
}

function sizingProjects() {
  try { return JSON.parse(localStorage.getItem(SIZING_PROJECTS_KEY) || "[]"); } catch { return []; }
}

function sizingSnapshot() {
  const { model, plans } = calculateSiSizing();
  return { schemaVersion: 1, savedAt: new Date().toISOString(), state: { ...studioState }, model: model.name, plans: plans.map((p) => ({ id: p.id, gpu: p.gpu.name, gpuCount: p.gpuCount, nodes: p.nodes, tco: p.threeYearTcoKrw })) };
}

function saveSizingProject(clone = false) {
  const projects = sizingProjects();
  const same = projects.filter((p) => p.projectName === studioState.siProjectName);
  const version = clone ? 1 : Math.max(0, ...same.map((p) => Number(p.version) || 0)) + 1;
  const snapshot = sizingSnapshot();
  const row = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, projectName: clone ? `${studioState.siProjectName} 복사본` : studioState.siProjectName, customerName: studioState.siCustomerName, version, ...snapshot };
  localStorage.setItem(SIZING_PROJECTS_KEY, JSON.stringify([row, ...projects].slice(0, 30)));
  studioState.siEstimateVersion = version;
  renderDecisionStudio();
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function benchmarkCommands(model, plan) {
  const repo = safeModelRepo(model);
  const prompt = studioState.siBenchmarkPrompts.split(",")[0].trim() || "512";
  const output = studioState.siBenchmarkOutputs.split(",")[0].trim() || "128";
  const concurrency = studioState.siBenchmarkConcurrency.split(",")[0].trim() || "1";
  return {
    vllm: `vllm bench serve --model ${repo} --input-len ${prompt} --output-len ${output} --max-concurrency ${concurrency}`,
    llamacpp: `llama-bench -m model.gguf -p ${prompt} -n ${output} -ngl 999`,
    ollama: `OLLAMA_NUM_PARALLEL=${concurrency} ollama run ${repo}`,
    nim: `genai-perf profile -m ${repo} --synthetic-input-tokens-mean ${prompt} --output-tokens-mean ${output} --concurrency ${concurrency}`,
  };
}

function renderV38V42Modules(model, plans) {
  const en = uiLanguage === "en";
  const recommended = plans.find((p) => p.id === "recommended") || plans[0];
  const sla = calculateRealtimeSla(recommended);
  const tco = calculateTcoComparison(recommended);
  const projects = sizingProjects();
  const commands = benchmarkCommands(model, recommended);
  const recent = projects.filter((p) => p.projectName === studioState.siProjectName).slice(0, 3);
  const changed = recent.length > 1 ? Object.keys(recent[0].state || {}).filter((key) => JSON.stringify(recent[0].state[key]) !== JSON.stringify(recent[1].state?.[key])).slice(0, 8) : [];
  const evidence = gpuEvidenceLabel(recommended.gpu, en);
  return `
    <section class="si-version-section"><div class="si-version-head"><div><span class="section-kicker">v3.8</span><h3>${en ? "Real-time service SLA" : "실시간 서비스 SLA"}</h3></div><strong class="${sla.utilization > .8 ? "is-risk" : "is-good"}">${(sla.utilization * 100).toFixed(1)}% ${en ? "load" : "부하"}</strong></div>
      <div class="studio-question-grid si-compact-grid"><label><span>${en ? "Max batch" : "최대 배치"}</span><input id="siMaxBatch" type="number" min="1" value="${studioState.siMaxBatch}"></label><label><span>${en ? "Min replicas" : "최소 복제본"}</span><input id="siMinReplicas" type="number" min="1" value="${studioState.siMinReplicas}"></label><label><span>${en ? "Max replicas" : "최대 복제본"}</span><input id="siMaxReplicas" type="number" min="1" value="${studioState.siMaxReplicas}"></label><label class="studio-check"><input id="siStreaming" type="checkbox" ${studioState.siStreaming ? "checked" : ""}><span>${en ? "Streaming response" : "스트리밍 응답"}</span></label><label class="studio-check"><input id="siAutoscale" type="checkbox" ${studioState.siAutoscale ? "checked" : ""}><span>${en ? "Autoscaling" : "자동 확장"}</span></label></div>
      <div class="si-metric-grid"><span>TTFT p95<strong>${sla.ttftP95.toFixed(2)}s</strong></span><span>ITL p95<strong>${(sla.itlP95 * 1000).toFixed(0)}ms</strong></span><span>${en ? "Queue p95" : "큐 대기 p95"}<strong>${sla.queueP95.toFixed(2)}s</strong></span><span>${en ? "Total p95" : "전체 p95"}<strong>${sla.latencyP95.toFixed(2)}s</strong></span><span>RPS<strong>${studioState.siQps} / ${sla.capacityRps.toFixed(2)}</strong></span><span>${en ? "Required replicas" : "필요 복제본"}<strong>${sla.requiredReplicas}</strong></span></div>
      <div class="si-avatar-latency"><span>STT ${sla.stt.toFixed(2)}s</span><b>→</b><span>LLM ${sla.llm.toFixed(2)}s</span><b>→</b><span>TTS ${sla.tts.toFixed(2)}s</span><b>→</b><span>${en ? "Lip-sync" : "립싱크"} ${sla.lipsync.toFixed(2)}s</span><strong>${en ? "First response" : "첫 응답"} ${sla.avatarFirstResponse.toFixed(2)}s · ${sla.avatarFps.toFixed(0)} FPS · ${sla.realtime ? (en ? "Real-time feasible" : "실시간 가능") : (en ? "Adjustment required" : "조정 필요")}</strong></div>
    </section>
    <section class="si-version-section"><div class="si-version-head"><div><span class="section-kicker">v3.9</span><h3>${en ? "Project and estimate history" : "프로젝트·견적 이력"}</h3></div><span>${en ? "Current version" : "현재 버전"} v${studioState.siEstimateVersion}</span></div>
      <div class="si-project-actions"><button type="button" class="primary-button" data-si-save>${en ? "Save new version" : "새 버전 저장"}</button><button type="button" class="ghost-button" data-si-clone>${en ? "Clone estimate" : "견적 복제"}</button><button type="button" class="ghost-button" data-si-json-export>JSON ${en ? "export" : "내보내기"}</button><button type="button" class="ghost-button" data-si-json-import>JSON ${en ? "import" : "가져오기"}</button><input id="siJsonFile" type="file" aria-label="${en ? "Import project JSON" : "프로젝트 JSON 가져오기"}" accept=".json,application/json" hidden></div>
      ${changed.length ? `<p class="si-change-summary">${en ? "Changes since prior version" : "직전 버전 대비 변경"}: ${changed.map(platformEscape).join(", ")}</p>` : ""}
      <div class="si-project-list">${projects.slice(0, 6).map((p) => `<button type="button" data-si-load="${p.id}"><strong>${platformEscape(p.projectName)}</strong><span>v${p.version} · ${new Date(p.savedAt).toLocaleDateString(en ? "en-US" : "ko-KR")}</span></button>`).join("") || `<p>${en ? "No saved local projects." : "브라우저에 저장된 프로젝트가 없습니다."}</p>`}</div>
    </section>
    <section class="si-version-section"><div class="si-version-head"><div><span class="section-kicker">v4.0</span><h3>${en ? "Proposal package" : "제안서 품질 완성"}</h3></div><div class="si-mode-switch"><button type="button" data-si-report="customer" class="${studioState.siReportMode === "customer" ? "is-active" : ""}">${en ? "Customer summary" : "고객 요약본"}</button><button type="button" data-si-report="technical" class="${studioState.siReportMode === "technical" ? "is-active" : ""}">${en ? "Technical review" : "기술 검토본"}</button></div></div>
      <div class="si-architecture" role="img" aria-label="${en ? "Generated infrastructure architecture" : "자동 생성 인프라 구성도"}"><span>${platformEscape(studioState.siCustomerName || (en ? "Users" : "사용자"))}</span><b>→</b><span>Load Balancer</span><b>→</b><span>${recommended.nodes}× Server<br>${recommended.gpuPerServer} GPU/node</span><b>→</b><span>Vector DB · NVMe</span><b>→</b><span>Monitoring · Backup</span></div>
      <p>${en ? "Selected" : "선정 근거"}: ${platformEscape(recommended.gpu.name)} · ${recommended.requiredGb.toFixed(1)}GB VRAM · ${recommended.capacity} ${en ? "concurrent responses" : "동시 응답"}. ${en ? "Alternatives are excluded when SLA headroom, failover, or five-year cost is weaker." : "SLA 여유·장애 대응·5년 비용이 더 불리한 대안은 제외합니다."}</p>
    </section>
    <section class="si-version-section"><div class="si-version-head"><div><span class="section-kicker">v4.1</span><h3>${en ? "Benchmark runner" : "실제 벤치마크 실행 도우미"}</h3></div><span>n=${studioState.siBenchmarkSamples} · ${en ? "outliers" : "이상치"} ${studioState.siBenchmarkOutliers}</span></div>
      <div class="studio-question-grid si-compact-grid"><label><span>${en ? "Runtime" : "런타임"}</span><select id="siBenchmarkRuntime">${Object.keys(commands).map((r) => `<option value="${r}" ${studioState.siBenchmarkRuntime === r ? "selected" : ""}>${r}</option>`).join("")}</select></label><label><span>${en ? "Prompt lengths" : "입력 길이"}</span><input id="siBenchmarkPrompts" value="${platformEscape(studioState.siBenchmarkPrompts)}"></label><label><span>${en ? "Output lengths" : "출력 길이"}</span><input id="siBenchmarkOutputs" value="${platformEscape(studioState.siBenchmarkOutputs)}"></label><label><span>${en ? "Concurrency sweep" : "동시성 단계"}</span><input id="siBenchmarkConcurrency" value="${platformEscape(studioState.siBenchmarkConcurrency)}"></label></div>
      <pre class="si-command"><code>${platformEscape(commands[studioState.siBenchmarkRuntime] || commands.vllm)}</code></pre><div class="si-project-actions"><button type="button" class="ghost-button" data-si-copy-command>${en ? "Copy command" : "명령 복사"}</button><button type="button" class="ghost-button" data-si-benchmark-plan>${en ? "Export test plan" : "테스트 계획 내보내기"}</button><button type="button" class="ghost-button" data-si-benchmark-import>${en ? "Import result JSON" : "결과 JSON 업로드"}</button><input id="siBenchmarkFile" type="file" aria-label="${en ? "Import benchmark result JSON" : "벤치마크 결과 JSON 가져오기"}" accept=".json,application/json" hidden></div>
      <p class="si-poc-verdict">${studioState.siBenchmarkSamples ? `${en ? "Calibration factor" : "보정계수"} ${(studioState.siMeasuredSpeed / Math.max(1, recommended.speed)).toFixed(2)} · ${studioState.siMeasuredTtft <= studioState.siTtftP95 && studioState.siMeasuredErrorRate <= 1 ? (en ? "PoC passed" : "PoC 합격") : (en ? "Adjustment required" : "조정 필요")}` : (en ? "Run performance and load tests separately, then upload the result JSON." : "성능 테스트와 부하 테스트를 분리 실행한 뒤 결과 JSON을 업로드하세요.")}</p>
    </section>
    <section class="si-version-section"><div class="si-version-head"><div><span class="section-kicker">v4.2</span><h3>${en ? "On-premises vs cloud" : "온프레미스·클라우드 비교"}</h3></div><span>${en ? "Break-even" : "손익분기"} ${tco.breakEvenMonths ? `${tco.breakEvenMonths.toFixed(1)} ${en ? "months" : "개월"}` : (en ? "not reached" : "미도달")}</span></div>
      <div class="studio-question-grid si-compact-grid"><label><span>${en ? "Utilization (%)" : "사용률 (%)"}</span><input id="siUtilizationPct" type="number" min="1" max="100" value="${studioState.siUtilizationPct}"></label><label><span>${en ? "Cloud GPU (USD/hour)" : "클라우드 GPU (USD/시간)"}</span><input id="siCloudHourlyUsd" type="number" min="0" step="0.1" value="${studioState.siCloudHourlyUsd}"></label><label><span>${en ? "Facility (KRW/month)" : "상면비 (원/월)"}</span><input id="siFacilityKrwMonth" type="number" min="0" value="${studioState.siFacilityKrwMonth}"></label><label><span>${en ? "Support (%)" : "지원 비용 (%)"}</span><input id="siSupportPct" type="number" min="0" value="${studioState.siSupportPct}"></label></div>
      <div class="studio-table-wrap"><table class="studio-table"><thead><tr><th>${en ? "Option" : "구성"}</th><th>1${en ? "y" : "년"}</th><th>3${en ? "y" : "년"}</th><th>5${en ? "y" : "년"}</th></tr></thead><tbody>${[["온프레미스", tco.onprem], ["클라우드", tco.cloud], ["혼합", tco.hybrid]].map(([name, values]) => `<tr><td>${en ? ({ 온프레미스: "On-premises", 클라우드: "Cloud", 혼합: "Hybrid" }[name]) : name}</td>${values.map((v) => `<td>${studioMoney(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
    </section>
    <section class="si-version-section si-evidence-panel"><div class="si-version-head"><div><span class="section-kicker">DATA CONFIDENCE</span><h3>${en ? "Evidence traceability" : "데이터 근거 추적"}</h3></div></div><div class="si-confidence-list"><span>${en ? "GPU specification" : "GPU 사양"}<strong>${platformEscape(evidence)}</strong><small>${recommended.gpu.sourceUrl ? (en ? "Source linked" : "출처 연결") : (en ? "Source contribution needed" : "출처 보강 필요")}</small></span><span>${en ? "Benchmark" : "벤치마크"}<strong>${recommended.sampleCount ? (en ? "External/community measured" : "외부·커뮤니티 실측") : (en ? "Calculated estimate" : "계산 추정")}</strong><small>n=${recommended.sampleCount}</small></span><span>${en ? "Estimated error" : "예상 오차"}<strong>±${recommended.sampleCount >= 3 ? 15 : recommended.sampleCount ? 25 : 40}%</strong><small>${en ? "Validate with PoC" : "PoC로 검증 필요"}</small></span><span>${en ? "Last verified" : "마지막 검증일"}<strong>${recommended.gpu.verifiedAt || DATA_UPDATED_AT}</strong><small>${en ? "Model and runtime changes require recheck" : "모델·런타임 변경 시 재검증"}</small></span></div></section>`;
}

function renderStudioConsulting() {
  const en = uiLanguage === "en";
  const { model, plans } = calculateSiSizing();
  const activeScenario = SI_SCENARIOS[studioState.siScenario] || SI_SCENARIOS["internal-rag"];
  const projectValue = en && studioState.siProjectName.startsWith(activeScenario.ko) ? activeScenario.en : studioState.siProjectName;
  const purposeValue = en && studioState.siPurpose === activeScenario.purpose ? activeScenario.purposeEn : studioState.siPurpose;
  const modelOptions = getAllModels().filter((item) => ["generative", "llm", "vlm", "ocr"].includes(item.type || "generative"));
  return `
    <div class="si-input-mode-switch"><button type="button" data-si-input-mode="simple" class="${studioState.siInputMode === "simple" ? "is-active" : ""}">${en ? "Easy estimate" : "간편 견적"}</button><button type="button" data-si-input-mode="expert" class="${studioState.siInputMode === "expert" ? "is-active" : ""}">${en ? "Expert estimate" : "전문가 견적"}</button></div>
    ${studioState.siInputMode === "simple" ? renderSimpleSizingWizard(model, plans) : ""}
    <div class="si-intro">
      <div><span class="section-kicker">v3.1 PRE-SALES</span><h3>${en ? "AI infrastructure sizing consultation" : "AI 인프라 사전 견적 상담"}</h3>
      <p>${en ? "Turn customer workload assumptions into three reviewable infrastructure options." : "고객 요구와 트래픽 가정을 검토 가능한 인프라 3안으로 변환합니다."}</p></div>
      <div class="si-presets">${Object.entries(SI_SCENARIOS).map(([id, row]) => `<button type="button" data-si-preset="${id}" class="${studioState.siScenario === id ? "is-active" : ""}">${en ? row.en : row.ko}</button>`).join("")}</div>
    </div>
    <details class="si-expert-form" ${studioState.siInputMode === "expert" ? "open" : ""}><summary>${en ? "Customer and workload details" : "고객·워크로드 상세 입력"}</summary><div class="studio-question-grid si-question-grid">
      <label><span>${en ? "Proposal company" : "제안 회사"}</span><input id="siCompanyName" value="${platformEscape(studioState.siCompanyName)}"></label>
      <label><span>${en ? "Customer" : "고객사"}</span><input id="siCustomerName" value="${platformEscape(studioState.siCustomerName)}"></label>
      <label class="studio-wide"><span>${en ? "Project name" : "프로젝트명"}</span><input id="siProjectName" value="${platformEscape(projectValue)}"></label>
      <label class="studio-wide"><span>${en ? "Business purpose" : "구축 목적"}</span><input id="siPurpose" value="${platformEscape(purposeValue)}"></label>
      <label><span>${en ? "Customer industry" : "고객 업종"}</span><input id="siIndustry" value="${platformEscape(studioState.siIndustry)}"></label>
      <label><span>${en ? "Consultant / owner" : "상담 담당자"}</span><input id="siContact" value="${platformEscape(studioState.siContact)}" placeholder="${en ? "Name or team" : "이름 또는 조직"}"></label>
      <label><span>${en ? "Service type" : "서비스 유형"}</span><select id="siServiceType"><option value="rag" ${studioState.siServiceType === "rag" ? "selected" : ""}>RAG / Chatbot</option><option value="ocr" ${studioState.siServiceType === "ocr" ? "selected" : ""}>OCR / VLM</option><option value="image" ${studioState.siServiceType === "image" ? "selected" : ""}>${en ? "Image generation" : "이미지 생성"}</option><option value="video" ${studioState.siServiceType === "video" ? "selected" : ""}>${en ? "Video generation" : "영상 생성"}</option><option value="voice" ${studioState.siServiceType === "voice" ? "selected" : ""}>${en ? "Voice AI (STT + LLM + TTS)" : "음성 AI (STT + LLM + TTS)"}</option><option value="avatar" ${studioState.siServiceType === "avatar" ? "selected" : ""}>${en ? "Avatar chat" : "AI 아바타 채팅"}</option></select></label>
      <label><span>${en ? "External data transfer" : "데이터 외부 반출"}</span><select id="siExportAllowed"><option value="false" ${!studioState.siExportAllowed ? "selected" : ""}>${en ? "Not allowed" : "불가"}</option><option value="true" ${studioState.siExportAllowed ? "selected" : ""}>${en ? "Allowed" : "허용"}</option></select></label>
      <label class="studio-wide"><span>${en ? "Primary model" : "주 모델"}</span><select id="siModel">${modelOptions.map((item) => `<option value="${platformEscape(modelKey(item))}" ${modelKey(item) === modelKey(model) ? "selected" : ""}>${platformEscape(item.name)}</option>`).join("")}</select></label>
      <label><span>${en ? "Deployment" : "구축 방식"}</span><select id="siDeployment"><option value="onprem" ${studioState.siDeployment === "onprem" ? "selected" : ""}>${en ? "On-premises" : "온프레미스"}</option><option value="cloud" ${studioState.siDeployment === "cloud" ? "selected" : ""}>${en ? "Cloud" : "클라우드"}</option><option value="compare" ${studioState.siDeployment === "compare" ? "selected" : ""}>${en ? "Compare both" : "온프레미스·클라우드 비교"}</option></select></label>
      <label><span>${en ? "Security" : "보안 수준"}</span><select id="siSecurity"><option value="standard" ${studioState.siSecurity === "standard" ? "selected" : ""}>${en ? "Standard" : "일반"}</option><option value="restricted" ${studioState.siSecurity === "restricted" ? "selected" : ""}>${en ? "Restricted network" : "내부망"}</option><option value="airgap" ${studioState.siSecurity === "airgap" ? "selected" : ""}>${en ? "Air-gapped" : "폐쇄망"}</option></select></label>
      <label><span>${en ? "Total users" : "전체 사용자"}</span><input id="siTotalUsers" type="number" min="1" value="${studioState.siTotalUsers}"></label>
      <label><span>${en ? "Concurrent requests" : "동시 요청"}</span><input id="siConcurrency" type="number" min="1" value="${studioState.siConcurrency}"></label>
      <label><span>QPS</span><input id="siQps" type="number" min="0.01" step="0.01" value="${studioState.siQps}"></label>
      <label><span>${en ? "Average input tokens" : "평균 입력 토큰"}</span><input id="siInputTokens" type="number" min="128" step="128" value="${studioState.siInputTokens}"></label>
      <label><span>${en ? "Maximum input tokens" : "최대 입력 토큰"}</span><input id="siMaxInputTokens" type="number" min="128" step="128" value="${studioState.siMaxInputTokens}"></label>
      <label><span>${en ? "Average output tokens" : "평균 출력 토큰"}</span><input id="siOutputTokens" type="number" min="32" step="32" value="${studioState.siOutputTokens}"></label>
      <label><span>${en ? "TTFT p95 (sec)" : "TTFT p95 (초)"}</span><input id="siTtftP95" type="number" min="0.1" step="0.1" value="${studioState.siTtftP95}"></label>
      <label><span>${en ? "Target response (sec)" : "목표 응답시간 (초)"}</span><input id="siTargetSeconds" type="number" min="1" value="${studioState.siTargetSeconds}"></label>
      <label><span>${en ? "Total latency p95 (sec)" : "전체 지연 p95 (초)"}</span><input id="siLatencyP95" type="number" min="1" value="${studioState.siLatencyP95}"></label>
      <label><span>${en ? "Operation hours / day" : "일 운영시간"}</span><input id="siOperatingHours" type="number" min="1" max="24" value="${studioState.siOperatingHours}"></label>
      <label><span>${en ? "Availability" : "가용성"}</span><select id="siAvailability"><option value="single" ${studioState.siAvailability === "single" ? "selected" : ""}>${en ? "Single system" : "단일 구성"}</option><option value="ha" ${studioState.siAvailability === "ha" ? "selected" : ""}>HA</option><option value="nplus1" ${studioState.siAvailability === "nplus1" ? "selected" : ""}>N+1</option></select></label>
      <label><span>${en ? "Growth reserve (%)" : "증가 여유 (%)"}</span><input id="siGrowthPct" type="number" min="0" max="200" value="${studioState.siGrowthPct}"></label>
      <label><span>${en ? "Vector data (GB)" : "벡터 데이터 (GB)"}</span><input id="siVectorDataGb" type="number" min="0" value="${studioState.siVectorDataGb}"></label>
      <label><span>${en ? "Logs per day (GB)" : "일 로그 (GB)"}</span><input id="siLogGbDay" type="number" min="0" value="${studioState.siLogGbDay}"></label>
      <label><span>${en ? "Retention days" : "보관 일수"}</span><input id="siRetentionDays" type="number" min="1" value="${studioState.siRetentionDays}"></label>
      <label class="studio-check"><input id="siDevProd" type="checkbox" ${studioState.siDevProd ? "checked" : ""}> ${en ? "Separate dev and production" : "개발계·운영계 분리"}</label>
    </div></details>
    <details class="si-advanced"><summary>${en ? "Infrastructure and operating assumptions" : "인프라·운영 조건 상세"}</summary><div class="studio-question-grid">
      <label><span>PCIe</span><select id="siPcieGen"><option value="gen4" ${studioState.siPcieGen === "gen4" ? "selected" : ""}>Gen 4</option><option value="gen5" ${studioState.siPcieGen === "gen5" ? "selected" : ""}>Gen 5</option></select></label>
      <label><span>${en ? "Network fabric" : "네트워크 패브릭"}</span><select id="siNetworkFabric"><option value="ethernet" ${studioState.siNetworkFabric === "ethernet" ? "selected" : ""}>Ethernet</option><option value="infiniband" ${studioState.siNetworkFabric === "infiniband" ? "selected" : ""}>InfiniBand</option></select></label>
      <label><span>${en ? "Backup" : "백업"}</span><select id="siBackup"><option value="none" ${studioState.siBackup === "none" ? "selected" : ""}>${en ? "None" : "없음"}</option><option value="daily" ${studioState.siBackup === "daily" ? "selected" : ""}>${en ? "Daily" : "일 1회"}</option><option value="continuous" ${studioState.siBackup === "continuous" ? "selected" : ""}>${en ? "Continuous" : "연속 복제"}</option></select></label>
      <label><span>${en ? "Monitoring" : "모니터링"}</span><select id="siMonitoring"><option value="standard" ${studioState.siMonitoring === "standard" ? "selected" : ""}>GPU / latency / error</option><option value="enterprise" ${studioState.siMonitoring === "enterprise" ? "selected" : ""}>${en ? "Enterprise + audit" : "통합 관제·감사"}</option></select></label>
      <label><span>${en ? "Cooling" : "냉각"}</span><select id="siCooling"><option value="air" ${studioState.siCooling === "air" ? "selected" : ""}>${en ? "Air cooling" : "공랭"}</option><option value="liquid" ${studioState.siCooling === "liquid" ? "selected" : ""}>${en ? "Liquid cooling review" : "수랭 검토"}</option></select></label>
      <label><span>UPS (${en ? "minutes" : "분"})</span><input id="siUpsMinutes" type="number" min="0" value="${studioState.siUpsMinutes}"></label>
      <label><span>${en ? "Electricity (KRW/kWh)" : "전력 단가 (원/kWh)"}</span><input id="siElectricityKrw" type="number" min="0" value="${studioState.siElectricityKrw}"></label>
      <label><span>${en ? "Annual maintenance (%)" : "연 유지보수율 (%)"}</span><input id="siMaintenancePct" type="number" min="0" max="100" value="${studioState.siMaintenancePct}"></label>
    </div></details>
    ${studioState.siInputMode === "expert" ? renderEditableSiBom(plans.find((plan) => plan.id === studioState.siSelectedPlan) || plans[1] || plans[0]) : ""}
    <div class="si-plan-grid">${plans.map((plan) => `<article class="si-plan-card ${plan.id === "recommended" ? "is-featured" : ""} ${studioState.siSelectedPlan === plan.id ? "is-selected" : ""}" data-si-plan="${plan.id}" role="button" tabindex="0" aria-pressed="${studioState.siSelectedPlan === plan.id}">
      <span>${en ? plan.en : plan.ko}</span><h3>${platformEscape(shortGpuName(plan.gpu.name))} × ${plan.gpuCount}</h3>
      <p>${plan.nodes}${en ? " server(s)" : "서버"} · ${en ? `${plan.gpuPerServer} GPU/server` : `서버당 GPU ${plan.gpuPerServer}개`} · ${plan.capacity}${en ? " estimated concurrent responses" : "명 예상 동시 응답"}</p>
      <dl><div><dt>CPU</dt><dd>${plan.cpuSockets}S · ${plan.cpuCores}${en ? " cores" : "코어 이상"}</dd></div><div><dt>RAM</dt><dd>${plan.ramGb}GB</dd></div>
      <div><dt>${en ? "Storage" : "스토리지"}</dt><dd>NVMe ${plan.storageTb}TB+</dd></div><div><dt>${en ? "Network" : "네트워크"}</dt><dd>${plan.network}</dd></div>
      <div><dt>${en ? "Facility power" : "설비 전력"}</dt><dd>${plan.powerW.toLocaleString()}W+</dd></div><div><dt>${en ? "Confidence" : "신뢰도"}</dt><dd>${en ? ({ 높음: "High", 중간: "Medium", 낮음: "Low" }[plan.confidence]) : plan.confidence} · n=${plan.sampleCount}</dd></div></dl>
      <div class="si-plan-foot"><span>${en ? "Failover capacity" : "장애 시 잔여 처리량"} <strong>${plan.failoverCapacity}</strong></span><span>${en ? "3-year TCO" : "3년 TCO"} <strong>${studioMoney(plan.threeYearTcoKrw)}</strong></span></div><span class="si-plan-open">${en ? "View assumptions and price sources →" : "상세 조건·가격 근거 보기 →"}</span>
    </article>`).join("")}</div>
    ${renderSelectedPlanDetail(model, plans)}
    <div class="si-output-grid">
      <article><h3>${en ? "Proposal rationale" : "제안 근거"}</h3><ul>
        <li>${en ? "Resident model memory, runtime overhead, and KV cache are included." : "모델 상주 메모리·런타임 오버헤드·KV cache를 반영했습니다."}</li>
        <li>${en ? `${studioState.siGrowthPct}% growth reserve and ${studioState.siAvailability.toUpperCase()} availability are applied.` : `트래픽 ${studioState.siGrowthPct}% 증가 여유와 ${studioState.siAvailability.toUpperCase()} 가용성 조건을 적용했습니다.`}</li>
        <li>${en ? "CPU, RAM, NVMe, network, and facility power are preliminary sizing values." : "CPU·RAM·NVMe·네트워크·설비 전력은 사전 산정값입니다."}</li>
      </ul></article>
      <article><h3>${en ? "PoC acceptance checklist" : "PoC 검증 체크리스트"}</h3><ul class="si-checklist">
        <li>□ ${en ? "Confirm model version, quantization, and runtime" : "모델 버전·양자화·런타임 확정"}</li><li>□ ${en ? "Measure TTFT and tokens/s with representative prompts" : "대표 프롬프트로 TTFT·tokens/s 측정"}</li>
        <li>□ ${en ? "Load-test target concurrency and queueing" : "목표 동시 요청·대기열 부하 테스트"}</li><li>□ ${en ? "Validate failover, monitoring, and 30% growth" : "장애 전환·모니터링·30% 성장 검증"}</li>
      </ul></article>
    </div>
    <div class="si-deliverable-grid">
      <article><span class="section-kicker">v3.2</span><h3>${en ? "Server topology and model placement" : "서버 토폴로지·모델 배치"}</h3>
        ${plans.map((plan) => `<div class="si-topology-row"><strong>${en ? plan.en : plan.ko}</strong><span>${plan.nodes} server × ${plan.gpuPerServer} GPU</span><span>${platformEscape(plan.placement)}</span><span>${en ? "Failure" : "장애"}: ${plan.failoverCapacity}/${plan.capacity}</span></div>`).join("")}
      </article>
      <article><span class="section-kicker">v3.3</span><h3>${en ? "BOM and operations" : "인프라 BOM·운영 조건"}</h3>
        <div class="si-bom-grid"><span>PCIe ${studioState.siPcieGen.replace("gen", "Gen ")}</span><span>${studioState.siNetworkFabric === "infiniband" ? "InfiniBand" : "Ethernet"} · 25/100/200/400GbE</span><span>${en ? "NVLink/NVSwitch: vendor topology check" : "NVLink/NVSwitch: 벤더 토폴로지 확인"}</span><span>${en ? `Backup: ${studioState.siBackup}` : `백업: ${studioState.siBackup}`}</span><span>${en ? `Monitoring: ${studioState.siMonitoring}` : `모니터링: ${studioState.siMonitoring}`}</span><span>${en ? `Cooling: ${studioState.siCooling}` : `냉각: ${studioState.siCooling}`}</span><span>UPS ${studioState.siUpsMinutes} min</span><span>${en ? "Dev / validation / production separated" : "개발·검증·운영계 분리 검토"}</span></div>
      </article>
      <article><span class="section-kicker">v3.4</span><h3>${en ? "Cost and proposal outputs" : "비용·제안 산출물"}</h3>
        <div class="studio-table-wrap"><table class="studio-table"><thead><tr><th>${en ? "Option" : "구성안"}</th><th>${en ? "Purchase estimate" : "도입비 추정"}</th><th>${en ? "Annual energy" : "연 전력비"}</th><th>${en ? "3-year TCO" : "3년 TCO"}</th></tr></thead><tbody>${plans.map((plan) => `<tr><td>${en ? plan.en : plan.ko}</td><td>${studioMoney(plan.purchaseKrw)}</td><td>${studioMoney(plan.annualEnergyKrw)}</td><td><strong>${studioMoney(plan.threeYearTcoKrw)}</strong></td></tr>`).join("")}</tbody></table></div>
        <p>${en ? "Pricing is an editable planning assumption, not a vendor quote. Taxes, margin, licensing, installation, and support are excluded." : "가격은 편집 가능한 계획 가정이며 벤더 견적이 아닙니다. 세금·마진·라이선스·설치·지원 비용은 제외됩니다."}</p>
      </article>
      <article><span class="section-kicker">v3.5</span><h3>${en ? "Evidence confidence" : "근거별 신뢰도"}</h3>
        <div class="si-confidence-list"><span>${en ? "Model information" : "모델 정보"}<strong>${model.sourceUrl ? (en ? "Official/source-linked" : "출처 연결") : (en ? "Review" : "검토")}</strong></span><span>${en ? "GPU specification" : "GPU 사양"}<strong>${plans.every((p) => p.gpu.specStatus === "sourced") ? (en ? "Official" : "공식") : (en ? "Catalog/estimated" : "카탈로그·추정")}</strong></span><span>${en ? "VRAM calculation" : "VRAM 계산"}<strong>${en ? "Estimator" : "추정식"}</strong></span><span>${en ? "Throughput" : "처리량"}<strong>${plans.some((p) => p.sampleCount) ? (en ? "External reference" : "외부 참고") : (en ? "Pure estimate" : "순수 추정")}</strong></span><span>${en ? "Final decision" : "최종 판정"}<strong>${en ? "PoC required" : "PoC 필요"}</strong></span></div>
      </article>
    </div>
    <div class="si-poc-mode"><div><span class="section-kicker">POC MODE</span><h3>${en ? "Record validation results" : "실제 검증 결과 기록"}</h3><p>${en ? "Compare measured p95 latency, speed, errors, and stability with the sizing hypothesis." : "실측 p95 지연·속도·오류·장시간 안정성을 산정 가설과 비교합니다."}</p></div>
      <div class="studio-question-grid"><label><span>TTFT p95 (sec)</span><input id="siMeasuredTtft" type="number" min="0" step="0.1" value="${studioState.siMeasuredTtft}"></label><label><span>${en ? "Measured tok/s" : "실측 tok/s"}</span><input id="siMeasuredSpeed" type="number" min="0" step="0.1" value="${studioState.siMeasuredSpeed}"></label><label><span>${en ? "Error rate (%)" : "오류율 (%)"}</span><input id="siMeasuredErrorRate" type="number" min="0" step="0.01" value="${studioState.siMeasuredErrorRate}"></label><label><span>${en ? "Stability test (hours)" : "안정성 시험 (시간)"}</span><input id="siMeasuredHours" type="number" min="0" value="${studioState.siMeasuredHours}"></label></div>
      <p class="si-poc-verdict">${studioState.siMeasuredTtft > 0 ? (studioState.siMeasuredTtft <= studioState.siTtftP95 && studioState.siMeasuredErrorRate <= 1 && studioState.siMeasuredHours >= 24 ? (en ? "PoC hypothesis passed — review remaining operational checks." : "PoC 가설 통과 — 나머지 운영 검증을 확인하세요.") : (en ? "PoC adjustment required — revise model, replicas, or SLA assumptions." : "PoC 조정 필요 — 모델·복제 수·SLA 가정을 수정하세요.")) : (en ? "Enter measured values after the representative workload test." : "대표 워크로드 시험 후 실측값을 입력하세요.")}</p>
    </div>
    ${renderV38V42Modules(model, plans)}
    <div class="si-actions"><button type="button" class="primary-button" data-si-export>${en ? "Excel workbook" : "Excel 기초표"}</button>
      <a class="ghost-button" href="./docs/examples/si-sizing-example.xlsx" download>${en ? "Editable .xlsx template" : "편집용 .xlsx 템플릿"}</a>
      <button type="button" class="ghost-button" data-si-print>${en ? "Print / save PDF" : "제안서 인쇄·PDF"}</button>
      <button type="button" class="ghost-button" data-si-deploy>${en ? "Deployment draft" : "배포 초안"}</button>
      <button type="button" class="ghost-button" data-share-studio>${en ? "Copy case link" : "사례 링크 복사"}</button></div>
    <p class="studio-form-note">${en ? "Pre-sales estimate only. Final quantities require vendor validation and a workload PoC." : "사전 상담용 추정치입니다. 최종 수량은 벤더 검토와 실제 워크로드 PoC 후 확정해야 합니다."}</p>`;
}

function siXmlEscape(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function downloadSiWorkbook() {
  const { model, plans } = calculateSiSizing();
  const rows = plans.map((plan) => [plan.ko, plan.gpu.name, plan.gpuCount, plan.nodes, plan.cpuCores, plan.ramGb, plan.storageTb, plan.network, plan.powerW, plan.confidence, plan.sampleCount]);
  const selected = plans.find((plan) => plan.id === studioState.siSelectedPlan) || plans[1] || plans[0];
  const bom = siEditableBom(selected);
  const bomRows = [
    ["구분", "제품", "단가", "수량", "소계"],
    ["GPU", selected.gpu.name, bom.gpuUnitKrw, selected.gpuCount, bom.gpuTotal],
    ...bom.rows.map((row) => [row.label, row.item.name, row.item.priceKrw, row.quantity, row.subtotal]),
    ["추가 비용", "설치·라이선스·지원", bom.extra, 1, bom.extra],
    ["합계", "", "", "", bom.total],
  ];
  const worksheet = (name, values) => `<Worksheet ss:Name="${siXmlEscape(name)}"><Table>${values.map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="${typeof cell === "number" ? "Number" : "String"}">${siXmlEscape(cell)}</Data></Cell>`).join("")}</Row>`).join("")}</Table></Worksheet>`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheet("고객 요구사항", [["항목", "값"], ["프로젝트", studioState.siProjectName], ["목적", studioState.siPurpose], ["모델", model.name], ["전체 사용자", studioState.siTotalUsers], ["동시 요청", studioState.siConcurrency], ["입력 토큰", studioState.siInputTokens], ["출력 토큰", studioState.siOutputTokens], ["가용성", studioState.siAvailability], ["성장 여유", `${studioState.siGrowthPct}%`]])}${worksheet("구성안 비교", [["구성안", "GPU", "GPU 수", "노드", "CPU 코어", "RAM GB", "NVMe TB", "네트워크", "전력 W", "신뢰도", "표본 수"], ...rows])}${worksheet("편집 BOM", bomRows)}${worksheet("가정 및 PoC", [["구분", "내용"], ["가정", "모델 메모리·KV cache·런타임 오버헤드와 성장 여유를 포함한 사전 산정"], ["주의", "최종 수량은 벤더 검토와 실제 워크로드 PoC 후 확정"], ["PoC 1", "모델 버전·양자화·런타임 확정"], ["PoC 2", "대표 프롬프트 TTFT·tokens/s 측정"], ["PoC 3", "동시 요청·대기열 부하 테스트"], ["PoC 4", "장애 전환·모니터링 검증"]])}</Workbook>`;
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${(studioState.siProjectName || "ai-infra-sizing").replace(/[\\/:*?"<>|]/g, "-")}.xls`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function downloadSiDeployment() {
  const { model, plans } = calculateSiSizing();
  const selected = plans.find((plan) => plan.id === "recommended") || plans[0];
  const content = `# AI Infra Sizing deployment draft
# Pre-sales hypothesis only — validate image, model, runtime and topology in a PoC.
services:
  inference:
    image: vllm/vllm-openai:latest
    command: --model "${safeModelRepo(model)}" --tensor-parallel-size ${Math.max(1, selected.gpuPerServer)}
    deploy:
      replicas: ${Math.max(1, selected.nodes)}
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: ${selected.gpuPerServer}
              capabilities: [gpu]
    ports: ["8000:8000"]
    volumes: ["./models:/models", "./logs:/logs"]
  monitoring:
    image: prom/prometheus:latest
    ports: ["9090:9090"]
# Required review: ${studioState.siNetworkFabric}, PCIe ${studioState.siPcieGen}, ${selected.network}, backup=${studioState.siBackup}
`;
  const blob = new Blob([content], { type: "text/yaml;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "docker-compose.sizing-draft.yml";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function ensureDecisionStudio() {
  if ($("decisionStudio")) return $("decisionStudio");
  const panel = document.createElement("section");
  panel.id = "decisionStudio";
  panel.className = "decision-studio";
  panel.setAttribute("aria-labelledby", "decisionStudioTitle");
  panel.innerHTML = `
    <div class="decision-studio-head">
      <div><span class="section-kicker">v3.5</span><h2 id="decisionStudioTitle"></h2><p id="decisionStudioNote"></p></div>
      <div class="decision-studio-tabs" role="tablist"></div>
    </div>
    <div id="decisionStudioBody" class="decision-studio-body" aria-live="polite"></div>`;
  const hub = $("decisionHub");
  hub?.parentNode?.insertBefore(panel, hub);
  return panel;
}

function syncStudioUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("studio", studioState.tab);
  url.searchParams.set("studioState", JSON.stringify(studioState));
  history.replaceState({}, "", url);
}

function renderDecisionStudio() {
  const panel = ensureDecisionStudio();
  const infraActive = typeof coreTaskMode !== "undefined" && coreTaskMode === "infra";
  panel.hidden = !infraActive;
  if (infraActive) studioState.tab = "consulting";
  panel.classList.toggle("is-infra-workspace", infraActive);
  panel.classList.toggle("is-simple-sizing", infraActive && studioState.siInputMode === "simple");
  $("decisionStudioTitle").textContent = studioCopy("title");
  $("decisionStudioNote").textContent = studioCopy("note");
  const tabs = ["consulting", "recommend", "market", "custom", "parts", "runtime", "community"];
  panel.querySelector(".decision-studio-tabs").innerHTML = tabs.map((id) =>
    `<button type="button" role="tab" data-studio-tab="${id}" aria-selected="${studioState.tab === id}" class="${studioState.tab === id ? "is-active" : ""}">${studioCopy(id)}</button>`
  ).join("");
  const renderers = {
    consulting: renderStudioConsulting,
    recommend: renderStudioRecommend,
    market: renderStudioMarket,
    custom: renderStudioCustom,
    parts: renderStudioParts,
    runtime: renderStudioRuntime,
    community: renderStudioCommunity,
  };
  $("decisionStudioBody").innerHTML = renderers[studioState.tab]();
  bindDecisionStudio();
}

function updateStudio(key, value) {
  studioState[key] = value;
  if (key === "category" && ["image", "video", "stt", "tts"].includes(value)) studioState.targetSpeed = 0;
  syncStudioUrl();
  renderDecisionStudio();
}

function bindDecisionStudio() {
  document.querySelectorAll("[data-studio-tab]").forEach((button) => button.addEventListener("click", () => updateStudio("tab", button.dataset.studioTab)));
  const fields = {
    studioCategory: ["category", String], studioModel: ["modelKey", String], studioTargetSpeed: ["targetSpeed", Number],
    studioBudget: ["budgetKrw", Number], studioCondition: ["condition", String], studioFormFactor: ["formFactor", String],
    studioPower: ["powerLimitW", Number], studioNoise: ["noise", String], studioImageSize: ["imageSize", Number],
    studioVideoFrames: ["videoFrames", Number], customName: ["customName", String], customUrl: ["customUrl", String],
    customTotalB: ["customTotalB", Number], customActiveB: ["customActiveB", Number], customLayers: ["customLayers", Number],
    customBits: ["customBits", Number], customContext: ["customContext", Number], partsCpu: ["cpuId", String],
    partsBoard: ["motherboardId", String], partsPsu: ["psuId", String], partsCase: ["caseId", String],
    partsGpu: ["gpuId", String], partsRam: ["ramGb", Number], runtimeGpu: ["gpuId", String], runtimeOs: ["runtimeOs", String],
    siCompanyName: ["siCompanyName", String], siCustomerName: ["siCustomerName", String], siProjectName: ["siProjectName", String], siPurpose: ["siPurpose", String], siIndustry: ["siIndustry", String], siContact: ["siContact", String],
    siModel: ["modelKey", String],
    siDeployment: ["siDeployment", String], siSecurity: ["siSecurity", String], siServiceType: ["siServiceType", String], siTotalUsers: ["siTotalUsers", Number],
    siConcurrency: ["siConcurrency", Number], siQps: ["siQps", Number], siInputTokens: ["siInputTokens", Number], siMaxInputTokens: ["siMaxInputTokens", Number], siOutputTokens: ["siOutputTokens", Number],
    siTtftP95: ["siTtftP95", Number], siTargetSeconds: ["siTargetSeconds", Number], siLatencyP95: ["siLatencyP95", Number], siOperatingHours: ["siOperatingHours", Number], siAvailability: ["siAvailability", String], siGrowthPct: ["siGrowthPct", Number],
    siVectorDataGb: ["siVectorDataGb", Number], siLogGbDay: ["siLogGbDay", Number], siRetentionDays: ["siRetentionDays", Number],
    siPcieGen: ["siPcieGen", String], siNetworkFabric: ["siNetworkFabric", String], siBackup: ["siBackup", String],
    siMonitoring: ["siMonitoring", String], siCooling: ["siCooling", String], siUpsMinutes: ["siUpsMinutes", Number],
    siElectricityKrw: ["siElectricityKrw", Number], siMaintenancePct: ["siMaintenancePct", Number],
    siMeasuredTtft: ["siMeasuredTtft", Number], siMeasuredSpeed: ["siMeasuredSpeed", Number],
    siMeasuredErrorRate: ["siMeasuredErrorRate", Number], siMeasuredHours: ["siMeasuredHours", Number],
    siMaxBatch: ["siMaxBatch", Number], siMinReplicas: ["siMinReplicas", Number], siMaxReplicas: ["siMaxReplicas", Number],
    siBenchmarkRuntime: ["siBenchmarkRuntime", String], siBenchmarkPrompts: ["siBenchmarkPrompts", String],
    siBenchmarkOutputs: ["siBenchmarkOutputs", String], siBenchmarkConcurrency: ["siBenchmarkConcurrency", String],
    siUtilizationPct: ["siUtilizationPct", Number], siCloudHourlyUsd: ["siCloudHourlyUsd", Number],
    siFacilityKrwMonth: ["siFacilityKrwMonth", Number], siSupportPct: ["siSupportPct", Number],
    siBomCpuId: ["siBomCpuId", String], siBomCpuQty: ["siBomCpuQty", Number],
    siBomMemoryId: ["siBomMemoryId", String], siBomMemoryQty: ["siBomMemoryQty", Number],
    siBomStorageId: ["siBomStorageId", String], siBomStorageQty: ["siBomStorageQty", Number],
    siBomNicId: ["siBomNicId", String], siBomNicQty: ["siBomNicQty", Number],
    siBomPsuId: ["siBomPsuId", String], siBomPsuQty: ["siBomPsuQty", Number],
    siBomUpsId: ["siBomUpsId", String], siBomUpsQty: ["siBomUpsQty", Number],
    siBomCaseId: ["siBomCaseId", String], siBomCaseQty: ["siBomCaseQty", Number],
    siBomExtraKrw: ["siBomExtraKrw", Number],
  };
  Object.entries(fields).forEach(([id, [key, cast]]) => $(id)?.addEventListener("change", (event) => updateStudio(key, cast(event.target.value))));
  $("customVision")?.addEventListener("change", (event) => updateStudio("customVision", event.target.checked));
  $("siDevProd")?.addEventListener("change", (event) => updateStudio("siDevProd", event.target.checked));
  $("siStreaming")?.addEventListener("change", (event) => updateStudio("siStreaming", event.target.checked));
  $("siAutoscale")?.addEventListener("change", (event) => updateStudio("siAutoscale", event.target.checked));
  document.querySelectorAll("[data-si-input-mode]").forEach((button) => button.addEventListener("click", () => updateStudio("siInputMode", button.dataset.siInputMode)));
  document.querySelectorAll("[data-si-quality]").forEach((button) => button.addEventListener("click", () => {
    studioState.siQualityPreset = button.dataset.siQuality;
    applySimpleSizingPreset();
    syncStudioUrl();
    renderDecisionStudio();
  }));
  document.querySelectorAll("[data-si-users]").forEach((button) => button.addEventListener("click", () => {
    studioState.siUserPreset = Number(button.dataset.siUsers);
    applySimpleSizingPreset();
    syncStudioUrl();
    renderDecisionStudio();
  }));
  $("siCustomUsers")?.addEventListener("change", (event) => {
    studioState.siUserPreset = Math.max(1, Math.round(Number(event.target.value) || 1));
    applySimpleSizingPreset();
    syncStudioUrl();
    renderDecisionStudio();
  });
  document.querySelectorAll("[data-si-deployment]").forEach((button) => button.addEventListener("click", () => updateStudio("siDeployment", button.dataset.siDeployment)));
  $("siExportAllowed")?.addEventListener("change", (event) => updateStudio("siExportAllowed", event.target.value === "true"));
  document.querySelectorAll("[data-si-preset]").forEach((button) => button.addEventListener("click", () => {
    const preset = SI_SCENARIOS[button.dataset.siPreset];
    studioState = {
      ...studioState, siScenario: button.dataset.siPreset, siProjectName: uiLanguage === "en" ? preset.en : preset.ko,
      siPurpose: uiLanguage === "en" ? preset.purposeEn : preset.purpose,
      siTotalUsers: preset.users, siConcurrency: preset.concurrency, siInputTokens: preset.input,
      siOutputTokens: preset.output, siTargetSeconds: preset.seconds, siAvailability: preset.availability,
      siGrowthPct: preset.growth, siVectorDataGb: preset.vector, siLogGbDay: preset.logs,
      siRetentionDays: preset.retention, siSecurity: preset.security, siServiceType: preset.serviceType || "rag",
      siUserPreset: preset.users,
    };
    syncStudioUrl();
    renderDecisionStudio();
  }));
  const selectPlan = (id) => {
    studioState.siSelectedPlan = id;
    syncStudioUrl();
    renderDecisionStudio();
  };
  document.querySelectorAll("[data-si-plan]").forEach((card) => {
    card.addEventListener("click", () => selectPlan(card.dataset.siPlan));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPlan(card.dataset.siPlan);
      }
    });
  });
  $("[data-si-bom-auto]")?.addEventListener("click", () => {
    const { plans } = calculateSiSizing();
    const selected = plans.find((plan) => plan.id === studioState.siSelectedPlan) || plans[1] || plans[0];
    Object.assign(studioState, siBomAutoSelection(selected), { siBomExtraKrw: 0 });
    syncStudioUrl();
    renderDecisionStudio();
  });
  $("[data-si-export]")?.addEventListener("click", downloadSiWorkbook);
  $("[data-si-print]")?.addEventListener("click", () => window.print());
  $("[data-si-deploy]")?.addEventListener("click", downloadSiDeployment);
  $("[data-si-save]")?.addEventListener("click", () => saveSizingProject(false));
  $("[data-si-clone]")?.addEventListener("click", () => saveSizingProject(true));
  $("[data-si-json-export]")?.addEventListener("click", () => downloadJson("ai-infra-sizing-project.json", sizingSnapshot()));
  $("[data-si-json-import]")?.addEventListener("click", () => $("siJsonFile")?.click());
  $("siJsonFile")?.addEventListener("change", async (event) => {
    try {
      const parsed = JSON.parse(await event.target.files?.[0]?.text());
      if (parsed?.state) studioState = { ...studioState, ...parsed.state };
      syncStudioUrl();
      renderDecisionStudio();
    } catch { alert(uiLanguage === "en" ? "Invalid project JSON." : "올바른 프로젝트 JSON이 아닙니다."); }
  });
  document.querySelectorAll("[data-si-load]").forEach((button) => button.addEventListener("click", () => {
    const row = sizingProjects().find((item) => item.id === button.dataset.siLoad);
    if (row?.state) studioState = { ...studioState, ...row.state, siEstimateVersion: row.version };
    syncStudioUrl();
    renderDecisionStudio();
  }));
  document.querySelectorAll("[data-si-report]").forEach((button) => button.addEventListener("click", () => updateStudio("siReportMode", button.dataset.siReport)));
  $("[data-si-copy-command]")?.addEventListener("click", () => copyTextToClipboard($(".si-command code")?.textContent || "", $("[data-si-copy-command]")));
  $("[data-si-benchmark-plan]")?.addEventListener("click", () => {
    const { model, plans } = calculateSiSizing();
    downloadJson("benchmark-plan.json", { model: model.name, runtime: studioState.siBenchmarkRuntime, prompts: studioState.siBenchmarkPrompts, outputs: studioState.siBenchmarkOutputs, concurrency: studioState.siBenchmarkConcurrency, command: benchmarkCommands(model, plans[1])[studioState.siBenchmarkRuntime] });
  });
  $("[data-si-benchmark-import]")?.addEventListener("click", () => $("siBenchmarkFile")?.click());
  $("siBenchmarkFile")?.addEventListener("change", async (event) => {
    try {
      const result = JSON.parse(await event.target.files?.[0]?.text());
      studioState.siMeasuredTtft = Number(result.ttft_p95 ?? result.ttftP95 ?? 0);
      studioState.siMeasuredItl = Number(result.itl_p95 ?? result.itlP95 ?? 0);
      studioState.siMeasuredLatencyP95 = Number(result.request_latency_p95 ?? result.latencyP95 ?? 0);
      studioState.siMeasuredSpeed = Number(result.tokens_per_second ?? result.throughput ?? 0);
      studioState.siMeasuredErrorRate = Number(result.error_rate ?? result.errorRate ?? 0);
      studioState.siBenchmarkSamples = Number(result.sample_count ?? result.sampleCount ?? 1);
      studioState.siBenchmarkOutliers = Number(result.outliers ?? 0);
      syncStudioUrl();
      renderDecisionStudio();
    } catch { alert(uiLanguage === "en" ? "Invalid benchmark JSON." : "올바른 벤치마크 JSON이 아닙니다."); }
  });
  document.querySelectorAll("[data-studio-gpu]").forEach((button) => button.addEventListener("click", () => {
    selectPrimaryGpu(button.dataset.studioGpu, { persist: true });
    studioState.gpuId = button.dataset.studioGpu;
    syncStudioUrl();
    render();
  }));
  $("[data-save-build]")?.addEventListener("click", (event) => {
    localStorage.setItem("ai-hardware-fit-saved-build", JSON.stringify(studioState));
    event.currentTarget.textContent = uiLanguage === "en" ? "Saved" : "저장됨";
  });
  $("[data-share-studio]")?.addEventListener("click", () => copyTextToClipboard(window.location.href, $("[data-share-studio]")));
  $("communityBenchmarkForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const speed = Number(data.get("speed"));
    const gpuId = String(data.get("gpuId"));
    const gpu = GPU_PRESETS.find((item) => item.id === gpuId);
    const comparable = BENCHMARKS.filter((row) => row.modelName.toLowerCase() === String(data.get("modelName")).toLowerCase() && (row.gpuId === gpuId || row.gpu === gpu?.name));
    const values = comparable.map(benchmarkNumericValue).filter((value) => value > 0).sort((a, b) => a - b);
    const median = values.length ? values[Math.floor(values.length / 2)] : 0;
    const outlier = median > 0 && (speed > median * 3 || speed < median / 3);
    const body = [
      `Contributor: ${data.get("contributor")}`, `Model: ${data.get("modelName")}`, `GPU: ${gpu?.name || gpuId}`,
      `Runtime: ${data.get("runtime")}`, `Precision: ${data.get("precision")}`, `Context: ${data.get("context")}`,
      `Speed: ${speed} tok/s`, `Environment: ${data.get("environment")}`, `Evidence: ${data.get("sourceUrl")}`,
      `Outlier check: ${outlier ? "REVIEW REQUIRED" : "pass"}`,
    ].join("\n");
    const issueUrl = `https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?title=${encodeURIComponent(`[Benchmark] ${data.get("modelName")} on ${gpu?.name || gpuId}`)}&body=${encodeURIComponent(body)}`;
    const row = {
      contributor: String(data.get("contributor")), modelName: String(data.get("modelName")), gpuId,
      gpuName: gpu?.name || gpuId, runtime: String(data.get("runtime")), precision: String(data.get("precision")),
      context: Number(data.get("context")), speed, environment: String(data.get("environment")),
      sourceUrl: String(data.get("sourceUrl")), outlier, issueUrl, createdAt: new Date().toISOString(),
    };
    localStorage.setItem("ai-hardware-fit-community-benchmarks", JSON.stringify([row, ...communityRows()].slice(0, 30)));
    renderDecisionStudio();
  });
}

function restoreStudioState() {
  const params = new URL(window.location.href).searchParams;
  const raw = params.get("studioState");
  const saved = raw || localStorage.getItem("ai-hardware-fit-saved-build");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") studioState = { ...studioState, ...parsed };
    } catch {}
  }
  if (params.get("studio")) studioState.tab = params.get("studio");
  if (!["consulting", "recommend", "market", "custom", "parts", "runtime", "community"].includes(studioState.tab)) studioState.tab = "consulting";
}

function initDecisionStudio() {
  restoreStudioState();
  renderDecisionStudio();
  window.addEventListener("languagechange", renderDecisionStudio);
  document.querySelector("[data-language-toggle]")?.addEventListener("click", () => queueMicrotask(renderDecisionStudio));
}

document.addEventListener("DOMContentLoaded", initDecisionStudio);
