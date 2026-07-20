# Changelog

## Unreleased

- 첫 화면을 카드형 중심에서 목록형 빠른 비교 화면으로 개편
- 하드웨어 입력과 고급 설정을 접힘 영역 없이 기본 노출되도록 변경
- 브라우저 보안 제약으로 정확도가 낮은 PC 자동 감지 기능 제거
- 생성형 LLM, 임베딩, 리랭커, OCR·문서 분석 탭 추가
- 임베딩 모델 4종, 리랭커 4종, OCR·문서 모델 6종 추가
- 임베딩 encoder FLOPs/activation, 리랭커 query latency, OCR 해상도/megapixel 기반 계산식 추가
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
