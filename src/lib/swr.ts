import type { SWRConfiguration } from 'swr';

/**
 * SWR 공통 설정.
 * features/*/hooks 에서 `useSWR(key, fetcher, swrConfig)` 처럼 사용.
 */
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  dedupingInterval: 2000,
};

/**
 * 캐시 키 빌더. Feature별로 일관되게 사용.
 */
export const cacheKey = {
  transactions: (householdId: string, filters?: Record<string, unknown>) =>
    ['transactions', householdId, filters ?? {}] as const,

  accounts: (householdId: string) => ['accounts', householdId] as const,

  categories: (householdId: string, type?: string) =>
    ['categories', householdId, type] as const,

  netWorth: (householdId: string, range: string) =>
    ['networth', householdId, range] as const,

  snapshots: (householdId: string, date: string) =>
    ['snapshots', householdId, date] as const,
};
