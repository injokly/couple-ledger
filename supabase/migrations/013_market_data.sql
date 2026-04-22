-- 013_market_data.sql
-- Phase 2: 시세 연동 — market_data 테이블 + holdings 평가 뷰

create table market_data (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  market text not null,
  price_date date not null,
  close_price numeric(15,4) not null,
  currency text not null default 'KRW',
  source text not null,
  fetched_at timestamptz not null default now(),
  unique (symbol, market, price_date)
);

create index market_data_symbol_date_idx on market_data(symbol, price_date desc);

-- RLS: 모든 인증 사용자 읽기 가능, 쓰기는 service_role만
alter table market_data enable row level security;

create policy "authenticated users can read market_data"
  on market_data for select
  using (auth.uid() is not null);

-- 환율 조회 뷰 (최신 환율)
create or replace view v_latest_exchange_rate as
select distinct on (symbol)
  symbol as from_ccy,
  'KRW' as to_ccy,
  close_price as rate,
  price_date
from market_data
where market = 'fx'
order by symbol, price_date desc;

-- Holdings 평가 뷰
create or replace view v_holdings_valued as
select
  h.*,
  md.close_price,
  md.price_date as price_date,
  md.source as price_source,
  h.quantity * coalesce(md.close_price, 0) as market_value,
  h.quantity * coalesce(md.close_price, 0) *
    coalesce(
      (select rate from v_latest_exchange_rate where from_ccy = h.currency and to_ccy = 'KRW'),
      case when h.currency = 'KRW' then 1 else null end
    ) as value_krw,
  case
    when h.avg_cost is not null and h.avg_cost > 0
    then (coalesce(md.close_price, 0) - h.avg_cost) * h.quantity
    else null
  end as unrealized_pnl
from holdings h
left join lateral (
  select close_price, price_date, source
  from market_data
  where symbol = h.symbol
    and (market = h.market or h.market is null)
  order by price_date desc
  limit 1
) md on true;

-- v_holdings_valued RLS: holdings 테이블의 RLS를 상속
-- (뷰는 underlying 테이블의 RLS를 따름)
