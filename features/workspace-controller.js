(() => {
  const WORKSPACES = new Set(["finder", "modelFinder", "placement", "infra"]);

  function apply(mode) {
    const active = WORKSPACES.has(mode) ? mode : "finder";
    document.body.dataset.workspace = active;
    for (const name of WORKSPACES) {
      document.body.classList.toggle(`${name === "modelFinder" ? "model-finder" : name}-task-active`, name === active);
    }
    const visibility = {
      gpuPlacementPanel: active === "placement",
      gpuAdvisorPanel: active === "modelFinder",
      decisionStudio: active === "infra",
      benchmarkSheet: active === "finder",
      benchmarkDashboard: active === "finder",
      gpuInsightsPanel: active === "finder",
    };
    Object.entries(visibility).forEach(([id, visible]) => {
      const node = document.getElementById(id);
      if (node) node.hidden = !visible;
    });
    return active;
  }

  window.AIHardwareWorkspace = { apply };
})();
