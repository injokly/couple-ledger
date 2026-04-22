import useSWR from 'swr';

import { fetchReport } from './api';

import type { ReportData } from '@/types/app';

export function useReport(householdId: string | undefined, month: string | undefined) {
  return useSWR<ReportData>(
    householdId && month ? ['report', householdId, month] : null,
    () => fetchReport(householdId!, month!),
  );
}
