import type { Insight, MonthlyFlow, BudgetProgress, CategoryTotal, Transaction } from '@/types/app';

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

// 1. 저축률 연속 증가
export function detectSavingStreak(last3Months: MonthlyFlow[]): Insight | null {
  if (last3Months.length < 3) return null;
  const rates = last3Months.map((m) => m.savingRatePct ?? 0);
  if (rates[0]! < rates[1]! && rates[1]! < rates[2]!) {
    return {
      severity: 'good',
      title: '저축률이 3개월 연속 올랐어요',
      description: `${formatPct(rates[0]! / 100)} → ${formatPct(rates[1]! / 100)} → ${formatPct(rates[2]! / 100)}`,
    };
  }
  return null;
}

// 2. 예산 초과 카테고리
export function detectBudgetOverruns(budgets: BudgetProgress[]): Insight | null {
  const over = budgets.filter((b) => b.progress >= 1.0);
  if (!over.length) return null;
  const top = over.sort((a, b) => b.progress - a.progress)[0]!;
  return {
    severity: 'warn',
    title: `${top.categoryName}이 예산을 ${((top.progress - 1) * 100).toFixed(0)}% 초과했어요`,
    description: `${top.categoryName}: 예산 대비 ${(top.progress * 100).toFixed(0)}% 사용`,
  };
}

// 3. 전월 대비 급변 카테고리
export function detectCategorySpike(
  current: CategoryTotal[],
  prev: CategoryTotal[],
): Insight | null {
  const prevMap = new Map(prev.map((c) => [c.categoryId, c.total]));
  let maxChange = 0;
  let maxCategory: CategoryTotal | null = null;
  let direction: 'up' | 'down' = 'up';

  for (const c of current) {
    const prevTotal = prevMap.get(c.categoryId) ?? 0;
    if (prevTotal === 0) continue;
    const change = (c.total - prevTotal) / prevTotal;
    if (Math.abs(change) > Math.abs(maxChange) && Math.abs(change) >= 0.25) {
      maxChange = change;
      maxCategory = c;
      direction = change > 0 ? 'up' : 'down';
    }
  }

  if (!maxCategory) return null;
  return {
    severity: direction === 'up' ? 'warn' : 'good',
    title: `${maxCategory.categoryName} 지출이 전월 대비 ${Math.abs(maxChange * 100).toFixed(0)}% ${direction === 'up' ? '증가' : '감소'}`,
    description: `전월 ${prevMap.get(maxCategory.categoryId)?.toLocaleString()}원 → 이번 달 ${maxCategory.total.toLocaleString()}원`,
  };
}

// 4. 큰 거래 감지
export function detectLargeTransaction(txs: Transaction[]): Insight | null {
  if (txs.length < 5) return null;
  const expenseTxs = txs.filter((t) => t.type === 'expense');
  if (expenseTxs.length === 0) return null;

  const avgAmount = expenseTxs.reduce((sum, t) => sum + t.amount, 0) / expenseTxs.length;
  const large = expenseTxs.find((t) => t.amount >= avgAmount * 3);

  if (!large) return null;
  return {
    severity: 'info',
    title: `큰 지출이 있었어요: ${large.amount.toLocaleString()}원`,
    description: large.memo ?? `${large.transactionDate}`,
  };
}

// 모든 규칙 실행 후 상위 3개 선택
export function generateInsights(
  last3Months: MonthlyFlow[],
  budgets: BudgetProgress[],
  categorySpending: CategoryTotal[],
  prevCategorySpending: CategoryTotal[],
  transactions: Transaction[],
): Insight[] {
  const all: Insight[] = [];

  const saving = detectSavingStreak(last3Months);
  if (saving) all.push(saving);

  const budget = detectBudgetOverruns(budgets);
  if (budget) all.push(budget);

  const spike = detectCategorySpike(categorySpending, prevCategorySpending);
  if (spike) all.push(spike);

  const large = detectLargeTransaction(transactions);
  if (large) all.push(large);

  // warn 먼저, good, info 순
  const order = { warn: 0, good: 1, info: 2 };
  all.sort((a, b) => order[a.severity] - order[b.severity]);

  return all.slice(0, 3);
}
