/**
 * Loads the larger infrastructure workspace only when the user opens it.
 * Core GPU/model recommendations remain available without this extra file.
 */
(() => {
  const ownUrl = new URL(document.currentScript?.src || window.location.href);
  const cacheVersion = ownUrl.searchParams.get("v") || "";
  let infrastructurePromise = null;

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-feature="${path}"]`);
      if (existing?.dataset.loaded === "true") {
        resolve();
        return;
      }
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = `./${path}${cacheVersion ? `?v=${encodeURIComponent(cacheVersion)}` : ""}`;
      script.defer = true;
      script.dataset.feature = path;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        resolve();
      }, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.appendChild(script);
    });
  }

  window.loadInfrastructureStudio = () => {
    if (!infrastructurePromise) {
      infrastructurePromise = loadScript("platform-v3.js").catch((error) => {
        infrastructurePromise = null;
        window.AIHardwareUI?.announce(
          document.documentElement.lang === "en"
            ? "Could not load the infrastructure workspace."
            : "인프라 견적 화면을 불러오지 못했습니다.",
          "error",
        );
        throw error;
      });
    }
    return infrastructurePromise;
  };

  document.addEventListener("DOMContentLoaded", () => {
    const params = new URL(window.location.href).searchParams;
    if (params.get("mode") === "infra" || params.get("studio") === "consulting" || params.has("scenario")) {
      window.loadInfrastructureStudio();
    }
  });
})();
