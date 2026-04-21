-- 002_household_members.sql
-- auth.users ↔ households 조인 + RLS 공통 헬퍼

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  color text default '#3182F6',
  joined_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create index household_members_user_idx on household_members(user_id);
create index household_members_household_idx on household_members(household_id);

-- ═════════════════════════════════════════════════════
-- RLS 공통 헬퍼 함수
-- ═════════════════════════════════════════════════════

-- 현재 세션의 household_id들 반환 (RLS 정책에서 재사용)
create or replace function current_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id
  from household_members
  where user_id = auth.uid();
$$;

-- 현재 세션의 member_id 반환 (특정 household 내)
create or replace function current_member_id(p_household_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from household_members
  where user_id = auth.uid()
    and household_id = p_household_id
  limit 1;
$$;

-- ═════════════════════════════════════════════════════
-- RLS 정책
-- ═════════════════════════════════════════════════════

alter table households enable row level security;
alter table household_members enable row level security;

-- households: 멤버면 조회 가능
create policy "members can read own household"
  on households for select
  using (id in (select current_household_ids()));

create policy "owner can update household"
  on households for update
  using (
    exists (
      select 1 from household_members
      where user_id = auth.uid()
        and household_id = households.id
        and role = 'owner'
    )
  );

-- household_members: 같은 household 멤버 조회
create policy "members can read own members"
  on household_members for select
  using (household_id in (select current_household_ids()));

-- 본인 정보만 수정 (display_name, color)
create policy "member can update self"
  on household_members for update
  using (user_id = auth.uid());

-- household_invites 에서만 insert (trigger 기반, 별도 파일)
-- delete는 owner만
create policy "owner can delete member"
  on household_members for delete
  using (
    exists (
      select 1 from household_members me
      where me.user_id = auth.uid()
        and me.household_id = household_members.household_id
        and me.role = 'owner'
    )
  );
