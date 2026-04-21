import type { Transaction, TransactionType } from '@/types/app';

import { supabase } from '@/lib/supabase';

function toTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    type: row.type as TransactionType,
    amount: Number(row.amount),
    currency: row.currency as string,
    transactionDate: row.transaction_date as string,
    accountId: row.account_id as string,
    toAccountId: (row.to_account_id as string) ?? null,
    categoryId: (row.category_id as string) ?? null,
    memo: (row.memo as string) ?? null,
    tags: (row.tags as string[]) ?? [],
    recurringTemplateId: (row.recurring_template_id as string) ?? null,
    createdBy: row.created_by as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── List ─────────────────────────────────────

export interface ListTransactionsOptions {
  householdId: string;
  from?: string;
  to?: string;
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  tags?: string[];
  search?: string;
  limit?: number;
  cursor?: string;
}

export async function listTransactions(
  options: ListTransactionsOptions,
): Promise<{ data: Transaction[]; nextCursor: string | null }> {
  const limit = options.limit ?? 50;

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('household_id', options.householdId)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (options.from) query = query.gte('transaction_date', options.from);
  if (options.to) query = query.lte('transaction_date', options.to);
  if (options.type) query = query.eq('type', options.type);
  if (options.categoryId) query = query.eq('category_id', options.categoryId);
  if (options.accountId) {
    query = query.or(`account_id.eq.${options.accountId},to_account_id.eq.${options.accountId}`);
  }
  if (options.tags && options.tags.length > 0) {
    query = query.overlaps('tags', options.tags);
  }
  if (options.search) {
    query = query.ilike('memo', `%${options.search}%`);
  }
  if (options.cursor) {
    query = query.lt('created_at', options.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map(toTransaction);
  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  return {
    data: rows,
    nextCursor: hasMore ? rows[rows.length - 1]?.createdAt ?? null : null,
  };
}

// ── Get ──────────────────────────────────────

export async function getTransaction(id: string): Promise<Transaction | null> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toTransaction(data);
}

// ── Create ───────────────────────────────────

export interface CreateTransactionInput {
  householdId: string;
  type: TransactionType;
  amount: number;
  currency?: string;
  transactionDate?: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  memo?: string;
  tags?: string[];
  createdBy: string;
}

export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      household_id: input.householdId,
      type: input.type,
      amount: input.amount,
      currency: input.currency ?? 'KRW',
      transaction_date: input.transactionDate ?? new Date().toISOString().split('T')[0],
      account_id: input.accountId,
      to_account_id: input.toAccountId ?? null,
      category_id: input.categoryId ?? null,
      memo: input.memo ?? null,
      tags: input.tags ?? [],
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return toTransaction(data);
}

// ── Update ───────────────────────────────────

export interface UpdateTransactionInput {
  amount?: number;
  transactionDate?: string;
  accountId?: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  memo?: string | null;
  tags?: string[];
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      ...(input.amount !== undefined && { amount: input.amount }),
      ...(input.transactionDate !== undefined && { transaction_date: input.transactionDate }),
      ...(input.accountId !== undefined && { account_id: input.accountId }),
      ...(input.toAccountId !== undefined && { to_account_id: input.toAccountId }),
      ...(input.categoryId !== undefined && { category_id: input.categoryId }),
      ...(input.memo !== undefined && { memo: input.memo }),
      ...(input.tags !== undefined && { tags: input.tags }),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return toTransaction(data);
}

// ── Delete ───────────────────────────────────

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
