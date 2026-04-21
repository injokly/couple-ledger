-- 010_views.sql
-- 집계 뷰: 홈 대시보드, 리포트 쿼리용

-- ═════════════════════════════════════════════════════
-- v_household_networth_by_date
-- 날짜별 순자산 (스냅샷 합계, 환율 적용)
-- ═════════════════════════════════════════════════════
create or replace view v_household_networth_by_date as
select
  household_id,
  snapshot_date,
  sum(balance * exchange_rate) as net_worth_krw,
  count(*) as account_count
from asset_snapshots
group by household_id, snapshot_date;

-- ═════════════════════════════════════════════════════
-- v_monthly_cashflow
-- 월별 수입/지출/순흐름
-- ═════════════════════════════════════════════════════
create or replace view v_monthly_cashflow as
select
  household_id,
  date_trunc('month', transaction_date)::date as month,
  sum(case when type = 'income' then amount else 0 end) as income,
  sum(case when type = 'expense' then amount else 0 end) as expense,
  sum(
    case when type = 'income' then amount
         when type = 'expense' then -amount
         else 0 end
  ) as net_flow,
  count(*) filter (where type = 'income') as income_count,
  count(*) filter (where type = 'expense') as expense_count
from transactions
where type in ('income', 'expense')
group by household_id, date_trunc('month', transaction_date);

-- ═════════════════════════════════════════════════════
-- v_category_spending_monthly
-- 월별 카테고리 지출
-- ═════════════════════════════════════════════════════
create or replace view v_category_spending_monthly as
select
  t.household_id,
  date_trunc('month', t.transaction_date)::date as month,
  c.id as category_id,
  c.name as category_name,
  c.icon as category_icon,
  sum(t.amount) as total,
  count(*) as tx_count
from transactions t
join categories c on c.id = t.category_id
where t.type = 'expense'
group by t.household_id, date_trunc('month', t.transaction_date), c.id;

-- ═════════════════════════════════════════════════════
-- v_account_with_latest_snapshot
-- 각 계좌의 최신 스냅샷 포함 뷰
-- ═════════════════════════════════════════════════════
create or replace view v_account_with_latest_snapshot as
select
  a.*,
  s.balance as latest_balance,
  s.snapshot_date as latest_snapshot_date,
  s.exchange_rate as latest_exchange_rate
from accounts a
left join lateral (
  select *
  from asset_snapshots
  where account_id = a.id
  order by snapshot_date desc
  limit 1
) s on true
where not a.is_archived;

-- ═════════════════════════════════════════════════════
-- v_asset_breakdown
-- 자산 구성 (타입별 집계)
-- ═════════════════════════════════════════════════════
create or replace view v_asset_breakdown as
select
  household_id,
  case
    when type = 'real_estate' then 'real_estate'
    when type = 'investment' then 'investment'
    when type in ('cash', 'savings') then 'cash'
    when type in ('pension', 'other') then 'pension_other'
    when type = 'loan' then 'loan'
    else 'other'
  end as category,
  sum(latest_balance * latest_exchange_rate) as value_krw,
  count(*) as account_count
from v_account_with_latest_snapshot
where latest_balance is not null
group by household_id, category;
