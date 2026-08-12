// Hugging Face model import — parsing, fetching, and normalizing a public
// HF repo into a GENERATIVE_MODELS entry the rest of the app can estimate
// against. Extracted from app.js (2026-08) to keep app.js focused on UI
// wiring, matching the features/estimation-engine.js precedent.
// Loaded as a plain global script alongside app.js (no bundler/ES modules,
// matching the rest of features/*.js) — relies on top-level consts defined
// in app.js ($, GENERATIVE_MODELS, HF_MODEL_STORAGE_KEY, MAX_IMPORTED_HF_MODELS,
// activeWorkload, activeSummaryFilter, selectedModelKey) and functions
// (refreshWorkloadUi, refreshFilterOptions, modelKey, formatContext, render),
// all of which are already set by the time any of these functions actually
// run (post-DOMContentLoaded, triggered by user interaction with the
// "Hugging Face 공개 LLM 직접 계산" form).

function restoreImportedHfModels() {
  try {
    const stored = JSON.parse(window.localStorage?.getItem(HF_MODEL_STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) return;
    stored.slice(0, MAX_IMPORTED_HF_MODELS).forEach((record) => {
      const repoId = parseHfRepoId(record?.name);
      const params = Number(record?.params);
      if (!repoId || !Number.isFinite(params) || params <= 0) return;
      if (GENERATIVE_MODELS.some((model) => model.name === repoId)) return;
      GENERATIVE_MODELS.push({
        name: repoId,
        maker: String(record.maker || repoId.split("/")[0]),
        params,
        active: Math.min(params, Math.max(0.01, Number(record.active) || params)),
        context: Math.min(1024, Math.max(0.5, Number(record.context) || 8)),
        license: String(record.license || "원문 확인 필요"),
        tags: Array.isArray(record.tags) && record.tags.length ? record.tags.map(String) : ["general"],
        summary: String(record.summary || "Hugging Face 공개 API에서 불러온 사용자 모델입니다."),
        sourceUrl: `https://huggingface.co/${repoId}`,
        releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(record.releaseDate || "") ? record.releaseDate : "",
        type: "generative",
        hfImported: true,
      });
    });
  } catch {
    // localStorage를 사용할 수 없는 환경에서도 기본 계산기는 그대로 동작합니다.
  }
}

function persistImportedHfModels() {
  try {
    const imported = GENERATIVE_MODELS.filter((model) => model.hfImported);
    window.localStorage?.setItem(HF_MODEL_STORAGE_KEY, JSON.stringify(imported));
  } catch {
    // 저장이 차단된 브라우저에서는 현재 탭에서만 유지합니다.
  }
}

function parseHfRepoId(input) {
  let value = String(input || "").trim();
  if (!value) return "";
  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      if (url.hostname !== "huggingface.co" && url.hostname !== "www.huggingface.co") return "";
      value = url.pathname.replace(/^\/+/, "");
    }
  } catch {
    return "";
  }
  value = value.replace(/^models\//, "").split(/[?#]/)[0];
  const parts = value.split("/").filter(Boolean);
  if (parts.length < 2) return "";
  const repoId = `${parts[0]}/${parts[1]}`;
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(repoId) ? repoId : "";
}

function normalizeHfLicense(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();
  const known = {
    "apache-2.0": "Apache 2.0",
    apache2: "Apache 2.0",
    mit: "MIT",
    "gpl-3.0": "GPL-3.0",
    "gpl-3.0-only": "GPL-3.0",
    "gpl-3.0-or-later": "GPL-3.0",
    "cc-by-nc-4.0": "CC BY-NC 4.0",
    "cc-by-nc": "CC BY-NC",
    gemma: "Gemma",
    "gemma-terms-of-use": "Gemma",
    "llama3.1": "Llama 3.1 Community",
    "llama3.2": "Llama 3.2 Community",
    "llama3.3": "Llama 3.3 Community",
    "llama4": "Llama 4 Community",
    qwen: "Qwen",
    "qwen-research": "Qwen Research",
    deepseek: "DeepSeek",
    "glm-4": "GLM-4",
    "openrail-m": "OpenRAIL-M",
    "creativeml-openrail-m": "OpenRAIL-M",
    "nvidia-open-model-license": "NVIDIA Open",
    falcon: "Falcon",
  };
  if (known[key]) return known[key];
  if (key.startsWith("llama")) return "Llama";
  if (key === "other" || !raw) return "원문 확인 필요";
  return raw;
}

function extractHfParameterCount(info) {
  const total = Number(info?.safetensors?.total);
  if (Number.isFinite(total) && total > 0) return total;
  const byDtype = info?.safetensors?.parameters;
  if (!byDtype || typeof byDtype !== "object") return 0;
  return Object.values(byDtype).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function extractHfContextTokens(config) {
  const candidates = [
    config?.max_position_embeddings,
    config?.max_seq_len,
    config?.max_sequence_length,
    config?.seq_length,
    config?.n_positions,
    config?.text_config?.max_position_embeddings,
  ].map(Number).filter((value) => Number.isFinite(value) && value >= 512 && value <= 1048576);
  return candidates[0] || 8192;
}

function estimateHfActiveParams(totalBillions, config) {
  const expertCount = Number(config?.num_local_experts || config?.num_experts || config?.n_routed_experts);
  const expertsPerToken = Number(config?.num_experts_per_tok || config?.num_experts_per_token || config?.num_selected_experts);
  const sharedExperts = Number(config?.n_shared_experts || config?.num_shared_experts || 0);
  if (!Number.isFinite(expertCount) || !Number.isFinite(expertsPerToken) || expertCount <= 1 || expertsPerToken <= 0) {
    return { active: totalBillions, inferredMoe: false };
  }
  const routedRatio = Math.min(1, (expertsPerToken + Math.max(0, sharedExperts)) / expertCount);
  const active = totalBillions * Math.min(1, 0.03 + routedRatio * 0.97);
  return { active: Math.max(0.01, Math.round(active * 1000) / 1000), inferredMoe: true };
}

function buildHfTags(repoId, info, config, contextTokens, totalBillions) {
  const text = [repoId, info?.pipeline_tag, ...(info?.tags || []), ...(config?.architectures || [])].join(" ").toLowerCase();
  const tags = new Set(["general"]);
  const languages = Array.isArray(info?.cardData?.language) ? info.cardData.language.map(String) : [String(info?.cardData?.language || "")];
  if (languages.some((language) => /^(ko|kor|korean)$/i.test(language))) tags.add("korean");
  if (/code|coder|fill-mask/.test(text)) tags.add("coding");
  if (/reason|thinking|math/.test(text)) tags.add("reasoning");
  if (/vision|visual|image|multimodal/.test(text)) tags.add("vision");
  if (contextTokens >= 32768) tags.add("long");
  if (totalBillions <= 4) tags.add("edge");
  return [...tags];
}

async function importHfModel(event) {
  event.preventDefault();
  const repoId = parseHfRepoId($("hfModelInput").value);
  if (!repoId) {
    setHfImportStatus("owner/repo 형식의 모델 ID 또는 huggingface.co 모델 주소를 입력해 주세요.", "error");
    return;
  }

  const existingImported = GENERATIVE_MODELS.find((model) => model.name === repoId && model.hfImported);
  if (!existingImported && GENERATIVE_MODELS.filter((model) => model.hfImported).length >= MAX_IMPORTED_HF_MODELS) {
    setHfImportStatus(`직접 불러온 모델은 최대 ${MAX_IMPORTED_HF_MODELS}개까지 저장할 수 있습니다.`, "error");
    return;
  }

  const button = $("hfImportButton");
  button.disabled = true;
  setHfImportStatus("Hugging Face에서 safetensors와 config를 확인하는 중입니다…", "loading");
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 20000);

  try {
    const encodedRepo = repoId.split("/").map(encodeURIComponent).join("/");
    const query = new URLSearchParams();
    ["author", "cardData", "config", "createdAt", "pipeline_tag", "safetensors", "tags"].forEach((field) => query.append("expand", field));
    const response = await fetch(`https://huggingface.co/api/models/${encodedRepo}?${query.toString()}`, { signal: controller.signal });
    if (!response.ok) {
      if ([401, 403].includes(response.status)) throw new Error("접근 승인이 필요한 모델이라 공개 API로 읽을 수 없습니다.");
      if (response.status === 404) throw new Error("해당 Hugging Face 모델 저장소를 찾지 못했습니다.");
      throw new Error(`Hugging Face API 오류 (${response.status})`);
    }
    const info = await response.json();
    const supportedPipelines = new Set(["text-generation", "text2text-generation", "conversational"]);
    if (info.pipeline_tag && !supportedPipelines.has(info.pipeline_tag)) {
      throw new Error(`현재 직접 가져오기는 생성형 LLM만 지원합니다. 이 모델 유형은 ${info.pipeline_tag}입니다.`);
    }
    let config = info.config || {};
    try {
      const configResponse = await fetch(`https://huggingface.co/${encodedRepo}/resolve/main/config.json`, { signal: controller.signal });
      if (configResponse.ok) config = await configResponse.json();
    } catch {
      // 일부 저장소는 config.json이 없지만 API의 기본 정보만으로도 가져올 수 있습니다.
    }

    const parameterCount = extractHfParameterCount(info);
    if (!parameterCount) throw new Error("공개 safetensors 파라미터 수가 없어 자동 계산할 수 없습니다.");
    const params = Math.round((parameterCount / 1e9) * 1000) / 1000;
    const contextTokens = extractHfContextTokens(config);
    const activeInfo = estimateHfActiveParams(params, config);
    const releaseDate = /^\d{4}-\d{2}-\d{2}/.test(info.createdAt || "") ? info.createdAt.slice(0, 10) : "";
    const license = normalizeHfLicense(info.cardData?.license);
    const tags = buildHfTags(repoId, info, config, contextTokens, params);
    const summary = activeInfo.inferredMoe
      ? `Hugging Face 공개 API에서 불러온 모델입니다. 전체 ${params}B, MoE config 기반 활성 ${activeInfo.active}B 추정치입니다.`
      : `Hugging Face 공개 API에서 불러온 모델입니다. safetensors 기준 ${params}B 파라미터를 사용합니다.`;
    const importedModel = {
      name: repoId,
      maker: String(info.author || repoId.split("/")[0]),
      params,
      active: activeInfo.active,
      context: Math.max(0.5, contextTokens / 1024),
      license,
      tags,
      summary,
      sourceUrl: `https://huggingface.co/${repoId}`,
      releaseDate,
      type: "generative",
      hfImported: true,
    };

    const existingIndex = GENERATIVE_MODELS.findIndex((model) => model.name === repoId && model.hfImported);
    if (existingIndex >= 0) GENERATIVE_MODELS.splice(existingIndex, 1, importedModel);
    else GENERATIVE_MODELS.push(importedModel);
    persistImportedHfModels();
    activeWorkload = "generative";
    activeSummaryFilter = "all";
    $("searchInput").value = repoId;
    refreshWorkloadUi();
    refreshFilterOptions();
    selectedModelKey = modelKey(importedModel);
    refreshHfImportUi();
    setHfImportStatus(`${repoId}: ${params}B · 최대 ${formatContext(contextTokens)} · ${license}로 계산 목록에 추가했습니다.`, "success");
    render();
  } catch (error) {
    const message = error?.name === "AbortError" ? "요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요." : error?.message;
    setHfImportStatus(message || "모델 정보를 가져오지 못했습니다.", "error");
  } finally {
    window.clearTimeout(timeoutId);
    button.disabled = false;
  }
}

function clearImportedHfModels() {
  const importedNames = new Set(GENERATIVE_MODELS.filter((model) => model.hfImported).map((model) => model.name));
  if (!importedNames.size) {
    setHfImportStatus("현재 브라우저에 저장된 직접 불러오기 모델이 없습니다.", "neutral");
    return;
  }
  for (let index = GENERATIVE_MODELS.length - 1; index >= 0; index -= 1) {
    if (GENERATIVE_MODELS[index].hfImported) GENERATIVE_MODELS.splice(index, 1);
  }
  try {
    window.localStorage?.removeItem(HF_MODEL_STORAGE_KEY);
  } catch {
    // 저장소 삭제가 막혀도 현재 목록에서는 제거됩니다.
  }
  if (selectedModelKey && !getModelByKey(selectedModelKey)) selectedModelKey = "";
  if (importedNames.has($("searchInput").value)) $("searchInput").value = "";
  refreshFilterOptions();
  refreshHfImportUi();
  setHfImportStatus(`${importedNames.size}개 모델을 현재 브라우저 목록에서 지웠습니다.`, "success");
  render();
}

function refreshHfImportUi() {
  const count = GENERATIVE_MODELS.filter((model) => model.hfImported).length;
  $("hfClearButton").disabled = count === 0;
  $("hfClearButton").textContent = count ? `불러온 모델 지우기 (${count})` : "불러온 모델 지우기";
}

function setHfImportStatus(message, type) {
  const target = $("hfImportStatus");
  target.textContent = message;
  target.className = type ? `is-${type}` : "";
}
