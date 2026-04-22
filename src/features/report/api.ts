import { generateInsights } from './insights';

import type {
  ReportData,
  MonthlyFlow,
  CategoryTotal,
  BudgetProgress,
  BudgetStatus,
} from '@/types/app';

import { supabase } from '@/lib/supabase';

export async function fetchReport(
  householdId: string,
  month: string,
): Promise<ReportData> {
  // 1. 캐시 확인
  const firstDay = month + '-01';
  const { data: cached } = await supabase
    .from('report_snapshots')
    .select('data')
    .eq('household_id', householdId)
    .eq('report_month', firstDay)
    .single();

  if (cached?.data) {
    return cached.data as unknown as ReportData;
  }

  // 2. 실시간 계산
  return computeReport(householdId, month);
}

async function computeReport(
  householdId: string,
  month: string,
): Promise<ReportData> {
  const prevMonth = getPrevMonth(month);
  const startDate = month + '-01';
  const endDate = getLastDayOfMonth(month);
  const prevStartDate = prevMonth + '-01';
  const prevEndDate = getLastDayOfMonth(prevMonth);

  // 병렬 데이터 조회
  const [
    cashflowRes,
    prevCashflowRes,
    categoryRes,
    prevCategoryRes,
    budgetRes,
    netWorthRes,
    prevNetWorthRes,
    txRes,
    monthlyFlowRes,
  ] = await Promise.all([
    supabase
      .from('v_monthly_cashflow')
      .select('*')
      .eq('household_id', householdId)
      .eq('month', startDate)
      .single(),
    supabase
      .from('v_monthly_cashflow')
      .select('*')
      .eq('household_id', householdId)
      .eq('month', prevStartDate)
      .single(),
    supabase
      .from('v_category_spending_monthly')
      .select('*')
      .eq('household_id', householdId)
      .eq('month', startDate),
    supabase
      .from('v_category_spending_monthly')
      .select('*')
      .eq('household_id', householdId)
      .eq('month', prevStartDate),
    supabase
      .from('v_budget_progress')
      .select('*')
      .eq('household_id', householdId),
    supabase
      .from('v_household_networth_by_date')
      .select('*')
      .eq('household_id', householdId)
      .gte('snapshot_date', startDate)
      .lte('snapshot_date', endDate)
      .order('snapshot_date', { ascending: false })
      .limit(1),
    supabase
      .from('v_household_networth_by_date')
      .select('*')
      .eq('household_id', householdId)
      .gte('snapshot_date', prevStartDate)
      .lte('snapshot_date', prevEndDate)
      .order('snapshot_date', { ascending: false })
      .limit(1),
    supabase
      .from('transactions')
      .select('*')
      .eq('household_id', householdId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('amount', { ascending: false })
      .limit(100),
    supabase
      .from('v_monthly_cashflow')
      .select('*')
      .eq('household_id', householdId)
      .order('month', { ascending: false })
      .limit(3),
  ]);

  const cf = cashflowRes.data;
  const prevCf = prevCashflowRes.data;
  const income = Number(cf?.income ?? 0);
  const expense = Number(cf?.expense ?? 0);
  const netFlow = income - expense;
  const savingRate = income > 0 ? netFlow / income : 0;

  const categorySpending: CategoryTotal[] = (categoryRes.data ?? []).map((r) => ({
    categoryId: r.category_id as string,
    categoryName: r.category_name as string,
    icon: r.category_icon as string | null,
    total: Number(r.total),
  }));

  const prevCategorySpending: CategoryTotal[] = (prevCategoryRes.data ?? []).map((r) => ({
    categoryId: r.category_id as string,
    categoryName: r.category_name as string,
    icon: r.category_icon as string | null,
    total: Number(r.total),
  }));

  const budgetProgress: BudgetProgress[] = (budgetRes.data ?? []).map((r) => ({
    budgetId: r.budget_id as string,
    householdId: r.household_id as string,
    categoryId: r.category_id as string,
    categoryName: r.category_name as string,
    icon: r.icon as string | null,
    color: r.color as string | null,
    budgetAmount: Number(r.budget_amount),
    currency: r.currency as string,
    spent: Number(r.spent),
    progress: Number(r.progress),
    status: r.status as BudgetStatus,
  }));

  const netWorth = netWorthRes.data?.[0]
    ? Number(netWorthRes.data[0].net_worth_krw)
    : null;
  const prevNetWorth = prevNetWorthRes.data?.[0]
    ? Number(prevNetWorthRes.data[0].net_worth_krw)
    : null;

  const last3Months: MonthlyFlow[] = (monthlyFlowRes.data ?? []).map((r) => {
    const inc = Number(r.income);
    const exp = Number(r.expense);
    const nf = inc - exp;
    return {
      month: r.month as string,
      income: inc,
      expense: exp,
      netFlow: nf,
      savingRatePct: inc > 0 ? (nf / inc) * 100 : null,
    };
  });

  const transactions = (txRes.data ?? []).map((r) => ({
    id: r.id as string,
    householdId: r.household_id as string,
    type: r.type as 'income' | 'expense' | 'transfer',
    amount: Number(r.amount),
    currency: r.currency as string,
    transactionDate: r.transaction_date as string,
    accountId: r.account_id as string,
    toAccountId: (r.to_account_id as string) ?? null,
    categoryId: (r.category_id as string) ?? null,
    memo: (r.memo as string) ?? null,
    tags: (r.tags as string[]) ?? [],
    recurringTemplateId: (r.recurring_template_id as string) ?? null,
    createdBy: r.created_by as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  const insights = generateInsights(
    last3Months,
    budgetProgress,
    categorySpending,
    prevCategorySpending,
    transactions,
  );

  return {
    month,
    income,
    expense,
    netFlow,
    savingRate,
    prevIncome: Number(prevCf?.income ?? 0),
    prevExpense: Number(prevCf?.expense ?? 0),
    prevNetFlow: Number(prevCf?.income ?? 0) - Number(prevCf?.expense ?? 0),
    categorySpending,
    prevCategorySpending,
    budgetProgress,
    insights,
    netWorth,
    prevNetWorth,
  };
}

function getPrevMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number) as [number, number];
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function getLastDayOfMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number) as [number, number];
  const last = new Date(y, m, 0).getDate();
  return `${yyyymm}-${String(last).padStart(2, '0')}`;
}
