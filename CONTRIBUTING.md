# Contributing

이 프로젝트는 GPU/LLM 실행 가능성 추정 데이터를 함께 개선하는 것을 목표로 합니다.

## 제보 방식

- 새 모델 추가: GitHub Issue의 `Model request`
- 새 GPU 추가: GitHub Issue의 `GPU request`
- 실제 실행 결과: GitHub Issue의 `Benchmark report`

## 모델 데이터 기준

`data/models.js`에 아래 필드를 추가합니다.

```js
{
  name: "Model name",
  maker: "Provider",
  params: 14,
  active: 14,
  context: 32,
  license: "Apache 2.0",
  tags: ["general", "korean"],
  summary: "한국어 설명",
}
```

- `params`: 전체 파라미터 수, B 단위
- `active`: MoE 모델의 토큰당 활성 파라미터 수, dense 모델은 `params`와 동일
- `context`: 최대 컨텍스트 길이, K 단위
- `tags`: `general`, `korean`, `coding`, `reasoning`, `long`, `edge`, `vision` 중 선택

## GPU 데이터 기준

`data/gpus.js`에 아래 필드를 추가합니다.

```js
{ id: "gpu-id", name: "GPU name", vram: 24, ram: 64, bandwidth: 1008 }
```

- `vram`: GPU VRAM 또는 통합메모리, GB 단위
- `ram`: 권장 시스템 RAM, GB 단위
- `bandwidth`: 메모리 대역폭, GB/s 단위

## 검증

변경 후 아래 명령을 실행합니다.

```bash
npm run check
```

## Pull Request 기준

- 데이터 출처를 PR 설명이나 Issue에 남겨 주세요.
- 특정 벤더 홍보 문구보다 수치와 재현 가능한 설정을 우선합니다.
- 계산식 변경은 README의 `계산 기준`도 함께 수정해 주세요.
