# 계산 기준 (Methodology)

이 문서는 계산기가 사용하는 수식과 근거를 그대로 정리한 것입니다. 짧은 설명은 [README](../README.md)를, 실측값과 추정값이 왜 다를 수 있는지는 [정확도와 한계](./accuracy-and-limits.md)를 참고하세요.

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
| `G_i` | Number of GPUs of type `i` |
| `V_i` | VRAM per GPU of type `i`, in GB |
| `R` | System RAM in GB |
| `B_i` | Memory bandwidth per GPU of type `i`, in GB/s |
| `M_reserved` | VRAM already occupied by other running workloads |
| `M_safety` | User-selected free VRAM buffer |
| `M_budget` | VRAM budget available to the model being evaluated |

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

Total estimated model VRAM:

$$
M_{required} = M_{weights} + M_{KV} + M_{runtime}
$$

Physical and sharding-adjusted GPU memory use the sum of every selected GPU type:

$$
M_{physical}=\sum_i V_iG_i
$$

$$
M_{pool}=M_{physical}\cdot\eta_{shard}
$$

| GPU layout | `eta_shard` |
| --- | ---: |
| Single GPU | `1.00` |
| Multiple identical GPUs | `0.92` |
| Heterogeneous GPUs | `0.88` |

These factors approximate memory loss from sharding, communication buffers, and uneven layer placement. Heterogeneous setups are intentionally penalized more heavily.

Because production machines often run an LLM server, embedding worker, reranker, OCR worker, or monitoring process at the same time, the calculator separates the shared GPU memory budget:

$$
M_{budget}=\max(0,\ M_{pool}-M_{reserved}-M_{safety})
$$

where `M_reserved` is VRAM already used by other workloads and `M_safety` is the user-selected buffer left empty to avoid OOM spikes.

#### Fit Grade

First, the selected context must fit the model limit:

$$
C \le C_{max}
$$

Then the memory pressure ratio is:

$$
\rho = \frac{M_{required}}{\max(M_{budget},\epsilon)}
$$

Offload room includes partial use of system RAM:

$$
M_{offload} = M_{budget} + 0.45R
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
\frac{(\sum_i B_iG_i) \cdot m_G \cdot m_r}
{\max(A \cdot b_q, 1)\cdot 4}
$$

Runtime and multi-GPU multipliers:

| Factor | Value |
| --- | --- |
| `m_G` | `1.00` single GPU, `0.76` identical multi-GPU, `0.64` heterogeneous multi-GPU |
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

When quantization is set to `자동 추천`, the calculator searches practical GGUF quantization presets from higher quality to lower quality:

| Priority | Quantization |
| ---: | --- |
| 1 | `Q6_K` |
| 2 | `Q5_K_M` |
| 3 | `Q5_K_S` |
| 4 | `Q5_0` |
| 5 | `Q4_K_M` |
| 6 | `Q4_K_S` |
| 7 | `Q4_0` |
| 8 | `Q3_K_M` |
| 9 | `Q3_K_S` |
| 10 | `Q2_K` |
| 11 | `IQ2_XXS` |

The first quantization that satisfies the memory budget is selected:

$$
M_{\mathrm{required}}(q) \le 0.85M_{\mathrm{budget}}
$$

If no option satisfies that comfortable threshold, the calculator tries:

$$
M_{\mathrm{required}}(q) \le M_{\mathrm{budget}}
$$

and then:

$$
M_{\mathrm{required}}(q) \le M_{\mathrm{offload}}
$$

If all checks fail, `IQ2_XXS` is used as the last possible comparison baseline.

### Encoder, Reranker, And OCR/VLM Methodology

Embedding and reranker models are encoder-style workloads. They do not keep a decoder KV cache across generated tokens, so the calculator uses an activation/attention workspace model instead of the LLM decoder model.

All workload families use the same shared GPU budget `M_budget`; only the model-specific `M_required` formula changes.

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
| Lightweight OCR pipeline | `OCR` | Resident detection/recognition modules and image feature maps |
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
| 평균 출력 토큰 | 답변을 평균 몇 토큰까지 생성할지입니다. VRAM 적합도보다는 "답변이 몇 초 걸릴지" 계산에 사용됩니다. |
| 런타임 오버헤드 | Ollama, llama.cpp, vLLM, Transformers가 모델 외에 추가로 쓰는 여유 메모리입니다. vLLM은 동시 처리에 강하지만 기본 오버헤드가 더 큽니다. |
| 이미 사용 중인 VRAM | 같은 GPU에서 이미 떠 있는 LLM 서버, 임베딩 서버, 리랭커, OCR 작업 등이 차지한다고 보는 메모리입니다. 모든 탭의 실행 가능 여부에서 먼저 제외합니다. |
| 안전 여유분 | 순간적인 메모리 증가와 드라이버/런타임 변동을 피하려고 일부러 비워 두는 VRAM입니다. 값이 클수록 계산 결과가 보수적으로 바뀝니다. |
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
2. 전체 GPU VRAM에서 이미 사용 중인 VRAM과 안전 여유분을 빼서 모델 가용 VRAM 계산
3. 모델 가중치 + KV cache/activation/image buffer + 런타임 오버헤드를 더해 필요 VRAM 계산
4. 필요 VRAM을 모델 가용 VRAM과 비교
5. 부족하면 시스템 RAM 오프로딩 가능성 확인
6. 메모리 여유와 예상 속도를 같이 보고 등급 결정
```

가장 많이 영향을 주는 값은 보통 아래 항목들입니다.

| 사용자가 바꾸는 값 | 결과에 미치는 영향 |
| --- | --- |
| 양자화 | Q6/Q5는 품질이 좋지만 VRAM을 더 쓰고, Q4/Q3/Q2는 더 가볍지만 품질 손실이 커질 수 있습니다. |
| 컨텍스트 길이 | 길수록 긴 문서를 잘 다루지만 KV cache가 커져 VRAM을 더 씁니다. |
| 동시 요청 수 | 동시에 여러 명이 쓰면 요청당 속도는 줄고 KV cache는 커집니다. |
| 이미 사용 중인 VRAM | 같은 GPU에 여러 모델/서버를 함께 띄운 상황을 반영합니다. 값이 커질수록 실행 가능한 모델 수가 줄어듭니다. |
| 안전 여유분 | OOM을 피하기 위한 빈 공간입니다. 운영 서버처럼 안정성이 중요하면 2~4GB 이상을 잡는 편이 안전합니다. |
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
