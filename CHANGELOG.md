# Changelog

## Unreleased

- 첫 화면을 카드형 중심에서 목록형 빠른 비교 화면으로 개편
- 하드웨어 입력과 고급 설정을 접힘 영역 없이 기본 노출되도록 변경
- 브라우저 보안 제약으로 정확도가 낮은 PC 자동 감지 기능 제거
- 생성형 LLM, 임베딩, 리랭커, 경량 OCR, 문서 VLM, 범용 VLM 탭 추가
- 임베딩 모델 60종, 리랭커 34종, OCR/VLM 모델 45종 추가
- EmbeddingGemma, Jina Embeddings v4, BGE multilingual Gemma2/code/en-ICL, GTE-Qwen2, E5-Mistral, SFR, Granite R2, Stella, Nomic, KURE/KoE5/dragonkue 한국어 임베딩 추가
- bge-reranker-v2.5-gemma2-lightweight, mxbai-rerank v2, gte-reranker-modernbert, Granite reranker R2, Jina v1, BCE, 한국어 리랭커, Sentence Transformers cross-encoder 기준선 추가
- PaddleOCR-VL-1.6, MinerU2.5-Pro, DeepSeek-OCR-2, dots.ocr, dots.mocr, olmOCR-2, DeepSeek-VL2, Qwen3-VL, Qwen2.5-VL, Qwen2-VL, Llama 3.2 Vision, Pixtral, LLaVA-OneVision, Molmo, SmolVLM2, Phi-4 multimodal, Aya Vision, GLM-4.1V, MiniCPM-V, InternVL3.5, Kimi-VL 추가
- 임베딩 encoder FLOPs/activation, 리랭커 query latency, OCR 해상도/megapixel 기반 계산식 추가
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
