(() => {
  const CONFIDENCE = {
    "높음": { ko: "높음", en: "High" },
    "중간": { ko: "중간", en: "Medium" },
    "낮음": { ko: "낮음", en: "Low" },
    high: { ko: "높음", en: "High" },
    medium: { ko: "중간", en: "Medium" },
    low: { ko: "낮음", en: "Low" },
  };

  const USED_PRICE_METHOD = {
    "신품 최저가의 75% 계산 참고값": {
      ko: "신품 최저가의 75% 계산 참고값",
      en: "Planning reference: 75% of the lowest new price",
    },
    "계산 신품 참고가의 68% 적용": {
      ko: "계산 신품 참고가의 68% 적용",
      en: "Planning reference: 68% of the estimated new price",
    },
  };

  function language(value = document.documentElement.lang) {
    return String(value || "ko").toLowerCase().startsWith("en") ? "en" : "ko";
  }

  function confidence(value, locale) {
    const target = language(locale);
    const key = typeof value === "string" && /^[a-z]+$/i.test(value) ? value.toLowerCase() : value;
    return CONFIDENCE[key]?.[target] || String(value || (target === "en" ? "Unknown" : "확인 필요"));
  }

  function usedPriceMethod(value, locale) {
    const target = language(locale);
    return USED_PRICE_METHOD[value]?.[target]
      || (target === "en" ? "Calculated used-price planning reference" : String(value || "중고가 계산 참고값"));
  }

  function currency(locale) {
    const target = language(locale);
    return target === "en"
      ? { code: "USD", symbol: "$", locale: "en-US" }
      : { code: "KRW", symbol: "₩", locale: "ko-KR" };
  }

  window.AIHardwareLocale = { language, confidence, usedPriceMethod, currency };
})();
