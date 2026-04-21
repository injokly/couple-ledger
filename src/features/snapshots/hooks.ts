import useSWR from 'swr';

import {
  getLatestSnapshots,
  getNetWorthSeries,
  getPreviousSnapshots,
  hasSnapshotForMonth,
} from './api';

import type { AssetSnapshot, NetWorthPoint } from '@/types/app';

import { cacheKey } from '@/lib/swr';
import { addMonths, toYYYYMMDD } from '@/lib/date';


export function useSnapshots(householdId: string | undefined, date: string | undefined) {
  return useSWR<AssetSnapshot[]>(
    householdId && date ? cacheKey.snapshots(householdId, date) : null,
    () => getLatestSnapshots(householdId!, date!),
  );
}

export function usePreviousSnapshots(householdId: string | undefined, beforeDate: string | undefined) {
  return useSWR<AssetSnapshot[]>(
    householdId && beforeDate ? ['prev-snapshots', householdId, beforeDate] : null,
    () => getPreviousSnapshots(householdId!, beforeDate!),
  );
}

export function useNetWorthSeries(
  householdId: string | undefined,
  range: '1M' | '6M' | '1Y' | 'ALL' = '6M',
) {
  const now = new Date();
  let fromDate: string | undefined;

  switch (range) {
    case '1M':
      fromDate = toYYYYMMDD(addMonths(now, -1));
      break;
    case '6M':
      fromDate = toYYYYMMDD(addMonths(now, -6));
      break;
    case '1Y':
      fromDate = toYYYYMMDD(addMonths(now, -12));
      break;
    case 'ALL':
      fromDate = undefined;
      break;
  }

  return useSWR<NetWorthPoint[]>(
    householdId ? cacheKey.netWorth(householdId, range) : null,
    () => getNetWorthSeries(householdId!, fromDate),
  );
}

export function useSnapshotReminder(householdId: string | undefined) {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const showReminder = dayOfMonth <= 3;

  // 전월 스냅샷 확인
  const prevMonth = now.getMonth(); // 0-indexed, 현재 달의 이전 달
  const prevYear = prevMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const prevMonthActual = prevMonth === 0 ? 12 : prevMonth;

  return useSWR<boolean>(
    householdId && showReminder ? ['snapshot-reminder', householdId, prevYear, prevMonthActual] : null,
    async () => {
      const exists = await hasSnapshotForMonth(householdId!, prevYear, prevMonthActual);
      return !exists;
    },
  );
}
