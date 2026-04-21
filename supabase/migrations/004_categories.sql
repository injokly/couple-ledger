-- 004_categories.sql
-- 거래 카테고리

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  parent_id uuid references categories(id),
  display_order int default 0,
  is_default boolean not null default false,  -- 기본 시드 카테고리인지
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index categories_household_type_idx on categories(household_id, type) where not is_archived;

-- ═════════════════════════════════════════════════════
-- 기본 카테고리 시드 함수
-- ═════════════════════════════════════════════════════

create or replace function seed_default_categories(p_household_id uuid)
returns void
language plpgsql
as $$
begin
  insert into categories (household_id, name, type, icon, display_order, is_default) values
    -- 지출
    (p_household_id, '식비',      'expense', '🍜',  1, true),
    (p_household_id, '교통',      'expense', '🚕',  2, true),
    (p_household_id, '주거',      'expense', '🏠',  3, true),
    (p_household_id, '공과금',    'expense', '💡',  4, true),
    (p_household_id, '쇼핑',      'expense', '🛒',  5, true),
    (p_household_id, '여가',      'expense', '🎬',  6, true),
    (p_household_id, '의료',      'expense', '💊',  7, true),
    (p_household_id, '교육',      'expense', '📚',  8, true),
    (p_household_id, '경조사',    'expense', '🎁',  9, true),
    (p_household_id, '기타 지출', 'expense', '📦', 10, true),
    -- 수입
    (p_household_id, '월급',      'income',  '💼',  1, true),
    (p_household_id, '성과급',    'income',  '🎯',  2, true),
    (p_household_id, '이자/배당', 'income',  '💰',  3, true),
    (p_household_id, '부수입',    'income',  '✨',  4, true),
    (p_household_id, '기타 수입', 'income',  '📥',  5, true);
end;
$$;

-- RLS
alter table categories enable row level security;

create policy "household members full access on categories"
  on categories for all
  using (household_id in (select current_household_ids()))
  with check (household_id in (select current_household_ids()));

-- 기본 카테고리는 삭제 금지 (아카이브만)
create or replace function prevent_default_category_delete()
returns trigger
language plpgsql
as $$
begin
  if old.is_default then
    raise exception '기본 카테고리는 삭제할 수 없습니다. 아카이브하세요.';
  end if;
  return old;
end;
$$;

create trigger categories_prevent_default_delete
  before delete on categories
  for each row execute function prevent_default_category_delete();
