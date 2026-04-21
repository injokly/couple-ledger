# Phase 1 회고 (Retrospective)

**기간**: 2026-04-21 ~ 2026-04-22
**커밋**: 12개 (feat 8, fix 4)
**변경**: 37 파일, +5,214줄

---

## 스펙별 정리

### Spec 01 — Auth & Household `76922a5`

**구현**: Supabase Auth 기반 이메일 로그인/회원가입, 초대 토큰(24h, 1회용), AuthGuard, Zustand auth 스토어

**주요 결정**:
- SWR 대신 Zustand로 인증 상태 관리 — `onAuthStateChange` 리스너가 전역 상태와 더 잘 맞음
- `useCurrentMember`를 SWR에서 Zustand 직접 읽기로 변경 — auth 스토어가 이미 member를 들고 있으므로 이중 fetch 불필요

**예상과 다르게 간 부분**:
- `database.ts` placeholder 타입이 Supabase v2.104의 `GenericTable` 스키마와 맞지 않아 모든 테이블에 `Relationships: []` 필드를 수동 추가해야 했음
- `@types/node` 누락, ESLint flat config에 browser globals 미설정 — 초기 스캐폴딩 때 빠진 것들
- **`export default` 누락** (`AppLayout`) — React Router v7 Framework mode가 default export를 요구하는데 named export로 작성. 전체 레이아웃(탭바 포함)이 안 보이는 원인이었고, 3번의 fix 커밋 후에야 발견 (`f00862d`)

**후속 fix**: `cb222ff` — `init()`에 try/catch 없어 Supabase 연결 실패 시 `isLoading`이 영원히 `true`로 남는 문제

---

### Spec 02 — Accounts & Categories `9cfc46b`

**구현**: 계좌 추가/편집/아카이브, 카테고리 추가/편집/삭제/아카이브, 12가지 프리셋 색상, 지출/수입 탭

**주요 결정**:
- `Record<string, unknown>` 타입의 update 객체가 Supabase v2.104 타입에 맞지 않아 spread 패턴(`...(field !== undefined && { field })`)으로 변경
- 카테고리 삭제 시 거래 연결 수를 별도 쿼리로 확인 (DB trigger가 아닌 클라이언트 방어)

**예상과 다르게 간 부분**:
- 드래그 리오더(`display_order` 업데이트) API는 만들었으나 UI의 드래그 기능은 미구현 — 추가 라이브러리 필요해서 보류

---

### Spec 03 — Transactions `7ac0134`

**구현**: CRUD API, 커서 기반 페이지네이션, SWR 옵티미스틱 업데이트, useSWRInfinite

**주요 결정**:
- `listTransactions`에서 `limit + 1`개를 fetch해서 `hasMore` 판단 — cursor 기반 무한스크롤의 표준 패턴
- 옵티미스틱 생성 시 `temp-${Date.now()}` ID 사용, 서버 응답 후 revalidate로 대체

**예상과 다르게 간 부분**:
- 특별히 없음. 스펙이 명확했고 API 레이어는 순수 함수라 타입 문제만 해결하면 됐음

---

### Spec 04 — Quick Input `0f07869`

**구현**: 하단 시트 모달, 4×3 커스텀 NumericPad, 타입 토글, 카테고리 칩, 연속 입력 모드(롱프레스), 계좌 선택

**주요 결정**:
- NumericPad를 `src/components/ui/`에 분리 — Spec 05 스냅샷 입력에서도 재사용
- `localStorage`에 마지막 계좌 저장 — 스마트 디폴트로 입력 시간 단축
- 시스템 키보드가 뜨지 않도록 메모 필드만 `<input>`, 금액은 커스텀 핸들러

**예상과 다르게 간 부분**:
- `selectedAccount` 변수를 선언하고 사용하지 않아 lint 에러 — 삭제로 해결
- 이번 달 카테고리별 합계 hint는 미구현 (별도 쿼리 필요, 후순위)

---

### Spec 05 — Asset Snapshots `478286f`

**구현**: 스냅샷 upsert (unique constraint 활용), 이전 달 프리필, 변동률, 순자산 시계열, 리마인더 훅

**주요 결정**:
- `upsert`에 `onConflict: 'account_id,snapshot_date'` 사용 — 같은 날 재입력 시 덮어쓰기
- 대출 계좌 음수 입력을 위한 `±` 토글 버튼

**예상과 다르게 간 부분**:
- 자산 탭(`/assets`)이 placeholder로 남아 스냅샷 페이지 진입 경로가 없었음 → `15db46e`에서 자산 탭 구현 추가
- 저장 버튼이 `z-index: 10`으로 탭바(`z-index: 50`) 뒤에 가려짐 → `df7cb15`에서 수정

---

### Spec 06 — Home Dashboard `8b9af25`

**구현**: 순자산 카드(Recharts 라인차트), 기간 탭, 이번 달 흐름, 저축률 바, 스냅샷 리마인더, 자산 구성

**주요 결정**:
- `useMonthlyFlow`를 뷰 대신 직접 `transactions` 테이블 쿼리로 구현 — `v_monthly_cashflow` 뷰는 월 단위 그룹핑이라 "이번 달 22일까지" 같은 부분 집계가 안 됨
- 저축률 목표 50% 하드코딩 (스펙대로)

**예상과 다르게 간 부분**:
- **`v_asset_breakdown` 뷰 컬럼명 불일치** — 뷰: `category`, `value_krw` / 코드: `asset_group`, `total_balance`. 마이그레이션 SQL을 꼼꼼히 안 읽고 스펙 문서 기준으로 타입을 작성한 것이 원인 → `0bd9081`에서 수정
- `v_category_spending_monthly`의 `total` vs `total_amount` 불일치도 같이 발견

---

### Spec 07 — Transaction List `e13203b`

**구현**: 월 네비게이션, 수입/지출/저축 요약, 유형 필터 탭, 날짜 그룹핑, 메모 검색, IntersectionObserver 무한스크롤, 옵티미스틱 삭제

**주요 결정**:
- 거래 편집 모달은 미구현 — Quick Input과 구조가 유사하나 "타입 필드 disabled" 등 분기가 필요해서 Phase 1에서는 삭제만 지원
- 왼쪽 스와이프 삭제 대신 삭제 버튼으로 단순화

**예상과 다르게 간 부분**:
- `IntersectionObserver`, `HTMLDivElement` 등 DOM API가 ESLint globals에 없어서 추가 필요

---

## 공통 교훈

### 1. 마이그레이션 SQL과 타입의 동기화가 핵심
`database.ts`를 수동으로 작성할 때 뷰의 실제 컬럼명과 코드의 타입이 어긋나는 문제가 여러 번 발생. `pnpm supabase:types`로 자동 생성하는 게 안전하지만, 로컬 Supabase 없이 개발할 때는 마이그레이션 SQL을 한 줄씩 대조해야 함.

### 2. React Router v7 Framework mode = default export 필수
`layout()`, `route()`에 등록된 모듈은 반드시 `export default`. Named export로 쓰면 라우트 자체가 렌더되지 않아 전체 레이아웃이 사라지는데, 에러 메시지가 없어 디버깅이 어려움.

### 3. z-index 전략을 초기에 정해야 함
탭바(50), 모달(90/100), 스냅샷 저장 버튼(55) 등 fixed 요소가 많아지면서 겹침 문제 발생. z-index 스케일을 테마에 정의해두는 게 좋았을 것.

### 4. ESLint flat config의 globals는 선제적으로 설정
`js.configs.recommended`가 `no-unused-vars`를 켜고, browser globals(`window`, `console`, `IntersectionObserver` 등)를 모르는 상태. 매번 새 DOM API를 쓸 때마다 globals를 추가해야 했음.

### 5. 빈 데이터 상태(empty state)의 동선이 중요
스냅샷 페이지에 도달하려면 계좌가 있어야 하고, 계좌를 만들려면 설정에 가야 하고, 홈에서 설정까지의 경로를 모르면 막힘. 자산 탭을 placeholder로 남겨둔 것이 사용자 동선 단절의 원인.

---

## 미구현 / 후속 작업

| 항목 | 상태 | 비고 |
|------|------|------|
| 거래 편집 모달 | 미구현 | Quick Input 재사용 + type disabled |
| 드래그 리오더 (카테고리) | API만 | UI 드래그 라이브러리 필요 |
| 카테고리별 이번 달 합계 hint | 미구현 | Quick Input에서 카테고리 선택 시 |
| 왼쪽 스와이프 삭제 | 미구현 | 터치 제스처 라이브러리 필요 |
| E2E 테스트 (10초 규칙) | 미작성 | Playwright + 로컬 Supabase 필요 |
| Supabase 통합 테스트 | skip 처리 | 로컬 DB 환경에서 실행 필요 |
| 비밀번호 재설정 | 미구현 | Phase 1 스펙에서 open question |
| Pull-to-refresh | 미구현 | 모바일 터치 이벤트 |
