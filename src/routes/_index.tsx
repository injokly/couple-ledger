import styled from '@emotion/styled';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import type { NetWorthPoint } from '@/types/app';

import { Card, CardHead, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { useAssetBreakdown, useMonthlyFlow } from '@/features/networth/hooks';
import { useNetWorthSeries, useSnapshotReminder } from '@/features/snapshots/hooks';
import { formatCompact, formatCurrency, formatPercent } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [
    { title: '우리 가계' },
    { name: 'description', content: '부부 공유 자산관리' },
  ];
}

export default function HomePage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;

  const [range, setRange] = useState<'1M' | '6M' | '1Y' | 'ALL'>('6M');
  const { data: netWorthSeries } = useNetWorthSeries(householdId, range);
  const { data: monthlyFlow } = useMonthlyFlow(householdId);
  const { data: showReminder } = useSnapshotReminder(householdId);
  const { data: assetBreakdown } = useAssetBreakdown(householdId);

  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 · ${days[now.getDay()]}요일`;

  // 순자산 현재/전월
  const latestPoint = netWorthSeries?.[netWorthSeries.length - 1];
  const prevPoint = netWorthSeries?.[netWorthSeries.length - 2];
  const netWorthChange =
    latestPoint && prevPoint
      ? ((latestPoint.netWorthKrw - prevPoint.netWorthKrw) / Math.abs(prevPoint.netWorthKrw)) * 100
      : null;
  const netWorthDiff = latestPoint && prevPoint ? latestPoint.netWorthKrw - prevPoint.netWorthKrw : null;

  // 저축률 바 색상
  const savingsRate = monthlyFlow?.savingRatePct ?? 0;
  const savingsTarget = 50;

  return (
    <Container>
      {/* 헤더 */}
      <Header>
        <Greeting>안녕하세요, {member?.displayName ?? ''}님</Greeting>
        <DateText>{dateStr}</DateText>
      </Header>

      {/* 순자산 카드 */}
      <Card>
        <CardHead>
          <CardTitle>총 순자산</CardTitle>
        </CardHead>
        <BigNumber>
          {latestPoint ? formatCurrency(latestPoint.netWorthKrw) : '—'}
        </BigNumber>
        {netWorthChange !== null && netWorthDiff !== null && (
          <ChangeRow>
            <ChangeBadge $positive={netWorthChange >= 0}>
              {formatPercent(netWorthChange)}
            </ChangeBadge>
            <ChangeDetail>
              {netWorthDiff >= 0 ? '+' : ''}{formatCurrency(netWorthDiff)} · 전월 대비
            </ChangeDetail>
          </ChangeRow>
        )}

        {/* 차트 */}
        {netWorthSeries && netWorthSeries.length > 1 && (
          <ChartWrap>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={chartData(netWorthSeries)}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#5C5F66', fontSize: 11 }}
                />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    background: '#18191C',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#8B8E95' }}
                  formatter={(value: number) => [formatCompact(value), '순자산']}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#EB4D3D' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrap>
        )}

        {/* 기간 탭 */}
        <PeriodTabs>
          {(['1M', '6M', '1Y', 'ALL'] as const).map((r) => (
            <PeriodTab key={r} $active={range === r} onClick={() => setRange(r)}>
              {r}
            </PeriodTab>
          ))}
        </PeriodTabs>
      </Card>

      {/* 이번 달 흐름 */}
      <Card>
        <CardHead>
          <CardTitle>이번 달 흐름</CardTitle>
          <CardSubtitle>{now.getMonth() + 1}월 · {now.getDate()}일 기준</CardSubtitle>
        </CardHead>

        <FlowRow>
          <FlowLabel>수입</FlowLabel>
          <FlowAmount $type="income">
            +{formatCurrency(monthlyFlow?.income ?? 0)}
          </FlowAmount>
        </FlowRow>
        <FlowRow>
          <FlowLabel>지출</FlowLabel>
          <FlowAmount $type="expense">
            −{formatCurrency(monthlyFlow?.expense ?? 0)}
          </FlowAmount>
        </FlowRow>
        <FlowRow>
          <FlowLabel>저축</FlowLabel>
          <FlowAmount $type="savings">
            {formatCurrency(monthlyFlow?.netFlow ?? 0)}
          </FlowAmount>
        </FlowRow>

        {/* 저축률 바 */}
        <SavingsBar>
          <SavingsBarFill
            $width={Math.min(Math.max(savingsRate, 0), 100)}
            $good={savingsRate >= savingsTarget}
          />
        </SavingsBar>
        <SavingsInfo>
          <span>저축률 {monthlyFlow?.savingRatePct !== null ? `${savingsRate.toFixed(1)}%` : '—'}</span>
          <span>목표 {savingsTarget}.0%</span>
        </SavingsInfo>
      </Card>

      {/* 스냅샷 리마인더 */}
      {showReminder && (
        <ReminderCard to="/assets/snapshot/new">
          <ReminderIcon>📸</ReminderIcon>
          <ReminderText>
            <strong>{now.getMonth() + 1}월 자산 스냅샷을 남겨주세요</strong>
            <br />
            매월 말 잔액을 기록하면 추이가 정확해져요
          </ReminderText>
        </ReminderCard>
      )}

      {/* 자산 구성 */}
      {assetBreakdown && assetBreakdown.length > 0 && (
        <Card>
          <CardHead>
            <CardTitle>자산 구성</CardTitle>
            <CardSubtitle>{assetBreakdown.length}개 카테고리</CardSubtitle>
          </CardHead>

          {assetBreakdown.map((item) => (
            <AssetRow key={item.group}>
              <AssetIcon $bg={item.color}>{item.emoji}</AssetIcon>
              <AssetInfo>
                <AssetLabel>{item.label}</AssetLabel>
                <AssetAmount>{formatCurrency(item.total)}</AssetAmount>
              </AssetInfo>
              <AssetPercent>{item.percent.toFixed(1)}%</AssetPercent>
            </AssetRow>
          ))}

          <ViewAllLink to="/assets">자산 전체보기 →</ViewAllLink>
        </Card>
      )}
    </Container>
  );
}

// ── 차트 데이터 변환 ──────────────────────

function chartData(series: NetWorthPoint[]) {
  return series.map((p) => {
    const d = new Date(p.snapshotDate);
    return {
      label: `${d.getMonth() + 1}월`,
      value: p.netWorthKrw,
    };
  });
}

// ── Styles ────────────────────────────────────

const Container = styled.div`
  padding: 16px 0 24px;
`;

const Header = styled.header`
  padding: 24px 20px 16px;
`;

const Greeting = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 4px;
`;

const DateText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
`;

const BigNumber = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extrabold};
  font-variant-numeric: tabular-nums;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tightest};
  margin-bottom: 8px;
`;

const ChangeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const ChangeBadge = styled.span<{ $positive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $positive }) => ($positive ? theme.colors.up : theme.colors.down)};
  background: ${({ theme, $positive }) => ($positive ? theme.colors.upSoft : theme.colors.downSoft)};
  padding: 3px 9px;
  border-radius: ${({ theme }) => theme.radius.pill};
`;

const ChangeDetail = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
`;

const ChartWrap = styled.div`
  margin: 8px -8px 4px;
`;

const PeriodTabs = styled.div`
  display: flex;
  gap: 2px;
  justify-content: center;
  margin-top: 4px;
`;

const PeriodTab = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ $active, theme }) => ($active ? theme.colors.bgChip : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.text4)};
  transition: all 0.15s;
`;

const FlowRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
`;

const FlowLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text2};
`;

const FlowAmount = styled.span<{ $type: 'income' | 'expense' | 'savings' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $type }) => {
    if ($type === 'income') return theme.colors.up;
    if ($type === 'expense') return theme.colors.down;
    return theme.colors.up;
  }};
`;

const SavingsBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.bgChip};
  border-radius: 4px;
  margin: 12px 0 6px;
  overflow: hidden;
`;

const SavingsBarFill = styled.div<{ $width: number; $good: boolean }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  background: ${({ theme, $good }) => ($good ? theme.colors.up : theme.colors.text3)};
  border-radius: 4px;
  transition: width 0.3s;
`;

const SavingsInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
`;

const ReminderCard = styled(Link)`
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 0 14px 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(49, 130, 246, 0.12) 0%, rgba(49, 130, 246, 0.04) 100%);
  border: 1px solid rgba(49, 130, 246, 0.2);
  border-radius: ${({ theme }) => theme.radius['2xl']};
`;

const ReminderIcon = styled.span`
  font-size: 28px;
  flex-shrink: 0;
`;

const ReminderText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text2};
  line-height: 1.5;

  strong {
    color: ${({ theme }) => theme.colors.text};
    font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  }
`;

const AssetRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
`;

const AssetIcon = styled.span<{ $bg: string }>`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`;

const AssetInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AssetLabel = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text2};
`;

const AssetAmount = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
`;

const AssetPercent = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.text3};
`;

const ViewAllLink = styled(Link)`
  display: block;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-top: 12px;
  padding: 8px;
`;
