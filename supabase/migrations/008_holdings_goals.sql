-- 008_holdings_goals.sql
-- 투자 종목 + 재무 목표

-- ═════════════════════════════════════════════════════
-- holdings: 투자 계좌 보유 종목
-- ═════════════════════════════════════════════════════

create table holdings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid not null references accounts(id),
  symbol text not null,
  market text,                -- 'KOSPI', 'NASDAQ', 'crypto' etc
  name text not null,
  asset_class text not null check (asset_class in (
    'stock', 'etf', 'bond', 'crypto', 'fund', 'cash', 'other'
  )),
  quantity numeric(18,6) not null check (quantity >= 0),
  avg_cost numeric(15,2),
  currency text not null default 'KRW',
  updated_at timestamptz not null default now(),
  unique (account_id, symbol, market)
);

create index holdings_account_idx on holdings(account_id);
create index holdings_symbol_idx on holdings(symbol);

create trigger holdings_set_updated_at
  before update on holdings
  for each row execute function set_updated_at();

alter table holdings enable row level security;

create policy "household members full access on holdings"
  on holdings for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

-- ═════════════════════════════════════════════════════
-- goals: 재무 목표
-- ═════════════════════════════════════════════════════

create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  emoji text,
  target_amount numeric(15,2) not null check (target_amount > 0),
  target_date date,
  linked_account_ids uuid[] default '{}',
  priority int default 0,
  status text not null default 'active' check (status in ('active', 'achieved', 'paused')),
  created_by uuid references household_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_household_status_idx on goals(household_id, status);

create trigger goals_set_updated_at
  before update on goals
  for each row execute function set_updated_at();

alter table goals enable row level security;

create policy "household members full access on goals"
  on goals for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
