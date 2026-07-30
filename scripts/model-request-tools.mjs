import fs from "node:fs";

const eventPath = process.env.GITHUB_EVENT_PATH;
const event = eventPath && fs.existsSync(eventPath) ? JSON.parse(fs.readFileSync(eventPath, "utf8")) : {};
const body = event.issue?.body || process.env.MODEL_REQUEST_BODY || "";
const sections = Object.fromEntries([...body.matchAll(/### ([^\n]+)\n\n([\s\S]*?)(?=\n### |\s*$)/g)].map(([, key, value]) => [key.trim(), value.trim()]));
const get = (...keys) => keys.map((key) => sections[key]).find((value) => value && value !== "_No response_") || "";
const workloadLabel = get("워크로드", "Workload");
const workload = workloadFromLabel(workloadLabel);
const params = Number((get("파라미터 수", "Parameters").replace(/,/g, "").match(/\d+(?:\.\d+)?/) || [0])[0]);
const requestedUseCases = normalizeUseCases(get("주요 용도", "Use cases"));
const record = {
  name: get("모델 이름", "Model name"),
  provider: get("제공자", "Provider"),
  params,
  active: params,
  license: get("라이선스", "License"),
  language: get("언어", "Language") || "multilingual",
  useCases: requestedUseCases,
  summary: { ko: get("요약", "Summary") || "커뮤니티 요청으로 추가된 모델입니다.", en: "Model added from a validated community request." },
  sourceUrl: (get("공식 모델 카드", "Official model card").match(/https:\/\/\S+/) || [""])[0],
  licenseUrl: (get("라이선스 출처", "License source").match(/https:\/\/\S+/) || [""])[0],
};
const errors = [];
if (!record.name) errors.push("모델 이름이 필요합니다.");
if (!workload) errors.push("지원되는 워크로드를 선택해 주세요.");
if (!record.provider) errors.push("제공자가 필요합니다.");
if (!record.params) errors.push("파라미터 수를 숫자로 입력해 주세요.");
if (!record.license) errors.push("라이선스가 필요합니다.");
if (!record.useCases.length) errors.push("주요 용도를 하나 이상 입력해 주세요.");
if (!/^https:\/\/(huggingface\.co|github\.com)\//.test(record.sourceUrl)) errors.push("Hugging Face 또는 GitHub의 공식 모델 카드가 필요합니다.");
if (!/^https:\/\//.test(record.licenseUrl)) errors.push("HTTPS 라이선스 출처가 필요합니다.");
const target = targetFor(workload);
if (target && fs.readFileSync(target, "utf8").toLowerCase().includes(`name: "${record.name.toLowerCase()}"`)) errors.push("같은 이름의 모델이 이미 등록되어 있습니다.");
const serialized = `{ name: ${JSON.stringify(record.name)}, provider: ${JSON.stringify(record.provider)}, params: ${record.params}, active: ${record.active}, license: ${JSON.stringify(record.license)}, language: ${JSON.stringify(record.language)}, useCases: ${JSON.stringify(record.useCases)}, tags: ${JSON.stringify(record.useCases.filter((value) => ["general", "korean", "coding", "reasoning", "long", "vision", "retrieval", "multilingual", "document", "table", "handwriting", "math", "video", "realtime"].includes(value)))}, summary: ${JSON.stringify(record.summary)}, sourceUrl: ${JSON.stringify(record.sourceUrl)}, licenseUrl: ${JSON.stringify(record.licenseUrl)}${workload.startsWith("audio-") ? `, type: ${JSON.stringify(workload)}` : ""} }`;
const report = errors.length
  ? `### Model request validation\n\n${errors.map((error) => `- ❌ ${error}`).join("\n")}`
  : `### Model request validation\n\n- ✅ Required metadata and sources are valid\n- ✅ No duplicate model name was found\n\n| Field | Value |\n| --- | --- |\n| Workload | ${workload} |\n| Model | ${record.name} |\n| Parameters | ${record.params}B |\n| License | ${record.license} |\n| Use cases | ${record.useCases.join(", ")} |\n| Target | ${target} |\n\n\`\`\`js\n${serialized}\n\`\`\`\n\nAdding the \`model-ready\` label will create a data PR.`;
console.log(report);
output("valid", String(errors.length === 0));
output("report", report);
if (process.argv.includes("--append") && !errors.length) {
  const source = fs.readFileSync(target, "utf8");
  const position = source.lastIndexOf("\n];");
  if (position < 0) throw new Error(`Could not locate catalog array in ${target}`);
  fs.writeFileSync(target, `${source.slice(0, position)}\n  ${serialized},${source.slice(position)}`);
}

function workloadFromLabel(label) {
  if (/LLM/i.test(label)) return "generative";
  if (/임베딩|embedding/i.test(label)) return "embedding";
  if (/리랭커|reranker/i.test(label)) return "reranker";
  if (/이미지|image/i.test(label)) return "image-generation";
  if (/비디오|video/i.test(label)) return "video-generation";
  if (/STT|음성 인식/i.test(label)) return "audio-stt";
  if (/TTS|음성 합성/i.test(label)) return "audio-tts";
  if (/OCR|VLM/i.test(label)) return "vision";
  return "";
}
function targetFor(type) {
  if (type === "generative") return "data/models.js";
  if (type === "embedding") return "data/embedding-models.js";
  if (type === "reranker") return "data/reranker-models.js";
  if (type === "audio-stt" || type === "audio-tts") return "data/audio-models.js";
  return "data/ocr-models.js";
}
function normalizeUseCases(value) {
  const aliases = {
    "일반 대화": "general", "비서": "general", chat: "general",
    "한국어": "korean", korean: "korean",
    "코딩": "coding", coding: "coding",
    "추론": "reasoning", "수학": "reasoning", reasoning: "reasoning",
    "긴 문서": "long", long: "long",
    rag: "retrieval", "검색": "retrieval", retrieval: "retrieval",
    "다국어": "multilingual", multilingual: "multilingual",
    "문서": "document", document: "document",
    "표": "table", table: "table",
    "손글씨": "handwriting", handwriting: "handwriting",
    "이미지": "image", image: "image",
    "비디오": "video", video: "video",
    "립싱크": "lipSync", "말하는 아바타": "talkingHead",
    "음성 복제": "voiceCloning", "목소리 복제": "voiceCloning",
    "실시간 자막": "realtime", "실시간": "realtime", realtime: "realtime",
    "받아쓰기": "transcription", transcription: "transcription",
  };
  return [...new Set(String(value || "").split(/[,/\n]+/).map((item) => {
    const normalized = item.trim();
    return aliases[normalized] || aliases[normalized.toLowerCase()] || "";
  }).filter(Boolean))];
}
function output(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const marker = `MODEL_REQUEST_${name.toUpperCase()}`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${marker}\n${value}\n${marker}\n`);
}
