import type { Goal, SimulationType } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    emoji: (row.emoji as string) ?? null,
    targetAmount: Number(row.target_amount),
    targetDate: (row.target_date as string) ?? null,
    linkedAccountIds: (row.linked_account_ids as string[]) ?? [],
    priority: row.priority as number,
    status: row.status as 'active' | 'achieved' | 'paused',
    monthlyContribution: row.monthly_contribution != null ? Number(row.monthly_contribution) : null,
    expectedReturnPct: row.expected_return_pct != null ? Number(row.expected_return_pct) : null,
    simulationType: (row.simulation_type as SimulationType) ?? 'simple',
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function fetchGoals(householdId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('household_id', householdId)
    .order('priority', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toGoal);
}

export async function fetchGoal(id: string): Promise<Goal | null> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toGoal(data);
}

export interface CreateGoalInput {
  householdId: string;
  name: string;
  emoji?: string;
  targetAmount: number;
  targetDate?: string;
  linkedAccountIds?: string[];
  monthlyContribution?: number;
  expectedReturnPct?: number;
  createdBy?: string;
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({
      household_id: input.householdId,
      name: input.name,
      emoji: input.emoji ?? null,
      target_amount: input.targetAmount,
      target_date: input.targetDate ?? null,
      linked_account_ids: input.linkedAccountIds ?? [],
      monthly_contribution: input.monthlyContribution ?? null,
      expected_return_pct: input.expectedReturnPct ?? 3.0,
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toGoal(data);
}

export interface UpdateGoalInput {
  name?: string;
  emoji?: string | null;
  targetAmount?: number;
  targetDate?: string | null;
  linkedAccountIds?: string[];
  status?: 'active' | 'achieved' | 'paused';
  monthlyContribution?: number | null;
  expectedReturnPct?: number | null;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.emoji !== undefined && { emoji: input.emoji }),
      ...(input.targetAmount !== undefined && { target_amount: input.targetAmount }),
      ...(input.targetDate !== undefined && { target_date: input.targetDate }),
      ...(input.linkedAccountIds !== undefined && { linked_account_ids: input.linkedAccountIds }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.monthlyContribution !== undefined && { monthly_contribution: input.monthlyContribution }),
      ...(input.expectedReturnPct !== undefined && { expected_return_pct: input.expectedReturnPct }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toGoal(data);
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchGoalCurrentAmount(
  linkedAccountIds: string[],
): Promise<number> {
  if (linkedAccountIds.length === 0) return 0;

  const { data, error } = await supabase
    .from('v_account_with_latest_snapshot')
    .select('latest_balance, latest_exchange_rate')
    .in('id', linkedAccountIds);

  if (error) throw error;
  return (data ?? []).reduce(
    (sum, r) => sum + (Number(r.latest_balance ?? 0) * Number(r.latest_exchange_rate ?? 1)),
    0,
  );
}
