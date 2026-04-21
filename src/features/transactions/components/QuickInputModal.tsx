import { css, useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { TransactionType } from '@/types/app';

import { NumericPad } from '@/components/ui/NumericPad';
import { useAccounts } from '@/features/accounts/hooks';
import { useCategories } from '@/features/categories/hooks';
import { useCreateTransaction } from '@/features/transactions/hooks';
import { formatCurrency } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';
import { useQuickInputStore } from '@/stores/quickInput';


const TYPE_LABELS: Record<TransactionType, string> = {
  expense: '지출',
  income: '수입',
  transfer: '이체',
};

const MAX_DIGITS = 11;

export function QuickInputModal() {
  const isOpen = useQuickInputStore((s) => s.isOpen);
  const initialType = useQuickInputStore((s) => s.initialType);
  const continuousMode = useQuickInputStore((s) => s.continuousMode);
  const close = useQuickInputStore((s) => s.close);
  const setContinuousMode = useQuickInputStore((s) => s.setContinuousMode);

  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;
  const theme = useTheme();

  const { data: accounts } = useAccounts(householdId);
  const { data: expenseCategories } = useCategories(householdId, 'expense');
  const { data: incomeCategories } = useCategories(householdId, 'income');
  const createTx = useCreateTransaction();

  const [type, setType] = useState<TransactionType>(initialType);
  const [digits, setDigits] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const memoRef = useRef<HTMLInputElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초대 시 타입 리셋
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setDigits('');
      setCategoryId(null);
      setMemo('');
      setToast('');
      // 마지막 계좌 복원
      const lastAccount = localStorage.getItem('cl:lastAccountId');
      if (lastAccount && accounts?.some((a) => a.id === lastAccount)) {
        setAccountId(lastAccount);
      } else if (accounts?.[0]) {
        setAccountId(accounts[0].id);
      }
      setToAccountId(null);
    }
  }, [isOpen, initialType, accounts]);

  const amount = Number(digits) || 0;
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const canSave =
    amount > 0 &&
    accountId &&
    (type === 'transfer' ? toAccountId && toAccountId !== accountId : categoryId);

  // ── Numpad 핸들러 ─────────────────────────

  const handleDigit = useCallback(
    (digit: string) => {
      setDigits((prev) => {
        if (prev.length >= MAX_DIGITS) return prev;
        if (prev === '' && digit === '0') return prev;
        if (prev === '' && digit === '00') return prev;
        return prev + digit;
      });
    },
    [],
  );

  const handleDelete = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1));
  }, []);

  // ── 저장 ──────────────────────────────────

  async function handleSave() {
    if (!canSave || !householdId || !member || !accountId) return;
    setSaving(true);

    try {
      await createTx({
        householdId,
        type,
        amount,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId ?? undefined : undefined,
        categoryId: type !== 'transfer' ? categoryId ?? undefined : undefined,
        memo: memo || undefined,
        createdBy: member.id,
      });

      localStorage.setItem('cl:lastAccountId', accountId);

      if (continuousMode) {
        setDigits('');
        setMemo('');
        setToast('저장됨 · 계속 입력');
        setTimeout(() => setToast(''), 2000);
      } else {
        setToast('기록됨');
        setTimeout(() => {
          close();
          setToast('');
        }, 600);
      }
    } catch {
      setToast('저장 실패');
      setTimeout(() => setToast(''), 2000);
    } finally {
      setSaving(false);
    }
  }

  // ── 키보드 이벤트 ──────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  // ── 롱프레스 (연속 입력) ───────────────────

  function handleSavePointerDown() {
    longPressRef.current = setTimeout(() => {
      setContinuousMode(true);
      handleSave();
    }, 500);
  }

  function handleSavePointerUp() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <Backdrop onClick={close} />
      <Sheet>
        <DragHandle />

        {/* 헤더 */}
        <SheetHeader>
          <CloseButton type="button" onClick={close} aria-label="닫기">
            ✕
          </CloseButton>
          <HeaderTitle>거래 기록</HeaderTitle>
          <DateChip>오늘</DateChip>
        </SheetHeader>

        {/* 타입 토글 */}
        <TypeToggle>
          {(['expense', 'income', 'transfer'] as const).map((t) => (
            <TypeButton key={t} $active={type === t} onClick={() => setType(t)}>
              {TYPE_LABELS[t]}
            </TypeButton>
          ))}
        </TypeToggle>

        {/* 금액 표시 */}
        <AmountDisplay>
          <AmountText $hasValue={digits.length > 0}>
            {digits.length > 0 ? formatCurrency(amount) : '0원'}
          </AmountText>
        </AmountDisplay>

        {/* 메모 */}
        <MemoInput
          ref={memoRef}
          type="text"
          placeholder="메모 추가 (선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          autoComplete="off"
        />

        {/* 카테고리 또는 이체 대상 */}
        {type === 'transfer' ? (
          <AccountSection>
            <SectionLabel>받는 계좌</SectionLabel>
            <AccountChips>
              {accounts
                ?.filter((a) => a.id !== accountId)
                .map((a) => (
                  <Chip
                    key={a.id}
                    $active={toAccountId === a.id}
                    onClick={() => setToAccountId(a.id)}
                  >
                    {a.name}
                  </Chip>
                ))}
            </AccountChips>
          </AccountSection>
        ) : (
          <CategoryStrip>
            {categories?.slice(0, 8).map((cat) => (
              <CategoryChip
                key={cat.id}
                $active={categoryId === cat.id}
                onClick={() => setCategoryId(cat.id)}
              >
                <span>{cat.icon ?? '📦'}</span>
                <span>{cat.name}</span>
              </CategoryChip>
            ))}
          </CategoryStrip>
        )}

        {/* 계좌 선택 */}
        <AccountRow>
          <span
            css={css`
              color: ${theme.colors.text3};
              font-size: 13px;
            `}
          >
            계좌
          </span>
          <AccountChips>
            {accounts?.map((a) => (
              <Chip
                key={a.id}
                $active={accountId === a.id}
                onClick={() => setAccountId(a.id)}
              >
                {a.name}
              </Chip>
            ))}
          </AccountChips>
        </AccountRow>

        {/* 넘패드 */}
        <NumericPad onDigit={handleDigit} onDelete={handleDelete} />

        {/* 저장 버튼 */}
        <SaveButton
          type="button"
          disabled={!canSave || saving}
          onClick={handleSave}
          onPointerDown={handleSavePointerDown}
          onPointerUp={handleSavePointerUp}
          onPointerLeave={handleSavePointerUp}
        >
          {saving ? '저장 중…' : `저장하기${amount > 0 ? ` · ${formatCurrency(amount)}` : ''}`}
        </SaveButton>

        {continuousMode && (
          <ContinuousHint>연속 입력 모드 · 길게 누르면 활성화</ContinuousHint>
        )}

        {toast && <Toast>{toast}</Toast>}
      </Sheet>
    </>
  );
}

// ── Styles ────────────────────────────────────

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 90;
  animation: fadeIn 0.3s ease-out;
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const Sheet = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']} ${({ theme }) => theme.radius['2xl']} 0 0;
  padding: 12px 16px 24px;
  z-index: 100;
  animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  @keyframes slideUp {
    from { transform: translate(-50%, 100%); }
    to { transform: translate(-50%, 0); }
  }
`;

const DragHandle = styled.div`
  width: 40px;
  height: 4px;
  background: ${({ theme }) => theme.colors.text4};
  border-radius: 2px;
  margin: 0 auto 12px;
`;

const SheetHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.text3};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const DateChip = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
  background: ${({ theme }) => theme.colors.bgChip};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radius.pill};
`;

const TypeToggle = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.colors.bg};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 3px;
  margin-bottom: 16px;
`;

const TypeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ $active, theme }) => ($active ? theme.colors.bgElev2 : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.text : theme.colors.text4)};
  transition: all 0.15s;
`;

const AmountDisplay = styled.div`
  text-align: center;
  margin-bottom: 12px;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AmountText = styled.span<{ $hasValue: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize['5xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extrabold};
  font-variant-numeric: tabular-nums;
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tightest};
  color: ${({ theme, $hasValue }) => ($hasValue ? theme.colors.text : theme.colors.text4)};
`;

const MemoInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.bg};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  margin-bottom: 12px;
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text4};
  }

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: -2px;
  }
`;

const CategoryStrip = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0 12px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const CategoryChip = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  white-space: nowrap;
  flex-shrink: 0;
  background: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.bgChip)};
  color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.text2)};
  border: ${({ $active }) => ($active ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent')};
  transition: all 0.15s;
`;

const AccountSection = styled.div`
  margin-bottom: 12px;
`;

const SectionLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 6px;
  display: block;
`;

const AccountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const AccountChips = styled.div`
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  white-space: nowrap;
  flex-shrink: 0;
  background: ${({ $active, theme }) => ($active ? theme.colors.accent : theme.colors.bgChip)};
  color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.text2)};
  transition: all 0.15s;
`;

const SaveButton = styled.button`
  width: 100%;
  height: 56px;
  margin-top: 8px;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  box-shadow: ${({ theme }) => theme.shadow.btn};
  transition: all 0.15s;
  touch-action: manipulation;

  &:disabled {
    background: ${({ theme }) => theme.colors.bgElev2};
    color: ${({ theme }) => theme.colors.text4};
    box-shadow: none;
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }
`;

const ContinuousHint = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text4};
  margin-top: 8px;
`;

const Toast = styled.div`
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.bgChip};
  color: ${({ theme }) => theme.colors.text};
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  z-index: 200;
  animation: fadeIn 0.2s ease-out;
`;
