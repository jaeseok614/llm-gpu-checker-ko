/** Key-based translations for persistent shell and primary workspaces. */
(() => {
  const catalog = {
    "brand.subtitle": { ko: "AI 모델·GPU 적합성 분석", en: "GPU · Model · Infrastructure Workbench" },
    "nav.methodology": { ko: "계산 기준", en: "Methodology" },
    "nav.sources": { ko: "데이터 출처", en: "Data sources" },
    "nav.benchmarks": { ko: "벤치마크", en: "Benchmarks" },
    "nav.language": { ko: "언어 선택", en: "Language" },
    "nav.theme": { ko: "테마 선택", en: "Theme" },
    "nav.light": { ko: "라이트", en: "Light" },
    "nav.dark": { ko: "다크", en: "Dark" },
    "core.guide": { ko: "가이드", en: "Guide" },
    "core.finder.title": { ko: "GPU → Model", en: "GPU → Model" },
    "core.finder.note": { ko: "내 GPU에서 실행 가능한 모델", en: "Models that run on my GPU" },
    "core.model.title": { ko: "Model → GPU", en: "Model → GPU" },
    "core.model.note": { ko: "모델에 적합한 GPU", en: "GPU that fits my model" },
    "core.infra.title": { ko: "Infrastructure", en: "Infrastructure" },
    "core.infra.note": { ko: "AI 서비스 인프라 견적", en: "AI service infrastructure sizing" },
    "core.community.title": { ko: "Benchmarks", en: "Benchmarks" },
    "core.community.note": { ko: "실측·벤치마크 데이터", en: "Measured benchmark data" },
    "core.placement.title": { ko: "Stack Planner", en: "Stack Planner" },
    "core.placement.note": { ko: "여러 모델 함께 배치", en: "Plan multi-model GPU placement" },
    "core.apiCost.title": { ko: "API Cost", en: "API Cost" },
    "core.apiCost.note": { ko: "API 비용 계산기", en: "API cost calculator" },
    "core.demo.examplesTitle": { ko: "예시로 보기", en: "Try examples" },
    "core.demo.gpu": { ko: "RTX 3060 모델 추천", en: "RTX 3060 model picks" },
    "core.demo.model": { ko: "Qwen 32B용 GPU 찾기", en: "Find a GPU for Qwen 32B" },
    "core.demo.infra": { ko: "사내 RAG 30명 견적", en: "30-user internal RAG estimate" },
    "core.demo.placement": { ko: "Llama 70B+임베딩 2장 배치", en: "Llama 70B + embedding on 2 GPUs" },
    "benchmark.title": { ko: "모델별 성능지표 시트", en: "Model benchmark sheet" },
    "benchmark.note": { ko: "계산 추정, 외부 공개 참고값, 사용자 측정을 근거별로 분리합니다.", en: "Calculated estimates, public references, and user measurements are separated by evidence type." },
    "benchmark.search": { ko: "모델명, GPU, 지표로 검색", en: "Search model, GPU, or metric" },
  };

  const bindings = [
    ["#brandSubtitle", "brand.subtitle"],
    [".header-nav a[href='#calculationBasis']", "nav.methodology"],
    [".header-nav a[href*='#참고한']", "nav.sources"],
    [".header-nav a[href='#benchmarkSheet']", "nav.benchmarks"],
    ["[data-language-toggle]", "nav.language", "aria-label"],
    ["[data-theme-toggle]", "nav.theme", "aria-label"],
    ["[data-theme-toggle] [data-theme='light']", "nav.light", "aria-label"],
    ["[data-theme-toggle] [data-theme='dark']", "nav.dark", "aria-label"],
    ["[data-open-start-guide]", "core.guide"],
    ["[data-core-task='finder'] > span", "core.finder.title"],
    ["[data-core-task='finder'] > small", "core.finder.note"],
    ["[data-core-task='modelFinder'] > span", "core.model.title"],
    ["[data-core-task='modelFinder'] > small", "core.model.note"],
    ["[data-core-task='infra'] > span", "core.infra.title"],
    ["[data-core-task='infra'] > small", "core.infra.note"],
    ["[data-core-task='community'] > span", "core.community.title"],
    ["[data-core-task='community'] > small", "core.community.note"],
    ["[data-core-task='placement'] > span", "core.placement.title"],
    ["[data-core-task='placement'] > small", "core.placement.note"],
    ["[data-core-task='apiCost'] > span", "core.apiCost.title"],
    ["[data-core-task='apiCost'] > small", "core.apiCost.note"],
    ["[data-guide-examples-title]", "core.demo.examplesTitle"],
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
