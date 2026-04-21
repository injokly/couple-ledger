import useSWR from 'swr';

import type { MonthlyFlow } from '@/types/app';

import { supabase } from '@/lib/supabase';
import { toYYYYMMDD } from '@/lib/date';


// ── 이번 달 흐름 (수입/지출) ─────────────────

export function useMonthlyFlow(householdId: string | undefined) {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = toYYYYMMDD(now);

  return useSWR<MonthlyFlow>(
    householdId ? ['monthly-flow', householdId, monthStart] : null,
    async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('household_id', householdId!)
        .gte('transaction_date', monthStart)
        .lte('transaction_date', today)
        .in('type', ['income', 'expense']);

      if (error) throw error;

      let income = 0;
      let expense = 0;
      for (const row of data ?? []) {
        if (row.type === 'income') income += Number(row.amount);
        if (row.type === 'expense') expense += Number(row.amount);
      }

      const netFlow = income - expense;
      const savingRatePct = income > 0 ? (netFlow / income) * 100 : null;

      return {
        month: monthStart,
        income,
        expense,
        netFlow,
        savingRatePct,
      };
    },
  );
}

// ── 자산 구성 (최신 스냅샷 기반) ────────────────

export interface AssetBreakdownItem {
  group: string;
  label: string;
  emoji: string;
  total: number;
  percent: number;
  color: string;
}

const GROUP_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  real_estate: { label: '부동산', emoji: '🏠', color: '#1E3A2C' },
  investment: { label: '주식·펀드', emoji: '📈', color: '#3A1E1E' },
  cash: { label: '현금·예금', emoji: '💰', color: '#1E2B3A' },
  pension_other: { label: '연금·기타', emoji: '🪙', color: '#2D1E3A' },
};

export function useAssetBreakdown(householdId: string | undefined) {
  return useSWR<AssetBreakdownItem[]>(
    householdId ? ['asset-breakdown', householdId] : null,
    async () => {
      const { data, error } = await supabase
        .from('v_asset_breakdown')
        .select('*')
        .eq('household_id', householdId!);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const totalAssets = data
        .filter((r) => r.category !== 'loan')
        .reduce((sum, r) => sum + Number(r.value_krw), 0);

      return data
        .filter((r) => r.category !== 'loan')
        .map((r) => {
          const group = r.category as string;
          const config = GROUP_CONFIG[group] ?? { label: group, emoji: '📦', color: '#2A2B2F' };
          const total = Number(r.value_krw);
          return {
            group,
            label: config.label,
            emoji: config.emoji,
            total,
            percent: totalAssets > 0 ? (total / totalAssets) * 100 : 0,
            color: config.color,
          };
        })
        .sort((a, b) => b.total - a.total);
    },
  );
}
