import styled from '@emotion/styled';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import type { Insight } from '@/types/app';

import { Card, CardHead, CardTitle, CardSubtitle } from '@/components/ui/Card';
import { useReport } from '@/features/report/hooks';
import { formatCurrency, formatCompact } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '월간 리포트 · 우리 가계' }];
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPrevMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number) as [number, number];
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function getNextMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number) as [number, number];
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number) as [number, number];
  return `${y}년 ${m}월`;
}

export default function ReportPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;

  const [month, setMonth] = useState(getCurrentMonth());
  const { data: report, isLoading } = useReport(householdId, month);

  const canGoNext = month < getCurrentMonth();

  return (
    <Container>
      {/* 월 탐색 */}
      <MonthNav>
        <NavBtn onClick={() => setMonth(getPrevMonth(month))}>←</NavBtn>
        <MonthLabel>{formatMonth(month)} 리포트</MonthLabel>
        <NavBtn onClick={() => canGoNext && setMonth(getNextMonth(month))} disabled={!canGoNext}>
          →
        </NavBtn>
      </MonthNav>

      {isLoading && <LoadingState>리포트 생성 중...</LoadingState>}

      {report && (
        <>
          {/* 1. Hero: 이번 달 저축 */}
          <HeroCard>
            <HeroLabel>이번 달 모은 돈</HeroLabel>
            <HeroAmount $positive={report.netFlow >= 0}>
              {report.netFlow >= 0 ? '+' : ''}{formatCurrency(report.netFlow)}
            </HeroAmount>
            <HeroSub>
              저축률 {(report.savingRate * 100).toFixed(1)}%
              {report.savingRate > 0 ? ' — 잘하고 있어요!' : ''}
            </HeroSub>
          </HeroCard>

          {/* 2. 전월 비교 바차트 */}
          <Card>
            <CardHead>
              <CardTitle>전월 비교</CardTitle>
            </CardHead>
            <CompareGrid>
              <CompareItem>
                <CompareLabel>수입</CompareLabel>
                <CompareValue $type="income">{formatCompact(report.income)}</CompareValue>
                <CompareChange>
                  {report.prevIncome > 0
                    ? `${(((report.income - report.prevIncome) / report.prevIncome) * 100).toFixed(0)}%`
                    : '—'}
                </CompareChange>
              </CompareItem>
              <CompareItem>
                <CompareLabel>지출</CompareLabel>
                <CompareValue $type="expense">{formatCompact(report.expense)}</CompareValue>
                <CompareChange>
                  {report.prevExpense > 0
                    ? `${(((report.expense - report.prevExpense) / report.prevExpense) * 100).toFixed(0)}%`
                    : '—'}
                </CompareChange>
              </CompareItem>
              <CompareItem>
                <CompareLabel>저축</CompareLabel>
                <CompareValue $type="savings">{formatCompact(report.netFlow)}</CompareValue>
                <CompareChange>
                  {report.prevNetFlow !== 0
                    ? `${(((report.netFlow - report.prevNetFlow) / Math.abs(report.prevNetFlow)) * 100).toFixed(0)}%`
                    : '—'}
                </CompareChange>
              </CompareItem>
            </CompareGrid>
          </Card>

          {/* 3. 예산 현황 */}
          {report.budgetProgress.length > 0 && (
            <Card>
              <CardHead>
                <CardTitle>예산 현황</CardTitle>
              </CardHead>
              {report.budgetProgress.map((bp) => (
                <BudgetItem key={bp.budgetId}>
                  <BudgetName>
                    {bp.icon} {bp.categoryName}
                  </BudgetName>
                  <BudgetBar>
                    <BudgetFill
                      $width={Math.min(bp.progress * 100, 100)}
                      $over={bp.progress >= 1}
                    />
                  </BudgetBar>
                  <BudgetPct $over={bp.progress >= 1}>
                    {(bp.progress * 100).toFixed(0)}%
                  </BudgetPct>
                </BudgetItem>
              ))}
            </Card>
          )}

          {/* 4. 지출 구성 */}
          {report.categorySpending.length > 0 && (
            <Card>
              <CardHead>
                <CardTitle>지출 구성</CardTitle>
                <CardSubtitle>{report.categorySpending.length}개 카테고리</CardSubtitle>
              </CardHead>
              <ChartWrap>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={report.categorySpending.slice(0, 6)} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="categoryName"
                      width={70}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#8B8E95', fontSize: 12 }}
                    />
                    <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                      {report.categorySpending.slice(0, 6).map((_, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartWrap>
              {report.categorySpending.map((c) => (
                <CategoryRow key={c.categoryId}>
                  <span>{c.icon} {c.categoryName}</span>
                  <CategoryAmount>{formatCurrency(c.total)}</CategoryAmount>
                </CategoryRow>
              ))}
            </Card>
          )}

          {/* 5. 인사이트 */}
          {report.insights.length > 0 && (
            <Card>
              <CardHead>
                <CardTitle>이번 달 인사이트</CardTitle>
              </CardHead>
              {report.insights.map((ins, i) => (
                <InsightItem key={i} $severity={ins.severity}>
                  <InsightIcon>{SEVERITY_ICON[ins.severity]}</InsightIcon>
                  <InsightContent>
                    <InsightTitle>{ins.title}</InsightTitle>
                    <InsightDesc>{ins.description}</InsightDesc>
                  </InsightContent>
                </InsightItem>
              ))}
            </Card>
          )}

          {/* 6. 순자산 */}
          {report.netWorth !== null && (
            <Card>
              <CardHead>
                <CardTitle>순자산</CardTitle>
              </CardHead>
              <NetWorthValue>{formatCurrency(report.netWorth)}</NetWorthValue>
              {report.prevNetWorth !== null && (
                <NetWorthChange $positive={report.netWorth >= report.prevNetWorth}>
                  전월 대비 {report.netWorth >= report.prevNetWorth ? '+' : ''}
                  {formatCurrency(report.netWorth - report.prevNetWorth)}
                </NetWorthChange>
              )}
            </Card>
          )}
        </>
      )}
    </Container>
  );
}

const BAR_COLORS = ['#3182F6', '#EB4D3D', '#F5A623', '#1CB572', '#A487F0', '#5C5F66'];

const SEVERITY_ICON: Record<Insight['severity'], string> = {
  good: '✅',
  warn: '⚠️',
  info: 'ℹ️',
};

// ── Styles ──────────────────────────────────

const Container = styled.div`
  padding: 16px 0 100px;
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 20px;
`;

const NavBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.bgElev};
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:disabled { opacity: 0.3; }
`;

const MonthLabel = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.text3};
`;

const HeroCard = styled.div`
  margin: 0 14px 10px;
  padding: 28px 22px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.bgElev} 0%, ${({ theme }) => theme.colors.bgElev2} 100%);
  border-radius: ${({ theme }) => theme.radius['2xl']};
  text-align: center;
`;

const HeroLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 8px;
`;

const HeroAmount = styled.div<{ $positive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize['4xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extrabold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $positive }) => ($positive ? theme.colors.up : theme.colors.down)};
  margin-bottom: 8px;
`;

const HeroSub = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
`;

const CompareGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const CompareItem = styled.div`
  text-align: center;
`;

const CompareLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 4px;
`;

const CompareValue = styled.div<{ $type: 'income' | 'expense' | 'savings' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $type }) => {
    if ($type === 'income') return theme.colors.up;
    if ($type === 'expense') return theme.colors.down;
    return theme.colors.text;
  }};
`;

const CompareChange = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text4};
  margin-top: 2px;
`;

const BudgetItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
`;

const BudgetName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  min-width: 80px;
`;

const BudgetBar = styled.div`
  flex: 1;
  height: 8px;
  background: ${({ theme }) => theme.colors.bgChip};
  border-radius: 4px;
  overflow: hidden;
`;

const BudgetFill = styled.div<{ $width: number; $over: boolean }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  border-radius: 4px;
  background: ${({ theme, $over }) => ($over ? theme.colors.danger : theme.colors.success)};
`;

const BudgetPct = styled.span<{ $over: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  font-variant-numeric: tabular-nums;
  min-width: 44px;
  text-align: right;
  color: ${({ theme, $over }) => ($over ? theme.colors.danger : theme.colors.success)};
`;

const ChartWrap = styled.div`
  margin: 0 -8px 12px;
`;

const CategoryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text2};
`;

const CategoryAmount = styled.span`
  font-variant-numeric: tabular-nums;
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const InsightItem = styled.div<{ $severity: string }>`
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderSoft};
  &:last-child { border-bottom: none; }
`;

const InsightIcon = styled.span`
  font-size: 20px;
  flex-shrink: 0;
`;

const InsightContent = styled.div``;

const InsightTitle = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 2px;
`;

const InsightDesc = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
`;

const NetWorthValue = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  margin-bottom: 4px;
`;

const NetWorthChange = styled.div<{ $positive: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme, $positive }) => ($positive ? theme.colors.up : theme.colors.down)};
`;
