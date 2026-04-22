import styled from '@emotion/styled';
import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts';

import { useGoal, useGoalCurrentAmount, useUpdateGoal } from '@/features/goals/hooks';
import { simulateSimple, generateScenarios } from '@/features/goals/simulation';
import { formatCurrency, formatCompact } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '목표 상세 · 우리 가계' }];
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const member = useAuthStore((s) => s.member);
  const { data: goal } = useGoal(id);
  const { data: currentAmount } = useGoalCurrentAmount(goal?.linkedAccountIds);
  const updateGoalFn = useUpdateGoal(member?.householdId);

  const [monthlyOverride, setMonthlyOverride] = useState<number | null>(null);
  const [returnOverride, setReturnOverride] = useState<number | null>(null);

  const monthly = monthlyOverride ?? goal?.monthlyContribution ?? 0;
  const returnPct = returnOverride ?? goal?.expectedReturnPct ?? 3.0;
  const initial = currentAmount ?? 0;
  const target = goal?.targetAmount ?? 0;

  const progress = target > 0 ? initial / target : 0;
  const remaining = Math.max(target - initial, 0);

  const simulation = useMemo(
    () => simulateSimple(initial, monthly, returnPct, target),
    [initial, monthly, returnPct, target],
  );

  const scenarios = useMemo(
    () => generateScenarios(initial, monthly, returnPct, target),
    [initial, monthly, returnPct, target],
  );

  const chartData = simulation.series.map((v, i) => ({
    month: i,
    label: i % 12 === 0 ? `${Math.floor(i / 12)}년` : '',
    value: v,
  }));

  async function handleSaveParams() {
    if (!goal) return;
    await updateGoalFn(goal.id, {
      monthlyContribution: monthly,
      expectedReturnPct: returnPct,
    });
  }

  if (!goal) {
    return (
      <Container>
        <BackLink to="/goals">← 목표 목록</BackLink>
        <EmptyState>목표를 찾을 수 없습니다.</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <BackLink to="/goals">← 목표 목록</BackLink>

      <HeroSection>
        <HeroEmoji>{goal.emoji ?? '🎯'}</HeroEmoji>
        <HeroName>{goal.name}</HeroName>
        {goal.status === 'achieved' && <AchievedBadge>달성!</AchievedBadge>}
      </HeroSection>

      {/* 현재 현황 */}
      <StatsGrid>
        <StatItem>
          <StatLabel>현재</StatLabel>
          <StatValue>{formatCurrency(initial)}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>목표</StatLabel>
          <StatValue>{formatCurrency(target)}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>진행률</StatLabel>
          <StatValue>{(progress * 100).toFixed(1)}%</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>남은 금액</StatLabel>
          <StatValue>{formatCurrency(remaining)}</StatValue>
        </StatItem>
      </StatsGrid>

      <ProgressBar>
        <ProgressFill $width={Math.min(progress * 100, 100)} />
      </ProgressBar>

      {/* 시뮬레이션 차트 */}
      {monthly > 0 && (
        <ChartCard>
          <ChartTitle>시뮬레이션</ChartTitle>
          {simulation.etaMonths && (
            <EtaLabel>
              약 {Math.floor(simulation.etaMonths / 12)}년 {simulation.etaMonths % 12}개월 후 달성 예상
            </EtaLabel>
          )}
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#5C5F66', fontSize: 11 }}
              />
              <YAxis
                hide
                domain={[0, Math.max(target * 1.1, initial * 1.2)]}
              />
              <Tooltip
                contentStyle={{
                  background: '#18191C',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => [formatCompact(value), '예상 자산']}
                labelFormatter={(v) => `${v}차 ��`}
              />
              <ReferenceLine
                y={target}
                stroke="#EB4D3D"
                strokeDasharray="3 3"
                label={{ value: '목표', fill: '#EB4D3D', fontSize: 11 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3182F6"
                fill="rgba(49, 130, 246, 0.12)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* What-if 슬라이더 */}
      <SliderCard>
        <SliderTitle>What-if 시뮬레이션</SliderTitle>

        <SliderGroup>
          <SliderLabel>
            매월 기여액: {formatCurrency(monthly)}
          </SliderLabel>
          <SliderInput
            type="range"
            min={Math.max(0, (goal.monthlyContribution ?? 0) * 0.5)}
            max={(goal.monthlyContribution ?? 1000000) * 1.5}
            step={10000}
            value={monthly}
            onChange={(e) => setMonthlyOverride(Number(e.target.value))}
          />
        </SliderGroup>

        <SliderGroup>
          <SliderLabel>
            예상 수익률: 연 {returnPct.toFixed(1)}%
          </SliderLabel>
          <SliderInput
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={returnPct}
            onChange={(e) => setReturnOverride(Number(e.target.value))}
          />
        </SliderGroup>

        {(monthlyOverride !== null || returnOverride !== null) && (
          <SaveBtn onClick={handleSaveParams}>설정 저장</SaveBtn>
        )}
      </SliderCard>

      {/* 시나리오 비교 */}
      {monthly > 0 && (
        <ScenarioCard>
          <ScenarioTitle>시나리오 비교</ScenarioTitle>
          {scenarios.map((s, i) => (
            <ScenarioRow key={i}>
              <ScenarioDot $index={i} />
              <ScenarioInfo>
                <ScenarioLabel>{s.label}</ScenarioLabel>
                <ScenarioEta>
                  {s.etaDate ? `${s.etaDate} (${s.etaMonths}개월 후)` : '달성 시점 미확정'}
                </ScenarioEta>
              </ScenarioInfo>
            </ScenarioRow>
          ))}
        </ScenarioCard>
      )}

      {/* 연결 계좌 */}
      {goal.linkedAccountIds.length > 0 && (
        <InfoCard>
          <InfoLabel>연결 계좌: {goal.linkedAccountIds.length}개</InfoLabel>
        </InfoCard>
      )}
    </Container>
  );
}

// ── Styles ──────────────────────────────────

const Container = styled.div`
  padding: 16px 14px 100px;
`;

const BackLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.accent};
  display: inline-block;
  margin-bottom: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${({ theme }) => theme.colors.text3};
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const HeroEmoji = styled.div`
  font-size: 48px;
  margin-bottom: 8px;
`;

const HeroName = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const AchievedBadge = styled.span`
  display: inline-block;
  margin-top: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  padding: 4px 16px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
`;

const StatItem = styled.div`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 14px 16px;
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
`;

const ProgressBar = styled.div`
  height: 10px;
  background: ${({ theme }) => theme.colors.bgChip};
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  border-radius: 5px;
  background: ${({ theme }) => theme.colors.accent};
  transition: width 0.3s;
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  padding: 20px 14px;
  margin-bottom: 10px;
`;

const ChartTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 4px;
`;

const EtaLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.accent};
  margin-bottom: 12px;
`;

const SliderCard = styled.div`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  padding: 20px 22px;
  margin-bottom: 10px;
`;

const SliderTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 16px;
`;

const SliderGroup = styled.div`
  margin-bottom: 16px;
`;

const SliderLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text2};
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
`;

const SliderInput = styled.input`
  width: 100%;
  accent-color: ${({ theme }) => theme.colors.accent};
`;

const SaveBtn = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.bgChip};
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-top: 4px;
`;

const ScenarioCard = styled.div`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  padding: 20px 22px;
  margin-bottom: 10px;
`;

const ScenarioTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 16px;
`;

const ScenarioRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
`;

const SCENARIO_COLORS = ['#3182F6', '#1CB572', '#A487F0'];

const ScenarioDot = styled.span<{ $index: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $index }) => SCENARIO_COLORS[$index % 3]};
  margin-top: 6px;
  flex-shrink: 0;
`;

const ScenarioInfo = styled.div``;

const ScenarioLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

const ScenarioEta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
`;

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 16px 20px;
  margin-bottom: 10px;
`;

const InfoLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
`;
