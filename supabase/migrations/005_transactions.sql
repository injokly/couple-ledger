-- 005_transactions.sql
-- 거래: 수입/지출/이체

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(15,2) not null check (amount > 0),
  currency text not null default 'KRW',
  transaction_date date not null default current_date,
  account_id uuid not null references accounts(id),
  to_account_id uuid references accounts(id),
  category_id uuid references categories(id),
  memo text,
  tags text[] default '{}',
  recurring_template_id uuid,  -- Phase 2에서 recurring_templates 참조
  created_by uuid not null references household_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- 타입별 필드 무결성
  check (
    (type = 'transfer' and to_account_id is not null and category_id is null) or
    (type in ('income', 'expense') and to_account_id is null and category_id is not null)
  ),

  -- 이체 시 같은 계좌 금지
  check (
    type != 'transfer' or account_id != to_account_id
  )
);

create index tx_household_date_idx on transactions(household_id, transaction_date desc);
create index tx_household_category_idx on transactions(household_id, category_id);
create index tx_account_date_idx on transactions(account_id, transaction_date desc);
create index tx_tags_gin_idx on transactions using gin(tags);

create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- RLS
alter table transactions enable row level security;

create policy "household members full access on transactions"
  on transactions for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));
