# AI Hardware Fit

<p align="center">
  <img src="./assets/gpu-board.svg" alt="AI Hardware Fit" width="96" />
</p>

<p align="center">
  <strong>Compare the LLM, embedding, reranker, OCR, image, and video generation models your GPU can run<br />by VRAM, speed, quality, and licensing.</strong>
</p>

<p align="center">
  <a href="https://github.com/jaeseok614/llm-gpu-checker-ko/actions/workflows/ci.yml"><img src="https://github.com/jaeseok614/llm-gpu-checker-ko/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
</p>

<p align="center">
  <a href="https://jaeseok614.github.io/llm-gpu-checker-ko/?lang=en"><strong>Open the app</strong></a>
  · <a href="https://jaeseok614.github.io/llm-gpu-checker-ko/?mode=placement&amp;lang=en">AI Stack Placement</a>
  · <a href="./README.md">한국어</a>
  · <a href="https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml">Request a GPU</a>
</p>

![AI Hardware Fit model finder](./docs/model-finder-en.png)

## One-line version history

> Add each new release to the top as a single line. See the [CHANGELOG](./CHANGELOG.md) for complete details.

- **v3.0** — Unified Korean pricing, guided recommendations, custom models, parts fit, runtime guidance, and measurement contributions into lowest-cost, balanced, and fastest purchase decisions.
- **v2.8** — Added browser-based measurement drafts with contributor/environment records and outlier checks.
- **v2.7** — Added OS-specific runtime difficulty and launch guidance for NVIDIA, AMD, Intel, and Apple.
- **v2.6** — Added CPU, motherboard, PSU, and case products with socket, length, slot, connector, and power compatibility.
- **v2.5** — Added a custom-model calculator for Hugging Face URLs, parameters, layers, precision, context, and vision modules.
- **v2.4** — Added guided GPU recommendations based on workload, speed, budget, condition, form factor, power, and noise.
- **v2.3** — Added source-linked Korean GPU price snapshots and performance/price and VRAM/price rankings.
- **v2.2** — Added a user build calculator for model fit, recommended PSU, total system price, and upgrade order across CPU, RAM, PSU, case, and GPU.
- **v2.0** — Added measurement confidence intervals, Benchmark 2.0, GPU/model deep links, purchase TCO, and Ollama/llama.cpp/vLLM/Docker launch recipes.
- **v1.5** — Expanded to 115 GPUs and added 10 STT/TTS models, a model-first entry screen, model-request auto PRs, and benchmark coverage.
- **v1.4** — Added the model-and-budget-first GPU Advisor, price and energy inputs, current-GPU comparisons, and image/video optimizations.
- **v1.3** — Introduced normalized GPU schemas, laptop TGP scaling, measurement calibration, a dedicated media engine, and GPU detail comparison.
- **v1.2** — Added AI Stack Placement for assigning multiple models across multiple GPUs with shareable constraints and plan comparison.
- **v1.1** — Expanded the catalog with embedding, reranker, OCR/VLM workloads plus benchmark and license information.
- **v1.0** — First public release for checking local LLM compatibility, recommended quantization, and estimated speed from GPU VRAM and runtime settings.

## Highlights

- **v2.0 Decision Hub** combines measurement confidence, Benchmark 2.0, GPU/model deep links, purchase TCO, and launch recipes.
- Measurement groups expose sample count, median, range, 95% confidence interval, and estimator error.
- Purchase Advisor supports new/used prices, KRW conversion, current-GPU resale value, electricity, and ownership period.
- Launch Assistant generates Ollama, llama.cpp, vLLM, and Docker Compose configurations for the selected model and GPU.
- GPU and model comparison now supports up to four items, with dedicated mobile cards.
- 115 desktop, data-center, Apple Silicon, and laptop GPU presets
- Generative LLM, embedding, reranker, OCR, document/general VLM, image/video generation, STT, and TTS workloads
- Separate GPU-first and model/budget-first starting paths
- GPU details and three-way comparison across VRAM, bandwidth, runnable models, and estimated speed
- A model-first GPU Advisor ranked by budget, vendor, form factor, value, and monthly energy cost
- Laptop GPU TGP input with power-limit performance scaling
- A dedicated image/video engine that accounts for resolution, steps, frames, FPS, LoRA, offloading, Sage/Flash Attention, and TeaCache
- Measured-data speed calibration and confidence levels for matching GPU/model conditions
- Data-quality labels for official/estimated specifications, verification date, and measurement count
- A benchmark coverage dashboard for measured rows, GPUs, models, estimate error, and priority targets
- AI Stack Placement for assigning several models across several GPUs
- Korean and English interfaces, responsive mobile layouts, keyboard focus, and reduced-motion support

## Automated contribution pipelines

GPU and benchmark submissions start from GitHub Issues.

- [Request a GPU](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=gpu-request.yml): validates official manufacturer sources, schema, duplicates, and laptop TGP, then shows a change preview and creates a data PR after approval.
- [Report a benchmark](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=benchmark-report.yml): validates measurement conditions and units, then creates a data PR when labeled `benchmark-ready`.
- [Request a model](https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new?template=model-request.yml): validates the model card, license source, and duplicates, then creates a workload-specific data PR when labeled `model-ready`.
- Every GPU follows a normalized schema for vendor, architecture, memory type, usable memory, runtimes, and form factor.
- The Pages build stamps asset URLs with the commit hash to prevent stale browser caches.

## How to use it

1. Select a GPU. For a laptop GPU, enter its actual TGP.
2. Choose a workload and runtime conditions.
3. Review compatibility, recommended precision, VRAM composition, estimated speed, and confidence.
4. Compare GPUs in the hardware details panel or open AI Stack Placement for multi-model deployments.

All values are estimates and can vary with hardware, runtime, drivers, and input data. External references, user measurements, and project measurements are labeled separately.

## Local development

Node.js 20 or newer is required.

```bash
npm install
npm run check
```

`npm run check` validates syntax, GPU/model data, request automation, the static build, and calculation tests. `npm run build:static` writes the deployable site to `_site/`.

## Documentation

- [Calculation methodology](./docs/methodology.md)
- [Accuracy and limitations](./docs/accuracy-and-limits.md)
- [Data sources](./docs/data-sources.md)
- [GPU contribution pipeline](./docs/gpu-contribution-pipeline.md)
- [v1.4 GPU Advisor methodology and limitations](./docs/v1.4-advisor-methodology.md)
- [v1.5 catalog, audio, and dashboard](./docs/v1.5-catalog-audio-dashboard.md)
- [v2.0 decision platform](./docs/v2.0-decision-platform.md)
- [v2.2 user build calculator](./docs/v2.2-build-calculator.md)
- [v3.0 purchase decision studio methodology](./docs/v3.0-decision-studio.md)
- [Contributing](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

Repository code is distributed under the [MIT License](./LICENSE); each listed AI model retains its own license.
