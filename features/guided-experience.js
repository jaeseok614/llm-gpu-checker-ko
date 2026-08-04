(() => {
  const COPY = {
    ko: {
      finder: ["GPU 선택", "추천 3개 확인", "전체 모델 탐색"],
      modelFinder: ["모델 선택", "예산 입력", "GPU 3안 비교"],
      placement: ["GPU 구성", "모델 추가", "배치안 확인"],
      infra: ["서비스 선택", "사용자 수", "예산·우선순위", "3가지 견적 비교"],
      next: "현재 단계",
      change: "다른 작업 선택",
      guide: "처음 사용 가이드",
      close: "가이드 닫기",
      panelTitle: "내 상황에 맞는 시작점",
      panelSteps: [
        ["보유 GPU 확인", "GPU 이름만 선택하면 바로 실행할 수 있는 모델 3개를 보여줍니다."],
        ["새 GPU 구매", "실행할 모델과 예산을 고르면 적합한 GPU를 비교합니다."],
        ["회사·팀 서비스 견적", "챗봇, RAG, 이미지, 음성 등 서비스와 사용자 수만 입력합니다."],
        ["실측 결과 제보·데이터 확인", "실행 결과를 공유하거나 벤치마크 데이터 현황을 확인합니다. 계산 없이도 볼 수 있어요."],
      ],
      panelNote: "모르는 전문 용어는 상세 설정을 열기 전에는 입력하지 않아도 됩니다.",
      requestSummary: "찾는 GPU나 모델이 없나요?",
      requestSteps: ["이름 중복 확인", "공식 출처 확인", "데이터 검토", "다음 릴리스 반영"],
      requestNote: "요청 전에 검색창에서 별칭까지 확인합니다. 공식 제품·모델 링크가 있으면 더 빠르게 검토할 수 있습니다.",
      requestLinks: ["GPU 추가 요청", "모델 추가 요청", "국내 가격 제보", "처리 중 요청 보기", "반영 완료 보기"],
    },
    en: {
      finder: ["Choose a GPU", "Review 3 picks", "Explore all models"],
      modelFinder: ["Choose a model", "Set a budget", "Compare 3 GPUs"],
      placement: ["Add GPUs", "Add models", "Review placement"],
      infra: ["Choose a service", "Set users", "Budget and priority", "Compare 3 plans"],
      next: "Current path",
      change: "Choose another task",
      guide: "Getting started",
      close: "Close guide",
      panelTitle: "Choose the path that matches your situation",
      panelSteps: [
        ["Check an owned GPU", "Choose its name to see three models that can run immediately."],
        ["Buy a new GPU", "Choose a model and budget to compare suitable GPUs."],
        ["Estimate a team service", "Enter only the service type and number of users."],
        ["Share a result or check the data", "Submit a run result or check benchmark coverage — no calculation needed."],
      ],
      panelNote: "You do not need to enter unfamiliar technical terms unless you open detailed settings.",
      requestSummary: "Cannot find a GPU or model?",
      requestSteps: ["Check duplicates", "Verify official source", "Review data", "Add in a release"],
      requestNote: "Search aliases before filing a request. An official product or model URL helps us review it faster.",
      requestLinks: ["Request a GPU", "Request a model", "Report Korean pricing", "View open requests", "View completed requests"],
    },
  };

  let language = document.documentElement.lang === "en" ? "en" : "ko";
  let currentMode = "finder";
  let started = false;

  function render(mode = currentMode, nextIndex = 0) {
    currentMode = ["finder", "modelFinder", "placement", "infra"].includes(mode) ? mode : "finder";
    const target = document.getElementById("workspaceJourney");
    if (!target) return;
    const copy = COPY[language];
    const steps = copy[currentMode];
    target.innerHTML = `
      <strong>${copy.next}</strong>
      <ol>${steps.map((step, index) => `<li class="${index === nextIndex ? "is-current" : index < nextIndex ? "is-done" : ""}" ${index === nextIndex ? 'aria-current="step"' : ""}><b>${index + 1}</b><span>${step}</span></li>`).join("")}</ol>
      <button type="button" class="ghost-button" data-change-path>${copy.change}</button>`;
    target.querySelector("[data-change-path]")?.addEventListener("click", () => setStarted(false, true));
  }

  function setStarted(nextStarted, focus = false) {
    started = Boolean(nextStarted);
    const chooser = document.getElementById("coreTaskSwitcher");
    chooser?.classList.toggle("is-collapsed", started);
    document.body.classList.toggle("guided-workspace-started", started);
    if (!started && focus) {
      chooser?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      chooser?.querySelector(".core-task-button")?.focus?.({ preventScroll: true });
    }
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === "en" ? "en" : "ko";
    const copy = COPY[language];
    const open = document.querySelector("[data-open-start-guide]");
    const close = document.querySelector("[data-close-start-guide]");
    if (open) open.textContent = copy.guide;
    if (close) close.setAttribute("aria-label", copy.close);
    const panel = document.getElementById("gettingStartedPanel");
    if (panel) {
      const title = panel.querySelector(":scope > div > strong");
      const list = panel.querySelector("ol");
      const note = panel.querySelector(":scope > p");
      if (title) title.textContent = copy.panelTitle;
      if (list) list.innerHTML = copy.panelSteps.map(([heading, detail]) => `<li><b>${heading}</b><span>${detail}</span></li>`).join("");
      if (note) note.textContent = copy.panelNote;
    }
    const request = document.querySelector(".catalog-request-center");
    if (request) {
      request.querySelector("summary").textContent = copy.requestSummary;
      request.querySelector(":scope > div").innerHTML = copy.requestSteps.map((step, index) => `<span><b>${index + 1}</b> ${step}</span>`).join("");
      request.querySelector(":scope > p").textContent = copy.requestNote;
      request.querySelectorAll(":scope > nav > a").forEach((link, index) => { link.textContent = copy.requestLinks[index]; });
    }
    render();
  }

  function toggleGuide(force) {
    const panel = document.getElementById("gettingStartedPanel");
    const trigger = document.querySelector("[data-open-start-guide]");
    if (!panel || !trigger) return;
    const shouldOpen = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !shouldOpen;
    trigger.setAttribute("aria-expanded", String(shouldOpen));
    if (shouldOpen) panel.querySelector("button")?.focus();
    else trigger.focus();
  }

  function bind() {
    document.querySelector("[data-open-start-guide]")?.addEventListener("click", () => toggleGuide());
    document.querySelector("[data-close-start-guide]")?.addEventListener("click", () => toggleGuide(false));
    document.querySelectorAll("[data-core-task], [data-demo-gpu], [data-demo-model], [data-demo-infra]").forEach((control) => {
      control.addEventListener("click", () => setStarted(true));
    });
    window.addEventListener("ai-hardware-workspacechange", (event) => {
      render(event.detail?.mode);
      if (event.detail?.previous) setStarted(true);
    });
    document.addEventListener("ai-hardware-languagechange", (event) => setLanguage(event.detail?.language));
    const params = new URL(window.location.href).searchParams;
    setStarted(params.has("gpu") || params.has("scenario") || ["modelFinder", "infra", "placement"].includes(params.get("mode")));
    render(document.body.dataset.workspace || "finder");
    document.querySelectorAll("[data-catalog-request]").forEach((link) => {
      link.href = window.AIHardwareCatalogRequests?.issueUrl(link.dataset.catalogRequest) || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new";
    });
    document.querySelectorAll("[data-catalog-status]").forEach((link) => {
      link.href = window.AIHardwareCatalogRequests?.statusUrl(link.dataset.catalogStatus) || "https://github.com/jaeseok614/llm-gpu-checker-ko/issues";
    });
  }

  window.AIHardwareGuide = { bind, render, setLanguage, toggleGuide, setStarted };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
