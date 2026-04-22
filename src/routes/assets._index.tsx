import styled from '@emotion/styled';
import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import { useAccounts } from '@/features/accounts/hooks';
import { useHouseholdMembers } from '@/features/auth/hooks';
import { useNetWorthSeries } from '@/features/snapshots/hooks';
import { formatCurrency, formatPercent } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '자산 · 우리 가계' }];
}

export default function AssetsPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;
  const { data: accounts } = useAccounts(householdId);
  const { data: members } = useHouseholdMembers(householdId);
  const { data: netWorthSeries } = useNetWorthSeries(householdId, '6M');

  const latest = netWorthSeries?.[netWorthSeries.length - 1];
  const prev = netWorthSeries?.[netWorthSeries.length - 2];
  const changePercent =
    latest && prev && prev.netWorthKrw !== 0
      ? ((latest.netWorthKrw - prev.netWorthKrw) / Math.abs(prev.netWorthKrw)) * 100
      : null;

  return (
    <Container>
      <PageTitle>자산</PageTitle>

      {/* 순자산 요약 */}
      <NetWorthCard>
        <NetWorthLabel>총 순자산</NetWorthLabel>
        <NetWorthAmount>
          {latest ? formatCurrency(latest.netWorthKrw) : '—'}
        </NetWorthAmount>
        {changePercent !== null && (
          <ChangeBadge $positive={changePercent >= 0}>
            {formatPercent(changePercent)} 전월대비
          </ChangeBadge>
        )}
      </NetWorthCard>

      {/* 스냅샷 기록 버튼 */}
      <Link to="/assets/snapshot/new">
        <Button size="lg" fullWidth>
          📸 이번 달 자산 스냅샷 기록하기
        </Button>
      </Link>

      {/* 계좌 목록 */}
      {accounts && accounts.length > 0 && (
        <Section>
          <SectionTitle>계좌 ({accounts.length})</SectionTitle>
          {accounts.map((account) => {
            const ownerName = account.ownerMemberId
              ? members?.find((m) => m.id === account.ownerMemberId)?.displayName ?? ''
              : '공동';
            const ownerColor = account.ownerMemberId
              ? members?.find((m) => m.id === account.ownerMemberId)?.color ?? '#3182F6'
              : '#5C5F66';
            return (
              <AccountRow key={account.id}>
                <AccountIcon $color={account.color ?? '#3182F6'}>
                  {account.icon ?? '💳'}
                </AccountIcon>
                <AccountInfo>
                  <AccountNameRow>
                    <AccountName>{account.name}</AccountName>
                    <OwnerTag $color={ownerColor}>{ownerName}</OwnerTag>
                  </AccountNameRow>
                  <AccountMeta>{account.institution ?? account.type}</AccountMeta>
                </AccountInfo>
              </AccountRow>
            );
          })}
        </Section>
      )}

      {/* 계좌 없을 때 */}
      {accounts && accounts.length === 0 && (
        <EmptyState>
          계좌가 없습니다.
          <br />
          <SettingsLink to="/settings/accounts">설정에서 계좌를 추가하세요 →</SettingsLink>
        </EmptyState>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 24px 14px;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
  margin-bottom: 20px;
`;

const NetWorthCard = styled.div`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  padding: 20px 22px;
  margin-bottom: 16px;
`;

const NetWorthLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 4px;
`;

const NetWorthAmount = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extrabold};
  font-variant-numeric: tabular-nums;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
  margin-bottom: 6px;
`;

const ChangeBadge = styled.span<{ $positive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme, $positive }) => ($positive ? theme.colors.up : theme.colors.down)};
`;

const Section = styled.div`
  margin-top: 24px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text2};
  margin-bottom: 10px;
`;

const AccountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: 6px;
`;

const AccountIcon = styled.span<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $color }) => $color}22;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const AccountInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AccountNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const OwnerTag = styled.span<{ $color: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}1A;
  padding: 1px 6px;
  border-radius: ${({ theme }) => theme.radius.sm};
  flex-shrink: 0;
`;

const AccountName = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const AccountMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
  line-height: 1.6;
`;

const SettingsLink = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;
