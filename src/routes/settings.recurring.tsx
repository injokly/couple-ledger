import styled from '@emotion/styled';
import { useState } from 'react';

import type { RecurringTemplate, RecurringFrequency, TransactionType } from '@/types/app';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAccounts } from '@/features/accounts/hooks';
import { useCategories } from '@/features/categories/hooks';
import {
  useRecurringTemplates,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useSkipRecurring,
} from '@/features/recurring/hooks';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '반복 거래 · 설정 · 우리 가계' }];
}

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
  yearly: '매년',
};

const TYPE_LABELS: Record<TransactionType, string> = {
  income: '수입',
  expense: '지출',
  transfer: '이체',
};

interface FormState {
  name: string;
  type: TransactionType;
  amount: string;
  accountId: string;
  toAccountId: string;
  categoryId: string;
  frequency: RecurringFrequency;
  intervalN: string;
  dayOfMonth: string;
  nextRunDate: string;
  autoCreate: boolean;
}

const defaultForm: FormState = {
  name: '',
  type: 'expense',
  amount: '',
  accountId: '',
  toAccountId: '',
  categoryId: '',
  frequency: 'monthly',
  intervalN: '1',
  dayOfMonth: '',
  nextRunDate: '',
  autoCreate: false,
};

export default function SettingsRecurringPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;

  const { data: templates } = useRecurringTemplates(householdId, true);
  const { data: accounts } = useAccounts(householdId);
  const { data: incomeCategories } = useCategories(householdId, 'income');
  const { data: expenseCategories } = useCategories(householdId, 'expense');

  const createRecurring = useCreateRecurring(householdId);
  const updateRecurring = useUpdateRecurring(householdId);
  const deleteRecurring = useDeleteRecurring(householdId);
  const skipRecurring = useSkipRecurring(householdId);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  const categories = form.type === 'income' ? incomeCategories : expenseCategories;

  function openNew() {
    setEditingId(null);
    setForm({
      ...defaultForm,
      accountId: accounts?.[0]?.id ?? '',
    });
    setShowForm(true);
  }

  function openEdit(t: RecurringTemplate) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      type: t.type,
      amount: String(t.amount),
      accountId: t.accountId,
      toAccountId: t.toAccountId ?? '',
      categoryId: t.categoryId ?? '',
      frequency: t.frequency,
      intervalN: String(t.intervalN),
      dayOfMonth: t.dayOfMonth !== null ? String(t.dayOfMonth) : '',
      nextRunDate: t.nextRunDate,
      autoCreate: t.autoCreate,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!householdId || !member) return;
    setSaving(true);
    try {
      const base = {
        name: form.name,
        type: form.type,
        amount: Number(form.amount),
        accountId: form.accountId,
        toAccountId: form.type === 'transfer' ? form.toAccountId : undefined,
        categoryId: form.type !== 'transfer' ? form.categoryId : undefined,
        frequency: form.frequency,
        intervalN: Number(form.intervalN) || 1,
        dayOfMonth: form.dayOfMonth ? Number(form.dayOfMonth) : undefined,
        nextRunDate: form.nextRunDate,
        autoCreate: form.autoCreate,
      };

      if (editingId) {
        await updateRecurring(editingId, base);
      } else {
        await createRecurring({
          ...base,
          householdId,
          createdBy: member.id,
        });
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('�� 반복 거래를 삭제할까요?')) return;
    await deleteRecurring(id);
  }

  async function handleSkip(id: string) {
    await skipRecurring(id);
  }

  async function handleToggleActive(t: RecurringTemplate) {
    await updateRecurring(t.id, { isActive: !t.isActive });
  }

  const active = templates?.filter((t) => t.isActive) ?? [];
  const inactive = templates?.filter((t) => !t.isActive) ?? [];

  return (
    <Container>
      <Header>
        <PageTitle>반복 거래</PageTitle>
        <Button size="sm" onClick={openNew}>추가</Button>
      </Header>

      {active.length === 0 && !showForm && (
        <EmptyState>
          등록된 반복 거래가 없습니다.
          <br />
          월급, 월세 같은 정기 거래를 등록하세요.
        </EmptyState>
      )}

      {active.map((t) => (
        <TemplateCard key={t.id}>
          <CardRow>
            <CardMain>
              <CardName>{t.name}</CardName>
              <CardMeta>
                {TYPE_LABELS[t.type]} · {FREQ_LABELS[t.frequency]}
                {t.intervalN > 1 ? ` ${t.intervalN}회` : ''}
                {t.dayOfMonth ? ` · ${t.dayOfMonth}일` : ''}
              </CardMeta>
            </CardMain>
            <CardRight>
              <CardAmount $type={t.type}>
                {formatCurrency(t.amount)}
              </CardAmount>
              <CardNext>다음: {t.nextRunDate}</CardNext>
            </CardRight>
          </CardRow>
          <CardBadges>
            <Badge $variant={t.autoCreate ? 'auto' : 'manual'}>
              {t.autoCreate ? '자동 생성' : '수동 확인'}
            </Badge>
          </CardBadges>
          <CardActions>
            <ActionBtn onClick={() => openEdit(t)}>편집</ActionBtn>
            <ActionBtn onClick={() => handleSkip(t.id)}>스킵</ActionBtn>
            <ActionBtn onClick={() => handleToggleActive(t)}>비활성화</ActionBtn>
            <ActionBtn $danger onClick={() => handleDelete(t.id)}>삭제</ActionBtn>
          </CardActions>
        </TemplateCard>
      ))}

      {inactive.length > 0 && (
        <>
          <SectionLabel>비활성</SectionLabel>
          {inactive.map((t) => (
            <TemplateCard key={t.id} $inactive>
              <CardRow>
                <CardMain>
                  <CardName>{t.name}</CardName>
                  <CardMeta>{TYPE_LABELS[t.type]} · {FREQ_LABELS[t.frequency]}</CardMeta>
                </CardMain>
                <CardRight>
                  <CardAmount $type={t.type}>{formatCurrency(t.amount)}</CardAmount>
                </CardRight>
              </CardRow>
              <CardActions>
                <ActionBtn onClick={() => handleToggleActive(t)}>활성화</ActionBtn>
                <ActionBtn $danger onClick={() => handleDelete(t.id)}>삭제</ActionBtn>
              </CardActions>
            </TemplateCard>
          ))}
        </>
      )}

      {/* 추가/편집 모달 */}
      {showForm && (
        <Overlay onClick={() => setShowForm(false)}>
          <FormSheet onClick={(e) => e.stopPropagation()}>
            <FormTitle>{editingId ? '반복 거래 편집' : '반복 거래 추가'}</FormTitle>

            <Input
              label="이름"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="월급, 월세 등"
            />

            <FieldGroup>
              <FieldLabel>유형</FieldLabel>
              <SegmentGroup>
                {(['income', 'expense', 'transfer'] as const).map((t) => (
                  <Segment
                    key={t}
                    $active={form.type === t}
                    onClick={() => setForm({ ...form, type: t, categoryId: '' })}
                  >
                    {TYPE_LABELS[t]}
                  </Segment>
                ))}
              </SegmentGroup>
            </FieldGroup>

            <Input
              label="금액"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0"
            />

            <FieldGroup>
              <FieldLabel>계좌</FieldLabel>
              <Select
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              >
                <option value="">선택</option>
                {accounts?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </FieldGroup>

            {form.type === 'transfer' && (
              <FieldGroup>
                <FieldLabel>입금 계좌</FieldLabel>
                <Select
                  value={form.toAccountId}
                  onChange={(e) => setForm({ ...form, toAccountId: e.target.value })}
                >
                  <option value="">선택</option>
                  {accounts?.filter((a) => a.id !== form.accountId).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </FieldGroup>
            )}

            {form.type !== 'transfer' && (
              <FieldGroup>
                <FieldLabel>카테고리</FieldLabel>
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="">선택</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </option>
                  ))}
                </Select>
              </FieldGroup>
            )}

            <FieldGroup>
              <FieldLabel>주기</FieldLabel>
              <SegmentGroup>
                {(['monthly', 'weekly', 'daily', 'yearly'] as const).map((f) => (
                  <Segment
                    key={f}
                    $active={form.frequency === f}
                    onClick={() => setForm({ ...form, frequency: f })}
                  >
                    {FREQ_LABELS[f]}
                  </Segment>
                ))}
              </SegmentGroup>
            </FieldGroup>

            {form.frequency === 'monthly' && (
              <Input
                label="매월 몇일"
                type="number"
                value={form.dayOfMonth}
                onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                placeholder="25"
              />
            )}

            <Input
              label="다음 실행일"
              type="date"
              value={form.nextRunDate}
              onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })}
            />

            <FieldGroup>
              <ToggleRow>
                <FieldLabel>자동 생성</FieldLabel>
                <Toggle
                  $on={form.autoCreate}
                  onClick={() => setForm({ ...form, autoCreate: !form.autoCreate })}
                >
                  <ToggleThumb $on={form.autoCreate} />
                </Toggle>
              </ToggleRow>
              <ToggleHint>
                {form.autoCreate
                  ? '실행일에 거래가 자동 생성됩니다'
                  : '실행일에 홈에서 확인 후 기록합니다'}
              </ToggleHint>
            </FieldGroup>

            <FormActions>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                취소
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !form.name || !form.amount || !form.accountId || !form.nextRunDate}
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

const TemplateCard = styled.div<{ $inactive?: boolean }>`
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: 16px 20px;
  margin-bottom: 8px;
  opacity: ${({ $inactive }) => ($inactive ? 0.5 : 1)};
`;

const CardRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CardMain = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardName = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  margin-bottom: 4px;
`;

const CardMeta = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
`;

const CardRight = styled.div`
  text-align: right;
  flex-shrink: 0;
`;

const CardAmount = styled.div<{ $type: TransactionType }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $type }) => {
    if ($type === 'income') return theme.colors.up;
    if ($type === 'expense') return theme.colors.down;
    return theme.colors.text2;
  }};
`;

const CardNext = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
  margin-top: 2px;
`;

const CardBadges = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
`;

const Badge = styled.span<{ $variant: 'auto' | 'manual' }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
  background: ${({ theme, $variant }) =>
    $variant === 'auto' ? theme.colors.successSoft : theme.colors.bgChip};
  color: ${({ theme, $variant }) =>
    $variant === 'auto' ? theme.colors.success : theme.colors.text3};
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderSoft};
`;

const ActionBtn = styled.button<{ $danger?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, $danger }) => ($danger ? theme.colors.danger : theme.colors.text3)};
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgElev2};
  }
`;

const SectionLabel = styled.div`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text4};
  margin: 20px 0 8px 4px;
`;

// ── Form Modal ──────────────────────────────

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
  margin-bottom: 4px;
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

  &:focus {
    border-color: ${({ theme }) => theme.colors.accent};
    outline: none;
  }
`;

const SegmentGroup = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.colors.bg};
  padding: 4px;
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const Segment = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ theme, $active }) => ($active ? theme.colors.bgElev2 : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.text4)};
  transition: all 0.15s;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Toggle = styled.button<{ $on: boolean }>`
  width: 48px;
  height: 28px;
  border-radius: 14px;
  background: ${({ theme, $on }) => ($on ? theme.colors.success : theme.colors.bgChip)};
  position: relative;
  transition: background 0.2s;
`;

const ToggleThumb = styled.span<{ $on: boolean }>`
  position: absolute;
  top: 3px;
  left: ${({ $on }) => ($on ? '23px' : '3px')};
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: white;
  transition: left 0.2s;
`;

const ToggleHint = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text4};
`;

const FormActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;

  & > button {
    flex: 1;
  }
`;
