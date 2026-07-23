# Changelog

## Unreleased

## v1.1.0 - Multi-workload AI Hardware Planner - 2026-07-24

- 루프백 전용 로컬 실측 벤치마크 CLI(`scripts/benchmark-cli.mjs`) 추가: Ollama/llama.cpp에 실제 프롬프트를 보내 prefill/decode 속도·TTFT·peak VRAM을 측정하고 제보용 JSON 생성
- Benchmark report 이슈 템플릿에 CLI 출력 JSON을 바로 붙여넣는 칸 추가
- 모델 상세에 동일 조건 실측값이 있을 때 "예상 vs 실측 · 추정 오차 %"를 표시
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
