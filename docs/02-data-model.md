# 부부 자산관리 MVP — 데이터 모델 설계

Supabase (PostgreSQL + Row Level Security) 기반

---

## 설계 원칙

1. **Household = 멀티테넌시 경계** — 모든 도메인 테이블에 `household_id`, RLS로 격리
2. **스냅샷으로 히스토리** — 차트는 거래 누적 합산이 아니라 `asset_snapshots` 별도 테이블에서
3. **Transactions는 불변, Holdings는 가변** — 거래는 사실, 보유현황은 현재 상태
4. **복식부기 안 씀** — 개인 자산관리 MVP엔 과함. CHECK 제약으로 최소한의 무결성만
5. **통화는 엔티티 레벨** — 모든 금액에 `currency` + 외화는 `exchange_rate` 동반

---

## ERD 개념도

```
auth.users (Supabase 기본)
    │
    └─── household_members ──┐
                             ↓
                         households
                             │
       ┌─────────┬───────────┼───────────┬──────────┐
       ↓         ↓           ↓           ↓          ↓
   accounts  categories  recurring_    goals    (확장용)
       │         │       templates
       ├─ transactions ────→ categories
       ├─ asset_snapshots  (월별 잔액)
       └─ holdings         (종목)
```

---

## 1. households

```sql
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text not null default 'KRW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

부부 단위. 모든 도메인 데이터의 소유자.

---

## 2. household_members

```sql
create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member',  -- 'owner' | 'member'
  color text,                            -- UI 배지 색
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index on household_members(user_id);
```

`auth.users` ↔ `households` 조인. `role`로 소유자 구분 (탈퇴/계정 삭제 시 권한 처리).

---

## 3. accounts

```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,                   -- "KB 급여통장"
  type text not null,                   -- 'cash'|'savings'|'investment'|'real_estate'|'pension'|'loan'|'other'
  institution text,                     -- "KB", "삼성증권"
  currency text not null default 'KRW',
  icon text,
  color text,
  display_order int default 0,
  is_archived boolean not null default false,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now()
);

create index on accounts(household_id) where not is_archived;
```

자산 컨테이너. **대출은 `type='loan'` + 음수 잔액으로 표현** — 별도 테이블 없이 순자산 계산 통합 가능.

---

## 4. categories

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null,                   -- 'income' | 'expense'
  icon text,
  color text,
  parent_id uuid references categories(id),  -- 계층 구조
  display_order int default 0,
  is_archived boolean not null default false
);

create index on categories(household_id, type) where not is_archived;
```

**Household 생성 시 기본 카테고리 시드**:
- 수입: 월급, 성과급, 이자/배당, 부수입, 기타
- 지출: 식비, 교통, 주거, 공과금, 쇼핑, 여가, 의료, 교육, 경조사, 기타

---

## 5. transactions ⭐

```sql
create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null,                   -- 'income' | 'expense' | 'transfer'
  amount numeric(15,2) not null check (amount > 0),
  currency text not null default 'KRW',
  transaction_date date not null default current_date,
  account_id uuid not null references accounts(id),
  to_account_id uuid references accounts(id),  -- transfer 전용
  category_id uuid references categories(id),
  memo text,
  tags text[] default '{}',             -- ['개인용돈', '여행']
  recurring_template_id uuid references recurring_templates(id),
  created_by uuid not null references household_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 무결성 강제: transfer는 to_account 필수 + category 없음
  --              income/expense는 to_account 없음 + category 필수
  check (
    (type = 'transfer' and to_account_id is not null and category_id is null) or
    (type in ('income','expense') and to_account_id is null and category_id is not null)
  )
);

create index on transactions(household_id, transaction_date desc);
create index on transactions(household_id, category_id);
create index on transactions(account_id, transaction_date desc);
create index on transactions using gin(tags);
```

`tags`를 배열로 둔 이유: "개인용돈", "여행", "선물" 같은 보조 분류. 카테고리 수 폭발 방지. GIN 인덱스로 태그 검색.

---

## 6. recurring_templates

```sql
create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,                   -- "월급", "월세"
  type text not null,
  amount numeric(15,2) not null,
  currency text not null default 'KRW',
  account_id uuid not null references accounts(id),
  category_id uuid references categories(id),
  frequency text not null,              -- 'monthly'|'weekly'|'yearly'
  day_of_month int,                     -- 25
  day_of_week int,                      -- 1=월요일
  next_run_date date,
  is_active boolean not null default true,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now()
);
```

**Phase 1 동작**: 다음 실행일이 오면 홈에 "오늘 월급 입금되셨나요? [기록]" 카드 노출 → 한 번 탭으로 transactions에 기록.
**Phase 2**: pg_cron으로 자동 생성.

---

## 7. asset_snapshots ⭐⭐ (차트의 원천)

```sql
create table asset_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid not null references accounts(id),
  snapshot_date date not null,
  balance numeric(15,2) not null,
  currency text not null default 'KRW',
  exchange_rate numeric(10,4) default 1,  -- 외화 KRW 환산
  memo text,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now(),
  unique (account_id, snapshot_date)
);

create index on asset_snapshots(household_id, snapshot_date desc);
```

**이 테이블이 MVP 성패의 50%**. 순자산 추이 차트는 이 테이블만 보고 그림.

운영 전략:
- 매월 1일 푸시 알림 → "지난달 말 계좌 잔액 입력" UI
- 이전 달 값을 미리 채워서 변경만 하도록
- 주식 계좌는 직접 입력 (Phase 2에서 시세 API 연동)

---

## 8. holdings

```sql
create table holdings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid not null references accounts(id),
  symbol text not null,                 -- '005930', 'AAPL'
  market text,                          -- 'KOSPI', 'NASDAQ', 'crypto'
  name text not null,
  asset_class text not null,            -- 'stock'|'etf'|'bond'|'crypto'|'cash'
  quantity numeric(18,6) not null,
  avg_cost numeric(15,2),
  currency text not null default 'KRW',
  updated_at timestamptz not null default now(),
  unique (account_id, symbol)
);
```

MVP: 수동 입력 (계좌별 종목 + 수량 + 평단).
Phase 2: `market_data` 테이블 추가 후 실시간 평가액 계산.
Phase 3: `trades` 이벤트 테이블로 전환, holdings는 머티리얼라이즈드 뷰화.

---

## 9. goals

```sql
create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,                   -- '내 집 마련'
  target_amount numeric(15,2) not null,
  target_date date,
  linked_account_ids uuid[] default '{}',
  priority int default 0,
  status text not null default 'active', -- 'active'|'achieved'|'paused'
  created_by uuid references household_members(id),
  created_at timestamptz not null default now()
);
```

`linked_account_ids`: 이 목표에 기여하는 계좌들. 진행률 = 해당 계좌 합 ÷ `target_amount`.

---

## RLS 정책 (Supabase 핵심)

### 공통 헬퍼 함수

```sql
create or replace function current_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from household_members
  where user_id = auth.uid();
$$;
```

### 표준 정책 패턴 (모든 도메인 테이블에 적용)

```sql
alter table transactions enable row level security;

-- 조회
create policy "household members can read"
  on transactions for select
  using (household_id in (select current_household_ids()));

-- 생성: household 소속 + created_by가 본인
create policy "household members can insert"
  on transactions for insert
  with check (
    household_id in (select current_household_ids())
    and created_by in (
      select hm.id from household_members hm
      where hm.user_id = auth.uid()
        and hm.household_id = transactions.household_id
    )
  );

-- 수정: 본인이 만든 것 or 소유자
create policy "creator or owner can update"
  on transactions for update
  using (
    household_id in (select current_household_ids())
    and (
      created_by in (
        select id from household_members where user_id = auth.uid()
      )
      or exists (
        select 1 from household_members
        where user_id = auth.uid()
          and household_id = transactions.household_id
          and role = 'owner'
      )
    )
  );

-- 삭제: 동일 규칙
create policy "creator or owner can delete"
  on transactions for delete
  using ( /* 위와 동일 */ );
```

같은 패턴을 `accounts`, `categories`, `recurring_templates`, `asset_snapshots`, `holdings`, `goals`에 복제.

### household_members 특수 처리

권한 상승 방지를 위해 엄격히:
- INSERT: 최초 household 생성 시 edge function으로 처리 (RPC)
- UPDATE: 자기 자신의 `display_name`, `color`만 가능
- DELETE: `role='owner'`만 가능

---

## 주요 Derived View

### 월별 순자산 (홈 차트)

```sql
create view v_monthly_net_worth as
select
  household_id,
  snapshot_date,
  sum(balance * exchange_rate) as net_worth_krw
from asset_snapshots
group by household_id, snapshot_date;
```

### 월별 현금흐름

```sql
create view v_monthly_cashflow as
select
  household_id,
  date_trunc('month', transaction_date)::date as month,
  sum(case when type = 'income' then amount else 0 end) as income,
  sum(case when type = 'expense' then amount else 0 end) as expense,
  sum(case when type = 'income' then amount
           when type = 'expense' then -amount
           else 0 end) as net_flow
from transactions
where type in ('income', 'expense')
group by household_id, date_trunc('month', transaction_date);
```

### 카테고리별 지출

```sql
create view v_category_spending_monthly as
select
  t.household_id,
  date_trunc('month', t.transaction_date)::date as month,
  c.id as category_id,
  c.name as category_name,
  sum(t.amount) as total
from transactions t
join categories c on c.id = t.category_id
where t.type = 'expense'
group by t.household_id, date_trunc('month', t.transaction_date), c.id, c.name;
```

---

## 디자인 결정 & 트레이드오프

### Q1. 복식부기로 안 가는 이유
개인 자산관리 MVP엔 과한 엔지니어링. 수입=잔액 증가, 지출=잔액 감소로 단순 처리. **불일치는 월말 스냅샷 입력 시 자연 교정**. 회계 정확성보다 입력 마찰 최소화가 우선.

### Q2. 주식 매수/매도 이벤트를 따로 저장?
MVP: holdings 현재상태만 저장, 수동 편집.
Phase 2: `trades` 테이블 추가 (symbol, quantity, price, date, side) → holdings를 집계 뷰로 전환.

### Q3. 스냅샷 주기
기본 월말. `unique(account_id, snapshot_date)`라 원하면 중간 임의 날짜 가능 (보너스 받은 날 등).

### Q4. 개인용돈 등 프라이빗 영역
MVP: `tags` 배열에 `'개인'` 태그로 처리.
확장: 필요해지면 `transactions.visibility text ('shared'|'private')` 추가 + RLS에서 본인만 조회.

### Q5. 카테고리 시스템 vs 태그 시스템
- 카테고리: 1개, 필수, 계층 구조. 예산·리포트의 기준.
- 태그: N개, 선택. 횡단 분류 ("여행 전체", "선물 관련" 등).

---

## Phase 2+ 확장 포인트

현재 모델에서 자연스럽게 붙는 것들:

| 테이블 | 용도 | 시기 |
|--|--|--|
| `market_data` | 종목별 일별 시세 | Phase 2 |
| `budgets` | 카테고리별 월 예산 | Phase 2 |
| `trades` | 매수/매도 이벤트 | Phase 2 |
| `rebalancing_rules` | 타겟 자산배분 규칙 | Phase 3 |
| `ai_insights` | LLM이 생성한 월간 리포트 캐시 | Phase 3 |
| `notifications` | 알림 이력 | Phase 2 |

---

## 시드 데이터 (Household 생성 훅)

```sql
-- 함수로 만들어서 households insert after trigger로 실행
-- 1. 기본 카테고리 15개 삽입
-- 2. "현금" 계좌 1개 기본 생성
-- 3. 첫 asset_snapshot 0원으로 생성
```

---

## 인덱싱·성능 메모

- `transactions (household_id, transaction_date desc)` — 거래내역 페이지
- `transactions (household_id, category_id)` — 카테고리 필터
- `asset_snapshots (household_id, snapshot_date desc)` — 홈 차트
- `asset_snapshots (account_id, snapshot_date desc)` — 계좌별 추이
- `transactions using gin(tags)` — 태그 검색

MVP 규모(부부 2명)에선 과하지만, 개인 앱이 재미 붙어서 데이터 쌓이면 금방 고마워질 인덱스들.

---

## 다음 단계

1. Supabase 프로젝트 생성
2. 위 DDL을 마이그레이션으로 분리 (001_households, 002_accounts, ...)
3. RLS 정책 별도 마이그레이션 파일
4. TypeScript 타입 생성: `supabase gen types typescript`
5. 시드 데이터 스크립트 작성
