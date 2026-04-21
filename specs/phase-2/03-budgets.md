# Spec P2-03 — 예산 관리

## 목표

카테고리별 월 예산 설정, 진행률 시각화, 초과 알림.

## DB 신규

```sql
create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  amount numeric(15,2) not null check (amount > 0),
  period text not null default 'monthly',  -- 'monthly' | 'yearly'
  currency text not null default 'KRW',
  start_date date not null default date_trunc('month', current_date),
  is_active boolean not null default true,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now(),
  unique (household_id, category_id, period, is_active)
);
```

**주의**: `unique (household_id, category_id, period, is_active)` 부분 인덱스로 — 같은 카테고리에 복수 active budget 방지.

## 진행률 뷰

```sql
create view v_budget_progress as
select
  b.id as budget_id,
  b.household_id,
  b.category_id,
  c.name as category_name,
  c.icon,
  b.amount as budget_amount,
  coalesce(sum(t.amount), 0) as spent,
  coalesce(sum(t.amount), 0) / b.amount as progress,
  case
    when coalesce(sum(t.amount), 0) / b.amount >= 1.0 then 'over'
    when coalesce(sum(t.amount), 0) / b.amount >= 0.9 then 'warn'
    else 'ok'
  end as status
from budgets b
join categories c on c.id = b.category_id
left join transactions t on
  t.category_id = b.category_id
  and t.household_id = b.household_id
  and t.type = 'expense'
  and t.transaction_date >= date_trunc('month', current_date)
  and t.transaction_date < date_trunc('month', current_date) + interval '1 month'
where b.is_active = true
group by b.id, c.id;
```

## 화면

### `/settings/budgets` — 예산 설정
- 카테고리 리스트, 각 카테고리에 예산 설정
- 설정된 것만 표시 (미설정 카테고리 "+ 예산 추가")
- 슬라이더 또는 숫자 입력

### 홈 통합

"이번 달 흐름" 카드 아래에 **예산 요약 카드** 추가 (예산 1개 이상일 때만):

```
예산 현황                  6 / 7 설정
─────────────────────────
🍜 식비         97%  ■■■■■■■■■■░
🚕 교통        119%  ■■■■■■■■■■■ 초과
🏠 주거         95%  ■■■■■■■■■■░
쇼핑            62%  ■■■■■■░░░░░
[ 전체 보기 ]
```

## 알림 (in-app)

- 80% 도달: 홈 상단에 warn 배너 "이번 달 식비가 80%에 도달했어요"
- 100% 초과: danger 배너
- 푸시는 Phase 2+ (사용자 설정 추가 후)

## 수용 기준

- [ ] 예산 CRUD
- [ ] 같은 카테고리에 동시 복수 active budget 불가
- [ ] 진행률 실시간 계산 (거래 추가 시 revalidate)
- [ ] 색상: 0-94% 초록, 95-99% 주황, 100%+ 빨강
- [ ] 홈 요약 카드 조건부 표시 (예산 1개 이상)
- [ ] 80% / 100% 도달 시 배너 알림
- [ ] 예산 미설정 카테고리도 지출 기록 가능 (예산은 optional)
- [ ] 월 단위 자동 리셋 (새 달 시작 시 spent=0)
