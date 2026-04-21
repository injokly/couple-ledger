# Spec P2-02 — 시세 연동

## 목표

보유 종목(holdings)의 평가금액을 시세 API로 자동 갱신.

## DB 신규

```sql
create table market_data (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  market text not null,             -- 'KOSPI', 'NASDAQ', 'crypto' etc
  price_date date not null,
  close_price numeric(15,4) not null,
  currency text not null default 'KRW',
  source text not null,             -- 'kis', 'alphavantage', 'yfinance'
  fetched_at timestamptz not null default now(),
  unique (symbol, market, price_date)
);

create index on market_data(symbol, price_date desc);
```

## 데이터 소스 선택

| 시장 | 1순위 | 대안 |
|---|---|---|
| 국내 주식/ETF | 한국투자증권 Open API | KRX 공식 |
| 미국 주식/ETF | Alpha Vantage (무료 tier) | Finnhub |
| 환율 | ExchangeRate-API | Open Exchange Rates |
| 암호화폐 | CoinGecko | Binance |

API 키는 Supabase Edge Function 환경변수로, **클라이언트 노출 금지**.

## Edge Function

```
supabase/functions/sync-market-data/index.ts
```

- 매일 장 마감 후 (한국시간 18:00 / 미국 다음날 06:00) 실행
- `holdings` 테이블의 distinct `symbol` 조회
- 외부 API 호출 → `market_data` 에 upsert
- 실패 종목은 재시도 큐 (최대 3회)

pg_cron으로 Edge Function 호출:
```sql
select cron.schedule('sync-kr-market', '0 18 * * 1-5', 'select net.http_post(...)');
select cron.schedule('sync-us-market', '0 6 * * 2-6', 'select net.http_post(...)');
```

## 평가금액 계산

```sql
create or replace view v_holdings_valued as
select
  h.*,
  md.close_price,
  md.price_date,
  h.quantity * md.close_price * coalesce(
    (select rate from v_latest_exchange_rate where from_ccy = md.currency and to_ccy = 'KRW'),
    1
  ) as value_krw,
  (h.quantity * md.close_price - h.quantity * h.avg_cost) as unrealized_pnl
from holdings h
left join lateral (
  select * from market_data
  where symbol = h.symbol and market = h.market
  order by price_date desc
  limit 1
) md on true;
```

## 자산 스냅샷과의 관계

- 스냅샷 폼 진입 시 투자 계좌 잔액은 `v_holdings_valued` 합계로 **자동 채움**
- 사용자가 수동 오버라이드 가능 (예: 평단 오류 수정 전)
- 오버라이드 여부는 `memo` 또는 별도 플래그로 표기

## 수용 기준

- [ ] `market_data` 테이블 매일 갱신 (영업일)
- [ ] 장 마감 후 1시간 이내 데이터 반영
- [ ] Edge Function 실패 시 재시도 (최대 3회)
- [ ] Holdings 평가액이 자산 스냅샷 폼에서 자동 계산
- [ ] 사용자 수동 오버라이드 가능
- [ ] 환율 매일 갱신 (외화 종목 보유 시)
- [ ] API 키 클라이언트 번들에 노출되지 않음 (grep 검증)
- [ ] 데이터 소스 변경 대비 `source` 컬럼 활용
- [ ] 홈 자산 구성 카드 실시간 반영
