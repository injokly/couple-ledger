import styled from '@emotion/styled';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import type { Account } from '@/types/app';

import { Button } from '@/components/ui/Button';
import { NumericPad } from '@/components/ui/NumericPad';
import { useAccounts } from '@/features/accounts/hooks';
import { upsertSnapshots } from '@/features/snapshots/api';
import { usePreviousSnapshots } from '@/features/snapshots/hooks';
import { lastDayOfMonth, toYYYYMMDD } from '@/lib/date';
import { formatCurrency, formatPercent } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '자산 스냅샷 · 우리 가계' }];
}

export default function SnapshotNewPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;
  const navigate = useNavigate();

  const now = new Date();
  const snapshotDate = toYYYYMMDD(lastDayOfMonth(now.getFullYear(), now.getMonth()));

  const { data: accounts } = useAccounts(householdId);
  const { data: prevSnapshots } = usePreviousSnapshots(householdId, snapshotDate);

  // 계좌별 잔액 상태
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 이전 달 스냅샷으로 초기값 설정
  useEffect(() => {
    if (!prevSnapshots || !accounts) return;
    const initial: Record<string, string> = {};
    for (const account of accounts) {
      const prev = prevSnapshots.find((s) => s.accountId === account.id);
      initial[account.id] = prev ? String(Math.round(prev.balance)) : '0';
    }
    setBalances((current) => {
      // 이미 유저가 편집했으면 덮어쓰지 않음
      const merged = { ...initial };
      for (const [key, val] of Object.entries(current)) {
        if (val !== '') merged[key] = val;
      }
      return merged;
    });
  }, [prevSnapshots, accounts]);

  const activeAccounts = (accounts ?? []).filter((a) => !a.isArchived);

  function getBalance(accountId: string): number {
    return Number(balances[accountId] ?? 0);
  }

  function getPrevBalance(accountId: string): number | null {
    const prev = prevSnapshots?.find((s) => s.accountId === accountId);
    return prev ? prev.balance : null;
  }

  function getChangePercent(accountId: string): number | null {
    const prev = getPrevBalance(accountId);
    if (prev === null || prev === 0) return null;
    return ((getBalance(accountId) - prev) / Math.abs(prev)) * 100;
  }

  const totalNetWorth = activeAccounts.reduce(
    (sum, a) => sum + getBalance(a.id),
    0,
  );

  const prevTotalNetWorth = prevSnapshots
    ? prevSnapshots.reduce((sum, s) => sum + s.balance, 0)
    : null;

  const totalChangePercent =
    prevTotalNetWorth && prevTotalNetWorth !== 0
      ? ((totalNetWorth - prevTotalNetWorth) / Math.abs(prevTotalNetWorth)) * 100
      : null;

  // ── Numpad 핸들러 ─────────────────────────

  const handleDigit = useCallback(
    (digit: string) => {
      if (!editingAccountId) return;
      setBalances((prev) => {
        const current = prev[editingAccountId] ?? '0';
        if (current === '0' && digit !== '00') return { ...prev, [editingAccountId]: digit };
        if (current.replace('-', '').length >= 13) return prev;
        return { ...prev, [editingAccountId]: current + digit };
      });
    },
    [editingAccountId],
  );

  const handleDelete = useCallback(() => {
    if (!editingAccountId) return;
    setBalances((prev) => {
      const current = prev[editingAccountId] ?? '0';
      const newVal = current.slice(0, -1);
      return { ...prev, [editingAccountId]: newVal || '0' };
    });
  }, [editingAccountId]);

  // ── 부호 토글 (대출 계좌) ─────────────────

  function toggleNegative(accountId: string) {
    setBalances((prev) => {
      const current = prev[accountId] ?? '0';
      if (current.startsWith('-')) {
        return { ...prev, [accountId]: current.slice(1) };
      }
      return { ...prev, [accountId]: `-${current}` };
    });
  }

  // ── 저장 ──────────────────────────────────

  async function handleSave() {
    if (!householdId || !member) return;
    setSaving(true);

    try {
      const inputs = activeAccounts.map((account) => ({
        householdId,
        accountId: account.id,
        snapshotDate,
        balance: getBalance(account.id),
        createdBy: member.id,
      }));

      await upsertSnapshots(inputs);
      navigate('/', { replace: true });
    } catch {
      setSaving(false);
    }
  }

  const monthLabel = `${now.getMonth() + 1}월`;

  return (
    <Container>
      <BackLink to="/">← 홈</BackLink>
      <PageTitle>{monthLabel} 자산 스냅샷</PageTitle>
      <HelpText>
        전월 말 기준 값이 채워져 있어요.
        <br />
        변경된 금액만 수정하세요.
      </HelpText>

      {activeAccounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          balance={getBalance(account.id)}
          changePercent={getChangePercent(account.id)}
          isEditing={editingAccountId === account.id}
          onTap={() => setEditingAccountId(account.id)}
          onToggleNegative={() => toggleNegative(account.id)}
        />
      ))}

      <Divider />

      <SummaryRow>
        <SummaryLabel>순자산 합계</SummaryLabel>
        <SummaryAmount>{formatCurrency(totalNetWorth)}</SummaryAmount>
        {totalChangePercent !== null && (
          <ChangeBadge $positive={totalChangePercent >= 0}>
            {formatPercent(totalChangePercent)} 전월대비
          </ChangeBadge>
        )}
      </SummaryRow>

      {editingAccountId && (
        <PadSection>
          <NumericPad onDigit={handleDigit} onDelete={handleDelete} />
        </PadSection>
      )}

      <SaveWrap>
        <Button size="lg" fullWidth onClick={handleSave} disabled={saving}>
          {saving ? '저장 중…' : '저장하기'}
        </Button>
      </SaveWrap>
    </Container>
  );
}

// ── Account Card ──────────────────────────

function AccountCard({
  account,
  balance,
  changePercent,
  isEditing,
  onTap,
  onToggleNegative,
}: {
  account: Account;
  balance: number;
  changePercent: number | null;
  isEditing: boolean;
  onTap: () => void;
  onToggleNegative: () => void;
}) {
  return (
    <CardRow $editing={isEditing} onClick={onTap}>
      <CardIcon>{account.icon ?? '💳'}</CardIcon>
      <CardInfo>
        <CardName>{account.name}</CardName>
        <CardBalance>{formatCurrency(balance)}</CardBalance>
      </CardInfo>
      <CardRight>
        {changePercent !== null && (
          <SmallBadge $positive={changePercent >= 0}>
            {formatPercent(changePercent)}
          </SmallBadge>
        )}
        {account.type === 'loan' && (
          <NegButton type="button" onClick={(e) => { e.stopPropagation(); onToggleNegative(); }}>
            ±
          </NegButton>
        )}
      </CardRight>
    </CardRow>
  );
}

// ── Styles ────────────────────────────────────

const Container = styled.div`
  padding: 24px 14px 180px;
`;

const BackLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 16px;
  display: inline-block;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
  margin-bottom: 8px;
`;

const HelpText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
  line-height: 1.5;
  margin-bottom: 20px;
`;

const CardRow = styled.div<{ $editing: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: 6px;
  border: 2px solid ${({ $editing, theme }) => ($editing ? theme.colors.accent : 'transparent')};
  cursor: pointer;
  transition: border-color 0.15s;
`;

const CardIcon = styled.span`
  font-size: 20px;
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardName = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
`;

const CardBalance = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tight};
`;

const CardRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SmallBadge = styled.span<{ $positive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $positive }) => ($positive ? theme.colors.up : theme.colors.down)};
  background: ${({ theme, $positive }) => ($positive ? theme.colors.upSoft : theme.colors.downSoft)};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
`;

const NegButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.bgChip};
  font-size: 14px;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text2};
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 16px 0;
`;

const SummaryRow = styled.div`
  text-align: center;
  margin-bottom: 20px;
`;

const SummaryLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 4px;
`;

const SummaryAmount = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extrabold};
  font-variant-numeric: tabular-nums;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
`;

const ChangeBadge = styled.span<{ $positive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme, $positive }) => ($positive ? theme.colors.up : theme.colors.down)};
  margin-top: 4px;
  display: inline-block;
`;

const PadSection = styled.div`
  position: fixed;
  bottom: 140px;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.bgElev};
  padding: 8px 16px;
  z-index: 55;
`;

const SaveWrap = styled.div`
  position: fixed;
  bottom: 70px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  z-index: 55;
`;
