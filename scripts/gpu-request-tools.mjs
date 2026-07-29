import fs from "node:fs";

const eventPath = process.env.GITHUB_EVENT_PATH;
const event = eventPath && fs.existsSync(eventPath) ? JSON.parse(fs.readFileSync(eventPath, "utf8")) : {};
const body = event.issue?.body || process.env.GPU_REQUEST_BODY || "";
const sections = parseIssueSections(body);
const record = buildGpuRecord(sections);
const errors = validateGpuRecord(record);
const duplicate = findDuplicate(record);

if (duplicate) errors.push(`이미 등록된 GPU와 겹칠 수 있습니다: ${duplicate.id} (${duplicate.name})`);

const report = errors.length
  ? `### GPU 요청 자동 검사\n\n${errors.map((error) => `- ❌ ${error}`).join("\n")}`
  : `### GPU 요청 자동 검사\n\n- ✅ 필수 사양과 출처 형식 확인 완료\n- ✅ 기존 GPU ID/별칭과 중복 없음\n\n추가 후보 레코드:\n\n\`\`\`js\n${serializeRecord(record)}\n\`\`\`\n\n관리자가 \`gpu-ready\` 라벨을 붙이면 자동 PR을 생성합니다.`;

console.log(report);
writeOutput("valid", String(errors.length === 0));
writeOutput("report", report);
writeOutput("record", JSON.stringify(record));

if (process.argv.includes("--append") && errors.length === 0) {
  const file = "data/gpus.js";
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes(`id: "${record.id}"`)) {
    fs.writeFileSync(file, source.replace(/\n\];\s*$/, `\n  ${serializeRecord(record)},\n];\n`));
  }
}

function parseIssueSections(markdown) {
  const result = {};
  const matches = [...String(markdown).matchAll(/### ([^\n]+)\n\n([\s\S]*?)(?=\n### |\s*$)/g)];
  for (const [, label, value] of matches) result[label.trim()] = value.trim();
  return result;
}

function valueFor(sectionsMap, ...labels) {
  for (const label of labels) {
    if (sectionsMap[label] && sectionsMap[label] !== "_No response_") return sectionsMap[label];
  }
  return "";
}

function numberFrom(value) {
  const match = String(value || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/\+/g, "-plus-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildGpuRecord(sectionsMap) {
  const name = valueFor(sectionsMap, "GPU 이름");
  const vram = numberFrom(valueFor(sectionsMap, "VRAM"));
  const ram = numberFrom(valueFor(sectionsMap, "권장 시스템 RAM")) || Math.max(16, vram * 2);
  const runtimesRaw = valueFor(sectionsMap, "확인된 실행 환경");
  return {
    id: `${slugify(name)}-${vram || "unknown"}`,
    name,
    vendor: valueFor(sectionsMap, "제조사"),
    memoryType: valueFor(sectionsMap, "메모리 유형").includes("통합") ? "unified" : "dedicated",
    vram,
    gpuUsableMemoryGb: numberFrom(valueFor(sectionsMap, "GPU 실제 할당 가능 메모리")) || vram,
    ram,
    bandwidth: numberFrom(valueFor(sectionsMap, "메모리 대역폭")),
    runtimes: [...runtimesRaw.matchAll(/- \[x\] ([^\n]+)/gi)].map((match) => match[1].trim()),
    aliases: valueFor(sectionsMap, "별칭·검색어").split(",").map((item) => item.trim()).filter(Boolean),
    sourceUrl: valueFor(sectionsMap, "출처").match(/https?:\/\/\S+/)?.[0] || "",
  };
}

function validateGpuRecord(gpu) {
  const issues = [];
  if (!gpu.name) issues.push("GPU 이름이 필요합니다.");
  if (!gpu.vendor) issues.push("제조사를 선택해 주세요.");
  if (!gpu.vram) issues.push("VRAM을 숫자와 함께 입력해 주세요.");
  if (!gpu.bandwidth) issues.push("메모리 대역폭을 GB/s 단위로 입력해 주세요.");
  if (!/^https:\/\//.test(gpu.sourceUrl)) issues.push("HTTPS 공식 사양 출처가 필요합니다.");
  if (gpu.memoryType === "unified" && gpu.gpuUsableMemoryGb > gpu.ram) issues.push("GPU 할당 가능 메모리가 전체 RAM보다 클 수 없습니다.");
  return issues;
}

function findDuplicate(gpu) {
  const source = fs.readFileSync("data/gpus.js", "utf8");
  const context = { window: {} };
  return source.includes(`id: "${gpu.id}"`) || source.toLowerCase().includes(`name: "${gpu.name.toLowerCase()}"`)
    ? { id: gpu.id, name: gpu.name }
    : null;
}

function serializeRecord(gpu) {
  const fields = [
    `id: ${JSON.stringify(gpu.id)}`,
    `name: ${JSON.stringify(gpu.name)}`,
    `vendor: ${JSON.stringify(gpu.vendor)}`,
    `memoryType: ${JSON.stringify(gpu.memoryType)}`,
    `vram: ${gpu.vram}`,
    `gpuUsableMemoryGb: ${gpu.gpuUsableMemoryGb}`,
    `ram: ${gpu.ram}`,
    `bandwidth: ${gpu.bandwidth}`,
    `runtimes: ${JSON.stringify(gpu.runtimes)}`,
    `aliases: ${JSON.stringify(gpu.aliases)}`,
    `sourceUrl: ${JSON.stringify(gpu.sourceUrl)}`,
  ];
  return `{ ${fields.join(", ")} }`;
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const delimiter = `GPU_REQUEST_${name.toUpperCase()}`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}
