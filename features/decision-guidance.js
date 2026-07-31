(() => {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[char]);
  }

  function analyze(plans, state = {}, language = "ko") {
    if (!Array.isArray(plans) || !plans.length) return null;
    const en = language === "en";
    const selected = plans.find((plan) => plan.id === state.siSelectedPlan)
      || plans.find((plan) => plan.id === "recommended")
      || plans[0];
    const cheapest = [...plans].sort((a, b) => a.purchaseKrw - b.purchaseKrw)[0];
    const fastest = [...plans].sort((a, b) => (b.speed || 0) - (a.speed || 0))[0];
    const reasons = [
      `${en ? "Model memory" : "모델 메모리"} ${Number(selected.requiredGb || 0).toFixed(1)}GB`,
      `${en ? "Concurrent capacity" : "예상 동시 처리"} ${selected.capacity || 0}`,
      `${en ? "Growth reserve" : "성장 여유"} ${Number(state.siGrowthPct || 0)}%`,
    ];
    const exclusions = plans.filter((plan) => plan.id !== selected.id).map((plan) => {
      if (plan.id === cheapest.id && selected.id !== cheapest.id) {
        return en ? `${plan.labelEn || plan.en || "Lowest cost"} has less SLA and expansion headroom.` : `${plan.labelKo || plan.ko || "최저 비용"}은 SLA·확장 여유가 더 작습니다.`;
      }
      if (plan.id === fastest.id && selected.id !== fastest.id) {
        return en ? `${plan.labelEn || plan.en || "Highest performance"} costs more than the selected balance requires.` : `${plan.labelKo || plan.ko || "최고 성능"}은 현재 균형안보다 비용이 큽니다.`;
      }
      return en ? "The selected plan provides a more balanced cost and capacity." : "선택안이 비용과 처리량의 균형이 더 좋습니다.";
    });
    const levers = [
      {
        id: "concurrency",
        title: en ? "Reduce peak concurrency 20%" : "동시 요청 20% 낮추기",
        note: en ? "Queueing may increase at busy times." : "피크 시간에는 대기열이 늘 수 있습니다.",
        estimatePct: 12,
      },
      {
        id: "output",
        title: en ? "Shorten answer length 20%" : "답변 길이 20% 줄이기",
        note: en ? "Answers become shorter, but throughput improves." : "답변은 짧아지지만 처리량이 좋아집니다.",
        estimatePct: 8,
      },
      {
        id: "growth",
        title: en ? "Reduce growth reserve 10 points" : "성장 여유 10%p 낮추기",
        note: en ? "Earlier expansion may be required." : "증설 시점이 빨라질 수 있습니다.",
        estimatePct: 6,
      },
    ];
    return { selected, reasons, exclusions, levers };
  }

  function render(plans, state = {}, language = "ko") {
    const result = analyze(plans, state, language);
    if (!result) return "";
    const en = language === "en";
    return `<section class="decision-guidance" aria-labelledby="decisionGuidanceTitle">
      <div class="decision-guidance-head"><div><span class="section-kicker">v5.5 DECISION GUIDE</span><h3 id="decisionGuidanceTitle">${en ? "Why this option?" : "왜 이 구성을 추천하나요?"}</h3></div><strong>${escapeHtml(en ? result.selected.labelEn || result.selected.en || result.selected.id : result.selected.labelKo || result.selected.ko || result.selected.id)}</strong></div>
      <ul class="decision-reason-list">${result.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
      <details><summary>${en ? "Why were the other options not selected?" : "다른 구성은 왜 선택하지 않았나요?"}</summary><ul>${result.exclusions.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul></details>
      <div class="cost-lever-head"><strong>${en ? "Ways to lower the estimate" : "비용을 줄이는 방법"}</strong><small>${en ? "Estimated impact; recalculate before deciding." : "예상 영향이며, 적용 후 다시 계산해 확인하세요."}</small></div>
      <div class="cost-lever-grid">${result.levers.map((lever) => `<button type="button" data-si-adjust="${lever.id}"><b>${escapeHtml(lever.title)}</b><strong>-${lever.estimatePct}% ${en ? "potential" : "가능"}</strong><small>${escapeHtml(lever.note)}</small></button>`).join("")}</div>
    </section>`;
  }

  window.AIHardwareDecisionGuidance = { analyze, render };
})();
