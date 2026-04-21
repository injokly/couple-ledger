-- 007_asset_snapshots.sql
-- 월말 자산 스냅샷 — 순자산 추이 차트의 원천

create table asset_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  account_id uuid not null references accounts(id),
  snapshot_date date not null,
  balance numeric(15,2) not null,  -- 대출 계좌는 음수 가능
  currency text not null default 'KRW',
  exchange_rate numeric(10,4) default 1 check (exchange_rate > 0),
  memo text,
  source text default 'manual',   -- 'manual' | 'auto' (Phase 2)
  created_by uuid references household_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, snapshot_date)
);

create index snapshots_household_date_idx on asset_snapshots(household_id, snapshot_date desc);
create index snapshots_account_date_idx on asset_snapshots(account_id, snapshot_date desc);

create trigger snapshots_set_updated_at
  before update on asset_snapshots
  for each row execute function set_updated_at();

-- RLS
alter table asset_snapshots enable row level security;

create policy "household members full access on asset_snapshots"
  on asset_snapshots for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
