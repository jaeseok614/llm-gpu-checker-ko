# Hugging Face Space 수동 설정 가이드

GitHub를 원본(source of truth)으로 유지하면서, AI/ML 사용자층에 노출될 보조 채널로 Hugging Face Static Space를 추가하기 위한 가이드입니다. **자동 동기화(GitHub Actions)는 아직 넣지 않습니다.** v1.1.x가 충분히 안정화된 뒤 수동으로 한 번 복제해보고, 문제가 없으면 그때 자동화를 고려하세요.

## 왜 자동 동기화를 바로 넣지 않는가

- Space README.md은 GitHub README.md과 달리 최상단에 Space 설정용 YAML frontmatter(`sdk: static` 등)가 필요합니다. 저장소를 그대로 미러링하면 이 frontmatter가 없는 GitHub README가 덮어써서 Space가 깨질 수 있습니다.
- 과거 세션에서 자동화 관련 GitHub 계정 문제가 있었으므로, 처음엔 사람이 결과를 확인할 수 있는 수동 절차로 시작하는 편이 안전합니다.

## 1단계: Space 생성

1. https://huggingface.co/new-space 접속 (Hugging Face 계정 로그인 필요)
2. Space name: `ai-hardware-fit` (또는 원하는 이름)
3. License: `mit`
4. SDK: **Static HTML**
5. Visibility: Public
6. 생성

## 2단계: 파일 복사

이 저장소의 정적 사이트 파일을 그대로 Space 저장소에 복사합니다. Space도 Git 저장소이므로 로컬에서:

```bash
git clone https://huggingface.co/spaces/<your-username>/ai-hardware-fit hf-space-clone
cd hf-space-clone

# GitHub 저장소 루트의 정적 파일 복사 (README.md는 아래 3단계 것으로 별도 교체)
cp -r /path/to/llm-gpu-checker-ko/{index.html,styles.css,app.js,data,assets,docs} .
```

`data`, `assets` 등 실제 사용 중인 디렉터리만 복사하세요. `.git`, `.github`, `node_modules`, `tests`, `scripts`는 Space에 필요 없습니다.

## 3단계: Space README.md (YAML frontmatter 포함)

GitHub의 README.md를 그대로 쓰지 말고, 아래 frontmatter가 포함된 버전을 Space 저장소 루트에 두세요. 본문은 기존 README.md 내용을 재사용해도 됩니다.

```yaml
---
title: AI Hardware Fit
emoji: 🖥️
colorFrom: blue
colorTo: gray
sdk: static
pinned: false
license: mit
short_description: 내 GPU에서 실행 가능한 LLM·임베딩·리랭커·OCR·VLM을 VRAM·속도·라이선스 기준으로 비교
---
```

`app_file`은 static SDK에서 기본값이 `index.html`이므로, 저장소 루트에 `index.html`이 있으면 별도 지정이 필요 없습니다. 최신 옵션은 [Spaces Configuration Reference](https://huggingface.co/docs/hub/spaces-config-reference)와 [Static HTML Spaces](https://huggingface.co/docs/hub/en/spaces-sdks-static) 문서를 확인하세요.

## 4단계: 원본 저장소로 되돌아오는 동선 만들기

Space는 GitHub 스타를 자동으로 늘려주지 않습니다. Space README와 앱 화면 어딘가에 "⭐ 원본 저장소 GitHub에서 보기" 링크를 명시적으로 넣어야 방문자가 GitHub로 넘어와 스타를 누를 여지가 생깁니다.

- Space README 상단에 `[GitHub 저장소](https://github.com/jaeseok614/llm-gpu-checker-ko)` 링크 추가
- 가능하면 앱 헤더의 GitHub 링크는 그대로 두어(이미 있음) Space 안에서도 원본으로 이동 가능하게 유지

## 5단계: GitHub README에 Space 배지 추가

Space가 실제로 만들어지고 정상 동작을 확인한 뒤, `README.md`/`README.en.md` 배지 줄에 아래를 추가하세요.

```md
[![Hugging Face Space](https://img.shields.io/badge/🤗%20Space-AI%20Hardware%20Fit-yellow)](https://huggingface.co/spaces/<your-username>/ai-hardware-fit)
```

## 6단계 (나중에): 자동 동기화

수동 복제로 몇 차례 문제없이 확인된 뒤에만 고려하세요. 공식 [`huggingface/hub-sync`](https://github.com/huggingface/hub-sync) GitHub Action이 `space_sdk: static`을 지원합니다. 이 액션은 파일 내용을 업로드하는 방식(진짜 git-to-git 동기화가 아님)이라 `.git`/`.github`는 자동으로 제외되지만, **README.md는 반드시 Space용 frontmatter가 포함된 버전으로 별도 관리**해야 하므로 동기화 대상에서 README.md는 제외하거나, frontmatter를 자동으로 주입해주는 [`alex-bene/huggingface-space-sync-action`](https://github.com/alex-bene/huggingface-space-sync-action) 같은 커뮤니티 액션을 검토하세요.
