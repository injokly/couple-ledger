# 05. Phases — 로드맵

각 Phase는 독립적으로 "출시 가능한" 단위여야 한다. Phase 1만으로도 부부가 실제로 쓸 수 있어야 한다.

---

## Phase 1 — MVP (4~6주)

**목표**: 수동 입력 가계부 + 자산 추적 + 순자산 추이

### 스펙 목록 (`specs/phase-1/`)

1. `01-auth-household.md` — Supabase Auth, household 생성, 부부 연결
2. `02-accounts-categories.md` — 계좌 CRUD, 카테고리 시드
3. `03-transactions.md` — 거래 CRUD (수입/지출/이체)
4. `04-quick-input.md` — 빠른입력 모달 (커스텀 numpad, 10초 플로우)
5. `05-asset-snapshots.md` — 월말 스냅샷 입력, 자동 알림
6. `06-home-dashboard.md` — 홈 화면 (순자산, 흐름, 자산 구성)
7. `07-transaction-list.md` — 거래 내역 조회, 편집, 삭제

### 성공 기준
- 부부 둘 다 가입, 거래 기록, 월말 스냅샷 작성 가능
- 순자산 추이 차트가 정확함 (스냅샷 6개 이상 축적)
- 거래 입력 평균 10초 이하

### 의도적으로 제외
- 반복 거래 자동 생성 (수동 재입력으로 충분)
- 시세 자동 갱신 (스냅샷에 수동 입력)
- 예산 관리
- 리포트 자동 생성

---

## Phase 2 — 자동화 & 분석 (3~4주)

**목표**: 자동으로 채워지고 의미가 보이는 단계

### 스펙 목록 (`specs/phase-2/`)

1. `01-recurring-automation.md` — pg_cron으로 반복 거래 자동 생성
2. `02-market-data-sync.md` — 증시/환율 API 연동, holdings 평가액 자동 계산
3. `03-budgets.md` — 카테고리별 월 예산, 진행률, 초과 알림
4. `04-monthly-report.md` — 매월 1일 자동 생성되는 리포트 페이지
5. `05-goals-simulation.md` — 목표 기반 복리 시뮬레이션, 달성 확률 차트

### 신규 테이블
- `market_data` (일별 시세)
- `budgets` (카테고리별 월 예산)
- `report_snapshots` (월간 리포트 캐시)

### 성공 기준
- 사용자가 증권계좌 잔액을 수동 업데이트할 필요 없어짐
- 월간 리포트에서 "이번 달 특이사항" 3건 이상 자동 추출
- 목표 달성 ETA가 현재 속도로 계산됨

---

## Phase 3 — AI 조언 (4주+)

**목표**: 데이터를 보여주는 수준에서 "조언하는" 수준으로

### 스펙 목록 (`specs/phase-3/`)

1. `01-ai-rebalancing.md` — Claude API 기반 리밸런싱 제안
2. `02-macro-indicators.md` — KOSPI, S&P 500, 환율, 금리 컨텍스트
3. `03-next-month-forecast.md` — 과거 패턴 + 다가오는 이벤트 기반 예측
4. `04-ai-monthly-insights.md` — 규칙 기반 인사이트를 LLM 자연어로 대체

### 신규 테이블
- `rebalancing_rules` (타겟 자산 배분)
- `rebalancing_log` (실행 이력)
- `ai_insights` (LLM 응답 캐시)

### 기술 주의점
- Claude API 호출은 **서버 사이드에서만** (API 키 노출 금지)
- LLM 응답은 캐싱 (같은 날 같은 포트폴리오면 재사용)
- 프롬프트에 PII 넣지 말 것 (금액은 %로 변환해서 전달 고려)
- 응답 형식은 structured JSON (파싱 실패 대비)

### 성공 기준
- 리밸런싱 제안의 "왜"가 설득력 있음
- 사용자가 제안 중 50% 이상 실제 실행
- 다음 달 예측 정확도 > 70% (주요 카테고리 ± 15% 이내)

---

## Phase 4+ (미확정)

- 오픈뱅킹 연동 (금융결제원)
- 영수증 OCR
- 데스크톱 전용 레이아웃
- 가족/자녀 확장
- iOS/Android 네이티브 앱

Phase 3 검증 이후 결정.

---

## 작업 순서 원칙

**한 번에 한 스펙.** 병렬 작업 금지. 의존성 위반 방지.

**Phase 내 순서**: 번호 순서대로. 예외 있으면 스펙 내부에 "의존성" 섹션에 명시.

**Phase 간 순서**: Phase N이 완료(수용 기준 100% 통과)되기 전 Phase N+1 시작 금지.
