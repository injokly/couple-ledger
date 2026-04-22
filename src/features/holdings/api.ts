import type { Holding, HoldingValued, AssetClass } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toHolding(row: Record<string, unknown>): Holding {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    accountId: row.account_id as string,
    symbol: row.symbol as string,
    market: (row.market as string) ?? null,
    name: row.name as string,
    assetClass: row.asset_class as AssetClass,
    quantity: Number(row.quantity),
    avgCost: row.avg_cost != null ? Number(row.avg_cost) : null,
    currency: row.currency as string,
    updatedAt: row.updated_at as string,
  };
}

function toHoldingValued(row: Record<string, unknown>): HoldingValued {
  return {
    ...toHolding(row),
    closePrice: row.close_price != null ? Number(row.close_price) : null,
    priceDate: (row.price_date as string) ?? null,
    priceSource: (row.price_source as string) ?? null,
    marketValue: row.market_value != null ? Number(row.market_value) : null,
    valueKrw: row.value_krw != null ? Number(row.value_krw) : null,
    unrealizedPnl: row.unrealized_pnl != null ? Number(row.unrealized_pnl) : null,
  };
}

export async function fetchHoldings(householdId: string): Promise<Holding[]> {
  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('household_id', householdId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toHolding);
}

export async function fetchHoldingsValued(householdId: string): Promise<HoldingValued[]> {
  const { data, error } = await supabase
    .from('v_holdings_valued')
    .select('*')
    .eq('household_id', householdId);

  if (error) throw error;
  return (data ?? []).map(toHoldingValued);
}

export async function fetchHoldingsValuedByAccount(accountId: string): Promise<HoldingValued[]> {
  const { data, error } = await supabase
    .from('v_holdings_valued')
    .select('*')
    .eq('account_id', accountId);

  if (error) throw error;
  return (data ?? []).map(toHoldingValued);
}

export interface CreateHoldingInput {
  householdId: string;
  accountId: string;
  symbol: string;
  market?: string;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCost?: number;
  currency?: string;
}

export async function createHolding(input: CreateHoldingInput): Promise<Holding> {
  const { data, error } = await supabase
    .from('holdings')
    .insert({
      household_id: input.householdId,
      account_id: input.accountId,
      symbol: input.symbol,
      market: input.market ?? null,
      name: input.name,
      asset_class: input.assetClass,
      quantity: input.quantity,
      avg_cost: input.avgCost ?? null,
      currency: input.currency ?? 'KRW',
    })
    .select()
    .single();

  if (error) throw error;
  return toHolding(data);
}

export interface UpdateHoldingInput {
  quantity?: number;
  avgCost?: number | null;
}

export async function updateHolding(
  id: string,
  input: UpdateHoldingInput,
): Promise<Holding> {
  const { data, error } = await supabase
    .from('holdings')
    .update({
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.avgCost !== undefined && { avg_cost: input.avgCost }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toHolding(data);
}

export async function deleteHolding(id: string): Promise<void> {
  const { error } = await supabase.from('holdings').delete().eq('id', id);
  if (error) throw error;
}
