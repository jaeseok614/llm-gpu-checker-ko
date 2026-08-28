/** Key-based translations for persistent shell and primary workspaces. */
(() => {
  const catalog = {
    "app.title": { ko: "내 GPU에서 돌아가는 AI 모델 찾기", en: "Find AI models for your GPU" },
    "nav.methodology": { ko: "계산 기준", en: "Methodology" },
    "nav.sources": { ko: "데이터 출처", en: "Data sources" },
    "nav.benchmarks": { ko: "벤치마크", en: "Benchmarks" },
    "nav.language": { ko: "언어 선택", en: "Language" },
    "nav.theme": { ko: "테마 선택", en: "Theme" },
    "nav.korean": { ko: "한국어", en: "Korean" },
    "nav.light": { ko: "라이트", en: "Light" },
    "nav.dark": { ko: "다크", en: "Dark" },
    "core.kicker": { ko: "30초 시작", en: "START IN 30 SECONDS" },
    "core.title": { ko: "지금 알고 있는 것 하나만 고르세요", en: "Choose the one thing you already know" },
    "core.note": { ko: "선택한 작업에 필요한 화면만 열고 다음 단계까지 안내합니다.", en: "We open only the workspace you need and guide you to the next step." },
    "core.guide": { ko: "처음 사용 가이드", en: "Getting started" },
    "core.finder.title": { ko: "GPU가 이미 있어요", en: "I already have a GPU" },
    "core.finder.note": { ko: "GPU 선택 → 실행 가능한 모델 추천", en: "Choose a GPU → get runnable model picks" },
    "core.finder.time": { ko: "입력 1개 · 약 10초", en: "1 input · about 10 sec" },
    "core.model.title": { ko: "실행할 모델을 알아요", en: "I know which model to run" },
    "core.model.note": { ko: "모델 선택 → 예산에 맞는 GPU 추천", en: "Choose a model → find GPUs in budget" },
    "core.model.time": { ko: "입력 2개 · 약 20초", en: "2 inputs · about 20 sec" },
    "core.infra.title": { ko: "AI 서비스를 만들 거예요", en: "I am building an AI service" },
    "core.infra.note": { ko: "서비스·사용자 수 → 전체 장비 간편 견적", en: "Service and users → complete system estimate" },
    "core.infra.time": { ko: "3단계 · 약 1분", en: "3 steps · about 1 min" },
    "core.community.title": { ko: "커뮤니티 데이터", en: "Community data" },
    "core.community.note": { ko: "실측 결과 제보 · 벤치마크 데이터 현황", en: "Submit measurements · benchmark coverage" },
    "core.community.time": { ko: "제보형 · 선택 사항", en: "Optional · community-submitted" },
    "core.apiCost.title": { ko: "API 비용 계산기", en: "API cost calculator" },
    "core.apiCost.note": { ko: "GPU 없이 API로 쓸 때 월 비용 비교(OpenAI·Anthropic·Google)", en: "Compare monthly cost of using hosted APIs instead of a GPU (OpenAI, Anthropic, Google)" },
    "core.demo.label": { ko: "입력 없이 체험:", en: "Try without typing:" },
    "core.demo.gpu": { ko: "RTX 3060 모델 추천", en: "RTX 3060 model picks" },
    "core.demo.model": { ko: "Qwen 32B용 GPU 찾기", en: "Find a GPU for Qwen 32B" },
    "core.demo.infra": { ko: "사내 RAG 30명 견적", en: "30-user internal RAG estimate" },
    "core.demo.placement": { ko: "Llama 70B+임베딩 2장 배치", en: "Llama 70B + embedding on 2 GPUs" },
    "benchmark.title": { ko: "모델별 성능지표 시트", en: "Model benchmark sheet" },
    "benchmark.note": { ko: "계산 추정, 외부 공개 참고값, 사용자 측정을 근거별로 분리합니다.", en: "Calculated estimates, public references, and user measurements are separated by evidence type." },
    "benchmark.search": { ko: "모델명, GPU, 지표로 검색", en: "Search model, GPU, or metric" },
  };

  const bindings = [
    [".brand-block h1", "app.title"],
    [".header-nav a[href='#calculationBasis']", "nav.methodology"],
    [".header-nav a[href*='#참고한']", "nav.sources"],
    [".header-nav a[href='#benchmarkSheet']", "nav.benchmarks"],
    ["[data-language-toggle]", "nav.language", "aria-label"],
    ["[data-language-toggle] [data-lang='ko']", "nav.korean"],
    ["[data-theme-toggle]", "nav.theme", "aria-label"],
    ["[data-theme-toggle] [data-theme='light']", "nav.light"],
    ["[data-theme-toggle] [data-theme='dark']", "nav.dark"],
    [".core-task-intro .section-kicker", "core.kicker"],
    [".core-task-intro strong", "core.title"],
    [".core-task-intro small", "core.note"],
    ["[data-open-start-guide]", "core.guide"],
    ["[data-core-task='finder'] > span", "core.finder.title"],
    ["[data-core-task='finder'] > small", "core.finder.note"],
    ["[data-core-task='finder'] > em", "core.finder.time"],
    ["[data-core-task='modelFinder'] > span", "core.model.title"],
    ["[data-core-task='modelFinder'] > small", "core.model.note"],
    ["[data-core-task='modelFinder'] > em", "core.model.time"],
    ["[data-core-task='infra'] > span", "core.infra.title"],
    ["[data-core-task='infra'] > small", "core.infra.note"],
    ["[data-core-task='infra'] > em", "core.infra.time"],
    ["[data-core-task='community'] > span", "core.community.title"],
    ["[data-core-task='community'] > small", "core.community.note"],
    ["[data-core-task='community'] > em", "core.community.time"],
    ["[data-core-task='apiCost'] > span", "core.apiCost.title"],
    ["[data-core-task='apiCost'] > small", "core.apiCost.note"],
    ["[data-demo-label]", "core.demo.label"],
    ["[data-demo-gpu]", "core.demo.gpu"],
    ["[data-demo-model]", "core.demo.model"],
    ["[data-demo-infra]", "core.demo.infra"],
    ["[data-demo-placement]", "core.demo.placement"],
    ["#benchmarkSheet .benchmark-head h2", "benchmark.title"],
    ["#benchmarkSheet .benchmark-head p", "benchmark.note"],
    ["#benchmarkSearch", "benchmark.search", "placeholder"],
    ["#benchmarkSearch", "benchmark.search", "aria-label"],
  ];

  function t(key, language = document.documentElement.lang) {
    const entry = catalog[key];
    return entry?.[language === "en" ? "en" : "ko"] || "";
  }

  function apply(language = document.documentElement.lang, root = document) {
    bindings.forEach(([selector, key, attribute]) => {
      root.querySelectorAll(selector).forEach((node) => {
        node.dataset.i18nKey = key;
        const value = t(key, language);
        if (attribute) node.setAttribute(attribute, value);
        else node.textContent = value;
      });
    });
    root.querySelectorAll("[role='tablist']").forEach((tablist) => {
      [...tablist.children].forEach((node) => {
        if (node.matches?.("button")) node.setAttribute("role", "tab");
      });
    });
    root.querySelectorAll(".command-block").forEach((node) => node.setAttribute("tabindex", "0"));
  }

  function audit(root = document) {
    const missing = [];
    root.querySelectorAll("[data-i18n-key]").forEach((node) => {
      if (!catalog[node.dataset.i18nKey]) missing.push(node.dataset.i18nKey);
    });
    return { keyedNodes: root.querySelectorAll("[data-i18n-key]").length, missing: [...new Set(missing)] };
  }

  window.AIHardwareI18n = { catalog, t, apply, audit };
})();
