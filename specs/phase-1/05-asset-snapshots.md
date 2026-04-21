# Spec 05 — 자산 스냅샷 ⭐

**순자산 추이 차트의 데이터 원천.** 이 스펙의 정확도가 Phase 1 성공을 좌우한다.

## 목표

매월 1일, 사용자가 계좌별 잔액을 한 화면에서 입력한다. 이 데이터로 순자산 추이가 그려진다.

## 의존성

- `02-accounts-categories.md` (accounts 필요)

## 왜 스냅샷을 따로 두는가

> 매일 변하는 자산(주식 평가액, 부동산 시세)을 거래 테이블에 쌓으면 Phase 2에서 시세 API 연동 시 복잡도가 폭발한다. "월말, 잔액, 한 번"을 원칙으로.

## DB 요구사항

마이그레이션: `supabase/migrations/007_asset_snapshots.sql`

```sql
create table asset_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid not null references accounts(id),
  snapshot_date date not null,
  balance numeric(15,2) not null,
  currency text not null default 'KRW',
  exchange_rate numeric(10,4) default 1,
  memo text,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now(),
  unique (account_id, snapshot_date)
);

create index on asset_snapshots(household_id, snapshot_date desc);
```

`(account_id, snapshot_date)` UNIQUE로 중복 방지. 같은 날짜 업데이트는 upsert.

## 알림

**매월 1일 오전 9시** 홈 화면 최상단에 카드 표시:

```
Monthly Ritual
4월 말 자산 스냅샷을
기록할 시간이에요          [기록하기 →]
```

- 해당 월 스냅샷이 이미 있으면 카드 숨김
- 카드 탭 → `/assets/snapshot/new` 라우트

(Push notification은 Phase 2+)

## 화면

### `/assets/snapshot/new` — 스냅샷 입력 폼

```
┌─────────────────────────────────┐
│  ←  4월 자산 스냅샷             │
├─────────────────────────────────┤
│  3월 말 기준 값이 채워져 있어요.│
│  변경된 금액만 수정하세요.      │
├─────────────────────────────────┤
│  💳 KB 급여통장                 │
│     [ 3,245,800 ]  원    ± 0   │
│                                 │
│  📈 토스증권 기본계좌           │
│     [ 29,300,316 ]  원  +12.7% │
│                                 │
│  🏠 장안 힐스테이트             │
│     [ 1,135,000,000 ] 원 ± 0   │
│                                 │
│  💳 카카오뱅크 주담대           │
│     [ -472,562,483 ] 원  −0.3% │
│                                 │
│  ────────────────────────────   │
│  순자산 합계                    │
│  324,580,200원  +2.4% 전월대비 │
│                                 │
│     [  저장하기  ]               │
└─────────────────────────────────┘
```

### 입력 로직

- 이전 달 스냅샷이 있으면 그 값을 초기값으로 로드
- 없으면 0원
- 계좌 옆에 전월 대비 변화율 표시 (계산: `(current - prev) / prev * 100`)
- 입력 중 실시간으로 하단 순자산 합계 + 전월 대비 업데이트

### 입력 UI

- 금액은 탭하면 `NumericPad` (빠른입력과 동일) 사용
- 계좌 타입이 `loan`이면 음수 입력 허용
- 숫자 길이에 따라 폰트 크기 자동 조정 (max 28px)

## 차트 쿼리

순자산 추이는 뷰로:

```sql
create or replace view v_household_networth_by_date as
select
  household_id,
  snapshot_date,
  sum(balance * exchange_rate) as net_worth_krw,
  count(*) as account_count
from asset_snapshots
group by household_id, snapshot_date;
```

홈 차트(6M)는 이 뷰에서 최근 6개 월말 스냅샷 조회.

## API & 훅

```ts
// features/snapshots/api.ts
export async function getLatestSnapshotsByDate(
  householdId: string,
  date: Date
): Promise<AssetSnapshot[]>;

export async function upsertSnapshots(
  snapshots: Array<Omit<AssetSnapshot, 'id' | 'createdAt'>>
): Promise<AssetSnapshot[]>;

export async function getNetWorthSeries(
  householdId: string,
  fromDate: Date,
  toDate: Date
): Promise<NetWorthPoint[]>;

// hooks/
export function useLatestSnapshots(date?: Date): SWRResponse<AssetSnapshot[]>;
export function useNetWorthSeries(range: '1M' | '6M' | '1Y' | 'ALL'): SWRResponse<NetWorthPoint[]>;
```

## 수용 기준

- [ ] 매월 1일 이후 해당 월 스냅샷 없으면 홈에 알림 카드 표시
- [ ] 해당 월 스냅샷 존재 시 카드 자동 숨김
- [ ] 스냅샷 입력 폼 진입 시 이전 달 값 자동 로드
- [ ] 입력 중 하단 순자산 합계 실시간 갱신
- [ ] 계좌별 전월 대비 % 자동 계산 및 표시
- [ ] 저장 시 upsert — 같은 (account_id, snapshot_date)는 덮어쓰기
- [ ] 아카이브된 계좌는 폼에 표시 안 됨
- [ ] 대출 계좌는 음수 입력 허용 (CHECK 없음)
- [ ] 저장 성공 후 홈 차트에 새 데이터 포인트 반영 (revalidate)
- [ ] RLS: 다른 household 스냅샷 접근 불가
- [ ] 모바일 뷰포트에서 긴 금액 (11자리) 폭 깨지지 않음
- [ ] 스냅샷 날짜는 해당 월의 말일로 자동 설정 (4월 → 2026-04-30)

## 개방 질문

1. 월 중간에 임의 날짜 스냅샷 허용? (보너스 받은 날 등)  
   → **허용. `unique(account_id, snapshot_date)` 라 충분. UI는 월말 기본, "다른 날짜" 선택 가능.**
2. 스냅샷 편집 이력?  
   → **Phase 1 skip. upsert로 단순화.**
3. 주식 계좌 Phase 2 시세 연동 이후엔 수동 입력 폼에 노출할까?  
   → **계속 노출 (수동 오버라이드 가능). 자동값은 "자동" 표시.**

## 테스트

- 유닛: 전월 대비 % 계산 (이전값 0일 때 엣지 케이스)
- 통합: upsert — 같은 날짜 2번 저장 시 row 1개만
- 통합: 뷰 쿼리 — 여러 계좌 합산 정확도
- E2E: 스냅샷 입력 → 홈 차트 포인트 추가 확인
