# AI 모델 실행 가능성 계산기

<p align="center">
  <img src="./assets/gpu-board.svg" alt="AI Hardware Fit" width="96" />
</p>

<p align="center">
  <strong>내 GPU에서 생성형 LLM, 임베딩, 리랭커, OCR/VLM 모델을 현실적으로 실행할 수 있는지 확인하세요.</strong><br />
  AI Hardware Fit · Korean web-based AI model compatibility, VRAM, RAG, and OCR workload calculator.
</p>

<p align="center">
  <a href="https://jaeseok614.github.io/llm-gpu-checker-ko/"><strong>웹에서 바로 사용하기</strong></a>
  ·
  <a href="#계산-기준">계산 기준 보기</a>
  ·
  <a href="https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose">모델·GPU 추가 요청</a>
</p>

<p align="center">
  <img alt="Static app" src="https://img.shields.io/badge/static-HTML%20%2B%20CSS%20%2B%20JS-164a7b" />
  <img alt="GitHub Pages" src="https://img.shields.io/badge/demo-GitHub%20Pages-13795b" />
  <img alt="Korean UI" src="https://img.shields.io/badge/UI-Korean-5f4bb6" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-9a6700" />
</p>

![앱 미리보기](./docs/preview.svg?ui=professional-20260723-release1)

## 무엇을 알려주나요

설치나 회원가입 없이 브라우저에서 GPU와 사용 조건을 입력하면, 생성형 LLM·임베딩·리랭커·OCR·문서 VLM·범용 VLM 286개 모델 중 실제로 돌아갈 모델을 등급(쾌적/잘 돌아감/가능/빡빡함/오프로딩/부적합)과 함께 보여줍니다. 모델을 클릭하면 VRAM 계산 근거, 추정 속도, 신뢰도, 실행 명령어까지 확인할 수 있습니다.

## 기존 계산기와 다른 점

계산 추정값과 실측값을 UI에서 명확히 분리해 보여줍니다. 모델 상세에는 항상 추정 신뢰도(높음/보통/낮음)가 함께 표시되고, 동일 조건 실측 벤치마크가 있으면 "예상 vs 실측 · 추정 오차 %"가 바로 붙습니다. 직접 로그를 정리하지 않아도 `scripts/benchmark-cli.mjs`가 실행 중인 Ollama/llama.cpp 서버를 측정해 제보용 JSON을 만들어 주므로, 실측 데이터가 누구나 쉽게 쌓일 수 있는 구조입니다. 단일 GPU 판정뿐 아니라 이기종 GPU 병렬 배치, 여러 모델의 동시 배치(베타)까지 계산합니다.

## 30초 사용법

1. 웹 데모를 열고 GPU를 선택합니다. 목록에 없으면 GPU 선택창에서 `직접 입력`으로 검색·자동완성할 수 있습니다.
2. 생성형 LLM, 임베딩, 리랭커, OCR, 문서 VLM, 범용 VLM 탭에서 실행 가능한 모델을 확인합니다.
3. 모델을 클릭해 VRAM 구성, 속도 추정, 실행 명령어를 확인합니다.
4. 여러 모델을 한 GPU(들)에 함께 올릴 계획이면 `여러 GPU에 모델 동시 배치 추천 (베타)`에서 체크박스로 선택해 병목과 공통 동시 처리 기준을 확인합니다.

## 대표 사용 사례

| 질문 | 앱에서 확인할 값 |
| --- | --- |
| RTX 4090 24GB로 32B Q4 모델을 돌릴 수 있을까? | `GeForce RTX 4090 24GB`, `Q4_K_M`, `32B` 검색 |
| A100 80GB 2장으로 동시 요청을 몇 개 처리할 수 있을까? | `A100 80GB`, `GPU 수 2` 선택 후 모델 상세의 `동시 처리 용량` 확인 |
| 24GB·12GB GPU에 14B와 70B 모델을 동시에 어떻게 나눠 올릴까? | `여러 GPU에 모델 동시 배치 추천`에서 GPU와 모델 복수 선택 |
| LLM·임베딩·OCR 서버를 여러 GPU에 함께 띄우면 처리량이 어느 정도일까? | 배치 추천에서 종류를 섞어 선택 후 GPU별 동시 인원·`doc/s`·`page/s` 확인 |
| 목록에 없는 Hugging Face 공개 LLM의 가중치가 내 GPU에 들어갈까? | `Hugging Face 공개 LLM 직접 계산`에 모델 주소 입력 |
| 한국어 RAG에서 bge-reranker, Qwen3 Reranker, mxbai-rerank 중 무엇이 맞을까? | `리랭커` 탭, `후보 수`, `문서 길이`, `배치 크기` 변경 |
| PDF를 Markdown으로 복원하는 문서 VLM은 어떤 GPU가 필요할까? | `문서 VLM` 탭, `PaddleOCR-VL`, `MinerU`, `olmOCR` 검색 |

## 지원 규모

| 데이터 | 개수 |
| --- | ---: |
| GPU 프리셋 | 90 |
| 전체 AI 모델 | 286 (LLM 147 · 임베딩 60 · 리랭커 34 · OCR 4 · 문서 VLM 9 · 범용 VLM 32) |
| 양자화 옵션 | 14 |
| 모델 공급사 | 56 |
| 실측 벤치마크 시트 | 실측 행 0 · 출처 연결 공개 품질 점수 279 · OCR/VLM 참고 기준 45 |
| 모델 라이선스 안내 | 286/286 · 상업 이용 가능/조건부/비상업·연구용/원문 확인 필요 |

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| GPU 프리셋 | 기본 드롭다운 + 선택형 모델명 검색·자동완성. GeForce, RTX Pro/Quadro, DGX Spark, 데이터센터 GPU, Radeon, Intel, Apple Silicon 포함 |
| 워크로드 탭 | 생성형 LLM, 임베딩, 리랭커, OCR, 문서 VLM, 범용 VLM을 분리 계산 |
| 이기종 GPU 병렬 | 서로 다른 두 GPU의 VRAM·대역폭·연산량을 합산하고 메모리 분할·통신 손실을 보수적으로 반영 |
| 동시 처리 용량 (베타) | 현재 조합의 권장/이론적 최대 동시 인원과 총·1인당 처리량을 KV cache 기준으로 역산 |
| 여러 GPU 모델 배치 (베타) | LLM·임베딩·리랭커·OCR/VLM을 섞어 선택하면 GPU별 배치와 공통 병목(동시 인원·처리량)을 계산 |
| 추정/실측 분리 | 계산 추정값, 신뢰도, 출처 연결 실측값, 추정 오차를 서로 다른 영역에 표시 |
| 로컬 벤치마크 CLI | `scripts/benchmark-cli.mjs`로 실행 중인 서버를 측정해 제보용 JSON 생성 |
| Hugging Face 직접 계산 | 공개 생성형 LLM의 safetensors 파라미터·config·라이선스를 읽어 사용자 브라우저의 목록에 추가 |
| URL 상태 저장 | GPU, VRAM, RAM, 컨텍스트, 동시 요청, 필터, 선택 모델을 쿼리 파라미터로 공유 |

## 모델 라이선스 안내

각 모델의 원문 라이선스와 함께 아래 이용 조건을 한국어로 간단히 표시합니다. 목록의 `이용 조건` 필터로 원하는 범주만 볼 수 있고, 모델 상세 화면에서 요약과 원문 링크를 확인할 수 있습니다.

| 표시 | 의미 |
| --- | --- |
| 상업 이용 가능 | 일반적인 상업 이용이 가능하지만 저작권 고지, 라이선스 사본 제공 같은 원문 의무는 지켜야 합니다. |
| 상업 이용 조건부 | 매출·월간 사용자 수·서비스 형태·표시 의무·별도 등록 등 추가 조건이 있을 수 있습니다. |
| 비상업·연구용 | 연구 또는 비상업 용도로 제한되며 상업 이용에는 별도 허가가 필요합니다. |
| 원문 확인 필요 | 라이선스 명칭만으로 상업 이용 여부를 단정하기 어려워 배포처의 최신 원문을 직접 확인해야 합니다. |

이 표시는 빠른 판단을 돕는 요약이며 법률 자문이 아닙니다. 모델을 배포하거나 유료 서비스에 사용할 때는 앱에 연결된 최신 라이선스 원문을 반드시 확인하세요. 이 저장소 코드의 [MIT License](./LICENSE)와 각 AI 모델의 라이선스는 서로 별개입니다.

## 계산 기준

계산기는 파라미터 크기, 양자화, KV cache, 런타임 오버헤드, GPU 대역폭을 바탕으로 한 결정론적 휴리스틱 모델을 사용합니다. 표기법, 메모리 모델, 등급 산출식, 처리량/응답시간 모델, 자동 양자화 정책, 임베딩·리랭커·OCR/VLM 계산식의 전체 수식과 쉬운 설명은 [docs/methodology.md](./docs/methodology.md)에 정리되어 있습니다.

## 실측 벤치마크 참여

실측 행이 늘어날수록 계산 추정값의 신뢰도가 올라갑니다. 직접 로그를 정리하지 않아도 되도록, 실행 중인 Ollama/llama.cpp 서버에 짧은 프롬프트를 보내 prefill/decode 속도, TTFT, peak VRAM을 측정하고 `data/benchmarks.js` 형식의 JSON을 바로 만들어 주는 CLI를 제공합니다.

```bash
# Ollama
node scripts/benchmark-cli.mjs --runtime ollama --model qwen3:8b --model-name "Qwen3 8B" \
  --model-key qwen3-8b --gpu-id rtx4090-24 --quantization Q4_K_M --context 8192

# llama.cpp 서버
node scripts/benchmark-cli.mjs --runtime llamacpp --url http://localhost:8080 --model "Qwen3 8B Q4_K_M" --context 8192
```

- 이 GPU와 루프백 로컬 서버(`localhost`, `127.0.0.0/8`, `[::1]`)에만 접속합니다. 외부 호스트와 HTTP 리다이렉트는 차단하며, 출력된 JSON을 제보할지는 직접 선택합니다.
- NVIDIA GPU에서 `nvidia-smi`가 있으면 GPU 이름·VRAM·드라이버·CUDA 버전을 자동으로 채우고 실행 중 VRAM을 주기적으로 샘플링합니다. 없으면 `--gpu`로 직접 입력합니다.
- 출력된 JSON을 [Benchmark report](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml) 이슈의 "CLI 측정 결과 (JSON)" 칸에 붙여넣으면 됩니다. `sourceUrl`은 이슈를 올린 뒤 이슈 자신의 링크로 바꿔주세요.
- `--model-key`, `--gpu-id`, `--quantization`, `--context`가 현재 화면과 정확히 일치하는 실측 행이 등록되면, 상세 화면에 "예상 vs 실측 · 추정 오차 ±Z%"가 함께 표시됩니다.
- `--help`로 전체 옵션을 확인할 수 있습니다.

## 정확도와 한계

계산기는 추정 도구입니다. 브라우저는 보안상 `nvidia-smi`처럼 정확한 VRAM·드라이버 상태를 직접 읽을 수 없어 GPU 프리셋과 직접 입력값을 기준으로 계산하며, 실제 속도는 드라이버·런타임·모델 구현·배치 크기에 따라 추정치와 몇 배 차이가 날 수 있습니다. 상세 화면은 항상 추정 신뢰도와 근거를 함께 보여주고, 동일 조건 실측값이 있으면 오차율을 표시합니다. 이기종 GPU 병렬, 임베딩/리랭커/OCR 처리량에 영향을 주는 요인 등 자세한 내용은 [docs/accuracy-and-limits.md](./docs/accuracy-and-limits.md)를 참고하세요.

## 로컬 실행

브라우저에서 `index.html`을 직접 열면 됩니다. 로컬 서버로 확인하려면:

```bash
python3 -m http.server 8787
```

```text
http://127.0.0.1:8787
```

검증은 `npm run check`로 문법, 데이터 구조, 테스트 스위트를 확인합니다.

## 문서

- [docs/methodology.md](./docs/methodology.md) — 계산 수식 전체 (Notation, 메모리 모델, 등급, 처리량 모델, 임베딩/리랭커/OCR)
- [docs/accuracy-and-limits.md](./docs/accuracy-and-limits.md) — 정확도, 한계, 공개 품질 점수 기준
- [docs/data-sources.md](./docs/data-sources.md) — 모델·GPU 메타데이터 출처 목록
- [CONTRIBUTING.md](./CONTRIBUTING.md) — 모델/GPU 데이터 추가 형식, PR 기준
- [CHANGELOG.md](./CHANGELOG.md) — 버전별 변경 이력

## 기여

- 모델 추가: [Model request](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=model-request.yml)
- GPU 추가: [GPU request](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml)
- 벤치마크 제보: [Benchmark report](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml)

자세한 데이터 형식은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 저장소 라이선스

[MIT License](./LICENSE)

앱에 수록된 AI 모델은 각각 별도의 라이선스를 따릅니다. 한국어 이용 조건 요약은 `data/licenses.js`와 앱의 모델 상세 화면에서 확인할 수 있습니다.

## GPU 스펙 데이터

GPU 목록의 기본 스펙 데이터는 **[gpu-specs-kr](https://github.com/jaeseok614/gpu-specs-kr)** 프로젝트에서 관리하며, 사용자 요청으로 추가된 항목은 각 레코드의 확인 출처를 함께 보관합니다.

> Wikipedia의 NVIDIA·AMD·Intel GPU 스펙을 정규화한 오픈소스 데이터셋·REST API

- JSON · CSV · SQLite 다운로드 가능
- 1,833개 GPU (NVIDIA 959 / AMD 870 / Intel 4)
- [데이터셋 바로가기 →](https://github.com/jaeseok614/gpu-specs-kr)
