import useSWR, { useSWRConfig } from 'swr';

import {
  fetchRecurringTemplates,
  fetchPendingReminders,
  createRecurringTemplate,
  updateRecurringTemplate,
  deleteRecurringTemplate,
  skipRecurringTemplate,
  type CreateRecurringInput,
  type UpdateRecurringInput,
} from './api';

import type { RecurringTemplate } from '@/types/app';

import { cacheKey } from '@/lib/swr';

export function useRecurringTemplates(
  householdId: string | undefined,
  includeInactive = false,
) {
  return useSWR<RecurringTemplate[]>(
    householdId ? [...cacheKey.recurring(householdId), includeInactive] : null,
    () => fetchRecurringTemplates(householdId!, includeInactive),
  );
}

export function usePendingReminders(householdId: string | undefined) {
  return useSWR<RecurringTemplate[]>(
    householdId ? cacheKey.pendingReminders(householdId) : null,
    () => fetchPendingReminders(householdId!),
  );
}

export function useCreateRecurring(householdId: string | undefined) {
  const { mutate } = useSWRConfig();

  return async (input: CreateRecurringInput) => {
    const result = await createRecurringTemplate(input);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && key[0] === 'recurring');
    }
    return result;
  };
}

export function useUpdateRecurring(householdId: string | undefined) {
  const { mutate } = useSWRConfig();

  return async (id: string, input: UpdateRecurringInput) => {
    const result = await updateRecurringTemplate(id, input);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && key[0] === 'recurring');
      await mutate((key: unknown) => Array.isArray(key) && key[0] === 'recurring-reminders');
    }
    return result;
  };
}

export function useDeleteRecurring(householdId: string | undefined) {
  const { mutate } = useSWRConfig();

  return async (id: string) => {
    await deleteRecurringTemplate(id);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && key[0] === 'recurring');
    }
  };
}

export function useSkipRecurring(householdId: string | undefined) {
  const { mutate } = useSWRConfig();

  return async (id: string) => {
    await skipRecurringTemplate(id);
    if (householdId) {
      await mutate((key: unknown) => Array.isArray(key) && key[0] === 'recurring');
      await mutate((key: unknown) => Array.isArray(key) && key[0] === 'recurring-reminders');
    }
  };
}
