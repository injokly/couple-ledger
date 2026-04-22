// supabase/functions/sync-market-data/index.ts
// Edge Function: 시세 데이터 수집 + market_data upsert
// 실행: pg_cron 또는 외부 cron에서 HTTP POST

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALPHA_VANTAGE_KEY = Deno.env.get('ALPHA_VANTAGE_KEY') ?? '';

const MAX_RETRIES = 3;

interface MarketDataRow {
  symbol: string;
  market: string;
  price_date: string;
  close_price: number;
  currency: string;
  source: string;
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. holdings에서 고유 심볼 목록 조회
    const { data: holdings, error: holdingsError } = await supabase
      .from('holdings')
      .select('symbol, market, currency')
      .not('symbol', 'is', null);

    if (holdingsError) throw holdingsError;
    if (!holdings || holdings.length === 0) {
      return new Response(JSON.stringify({ message: 'No holdings to sync', count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 중복 제거
    const uniqueSymbols = new Map<string, { symbol: string; market: string; currency: string }>();
    for (const h of holdings) {
      const key = `${h.symbol}:${h.market}`;
      if (!uniqueSymbols.has(key)) {
        uniqueSymbols.set(key, h);
      }
    }

    const rows: MarketDataRow[] = [];
    const errors: string[] = [];

    // 2. 심볼별 시세 조회
    for (const [, { symbol, market, currency }] of uniqueSymbols) {
      let retries = 0;
      let success = false;

      while (retries < MAX_RETRIES && !success) {
        try {
          const price = await fetchPrice(symbol, market, currency);
          if (price) {
            rows.push(price);
            success = true;
          } else {
            retries++;
          }
        } catch (e) {
          retries++;
          if (retries >= MAX_RETRIES) {
            errors.push(`${symbol} (${market}): ${(e as Error).message}`);
          }
        }
      }
    }

    // 3. market_data에 upsert
    if (rows.length > 0) {
      const { error: upsertError } = await supabase
        .from('market_data')
        .upsert(rows, { onConflict: 'symbol,market,price_date' });

      if (upsertError) throw upsertError;
    }

    return new Response(
      JSON.stringify({
        message: 'Sync complete',
        synced: rows.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

async function fetchPrice(
  symbol: string,
  market: string,
  currency: string,
): Promise<MarketDataRow | null> {
  const today = new Date().toISOString().split('T')[0]!;

  if (market === 'NASDAQ' || market === 'NYSE') {
    return fetchAlphaVantage(symbol, market, currency, today);
  }

  if (market === 'crypto') {
    return fetchCoinGecko(symbol, market, today);
  }

  if (market === 'fx') {
    return fetchExchangeRate(symbol, today);
  }

  // 국내 주식: KIS API 또는 폴백
  if (market === 'KOSPI' || market === 'KOSDAQ') {
    return fetchAlphaVantage(symbol + '.KS', market, currency, today);
  }

  return null;
}

async function fetchAlphaVantage(
  symbol: string,
  market: string,
  currency: string,
  date: string,
): Promise<MarketDataRow | null> {
  if (!ALPHA_VANTAGE_KEY) return null;

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  const quote = json['Global Quote'];
  if (!quote || !quote['05. price']) return null;

  return {
    symbol: symbol.replace('.KS', ''),
    market,
    price_date: date,
    close_price: parseFloat(quote['05. price']),
    currency,
    source: 'alphavantage',
  };
}

async function fetchCoinGecko(
  symbol: string,
  market: string,
  date: string,
): Promise<MarketDataRow | null> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=krw`;
  const res = await fetch(url);
  const json = await res.json();

  const price = json[symbol.toLowerCase()]?.krw;
  if (!price) return null;

  return {
    symbol,
    market,
    price_date: date,
    close_price: price,
    currency: 'KRW',
    source: 'coingecko',
  };
}

async function fetchExchangeRate(
  symbol: string,
  date: string,
): Promise<MarketDataRow | null> {
  const url = `https://open.er-api.com/v6/latest/${symbol}`;
  const res = await fetch(url);
  const json = await res.json();

  const krwRate = json.rates?.KRW;
  if (!krwRate) return null;

  return {
    symbol,
    market: 'fx',
    price_date: date,
    close_price: krwRate,
    currency: 'KRW',
    source: 'exchangerate-api',
  };
}
