import useSWR from 'swr';

import { fetchAccounts } from './api';

import type { Account } from '@/types/app';

import { cacheKey } from '@/lib/swr';

export function useAccounts(householdId: string | undefined, includeArchived = false) {
  return useSWR<Account[]>(
    householdId ? [...cacheKey.accounts(householdId), includeArchived] : null,
    () => fetchAccounts(householdId!, includeArchived),
  );
}
