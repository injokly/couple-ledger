import type { Category } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    type: row.type as 'income' | 'expense',
    icon: (row.icon as string) ?? null,
    color: (row.color as string) ?? null,
    parentId: (row.parent_id as string) ?? null,
    displayOrder: row.display_order as number,
    isDefault: row.is_default as boolean,
    isArchived: row.is_archived as boolean,
    createdAt: row.created_at as string,
  };
}

export async function fetchCategories(
  householdId: string,
  type?: 'income' | 'expense',
  includeArchived = false,
): Promise<Category[]> {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('display_order', { ascending: true });

  if (type) query = query.eq('type', type);
  if (!includeArchived) query = query.eq('is_archived', false);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toCategory);
}

export interface CreateCategoryInput {
  householdId: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      household_id: input.householdId,
      name: input.name,
      type: input.type,
      icon: input.icon ?? null,
      color: input.color ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return toCategory(data);
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string | null;
  color?: string | null;
  isArchived?: boolean;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.icon !== undefined && { icon: input.icon }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.isArchived !== undefined && { is_archived: input.isArchived }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toCategory(data);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function checkCategoryTransactionCount(categoryId: string): Promise<number> {
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) throw error;
  return count ?? 0;
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from('categories').update({ display_order: index }).eq('id', id),
  );
  await Promise.all(updates);
}
