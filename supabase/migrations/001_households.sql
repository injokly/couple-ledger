-- 001_households.sql
-- Household: 부부 단위 공유 컨테이너

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default '우리 가계',
  base_currency text not null default 'KRW',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger households_set_updated_at
  before update on households
  for each row execute function set_updated_at();

-- RLS는 002_members 와 함께 설정
