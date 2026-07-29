import fs from "node:fs";

const eventPath = process.env.GITHUB_EVENT_PATH;
const event = eventPath && fs.existsSync(eventPath) ? JSON.parse(fs.readFileSync(eventPath, "utf8")) : {};
const body = event.issue?.body || process.env.GPU_REQUEST_BODY || "";
const sections = parseIssueSections(body);
const record = buildGpuRecord(sections);
const errors = validateGpuRecord(record);
const duplicate = findDuplicate(record);
if (duplicate) errors.push(`이미 등록된 GPU와 중복됩니다: ${duplicate}`);

const preview = [
  ["ID", record.id],
  ["GPU", record.name],
  ["Vendor / architecture", `${record.vendor} / ${record.architecture}`],
  ["Memory", `${record.gpuUsableMemoryGb}/${record.vram} GB (${record.memoryType})`],
  ["Bandwidth", `${record.bandwidth} GB/s`],
  ["Form factor", record.formFactor],
  ["Runtime", record.runtimes.join(", ")],
  ["Source", record.sourceUrl],
].map(([key, value]) => `| ${key} | ${value || "—"} |`).join("\n");

const report = errors.length
  ? `### GPU request validation\n\n${errors.map((error) => `- ❌ ${error}`).join("\n")}`
  : `### GPU request validation\n\n- ✅ Required specifications and source format are valid\n- ✅ No duplicate ID or model name was found\n\n| Field | Proposed value |\n| --- | --- |\n${preview}\n\n\`\`\`js\n${serializeRecord(record)}\n\`\`\`\n\nAdding the \`gpu-ready\` label will create a data PR automatically.`;

console.log(report);
writeOutput("valid", String(errors.length === 0));
writeOutput("report", report);
writeOutput("record", JSON.stringify(record));

if (process.argv.includes("--append") && errors.length === 0) {
  const file = "data/gpus.js";
  const source = fs.readFileSync(file, "utf8");
  if (!source.includes(`id: "${record.id}"`)) {
    fs.writeFileSync(file, source.replace(/\n\];\s*window\.LLM_GPU_CHECKER_DATA\.gpus =/, `\n  ${serializeRecord(record)},\n];\n\nwindow.LLM_GPU_CHECKER_DATA.gpus =`));
  }
}

function parseIssueSections(markdown) {
  const result = {};
  for (const [, label, value] of String(markdown).matchAll(/### ([^\n]+)\n\n([\s\S]*?)(?=\n### |\s*$)/g)) {
    result[label.trim()] = value.trim();
  }
  return result;
}

function valueFor(...labels) {
  for (const label of labels) {
    const value = sections[label];
    if (value && value !== "_No response_") return value;
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

function buildGpuRecord() {
  const name = valueFor("GPU 이름", "GPU name");
  const vram = numberFrom(valueFor("VRAM"));
  const formFactorText = valueFor("폼팩터", "Form factor").toLowerCase();
  const memoryText = valueFor("메모리 유형", "Memory type").toLowerCase();
  const runtimesRaw = valueFor("확인된 실행 환경", "Supported runtimes");
  return {
    id: `${slugify(name)}-${vram || "unknown"}`,
    name,
    vendor: valueFor("제조사", "Vendor"),
    architecture: valueFor("아키텍처", "Architecture") || "Unspecified",
    memoryType: /통합|unified/.test(memoryText) ? "unified" : "dedicated",
    vram,
    gpuUsableMemoryGb: numberFrom(valueFor("GPU 실제 할당 가능 메모리", "GPU-usable memory")) || vram,
    ram: numberFrom(valueFor("권장 시스템 RAM", "Recommended system RAM")) || Math.max(16, vram * 2),
    bandwidth: numberFrom(valueFor("메모리 대역폭", "Memory bandwidth")),
    formFactor: /노트북|laptop/.test(formFactorText) ? "laptop" : /data|서버/.test(formFactorText) ? "datacenter" : /통합|integrated/.test(formFactorText) ? "integrated" : "desktop",
    tgpMinW: numberFrom(valueFor("최소 TGP", "Minimum TGP")) || undefined,
    tgpMaxW: numberFrom(valueFor("최대 TGP", "Maximum TGP")) || undefined,
    tbpW: numberFrom(valueFor("소비전력", "Board power")) || undefined,
    msrpUsd: numberFrom(valueFor("출시 가격", "Launch MSRP")) || undefined,
    runtimes: [...runtimesRaw.matchAll(/- \[x\] ([^\n]+)/gi)].map((match) => match[1].trim()),
    aliases: valueFor("별칭·검색어", "Aliases").split(",").map((item) => item.trim()).filter(Boolean),
    sourceUrl: valueFor("출처", "Source").match(/https?:\/\/\S+/)?.[0] || "",
    verifiedAt: new Date().toISOString().slice(0, 10),
  };
}

function validateGpuRecord(gpu) {
  const issues = [];
  if (!gpu.name) issues.push("GPU 이름이 필요합니다.");
  if (!gpu.vendor) issues.push("제조사를 선택해 주세요.");
  if (!gpu.vram) issues.push("VRAM을 숫자로 입력해 주세요.");
  if (!gpu.bandwidth) issues.push("메모리 대역폭을 GB/s 단위로 입력해 주세요.");
  if (!/^https:\/\/(www\.)?(nvidia|amd|intel|apple)\.com\//i.test(gpu.sourceUrl)) issues.push("제조사 공식 HTTPS 사양 출처가 필요합니다.");
  if (gpu.memoryType === "unified" && gpu.gpuUsableMemoryGb > gpu.ram) issues.push("GPU 할당 가능 메모리가 전체 RAM보다 클 수 없습니다.");
  if (gpu.formFactor === "laptop" && (!gpu.tgpMinW || !gpu.tgpMaxW || gpu.tgpMinW > gpu.tgpMaxW)) issues.push("노트북 GPU는 올바른 최소·최대 TGP가 필요합니다.");
  return issues;
}

function findDuplicate(gpu) {
  const source = fs.readFileSync("data/gpus.js", "utf8").toLowerCase();
  if (source.includes(`id: "${gpu.id.toLowerCase()}"`)) return gpu.id;
  if (gpu.name && source.includes(`name: "${gpu.name.toLowerCase()}"`)) return gpu.name;
  return "";
}

function serializeRecord(gpu) {
  const fields = Object.entries(gpu)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `{ ${fields.join(", ")} }`;
}

function writeOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  const delimiter = `GPU_REQUEST_${name.toUpperCase()}`;
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${delimiter}\n${value}\n${delimiter}\n`);
}
