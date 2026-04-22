import styled from '@emotion/styled';
import { useState } from 'react';

import type { BudgetProgress, Category } from '@/types/app';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useBudgetProgress,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '@/features/budgets/hooks';
import { useCategories } from '@/features/categories/hooks';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '예산 설정 · 우리 가계' }];
}

export default function SettingsBudgetsPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;

  const { data: budgetProgress } = useBudgetProgress(householdId);
  const { data: expenseCategories } = useCategories(householdId, 'expense');

  const createBudgetFn = useCreateBudget(householdId);
  const updateBudgetFn = useUpdateBudget(householdId);
  const deleteBudgetFn = useDeleteBudget(householdId);

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetProgress | null>(null);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const budgetedCategoryIds = new Set(budgetProgress?.map((b) => b.categoryId) ?? []);
  const unbudgetedCategories = expenseCategories?.filter((c) => !budgetedCategoryIds.has(c.id)) ?? [];

  function openNew(category?: Category) {
    setEditingBudget(null);
    setFormCategoryId(category?.id ?? '');
    setFormAmount('');
    setShowForm(true);
  }

  function openEdit(bp: BudgetProgress) {
    setEditingBudget(bp);
    setFormCategoryId(bp.categoryId);
    setFormAmount(String(bp.budgetAmount));
    setShowForm(true);
  }

  async function handleSave() {
    if (!householdId || !member) return;
    setSaving(true);
    try {
      if (editingBudget) {
        await updateBudgetFn(editingBudget.budgetId, {
          amount: Number(formAmount),
        });
      } else {
        await createBudgetFn({
          householdId,
          categoryId: formCategoryId,
          amount: Number(formAmount),
          createdBy: member.id,
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(budgetId: string) {
    if (!window.confirm('이 예산을 삭제할까요?')) return;
    await deleteBudgetFn(budgetId);
  }

  function statusColor(status: string, progress: number) {
    if (progress >= 1.0) return 'danger';
    if (progress >= 0.95) return 'warn';
    return 'ok';
  }

  return (
    <Container>
      <Header>
        <PageTitle>예산 설정</PageTitle>
        <Button size="sm" onClick={() => openNew()}>추가</Button>
      </Header>

      {budgetProgress && budgetProgress.length > 0 ? (
        budgetProgress.map((bp) => {
          const variant = statusColor(bp.status, bp.progress);
          return (
            <BudgetCard key={bp.budgetId}>
              <BudgetRow>
                <BudgetLeft>
                  {bp.icon && <BudgetIcon>{bp.icon}</BudgetIcon>}
                  <BudgetInfo>
                    <BudgetName>{bp.categoryName}</BudgetName>
                    <BudgetMeta>
                      {formatCurrency(bp.spent)} / {formatCurrency(bp.budgetAmount)}
                    </BudgetMeta>
                  </BudgetInfo>
                </BudgetLeft>
                <BudgetPercent $variant={variant}>
                  {(bp.progress * 100).toFixed(0)}%
                </BudgetPercent>
              </BudgetRow>
              <ProgressBar>
                <ProgressFill
                  $width={Math.min(bp.progress * 100, 100)}
                  $variant={variant}
                />
              </ProgressBar>
              <BudgetActions>
                <ActionBtn onClick={() => openEdit(bp)}>편집</ActionBtn>
                <ActionBtn $danger onClick={() => handleDelete(bp.budgetId)}>삭제</ActionBtn>
              </BudgetActions>
            </BudgetCard>
          );
        })
      ) : (
        <EmptyState>
          설정된 예산이 없습니다.
          <br />
          카테고리별 예산을 설정해 보세요.
        </EmptyState>
      )}

      {unbudgetedCategories.length > 0 && (
        <>
          <SectionLabel>예산 미설정</SectionLabel>
          {unbudgetedCategories.map((c) => (
            <UnbudgetedRow key={c.id} onClick={() => openNew(c)}>
              {c.icon && <span>{c.icon}</span>}
              <span>{c.name}</span>
              <AddLabel>+ 예산 추가</AddLabel>
            </UnbudgetedRow>
          ))}
        </>
      )}

      {showForm && (
        <Overlay onClick={() => setShowForm(false)}>
          <FormSheet onClick={(e) => e.stopPropagation()}>
            <FormTitle>{editingBudget ? '예산 편집' : '예산 추가'}</FormTitle>

            {!editingBudget && (
              <FieldGroup>
                <FieldLabel>카테고리</FieldLabel>
                <Select
                  value={formCategoryId}
                  onChange={(e) => setFormCategoryId(e.target.value)}
                >
                  <option value="">선택</option>
                  {unbudgetedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
            )}

            {editingBudget && (
              <CurrentCategory>
                {editingBudget.icon} {editingBudget.categoryName}
              </CurrentCategory>
            )}

            <Input
              label="월 예산 (원)"
              type="number"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="500000"
            />

            <FormActions>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formAmount || (!editingBudget && !formCategoryId)}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            </FormActions>
          </FormSheet>
        </Overlay>
      )}
    </Container>
  );
}

// ── Styles ────────────────────────────────────

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
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${({ theme }) => theme.colors.text3};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  line-height: 1.6;
`;

const BudgetCard = styled.div`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 16px 20px;
  margin-bottom: 8px;
`;

const BudgetRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const BudgetLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BudgetIcon = styled.span`
  font-size: 20px;
`;

const BudgetInfo = styled.div``;

const BudgetName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const BudgetMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
  font-variant-numeric: tabular-nums;
`;

const BudgetPercent = styled.span<{ $variant: string }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $variant }) => {
    if ($variant === 'danger') return theme.colors.danger;
    if ($variant === 'warn') return theme.colors.warn;
    return theme.colors.success;
  }};
`;

const ProgressBar = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.bgChip};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $width: number; $variant: string }>`
  height: 100%;
  width: ${({ $width }) => $width}%;
  border-radius: 4px;
  transition: width 0.3s;
  background: ${({ theme, $variant }) => {
    if ($variant === 'danger') return theme.colors.danger;
    if ($variant === 'warn') return theme.colors.warn;
    return theme.colors.success;
  }};
`;

const BudgetActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderSoft};
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, $danger }) => ($danger ? theme.colors.danger : theme.colors.text3)};
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.colors.bgElev2}; }
`;

const SectionLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text4};
  margin: 20px 0 8px 4px;
`;

const UnbudgetedRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text2};
  margin-bottom: 4px;
  transition: background 0.15s;
  &:hover { background: ${({ theme }) => theme.colors.bgElev2}; }
`;

const AddLabel = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.accent};
`;

// ── Form ──────────────────────────────────────

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

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text2};
`;

const Select = styled.select`
  height: 48px;
  padding: 0 16px;
  background: ${({ theme }) => theme.colors.bg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  &:focus { border-color: ${({ theme }) => theme.colors.accent}; outline: none; }
`;

const CurrentCategory = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  padding: 8px 0;
`;

const FormActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  & > button { flex: 1; }
`;
