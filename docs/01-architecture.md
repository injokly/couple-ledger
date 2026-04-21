# 01. Architecture

## 기술 스택

| 영역 | 선택 | 버전 | 이유 |
|---|---|---|---|
| 런타임 | Node.js | 20+ | LTS |
| 패키지 매니저 | **pnpm** | 9+ | 디스크 효율, monorepo 대비 |
| 프레임워크 | React | 19 | Suspense, `use` 훅 활용 |
| 라우터 | React Router | v7 (Framework mode) | 익숙한 스택, SSR 가능 |
| 빌드 | Vite | 5+ | 속도. **SWC는 쓰지 말 것 (Babel 사용)** |
| 언어 | TypeScript | 5.5+ | `strict: true` |
| 스타일링 | Emotion | 11+ | CSS-in-JS, SSR 친화 |
| 클라이언트 상태 | Zustand | 5+ | 작고 단순, Module Federation 호환 |
| 서버 데이터 | SWR | 2+ | 낙관적 업데이트 간단 |
| 백엔드 | Supabase | — | Postgres + Auth + RLS + Realtime + Storage |
| 차트 | Recharts | — | Phase 1. Phase 2+에서 Visx 고려 |
| 테스트 | Vitest + Testing Library | — | 유닛 |
| E2E | Playwright | — | 핵심 플로우만 |
| 폰트 | Pretendard | — | 국문 기본 |

## 폴더 구조

```
src/
├── routes/                   # 라우트 파일 (React Router v7 Framework)
│   ├── _layout.tsx           # 공통 레이아웃 (탭바)
│   ├── _index.tsx            # 홈 (/)
│   ├── transactions._index.tsx
│   ├── transactions.$id.tsx
│   ├── assets._index.tsx
│   ├── settings._index.tsx
│   └── auth.signin.tsx
│
├── features/                 # 도메인별 기능 묶음
│   ├── transactions/
│   │   ├── components/       # TransactionRow, QuickInputModal 등
│   │   ├── hooks/            # useTransactions, useCreateTransaction
│   │   ├── api.ts            # Supabase 쿼리 함수
│   │   └── types.ts
│   ├── accounts/
│   ├── categories/
│   ├── snapshots/
│   ├── networth/
│   └── holdings/
│
├── components/               # 도메인-비특정 UI
│   ├── ui/                   # Button, Input, Modal, NumericPad
│   ├── layout/               # TabBar, PageHeader
│   └── charts/
│
├── hooks/                    # 범용 훅
│   ├── useCurrency.ts
│   ├── useHousehold.ts       # 현재 household 컨텍스트
│   └── useMediaQuery.ts
│
├── lib/                      # 인프라
│   ├── supabase.ts           # 클라이언트
│   ├── swr.ts                # SWR config
│   └── format.ts             # 금액 포맷 등
│
├── stores/                   # Zustand 스토어
│   ├── quickInput.ts         # 빠른입력 모달 상태
│   └── ui.ts                 # 기타 UI 상태
│
├── types/                    # 전역 타입
│   ├── database.ts           # Supabase generated
│   └── app.ts
│
├── theme/                    # 디자인 토큰
│   ├── colors.ts
│   ├── typography.ts
│   └── index.ts
│
└── root.tsx                  # App root
```

## 기능별 파일 배치 원칙

**Feature-first, 단일 폴더 내 응집**:
- 거래 관련 모든 것은 `features/transactions/` 하나에 모은다
- 여러 feature에서 쓰는 것만 `components/ui/` 로 올린다
- 순환 의존 금지: `features/a` 가 `features/b` 를 직접 import하지 않는다. 공통은 `components/` 또는 `hooks/` 로

## 데이터 흐름

```
Supabase (Postgres + RLS)
    ↓
features/*/api.ts   (Supabase client 쿼리)
    ↓
features/*/hooks.ts (SWR 래핑)
    ↓
features/*/components (UI)
    ↓
routes/*.tsx        (조립만)
```

**원칙**: 페이지 컴포넌트(`routes/`)는 로직을 갖지 않는다. 조립 + 레이아웃만.

## 상태 관리 분리

| 타입 | 도구 |
|---|---|
| 서버 데이터 (거래, 계좌 등) | **SWR** |
| 폼 상태 (입력 중 값) | `useState` 또는 `react-hook-form` (필요시) |
| 모달 열림/닫힘, UI 상태 | **Zustand** |
| 세션/인증 | Supabase Auth + Zustand 미러 |

Redux / Jotai / Recoil 쓰지 않는다.

## 환경 변수

```env
# .env.local
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# 서버에서만 (절대 VITE_ 프리픽스 금지)
SUPABASE_SERVICE_ROLE_KEY=
```

**service_role 키는 클라이언트 번들에 절대 포함하지 말 것.**

## 빌드 & 배포

- 개발: `pnpm dev` (Vite dev server)
- 타입 체크: `pnpm typecheck`
- 린트: `pnpm lint`
- 테스트: `pnpm test`
- 프로덕션 빌드: `pnpm build`
- 배포: Vercel 또는 Cloudflare Pages (React Router v7 호환)

## 성능 예산

- Initial JS bundle < 200 KB (gzipped)
- FCP < 1.5s (3G)
- 거래 저장 optimistic update < 50ms (지연 느껴지면 안 됨)
