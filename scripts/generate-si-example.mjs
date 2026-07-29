import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = path.join(root, "docs", "examples");
const outputDir = path.join(root, "outputs", "v4.2-validation");
const workbook = Workbook.create();
const sheets = [
  ["요구사항", [
    ["항목", "입력값", "단위", "근거"],
    ["제안 회사", "AI Infra Partner", "", "편집"],
    ["고객사", "샘플 고객", "", "편집"],
    ["프로젝트", "사내 문서 RAG 구축", "", "편집"],
    ["주 모델", "Qwen 32B", "", "모델 출처 확인"],
    ["전체 사용자", 100, "명", "고객 요구"],
    ["동시 요청", 10, "건", "고객 요구"],
    ["요청률", 1.25, "RPS", "고객 요구"],
    ["평균 입력", 4096, "tokens", "고객 요구"],
    ["평균 출력", 500, "tokens", "고객 요구"],
    ["TTFT p95", 2, "초", "SLA"],
    ["ITL p95", 80, "ms", "SLA"],
    ["운영 시간", 24, "시간/일", "운영 가정"],
  ]],
  ["구성안 비교", [
    ["구성안", "GPU", "수량", "서버", "CPU 코어", "RAM GB", "NVMe TB", "네트워크", "구매비 KRW", "연 전력비", "3년 TCO"],
    ["경제형", "RTX 6000 Ada 48GB", 2, 1, 32, 256, 2, "25GbE", 39000000, 2500000, null],
    ["권장형", "H100 PCIe 80GB", 2, 1, 48, 512, 3, "100GbE", 115000000, 3500000, null],
    ["확장형", "H200 SXM 141GB", 4, 1, 64, 1024, 4, "200GbE", 245000000, 6000000, null],
  ]],
  ["실시간 SLA", [
    ["지표", "목표", "예상", "판정"],
    ["TTFT p95", 2, 1.72, "통과"],
    ["ITL p95 (ms)", 80, 48, "통과"],
    ["큐 대기 p95", 0.5, 0.21, "통과"],
    ["전체 응답 p95", 12, 8.84, "통과"],
    ["최대 배치", 8, 8, "검증 필요"],
    ["최소/최대 복제본", "1 / 8", "2 / 6", "통과"],
    ["아바타 첫 응답", 3.5, 2.78, "통과"],
    ["아바타 FPS", 24, 30, "통과"],
  ]],
  ["모델 배치도", [
    ["서버", "GPU", "배치", "역할", "장애 시"],
    ["Server 1", "GPU 0-1", "LLM tensor parallel", "생성", "Server 2로 전환"],
    ["Server 1", "GPU 2", "Embedding + Reranker", "RAG", "CPU 대체 가능"],
    ["Server 1", "GPU 3", "STT + TTS + Lip-sync", "아바타", "비디오 품질 축소"],
    ["Server 2", "GPU 0-3", "Replica", "HA / 확장", "50% 잔여 처리량"],
  ]],
  ["BOM", [
    ["구분", "항목", "수량", "요구 조건", "검증 상태"],
    ["GPU", "H100 PCIe 80GB", 4, "공식 사양 확인", "견적 필요"],
    ["CPU", "서버 CPU 48코어+", 2, "NUMA 확인", "검토"],
    ["RAM", "ECC RAM 512GB", 2, "모델·캐시", "검토"],
    ["스토리지", "Enterprise NVMe 3TB+", 2, "모델·Vector DB·로그", "검토"],
    ["NIC", "100GbE", 4, "이중화", "검토"],
    ["UPS", "15분 이상", 1, "PDU 포함", "현장 확인"],
    ["운영", "백업·모니터링", 1, "GPU/SLA/오류율", "PoC"],
  ]],
  ["TCO 비교", [
    ["방식", "1년", "3년", "5년", "가정"],
    ["온프레미스", 130000000, 160000000, 190000000, "구매+전력+상면+유지보수"],
    ["클라우드", 72000000, 216000000, 360000000, "사용률 50%, 시간당 단가"],
    ["혼합", 103000000, 182400000, 261800000, "온프레미스 60%+클라우드 40%"],
  ]],
  ["벤치마크 계획", [
    ["모드", "런타임", "입력", "출력", "동시성", "수집 지표"],
    ["성능", "vLLM", "512,4096,8192", "128,512", "1", "TTFT·ITL·TPS"],
    ["부하", "vLLM", "4096", "512", "1,4,8,16", "RPS·p95·큐·오류율"],
    ["성능", "llama.cpp", "512,4096", "128,512", "1", "prompt/gen tok/s"],
    ["부하", "NIM", "4096", "512", "1,4,8,16", "TTFT·ITL·RPS"],
  ]],
  ["근거·위험", [
    ["항목", "근거 유형", "표본", "예상 오차", "검증일", "조치"],
    ["GPU 사양", "공식 사양", 1, "±2%", "2026-07-30", "SKU 재확인"],
    ["모델 메모리", "계산 추정", 0, "±20%", "2026-07-30", "PoC 실측"],
    ["처리량", "외부 실측", 2, "±25%", "2026-07-30", "동일 조건 재측정"],
    ["아바타 지연", "계산 추정", 0, "±40%", "2026-07-30", "단계별 추적"],
    ["가격", "계산 참고가", 0, "±30%", "2026-07-30", "공급사 견적"],
  ]],
  ["PoC 체크리스트", [
    ["상태", "검증 항목", "합격 기준", "결과"],
    ["미착수", "모델·정밀도·런타임 확정", "배포 대상과 동일", ""],
    ["미착수", "성능 테스트", "TTFT 2초 이하", ""],
    ["미착수", "부하 테스트", "p95 12초·오류율 1% 미만", ""],
    ["미착수", "장애 전환", "목표 잔여 처리량 유지", ""],
    ["미착수", "24시간 안정성", "메모리 누수·오류 없음", ""],
  ]],
];

for (const [name, values] of sheets) {
  const sheet = workbook.worksheets.add(name);
  sheet.showGridLines = false;
  const titleEnd = String.fromCharCode(64 + Math.min(15, Math.max(4, values[0].length)));
  sheet.getRange(`A1:${titleEnd}1`).merge();
  sheet.getRange("A1").values = [[`AI Infra Sizing Assistant · ${name}`]];
  sheet.getRange(`A1:${titleEnd}1`).format = { fill: "#17324D", font: { bold: true, color: "#FFFFFF", size: 15 }, rowHeight: 30 };
  const endRow = values.length + 2;
  const endCol = String.fromCharCode(64 + values[0].length);
  sheet.getRange(`A3:${endCol}${endRow}`).values = values;
  sheet.getRange(`A3:${endCol}3`).format = { fill: "#2F75B5", font: { bold: true, color: "#FFFFFF" } };
  sheet.getRange(`A3:${endCol}${endRow}`).format.borders = { preset: "inside", style: "thin", color: "#D9E2F3" };
  sheet.getRange(`A:${endCol}`).format.columnWidth = 20;
  sheet.getRange("A:A").format.columnWidth = 24;
  sheet.freezePanes.freezeRows(3);
}

const comparison = workbook.worksheets.getItem("구성안 비교");
comparison.getRange("K4").formulas = [["=I4+J4*3"]];
comparison.getRange("K4:K6").fillDown();
comparison.getRange("I4:K6").format.numberFormat = "#,##0";
comparison.getRange("B:B").format.columnWidth = 28;

const poc = workbook.worksheets.getItem("PoC 체크리스트");
poc.getRange("A4:A8").dataValidation = { rule: { type: "list", values: ["미착수", "진행", "완료", "조정"] } };

await fs.mkdir(docsDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });
for (const sheetName of sheets.map(([name]) => name)) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `${sheetName.replace(/[\\/:*?"<>|·]/g, "-")}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(path.join(docsDir, "si-sizing-example.xlsx"));
await output.save(path.join(outputDir, "ai-infra-sizing-v4.2.xlsx"));
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: "formula error scan" });
console.log(errors.ndjson);
