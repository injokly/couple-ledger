-- 003_accounts.sql
-- 자산 컨테이너: 계좌, 부동산, 대출 등

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in (
    'cash', 'savings', 'investment',
    'real_estate', 'pension', 'loan', 'other'
  )),
  institution text,
  currency text not null default 'KRW',
  icon text,
  color text,
  display_order int default 0,
  is_archived boolean not null default false,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_household_idx on accounts(household_id) where not is_archived;
create index accounts_household_type_idx on accounts(household_id, type);

create trigger accounts_set_updated_at
  before update on accounts
  for each row execute function set_updated_at();

-- RLS
alter table accounts enable row level security;

create policy "household members full access on accounts"
  on accounts for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
