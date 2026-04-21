-- 006_recurring_templates.sql
-- 반복 거래 템플릿 (Phase 1에 테이블 생성, Phase 2에서 자동화 로직)

create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(15,2) not null check (amount > 0),
  currency text not null default 'KRW',
  account_id uuid not null references accounts(id),
  to_account_id uuid references accounts(id),
  category_id uuid references categories(id),
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  interval_n int not null default 1,
  day_of_month int check (day_of_month between 1 and 31),
  day_of_week int check (day_of_week between 0 and 6),
  next_run_date date,
  auto_create boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now()
);

create index recurring_household_idx on recurring_templates(household_id) where is_active;
create index recurring_next_run_idx on recurring_templates(next_run_date) where is_active;

-- transactions.recurring_template_id FK 연결
alter table transactions
  add constraint transactions_recurring_fk
  foreign key (recurring_template_id) references recurring_templates(id) on delete set null;

-- RLS
alter table recurring_templates enable row level security;

create policy "household members full access on recurring_templates"
  on recurring_templates for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
