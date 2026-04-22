-- 015_report_snapshots.sql
-- Phase 2: 월간 리포트 캐시 테이블

create table report_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  report_month date not null,
  data jsonb not null,
  generated_at timestamptz not null default now(),
  unique (household_id, report_month)
);

create index report_snapshots_household_idx on report_snapshots(household_id, report_month desc);

-- RLS
alter table report_snapshots enable row level security;

create policy "household members full access on report_snapshots"
  on report_snapshots for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
