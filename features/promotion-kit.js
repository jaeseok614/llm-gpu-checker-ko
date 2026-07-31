(() => {
  const REPO = "https://github.com/jaeseok614/llm-gpu-checker-ko";
  const COPY = {
    ko: {
      title: "60초 체험",
      note: "입력 없이 결과부터 확인하세요",
      feedback: "써보고 불편한 점 보내기",
      aria: "60초 샘플 체험",
    },
    en: {
      title: "60-second tour",
      note: "Open a complete result without entering data",
      feedback: "Send workflow feedback",
      aria: "60-second sample tour",
    },
  };

  function feedbackUrl() {
    const params = new URLSearchParams({
      template: "product-feedback.yml",
      title: "[Workflow feedback] ",
    });
    return `${REPO}/issues/new?${params}`;
  }

  function render(locale = document.documentElement.lang) {
    const language = String(locale).startsWith("en") ? "en" : "ko";
    const copy = COPY[language];
    const panel = document.querySelector(".core-task-demos");
    if (!panel) return;
    panel.setAttribute("aria-label", copy.aria);
    const title = panel.querySelector("[data-showcase-title]");
    const note = panel.querySelector("[data-demo-label]");
    const feedback = panel.querySelector("[data-showcase-feedback]");
    if (title) title.textContent = copy.title;
    if (note) note.textContent = copy.note;
    if (feedback) {
      feedback.textContent = copy.feedback;
      feedback.href = feedbackUrl();
    }
  }

  function bind() {
    queueMicrotask(() => render());
    document.addEventListener("ai-hardware-languagechange", (event) => render(event.detail?.language));
  }

  window.AIHardwarePromotion = { bind, render, feedbackUrl };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
