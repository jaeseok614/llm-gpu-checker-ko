import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const workbook = Workbook.create();
const requirements = workbook.worksheets.add("고객 요구사항");
const assumptions = workbook.worksheets.add("가격·TCO 가정");
const options = workbook.worksheets.add("구성안 비교");
const bom = workbook.worksheets.add("인프라 BOM");
const poc = workbook.worksheets.add("PoC 체크리스트");

requirements.showGridLines = false;
requirements.getRange("A1:D1").merge();
requirements.getRange("A1").values = [["AI Infra Sizing Assistant · 상담 예제"]];
requirements.getRange("A1:D1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 }, rowHeight: 32 };
requirements.getRange("A3:B22").values = [
  ["항목", "입력값"], ["프로젝트", "사내 문서 RAG 구축"], ["구축 목적", "사내 문서 검색·질의응답"],
  ["고객 업종", "제조·일반기업"], ["상담 담당자", ""], ["보안", "내부망·외부 반출 불가"], ["주 모델", "Qwen 계열 32B"],
  ["전체 사용자", 100], ["동시 요청", 10], ["QPS", 1.25], ["평균 입력 토큰", 4096], ["최대 입력 토큰", 16384],
  ["평균 출력 토큰", 500], ["TTFT p95", 2], ["전체 지연 p95", 12], ["일 운영시간", 24],
  ["가용성", "HA"], ["트래픽 증가 여유", 0.3], ["벡터 데이터 GB", 500], ["로그 GB/일", 10],
];
requirements.getRange("A3:B3").format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
requirements.getRange("A3:B22").format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
requirements.getRange("B4:B22").format.font = { color: "#0000FF" };
requirements.getRange("B20").format.numberFormat = "0%";
requirements.getRange("A:A").format.columnWidth = 24;
requirements.getRange("B:B").format.columnWidth = 40;
requirements.freezePanes.freezeRows(3);

options.showGridLines = false;
assumptions.showGridLines = false;
assumptions.getRange("A1:D1").merge();
assumptions.getRange("A1").values = [["가격·TCO 가정 (파란 글씨 입력)"]];
assumptions.getRange("A1:D1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 }, rowHeight: 32 };
assumptions.getRange("A3:D11").values = [
  ["항목", "값", "단위", "설명"], ["환율", 1400, "KRW/USD", "계획 가정"], ["전력 단가", 150, "KRW/kWh", "고객 계약 단가로 수정"],
  ["연 유지보수율", 0.1, "%", "구매비 기준"], ["RTX 6000 Ada", 8500, "USD/GPU", "공급사 견적 필요"],
  ["H100 PCIe", 30000, "USD/GPU", "공급사 견적 필요"], ["H200 SXM", 40000, "USD/GPU", "공급사 견적 필요"],
  ["서버 플랫폼", 18000, "USD/server", "CPU·RAM 기본"], ["네트워크·스토리지", 5000, "USD/server", "초기 가정"],
];
assumptions.getRange("A3:D3").format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
assumptions.getRange("B4:B11").format.font = { color: "#0000FF" };
assumptions.getRange("B4:B11").format.numberFormat = "#,##0";
assumptions.getRange("B6").format.numberFormat = "0.0%";
assumptions.getRange("A:D").format.columnWidth = 22;

options.getRange("A1:O1").merge();
options.getRange("A1").values = [["경제형 · 권장형 · 확장형 비교"]];
options.getRange("A1:O1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 }, rowHeight: 32 };
options.getRange("A3:O6").values = [
  ["구성안", "GPU", "GPU 수", "서버", "GPU/서버", "CPU 코어", "RAM GB", "NVMe TB", "네트워크", "전력 W", "장애 잔여", "도입비 KRW", "연 전력비", "3년 TCO", "신뢰도"],
  ["경제형", "RTX 6000 Ada 48GB", 2, 1, 2, 32, 256, 2, "25GbE", 2500, 6, null, null, null, "낮음"],
  ["권장형", "H100 PCIe 80GB", 2, 1, 2, 48, 512, 3, "100GbE", 3500, 10, null, null, null, "중간"],
  ["확장형", "H200 SXM 141GB", 4, 1, 4, 64, 1024, 4, "200GbE", 6000, 18, null, null, null, "중간"],
];
options.getRange("L4:L6").formulas = [
  ["=(C4*'가격·TCO 가정'!$B$7+D4*('가격·TCO 가정'!$B$10+'가격·TCO 가정'!$B$11))*'가격·TCO 가정'!$B$4"],
  ["=(C5*'가격·TCO 가정'!$B$8+D5*('가격·TCO 가정'!$B$10+'가격·TCO 가정'!$B$11))*'가격·TCO 가정'!$B$4"],
  ["=(C6*'가격·TCO 가정'!$B$9+D6*('가격·TCO 가정'!$B$10+'가격·TCO 가정'!$B$11))*'가격·TCO 가정'!$B$4"],
];
options.getRange("M4").formulas = [["=J4/1000*'고객 요구사항'!$B$18*365*'가격·TCO 가정'!$B$5"]];
options.getRange("M4:M6").fillDown();
options.getRange("N4").formulas = [["=L4+M4*3+L4*'가격·TCO 가정'!$B$6*3"]];
options.getRange("N4:N6").fillDown();
options.getRange("A3:O3").format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
options.getRange("A3:O6").format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
options.getRange("C4:N6").format.numberFormat = "#,##0";
options.getRange("L4:N6").format.font = { color: "#000000", bold: true };
options.getRange("A:O").format.columnWidth = 15;
options.getRange("B:B").format.columnWidth = 28;
options.freezePanes.freezeRows(3);

bom.showGridLines = false;
bom.getRange("A1:F1").merge();
bom.getRange("A1").values = [["권장형 인프라 BOM"]];
bom.getRange("A1:F1").format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 16 }, rowHeight: 32 };
bom.getRange("A3:F13").values = [
  ["구분", "항목", "수량", "요구 조건", "검증", "비고"], ["GPU", "H100 PCIe 80GB", 2, "서버당 2", "벤더 견적", "최종 SKU 확인"],
  ["서버", "2U/4U GPU 서버", 1, "PCIe Gen5", "토폴로지", "CPU-GPU-NIC 경로"], ["CPU", "서버 CPU", 2, "총 48코어+", "코어/GPU", "NUMA 확인"],
  ["RAM", "ECC RAM", 512, "GB", "용량", "모델·캐시"], ["스토리지", "NVMe", 3, "TB+", "처리량", "모델·벡터DB·로그"],
  ["네트워크", "100GbE NIC", 2, "이중화", "스위치", "East-West"], ["패브릭", "Ethernet/InfiniBand", 1, "설계 선택", "지연", "멀티노드 시 검토"],
  ["전력", "랙 전력", 3500, "W+", "PDU", "피크 여유"], ["UPS", "UPS", 15, "분", "시설", "정전 정책"],
  ["운영", "백업·모니터링", 1, "일 백업·GPU/p95/오류", "PoC", "감사로그 선택"],
];
bom.getRange("A3:F3").format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
bom.getRange("A3:F13").format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
bom.getRange("A:F").format.columnWidth = 22;

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
await fs.mkdir("outputs/v3.5-validation", { recursive: true });
for (const sheetName of ["고객 요구사항", "가격·TCO 가정", "구성안 비교", "인프라 BOM", "PoC 체크리스트"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  const filename = sheetName.replace(/[\\/:*?"<>|·]/g, "-");
  await fs.writeFile(`outputs/v3.5-validation/${filename}.png`, new Uint8Array(await preview.arrayBuffer()));
  if (sheetName === "구성안 비교") await fs.writeFile("docs/examples/si-sizing-example.png", new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save("docs/examples/si-sizing-example.xlsx");
await output.save("outputs/v3.5-validation/si-sizing-example.xlsx");
const inspection = await workbook.inspect({ kind: "sheet,region", range: "A1:O22", maxChars: 4000 });
console.log(inspection.ndjson);
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "final formula error scan" });
console.log(errors.ndjson);
