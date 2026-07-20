const DATA = window.LLM_GPU_CHECKER_DATA || {};
const GPU_PRESETS = DATA.gpus || [];
const QUANTS = DATA.quantizations || [];
const MODELS = DATA.models || [];

const GRADE_META = {
  S: { label: "쾌적", className: "grade-s", score: 5, color: "#13795b" },
  A: { label: "잘 돌아감", className: "grade-a", score: 4, color: "#225ea8" },
  B: { label: "가능", className: "grade-b", score: 3, color: "#5f4bb6" },
  C: { label: "빡빡함", className: "grade-c", score: 2, color: "#9a6700" },
  D: { label: "오프로딩", className: "grade-d", score: 1, color: "#9a6700" },
  F: { label: "부적합", className: "grade-f", score: 0, color: "#ba2f2f" },
};

const KV_PRECISION_META = {
  fp16: { label: "FP16", factor: 1 },
  fp8: { label: "FP8", factor: 0.55 },
  q8: { label: "Q8", factor: 0.6 },
  q4: { label: "Q4", factor: 0.35 },
};

const $ = (id) => document.getElementById(id);

function init() {
  populateSelects();
  bindEvents();
  render();
}

function populateSelects() {
  $("gpuPreset").innerHTML = GPU_PRESETS.map(
    (gpu) => `<option value="${gpu.id}">${gpu.name}</option>`,
  ).join("");
  $("gpuPreset").value = "rtx4090-24";

  $("quantization").innerHTML = QUANTS.map(
    (quant) => `<option value="${quant.id}">${quant.label}</option>`,
  ).join("");
  $("quantization").value = "auto";

  const providers = [...new Set(MODELS.map((model) => model.maker))].sort((a, b) => a.localeCompare(b));
  $("providerFilter").innerHTML = [
    `<option value="all">전체 공급사</option>`,
    ...providers.map((provider) => `<option value="${provider}">${provider}</option>`),
  ].join("");

  applyPreset("rtx4090-24");
}

function bindEvents() {
  ["vramGb", "gpuCount", "ramGb", "bandwidth", "contextSize", "concurrency", "outputTokens", "kvPrecision", "quantization", "runtimeMode", "searchInput", "taskFilter", "providerFilter", "gradeFilter", "sortBy"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });

  $("gpuPreset").addEventListener("change", (event) => {
    applyPreset(event.target.value);
    render();
  });

  $("detectGpuButton").addEventListener("click", detectGpu);
}

function applyPreset(id) {
  const preset = GPU_PRESETS.find((gpu) => gpu.id === id) || GPU_PRESETS[0];
  $("vramGb").value = preset.vram;
  $("ramGb").value = preset.ram;
  $("bandwidth").value = preset.bandwidth;
  $("gpuCount").value = 1;
  $("hardwareStatus").textContent = `${preset.name} 기준`;
}

function getHardware() {
  const vram = clampNumber($("vramGb").value, 2, 640, 24);
  const count = clampNumber($("gpuCount").value, 1, 16, 1);
  const ram = clampNumber($("ramGb").value, 8, 2048, 64);
  const bandwidth = clampNumber($("bandwidth").value, 100, 12000, 1008);
  const context = clampNumber($("contextSize").value, 4096, 1048576, 8192);
  const concurrency = clampNumber($("concurrency").value, 1, 64, 1);
  const outputTokens = clampNumber($("outputTokens").value, 128, 8192, 512);
  const kvPrecision = $("kvPrecision").value;
  const kvMeta = KV_PRECISION_META[kvPrecision] || KV_PRECISION_META.fp16;
  const runtime = $("runtimeMode").value;
  return { vram, count, ram, bandwidth, context, concurrency, outputTokens, kvPrecision, kvMeta, runtime };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function estimateModel(model, quantId, hardware) {
  const quant = quantId === "auto" ? recommendQuant(model, hardware) : QUANTS.find((item) => item.id === quantId);
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const weightsGb = model.params * quant.bytesPerB * 1.08;
  const contextLimitTokens = model.context * 1024;
  const contextSupported = hardware.context <= contextLimitTokens;
  const kvGb = estimateKvCacheGb(model, hardware);
  const runtimeOverheadGb = runtimeFactor.base
    + Math.min(runtimeFactor.cap, weightsGb * runtimeFactor.weightRatio)
    + Math.max(0, hardware.concurrency - 1) * runtimeFactor.requestOverhead;
  const requiredGb = weightsGb + kvGb + runtimeOverheadGb;
  const effectiveVram = hardware.vram * hardware.count * (hardware.count > 1 ? 0.92 : 1);
  const pressure = requiredGb / effectiveVram;
  const ramAssist = hardware.ram * 0.45;
  const offloadRoom = effectiveVram + ramAssist;
  const grade = contextSupported ? gradeFromPressure(pressure, requiredGb, offloadRoom) : "F";
  const speedStats = estimateSpeed(model, quant, hardware, grade);
  const latencySeconds = speedStats.perRequest > 0 ? hardware.outputTokens / speedStats.perRequest : 0;
  const reason = buildReason(grade, requiredGb, effectiveVram, model, hardware, contextLimitTokens, contextSupported);

  return {
    model,
    quant,
    weightsGb,
    kvGb,
    runtimeOverheadGb,
    requiredGb,
    effectiveVram,
    pressure,
    grade,
    speed: speedStats.perRequest,
    throughput: speedStats.total,
    latencySeconds,
    contextLimitTokens,
    contextSupported,
    reason,
  };
}

function getRuntimeFactor(runtime) {
  if (runtime === "vllm") return { base: 2.6, cap: 5.5, weightRatio: 0.1, requestOverhead: 0.12, concurrencyEfficiency: 0.78 };
  if (runtime === "transformers") return { base: 2.2, cap: 4.5, weightRatio: 0.09, requestOverhead: 0.18, concurrencyEfficiency: 0.38 };
  return { base: 1.2, cap: 3.0, weightRatio: 0.06, requestOverhead: 0.08, concurrencyEfficiency: 0.55 };
}

function estimateKvCacheGb(model, hardware) {
  const contextMultiplier = hardware.context / 4096;
  const concurrencyMultiplier = hardware.concurrency;
  return model.active * 0.09 * contextMultiplier * concurrencyMultiplier * hardware.kvMeta.factor;
}

function recommendQuant(model, hardware) {
  const qualityFirst = [...QUANTS].filter((item) => item.id !== "auto").sort((a, b) => b.rank - a.rank);
  const effectiveVram = hardware.vram * hardware.count * (hardware.count > 1 ? 0.92 : 1);
  for (const quant of qualityFirst) {
    const provisional = estimateWithQuant(model, quant, hardware);
    if (provisional.requiredGb <= effectiveVram * 0.92) return quant;
  }
  for (const quant of qualityFirst) {
    const provisional = estimateWithQuant(model, quant, hardware);
    if (provisional.requiredGb <= effectiveVram + hardware.ram * 0.45) return quant;
  }
  return QUANTS.find((item) => item.id === "q2");
}

function estimateWithQuant(model, quant, hardware) {
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const weightsGb = model.params * quant.bytesPerB * 1.08;
  const kvGb = estimateKvCacheGb(model, hardware);
  const runtimeOverheadGb = runtimeFactor.base
    + Math.min(runtimeFactor.cap, weightsGb * runtimeFactor.weightRatio)
    + Math.max(0, hardware.concurrency - 1) * runtimeFactor.requestOverhead;
  return { requiredGb: weightsGb + kvGb + runtimeOverheadGb };
}

function gradeFromPressure(pressure, requiredGb, offloadRoom) {
  if (pressure <= 0.7) return "S";
  if (pressure <= 0.85) return "A";
  if (pressure <= 1) return "B";
  if (pressure <= 1.12) return "C";
  if (requiredGb <= offloadRoom) return "D";
  return "F";
}

function estimateSpeed(model, quant, hardware, grade) {
  if (grade === "F") return { perRequest: 0, total: 0 };
  const multiGpuPenalty = hardware.count > 1 ? 0.76 : 1;
  const runtimePenalty = hardware.runtime === "vllm" ? 1.1 : hardware.runtime === "transformers" ? 0.78 : 1;
  const offloadPenalty = grade === "D" ? 0.22 : grade === "C" ? 0.55 : 1;
  const runtimeFactor = getRuntimeFactor(hardware.runtime);
  const activeBytes = Math.max(model.active * quant.bytesPerB, 1);
  const raw = (hardware.bandwidth * hardware.count * multiGpuPenalty * runtimePenalty) / (activeBytes * 4);
  const total = raw * (1 + (hardware.concurrency - 1) * runtimeFactor.concurrencyEfficiency) * offloadPenalty;
  return {
    perRequest: total / hardware.concurrency,
    total,
  };
}

function buildReason(grade, requiredGb, effectiveVram, model, hardware, contextLimitTokens, contextSupported) {
  if (!contextSupported) {
    return `선택한 ${formatContext(hardware.context)} 컨텍스트가 모델 한도 ${formatContext(contextLimitTokens)}를 초과합니다.`;
  }
  if (grade === "F") {
    return `동시 ${hardware.concurrency}명 기준 필요 VRAM 추정치가 ${formatGb(requiredGb)}로 총 VRAM ${formatGb(effectiveVram)}를 크게 초과합니다.`;
  }
  if (grade === "D") {
    return `동시 ${hardware.concurrency}명 기준 GPU 단독 적재는 어렵고 RAM 오프로딩 전제가 필요합니다.`;
  }
  if (grade === "C") {
    return `총 VRAM에 거의 맞습니다. 동시 요청, 컨텍스트 길이, KV cache 정밀도를 낮추는 편이 안정적입니다.`;
  }
  if (model.params >= 60 && hardware.count === 1) {
    return `대형 모델이지만 ${formatGb(effectiveVram)} VRAM에서 선택 양자화 기준 실행 가능 범위입니다.`;
  }
  return `선택한 GPU에서 ${model.params}B급 모델을 ${formatContext(hardware.context)}, 동시 ${hardware.concurrency}명 기준으로 실행 가능한 범위입니다.`;
}

function getFilteredEstimates() {
  const hardware = getHardware();
  const selectedQuant = $("quantization").value;
  const task = $("taskFilter").value;
  const provider = $("providerFilter").value;
  const minGrade = $("gradeFilter").value;
  const search = $("searchInput").value.trim().toLowerCase();

  let estimates = MODELS.map((model) => estimateModel(model, selectedQuant, hardware));

  if (task !== "all") {
    estimates = estimates.filter((estimate) => estimate.model.tags.includes(task));
  }

  if (provider !== "all") {
    estimates = estimates.filter((estimate) => estimate.model.maker === provider);
  }

  if (search) {
    estimates = estimates.filter((estimate) => {
      const haystack = [
        estimate.model.name,
        estimate.model.maker,
        estimate.model.license,
        estimate.model.summary,
        estimate.model.tags.join(" "),
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    });
  }

  if (minGrade !== "all") {
    const minScore = GRADE_META[minGrade].score;
    estimates = estimates.filter((estimate) => GRADE_META[estimate.grade].score >= minScore);
  }

  return sortEstimates(estimates);
}

function sortEstimates(estimates) {
  const sortBy = $("sortBy").value;
  return [...estimates].sort((a, b) => {
    if (sortBy === "sizeAsc") return a.model.params - b.model.params;
    if (sortBy === "sizeDesc") return b.model.params - a.model.params;
    if (sortBy === "speed") return b.speed - a.speed;
    const gradeDiff = GRADE_META[b.grade].score - GRADE_META[a.grade].score;
    if (gradeDiff !== 0) return gradeDiff;
    const pressureDiff = a.pressure - b.pressure;
    if (Math.abs(pressureDiff) > 0.02) return pressureDiff;
    return b.model.params - a.model.params;
  });
}

function render() {
  const hardware = getHardware();
  const estimates = getFilteredEstimates();
  const allEstimates = MODELS.map((model) => estimateModel(model, $("quantization").value, hardware));

  $("totalVram").textContent = formatGb(hardware.vram * hardware.count);
  $("fitCount").textContent = `${allEstimates.filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score).length}개`;
  $("servingLoad").textContent = `${hardware.concurrency}명`;
  $("kvMode").textContent = hardware.kvMeta.label;
  $("hardwareStatus").textContent = `${formatGb(hardware.vram * hardware.count)} · ${formatContext(hardware.context)} · 동시 ${hardware.concurrency}명`;

  renderSummary(allEstimates);
  renderRecommendations(estimates);
  renderModels(estimates);
}

function renderSummary(estimates) {
  const counts = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  estimates.forEach((estimate) => {
    counts[estimate.grade] += 1;
  });

  $("summaryGrid").innerHTML = Object.keys(counts)
    .map((grade) => {
      const meta = GRADE_META[grade];
      return `
        <div class="summary-card">
          <span>${meta.label}</span>
          <strong>${counts[grade]}</strong>
        </div>
      `;
    })
    .join("");
}

function renderRecommendations(estimates) {
  const recommendations = estimates
    .filter((estimate) => GRADE_META[estimate.grade].score >= GRADE_META.B.score)
    .slice(0, 3);

  if (!recommendations.length) {
    $("recommendationBand").innerHTML = `
      <div class="recommendation">
        <span class="rank">추천 없음</span>
        <strong>VRAM 또는 양자화를 조정하세요</strong>
        <p>Q3/Q2, 컨텍스트 4K, GPU 수 증가를 먼저 확인하는 편이 좋습니다.</p>
      </div>
    `;
    return;
  }

  $("recommendationBand").innerHTML = recommendations
    .map((estimate, index) => `
      <div class="recommendation">
        <span class="rank">추천 ${index + 1}</span>
        <strong>${estimate.model.name}</strong>
        <p>${GRADE_META[estimate.grade].label} · ${estimate.quant.label} · 필요 ${formatGb(estimate.requiredGb)} · 예상 ${formatSpeed(estimate.speed)}</p>
      </div>
    `)
    .join("");
}

function renderModels(estimates) {
  if (!estimates.length) {
    $("modelGrid").innerHTML = `<div class="empty-state">조건에 맞는 모델이 없습니다.</div>`;
    return;
  }

  $("modelGrid").innerHTML = estimates.map(renderModelCard).join("");
}

function renderModelCard(estimate) {
  const meta = GRADE_META[estimate.grade];
  const pressurePercent = Math.min(100, Math.round(estimate.pressure * 100));
  const tags = estimate.model.tags.map((tag) => `<span class="tag">${tagLabel(tag)}</span>`).join("");
  return `
    <article class="model-card">
      <div class="model-head">
        <div class="model-title">
          <h3>${estimate.model.name}</h3>
          <p>${estimate.model.maker} · ${estimate.model.license}</p>
        </div>
        <span class="grade-pill ${meta.className}">${meta.label}</span>
      </div>
      <div class="model-body">
        <p class="model-summary">${estimate.model.summary}</p>
        <div class="spec-grid">
          <div class="spec">
            <span>파라미터</span>
            <strong>${formatParams(estimate.model.params)}</strong>
          </div>
          <div class="spec">
            <span>권장 양자화</span>
            <strong>${estimate.quant.label}</strong>
          </div>
          <div class="spec">
            <span>요청당 속도</span>
            <strong>${formatSpeed(estimate.speed)}</strong>
          </div>
          <div class="spec">
            <span>응답 시간</span>
            <strong>${formatDuration(estimate.latencySeconds)}</strong>
          </div>
        </div>
        <div class="bar-wrap">
          <div class="bar-label">
            <span>VRAM 사용률</span>
            <span>${formatGb(estimate.requiredGb)} / ${formatGb(estimate.effectiveVram)}</span>
          </div>
          <div class="bar" style="--bar-color: ${meta.color}">
            <span style="--bar-width: ${pressurePercent}%"></span>
          </div>
        </div>
        <div class="tag-row">${tags}</div>
      </div>
      <div class="model-foot">${estimate.reason} KV cache ${formatGb(estimate.kvGb)}, 전체 처리량 ${formatSpeed(estimate.throughput)} 기준입니다.</div>
    </article>
  `;
}

function tagLabel(tag) {
  const labels = {
    general: "일반",
    korean: "한국어",
    coding: "코딩",
    reasoning: "추론",
    long: "긴 문서",
    edge: "경량",
    vision: "비전",
  };
  return labels[tag] || tag;
}

function formatGb(value) {
  if (value >= 100) return `${Math.round(value)} GB`;
  return `${value.toFixed(1)} GB`;
}

function formatContext(tokens) {
  if (tokens >= 1048576) return `${Math.round(tokens / 1048576)}M`;
  return `${Math.round(tokens / 1024)}K`;
}

function formatParams(value) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}B`;
}

function formatSpeed(value) {
  if (!value) return "불가";
  if (value < 1) return `${value.toFixed(1)} tok/s`;
  return `${Math.round(value)} tok/s`;
}

function formatDuration(seconds) {
  if (!seconds) return "불가";
  if (seconds < 60) return `${Math.round(seconds)}초`;
  return `${Math.floor(seconds / 60)}분 ${Math.round(seconds % 60)}초`;
}

async function detectGpu() {
  const status = $("hardwareStatus");
  if (!navigator.gpu) {
    status.textContent = "이 브라우저는 WebGPU 감지를 지원하지 않습니다";
    return;
  }

  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      status.textContent = "GPU 어댑터를 찾지 못했습니다";
      return;
    }

    let info = {};
    if (typeof adapter.requestAdapterInfo === "function") {
      info = await adapter.requestAdapterInfo();
    }

    const detected = [info.vendor, info.architecture, info.device, info.description]
      .filter(Boolean)
      .join(" ");
    status.textContent = detected || "GPU가 감지됐지만 모델명 정보가 제한됩니다";
  } catch (error) {
    status.textContent = "GPU 감지 권한 또는 브라우저 설정을 확인하세요";
  }
}

document.addEventListener("DOMContentLoaded", init);
