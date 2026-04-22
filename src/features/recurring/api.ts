import type { RecurringTemplate, RecurringFrequency, TransactionType } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toRecurringTemplate(row: Record<string, unknown>): RecurringTemplate {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    currency: row.currency as string,
    accountId: row.account_id as string,
    toAccountId: (row.to_account_id as string) ?? null,
    categoryId: (row.category_id as string) ?? null,
    frequency: row.frequency as RecurringFrequency,
    intervalN: row.interval_n as number,
    dayOfMonth: (row.day_of_month as number) ?? null,
    dayOfWeek: (row.day_of_week as number) ?? null,
    nextRunDate: row.next_run_date as string,
    autoCreate: row.auto_create as boolean,
    isActive: row.is_active as boolean,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function fetchRecurringTemplates(
  householdId: string,
  includeInactive = false,
): Promise<RecurringTemplate[]> {
  let query = supabase
    .from('recurring_templates')
    .select('*')
    .eq('household_id', householdId)
    .order('next_run_date', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toRecurringTemplate);
}

export async function fetchPendingReminders(
  householdId: string,
): Promise<RecurringTemplate[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('recurring_templates')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .eq('auto_create', false)
    .lte('next_run_date', today!);

  if (error) throw error;
  return (data ?? []).map(toRecurringTemplate);
}

export interface CreateRecurringInput {
  householdId: string;
  name: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  frequency: RecurringFrequency;
  intervalN?: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  nextRunDate: string;
  autoCreate?: boolean;
  createdBy?: string;
}

export async function createRecurringTemplate(
  input: CreateRecurringInput,
): Promise<RecurringTemplate> {
  const { data, error } = await supabase
    .from('recurring_templates')
    .insert({
      household_id: input.householdId,
      name: input.name,
      type: input.type,
      amount: input.amount,
      currency: input.currency ?? 'KRW',
      account_id: input.accountId,
      to_account_id: input.toAccountId ?? null,
      category_id: input.categoryId ?? null,
      frequency: input.frequency,
      interval_n: input.intervalN ?? 1,
      day_of_month: input.dayOfMonth ?? null,
      day_of_week: input.dayOfWeek ?? null,
      next_run_date: input.nextRunDate,
      auto_create: input.autoCreate ?? false,
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toRecurringTemplate(data);
}

export interface UpdateRecurringInput {
  name?: string;
  type?: TransactionType;
  amount?: number;
  currency?: string;
  accountId?: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  frequency?: RecurringFrequency;
  intervalN?: number;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  nextRunDate?: string;
  autoCreate?: boolean;
  isActive?: boolean;
}

export async function updateRecurringTemplate(
  id: string,
  input: UpdateRecurringInput,
): Promise<RecurringTemplate> {
  const { data, error } = await supabase
    .from('recurring_templates')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.currency !== undefined && { currency: input.currency }),
      ...(input.accountId !== undefined && { account_id: input.accountId }),
      ...(input.toAccountId !== undefined && { to_account_id: input.toAccountId }),
      ...(input.categoryId !== undefined && { category_id: input.categoryId }),
      ...(input.frequency !== undefined && { frequency: input.frequency }),
      ...(input.intervalN !== undefined && { interval_n: input.intervalN }),
      ...(input.dayOfMonth !== undefined && { day_of_month: input.dayOfMonth }),
      ...(input.dayOfWeek !== undefined && { day_of_week: input.dayOfWeek }),
      ...(input.nextRunDate !== undefined && { next_run_date: input.nextRunDate }),
      ...(input.autoCreate !== undefined && { auto_create: input.autoCreate }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toRecurringTemplate(data);
}

export async function deleteRecurringTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function skipRecurringTemplate(id: string): Promise<void> {
  const { error } = await supabase.rpc('skip_recurring_template', {
    p_template_id: id,
  });
  if (error) throw error;
}
