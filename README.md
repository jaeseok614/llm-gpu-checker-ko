# LLM GPU Checker

<p align="center">
  <img src="./assets/gpu-board.svg" alt="LLM GPU Checker" width="96" />
</p>

<p align="center">
  <strong>내 GPU에서 생성형 LLM, 임베딩, 리랭커, OCR/VLM 모델을 현실적으로 실행할 수 있는지 확인하세요.</strong><br />
  Korean web-based AI model compatibility, VRAM, RAG, and OCR workload calculator.
</p>

<p align="center">
  <a href="https://jaeseok614.github.io/llm-gpu-checker-ko/"><strong>웹에서 바로 사용하기</strong></a>
  ·
  <a href="#계산-기준">계산 기준 보기</a>
  ·
  <a href="https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new/choose">모델·GPU 추가 요청</a>
</p>

<p align="center">
  <img alt="Static app" src="https://img.shields.io/badge/static-HTML%20%2B%20CSS%20%2B%20JS-225ea8" />
  <img alt="GitHub Pages" src="https://img.shields.io/badge/demo-GitHub%20Pages-13795b" />
  <img alt="Korean UI" src="https://img.shields.io/badge/UI-Korean-5f4bb6" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-9a6700" />
</p>

![앱 미리보기](./docs/preview.svg)

## 10초 사용 흐름

```mermaid
flowchart LR
  A[GPU 프리셋 선택] --> B[VRAM·RAM·GPU 수 확인]
  B --> C[워크로드 탭 선택<br/>LLM·임베딩·리랭커·OCR/VLM]
  C --> D[모델별 조건 조정]
  D --> E[모델 클릭]
  E --> F[메모리·속도·계산 근거 상세 분석]
  F --> G[URL로 설정 공유]
```

## 대표 사용 사례

| 질문 | 앱에서 확인할 값 |
| --- | --- |
| RTX 3060 12GB에서 Qwen 계열 모델은 어디까지 가능할까? | `GeForce RTX 3060 12GB`, `한국어`, `Qwen` 검색 |
| RTX 4090 24GB로 32B Q4 모델을 돌릴 수 있을까? | `GeForce RTX 4090 24GB`, `Q4_K_M`, `32B` 검색 |
| Mac 32GB에서 로컬 LLM은 어느 정도까지 가능할까? | Apple Silicon 프리셋 선택 후 VRAM/RAM 직접 조정 |
| A100 80GB 2장으로 동시 요청을 몇 개 처리할 수 있을까? | `A100 80GB`, `GPU 수 2`, `동시 요청` 변경 |
| bge-m3 임베딩을 배치 32개로 돌리면 얼마나 빠를까? | `임베딩` 탭, `BAAI/bge-m3`, `평균 입력 길이`, `배치 크기` 변경 |
| OCR로 A4 300DPI 문서를 처리하려면 VRAM이 얼마나 필요할까? | `경량 OCR` 탭, `A4 300 DPI`, `PP-OCRv6 Medium` 선택 |
| PDF를 Markdown으로 복원하는 문서 VLM은 어떤 GPU가 필요할까? | `문서 VLM` 탭, `PaddleOCR-VL`, `MinerU`, `olmOCR` 검색 |
| DeepSeek-VL2나 Qwen2.5-VL 같은 범용 VLM으로 문서 질의응답을 돌릴 수 있을까? | `범용 VLM` 탭, `DeepSeek-VL2`, `Qwen2.5-VL`, `Llama Vision` 검색 |

## 지원 규모

| 데이터 | 개수 |
| --- | ---: |
| GPU 프리셋 | 86 |
| 전체 AI 모델 | 200 |
| LLM 모델 | 114 |
| 임베딩 모델 | 27 |
| 리랭커 모델 | 14 |
| 경량 OCR 모델 | 4 |
| 문서 VLM 모델 | 9 |
| 범용 VLM 모델 | 32 |
| 양자화 옵션 | 8 |
| 임베딩/OCR 정밀도 옵션 | FP32, FP16, BF16, INT8, INT4 |
| 모델 공급사 | 40 |
| 비전/멀티모달 모델 | 64 |

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| GPU 프리셋/검색 | GeForce RTX, RTX Pro/Quadro, NVIDIA 데이터센터(H100/A100 포함), AMD, Intel, Apple Silicon 포함 |
| 직접 입력 | VRAM, GPU 수, 시스템 RAM, 대역폭, 컨텍스트, 동시 요청, 출력 토큰, 배치 크기 직접 조정 |
| 워크로드 탭 | 생성형 LLM, 임베딩, 리랭커, 경량 OCR, 문서 VLM, 범용 VLM을 분리 계산 |
| 서빙 조건 | 컨텍스트 길이, 동시 요청 수, 평균 출력 토큰을 프리셋 또는 직접 입력으로 조정 |
| RAG 조건 | 임베딩 입력 길이, 배치 크기, TEI 최대 배치 토큰, 리랭킹 후보 수를 프리셋 또는 직접 입력으로 조정 |
| OCR/VLM 조건 | 문서 해상도, 이미지 너비/높이, 배치 페이지, 처리 기능 조정 |
| 양자화 선택 | 자동 추천, Q2/Q3/Q4/Q5/Q6/Q8/FP16 |
| 정밀도 선택 | 임베딩·리랭커·OCR용 FP32/FP16/BF16/INT8/INT4 분리 |
| 실행 등급 | 쾌적, 잘 돌아감, 가능, 빡빡함, 오프로딩, 부적합 |
| 빠른 목록 | 모델명, 등급, 권장 양자화, 필요 VRAM, 예상 속도, 컨텍스트를 한 줄로 비교 |
| 상세 분석 | 모델 클릭 시 정밀도별 비교, VRAM 구성, 실행 방식별 속도, 계산 근거, 예시 명령어 표시 |
| 모델 필터 | 한국어, 코딩, 추론, 긴 문서, 비전/멀티모달, 임베딩, 리랭커, OCR, 문서 VLM, 범용 VLM |
| 공급사 필터 | Meta, Google, Alibaba, DeepSeek, Mistral AI, Microsoft 등 공급사별 필터 |
| 라이선스 필터 | Apache 2.0, MIT, Llama, Gemma, MRL 등 라이선스별 필터 |
| 정렬 | 추천순, 예상 속도순, 품질 우선, 필요 VRAM 낮은 순, 파라미터 큰 순, 최신 모델순 |
| URL 상태 저장 | GPU, VRAM, RAM, 컨텍스트, 동시 요청, 필터, 선택 모델을 쿼리 파라미터로 공유 |

## 화면 흐름

```mermaid
flowchart LR
  subgraph Hardware[하드웨어 기준]
    A[GPU·VRAM·RAM]
    B[공통 성능 입력<br/>대역폭·GPU 수]
  end

  subgraph Workload[워크로드 탭]
    W1[생성형 LLM<br/>컨텍스트·KV cache·양자화]
    W2[임베딩<br/>입력 토큰·배치·정밀도]
    W3[리랭커<br/>질의+문서·후보 수]
    W4[경량 OCR<br/>해상도·좌표·페이지 배치]
    W5[문서 VLM<br/>PDF→Markdown·표·수식]
    W6[범용 VLM<br/>문서 QA·화면 이해]
  end

  subgraph Estimate[타입별 추정]
    H[Peak VRAM 계산]
    I[가중치/상주 모델]
    J[작업 메모리<br/>KV·activation·attention·image buffer]
    K[런타임/배치 오버헤드]
    L{실행 등급 산정}
  end

  subgraph List[첫 화면]
    M[적합도 칩 필터]
    N[목록형 모델 비교]
    O[검색·용도·공급사·라이선스·정렬]
  end

  subgraph Detail[모델 상세]
    P[양자화/정밀도별 VRAM/속도]
    R[VRAM 상세 분석]
    S[런타임·기능별 비교]
    T[계산식·실행 예시·외부 링크]
  end

  A --> B
  B --> W1
  B --> W2
  B --> W3
  B --> W4
  B --> W5
  B --> W6
  W1 --> H
  W2 --> H
  W3 --> H
  W4 --> H
  W5 --> H
  W6 --> H
  H --> I
  H --> J
  H --> K
  H --> L
  I --> L
  J --> L
  K --> L
  L --> M
  L --> N
  O --> N
  N --> P
  P --> R
  P --> S
  S --> T
```

## 계산 기준

### Methodology, Formula-Oriented

This calculator uses a deterministic heuristic model. It estimates whether a local LLM can fit into the selected hardware budget under a given quantization, context length, concurrency, output length, KV cache precision, and runtime backend.

#### Notation

| Symbol | Meaning |
| --- | --- |
| `P` | Total model parameters in billions |
| `A` | Active parameters per token in billions, especially relevant for MoE models |
| `b_q` | Bytes per parameter for quantization `q` |
| `C` | Selected context length in tokens |
| `C_max` | Model maximum context length in tokens |
| `N` | Concurrent requests |
| `O` | Average generated output tokens per request |
| `k` | KV cache precision factor |
| `G` | Number of GPUs |
| `V` | VRAM per GPU in GB |
| `R` | System RAM in GB |
| `B` | Memory bandwidth in GB/s |

#### Memory Model

The model weight footprint is approximated as:

$$
M_{weights} = P \cdot b_q \cdot 1.08
$$

The `1.08` multiplier covers metadata, tensor layout overhead, and practical loader overhead. The calculator uses decimal GB-style estimation, where 1B parameters at 1 byte per parameter is treated as roughly 1 GB.

The KV cache grows with active parameters, context length, concurrency, and KV precision:

$$
M_{KV} = A \cdot 0.09 \cdot \frac{C}{4096} \cdot N \cdot k
$$

KV precision factors:

| KV precision | `k` |
| --- | ---: |
| FP16/BF16 | `1.00` |
| FP8 | `0.55` |
| Q8 | `0.60` |
| Q4 | `0.35` |

Runtime overhead is modeled per backend:

$$
M_{runtime} = base_r + \min(cap_r,\alpha_r \cdot M_{weights}) + \max(0,N-1)\cdot \beta_r
$$

| Runtime | `base_r` | `cap_r` | `alpha_r` | `beta_r` |
| --- | ---: | ---: | ---: | ---: |
| llama.cpp / Ollama | `1.2` | `3.0` | `0.06` | `0.08` |
| vLLM | `2.6` | `5.5` | `0.10` | `0.12` |
| Transformers | `2.2` | `4.5` | `0.09` | `0.18` |

Total estimated VRAM:

$$
M_{required} = M_{weights} + M_{KV} + M_{runtime}
$$

Effective GPU memory:

$$
M_{effective} =
\begin{cases}
V \cdot G, & G = 1 \\
V \cdot G \cdot 0.92, & G > 1
\end{cases}
$$

The multi-GPU `0.92` factor approximates memory loss from sharding, communication buffers, and uneven placement.

#### Fit Grade

First, the selected context must fit the model limit:

$$
C \le C_{max}
$$

Then the memory pressure ratio is:

$$
\rho = \frac{M_{required}}{M_{effective}}
$$

Offload room includes partial use of system RAM:

$$
M_{offload} = M_{effective} + 0.45R
$$

| Grade | Condition |
| --- | --- |
| `S` 쾌적 | `rho <= 0.70` |
| `A` 잘 돌아감 | `0.70 < rho <= 0.85` |
| `B` 가능 | `0.85 < rho <= 1.00` |
| `C` 빡빡함 | `1.00 < rho <= 1.12` |
| `D` 오프로딩 | `M_required <= M_offload` |
| `F` 부적합 | Context overflow or memory exceeds offload room |

#### Throughput and Response-Time Model

The token throughput estimate is bandwidth-oriented:

$$
T_{raw} =
\frac{B \cdot G \cdot m_G \cdot m_r}
{\max(A \cdot b_q, 1)\cdot 4}
$$

Runtime and multi-GPU multipliers:

| Factor | Value |
| --- | --- |
| `m_G` | `1.00` for single GPU, `0.76` for multi-GPU |
| `m_r` | `1.00` llama.cpp/Ollama, `1.10` vLLM, `0.78` Transformers |

Offload and tight-memory penalty:

| Grade | `p_fit` |
| --- | ---: |
| `S/A/B` | `1.00` |
| `C` | `0.55` |
| `D` | `0.22` |
| `F` | `0.00` |

Backend concurrency efficiency:

| Runtime | `eta_r` |
| --- | ---: |
| llama.cpp / Ollama | `0.55` |
| vLLM | `0.78` |
| Transformers | `0.38` |

Total and per-request throughput:

$$
T_{total}=T_{raw}\cdot(1+(N-1)\eta_r)\cdot p_{fit}
$$

$$
T_{request}=\frac{T_{total}}{N}
$$

Average generation latency is derived from output length:

$$
L_{generation}=\frac{O}{T_{request}}
$$

Estimated time to first token:

$$
L_{first}=
\left(0.18+\min(5,0.025A)+0.08\frac{C}{8192}+0.025\max(0,N-1)\right)
\cdot u_r \cdot u_{fit}
$$

| Runtime | `u_r` |
| --- | ---: |
| llama.cpp / Ollama | `1.00` |
| vLLM | `0.85` |
| Transformers | `1.20` |

| Grade | `u_fit` |
| --- | ---: |
| `S/A/B` | `1.00` |
| `C` | `1.60` |
| `D` | `2.40` |

#### Auto Quantization Policy

When quantization is set to `자동 추천`, the calculator searches from higher quality to lower quality:

$$
q \in \{Q6\_K,\ Q5\_K\_M,\ Q4\_K\_M,\ Q3\_K\_M,\ Q2\_K\}
$$

The first quantization that satisfies the memory budget is selected:

$$
M_{required}(q) \le 0.85M_{effective}
$$

If no option satisfies that comfortable threshold, the calculator tries:

$$
M_{required}(q) \le M_{effective}
$$

and then:

$$
M_{required}(q) \le M_{offload}
$$

If all checks fail, `Q2_K` is used as the last possible comparison baseline.

### Encoder, Reranker, And OCR/VLM Methodology

Embedding and reranker models are encoder-style workloads. They do not keep a decoder KV cache across generated tokens, so the calculator uses an activation/attention workspace model instead of the LLM decoder model.

#### Embedding Encoder Memory

For an embedding model with batch size `B_e`, input length `T`, hidden size `H`, layers `L`, attention heads `A_h`, and precision byte width `s`:

$$
M_{weights}=P\cdot s\cdot1.08
$$

$$
M_{state}=\frac{B_e\cdot T\cdot H\cdot s}{10^9}
$$

$$
M_{activation}\approx M_{state}\cdot f_{hidden,r}
$$

If Flash Attention or a similarly memory-efficient kernel is assumed:

$$
M_{attention}\approx M_{state}\cdot f_{attn,r}
$$

Otherwise:

$$
M_{attention}\approx
\frac{B_e\cdot A_h\cdot T^2\cdot s\cdot f_{attn,r}}{10^9}
$$

The total peak memory is:

$$
M_{required}=M_{weights}+M_{activation}+M_{attention}+M_{output}+M_{runtime}
$$

Hugging Face Text Embeddings Inference uses token-based dynamic batching, so the effective micro-batch is:

$$
B_{micro}=\min\left(B_e,\left\lfloor\frac{T_{batch,max}}{T}\right\rfloor\right)
$$

The encoder compute estimate is:

$$
F_{encoder}\approx
L\cdot\left(24B_{micro}TH^2+4B_{micro}T^2H\right)
$$

Batch time is estimated from the slower side of compute and memory movement:

$$
t_{batch}\approx
\max\left(
\frac{F_{encoder}}{TFLOPS_{eff}\cdot \eta_{compute,r}},
\frac{bytes_{read}}{BW\cdot \eta_{mem,r}}
\right)+\delta_r
$$

Then:

$$
docs/s=\frac{B_{micro}}{t_{batch}}
$$

$$
tokens/s=docs/s\cdot T
$$

#### Cross-Encoder Reranker

For reranking, the input is a query-document pair:

$$
T_{pair}=T_{query}+T_{document}+T_{special}
$$

The same encoder memory and FLOPs formula is applied with `T = T_pair`. A single user query usually reranks `K` candidate documents:

$$
passes=\left\lceil\frac{K}{B_r}\right\rceil
$$

$$
latency_{query}\approx passes\cdot t_{batch}
$$

$$
pairs/s=\frac{B_r}{t_{batch}}
$$

#### OCR And VLM Categories

OCR workloads are separated into three model families because their peak memory drivers are different.

| Family | Calculator tab | Main memory driver |
| --- | --- | --- |
| Lightweight OCR pipeline | `경량 OCR` | Resident detection/recognition modules and image feature maps |
| Document-specialized VLM | `문서 VLM` | Vision encoding, image tokens, decoder KV cache, structured output length |
| General VLM | `범용 VLM` | Image/video tokens, conversation context, decoder KV cache, generated answer length |

#### Lightweight OCR Pipeline

OCR models are image workloads, so the first-order driver is image size:

$$
MP=\frac{W\cdot H}{10^6}
$$

For a classical OCR pipeline such as PP-OCR:

$$
M_{peak}\approx
M_{resident}+B_o\cdot MP\cdot \alpha_{model}+M_{image}+M_{runtime}
$$

The image buffer is:

$$
M_{image}=\frac{B_o\cdot W\cdot H\cdot channels\cdot s\cdot bufferFactor}{10^9}
$$

For sequential detection, recognition, and layout modules, the peak activation term counts the largest active stage rather than summing every stage:

$$
M_{activation,peak}\approx
\max(M_{det}, M_{rec}, M_{layout}, M_{table}, M_{formula})
$$

#### Document VLM And General VLM

For document-specialized VLMs and general VLMs used as OCR engines, decoder KV cache is added:

$$
M_{KV}= \frac{
2\cdot L_d\cdot B_o\cdot T_{total}\cdot H_{kv}\cdot D_{head}\cdot s
}{10^9}
$$

where:

$$
T_{total}=T_{image}+T_{prompt}+T_{output}
$$

Image token count is approximated as a model profile, not a single universal rule:

$$
T_{image}\approx
\min\left(
T_{image,max},
\frac{\left\lceil W/patch\right\rceil\cdot\left\lceil H/patch\right\rceil}{merge^2}
\right)
$$

OCR throughput is anchored to a reference benchmark when available:

$$
pages/s\approx
pps_{ref}\cdot
\sqrt{\frac{BW}{BW_{ref}}}\cdot
\left(\frac{MP_{ref}}{MP}\right)^{0.85}\cdot
f_{precision}\cdot
f_{batch}\cdot
f_{feature}^{-1}
$$

This is intentionally shown as an estimate, not a measured guarantee. OCR accuracy and speed vary heavily with preprocessing, layout complexity, language, table/formula modules, and PDF rasterization settings.

### 쉬운 설명

| 항목 | 의미 |
| --- | --- |
| 모델 가중치 | 모델 자체를 GPU에 올리는 데 필요한 메모리입니다. 모델이 클수록 커지고, Q4/Q5/Q6 같은 양자화가 낮을수록 줄어듭니다. |
| 컨텍스트 길이 | 한 번에 읽을 수 있는 텍스트 길이입니다. 8K보다 32K가 더 많은 메모리를 씁니다. 긴 문서/RAG를 돌릴수록 이 값이 중요합니다. |
| 동시 요청 수 | 동시에 몇 명이 쓰는지입니다. 1명보다 4명, 8명이 훨씬 많은 KV cache를 씁니다. |
| KV cache | 모델이 긴 대화와 문맥을 기억하기 위해 잡아두는 작업 메모리입니다. 컨텍스트 길이, 동시 요청 수, KV 정밀도에 비례해서 커집니다. |
| 평균 출력 토큰 | 답변을 평균 몇 토큰까지 생성할지입니다. VRAM 적합도보다는 “답변이 몇 초 걸릴지” 계산에 사용됩니다. |
| 런타임 오버헤드 | Ollama, llama.cpp, vLLM, Transformers가 모델 외에 추가로 쓰는 여유 메모리입니다. vLLM은 동시 처리에 강하지만 기본 오버헤드가 더 큽니다. |
| 시스템 RAM 보조 | VRAM에 딱 안 들어가도 RAM 오프로딩으로 가능할 수 있습니다. 대신 속도는 크게 느려질 수 있습니다. |
| 임베딩 입력 길이 | 문서 하나를 몇 토큰으로 임베딩할지입니다. 길수록 처리량은 줄고 activation/attention 메모리는 늘어납니다. |
| 임베딩 배치 | 한 번에 몇 문서를 임베딩할지입니다. 배치가 커지면 처리량은 좋아질 수 있지만 peak VRAM도 증가합니다. |
| 리랭커 후보 수 | 검색된 후보 문서 몇 개를 다시 점수화할지입니다. 후보가 많을수록 질의당 지연시간이 늘어납니다. |
| OCR 해상도 | A4 300DPI처럼 이미지가 커질수록 중간 feature map과 이미지 버퍼가 커져 VRAM 사용량이 증가합니다. |
| OCR 처리 기능 | 텍스트만 읽는 것보다 레이아웃, 표, 수식, 전체 문서 파싱을 켜면 더 많은 모델/작업공간이 필요합니다. |
| 문서 VLM | PDF를 Markdown/JSON으로 복원하는 모델입니다. 이미지 토큰, 출력 토큰, decoder KV cache까지 함께 계산합니다. |
| 범용 VLM | DeepSeek-VL2, Qwen2.5-VL, Llama Vision, Pixtral, InternVL처럼 이미지 이해와 질의응답을 같이 하는 모델입니다. OCR 전용 모델보다 목적이 넓어 출력 길이에 따른 지연시간 차이가 큽니다. |

쉽게 보면 계산기는 아래 순서로 판단합니다.

```text
1. 선택한 텍스트/이미지 입력 길이가 모델 한도를 넘는지 확인
2. 모델 가중치 + KV cache/activation/image buffer + 런타임 오버헤드를 더해 필요 VRAM 계산
3. 내 GPU의 실제 사용 가능 VRAM과 비교
4. 부족하면 시스템 RAM 오프로딩 가능성 확인
5. 메모리 여유와 예상 속도를 같이 보고 등급 결정
```

가장 많이 영향을 주는 값은 보통 아래 네 가지입니다.

| 사용자가 바꾸는 값 | 결과에 미치는 영향 |
| --- | --- |
| 양자화 | Q6/Q5는 품질이 좋지만 VRAM을 더 쓰고, Q4/Q3/Q2는 더 가볍지만 품질 손실이 커질 수 있습니다. |
| 컨텍스트 길이 | 길수록 긴 문서를 잘 다루지만 KV cache가 커져 VRAM을 더 씁니다. |
| 동시 요청 수 | 동시에 여러 명이 쓰면 요청당 속도는 줄고 KV cache는 커집니다. |
| 실행 방식 | Ollama/llama.cpp는 가볍고 단순한 편이고, vLLM은 서버형 동시 처리에 유리하며, Transformers는 범용성이 높지만 오버헤드가 다를 수 있습니다. |
| 임베딩 정밀도 | FP16/BF16은 GPU 기본 추천이고, INT8/INT4는 메모리를 줄이지만 모델과 런타임 지원 여부를 확인해야 합니다. |
| OCR/VLM DPI·배치 | DPI와 배치를 낮추면 속도와 안정성이 좋아지고, 문서 품질이 낮으면 정확도는 떨어질 수 있습니다. 문서 VLM은 출력 토큰도 길어질수록 느려집니다. |

| 등급 | 의미 |
| --- | --- |
| 쾌적 | 여유 VRAM이 커서 안정적 |
| 잘 돌아감 | 일반적인 로컬 추론에 적합 |
| 가능 | 실행 가능하지만 설정 여유가 작음 |
| 빡빡함 | 컨텍스트/동시 요청/배치 축소 권장 |
| 오프로딩 | RAM 보조가 필요하고 속도 저하 예상 |
| 부적합 | 현재 입력 조건으로는 권장하지 않음 |

## 실제 실행 검증

계산기는 추정 도구입니다. 실제 벤치마크가 쌓일수록 정확도가 좋아집니다. 실행 결과가 있다면 [Benchmark report](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml)로 제보해 주세요.

| GPU | 모델 | 설정 | 계산기 결과 | 실제 결과 |
| --- | --- | --- | --- | --- |
| RTX 4090 24GB | Qwen2.5 32B Instruct | Q4, 8K, 동시 1명 | 가능 | 제보 대기 |
| RTX 3060 12GB | Llama 3.1 8B Instruct | Q4, 4K, 동시 1명 | 가능 | 제보 대기 |
| A100 80GB x2 | Llama 3.3 70B Instruct | Q4, 16K, 동시 4명 | 잘 돌아감 | 제보 대기 |
| RTX 4090 24GB | BAAI/bge-m3 | FP16, 384 tokens, batch 32 | 쾌적 | 제보 대기 |
| A100 80GB | MinerU2.5-Pro-2604 1.2B | BF16, A4 300DPI, batch 1 | 쾌적 | 제보 대기 |
| RTX 4090 24GB | PaddleOCR-VL-1.6 | BF16, A4 200DPI, batch 1 | 잘 돌아감 | 제보 대기 |

## 데이터 구조

```mermaid
flowchart TB
  subgraph Data[data 폴더]
    G[gpus.js<br/>GPU 프리셋]
    Q[quantizations.js<br/>양자화 기준]
    P[precision-profiles.js<br/>정밀도·런타임 프로필]
    M[models.js<br/>LLM 모델 목록]
    E[embedding-models.js<br/>임베딩 모델]
    R[reranker-models.js<br/>리랭커 모델]
    O[ocr-models.js<br/>경량 OCR·문서 VLM·범용 VLM]
  end

  subgraph App[브라우저 앱]
    UI[index.html<br/>입력 UI]
    Logic[app.js<br/>계산/필터/렌더링]
    Style[styles.css<br/>화면 스타일]
  end

  G --> Logic
  Q --> Logic
  P --> Logic
  M --> Logic
  E --> Logic
  R --> Logic
  O --> Logic
  UI --> Logic
  Style --> UI
  Logic --> List[목록형 모델 비교]
  Logic --> Detail[모델 상세 분석 패널]
```

## 로컬 실행

브라우저에서 `index.html`을 직접 열면 됩니다. 로컬 서버로 확인하려면:

```bash
python3 -m http.server 8787
```

```text
http://127.0.0.1:8787
```

## 데이터 추가

생성형 LLM은 `data/models.js`에 아래 형식으로 항목을 추가하면 됩니다.

```js
{
  name: "Example 14B Instruct",
  maker: "Example",
  params: 14,
  active: 14,
  context: 32,
  license: "Apache 2.0",
  tags: ["general", "korean"],
  summary: "모델 카드에 표시될 한국어 설명입니다.",
}
```

지원 태그:

```text
general, korean, coding, reasoning, long, edge, vision,
embedding, reranker, retrieval, sparse, dense, multilingual,
matryoshka, ocr, document, document-vlm, general-vlm, vlm,
layout, table, math, handwriting, pdf, markdown, chart, video,
grounding, audio, gui, seal, spotting, coordinate, screen, mobile, agent, legacy,
classification, clustering, matching, codeRetrieval
```

임베딩 모델은 `data/embedding-models.js`에 추가합니다.

```js
{
  type: "embedding",
  name: "Example embedding model",
  maker: "Example",
  params: 0.3,
  hiddenSize: 768,
  layers: 12,
  attentionHeads: 12,
  maxTokens: 8192,
  embeddingDim: 768,
  pooling: "CLS",
  license: "Apache 2.0",
  tags: ["embedding", "retrieval", "korean"],
  precisions: ["fp32", "fp16", "bf16", "int8"],
  supportsFlashAttention: true,
  summary: "모델 카드에 표시될 한국어 설명입니다.",
}
```

OCR/VLM 모델은 `data/ocr-models.js`에 아래 타입으로 추가합니다.

| 타입 | 표시 탭 | 용도 |
| --- | --- | --- |
| `ocr-pipeline` | 경량 OCR | PP-OCR처럼 검출/인식/좌표 추출 중심 |
| `document-vlm` | 문서 VLM | PDF→Markdown, 표·수식·레이아웃 복원 |
| `general-vlm` | 범용 VLM | OCR-like 추출, 문서 질의응답, 화면 이해 |

OCR/VLM은 모델별 activation 계수와 reference benchmark가 중요하므로, 실제 측정값이 있으면 `reference`에 함께 넣는 것이 좋습니다.

## 검증

Node.js가 있으면 문법과 데이터 구조를 확인할 수 있습니다.

```bash
npm run check
```

## 정확도와 한계

브라우저는 보안상 `nvidia-smi`처럼 정확한 VRAM, 드라이버, GPU 점유율을 직접 읽을 수 없습니다. 그래서 이 계산기는 자동 감지 대신 GPU 프리셋 선택과 직접 입력값을 기준으로 계산합니다.

실제 실행 가능 여부와 속도는 드라이버, CUDA/ROCm, 런타임, 모델 구현, KV cache precision, 배치 크기, CPU/RAM 성능에 따라 달라질 수 있습니다.

임베딩·리랭커 처리량은 tokenizer, padding, dynamic batching, Flash Attention/xFormers 사용 여부에 따라 달라집니다. OCR 처리량은 PDF rasterization, DPI, 문서 레이아웃, 표/수식 모듈, 이미지 전처리 옵션의 영향을 크게 받습니다.

## 참고한 공식 자료

- [BAAI/bge-m3 model card](https://huggingface.co/BAAI/bge-m3)
- [Qwen3 Embedding model cards](https://huggingface.co/Qwen/Qwen3-Embedding-0.6B)
- [Qwen3 Reranker model cards](https://huggingface.co/Qwen/Qwen3-Reranker-0.6B)
- [BAAI/bge-reranker-v2-m3 model card](https://huggingface.co/BAAI/bge-reranker-v2-m3)
- [Alibaba-NLP/gte-multilingual-base model card](https://huggingface.co/Alibaba-NLP/gte-multilingual-base)
- [Alibaba-NLP/gte-multilingual-reranker-base model card](https://huggingface.co/Alibaba-NLP/gte-multilingual-reranker-base)
- [jina-embeddings-v5-text-small model card](https://huggingface.co/jinaai/jina-embeddings-v5-text-small)
- [Hugging Face Text Embeddings Inference docs](https://huggingface.co/docs/text-embeddings-inference/main/en/index)
- [Sentence Transformers inference efficiency docs](https://www.sbert.net/docs/sentence_transformer/usage/efficiency.html)
- [PaddleOCR home and PP-OCRv6 release notes](https://www.paddleocr.ai/main/en/index.html)
- [PaddleOCR PP-OCRv6 documentation](https://www.paddleocr.ai/latest/en/version3.x/algorithm/PP-OCRv6/PP-OCRv6.html)
- [PaddleOCR-VL-1.6 model card](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.6)
- [MinerU2.5-Pro-2604-1.2B model card](https://huggingface.co/opendatalab/MinerU2.5-Pro-2604-1.2B)
- [DeepSeek-OCR-2 model card](https://huggingface.co/deepseek-ai/DeepSeek-OCR-2)
- [dots.ocr model card](https://huggingface.co/rednote-hilab/dots.ocr)
- [dots.mocr model card](https://huggingface.co/rednote-hilab/dots.mocr)
- [olmOCR-2-7B-1025 model card](https://huggingface.co/allenai/olmOCR-2-7B-1025)
- [Qwen3-VL-2B-Instruct model card](https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct)
- [DeepSeek-VL2 repository](https://github.com/deepseek-ai/DeepSeek-VL2)
- [DeepSeek-VL2 Small model card](https://huggingface.co/deepseek-ai/deepseek-vl2-small)
- [Qwen2.5-VL-7B-Instruct model card](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct)
- [Qwen2-VL-2B-Instruct model card](https://huggingface.co/Qwen/Qwen2-VL-2B-Instruct)
- [Llama 3.2 11B Vision model card](https://huggingface.co/meta-llama/Llama-3.2-11B-Vision-Instruct)
- [Pixtral 12B model card](https://huggingface.co/mistralai/Pixtral-12B-Base-2409)
- [Pixtral Large model card](https://huggingface.co/mistralai/Pixtral-Large-Instruct-2411)
- [LLaVA-OneVision Qwen2 7B model card](https://huggingface.co/llava-hf/llava-onevision-qwen2-7b-ov-hf)
- [Molmo-7B-D model card](https://huggingface.co/allenai/Molmo-7B-D-0924)
- [SmolVLM2 model release](https://huggingface.co/blog/smolvlm2)
- [Phi-4 multimodal model card](https://huggingface.co/microsoft/Phi-4-multimodal-instruct)
- [Aya Vision 8B model card](https://huggingface.co/CohereLabs/aya-vision-8b)
- [GLM-4.1V-9B-Thinking model card](https://huggingface.co/zai-org/GLM-4.1V-9B-Thinking)
- [MiniCPM-V-4.6 model card](https://huggingface.co/openbmb/MiniCPM-V-4.6)
- [InternVL3.5-4B model card](https://huggingface.co/OpenGVLab/InternVL3_5-4B)
- [Kimi-VL-A3B-Instruct model card](https://huggingface.co/moonshotai/Kimi-VL-A3B-Instruct)
- [PaddleOCR PP-StructureV3 benchmark](https://paddlepaddle.github.io/PaddleOCR/v3.0.1/en/version3.x/algorithm/PP-StructureV3/PP-StructureV3.html)
- [GOT-OCR2 Transformers docs](https://huggingface.co/docs/transformers/model_doc/got_ocr2)
- [Surya OCR README](https://github.com/datalab-to/surya)

## 기여

- 모델 추가: [Model request](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=model-request.yml)
- GPU 추가: [GPU request](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml)
- 벤치마크 제보: [Benchmark report](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml)

자세한 방식은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 라이선스

[MIT License](./LICENSE)

## GPU 스펙 데이터

GPU 목록과 스펙 원천 데이터는 **[gpu-specs-kr](https://github.com/jaeseok614/gpu-specs-kr)** 프로젝트에서 관리합니다.

> Wikipedia의 NVIDIA·AMD·Intel GPU 스펙을 정규화한 오픈소스 데이터셋·REST API

- JSON · CSV · SQLite 다운로드 가능
- 1,833개 GPU (NVIDIA 959 / AMD 870 / Intel 4)
- [데이터셋 바로가기 →](https://github.com/jaeseok614/gpu-specs-kr)
