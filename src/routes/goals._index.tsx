import styled from '@emotion/styled';
import { useState } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAccounts } from '@/features/accounts/hooks';
import {
  useGoals,
  useCreateGoal,
  useDeleteGoal,
  useUpdateGoal,
} from '@/features/goals/hooks';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '목표 · 우리 가계' }];
}

export default function GoalsPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;

  const { data: goals } = useGoals(householdId);
  const { data: accounts } = useAccounts(householdId);
  const createGoalFn = useCreateGoal(householdId);
  const updateGoalFn = useUpdateGoal(householdId);
  const deleteGoalFn = useDeleteGoal(householdId);

  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formMonthly, setFormMonthly] = useState('');
  const [formReturnPct, setFormReturnPct] = useState('3.0');
  const [formLinkedIds, setFormLinkedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!householdId || !member) return;
    setSaving(true);
    try {
      await createGoalFn({
        householdId,
        name: formName,
        emoji: formEmoji || undefined,
        targetAmount: Number(formTarget),
        monthlyContribution: formMonthly ? Number(formMonthly) : undefined,
        expectedReturnPct: Number(formReturnPct) || 3.0,
        linkedAccountIds: formLinkedIds,
        createdBy: member.id,
      });
      setShowForm(false);
      setFormName('');
      setFormEmoji('');
      setFormTarget('');
      setFormMonthly('');
      setFormReturnPct('3.0');
      setFormLinkedIds([]);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('이 목표를 삭제할까요?')) return;
    await deleteGoalFn(id);
  }

  async function handleAchieve(id: string) {
    await updateGoalFn(id, { status: 'achieved' });
  }

  const active = goals?.filter((g) => g.status === 'active') ?? [];
  const achieved = goals?.filter((g) => g.status === 'achieved') ?? [];

  return (
    <Container>
      <Header>
        <PageTitle>목표</PageTitle>
        <Button size="sm" onClick={() => setShowForm(true)}>추가</Button>
      </Header>

      {active.length === 0 && !showForm && (
        <EmptyState>
          목표가 없습니다.
          <br />
          &quot;내 집 마련&quot; 같은 목표를 등록하세요.
        </EmptyState>
      )}

      {active.map((g) => (
        <GoalCard key={g.id} to={`/goals/${g.id}`}>
          <GoalTop>
            <GoalEmoji>{g.emoji ?? '🎯'}</GoalEmoji>
            <GoalInfo>
              <GoalName>{g.name}</GoalName>
              <GoalTarget>목표 {formatCurrency(g.targetAmount)}</GoalTarget>
            </GoalInfo>
          </GoalTop>
          {g.monthlyContribution && (
            <GoalMeta>매월 {formatCurrency(g.monthlyContribution)} · 연 {g.expectedReturnPct ?? 3}%</GoalMeta>
          )}
          <GoalActions onClick={(e) => e.preventDefault()}>
            <ActionBtn onClick={() => handleAchieve(g.id)}>달성</ActionBtn>
            <ActionBtn $danger onClick={() => handleDelete(g.id)}>삭제</ActionBtn>
          </GoalActions>
        </GoalCard>
      ))}

      {achieved.length > 0 && (
        <>
          <SectionLabel>달성한 목표</SectionLabel>
          {achieved.map((g) => (
            <AchievedCard key={g.id}>
              <span>{g.emoji ?? '🎯'} {g.name}</span>
              <AchievedBadge>달성!</AchievedBadge>
            </AchievedCard>
          ))}
        </>
      )}

      {showForm && (
        <Overlay onClick={() => setShowForm(false)}>
          <FormSheet onClick={(e) => e.stopPropagation()}>
            <FormTitle>새 목표</FormTitle>

            <Row>
              <Input
                label="이모지"
                value={formEmoji}
                onChange={(e) => setFormEmoji(e.target.value)}
                placeholder="🏡"
                style={{ width: 80 }}
              />
              <div style={{ flex: 1 }}>
                <Input
                  label="이름"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="내 집 마련"
                />
              </div>
            </Row>

            <Input
              label="목표 금액"
              type="number"
              value={formTarget}
              onChange={(e) => setFormTarget(e.target.value)}
              placeholder="500000000"
            />

            <Input
              label="매월 기여액"
              type="number"
              value={formMonthly}
              onChange={(e) => setFormMonthly(e.target.value)}
              placeholder="1500000"
            />

            <Input
              label="예상 수익률 (%)"
              type="number"
              value={formReturnPct}
              onChange={(e) => setFormReturnPct(e.target.value)}
              placeholder="3.0"
            />

            <FieldGroup>
              <FieldLabel>연결 계좌</FieldLabel>
              {accounts?.map((a) => (
                <CheckboxRow key={a.id}>
                  <input
                    type="checkbox"
                    checked={formLinkedIds.includes(a.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormLinkedIds([...formLinkedIds, a.id]);
                      } else {
                        setFormLinkedIds(formLinkedIds.filter((id) => id !== a.id));
                      }
                    }}
                  />
                  <span>{a.name}</span>
                </CheckboxRow>
              ))}
            </FieldGroup>

            <FormActions>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !formName || !formTarget}
              >
                {saving ? '저��� 중...' : '저장'}
              </Button>
            </FormActions>
          </FormSheet>
        </Overlay>
      )}
    </Container>
  );
}

// ── Styles ──────────────────────────────────

const Container = styled.div`
  padding: 24px 14px;
  padding-bottom: 100px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${({ theme }) => theme.colors.text3};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  line-height: 1.6;
`;

const GoalCard = styled(Link)`
  display: block;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 16px 20px;
  margin-bottom: 8px;
`;

const GoalTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const GoalEmoji = styled.span`
  font-size: 28px;
`;

const GoalInfo = styled.div``;

const GoalName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const GoalTarget = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
  font-variant-numeric: tabular-nums;
`;

const GoalMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text4};
  margin-top: 8px;
`;

const GoalActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderSoft};
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, $danger }) => ($danger ? theme.colors.danger : theme.colors.accent)};
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  &:hover { background: ${({ theme }) => theme.colors.bgElev2}; }
`;

const SectionLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text4};
  margin: 20px 0 8px 4px;
`;

const AchievedCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: 4px;
  opacity: 0.6;
`;

const AchievedBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const FormSheet = styled.div`
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']} ${({ theme }) => theme.radius['2xl']} 0 0;
  padding: 24px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text2};
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  padding: 4px 0;
  cursor: pointer;
`;

const FormActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  & > button { flex: 1; }
`;
