import type { AssetSnapshot, NetWorthPoint } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toSnapshot(row: Record<string, unknown>): AssetSnapshot {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    accountId: row.account_id as string,
    snapshotDate: row.snapshot_date as string,
    balance: Number(row.balance),
    currency: row.currency as string,
    exchangeRate: Number(row.exchange_rate ?? 1),
    memo: (row.memo as string) ?? null,
    source: (row.source as 'manual' | 'auto') ?? 'manual',
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── 최신 스냅샷 조회 (특정 날짜 기준) ──────────

export async function getLatestSnapshots(
  householdId: string,
  date: string,
): Promise<AssetSnapshot[]> {
  const { data, error } = await supabase
    .from('asset_snapshots')
    .select('*')
    .eq('household_id', householdId)
    .eq('snapshot_date', date)
    .order('account_id');

  if (error) throw error;
  return (data ?? []).map(toSnapshot);
}

// ── 이전 달 스냅샷 조회 (프리필용) ──────────────

export async function getPreviousSnapshots(
  householdId: string,
  beforeDate: string,
): Promise<AssetSnapshot[]> {
  const { data, error } = await supabase
    .from('asset_snapshots')
    .select('*')
    .eq('household_id', householdId)
    .lt('snapshot_date', beforeDate)
    .order('snapshot_date', { ascending: false });

  if (error) throw error;

  // 계좌별 가장 최근 스냅샷만 추출
  const latestByAccount = new Map<string, AssetSnapshot>();
  for (const row of (data ?? []).map(toSnapshot)) {
    if (!latestByAccount.has(row.accountId)) {
      latestByAccount.set(row.accountId, row);
    }
  }
  return Array.from(latestByAccount.values());
}

// ── 스냅샷 Upsert ──────────────────────────

export interface UpsertSnapshotInput {
  householdId: string;
  accountId: string;
  snapshotDate: string;
  balance: number;
  currency?: string;
  exchangeRate?: number;
  createdBy?: string;
}

export async function upsertSnapshots(
  inputs: UpsertSnapshotInput[],
): Promise<AssetSnapshot[]> {
  const rows = inputs.map((input) => ({
    household_id: input.householdId,
    account_id: input.accountId,
    snapshot_date: input.snapshotDate,
    balance: input.balance,
    currency: input.currency ?? 'KRW',
    exchange_rate: input.exchangeRate ?? 1,
    source: 'manual' as const,
    created_by: input.createdBy ?? null,
  }));

  const { data, error } = await supabase
    .from('asset_snapshots')
    .upsert(rows, { onConflict: 'account_id,snapshot_date' })
    .select();

  if (error) throw error;
  return (data ?? []).map(toSnapshot);
}

// ── 순자산 시계열 ──────────────────────────

export async function getNetWorthSeries(
  householdId: string,
  fromDate?: string,
  toDate?: string,
): Promise<NetWorthPoint[]> {
  let query = supabase
    .from('v_household_networth_by_date')
    .select('*')
    .eq('household_id', householdId)
    .order('snapshot_date', { ascending: true });

  if (fromDate) query = query.gte('snapshot_date', fromDate);
  if (toDate) query = query.lte('snapshot_date', toDate);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    snapshotDate: row.snapshot_date as string,
    netWorthKrw: Number(row.net_worth_krw),
  }));
}

// ── 해당 월 스냅샷 존재 여부 ──────────────

export async function hasSnapshotForMonth(
  householdId: string,
  year: number,
  month: number,
): Promise<boolean> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  const { count, error } = await supabase
    .from('asset_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .gte('snapshot_date', startDate)
    .lt('snapshot_date', endDate);

  if (error) throw error;
  return (count ?? 0) > 0;
}
