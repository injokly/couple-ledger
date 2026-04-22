import type { Budget, BudgetPeriod, BudgetProgress, BudgetStatus } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toBudget(row: Record<string, unknown>): Budget {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    categoryId: row.category_id as string,
    amount: Number(row.amount),
    period: row.period as BudgetPeriod,
    currency: row.currency as string,
    startDate: row.start_date as string,
    isActive: row.is_active as boolean,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function toBudgetProgress(row: Record<string, unknown>): BudgetProgress {
  return {
    budgetId: row.budget_id as string,
    householdId: row.household_id as string,
    categoryId: row.category_id as string,
    categoryName: row.category_name as string,
    icon: (row.icon as string) ?? null,
    color: (row.color as string) ?? null,
    budgetAmount: Number(row.budget_amount),
    currency: row.currency as string,
    spent: Number(row.spent),
    progress: Number(row.progress),
    status: row.status as BudgetStatus,
  };
}

export async function fetchBudgets(
  householdId: string,
  includeInactive = false,
): Promise<Budget[]> {
  let query = supabase
    .from('budgets')
    .select('*')
    .eq('household_id', householdId);

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toBudget);
}

export async function fetchBudgetProgress(
  householdId: string,
): Promise<BudgetProgress[]> {
  const { data, error } = await supabase
    .from('v_budget_progress')
    .select('*')
    .eq('household_id', householdId)
    .order('progress', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toBudgetProgress);
}

export interface CreateBudgetInput {
  householdId: string;
  categoryId: string;
  amount: number;
  period?: BudgetPeriod;
  currency?: string;
  createdBy?: string;
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      household_id: input.householdId,
      category_id: input.categoryId,
      amount: input.amount,
      period: input.period ?? 'monthly',
      currency: input.currency ?? 'KRW',
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toBudget(data);
}

export interface UpdateBudgetInput {
  amount?: number;
  isActive?: boolean;
}

export async function updateBudget(
  id: string,
  input: UpdateBudgetInput,
): Promise<Budget> {
  const { data, error } = await supabase
    .from('budgets')
    .update({
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.isActive !== undefined && { is_active: input.isActive }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toBudget(data);
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}
