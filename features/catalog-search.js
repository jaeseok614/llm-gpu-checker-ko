(() => {
  const TERM_ALIASES = {
    노트북: "laptop",
    랩탑: "laptop",
    모바일: "laptop",
    데스크톱: "desktop",
    서버: "datacenter",
    데이터센터: "datacenter",
    통합메모리: "unified",
    이미지생성: "image-generation",
    "이미지 생성": "image-generation",
    영상생성: "video-generation",
    "영상 생성": "video-generation",
    음성인식: "audio-stt",
    "음성 인식": "audio-stt",
    음성합성: "audio-tts",
    "음성 합성": "audio-tts",
    아바타: "avatar-generation",
    문서: "document-vlm",
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/(?<=\d)o|o(?=\d)/g, "0")
      .replace(/\b(nvidia|amd|intel|apple|geforce|radeon|graphics|gpu)\b/g, "")
      .replace(/[^a-z0-9가-힣]+/g, "");
  }

  function distance(left, right) {
    const a = normalize(left);
    const b = normalize(right);
    if (!a) return b.length;
    if (!b) return a.length;
    const row = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      let previous = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const old = row[j];
        row[j] = Math.min(
          row[j] + 1,
          row[j - 1] + 1,
          previous + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
        previous = old;
      }
    }
    return row[b.length];
  }

  function queryTerms(query) {
    const raw = String(query || "").normalize("NFKC").toLocaleLowerCase().trim();
    const expanded = Object.entries(TERM_ALIASES).reduce(
      (value, [from, to]) => value.replaceAll(from, to),
      raw,
    );
    return expanded.split(/\s+/).filter(Boolean);
  }

  function itemValues(item) {
    return [
      item.id,
      item.name,
      item.provider,
      item.publisher,
      item.family,
      item.vendor,
      item.formFactor,
      item.type,
      item.memoryType,
      Number.isFinite(Number(item.vram)) ? `${item.vram}gb` : "",
      Number.isFinite(Number(item.gpuUsableMemoryGb)) ? `${item.gpuUsableMemoryGb}gb` : "",
      ...(item.aliases || []),
      ...(item.tags || []),
    ].filter(Boolean).map(String);
  }

  function score(query, item) {
    const compact = normalize(query);
    if (!compact) return 1;
    const values = itemValues(item);
    const normalizedValues = values.map(normalize);
    if (normalizedValues.includes(compact)) return 100;
    if (normalizedValues.some((value) => value.startsWith(compact))) return 85;
    if (normalizedValues.some((value) => value.includes(compact))) return 72;
    const terms = queryTerms(query).map(normalize);
    const joined = normalizedValues.join(" ");
    const matched = terms.filter((term) => joined.includes(term)).length;
    if (matched === terms.length && matched) return 60 + matched;
    const nearest = Math.min(...normalizedValues.map((value) => distance(compact, value)));
    const tolerance = compact.length >= 8 ? 3 : compact.length >= 5 ? 2 : 1;
    return nearest <= tolerance ? 45 - nearest : 0;
  }

  function search(query, items = [], { limit = 8, filter } = {}) {
    return items
      .filter((item) => !filter || filter(item))
      .map((item) => ({ item, score: score(query, item) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || String(a.item.name).localeCompare(String(b.item.name)))
      .slice(0, limit)
      .map((row) => row.item);
  }

  function parseGpuIntent(query) {
    const raw = String(query || "").normalize("NFKC").toLocaleLowerCase();
    const memory = raw.match(/(\d+(?:\.\d+)?)\s*gb/);
    const vendor = ["nvidia", "amd", "intel", "apple"].find((name) => raw.includes(name));
    const formFactor = /노트북|랩탑|laptop|mobile/.test(raw)
      ? "laptop"
      : /서버|데이터센터|datacenter/.test(raw)
        ? "datacenter"
        : /통합\s*메모리|unified/.test(raw)
          ? "unified"
          : "";
    return { memoryMinGb: memory ? Number(memory[1]) : 0, vendor, formFactor };
  }

  window.AIHardwareCatalogSearch = { normalize, distance, queryTerms, score, search, parseGpuIntent };
})();
