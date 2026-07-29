/* AI Hardware Fit v3 decision studio.
 * Guided recommendations, Korean market snapshots, custom models, component
 * compatibility, runtime guidance, and community measurements.
 */
const DECISION_STUDIO_COPY = {
  ko: {
    title: "구매 결정 스튜디오",
    note: "가격·목표 작업·시스템 호환성과 실측 근거를 한 흐름에서 비교합니다.",
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
  tab: "recommend",
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
};

function studioCopy(key) {
  return DECISION_STUDIO_COPY[uiLanguage === "en" ? "en" : "ko"][key] || key;
}

function studioMarket(gpuId) {
  return KOREAN_GPU_MARKET.find((item) => item.gpuId === gpuId) || null;
}

function studioMoney(value) {
  return `${Math.round(Number(value) || 0).toLocaleString("ko-KR")}원`;
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
    : studioState.category === "video"
      ? Math.max(1, studioState.videoFrames) / 81
      : 1;
  const estimate = rawEstimate ? {
    ...rawEstimate,
    requiredGb: Number(rawEstimate.requiredGb || 0) * (studioState.category === "video" ? 0.75 + mediaScale * 0.25 : mediaScale),
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
    .filter((gpu) => gpu.id !== "custom" && studioMarket(gpu.id))
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
          ["ocr", "OCR"], ["stt", "STT"], ["tts", "TTS"],
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
      ${studioState.category === "video" ? `<label><span>${en ? "Video frames" : "비디오 프레임"}</span><input id="studioVideoFrames" type="number" min="1" max="241" value="${studioState.videoFrames}"></label>` : ""}
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
  const rows = KOREAN_GPU_MARKET.map((market) => {
    const gpu = GPU_PRESETS.find((item) => item.id === market.gpuId);
    const ageDays = Math.floor((today - new Date(`${market.updatedAt}T00:00:00Z`)) / 86400000);
    const stale = ageDays > 30;
    const model = studioSelectedModel();
    const score = gpu ? studioGpuScore(gpu, model) : null;
    return { market, gpu, stale, score };
  }).filter((row) => row.gpu);
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
      <td><a href="${platformEscape(market.sourceUrl)}" target="_blank" rel="noopener noreferrer">${platformEscape(market.sourceName)}</a></td>
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

function ensureDecisionStudio() {
  if ($("decisionStudio")) return $("decisionStudio");
  const panel = document.createElement("section");
  panel.id = "decisionStudio";
  panel.className = "decision-studio";
  panel.setAttribute("aria-labelledby", "decisionStudioTitle");
  panel.innerHTML = `
    <div class="decision-studio-head">
      <div><span class="section-kicker">v3.0</span><h2 id="decisionStudioTitle"></h2><p id="decisionStudioNote"></p></div>
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
  $("decisionStudioTitle").textContent = studioCopy("title");
  $("decisionStudioNote").textContent = studioCopy("note");
  const tabs = ["recommend", "market", "custom", "parts", "runtime", "community"];
  panel.querySelector(".decision-studio-tabs").innerHTML = tabs.map((id) =>
    `<button type="button" role="tab" data-studio-tab="${id}" aria-selected="${studioState.tab === id}" class="${studioState.tab === id ? "is-active" : ""}">${studioCopy(id)}</button>`
  ).join("");
  const renderers = {
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
  };
  Object.entries(fields).forEach(([id, [key, cast]]) => $(id)?.addEventListener("change", (event) => updateStudio(key, cast(event.target.value))));
  $("customVision")?.addEventListener("change", (event) => updateStudio("customVision", event.target.checked));
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
  if (!["recommend", "market", "custom", "parts", "runtime", "community"].includes(studioState.tab)) studioState.tab = "recommend";
}

function initDecisionStudio() {
  restoreStudioState();
  renderDecisionStudio();
  window.addEventListener("languagechange", renderDecisionStudio);
  document.querySelector("[data-language-toggle]")?.addEventListener("click", () => queueMicrotask(renderDecisionStudio));
}

document.addEventListener("DOMContentLoaded", initDecisionStudio);
