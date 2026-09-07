/**
 * Affiliate/referral link helpers -- one place that owns every outbound
 * "구매하기"/"대여하기" link that could eventually carry a commission, so
 * turning on real tracking later is a config edit here instead of hunting
 * through gpu-advisor.js / platform-v2.js / api-cost-estimator.js.
 *
 * IMPORTANT -- every ID in AFFILIATE_CONFIG below is a placeholder ("")
 * until the site owner actually has the account. Every helper here
 * degrades to a plain, non-monetized link when its ID is unset, so nothing
 * breaks or looks broken before an account exists -- filling in an ID is
 * the only step needed to turn real commissions on.
 *
 * Why the three services below are handled differently:
 *
 * -- 다나와(Danawa) has no public self-serve developer/affiliate program --
 *    only a seller/입점 partnership (샵다나와) for businesses that want to
 *    sell ON Danawa, which is a different relationship entirely. The
 *    existing Korean-market `sourceUrl` links elsewhere in this app that
 *    point at Danawa stay exactly as they are (plain price-source
 *    citations) -- nothing here wraps or monetizes them, because there is
 *    no legitimate way to.
 *
 * -- 쿠팡파트너스 (Coupang Partners) is real and self-serve, but a plain
 *    "?tag=id"-style query param does NOT earn commission the way it does
 *    on e.g. Amazon Associates -- Coupang requires a signed Deeplink API
 *    call (HMAC-SHA256, access key + secret key) to convert a URL into a
 *    tracked link, and a secret key can never be safely embedded in
 *    client-side JS on a static site (every visitor's browser would be
 *    able to read it). See scripts/generate-coupang-links.mjs -- a script
 *    the site owner runs locally/offline, with credentials only they
 *    hold, that pre-generates real tracked links and writes them into
 *    data/coupang-affiliate-links.js (safe to commit -- it contains only
 *    the resulting public tracked URLs, never the secret key). Until that
 *    has been run at least once, buildCoupangLink() below returns a plain,
 *    non-monetized Coupang search URL so the "구매하기" button always works.
 *
 * -- RunPod and Vast.ai referral links are the simple kind: a plain
 *    "?ref=ID" query parameter on the provider's own domain, no API or
 *    secret key involved. Fill in cloud.RunPod.refId / cloud["Vast.ai"].refId
 *    below once those accounts exist and buildCloudReferralLink() starts
 *    producing real tracked links immediately.
 *
 * -- Lambda has no confirmed public self-serve referral program as of
 *    this writing, so its link is always left plain.
 */
(() => {
  const AFFILIATE_CONFIG = {
    // Fill in after creating a Coupang Partners account (partners.coupang.com).
    // Not currently used directly (see COUPANG_DEEP_LINKS below) -- kept
    // here so every affiliate ID this app knows about lives in one place.
    coupang: { channelId: "" },
    // Fill in after joining each cloud provider's own referral/affiliate
    // program. See each provider's referral dashboard for the exact ID.
    cloud: {
      RunPod: { refId: "" }, // https://www.runpod.io/referral-and-affiliate-program -> https://runpod.io?ref=ID
      "Vast.ai": { refId: "" }, // https://docs.vast.ai/guides/reference/referral-program -> https://cloud.vast.ai/?ref=ID
      Lambda: { refId: "" }, // no confirmed public self-serve program -- always plain for now
    },
  };

  // Pre-generated Coupang deep links, keyed by the exact search query
  // string used in buildCoupangLink() below. Populated by running
  // scripts/generate-coupang-links.mjs once real Partners API credentials
  // exist; empty (and therefore always falling back to a plain search URL)
  // until then. Read from the same window.LLM_GPU_CHECKER_DATA namespace
  // every other data file in this app uses, so this file works whether or
  // not data/coupang-affiliate-links.js has been generated/loaded yet.
  function deepLinks() {
    return (window.LLM_GPU_CHECKER_DATA && window.LLM_GPU_CHECKER_DATA.coupangDeepLinks) || {};
  }

  // Builds a "구매하기" link for a GPU search query. Returns a real,
  // commission-earning tracked link if scripts/generate-coupang-links.mjs
  // has already generated one for this exact query; otherwise a plain
  // Coupang search URL (works for the user, earns nothing, and is
  // indistinguishable in the UI from the tracked version -- swapping one
  // for the other later needs no UI change).
  function buildCoupangLink(query) {
    const trimmed = String(query || "").trim();
    if (!trimmed) return "";
    const tracked = deepLinks()[trimmed];
    if (tracked) return tracked;
    return `https://www.coupang.com/np/search?q=${encodeURIComponent(trimmed)}`;
  }

  function isCoupangTracked(query) {
    return Boolean(deepLinks()[String(query || "").trim()]);
  }

  function isCloudReferralConfigured(provider) {
    return Boolean(AFFILIATE_CONFIG.cloud[provider]?.refId);
  }

  // Appends the provider's referral ID to its own base URL as a plain
  // query parameter -- both RunPod and Vast.ai's referral programs work
  // this way natively, no signed API call needed. Returns baseUrl
  // unchanged (plain, non-monetized link) if no refId is configured yet.
  function buildCloudReferralLink(provider, baseUrl) {
    const refId = AFFILIATE_CONFIG.cloud[provider]?.refId;
    if (!refId) return baseUrl;
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}ref=${encodeURIComponent(refId)}`;
  }

  window.AIHardwareAffiliate = {
    AFFILIATE_CONFIG,
    buildCoupangLink,
    isCoupangTracked,
    buildCloudReferralLink,
    isCloudReferralConfigured,
  };
})();
