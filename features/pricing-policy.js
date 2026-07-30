(() => {
  const KRW_PER_USD = 1400;
  const locale = (language) => language === "en" ? "en-US" : "ko-KR";
  const toUsd = (value, currency = "USD") => Number(value || 0) / (currency === "KRW" ? KRW_PER_USD : 1);
  const toKrw = (value, currency = "KRW") => Number(value || 0) * (currency === "USD" ? KRW_PER_USD : 1);
  const formatMoney = (value, currency = "KRW", language = "ko") => currency === "KRW"
    ? `${Math.round(value).toLocaleString(locale(language))}${language === "en" ? " KRW" : "원"}`
    : `$${Math.round(value).toLocaleString("en-US")}`;

  function classify({ marketPriceKrw = 0, marketSourceUrl = "", updatedAt = "", launchPriceUsd = 0, quoteKrw = 0 } = {}) {
    if (quoteKrw > 0) return { kind: "supplier-quote", valueKrw: quoteKrw, updatedAt, sourceUrl: marketSourceUrl };
    if (marketPriceKrw > 0 && marketSourceUrl && updatedAt) return { kind: "dated-market", valueKrw: marketPriceKrw, updatedAt, sourceUrl: marketSourceUrl };
    if (launchPriceUsd > 0) return { kind: "launch-reference", valueKrw: launchPriceUsd * KRW_PER_USD, updatedAt: "", sourceUrl: marketSourceUrl };
    return { kind: "quote-required", valueKrw: 0, updatedAt: "", sourceUrl: "" };
  }

  function labels(kind, language = "ko") {
    const en = language === "en";
    return {
      "supplier-quote": en ? "Supplier quote" : "공급사 견적",
      "dated-market": en ? "Dated Korean market price" : "기준일 있는 국내 시세",
      "launch-reference": en ? "Launch-price reference" : "출시 가격 참고",
      "planning-assumption": en ? "Planning assumption" : "계획 가정값",
      "quote-required": en ? "Supplier quote required" : "공급사 견적 필요",
    }[kind] || (en ? "Needs review" : "검토 필요");
  }

  window.AIHardwarePricing = { KRW_PER_USD, toUsd, toKrw, formatMoney, classify, labels };
})();
