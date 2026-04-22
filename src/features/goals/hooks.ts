import useSWR, { useSWRConfig } from 'swr';

import {
  fetchGoals,
  fetchGoal,
  fetchGoalCurrentAmount,
  createGoal,
  updateGoal,
  deleteGoal,
  type CreateGoalInput,
  type UpdateGoalInput,
} from './api';

import type { Goal } from '@/types/app';

import { cacheKey } from '@/lib/swr';

export function useGoals(householdId: string | undefined) {
  return useSWR<Goal[]>(
    householdId ? cacheKey.goals(householdId) : null,
    () => fetchGoals(householdId!),
  );
}

export function useGoal(id: string | undefined) {
  return useSWR<Goal | null>(
    id ? ['goal', id] : null,
    () => fetchGoal(id!),
  );
}

export function useGoalCurrentAmount(linkedAccountIds: string[] | undefined) {
  return useSWR<number>(
    linkedAccountIds && linkedAccountIds.length > 0
      ? ['goal-amount', ...linkedAccountIds]
      : null,
    () => fetchGoalCurrentAmount(linkedAccountIds!),
  );
}

export function useCreateGoal(householdId: string | undefined) {
  const { mutate } = useSWRConfig();
  return async (input: CreateGoalInput) => {
    const result = await createGoal(input);
    if (householdId) await mutate((key: unknown) => Array.isArray(key) && key[0] === 'goals');
    return result;
  };
}

export function useUpdateGoal(householdId: string | undefined) {
  const { mutate } = useSWRConfig();
  return async (id: string, input: UpdateGoalInput) => {
    const result = await updateGoal(id, input);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && key[0] === 'goals');
      await mutate(['goal', id]);
    }
    return result;
  };
}

export function useDeleteGoal(householdId: string | undefined) {
  const { mutate } = useSWRConfig();
  return async (id: string) => {
    await deleteGoal(id);
    if (householdId) await mutate((key: unknown) => Array.isArray(key) && key[0] === 'goals');
  };
}
