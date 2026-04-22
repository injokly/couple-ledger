-- 014_budgets.sql
-- Phase 2: 예산 관리 — budgets 테이블 + 진행률 뷰

create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  amount numeric(15,2) not null check (amount > 0),
  period text not null default 'monthly' check (period in ('monthly', 'yearly')),
  currency text not null default 'KRW',
  start_date date not null default date_trunc('month', current_date),
  is_active boolean not null default true,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now(),
  unique (household_id, category_id, period, is_active)
);

create index budgets_household_idx on budgets(household_id) where is_active;

-- RLS
alter table budgets enable row level security;

create policy "household members full access on budgets"
  on budgets for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

-- 예산 진행률 뷰
create or replace view v_budget_progress as
select
  b.id as budget_id,
  b.household_id,
  b.category_id,
  c.name as category_name,
  c.icon,
  c.color,
  b.amount as budget_amount,
  b.currency,
  coalesce(sum(t.amount), 0) as spent,
  case when b.amount > 0
    then coalesce(sum(t.amount), 0) / b.amount
    else 0
  end as progress,
  case
    when b.amount > 0 and coalesce(sum(t.amount), 0) / b.amount >= 1.0 then 'over'
    when b.amount > 0 and coalesce(sum(t.amount), 0) / b.amount >= 0.9 then 'warn'
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
