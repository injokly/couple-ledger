import type { Account, AccountType } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    type: row.type as AccountType,
    institution: (row.institution as string) ?? null,
    currency: row.currency as string,
    icon: (row.icon as string) ?? null,
    color: (row.color as string) ?? null,
    displayOrder: row.display_order as number,
    isArchived: row.is_archived as boolean,
    ownerMemberId: (row.owner_member_id as string) ?? null,
    createdBy: (row.created_by as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function fetchAccounts(
  householdId: string,
  includeArchived = false,
): Promise<Account[]> {
  let query = supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)
    .order('display_order', { ascending: true });

  if (!includeArchived) {
    query = query.eq('is_archived', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toAccount);
}

export interface CreateAccountInput {
  householdId: string;
  name: string;
  type: AccountType;
  institution?: string;
  currency?: string;
  icon?: string;
  color?: string;
  ownerMemberId?: string | null;
  createdBy?: string;
}

export async function createAccount(input: CreateAccountInput): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .insert({
      household_id: input.householdId,
      name: input.name,
      type: input.type,
      institution: input.institution ?? null,
      currency: input.currency ?? 'KRW',
      icon: input.icon ?? null,
      color: input.color ?? null,
      owner_member_id: input.ownerMemberId ?? null,
      created_by: input.createdBy ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toAccount(data);
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  institution?: string | null;
  icon?: string | null;
  color?: string | null;
  ownerMemberId?: string | null;
  isArchived?: boolean;
}

export async function updateAccount(
  id: string,
  input: UpdateAccountInput,
): Promise<Account> {
  const { data, error } = await supabase
    .from('accounts')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.institution !== undefined && { institution: input.institution }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.ownerMemberId !== undefined && { owner_member_id: input.ownerMemberId }),
      ...(input.isArchived !== undefined && { is_archived: input.isArchived }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toAccount(data);
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderAccounts(
  orderedIds: string[],
): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from('accounts').update({ display_order: index }).eq('id', id),
  );
  await Promise.all(updates);
}
