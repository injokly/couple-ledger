# 우리 가계 (Couple Ledger) — Claude Code 작업 지침

**부부 자산관리 웹/모바일 앱.** 공유 가계부 + 자산 추적 + 리밸런싱 제안.

> **너의 역할**: 너는 이 프로젝트의 주 개발자다. 스펙을 읽고, 마이그레이션을 실행하고, 기능을 구현하고, 테스트를 작성한다. 불확실하면 사용자에게 묻는다. 추측하지 않는다.

---

## 🎯 단 한 가지 원칙

**입력 마찰 < 10초.** 사용자가 거래 1건을 입력하는 데 앱을 열고 저장 완료까지 10초 이상 걸리면 그 기능은 실패다. 모든 설계 판단은 이 기준을 통과해야 한다.

---

## 📚 반드시 먼저 읽을 문서 (순서대로)

1. `docs/00-overview.md` — 무엇을 만드는가
2. `docs/01-architecture.md` — 기술 스택 & 폴더 구조
3. `docs/02-data-model.md` — 데이터베이스 전체 스키마 (이걸 외울 정도로 읽어라)
4. `docs/03-ux-principles.md` — UX 대원칙 (10초 규칙, 5탭 구조, 공유 모델)
5. `docs/04-design-system.md` — 컬러/타이포/간격 토큰
6. `docs/05-phases.md` — Phase 1/2/3 로드맵
7. `docs/conventions/` — 코드·커밋·테스트 컨벤션

**현재 Phase: Phase 1 (MVP)**

---

## 🛠 기술 스택 (고정)

| 영역 | 선택 |
|---|---|
| 프레임워크 | React 19 + React Router v7 (Framework mode) |
| 빌드 | Vite |
| 패키지 매니저 | **pnpm** (npm/yarn 쓰지 말 것) |
| 언어 | TypeScript (strict) |
| 스타일링 | Emotion (`@emotion/react`, `@emotion/styled`) |
| 상태 | Zustand (클라이언트 상태), SWR (서버 데이터) |
| 백엔드 | Supabase (Postgres + Auth + RLS + Realtime) |
| 차트 | Recharts (Phase 1) → Visx (Phase 2+) |
| 폰트 | Pretendard (국문) |
| 테스트 | Vitest + Testing Library + Playwright (E2E) |
| 린트 | ESLint + Prettier + TypeScript strict |

**SWC는 쓰지 말 것** (CSR 라우팅 이슈 있음, Babel 사용).

---

## 📂 작업 루틴

새 기능을 구현할 때 **반드시 이 순서**를 따른다:

1. **스펙 읽기** — `specs/phase-{n}/{task}.md` 를 처음부터 끝까지 읽는다
2. **질문하기** — 모호한 부분이 있으면 구현 전에 사용자에게 묻는다 (추측 금지)
3. **관련 파일 파악** — `grep` / `read` 로 영향받을 파일들을 먼저 본다
4. **타입 먼저** — 새 엔티티면 `src/types/` 에 타입부터 정의
5. **DB 레이어** — Supabase 쿼리 함수를 `src/lib/api/` 에 작성
6. **훅** — SWR 훅을 `src/hooks/` 에 작성 (`useTransactions`, `useAccounts` 등)
7. **컴포넌트** — 작은 것부터 (`src/components/`), 페이지는 조립만 (`src/routes/`)
8. **테스트** — 쿼리/훅 단위 테스트, 핵심 플로우는 E2E
9. **수용 기준(Acceptance Criteria) 확인** — 스펙 하단 체크리스트 전부 ✅ 인지 직접 확인
10. **커밋** — `docs/conventions/commit-message.md` 포맷 준수

---

## 🚫 절대 하지 말 것

- **스펙을 건너뛰고 구현하지 말 것** — 뭐든 `specs/` 먼저 읽어라
- **RLS 우회하지 말 것** — service_role 키를 클라이언트에 노출하지 말 것
- **새 라이브러리를 임의로 추가하지 말 것** — 위 스택에 없으면 먼저 물어라
- **시스템 키보드로 금액 입력받지 말 것** — 커스텀 numpad 필수 (UX 원칙)
- **매일 변하는 시세를 거래 테이블로 추적하지 말 것** — `asset_snapshots` 사용
- **거래 수정 시 원본을 파괴적으로 덮어쓰지 말 것** — 편집 이력 남길 수 있게 `updated_at` 관리
- **다크모드·라이트모드 토글 만들지 말 것** (MVP는 다크 only)
- **영수증 OCR / 오픈뱅킹 직접 연동 시도하지 말 것** (Phase 4+ 범위)

---

## ✅ 모든 PR이 통과해야 하는 체크리스트

- [ ] `pnpm typecheck` 통과
- [ ] `pnpm lint` 통과
- [ ] `pnpm test` 통과
- [ ] 새 테이블·컬럼이면 마이그레이션 파일 생성 + `supabase db push` 성공
- [ ] RLS 정책 작성 및 테스트
- [ ] 해당 스펙의 수용 기준 전부 충족
- [ ] 모바일 뷰포트(375px) 에서 시각 확인
- [ ] 10초 규칙에 저촉되는 플로우가 있으면 UX 재검토

---

## 💬 커뮤니케이션

- 한국어로 답한다 (사용자 선호)
- 불확실성을 숨기지 않는다 — 모르면 "모른다" 고 말한다
- 큰 결정은 제안 후 사용자 승인 받는다
- 사용자는 `강인조`, 은행 PL, React 스택 숙련자. 주니어 설명 필요 없음

---

## 🗂 주요 파일 위치 참조

```
CLAUDE.md                ← 너가 지금 읽는 이 파일
docs/02-data-model.md    ← DB 스키마 전체
docs/04-design-system.md ← 컬러·타이포 토큰
specs/phase-1/           ← 현재 할 일 목록 (순서대로)
supabase/migrations/     ← DDL (번호 순서로 실행)
```
