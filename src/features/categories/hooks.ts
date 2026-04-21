import useSWR from 'swr';

import { fetchCategories } from './api';

import type { Category } from '@/types/app';

import { cacheKey } from '@/lib/swr';

export function useCategories(
  householdId: string | undefined,
  type?: 'income' | 'expense',
  includeArchived = false,
) {
  return useSWR<Category[]>(
    householdId ? [...cacheKey.categories(householdId, type), includeArchived] : null,
    () => fetchCategories(householdId!, type, includeArchived),
  );
}
