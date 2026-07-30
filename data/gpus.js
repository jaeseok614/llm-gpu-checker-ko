window.LLM_GPU_CHECKER_DATA = window.LLM_GPU_CHECKER_DATA || {};

window.LLM_GPU_CHECKER_DATA.gpus = [
  { id: "custom", name: "직접 입력", vram: 24, ram: 64, bandwidth: 1008 },

  { id: "rtx5090-32", name: "GeForce RTX 5090 32GB", vram: 32, ram: 64, bandwidth: 1792 },
  { id: "rtx5080-16", name: "GeForce RTX 5080 16GB", vram: 16, ram: 64, bandwidth: 960 },
  { id: "rtx5070ti-16", name: "GeForce RTX 5070 Ti 16GB", vram: 16, ram: 64, bandwidth: 896 },
  { id: "rtx5070-12", name: "GeForce RTX 5070 12GB", vram: 12, ram: 32, bandwidth: 672 },
  { id: "rtx5060ti-16", name: "GeForce RTX 5060 Ti 16GB", vram: 16, ram: 32, bandwidth: 448 },
  { id: "rtx5060ti-8", name: "GeForce RTX 5060 Ti 8GB", vram: 8, ram: 32, bandwidth: 448 },
  { id: "rtx5060-8", name: "GeForce RTX 5060 8GB", vram: 8, ram: 32, bandwidth: 448 },
  { id: "rtx5050-8", name: "GeForce RTX 5050 8GB", vram: 8, ram: 32, bandwidth: 320 },

  { id: "rtx4090-24", name: "GeForce RTX 4090 24GB", vram: 24, ram: 64, bandwidth: 1008 },
  { id: "rtx4080super-16", name: "GeForce RTX 4080 SUPER 16GB", vram: 16, ram: 64, bandwidth: 736 },
  { id: "rtx4080-16", name: "GeForce RTX 4080 16GB", vram: 16, ram: 64, bandwidth: 717 },
  { id: "rtx4070tisuper-16", name: "GeForce RTX 4070 Ti SUPER 16GB", vram: 16, ram: 64, bandwidth: 672 },
  { id: "rtx4070ti-12", name: "GeForce RTX 4070 Ti 12GB", vram: 12, ram: 32, bandwidth: 504 },
  { id: "rtx4070super-12", name: "GeForce RTX 4070 SUPER 12GB", vram: 12, ram: 32, bandwidth: 504 },
  { id: "rtx4070-12", name: "GeForce RTX 4070 12GB", vram: 12, ram: 32, bandwidth: 504 },
  { id: "rtx4060ti-16", name: "GeForce RTX 4060 Ti 16GB", vram: 16, ram: 32, bandwidth: 288 },
  { id: "rtx4060ti-8", name: "GeForce RTX 4060 Ti 8GB", vram: 8, ram: 32, bandwidth: 288 },
  { id: "rtx4060-8", name: "GeForce RTX 4060 8GB", vram: 8, ram: 32, bandwidth: 272 },
  {
    id: "rtx4090laptop-16",
    name: "GeForce RTX 4090 Laptop GPU 16GB",
    vram: 16,
    ram: 64,
    bandwidth: 576,
    formFactor: "laptop",
    tgpMinW: 80,
    tgpMaxW: 175,
    tgpReferenceW: 150,
    aliases: ["RTX 4090 Laptop", "4090 Mobile"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/40-series/",
  },
  {
    id: "rtx4080laptop-12",
    name: "GeForce RTX 4080 Laptop GPU 12GB",
    vram: 12,
    ram: 32,
    bandwidth: 432,
    formFactor: "laptop",
    tgpMinW: 60,
    tgpMaxW: 175,
    tgpReferenceW: 150,
    aliases: ["RTX 4080 Laptop", "4080 Mobile"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/40-series/",
  },
  {
    id: "rtx4070laptop-8",
    name: "GeForce RTX 4070 Laptop GPU 8GB",
    vram: 8,
    ram: 32,
    bandwidth: 256,
    formFactor: "laptop",
    tgpMinW: 35,
    tgpMaxW: 140,
    tgpReferenceW: 115,
    aliases: ["RTX 4070 Laptop", "4070 Mobile"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/40-series/",
  },

  {
    id: "rtx5090laptop-24", name: "GeForce RTX 5090 Laptop GPU 24GB",
    vram: 24, ram: 64, bandwidth: 896, vendor: "NVIDIA", architecture: "Blackwell",
    memoryType: "dedicated", formFactor: "laptop", tgpMinW: 95, tgpMaxW: 150, tgpReferenceW: 150,
    aliases: ["RTX 5090 Laptop", "5090 Mobile"], runtimes: ["CUDA"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/50-series/",
  },
  {
    id: "rtx5080laptop-16", name: "GeForce RTX 5080 Laptop GPU 16GB",
    vram: 16, ram: 64, bandwidth: 896, vendor: "NVIDIA", architecture: "Blackwell",
    memoryType: "dedicated", formFactor: "laptop", tgpMinW: 80, tgpMaxW: 150, tgpReferenceW: 150,
    aliases: ["RTX 5080 Laptop", "5080 Mobile"], runtimes: ["CUDA"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/50-series/",
  },
  {
    id: "rtx5070tilaptop-12", name: "GeForce RTX 5070 Ti Laptop GPU 12GB",
    vram: 12, ram: 32, bandwidth: 672, vendor: "NVIDIA", architecture: "Blackwell",
    memoryType: "dedicated", formFactor: "laptop", tgpMinW: 60, tgpMaxW: 115, tgpReferenceW: 115,
    aliases: ["RTX 5070 Ti Laptop", "5070 Ti Mobile"], runtimes: ["CUDA"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/50-series/",
  },
  {
    id: "rtx5070laptop-8", name: "GeForce RTX 5070 Laptop GPU 8GB",
    vram: 8, ram: 32, bandwidth: 384, vendor: "NVIDIA", architecture: "Blackwell",
    memoryType: "dedicated", formFactor: "laptop", tgpMinW: 50, tgpMaxW: 100, tgpReferenceW: 100,
    aliases: ["RTX 5070 Laptop", "5070 Mobile"], runtimes: ["CUDA"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/50-series/",
  },
  {
    id: "rtx5060laptop-8", name: "GeForce RTX 5060 Laptop GPU 8GB",
    vram: 8, ram: 32, bandwidth: 384, vendor: "NVIDIA", architecture: "Blackwell",
    memoryType: "dedicated", formFactor: "laptop", tgpMinW: 45, tgpMaxW: 100, tgpReferenceW: 100,
    aliases: ["RTX 5060 Laptop", "5060 Mobile"], runtimes: ["CUDA"],
    sourceUrl: "https://www.nvidia.com/en-us/geforce/laptops/50-series/",
  },

  { id: "rtx3090ti-24", name: "GeForce RTX 3090 Ti 24GB", vram: 24, ram: 64, bandwidth: 1008 },
  { id: "rtx3090-24", name: "GeForce RTX 3090 24GB", vram: 24, ram: 64, bandwidth: 936 },
  { id: "rtx3080ti-12", name: "GeForce RTX 3080 Ti 12GB", vram: 12, ram: 32, bandwidth: 912 },
  { id: "rtx3080-12", name: "GeForce RTX 3080 12GB", vram: 12, ram: 32, bandwidth: 912 },
  { id: "rtx3080-10", name: "GeForce RTX 3080 10GB", vram: 10, ram: 32, bandwidth: 760 },
  { id: "rtx3070ti-8", name: "GeForce RTX 3070 Ti 8GB", vram: 8, ram: 32, bandwidth: 608 },
  { id: "rtx3070-8", name: "GeForce RTX 3070 8GB", vram: 8, ram: 32, bandwidth: 448 },
  { id: "rtx3060ti-8", name: "GeForce RTX 3060 Ti 8GB", vram: 8, ram: 32, bandwidth: 448 },
  { id: "rtx3060-12", name: "GeForce RTX 3060 12GB", vram: 12, ram: 32, bandwidth: 360 },
  { id: "rtx2080ti-11", name: "GeForce RTX 2080 Ti 11GB", vram: 11, ram: 32, bandwidth: 616 },
  { id: "rtx2080super-8", name: "GeForce RTX 2080 SUPER 8GB", vram: 8, ram: 32, bandwidth: 496 },
  { id: "rtx2060super-8", name: "GeForce RTX 2060 SUPER 8GB", vram: 8, ram: 32, bandwidth: 448 },
  {
    id: "p102-100-10",
    name: "NVIDIA P102-100 10GB (채굴카드·GP102)",
    vram: 10,
    ram: 16,
    bandwidth: 440.3,
    sourceUrl: "https://www.techpowerup.com/gpu-specs/zotac-p102-100.b5306",
  },

  { id: "rtxpro6000blackwell-96", name: "RTX PRO 6000 Blackwell 96GB", vram: 96, ram: 256, bandwidth: 1792 },
  { id: "rtxpro5000blackwell-72", name: "RTX PRO 5000 Blackwell 72GB", vram: 72, ram: 192, bandwidth: 1344, vendor: "NVIDIA", architecture: "Blackwell", tbpW: 300, sourceUrl: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-5000/" },
  { id: "rtxpro5000blackwell-48", name: "RTX PRO 5000 Blackwell 48GB", vram: 48, ram: 128, bandwidth: 1344, vendor: "NVIDIA", architecture: "Blackwell", tbpW: 300, sourceUrl: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-5000/" },
  { id: "rtxpro4500blackwell-32", name: "RTX PRO 4500 Blackwell 32GB", vram: 32, ram: 96, bandwidth: 896, vendor: "NVIDIA", architecture: "Blackwell", tbpW: 200, sourceUrl: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-4500/" },
  { id: "rtxpro4000blackwell-24", name: "RTX PRO 4000 Blackwell 24GB", vram: 24, ram: 64, bandwidth: 672, vendor: "NVIDIA", architecture: "Blackwell", tbpW: 145, sourceUrl: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-4000/" },
  { id: "rtxpro4000sffblackwell-24", name: "RTX PRO 4000 SFF Blackwell 24GB", vram: 24, ram: 64, bandwidth: 432, vendor: "NVIDIA", architecture: "Blackwell", tbpW: 70, sourceUrl: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-4000-sff/" },
  { id: "rtxpro2000blackwell-16", name: "RTX PRO 2000 Blackwell 16GB", vram: 16, ram: 64, bandwidth: 288, vendor: "NVIDIA", architecture: "Blackwell", tbpW: 70, sourceUrl: "https://www.nvidia.com/en-us/products/workstations/professional-desktop-gpus/rtx-pro-2000/" },
  { id: "rtx6000ada-48", name: "RTX 6000 Ada 48GB", vram: 48, ram: 128, bandwidth: 960 },
  { id: "rtx5000ada-32", name: "RTX 5000 Ada 32GB", vram: 32, ram: 128, bandwidth: 576 },
  { id: "rtx4500ada-24", name: "RTX 4500 Ada 24GB", vram: 24, ram: 96, bandwidth: 432 },
  { id: "rtx4000ada-20", name: "RTX 4000 Ada 20GB", vram: 20, ram: 64, bandwidth: 360 },
  { id: "rtx4000sffada-20", name: "RTX 4000 SFF Ada 20GB", vram: 20, ram: 64, bandwidth: 280 },
  { id: "rtxa6000-48", name: "RTX A6000 48GB", vram: 48, ram: 128, bandwidth: 768 },
  { id: "rtxa5000-24", name: "RTX A5000 24GB", vram: 24, ram: 96, bandwidth: 768 },
  { id: "rtxa4500-20", name: "RTX A4500 20GB", vram: 20, ram: 64, bandwidth: 640 },
  { id: "rtxa4000-16", name: "RTX A4000 16GB", vram: 16, ram: 64, bandwidth: 448 },
  { id: "quadrortx8000-48", name: "Quadro RTX 8000 48GB", vram: 48, ram: 128, bandwidth: 672 },
  { id: "quadrortx6000-24", name: "Quadro RTX 6000 24GB", vram: 24, ram: 96, bandwidth: 672 },
  { id: "titanrtx-24", name: "Titan RTX 24GB", vram: 24, ram: 64, bandwidth: 672 },

  { id: "dgxspark-gb10-128", name: "NVIDIA GB10 / DGX Spark 128GB 통합메모리", vram: 128, ram: 128, bandwidth: 273 },
  { id: "b200-192", name: "NVIDIA B200 192GB", vram: 192, ram: 512, bandwidth: 8000 },
  { id: "b100-192", name: "NVIDIA B100 192GB", vram: 192, ram: 512, bandwidth: 8000 },
  { id: "h200-141", name: "NVIDIA H200 SXM 141GB", vram: 141, ram: 384, bandwidth: 4800 },
  { id: "h100-sxm-80", name: "NVIDIA H100 SXM 80GB", vram: 80, ram: 256, bandwidth: 3350 },
  { id: "h100-pcie-80", name: "NVIDIA H100 PCIe 80GB", vram: 80, ram: 256, bandwidth: 2000 },
  { id: "h100-nvl-94", name: "NVIDIA H100 NVL 94GB", vram: 94, ram: 256, bandwidth: 3900 },
  { id: "a100-sxm-80", name: "NVIDIA A100 SXM 80GB", vram: 80, ram: 256, bandwidth: 2039 },
  { id: "a100-pcie-80", name: "NVIDIA A100 PCIe 80GB", vram: 80, ram: 256, bandwidth: 1935 },
  { id: "a100-40", name: "NVIDIA A100 40GB", vram: 40, ram: 128, bandwidth: 1555 },
  { id: "l40s-48", name: "NVIDIA L40S 48GB", vram: 48, ram: 128, bandwidth: 864 },
  { id: "l40-48", name: "NVIDIA L40 48GB", vram: 48, ram: 128, bandwidth: 864 },
  { id: "l4-24", name: "NVIDIA L4 24GB", vram: 24, ram: 64, bandwidth: 300 },
  { id: "a40-48", name: "NVIDIA A40 48GB", vram: 48, ram: 128, bandwidth: 696 },
  { id: "a30-24", name: "NVIDIA A30 24GB", vram: 24, ram: 96, bandwidth: 933 },
  { id: "a10-24", name: "NVIDIA A10 24GB", vram: 24, ram: 64, bandwidth: 600 },
  { id: "t4-16", name: "NVIDIA T4 16GB", vram: 16, ram: 64, bandwidth: 320 },
  { id: "v100-32", name: "NVIDIA V100 32GB", vram: 32, ram: 128, bandwidth: 900 },
  { id: "p100-16", name: "NVIDIA P100 16GB", vram: 16, ram: 64, bandwidth: 732 },

  { id: "mi325x-256", name: "AMD Instinct MI325X 256GB", vram: 256, ram: 512, bandwidth: 6000 },
  { id: "mi300x-192", name: "AMD Instinct MI300X 192GB", vram: 192, ram: 512, bandwidth: 5300 },
  { id: "mi250x-128", name: "AMD Instinct MI250X 128GB", vram: 128, ram: 384, bandwidth: 3277 },
  { id: "mi210-64", name: "AMD Instinct MI210 64GB", vram: 64, ram: 256, bandwidth: 1638 },
  { id: "r9700-32", name: "Radeon AI PRO R9700 32GB", vram: 32, ram: 96, bandwidth: 640 },
  { id: "w7900-48", name: "Radeon PRO W7900 48GB", vram: 48, ram: 128, bandwidth: 864 },
  { id: "w7800-48", name: "Radeon PRO W7800 48GB", vram: 48, ram: 128, bandwidth: 864 },
  { id: "w7800-32", name: "Radeon PRO W7800 32GB", vram: 32, ram: 96, bandwidth: 576 },
  { id: "w7700-16", name: "Radeon PRO W7700 16GB", vram: 16, ram: 64, bandwidth: 576 },
  { id: "w6800-32", name: "Radeon PRO W6800 32GB", vram: 32, ram: 96, bandwidth: 512 },
  { id: "rx9070xt-16", name: "Radeon RX 9070 XT 16GB", vram: 16, ram: 64, bandwidth: 640 },
  { id: "rx9070-16", name: "Radeon RX 9070 16GB", vram: 16, ram: 64, bandwidth: 640, vendor: "AMD", architecture: "RDNA 4", memoryType: "dedicated", runtimes: ["ROCm", "Vulkan"], sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070.html" },
  { id: "rx9070gre-12", name: "Radeon RX 9070 GRE 12GB", vram: 12, ram: 32, bandwidth: 432, vendor: "AMD", architecture: "RDNA 4", tbpW: 220, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9070-gre.html" },
  { id: "rx9060xt-16", name: "Radeon RX 9060 XT 16GB", vram: 16, ram: 32, bandwidth: 320, vendor: "AMD", architecture: "RDNA 4", tbpW: 160, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9060-xt.html" },
  { id: "rx9060xt-8", name: "Radeon RX 9060 XT 8GB", vram: 8, ram: 32, bandwidth: 320, vendor: "AMD", architecture: "RDNA 4", tbpW: 160, sourceUrl: "https://www.amd.com/en/products/graphics/desktops/radeon/9000-series/amd-radeon-rx-9060-xt.html" },
  { id: "rx7900xtx-24", name: "Radeon RX 7900 XTX 24GB", vram: 24, ram: 64, bandwidth: 960 },
  { id: "rx7900xt-20", name: "Radeon RX 7900 XT 20GB", vram: 20, ram: 64, bandwidth: 800 },
  { id: "rx7900gre-16", name: "Radeon RX 7900 GRE 16GB", vram: 16, ram: 64, bandwidth: 576 },
  { id: "rx7800xt-16", name: "Radeon RX 7800 XT 16GB", vram: 16, ram: 64, bandwidth: 624 },
  { id: "rx6950xt-16", name: "Radeon RX 6950 XT 16GB", vram: 16, ram: 64, bandwidth: 576 },
  {
    id: "ryzen-ai-max-plus-395-64",
    name: "AMD Ryzen AI Max+ 395 / Radeon 8060S 64GB 통합메모리",
    vram: 64,
    ram: 64,
    bandwidth: 256,
    vendor: "AMD",
    architecture: "RDNA 3.5 / Strix Halo",
    memoryType: "unified",
    gpuUsableMemoryGb: 48,
    runtimes: ["Vulkan", "DirectML", "ROCm 확인"],
    aliases: ["AI Max 395 64GB", "Ryzen 395 64GB", "395+ 64GB", "Radeon 8060S 64GB", "Strix Halo 64GB"],
    sourceUrl: "https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html",
  },
  {
    id: "ryzen-ai-max-plus-395-128",
    name: "AMD Ryzen AI Max+ 395 / Radeon 8060S 128GB 통합메모리",
    vram: 128,
    ram: 128,
    bandwidth: 256,
    vendor: "AMD",
    architecture: "RDNA 3.5 / Strix Halo",
    memoryType: "unified",
    gpuUsableMemoryGb: 96,
    runtimes: ["Vulkan", "DirectML", "ROCm 확인"],
    aliases: ["AI Max 395", "Ryzen 395", "395+", "Radeon 8060S", "Strix Halo"],
    sourceUrl: "https://www.amd.com/en/products/processors/laptop/ryzen/ai-300-series/amd-ryzen-ai-max-plus-395.html",
  },

  { id: "intelmax1550-128", name: "Intel Data Center GPU Max 1550 128GB", vram: 128, ram: 384, bandwidth: 3276.8 },
  { id: "intelmax1100-48", name: "Intel Data Center GPU Max 1100 48GB", vram: 48, ram: 128, bandwidth: 1228.8 },
  { id: "intelflex170-16", name: "Intel Data Center GPU Flex 170 16GB", vram: 16, ram: 64, bandwidth: 576 },
  { id: "intelflex140-12", name: "Intel Data Center GPU Flex 140 12GB", vram: 12, ram: 64, bandwidth: 336 },
  { id: "arca770-16", name: "Intel Arc A770 16GB", vram: 16, ram: 64, bandwidth: 560 },
  { id: "arcb580-12", name: "Intel Arc B580 12GB", vram: 12, ram: 32, bandwidth: 456, vendor: "Intel", architecture: "Xe2 Battlemage", memoryType: "dedicated", runtimes: ["OpenVINO", "oneAPI", "DirectML"], sourceUrl: "https://www.intel.com/content/www/us/en/ark/products/series/240391/intel-arc-b-series-graphics.html" },
  { id: "arcb570-10", name: "Intel Arc B570 10GB", vram: 10, ram: 32, bandwidth: 380, vendor: "Intel", architecture: "Xe2 Battlemage", memoryType: "dedicated", runtimes: ["OpenVINO", "oneAPI", "DirectML"], sourceUrl: "https://www.intel.com/content/www/us/en/ark/products/series/240391/intel-arc-b-series-graphics.html" },
  { id: "arcprob70-32", name: "Intel Arc Pro B70 32GB", vram: 32, ram: 96, bandwidth: 608, vendor: "Intel", architecture: "Xe2 Battlemage", tbpW: 290, runtimes: ["OpenVINO", "oneAPI", "DirectML"], sourceUrl: "https://www.intel.com/content/www/us/en/products/docs/discrete-gpus/arc/workstations/b-series/overview.html" },
  { id: "arcprob65-32", name: "Intel Arc Pro B65 32GB", vram: 32, ram: 96, bandwidth: 608, vendor: "Intel", architecture: "Xe2 Battlemage", tbpW: 200, runtimes: ["OpenVINO", "oneAPI", "DirectML"], sourceUrl: "https://www.intel.com/content/www/us/en/products/docs/discrete-gpus/arc/workstations/b-series/overview.html" },
  { id: "arcprob60-24", name: "Intel Arc Pro B60 24GB", vram: 24, ram: 64, bandwidth: 456, vendor: "Intel", architecture: "Xe2 Battlemage", tbpW: 200, runtimes: ["OpenVINO", "oneAPI", "DirectML"], sourceUrl: "https://www.intel.com/content/www/us/en/products/docs/discrete-gpus/arc/workstations/b-series/overview.html" },
  { id: "arcprob50-16", name: "Intel Arc Pro B50 16GB", vram: 16, ram: 64, bandwidth: 224, vendor: "Intel", architecture: "Xe2 Battlemage", tbpW: 70, runtimes: ["OpenVINO", "oneAPI", "DirectML"], sourceUrl: "https://www.intel.com/content/www/us/en/products/docs/discrete-gpus/arc/workstations/b-series/overview.html" },

  { id: "m3ultra-512", name: "Apple M3 Ultra 512GB 통합메모리", vram: 512, ram: 512, bandwidth: 819 },
  { id: "m2ultra-192", name: "Apple M2 Ultra 192GB 통합메모리", vram: 192, ram: 192, bandwidth: 800 },
  { id: "m4max-128", name: "Apple M4 Max 128GB 통합메모리", vram: 128, ram: 128, bandwidth: 546 },
  { id: "m3max-128", name: "Apple M3 Max 128GB 통합메모리", vram: 128, ram: 128, bandwidth: 400 },
  { id: "m2max-96", name: "Apple M2 Max 96GB 통합메모리", vram: 96, ram: 96, bandwidth: 400 },
];

window.LLM_GPU_CHECKER_DATA.gpus = window.LLM_GPU_CHECKER_DATA.gpus.map((gpu) => {
  const text = `${gpu.id} ${gpu.name}`.toLowerCase();
  const vendor = gpu.vendor || (
    /nvidia|geforce|quadro|titan|rtx|dgx|h100|a100|b200|tesla/.test(text) ? "NVIDIA"
      : /amd|radeon|ryzen|instinct|mi\d/.test(text) ? "AMD"
        : /apple|m\d(?:max|ultra)/.test(text) ? "Apple"
          : /intel|arc|flex/.test(text) ? "Intel"
            : "Other"
  );
  const architecture = gpu.architecture || (
    /rtx 50|blackwell|b200|b100/.test(text) ? "Blackwell"
      : /rtx 40|ada/.test(text) ? "Ada Lovelace"
        : /rtx 30|a100|a30|a10/.test(text) ? "Ampere"
          : /h100|h200/.test(text) ? "Hopper"
            : /rx 90|r9700/.test(text) ? "RDNA 4"
              : /rx 7|w7/.test(text) ? "RDNA 3"
                : /mi3/.test(text) ? "CDNA 3"
                  : /mi2/.test(text) ? "CDNA 2"
                    : vendor === "Apple" ? "Apple Silicon"
                      : "Unspecified"
  );
  const memoryType = gpu.memoryType || (/통합메모리|unified|dgx spark|ryzen ai/.test(text) ? "unified" : "dedicated");
  const runtimeDefaults = vendor === "NVIDIA"
    ? ["CUDA"]
    : vendor === "AMD"
      ? (memoryType === "unified" ? ["Vulkan", "DirectML", "ROCm-check"] : ["ROCm", "Vulkan"])
      : vendor === "Apple"
        ? ["Metal", "MLX"]
        : vendor === "Intel"
          ? ["OpenVINO", "oneAPI"]
          : [];
  return {
    aliases: [],
    vendor,
    architecture,
    memoryType,
    gpuUsableMemoryGb: gpu.vram,
    runtimes: runtimeDefaults,
    formFactor: /laptop|mobile/.test(text)
      ? "laptop"
      : /instinct|data center|h100|h200|b100|b200|a100|a30|t4|v100|p100|l40|l4|flex/.test(text)
        ? "datacenter"
        : memoryType === "unified" ? "integrated" : "desktop",
    specStatus: gpu.sourceUrl ? "sourced" : "estimated",
    ...gpu,
  };
});
