-- 011_account_owner.sql
-- 계좌 소유자 구분: 개인 계좌 vs 공동 계좌

alter table accounts
  add column owner_member_id uuid references household_members(id) on delete set null;

comment on column accounts.owner_member_id is
  'null = 공동 계좌, not null = 해당 멤버의 개인 계좌';
