# Changelog

## Unreleased

- 상세 설정을 `기본 하드웨어 · 보조 GPU · 메모리 보정` 3개 밀집형 그룹으로 재배치하고 입력 높이·간격을 축소. 접힌 고급 도구는 데스크톱에서 2열로 표시하고, 워크로드별 실행 조건도 넓은 화면에서 한 줄 중심으로 정리
- 첫 방문 시 임의의 RTX 4090 결과를 바로 보여주지 않고 GPU를 한 번 명시적으로 선택하도록 변경. 선택한 고정 GPU는 브라우저에 기억하며, 이후에는 빠른 추천을 기본 화면으로 열어 용도·우선순위에 맞는 상위 3개 모델과 상세 계산 진입점을 먼저 표시. GPU 외 VRAM·RAM·동시 요청·고급 도구는 `상세 설정` 안에 유지
- 빠른 추천 모드에서 상단의 상태별 개수(전체/쾌적/잘 돌아감/가능 등) 칩이 계속 보이고 클릭도 됐지만, 이 칩은 전체 모델 탐색 목록의 필터라 빠른 추천에서는 눌러도 화면에 아무 변화가 없어 "안 눌린다"처럼 보이던 문제 수정. 이제 이 칩은 전체 모델 탐색 모드에서만 보이고, 빠른 추천에서 실수로 필터를 걸어둔 채 전체 모델 탐색으로 넘어가 목록이 미리 걸러져 있던 문제도 함께 해결
- GitHub Issue 생성 정책이 `ALL`이고 상호작용 제한이 없음을 확인한 뒤 모델·GPU·벤치마크 제보 링크 재개
- GitHub 저장소 About 설명과 Topics를 LLM·임베딩·리랭커·OCR·VLM·멀티 GPU 범위에 맞게 갱신

## v1.1.0 - AI Workload Expansion - 2026-07-24

- 하드웨어 설정 패널을 페이지 진입 시 기본적으로 펼쳐서 보여주도록 변경 (매번 "설정 변경"을 눌러야 GPU를 바꿀 수 있던 문제)
- "고급 도구"(Hugging Face 직접 계산 · 여러 GPU 배치)를 결과 목록 맨 아래에서 GPU 설정 패널 안으로 이동. 전체 모델 탐색 모드에서 모델 목록(최대 147개 행)을 다 스크롤해야만 닿을 수 있어 사실상 눈에 띄지 않던 문제를 해결
- 페이지 흐름 재구성: 워크로드 탭 위에 `빠른 추천 / 전체 모델 탐색` 모드 전환을 추가해 초보자 모드가 전체 목록 사이에 끼어 흐름을 끊지 않도록 최상위 모드로 분리. Hugging Face 직접 계산·여러 GPU 배치는 결과 목록 아래 "고급 도구" 아코디언으로 이동. 정렬 드롭다운을 검색·필터와 한 줄로 통합
- 모델 비교 모달 레이아웃 정리: 모델별 열 사이 구분선 추가, 비교 제외 버튼을 헤더 우측 상단으로 이동, 상단에 실행 가능 여부 요약 문장 추가, 평가 기준이 다른 대표 공개 평가는 "직접 비교 불가" 표시, 필요 VRAM·추정 속도 차이를 색상으로 강조
- 여러 GPU 배치 계산 결과에 "실행 설정 내보내기" 추가: 배치된 모델 전체의 실행 명령어(.sh)와 Ollama·TEI 기준 docker-compose.yml 초안을 복사/다운로드 가능. OCR/VLM처럼 실행 방식이 모델마다 다른 경우는 compose 자동 생성 대신 안내 주석과 .sh 명령어로 대체
- 초보자 모드(3단계 추천) 추가: 현재 선택된 GPU 기준으로 용도·우선순위 2가지만 고르면 현재 탭에서 실행 가능한 모델 중 상위 3개를 추천 이유와 함께 보여줌. 기존 전체 목록은 그대로 "전문가 모드"로 유지
- 모델 목록에서 체크박스로 최대 3개 모델을 선택해 등급·VRAM·추정 속도·대표 공개 평가·라이선스·태그를 표 형태로 나란히 비교하는 비교 모드 추가 (목록/카드 보기 모두 지원)
- README를 ~180줄의 홍보용 요약 페이지로 축소하고, 계산 수식·정확도/한계·참고 자료를 `docs/methodology.md`, `docs/accuracy-and-limits.md`, `docs/data-sources.md`로 분리
- README를 출시용 요약으로 다시 축소하고 `README.en.md` 및 10초 데모 GIF 추가
- 공개 Issue 생성 제한 복구 확인 전까지 README의 모델·GPU·벤치마크 제보 흐름을 일시 중단으로 표시
- 계산값을 계산 추정·외부 공개 참고값·사용자 측정·자체 측정으로 명확히 구분
- 릴리스 태그에서 GitHub Release를 발행하는 검증 워크플로 추가

- 루프백 전용 로컬 벤치마크 CLI(`scripts/benchmark-cli.mjs`) 추가: Ollama/llama.cpp에 실제 프롬프트를 보내 prefill/decode 속도·TTFT·peak VRAM을 사용자 측정 JSON으로 생성
- Benchmark report 이슈 템플릿에 CLI 출력 JSON을 바로 붙여넣는 칸 추가
- 모델 상세에 동일 조건 사용자/자체 측정값이 있을 때 "예상 vs 측정 · 추정 오차 %"를 표시
- 배치 계산 버튼 옆에 배치된 모델 전체의 공통 병목 기준(동시 접속 인원·처리량) 요약 뱃지 추가
- 기본·보조 GPU와 여러 GPU 배치 인벤토리는 드롭다운을 기본으로 사용하고, 검색 옵션을 선택하면 모델명 자동완성 입력을 표시하도록 변경
- 모델 상세에 동시 처리 용량(베타) 추가: GPU·모델·양자화·컨텍스트 기준 권장/최대 동시 인원과 총·1인당 처리량을 KV cache 기준으로 역산
- 여러 GPU에 모델 동시 배치 추천(베타) 추가: 검색 가능한 체크리스트로 생성형 LLM·임베딩·리랭커·OCR/VLM을 섞어서 선택하면 GPU별 모델·정밀도 배치와 병목 없는 동시 인원·처리량, 배치 불가 모델을 계산
- 모델 라이선스 안내 추가: 상업 이용 가능/조건부/비상업·연구용/원문 확인 필요를 모델별 원문 링크와 함께 표시
- 이기종 GPU 병렬(서로 다른 GPU 두 대의 VRAM·대역폭·연산량 합산, 메모리 분할·통신 손실 반영) 지원 추가
- 요청받은 NVIDIA P102-100 10GB(채굴카드) GPU 프리셋 추가
- 리랭커·LLM·임베딩·OCR/VLM 모델 164종에 출처 연결 공개 품질 벤치마크 수치 추가
- 첫 화면을 카드형 중심에서 목록형 빠른 비교 화면으로 개편
- README Mermaid 다이어그램을 제거하고 자동 양자화 수식 렌더링 오류 수정
- 하드웨어 입력과 고급 설정을 접힘 영역 없이 기본 노출되도록 변경
- 브라우저 보안 제약으로 정확도가 낮은 PC 자동 감지 기능 제거
- 생성형 LLM, 임베딩, 리랭커, 경량 OCR, 문서 VLM, 범용 VLM 탭 추가
- 임베딩 모델 60종, 리랭커 34종, OCR/VLM 모델 45종 추가
- EmbeddingGemma, Jina Embeddings v4, BGE multilingual Gemma2/code/en-ICL, GTE-Qwen2, E5-Mistral, SFR, Granite R2, Stella, Nomic, KURE/KoE5/dragonkue 한국어 임베딩 추가
- bge-reranker-v2.5-gemma2-lightweight, mxbai-rerank v2, gte-reranker-modernbert, Granite reranker R2, Jina v1, BCE, 한국어 리랭커, Sentence Transformers cross-encoder 기준선 추가
- PaddleOCR-VL-1.6, MinerU2.5-Pro, DeepSeek-OCR-2, dots.ocr, dots.mocr, olmOCR-2, DeepSeek-VL2, Qwen3-VL, Qwen2.5-VL, Qwen2-VL, Llama 3.2 Vision, Pixtral, LLaVA-OneVision, Molmo, SmolVLM2, Phi-4 multimodal, Aya Vision, GLM-4.1V, MiniCPM-V, InternVL3.5, Kimi-VL 추가
- 임베딩 encoder FLOPs/activation, 리랭커 query latency, OCR 해상도/megapixel 기반 계산식 추가
- 모든 워크로드에 공통 적용되는 이미 사용 중인 VRAM/안전 여유분 입력과 가용 VRAM 기준 등급 계산 추가
- 컨텍스트, 동시 요청, 출력 토큰, RAG 배치, OCR 배치 페이지에 프리셋과 직접 입력을 함께 제공
- H100/A100 같은 데이터센터 GPU를 빠르게 찾을 수 있도록 GPU 프리셋 검색 입력 추가
- 적합도 요약을 클릭 가능한 필터 칩으로 변경
- 모델 클릭 시 양자화별 비교, VRAM 상세 분석, 실행 방식별 비교, 예시 명령어를 보여주는 상세 패널 추가
- GPU/VRAM/RAM/컨텍스트/필터/선택 모델을 URL 쿼리로 공유할 수 있도록 변경

## v1.0.0 - First public release

- GPU 프리셋 86종
- LLM 모델 114종
- 양자화 옵션 8종
- WebGPU/WebGL 기반 GPU 자동 감지 및 프리셋 추정 매칭
- Ollama, llama.cpp, vLLM, Transformers 조건별 메모리 추정
- 컨텍스트 길이, 동시 요청 수, 평균 출력 토큰, KV cache 정밀도 반영
- GitHub Pages 공개 데모 준비
- 모델/GPU/벤치마크 제보용 Issue template 추가
