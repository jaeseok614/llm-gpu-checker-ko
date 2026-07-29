from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
DOCS = ROOT / "docs" / "examples"
OUT.mkdir(parents=True, exist_ok=True)
DOCS.mkdir(parents=True, exist_ok=True)

font_path = Path("C:/Windows/Fonts/malgun.ttf")
bold_path = Path("C:/Windows/Fonts/malgunbd.ttf")
pdfmetrics.registerFont(TTFont("Malgun", str(font_path)))
pdfmetrics.registerFont(TTFont("MalgunBold", str(bold_path)))

styles = getSampleStyleSheet()
title = ParagraphStyle("TitleKo", parent=styles["Title"], fontName="MalgunBold", fontSize=22, leading=28, textColor=colors.HexColor("#17324D"))
h2 = ParagraphStyle("H2Ko", parent=styles["Heading2"], fontName="MalgunBold", fontSize=15, leading=20, textColor=colors.HexColor("#2F75B5"), spaceBefore=8)
body = ParagraphStyle("BodyKo", parent=styles["BodyText"], fontName="Malgun", fontSize=9.5, leading=15)
small = ParagraphStyle("SmallKo", parent=body, fontSize=8, leading=12, textColor=colors.HexColor("#52606D"))

def table(rows, widths):
    wrapped = [[Paragraph(str(cell), body) for cell in row] for row in rows]
    result = Table(wrapped, colWidths=widths, repeatRows=1)
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F75B5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "MalgunBold"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F6F8FA")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D2DC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return result

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Malgun", 8)
    canvas.setFillColor(colors.HexColor("#687684"))
    canvas.drawString(18 * mm, 10 * mm, "사전 산정 참고자료 · 최종 수량은 공급사 검증과 PoC 후 확정")
    canvas.drawRightString(279 * mm, 10 * mm, f"{doc.page}")
    canvas.restoreState()

path = OUT / "ai-infra-proposal-v4.2.pdf"
doc = SimpleDocTemplate(str(path), pagesize=landscape(A4), rightMargin=16*mm, leftMargin=16*mm, topMargin=14*mm, bottomMargin=16*mm)
story = [
    Paragraph("AI Infra Sizing Assistant", title),
    Paragraph("고객 전달용 인프라 사전 산정 제안서", ParagraphStyle("sub", parent=h2, alignment=TA_CENTER)),
    Spacer(1, 8*mm),
    table([
        ["고객사", "샘플 고객", "프로젝트", "사내 문서 RAG 구축"],
        ["제안사", "AI Infra Partner", "기준일", "2026-07-30"],
        ["업무", "Qwen 32B + Embedding + Reranker", "목표", "동시 요청 10 · TTFT p95 2초"],
    ], [30*mm, 85*mm, 30*mm, 95*mm]),
    Spacer(1, 7*mm),
    Paragraph("3가지 구성안", h2),
    table([
        ["구성안", "GPU", "동시 처리", "3년 TCO", "적용 판단"],
        ["경제형", "RTX 6000 Ada × 2", "6", "약 5,400만원", "일부 대기 허용"],
        ["권장형", "H100 PCIe × 2", "10", "약 1억 6,000만원", "SLA·30% 확장 여유"],
        ["확장형", "H200 SXM × 4", "18", "약 3억원", "HA·향후 확장"],
    ], [32*mm, 64*mm, 40*mm, 46*mm, 62*mm]),
    Spacer(1, 6*mm),
    Paragraph("권장 구성 근거", h2),
    Paragraph("모델 상주 메모리, KV cache, 런타임 오버헤드, 동시 요청, 장애 여유 및 30% 성장분을 함께 반영했습니다. 가격은 계산 참고가이며 세금·마진·라이선스·설치·지원은 공급사 견적에서 확정해야 합니다.", body),
    PageBreak(),
    Paragraph("기술 검토본", title),
    Paragraph("SLA와 아바타 파이프라인", h2),
    table([
        ["지표", "목표", "예상", "판정"],
        ["TTFT p95", "2.0초", "1.72초", "통과"],
        ["ITL p95", "80ms", "48ms", "통과"],
        ["큐 대기 p95", "0.5초", "0.21초", "통과"],
        ["전체 p95", "12초", "8.84초", "통과"],
        ["STT→LLM→TTS→립싱크", "3.5초 / 24FPS", "2.78초 / 30FPS", "실시간 가능"],
    ], [70*mm, 55*mm, 55*mm, 55*mm]),
    Spacer(1, 6*mm),
    Paragraph("자동 생성 구성도", h2),
    table([["사용자", "→", "Load Balancer", "→", "2× GPU Server", "→", "Vector DB / NVMe", "→", "Monitoring / Backup"]], [30*mm, 10*mm, 45*mm, 10*mm, 45*mm, 10*mm, 48*mm, 10*mm, 50*mm]),
    Spacer(1, 6*mm),
    Paragraph("근거·위험·PoC", h2),
    table([
        ["항목", "근거", "표본", "예상 오차", "필수 검증"],
        ["GPU 사양", "공식 사양", "n=1", "±2%", "최종 SKU"],
        ["VRAM", "계산 추정", "n=0", "±20%", "동일 모델·정밀도"],
        ["처리량", "외부 실측", "n=2", "±25%", "성능/부하 분리"],
        ["아바타 지연", "계산 추정", "n=0", "±40%", "단계별 지연·FPS"],
        ["가격", "계산 참고가", "n=0", "±30%", "공급사 유효 견적"],
    ], [52*mm, 52*mm, 32*mm, 42*mm, 70*mm]),
]
doc.build(story, onFirstPage=footer, onLaterPages=footer)
(DOCS / "ai-infra-proposal-example.pdf").write_bytes(path.read_bytes())
print(path)
