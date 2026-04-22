import useSWR, { useSWRConfig } from 'swr';

import {
  fetchHoldings,
  fetchHoldingsValued,
  fetchHoldingsValuedByAccount,
  createHolding,
  updateHolding,
  deleteHolding,
  type CreateHoldingInput,
  type UpdateHoldingInput,
} from './api';

import type { Holding, HoldingValued } from '@/types/app';

import { cacheKey } from '@/lib/swr';

export function useHoldings(householdId: string | undefined) {
  return useSWR<Holding[]>(
    householdId ? cacheKey.holdings(householdId) : null,
    () => fetchHoldings(householdId!),
  );
}

export function useHoldingsValued(householdId: string | undefined) {
  return useSWR<HoldingValued[]>(
    householdId ? cacheKey.holdingsValued(householdId) : null,
    () => fetchHoldingsValued(householdId!),
  );
}

export function useHoldingsValuedByAccount(accountId: string | undefined) {
  return useSWR<HoldingValued[]>(
    accountId ? ['holdings-valued-account', accountId] : null,
    () => fetchHoldingsValuedByAccount(accountId!),
  );
}

export function useCreateHolding(householdId: string | undefined) {
  const { mutate } = useSWRConfig();

  return async (input: CreateHoldingInput) => {
    const result = await createHolding(input);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && (key[0] === 'holdings' || key[0] === 'holdings-valued'));
    }
    return result;
  };
}

export function useUpdateHolding(householdId: string | undefined) {
  const { mutate } = useSWRConfig();

  return async (id: string, input: UpdateHoldingInput) => {
    const result = await updateHolding(id, input);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && (key[0] === 'holdings' || key[0] === 'holdings-valued'));
    }
    return result;
  };
}

export function useDeleteHolding(householdId: string | undefined) {
  const { mutate } = useSWRConfig();

  return async (id: string) => {
    await deleteHolding(id);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && (key[0] === 'holdings' || key[0] === 'holdings-valued'));
    }
  };
}
