# 첫 10개 실측 데이터 수집 계획

현재 저장소의 `benchmarks.js`에는 외부 공개 참고값과 사용자·자체 측정값을 구분해서 저장합니다. 실제 장비에서 실행하지 않은 수치는 실측으로 추가하지 않습니다.

## 우선 측정 조합

| GPU | 모델 | 권장 실행 |
| --- | --- | --- |
| RTX 3060 12GB | Qwen3 8B, Llama 3.1 8B, Gemma 3 4B | llama.cpp Q4_K_M |
| RTX 4090 24GB | Qwen3 14B, Qwen3 30B-A3B, Gemma 3 12B | llama.cpp Q4_K_M |
| RTX 5090 32GB | Qwen3 30B-A3B, Qwen3 32B, Gemma 3 27B | llama.cpp Q4_K_M |

각 조합을 프롬프트 길이 2개(짧은 입력·긴 입력)로 측정하면 총 10개 행이 됩니다. 반드시 GPU, VRAM, 양자화, 런타임, 컨텍스트, 입력·출력 토큰 수를 함께 기록하세요.

## 수집 명령

```bash
node scripts/benchmark-cli.mjs \
  --runtime llamacpp \
  --model Qwen3-8B-Q4_K_M \
  --gpu "RTX 3060 12GB" \
  --context 8192 \
  --input-tokens 512 \
  --output-tokens 128
```

출력 JSON을 `Benchmark report` Issue 템플릿에 붙여넣으면 됩니다. JSON을 검토한 뒤에만 `data/benchmarks.js`에 `evidenceType: "user"` 또는 `"project"`로 추가합니다.

> 이 문서는 측정 계획입니다. 실제 측정값을 대신하지 않으며, 계산 추정치와 실측값을 혼합하지 않습니다.
