import { useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import useSWRInfinite from 'swr/infinite';

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from './api';

import type {
  CreateTransactionInput,
  ListTransactionsOptions,
  UpdateTransactionInput,
} from './api';
import type { Transaction } from '@/types/app';

// ── 단건 조회 ─────────────────────────────────

export function useTransaction(id: string | undefined) {
  return useSWR<Transaction | null>(
    id ? ['transaction', id] : null,
    () => getTransaction(id!),
  );
}

// ── 목록 (infinite scroll) ───────────────────

export function useTransactions(options: Omit<ListTransactionsOptions, 'cursor'>) {
  const getKey = (
    pageIndex: number,
    previousPageData: { data: Transaction[]; nextCursor: string | null } | null,
  ) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    return [
      'transactions',
      options.householdId,
      options.from,
      options.to,
      options.type,
      options.categoryId,
      options.accountId,
      options.search,
      pageIndex,
      previousPageData?.nextCursor,
    ];
  };

  const result = useSWRInfinite(getKey, ([, , , , , , , , , cursor]) =>
    listTransactions({
      ...options,
      cursor: (cursor as string) ?? undefined,
    }),
  );

  const transactions = result.data?.flatMap((page) => page.data) ?? [];
  const hasMore = result.data?.[result.data.length - 1]?.nextCursor != null;

  return {
    ...result,
    transactions,
    hasMore,
    loadMore: () => {
      if (hasMore) result.setSize(result.size + 1);
    },
  };
}

// ── 생성 (옵티미스틱) ────────────────────────

export function useCreateTransaction() {
  return useCallback(async (input: CreateTransactionInput) => {
    const optimistic: Transaction = {
      id: `temp-${Date.now()}`,
      householdId: input.householdId,
      type: input.type,
      amount: input.amount,
      currency: input.currency ?? 'KRW',
      transactionDate: input.transactionDate ?? new Date().toISOString().split('T')[0]!,
      accountId: input.accountId,
      toAccountId: input.toAccountId ?? null,
      categoryId: input.categoryId ?? null,
      memo: input.memo ?? null,
      tags: input.tags ?? [],
      recurringTemplateId: null,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 옵티미스틱 업데이트: 목록에 즉시 추가
    await mutate(
      (key) => Array.isArray(key) && key[0] === 'transactions',
      (current: { data: Transaction[]; nextCursor: string | null }[] | undefined) => {
        if (!current?.[0]) return current;
        return [
          { ...current[0], data: [optimistic, ...current[0].data] },
          ...current.slice(1),
        ];
      },
      { revalidate: false },
    );

    try {
      const real = await createTransaction(input);
      // 실제 데이터로 대체
      await mutate((key) => Array.isArray(key) && key[0] === 'transactions');
      return real;
    } catch (err) {
      // 롤백
      await mutate((key) => Array.isArray(key) && key[0] === 'transactions');
      throw err;
    }
  }, []);
}

// ── 수정 ────────────────────────────────────

export function useUpdateTransaction() {
  return useCallback(async (id: string, input: UpdateTransactionInput) => {
    const result = await updateTransaction(id, input);
    await mutate((key) => Array.isArray(key) && key[0] === 'transactions');
    await mutate(['transaction', id]);
    return result;
  }, []);
}

// ── 삭제 (옵티미스틱) ────────────────────────

export function useDeleteTransaction() {
  return useCallback(async (id: string) => {
    // 옵티미스틱: 즉시 제거
    await mutate(
      (key) => Array.isArray(key) && key[0] === 'transactions',
      (current: { data: Transaction[]; nextCursor: string | null }[] | undefined) => {
        if (!current) return current;
        return current.map((page) => ({
          ...page,
          data: page.data.filter((tx) => tx.id !== id),
        }));
      },
      { revalidate: false },
    );

    try {
      await deleteTransaction(id);
      await mutate((key) => Array.isArray(key) && key[0] === 'transactions');
    } catch (err) {
      await mutate((key) => Array.isArray(key) && key[0] === 'transactions');
      throw err;
    }
  }, []);
}
