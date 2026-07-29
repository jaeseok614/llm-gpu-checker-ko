# GPU 데이터 기여 파이프라인

## 사용자 흐름

1. 사이트 검색에서 GPU 이름과 별칭을 확인합니다.
2. 찾지 못하면 직접 VRAM·RAM·대역폭을 입력해 계산을 계속할 수 있습니다.
3. `GPU 추가 요청`에서 공식 사양, 메모리 유형, 실제 GPU 할당 메모리, 실행 환경을 제출합니다.
4. 자동 검증 봇이 필수 필드, HTTPS 출처, 중복 ID·이름을 검사합니다.
5. 관리자가 사양을 확인하고 `gpu-ready` 라벨을 붙이면 데이터 PR이 생성됩니다.
6. CI가 전체 GPU·모델 데이터와 계산 테스트를 재검증합니다.

## GPU 스키마

- `vram`: 전용 VRAM 또는 제품의 전체 통합메모리
- `gpuUsableMemoryGb`: OS·BIOS 설정을 고려한 GPU 계산 기준 메모리
- `memoryType`: `dedicated` 또는 `unified`
- `runtimes`: 확인된 CUDA, ROCm, Vulkan, Metal, DirectML, OpenVINO 계열
- `aliases`: 검색에 사용할 제품 별칭
- `sourceUrl`: 공식 제조사 또는 신뢰 가능한 사양 출처

통합메모리는 전체 RAM을 무조건 GPU VRAM으로 간주하지 않습니다. 제품·운영체제 설정에 따라 실제 할당 가능 용량이 달라질 수 있습니다.

## 벤치마크

벤치마크 제보에는 사이트 GPU ID, 운영체제, 드라이버, 전력 제한/TGP, 런타임, 양자화, 컨텍스트, 최대 VRAM 사용량을 포함하는 것을 권장합니다. 사이트는 동일 GPU ID의 측정값을 GPU 정보와 연결합니다.
