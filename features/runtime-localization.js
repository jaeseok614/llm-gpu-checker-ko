(() => {
  const exact = new Map([
    ["본문 바로가기", "Skip to main content"],
    ["아직 선택된 모델이 없습니다.", "No models selected yet."],
    ["생성 최적화", "Generation optimization"],
    ["기본", "Standard"],
    ["아바타", "Avatar"],
  ]);
  const replacements = [
    [/GPU 프리셋 (\d+)개 또는 직접 입력/g, "$1 GPU presets or Custom"],
    [/실측 (\d+)건 · 중앙값/g, "$1 measurements · median"],
    [/계산 추정 · 예상 오차/g, "Calculated estimate · expected error"],
    [/가용 VRAM/g, "Available VRAM"],
  ];

  function apply(language = document.documentElement.lang) {
    if (language !== "en") return;
    document.querySelectorAll("body *:not(script):not(style):not(code):not(pre)").forEach((node) => {
      if (node.children.length || !node.textContent.trim()) return;
      let value = exact.get(node.textContent.trim()) || node.textContent;
      replacements.forEach(([pattern, next]) => { value = value.replace(pattern, next); });
      if (value !== node.textContent) node.textContent = value;
    });
  }

  window.AIHardwareLocalization = { apply };
})();
