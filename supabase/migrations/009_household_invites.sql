-- 009_household_invites.sql
-- 초대 링크 & 회원가입 시 household 자동 생성

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  max_uses int not null default 1,
  use_count int not null default 0,
  created_by uuid references household_members(id),
  created_at timestamptz not null default now()
);

create index invites_token_idx on household_invites(token);
create index invites_expires_idx on household_invites(expires_at);

alter table household_invites enable row level security;

-- 초대 생성은 owner만, 조회는 해당 household 멤버
create policy "members can read own household invites"
  on household_invites for select
  using (household_id in (select current_household_ids()));

create policy "owner can create invites"
  on household_invites for insert
  with check (
    household_id in (select current_household_ids())
    and exists (
      select 1 from household_members
      where user_id = auth.uid()
        and household_id = household_invites.household_id
        and role = 'owner'
    )
  );

-- ═════════════════════════════════════════════════════
-- 회원가입 시 자동 household 생성 / 초대 조인
-- ═════════════════════════════════════════════════════

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_household_id uuid;
  invite_token text;
  invite_row household_invites%rowtype;
  display_nm text;
begin
  invite_token := new.raw_user_meta_data->>'invite_token';
  display_nm := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));

  if invite_token is not null then
    -- 초대 토큰으로 기존 household 조인
    select * into invite_row from household_invites
    where token = invite_token
      and expires_at > now()
      and use_count < max_uses;

    if invite_row is null then
      raise exception '초대 링크가 유효하지 않거나 만료되었습니다';
    end if;

    insert into household_members (household_id, user_id, display_name, role)
    values (invite_row.household_id, new.id, display_nm, 'member');

    update household_invites
    set use_count = use_count + 1
    where id = invite_row.id;
  else
    -- 신규 household 생성 + owner 권한
    insert into households (name) values ('우리 가계')
      returning id into new_household_id;

    insert into household_members (household_id, user_id, display_name, role, color)
    values (new_household_id, new.id, display_nm, 'owner', '#EB4D3D');

    -- 기본 카테고리 시드
    perform seed_default_categories(new_household_id);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
