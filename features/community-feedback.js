/**
 * Builds privacy-conscious, prefilled GitHub feedback links without a backend.
 * Only the visible sizing conditions are included; no customer/project fields
 * are sent.
 */
(() => {
  const ISSUE_URL = "https://github.com/jaeseok614/llm-gpu-checker-ko/issues/new";

  function feedbackUrl({
    outcome,
    model,
    gpu,
    workload,
    purpose,
    runtime,
    setting,
    requiredGb,
    estimatedSpeed,
  }) {
    const success = outcome === "success";
    const title = `[실행 ${success ? "성공" : "실패"}] ${model} · ${gpu}`;
    const body = [
      "## 자동 입력 환경",
      "",
      `- 결과: ${success ? "실행 성공" : "실행 실패"}`,
      `- GPU: ${gpu}`,
      `- 모델: ${model}`,
      `- 워크로드: ${workload}`,
      `- 선택 용도: ${purpose || "미지정"}`,
      `- 런타임: ${runtime || "미지정"}`,
      `- 정밀도·설정: ${setting || "미지정"}`,
      `- 계산 VRAM: ${requiredGb || "미지정"}`,
      `- 예상 속도: ${estimatedSpeed || "미지정"}`,
      "",
      "## 직접 확인한 결과",
      "",
      "- 실제 속도:",
      "- 실제 최대 VRAM:",
      "- 운영체제·드라이버:",
      `- ${success ? "추가 의견" : "실패 메시지·증상"}:`,
      "",
      "> 고객명·내부 프로젝트명·프롬프트 원문 등 민감한 정보는 적지 마세요.",
    ].join("\n");
    const params = new URLSearchParams({
      title,
      body,
      labels: success ? "run-feedback,verified-run" : "run-feedback,needs-review",
    });
    return `${ISSUE_URL}?${params.toString()}`;
  }

  function buttons(language = "ko") {
    const en = language === "en";
    return `
      <div class="run-feedback-actions" aria-label="${en ? "Share an actual run result" : "실제 실행 결과 공유"}">
        <span>${en ? "Did you try it?" : "직접 실행해 보셨나요?"}</span>
        <a class="ghost-button" data-run-feedback="success" target="_blank" rel="noreferrer">${en ? "It worked" : "실행됐어요"}</a>
        <a class="ghost-button" data-run-feedback="failure" target="_blank" rel="noreferrer">${en ? "It failed" : "실행 안 됐어요"}</a>
      </div>
    `;
  }

  window.AIHardwareCommunityFeedback = { buttons, feedbackUrl };
})();
