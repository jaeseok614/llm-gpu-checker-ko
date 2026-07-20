window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

window.LLM_GPU_CHECKER_DATA.gpus = [
  { id: "custom", name: "직접 입력", vram: 24, ram: 64, bandwidth: 1008 },
  { id: "rtx3060-12", name: "GeForce RTX 3060 12GB", vram: 12, ram: 32, bandwidth: 360 },
  { id: "rtx4060ti-16", name: "GeForce RTX 4060 Ti 16GB", vram: 16, ram: 32, bandwidth: 288 },
  { id: "rtx4070-12", name: "GeForce RTX 4070 12GB", vram: 12, ram: 32, bandwidth: 504 },
  { id: "rtx4080-16", name: "GeForce RTX 4080 16GB", vram: 16, ram: 64, bandwidth: 717 },
  { id: "rtx4090-24", name: "GeForce RTX 4090 24GB", vram: 24, ram: 64, bandwidth: 1008 },
  { id: "rtx6000ada-48", name: "RTX 6000 Ada 48GB", vram: 48, ram: 128, bandwidth: 960 },
  { id: "l4-24", name: "NVIDIA L4 24GB", vram: 24, ram: 64, bandwidth: 300 },
  { id: "l40s-48", name: "NVIDIA L40S 48GB", vram: 48, ram: 128, bandwidth: 864 },
  { id: "a100-40", name: "NVIDIA A100 40GB", vram: 40, ram: 128, bandwidth: 1555 },
  { id: "a100-80", name: "NVIDIA A100 80GB", vram: 80, ram: 256, bandwidth: 2039 },
  { id: "h100-80", name: "NVIDIA H100 80GB", vram: 80, ram: 256, bandwidth: 3350 },
];
