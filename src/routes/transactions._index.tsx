import styled from '@emotion/styled';
import { useCallback, useRef, useState } from 'react';

import type { Transaction, TransactionType } from '@/types/app';

import { useCategories } from '@/features/categories/hooks';
import {
  useDeleteTransaction,
  useTransactions,
} from '@/features/transactions/hooks';
import { addMonths, toYYYYMMDD } from '@/lib/date';
import { formatCurrency, formatRelativeDate } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '거래 내역 · 우리 가계' }];
}

type FilterType = TransactionType | 'all';

export default function TransactionsPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;

  const [monthOffset, setMonthOffset] = useState(0);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const viewMonth = addMonths(now, monthOffset);
  const from = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, '0')}-01`;
  const to = toYYYYMMDD(
    new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0),
  );

  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  const { transactions, hasMore, loadMore, mutate: mutateTx } = useTransactions({
    householdId: householdId ?? '',
    from,
    to,
    type: filterType === 'all' ? undefined : filterType,
    search: searchQuery || undefined,
  });

  const { data: categories } = useCategories(householdId);
  const handleDelete = useDeleteTransaction();

  // 날짜별 그룹핑
  const grouped = groupByDate(transactions);

  // 무한 스크롤 감지
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      });
      observerRef.current.observe(node);
    },
    [hasMore, loadMore],
  );

  // 월별 합계
  const monthIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthSavings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? (monthSavings / monthIncome) * 100 : null;

  function getCategoryName(categoryId: string | null): string {
    if (!categoryId) return '';
    return categories?.find((c) => c.id === categoryId)?.name ?? '';
  }

  function getCategoryIcon(categoryId: string | null): string {
    if (!categoryId) return '📦';
    return categories?.find((c) => c.id === categoryId)?.icon ?? '📦';
  }

  async function handleDeleteTx(id: string) {
    await handleDelete(id);
    await mutateTx();
  }

  return (
    <Container>
      {/* 검색 오버레이 */}
      {searchOpen && (
        <SearchOverlay>
          <SearchInput
            type="text"
            placeholder="메모, 카테고리 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <CloseSearch onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
            취소
          </CloseSearch>
        </SearchOverlay>
      )}

      <PageTitle>거래 내역</PageTitle>

      {/* 월 네비게이션 */}
      <MonthNav>
        <NavButton onClick={() => setMonthOffset(monthOffset - 1)}>‹</NavButton>
        <MonthLabel>{monthLabel}</MonthLabel>
        <NavButton
          onClick={() => setMonthOffset(monthOffset + 1)}
          disabled={monthOffset >= 0}
        >
          ›
        </NavButton>
      </MonthNav>

      {/* 월 요약 */}
      <MonthSummary>
        <SummaryItem>
          <SummaryLabel>수입</SummaryLabel>
          <SummaryValue $type="income">{formatCurrency(monthIncome)}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>지출</SummaryLabel>
          <SummaryValue $type="expense">{formatCurrency(monthExpense)}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>저축</SummaryLabel>
          <SummaryValue $type="savings">
            {formatCurrency(monthSavings)}
            {savingsRate !== null && ` · ${savingsRate.toFixed(1)}%`}
          </SummaryValue>
        </SummaryItem>
      </MonthSummary>

      {/* 필터 탭 */}
      <FilterTabs>
        {([['all', '전체'], ['expense', '지출'], ['income', '수입'], ['transfer', '이체']] as const).map(
          ([value, label]) => (
            <FilterTab
              key={value}
              $active={filterType === value}
              onClick={() => setFilterType(value)}
            >
              {label}
            </FilterTab>
          ),
        )}
        <SearchButton onClick={() => setSearchOpen(true)} aria-label="검색">
          🔍
        </SearchButton>
      </FilterTabs>

      {/* 거래 목록 */}
      {grouped.length === 0 && (
        <EmptyState>
          이 기간에 거래가 없습니다
        </EmptyState>
      )}

      {grouped.map(([dateKey, txList]) => (
        <DateGroup key={dateKey}>
          <DateHeader>
            <DateLabel>{formatDateHeader(dateKey)}</DateLabel>
            <DateTotal>
              {txList.filter((t) => t.type === 'expense').length}건 ·{' '}
              {formatCurrency(
                txList.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
              )}
            </DateTotal>
          </DateHeader>

          {txList.map((tx) => (
            <TransactionRow key={tx.id}>
              <TxIcon>{getCategoryIcon(tx.categoryId)}</TxIcon>
              <TxInfo>
                <TxMemo>{tx.memo || getCategoryName(tx.categoryId) || TYPE_LABEL[tx.type]}</TxMemo>
                <TxMeta>
                  {getCategoryName(tx.categoryId)}
                  {tx.type === 'transfer' && ' → 이체'}
                </TxMeta>
              </TxInfo>
              <TxRight>
                <TxAmount $type={tx.type}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}
                  {formatCurrency(tx.amount)}
                </TxAmount>
                <DeleteBtn onClick={() => handleDeleteTx(tx.id)}>삭제</DeleteBtn>
              </TxRight>
            </TransactionRow>
          ))}
        </DateGroup>
      ))}

      {hasMore && <Sentinel ref={sentinelRef} />}
    </Container>
  );
}

const TYPE_LABEL: Record<TransactionType, string> = {
  income: '수입',
  expense: '지출',
  transfer: '이체',
};

// ── 날짜별 그룹핑 ──────────────────────────

function groupByDate(transactions: Transaction[]): [string, Transaction[]][] {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const key = tx.transactionDate;
    const list = map.get(key) ?? [];
    list.push(tx);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const relative = formatRelativeDate(d);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if (relative === '오늘' || relative === '어제') {
    return `${month}월 ${day}일 (${relative})`;
  }
  return `${month}월 ${day}일`;
}

// ── Styles ────────────────────────────────────

const Container = styled.div`
  padding: 24px 14px;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
  margin-bottom: 16px;
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
`;

const NavButton = styled.button`
  width: 32px;
  height: 32px;
  font-size: 20px;
  color: ${({ theme }) => theme.colors.text2};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.bgElev};
  }

  &:disabled {
    color: ${({ theme }) => theme.colors.text4};
  }
`;

const MonthLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const MonthSummary = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const SummaryItem = styled.div`
  flex: 1;
`;

const SummaryLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 2px;
`;

const SummaryValue = styled.span<{ $type: 'income' | 'expense' | 'savings' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $type }) => {
    if ($type === 'income') return theme.colors.up;
    if ($type === 'expense') return theme.colors.down;
    return theme.colors.text;
  }};
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  align-items: center;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.bgElev)};
  color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.text3)};
  transition: all 0.15s;
`;

const SearchButton = styled.button`
  margin-left: auto;
  font-size: 16px;
  padding: 6px;
`;

const SearchOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.bg};
  padding: 16px;
  z-index: 60;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  height: 40px;
  padding: 0 14px;
  background: ${({ theme }) => theme.colors.bgElev};
  border: none;
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text4};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
`;

const CloseSearch = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
`;

const DateGroup = styled.div`
  margin-bottom: 8px;
`;

const DateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
`;

const DateLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text2};
`;

const DateTotal = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text4};
  font-variant-numeric: tabular-nums;
`;

const TransactionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: 4px;
`;

const TxIcon = styled.span`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const TxInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TxMemo = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TxMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
`;

const TxRight = styled.div`
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const TxAmount = styled.span<{ $type: TransactionType }>`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $type }) => {
    if ($type === 'income') return theme.colors.up;
    if ($type === 'expense') return theme.colors.down;
    return theme.colors.text;
  }};
`;

const DeleteBtn = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text4};
  padding: 2px 6px;
  border-radius: 4px;
  transition: color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const Sentinel = styled.div`
  height: 1px;
`;
