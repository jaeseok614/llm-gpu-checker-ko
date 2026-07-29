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

## 주요 기능

- 데스크톱·데이터센터·Apple Silicon·노트북을 포함한 GPU 102종
- 생성형 LLM, 임베딩, 리랭커, OCR, 문서/범용 VLM, 이미지 생성, 비디오 생성 워크로드
- GPU 상세 정보와 최대 3개 GPU 비교: VRAM, 대역폭, 실행 가능한 모델 수, 예상 속도
- 노트북 GPU TGP 입력과 전력 제한에 따른 성능 보정
- 이미지/비디오 전용 계산 엔진: 해상도, 스텝, 프레임, FPS, LoRA, 오프로딩 반영
- 동일 GPU·모델 조건의 사용자 측정값을 이용한 속도 보정과 신뢰도 표시
- 여러 GPU에 여러 모델을 배치하는 AI 스택 배치 플래너
- 한국어/영어 UI, 반응형 모바일 화면, 키보드 포커스와 모션 감소 지원

## 자동화된 기여 파이프라인

GPU와 벤치마크 요청은 GitHub Issue로 받을 수 있습니다.

- [GPU 추가 요청](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml): 스키마·중복·출처를 자동 검증하고 승인 라벨이 붙으면 데이터 PR을 만듭니다.
- [벤치마크 제보](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml): 측정 조건과 단위를 검증하고 `benchmark-ready` 라벨이 붙으면 데이터 PR을 만듭니다.
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
- [기여 방법](./CONTRIBUTING.md)
- [변경 이력](./CHANGELOG.md)

저장소 코드는 [MIT License](./LICENSE)를 따르며, 각 AI 모델은 해당 모델의 별도 라이선스를 따릅니다.
