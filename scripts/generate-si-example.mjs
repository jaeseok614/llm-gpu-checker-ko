import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

const modulePath = process.env.ARTIFACT_TOOL_PATH;
if (!modulePath) throw new Error("Set ARTIFACT_TOOL_PATH to the bundled @oai/artifact-tool package directory.");
const { SpreadsheetFile, Workbook } = await import(pathToFileURL(modulePath).href);

const workbook = Workbook.create();
const requirements = workbook.worksheets.add("고객 요구사항");
const options = workbook.worksheets.add("구성안 비교");
const poc = workbook.worksheets.add("PoC 체크리스트");

requirements.showGridLines = false;
requirements.getRange("A1:D1").merge();
requirements.getRange("A1").values = [["AI Infra Sizing Assistant · 상담 예제"]];
requirements.getRange("A1:D1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 }, rowHeight: 32 };
requirements.getRange("A3:B13").values = [
  ["항목", "입력값"], ["프로젝트", "사내 문서 RAG 구축"], ["구축 목적", "사내 문서 검색·질의응답"],
  ["주 모델", "Qwen 계열 32B"], ["전체 사용자", 100], ["동시 요청", 10], ["평균 입력 토큰", 4096],
  ["평균 출력 토큰", 500], ["목표 응답시간", "8초"], ["가용성", "HA"], ["트래픽 증가 여유", "30%"],
];
requirements.getRange("A3:B3").format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
requirements.getRange("A3:B13").format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
requirements.getRange("A:A").format.columnWidth = 24;
requirements.getRange("B:B").format.columnWidth = 40;
requirements.freezePanes.freezeRows(3);

options.showGridLines = false;
options.getRange("A1:K1").merge();
options.getRange("A1").values = [["경제형 · 권장형 · 확장형 비교"]];
options.getRange("A1:K1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 }, rowHeight: 32 };
options.getRange("A3:K6").values = [
  ["구성안", "GPU", "GPU 수", "노드", "CPU 코어", "RAM GB", "NVMe TB", "네트워크", "전력 W", "신뢰도", "용도"],
  ["경제형", "RTX 6000 Ada 48GB", 2, 1, 32, 256, 2, "25GbE", 2500, "낮음", "PoC·제한 운영"],
  ["권장형", "H100 PCIe 80GB", 2, 1, 48, 512, 3, "100GbE", 3500, "중간", "운영 권장"],
  ["확장형", "H200 SXM 141GB", 4, 1, 64, 1024, 4, "200GbE 검토", 6000, "중간", "성장·이중화"],
];
options.getRange("A3:K3").format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
options.getRange("A3:K6").format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
options.getRange("C4:I6").format.numberFormat = "#,##0";
options.getRange("A:K").format.columnWidth = 16;
options.getRange("B:B").format.columnWidth = 28;
options.freezePanes.freezeRows(3);

poc.showGridLines = false;
poc.getRange("A1:D1").merge();
poc.getRange("A1").values = [["PoC 검증 및 제안 가정"]];
poc.getRange("A1:D1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 }, rowHeight: 32 };
poc.getRange("A3:D10").values = [
  ["상태", "검증 항목", "합격 기준", "비고"], ["미착수", "모델 버전·양자화·런타임 확정", "배포 대상과 동일", ""],
  ["미착수", "TTFT 측정", "2초 이내", "대표 프롬프트"], ["미착수", "생성 속도", "목표 tokens/s 충족", "P50/P95"],
  ["미착수", "동시 요청 부하", "10명·오류율 1% 미만", "큐 대기 포함"], ["미착수", "장애 전환", "서비스 목표 충족", "HA"],
  ["미착수", "모니터링", "GPU·지연·오류 수집", ""], ["주의", "최종 수량", "실제 PoC 후 확정", "사전 산정값은 계약 보장 아님"],
];
poc.getRange("A3:D3").format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
poc.getRange("A4:A9").dataValidation = { rule: { type: "list", values: ["미착수", "진행", "완료", "주의"] } };
poc.getRange("A3:D10").format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
poc.getRange("A:A").format.columnWidth = 14;
poc.getRange("B:B").format.columnWidth = 34;
poc.getRange("C:C").format.columnWidth = 30;
poc.getRange("D:D").format.columnWidth = 24;
poc.freezePanes.freezeRows(3);

await fs.mkdir("docs/examples", { recursive: true });
const preview = await workbook.render({ sheetName: "구성안 비교", autoCrop: "all", scale: 1, format: "png" });
await fs.writeFile("docs/examples/si-sizing-example.png", new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("docs/examples/si-sizing-example.xlsx");
const inspection = await workbook.inspect({ kind: "sheet,region", range: "A1:K10", maxChars: 4000 });
console.log(inspection.ndjson);
