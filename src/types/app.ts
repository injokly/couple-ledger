/**
 * 애플리케이션 도메인 타입.
 * DB 생성 타입(database.ts)에서 파생하거나 독립적으로 정의.
 */

export type AccountType =
  | 'cash'
  | 'savings'
  | 'investment'
  | 'real_estate'
  | 'pension'
  | 'loan'
  | 'other';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AssetClass =
  | 'stock'
  | 'etf'
  | 'bond'
  | 'crypto'
  | 'fund'
  | 'cash'
  | 'other';

export type MemberRole = 'owner' | 'member';

export interface Household {
  id: string;
  name: string;
  baseCurrency: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  displayName: string;
  role: MemberRole;
  color: string | null;
  joinedAt: string;
}

export interface Account {
  id: string;
  householdId: string;
  name: string;
  type: AccountType;
  institution: string | null;
  currency: string;
  icon: string | null;
  color: string | null;
  displayOrder: number;
  isArchived: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  householdId: string;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  parentId: string | null;
  displayOrder: number;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  householdId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  transactionDate: string;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  memo: string | null;
  tags: string[];
  recurringTemplateId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetSnapshot {
  id: string;
  householdId: string;
  accountId: string;
  snapshotDate: string;
  balance: number;
  currency: string;
  exchangeRate: number;
  memo: string | null;
  source: 'manual' | 'auto';
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  id: string;
  householdId: string;
  accountId: string;
  symbol: string;
  market: string | null;
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCost: number | null;
  currency: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  householdId: string;
  name: string;
  emoji: string | null;
  targetAmount: number;
  targetDate: string | null;
  linkedAccountIds: string[];
  priority: number;
  status: 'active' | 'achieved' | 'paused';
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── 뷰/파생 타입 ────────────────────────────────────

export interface NetWorthPoint {
  snapshotDate: string;
  netWorthKrw: number;
}

export interface MonthlyFlow {
  month: string;
  income: number;
  expense: number;
  netFlow: number;
  savingRatePct: number | null;
}
