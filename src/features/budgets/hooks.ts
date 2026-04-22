import useSWR, { useSWRConfig } from 'swr';

import {
  fetchBudgets,
  fetchBudgetProgress,
  createBudget,
  updateBudget,
  deleteBudget,
  type CreateBudgetInput,
  type UpdateBudgetInput,
} from './api';

import type { Budget, BudgetProgress } from '@/types/app';

import { cacheKey } from '@/lib/swr';

export function useBudgets(householdId: string | undefined) {
  return useSWR<Budget[]>(
    householdId ? cacheKey.budgets(householdId) : null,
    () => fetchBudgets(householdId!),
  );
}

export function useBudgetProgress(householdId: string | undefined) {
  return useSWR<BudgetProgress[]>(
    householdId ? cacheKey.budgetProgress(householdId) : null,
    () => fetchBudgetProgress(householdId!),
  );
}

function useBudgetMutator(householdId: string | undefined) {
  const { mutate } = useSWRConfig();
  return () => {
    if (!householdId) return;
    mutate((key: unknown) => Array.isArray(key) && (key[0] === 'budgets' || key[0] === 'budget-progress'));
  };
}

export function useCreateBudget(householdId: string | undefined) {
  const revalidate = useBudgetMutator(householdId);

  return async (input: CreateBudgetInput) => {
    const result = await createBudget(input);
    revalidate();
    return result;
  };
}

export function useUpdateBudget(householdId: string | undefined) {
  const revalidate = useBudgetMutator(householdId);

  return async (id: string, input: UpdateBudgetInput) => {
    const result = await updateBudget(id, input);
    revalidate();
    return result;
  };
}

export function useDeleteBudget(householdId: string | undefined) {
  const revalidate = useBudgetMutator(householdId);

  return async (id: string) => {
    await deleteBudget(id);
    revalidate();
  };
}
