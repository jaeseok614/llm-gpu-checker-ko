from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
DOCS = ROOT / "docs"
FRAMES_DIR = DOCS / "promotion" / "v4.8-frames"
TARGET_SIZE = (1200, 720)
CONTENT_SIZE = (1200, 648)


def font(size: int):
    candidates = [
        Path("C:/Windows/Fonts/malgunbd.ttf"),
        Path("C:/Windows/Fonts/malgun.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def crop_content(source: Path, top: int) -> Image.Image:
    image = Image.open(source).convert("RGB")
    width, height = image.size
    crop_width, crop_height = CONTENT_SIZE
    left = max(0, (width - crop_width) // 2)
    top = max(0, min(top, height - crop_height))
    cropped = image.crop((left, top, left + crop_width, top + crop_height))
    if cropped.size != CONTENT_SIZE:
        cropped = cropped.resize(CONTENT_SIZE, Image.Resampling.LANCZOS)
    return cropped


def build_frame(step: str, title: str, source: Path, top: int) -> Image.Image:
    canvas = Image.new("RGB", TARGET_SIZE, "#0d1b2a")
    draw = ImageDraw.Draw(canvas)
    draw.text((28, 17), step, font=font(23), fill="#65b8ed")
    draw.text((120, 14), title, font=font(30), fill="#ffffff")
    canvas.paste(crop_content(source, top), (0, 72))
    return canvas


def main():
    inputs = [
        ("STEP 1", "쉬운 질문 4개로 요구사항 입력", OUTPUT / "v48-simple.png", 0),
        ("STEP 2", "경제형·권장형·확장형 3안 비교", OUTPUT / "v48-plans.png", 0),
        ("STEP 3", "BOM 호환성·가격·토폴로지 검증", OUTPUT / "v48-validation.png", 0),
        ("STEP 4", "최종 제안가·SLA·장애 대응 비교", OUTPUT / "v48-comparison.png", 0),
    ]
    missing = [str(source) for _, _, source, _ in inputs if not source.exists()]
    if missing:
        raise SystemExit("Missing browser captures:\n" + "\n".join(missing))

    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    frames = []
    for index, (step, title, source, top) in enumerate(inputs, start=1):
        frame = build_frame(step, title, source, top)
        frame.save(FRAMES_DIR / f"{index}.png", optimize=True)
        frames.append(frame.quantize(colors=96, method=Image.Quantize.MEDIANCUT))

    frames[0].save(
        DOCS / "demo-v4.8.gif",
        save_all=True,
        append_images=frames[1:],
        duration=[1800, 2200, 2200, 2600],
        loop=0,
        optimize=True,
        disposal=2,
    )


if __name__ == "__main__":
    main()
