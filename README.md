# AI Hardware Fit

<p align="center">
  <img src="./assets/gpu-board.svg" alt="AI Hardware Fit" width="96" />
</p>

<p align="center">
  <strong>내 GPU에서 실행할 수 있는 LLM·임베딩·리랭커·OCR·이미지·비디오 생성 모델을<br />VRAM, 속도, 품질, 라이선스 기준으로 비교합니다.</strong>
</p>

<p align="center">
  <a href="https://github.com/jaeseok614/llm-gpu-checker-ko/actions/workflows/ci.yml"><img src="https://github.com/jaeseok614/llm-gpu-checker-ko/actions/workflows/ci.yml/badge.svg" alt="CI 상태" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="https://jaeseok614.github.io/llm-gpu-checker-ko/?lang=ko"><strong>웹에서 바로 사용</strong></a>
  · <a href="https://jaeseok614.github.io/llm-gpu-checker-ko/?mode=placement&amp;lang=ko">AI 스택 배치</a>
  · <a href="./README.en.md">English</a>
  · <a href="https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml">GPU 추가 요청</a>
</p>

![AI Hardware Fit 모델 탐색기](./docs/model-finder-ko.png)

## 버전별 한 줄 업데이트

> 새 버전이 나올 때마다 가장 최신 항목을 맨 위에 한 줄로 추가합니다. 자세한 변경 내용은 [CHANGELOG](./CHANGELOG.md)에서 확인할 수 있습니다.

- **v2.2** — CPU·RAM·파워·케이스·부품 가격까지 입력해 모델 실행 가능 여부, 권장 파워, 전체 시스템 가격과 업그레이드 순서를 계산합니다.
- **v2.0** — 실측 신뢰구간·벤치마크 2.0·GPU/모델 상세 주소·구매 TCO·Ollama/llama.cpp/vLLM/Docker 실행 도우미를 추가했습니다.
- **v1.5** — GPU를 115종으로 확장하고 STT/TTS 10종·모델 중심 첫 화면·모델 제보 자동 PR·벤치마크 커버리지 화면을 추가했습니다.
- **v1.4** — 모델과 예산부터 선택하는 GPU Advisor, 가격·전력비·현재 GPU 대비 성능, 이미지/비디오 최적화 옵션을 추가했습니다.
- **v1.3** — GPU 스키마 정규화·노트북 TGP 보정·실측 기반 속도 보정·전용 미디어 계산 엔진·GPU 상세 비교를 도입했습니다.
- **v1.2** — 여러 GPU에 여러 모델을 배치하는 AI 스택 플래너와 공유 가능한 배치 조건·비교 화면을 추가했습니다.
- **v1.1** — 임베딩·리랭커·OCR/VLM 등 AI 워크로드와 모델 카탈로그, 벤치마크 및 라이선스 정보를 확장했습니다.
- **v1.0** — GPU VRAM과 실행 조건을 기준으로 로컬 LLM 호환성·권장 양자화·예상 속도를 확인하는 첫 공개 버전입니다.

## 주요 기능

- **v2.0 의사결정 허브**: 실측 신뢰구간, 벤치마크 2.0, GPU·모델 상세 링크, 구매 TCO, 실행 설정을 한곳에서 제공합니다.
- 동일 조건 실측의 표본 수·중앙값·범위·95% 신뢰구간과 추정 오차를 표시합니다.
- 신품·중고 가격, 원화 환산, 현재 GPU 처분가, 전기요금과 사용 기간으로 업그레이드 가치를 계산합니다.
- Ollama, llama.cpp, vLLM, Docker Compose 설정을 선택한 모델·GPU에 맞춰 생성합니다.
- GPU와 모델을 각각 최대 4개까지 비교하며 모바일에서는 카드형 비교 화면을 사용합니다.
- 데스크톱·데이터센터·Apple Silicon·노트북을 포함한 GPU 115종
- 생성형 LLM, 임베딩, 리랭커, OCR, 문서/범용 VLM, 이미지·비디오 생성, STT·TTS 워크로드
- GPU를 먼저 고르는 화면과 모델·예산을 먼저 고르는 전용 진입 화면
- GPU 상세 정보와 최대 3개 GPU 비교: VRAM, 대역폭, 실행 가능한 모델 수, 예상 속도
- 모델을 먼저 고른 뒤 예산·제조사·폼팩터·월 전력비로 GPU를 추천하는 GPU Advisor
- 노트북 GPU TGP 입력과 전력 제한에 따른 성능 보정
- 이미지/비디오 전용 계산 엔진: 해상도, 스텝, 프레임, FPS, LoRA, 오프로딩, Sage/Flash Attention, TeaCache 반영
- 동일 GPU·모델 조건의 사용자 측정값을 이용한 속도 보정과 신뢰도 표시
- 공식/추정 사양, 검증일, 측정 표본 수를 구분하는 데이터 품질 표시
- 실측 데이터·GPU·모델 범위와 우선 측정 대상을 보여주는 벤치마크 대시보드
- 여러 GPU에 여러 모델을 배치하는 AI 스택 배치 플래너
- 한국어/영어 UI, 반응형 모바일 화면, 키보드 포커스와 모션 감소 지원

## 자동화된 기여 파이프라인

GPU와 벤치마크 요청은 GitHub Issue로 받을 수 있습니다.

- [GPU 추가 요청](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml): 공식 제조사 출처, 스키마, 중복, 노트북 TGP를 자동 검증하고 변경 미리보기와 데이터 PR을 만듭니다.
- [벤치마크 제보](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml): 측정 조건과 단위를 검증하고 `benchmark-ready` 라벨이 붙으면 데이터 PR을 만듭니다.
- [모델 추가 요청](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=model-request.yml): 모델 카드·라이선스·중복을 검증하고 `model-ready` 라벨로 워크로드별 데이터 PR을 만듭니다.
- 모든 GPU 데이터는 제조사, 아키텍처, 메모리 종류, 사용 가능 메모리, 런타임, 폼팩터 필드를 공통 스키마로 검증합니다.
- GitHub Pages 빌드 시 커밋 해시를 정적 자산 버전에 넣어 오래된 브라우저 캐시를 방지합니다.

## 사용 방법

1. GPU를 선택합니다. 노트북 GPU라면 실제 TGP를 입력합니다.
2. 모델 종류와 실행 조건을 선택합니다.
3. 실행 가능 여부, 권장 정밀도, VRAM 구성, 예상 속도와 신뢰도를 확인합니다.
4. GPU 상세 패널에서 다른 GPU와 비교하거나, 여러 모델이라면 AI 스택 배치로 이동합니다.

수치는 하드웨어·런타임·드라이버·입력 데이터에 따라 달라지는 계산 추정치입니다. 외부 참고값, 사용자 측정값, 프로젝트 자체 측정값은 서로 구분해 표시합니다.

## 로컬 개발

Node.js 20 이상이 필요합니다.

```bash
npm install
npm run check
```

`npm run check`는 코드 문법, GPU/모델 데이터, 요청 자동화, 정적 빌드, 계산 테스트를 모두 검증합니다. `npm run build:static`의 결과는 `_site/`에 생성됩니다.

## 문서

- [계산 방법](./docs/methodology.md)
- [정확도와 한계](./docs/accuracy-and-limits.md)
- [데이터 출처](./docs/data-sources.md)
- [GPU 기여 파이프라인](./docs/gpu-contribution-pipeline.md)
- [v1.4 GPU Advisor 계산과 한계](./docs/v1.4-advisor-methodology.md)
- [v1.5 카탈로그·음성·대시보드](./docs/v1.5-catalog-audio-dashboard.md)
- [v2.0 의사결정 플랫폼](./docs/v2.0-decision-platform.md)
- [v2.2 사용자 빌드 계산기](./docs/v2.2-build-calculator.md)
- [기여 방법](./CONTRIBUTING.md)
- [변경 이력](./CHANGELOG.md)

저장소 코드는 [MIT License](./LICENSE)를 따르며, 각 AI 모델은 해당 모델의 별도 라이선스를 따릅니다.
