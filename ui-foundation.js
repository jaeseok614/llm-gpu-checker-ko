/**
 * Shared UI foundation for accessibility, notifications, evidence labels,
 * price states, and beginner-facing copy.
 */
(() => {
  const COPY = {
    ko: {
      skip: "본문 바로가기",
      copied: "클립보드에 복사했습니다.",
      saved: "저장했습니다.",
      loading: "처리 중입니다.",
      priceMarket: "국내 시세",
      priceLaunch: "출시 가격 참고",
      priceQuote: "공개 국내 시세 없음",
      priceQuoteNote: "공급사 견적 또는 직접 입력으로 계산 가능",
      verifiedToday: "오늘 확인",
      verifiedDays: "{days}일 전 확인",
      verifiedOld: "{days}일 이상 경과",
      evidenceOfficialSpec: "공식 사양",
      evidenceOfficialModel: "공식 모델 정보",
      evidenceExternal: "외부 공개 참고값",
      evidenceEstimate: "계산 추정",
      evidenceUser: "사용자 측정",
      evidenceNeedsReview: "검증 필요",
    },
    en: {
      skip: "Skip to content",
      copied: "Copied to the clipboard.",
      saved: "Saved.",
      loading: "Working…",
      priceMarket: "Korean market price",
      priceLaunch: "Launch-price reference",
      priceQuote: "No public Korean market price",
      priceQuoteNote: "Enter a supplier quote or your own price",
      verifiedToday: "Checked today",
      verifiedDays: "Checked {days} days ago",
      verifiedOld: "{days}+ days old",
      evidenceOfficialSpec: "Official specification",
      evidenceOfficialModel: "Official model information",
      evidenceExternal: "External public reference",
      evidenceEstimate: "Calculated estimate",
      evidenceUser: "User measurement",
      evidenceNeedsReview: "Needs verification",
    },
  };

  const language = () => document.documentElement.lang === "en" ? "en" : "ko";
  const text = (key, vars = {}) => Object.entries(vars).reduce(
    (value, [name, replacement]) => value.replace(`{${name}}`, replacement),
    COPY[language()][key] || key,
  );

  let toastTimer = 0;
  function announce(message, tone = "info") {
    const toast = document.getElementById("appToast");
    if (!toast || !message) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2600);
  }

  function priceState({ marketPrice = 0, launchPrice = 0, updatedAt = "" } = {}) {
    const date = updatedAt ? new Date(`${updatedAt}T00:00:00`) : null;
    const ageDays = date && !Number.isNaN(date.valueOf())
      ? Math.max(0, Math.floor((Date.now() - date.valueOf()) / 86400000))
      : null;
    if (marketPrice > 0) {
      const ageLabel = ageDays === null
        ? ""
        : ageDays === 0
          ? text("verifiedToday")
          : ageDays >= 90
            ? text("verifiedOld", { days: ageDays })
            : text("verifiedDays", { days: ageDays });
      return { kind: "market", label: text("priceMarket"), note: ageLabel, ageDays };
    }
    if (launchPrice > 0) {
      return { kind: "launch", label: text("priceLaunch"), note: text("priceQuoteNote"), ageDays: null };
    }
    return { kind: "quote", label: text("priceQuote"), note: text("priceQuoteNote"), ageDays: null };
  }

  function evidenceState({ kind = "estimate", sampleCount = 0, reason = "" } = {}) {
    const key = {
      officialSpec: "evidenceOfficialSpec",
      officialModel: "evidenceOfficialModel",
      external: "evidenceExternal",
      user: "evidenceUser",
      estimate: "evidenceEstimate",
      review: "evidenceNeedsReview",
    }[kind] || "evidenceEstimate";
    const errorPct = kind === "user" && sampleCount >= 3 ? 15 : kind === "external" ? 25 : 40;
    return {
      kind,
      label: text(key),
      sampleCount,
      errorPct,
      reason: reason || (language() === "en"
        ? "No matching GPU, model, and runtime measurement is available; the range is calculated from VRAM and memory bandwidth."
        : "동일 GPU·모델·런타임 실측 자료가 없어 VRAM과 메모리 대역폭으로 범위를 계산했습니다."),
    };
  }

  function refreshStaticCopy() {
    const skip = document.querySelector(".skip-link");
    if (skip) skip.textContent = text("skip");
  }

  document.addEventListener("DOMContentLoaded", refreshStaticCopy);
  document.querySelector("[data-language-toggle]")?.addEventListener("click", () => queueMicrotask(refreshStaticCopy));
  window.AIHardwareUI = { announce, evidenceState, language, priceState, text };
})();
