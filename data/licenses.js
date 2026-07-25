window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

const licensePolicy = (commercialUse, commercialLabel, opennessLabel, summary, sourceUrl) => ({
  commercialUse,
  commercialLabel,
  opennessLabel,
  summary,
  sourceUrl,
});

const apache20 = licensePolicy(
  "allowed",
  "상업 이용 가능",
  "오픈소스",
  "상업 이용·수정·배포가 가능하며 라이선스 사본, 저작권 및 NOTICE 고지를 유지해야 합니다.",
  "https://www.apache.org/licenses/LICENSE-2.0",
);

const mit = licensePolicy(
  "allowed",
  "상업 이용 가능",
  "오픈소스",
  "상업 이용·수정·배포가 가능하며 저작권 및 허가 고지를 포함해야 합니다.",
  "https://opensource.org/license/mit",
);

const ccByNc = licensePolicy(
  "noncommercial",
  "비상업 이용만",
  "비상업 공개",
  "저작자 표시가 필요하고 상업적 이용은 허용되지 않습니다. 상업 서비스에는 별도 허가가 필요합니다.",
  "https://creativecommons.org/licenses/by-nc/4.0/",
);

const llamaCommunity = licensePolicy(
  "conditional",
  "조건부 상업 이용",
  "공개 가중치",
  "상업 이용은 가능하지만 버전별 사용 정책·표시·재배포 조건과 대규모 서비스 기준을 확인해야 합니다.",
  "https://github.com/meta-llama/llama-models/tree/main/models",
);

const exaoneNc = licensePolicy(
  "noncommercial",
  "연구·비상업 전용",
  "연구용 공개 가중치",
  "연구 목적만 허용되며 모델·파생물·출력의 상업 이용에는 LG AI Research와 별도 계약이 필요합니다.",
  "https://huggingface.co/LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct/blob/main/LICENSE",
);

window.LLM_GPU_CHECKER_DATA.licensePolicies = {
  "원문 확인 필요": licensePolicy(
    "review",
    "약관 확인 필요",
    "라이선스 미표기",
    "원 저장소에 라이선스가 명시되지 않았습니다. 상업·재배포에 사용하기 전에 저작권자에게 이용 조건을 확인하세요.",
    "https://huggingface.co/nreimers/mmarco-mMiniLMv2-L6-H384-v1",
  ),
  "Apache 2.0": apache20,
  MIT: mit,
  "GPL-3.0": licensePolicy(
    "allowed",
    "상업 이용 가능",
    "오픈소스·카피레프트",
    "상업 이용은 가능하지만 배포하는 파생 저작물에는 GPLv3의 소스 공개·동일 라이선스 조건이 적용될 수 있습니다.",
    "https://www.gnu.org/licenses/gpl-3.0.html",
  ),
  Gemma: licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "상업 이용을 금지하지 않지만 Gemma 이용약관, 금지 사용 정책, 재배포 고지 조건을 따라야 합니다.",
    "https://ai.google.dev/gemma/terms",
  ),
  MRL: licensePolicy(
    "noncommercial",
    "연구·비상업 전용",
    "연구용 공개 가중치",
    "Mistral Research License는 비영리 연구만 허용합니다. 업무·제품·서비스에는 Mistral의 별도 상업 라이선스가 필요합니다.",
    "https://mistral.ai/licenses/MRL-0.1.md",
  ),
  MNPL: licensePolicy(
    "noncommercial",
    "연구·테스트 전용",
    "비상업 공개 가중치",
    "Mistral AI Non-Production License는 연구·평가 같은 비생산 용도만 허용합니다. 상업·운영 환경에는 별도 라이선스가 필요합니다.",
    "https://mistral.ai/licenses/MNPL-0.1.md",
  ),
  "CC BY-NC": ccByNc,
  "CC BY-NC 4.0": ccByNc,
  "CC-BY-NC-4.0": ccByNc,
  Qwen: licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "상업 이용은 가능하지만 월간 활성 사용자 1억 명 초과 시 별도 허가가 필요하며 표시·재배포 조건을 따라야 합니다.",
    "https://huggingface.co/Qwen/Qwen2.5-72B-Instruct/blob/main/LICENSE",
  ),
  "Qwen Research": licensePolicy(
    "noncommercial",
    "연구·비상업 전용",
    "연구용 공개 가중치",
    "Qwen Research License 기반 모델로 상업 이용 전 해당 모델 카드와 원 라이선스의 별도 허가 조건을 확인해야 합니다.",
    "https://huggingface.co/jinaai/jina-embeddings-v4",
  ),
  Llama: llamaCommunity,
  "Llama 3": llamaCommunity,
  "Llama 3.1 Community": llamaCommunity,
  "Llama 3.2": llamaCommunity,
  "Llama 3.2 Community": llamaCommunity,
  "Llama 3.3 Community": llamaCommunity,
  "Llama 4 Community": llamaCommunity,
  "EXAONE AI": exaoneNc,
  "EXAONE AI 1.2 NC": exaoneNc,
  DeepSeek: licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "상업·호스팅 이용은 가능하지만 군사·불법 등 금지 용도와 재배포 시 사용 제한 승계 조건을 따라야 합니다.",
    "https://github.com/deepseek-ai/DeepSeek-VL2/blob/main/LICENSE-MODEL",
  ),
  "GLM-4": licensePolicy(
    "conditional",
    "등록 후 상업 이용",
    "공개 가중치",
    "학술 연구는 무료이며 상업 이용은 Zhipu AI 등록 후 가능하고 표시·재배포·금지 용도 조건을 따라야 합니다.",
    "https://huggingface.co/THUDM/glm-4-9b-chat/blob/main/LICENSE",
  ),
  "Modified MIT": licensePolicy(
    "review",
    "수정 조항 확인",
    "모델별 공개 가중치",
    "MIT에 추가된 조항이 모델마다 다릅니다. 매출·사용자 수·경쟁 서비스 제한 등 해당 모델의 LICENSE를 직접 확인하세요.",
    "https://opensource.org/license/mit",
  ),
  Kimi: licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "상업 이용은 가능하지만 월간 활성 사용자 1억 명 또는 월매출 2천만 달러 초과 시 제품 화면에 Kimi K2 표시가 필요합니다.",
    "https://huggingface.co/moonshotai/Kimi-K2-Instruct/blob/main/LICENSE",
  ),
  Jamba: licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "연매출 5천만 달러 이하에서 조건부 상업 이용이 가능하며 이를 초과하면 AI21의 별도 라이선스가 필요합니다.",
    "https://huggingface.co/ai21labs/AI21-Jamba-1.5-Mini/blob/main/LICENSE.txt",
  ),
  "NVIDIA Open": licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "상업 이용을 포함한 사용·수정·배포가 가능하지만 NVIDIA Open Model License와 모델별 사용 제한을 따라야 합니다.",
    "https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license/",
  ),
  "Liquid AI": licensePolicy(
    "review",
    "모델별 확인 필요",
    "공개 범위 모델별 상이",
    "LFM 세대와 배포 채널에 따라 약관이 다를 수 있어 사용하려는 체크포인트의 모델 카드와 LICENSE를 확인해야 합니다.",
    "https://www.liquid.ai/",
  ),
  "HyperCLOVAX SEED": licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "상업 이용은 가능하지만 월간 활성 사용자 1천만 명 초과 또는 NAVER와 직접 경쟁하는 서비스는 별도 허가가 필요합니다.",
    "https://huggingface.co/naver-hyperclovax/HyperCLOVAX-SEED-Think-14B/blob/main/LICENSE",
  ),
  "OpenRAIL-M": licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "상업 이용을 일괄 금지하지 않지만 책임 있는 AI 사용 제한과 파생 모델 재배포 조건을 승계해야 합니다.",
    "https://www.licenses.ai/ai-licenses",
  ),
  Falcon: licensePolicy(
    "conditional",
    "조건부 상업 이용",
    "공개 가중치",
    "일반 상업 제품 사용은 가능하지만 공유 인스턴스·추론 API 같은 호스팅 서비스에는 TII의 별도 허가가 필요합니다.",
    "https://huggingface.co/tiiuae/falcon-180B-chat/blob/main/LICENSE.txt",
  ),
};

window.LLM_GPU_CHECKER_DATA.modelLicensePolicies = {
  "Kimi K2 Thinking": window.LLM_GPU_CHECKER_DATA.licensePolicies.Kimi,
};

window.LLM_GPU_CHECKER_DATA.licenseMeta = {
  updatedAt: "2026-07-23",
  disclaimer: "간단한 참고용 요약이며 법률 자문이 아닙니다. 상업 배포 전에는 해당 체크포인트의 최신 LICENSE와 이용 정책을 직접 확인하세요.",
};
