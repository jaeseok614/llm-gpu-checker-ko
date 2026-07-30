/**
 * Workload-specific purpose metadata and pure recommendation helpers.
 * The main app supplies fit grades and tie-breakers; this module owns
 * category isolation, purpose matching, and purpose-first ranking.
 */
(() => {
  const PURPOSES = {
    generative: [
      ["general", "일반 대화 / 비서", "Chat / assistant"],
      ["korean", "한국어 특화", "Korean"],
      ["coding", "코딩", "Coding"],
      ["reasoning", "추론 / 수학", "Reasoning / math"],
      ["long", "긴 문서 / RAG", "Long documents / RAG"],
      ["vision", "이미지 이해", "Image understanding"],
    ],
    embedding: [
      ["retrieval", "문서 검색 / RAG", "Document search / RAG"],
      ["korean", "한국어 검색", "Korean search"],
      ["multilingual", "다국어 검색", "Multilingual search"],
      ["long", "긴 문서 임베딩", "Long-document embedding"],
      ["codeRetrieval", "코드 검색", "Code search"],
      ["lightweight", "가벼운 실시간 검색", "Lightweight real-time search", "lightweight"],
    ],
    reranker: [
      ["retrieval", "RAG 검색 결과 재정렬", "RAG result reranking"],
      ["korean", "한국어 재정렬", "Korean reranking"],
      ["multilingual", "다국어 재정렬", "Multilingual reranking"],
      ["long", "긴 문서 재정렬", "Long-document reranking"],
      ["codeRetrieval", "코드 검색 재정렬", "Code-search reranking"],
      ["quality", "정확도 우선", "Accuracy first", "quality"],
    ],
    ocrPipeline: [
      ["document", "문서 / PDF 인식", "Documents / PDFs"],
      ["korean", "한국어 문서", "Korean documents"],
      ["table", "표 / 레이아웃", "Tables / layout"],
      ["handwriting", "손글씨", "Handwriting"],
      ["math", "수식 / 마크다운", "Math / Markdown"],
      ["lightweight", "빠른 대량 처리", "Fast batch processing", "speed"],
    ],
    documentVlm: [
      ["document", "문서 질의응답", "Document Q&A"],
      ["table", "표 / 차트 분석", "Tables / charts"],
      ["korean", "한국어 문서", "Korean documents"],
      ["long", "긴 문서 / 여러 페이지", "Long / multi-page documents"],
      ["quality", "정확도 우선", "Accuracy first", "quality"],
    ],
    generalVlm: [
      ["vision", "이미지 질의응답", "Image Q&A"],
      ["video", "비디오 이해", "Video understanding"],
      ["reasoning", "시각 추론", "Visual reasoning"],
      ["grounding", "객체 위치 / 화면 조작", "Grounding / GUI"],
      ["lightweight", "가벼운 실시간 분석", "Lightweight real-time analysis", "lightweight"],
    ],
    imageGeneration: [
      ["image", "일반 이미지 생성", "General image generation"],
      ["quality", "고품질 이미지", "High-quality images", "quality"],
      ["speed", "빠른 초안 생성", "Fast drafts", "speed"],
      ["lightweight", "적은 VRAM으로 생성", "Low-VRAM generation", "lightweight"],
    ],
    videoGeneration: [
      ["video", "텍스트로 비디오 생성", "Text-to-video"],
      ["imageToVideo", "이미지로 비디오 생성", "Image-to-video"],
      ["quality", "영상 품질 우선", "Video quality first", "quality"],
      ["speed", "생성 속도 우선", "Generation speed first", "speed"],
      ["lightweight", "적은 VRAM으로 생성", "Low-VRAM generation", "lightweight"],
    ],
    avatarGeneration: [
      ["lipSync", "립싱크", "Lip sync"],
      ["talkingHead", "말하는 아바타", "Talking avatar"],
      ["portrait", "사진 한 장으로 애니메이션", "Animate one portrait"],
      ["realtime", "실시간 아바타", "Real-time avatar", "speed"],
      ["quality", "표현 품질 우선", "Visual quality first", "quality"],
    ],
    audioStt: [
      ["multilingual", "한국어·다국어 받아쓰기", "Korean / multilingual transcription"],
      ["realtime", "실시간 자막 / 회의", "Live captions / meetings", "speed"],
      ["accuracy", "정확도 우선 받아쓰기", "Accuracy-first transcription", "quality"],
      ["lightweight", "가벼운 로컬 받아쓰기", "Lightweight local transcription", "lightweight"],
    ],
    audioTts: [
      ["natural", "자연스러운 안내 음성", "Natural narration", "quality"],
      ["realtime", "실시간 챗봇 음성", "Real-time chatbot voice", "speed"],
      ["voiceCloning", "목소리 복제", "Voice cloning"],
      ["multilingual", "한국어·다국어 합성", "Korean / multilingual speech"],
      ["lightweight", "가벼운 로컬 합성", "Lightweight local synthesis", "lightweight"],
    ],
  };

  function getOptions(workload = "generative") {
    return (PURPOSES[workload] || PURPOSES.generative).map(([id, ko, en, rankBy = ""]) => ({
      id, ko, en, rankBy,
    }));
  }

  function purposeRank(estimate, option) {
    if (!option?.rankBy) return 0;
    if (option.rankBy === "speed") return Number(estimate.speed || 0);
    if (option.rankBy === "quality") return Number(estimate.model?.params || 0);
    if (option.rankBy === "lightweight") return -Number(estimate.requiredGb || 0);
    return 0;
  }

  function modelMatches(model, purpose) {
    return Array.isArray(model?.capabilities?.useCases)
      && model.capabilities.useCases.includes(purpose);
  }

  function recommend({
    estimates,
    workload,
    purpose,
    priority,
    allowedModels,
    isRunnable,
    compareByPriority,
  }) {
    let candidates = estimates.filter(isRunnable).filter((estimate) => allowedModels.has(estimate.model));
    const option = getOptions(workload).find((item) => item.id === purpose);
    if (option) {
      const matched = candidates.filter((estimate) => modelMatches(estimate.model, option.id));
      if (matched.length) candidates = matched;
    }
    return [...candidates].sort((a, b) => {
      const purposeDifference = purposeRank(b, option) - purposeRank(a, option);
      return purposeDifference || compareByPriority(a, b, priority);
    }).slice(0, 3);
  }

  function reason(model, purpose, language = "ko") {
    if (!purpose || !modelMatches(model, purpose)) return "";
    const definition = window.LLM_GPU_CHECKER_DATA?.useCaseDefinitions?.[purpose];
    const label = definition?.[language] || definition?.ko || purpose;
    return language === "en" ? `Supports ${label}` : `${label} 용도 지원`;
  }

  window.AIHardwareQuickRecommendation = { getOptions, modelMatches, reason, recommend };
})();
