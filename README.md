# LLM GPU 실행 가능성 계산기

GPU 프리셋, VRAM, RAM, 컨텍스트 길이, 양자화 방식에 따라 모델별 실행 가능성을 추정합니다.

## 실행

브라우저에서 `index.html`을 직접 열면 됩니다.

```text
llm_gpu_checker_ko/index.html
```

## 구조

```text
llm_gpu_checker_ko/
├── assets/                  # 아이콘 등 정적 자산
├── data/
│   ├── gpus.js              # GPU 프리셋
│   ├── models.js            # LLM 모델 목록
│   └── quantizations.js     # 양자화 기준
├── scripts/
│   └── validate-data.mjs    # 데이터 구조 검증
├── app.js                   # 계산/렌더링 로직
├── index.html               # 화면 구조
└── styles.css               # 스타일
```

## 포함 기능

- GPU 프리셋 및 직접 입력
- 총 VRAM, 시스템 RAM, 메모리 대역폭, GPU 수 입력
- 자동 양자화 추천 또는 Q2/Q3/Q4/Q5/Q6/Q8/FP16 직접 선택
- 모델별 실행 등급: 쾌적, 잘 돌아감, 가능, 빡빡함, 오프로딩, 부적합
- 한국어, 코딩, 추론, 긴 문서 필터
- 실행 적합도, 모델 크기, 예상 속도 정렬
- WebGPU 기반 브라우저 GPU 감지 버튼
- 파일을 더블클릭해도 동작하도록 데이터는 `data/*.js`로 분리

## 검증

Node.js가 있으면 아래 명령으로 JS 문법과 데이터 구조를 확인할 수 있습니다.

```bash
npm run check
```

## 계산 기준

필요 VRAM은 가중치 크기, KV cache, 런타임 오버헤드를 합산한 추정치입니다.  
실제 값은 모델 구현, CUDA/ROCm, vLLM/Ollama/llama.cpp 설정, 배치 크기, KV cache precision에 따라 달라집니다.

## 다음 확장 후보

- 사용자가 모델/하드웨어를 추가하는 관리자 화면
- Ollama, vLLM, Hugging Face 모델 카드 링크 연결
- 서버에서 `nvidia-smi` 결과를 읽어 자동 입력하는 API 추가
