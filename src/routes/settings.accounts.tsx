import styled from '@emotion/styled';
import { useState } from 'react';
import { Link } from 'react-router';

import type { Account, AccountType, HouseholdMember } from '@/types/app';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  createAccount,
  updateAccount,
} from '@/features/accounts/api';
import { useAccounts } from '@/features/accounts/hooks';
import { useHouseholdMembers } from '@/features/auth/hooks';
import { useAuthStore } from '@/stores/auth';


const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'cash', label: '현금' },
  { value: 'savings', label: '예적금' },
  { value: 'investment', label: '투자' },
  { value: 'real_estate', label: '부동산' },
  { value: 'pension', label: '연금' },
  { value: 'loan', label: '대출' },
  { value: 'other', label: '기타' },
];

const PRESET_COLORS = [
  '#EB4D3D', '#3182F6', '#1CB572', '#F5A623',
  '#A487F0', '#FF6B9D', '#00BCD4', '#8BC34A',
  '#FF5722', '#607D8B', '#9C27B0', '#795548',
];

export function meta() {
  return [{ title: '계좌 관리 · 우리 가계' }];
}

export default function AccountsSettingsPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;
  const [showArchived, setShowArchived] = useState(false);
  const { data: accounts, mutate: mutateAccounts } = useAccounts(householdId, showArchived);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: members } = useHouseholdMembers(householdId);
  const activeAccounts = (accounts ?? []).filter((a) => !a.isArchived);
  const archivedAccounts = (accounts ?? []).filter((a) => a.isArchived);

  function getOwnerName(ownerMemberId: string | null) {
    if (!ownerMemberId) return '공동';
    const m = members?.find((mem) => mem.id === ownerMemberId);
    return m?.displayName ?? '';
  }

  async function handleArchive(account: Account) {
    await updateAccount(account.id, { isArchived: !account.isArchived });
    await mutateAccounts();
  }

  return (
    <Container>
      <BackLink to="/settings">← 설정</BackLink>
      <Header>
        <PageTitle>계좌 관리</PageTitle>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          + 추가
        </Button>
      </Header>

      {activeAccounts.map((account) => (
        <AccountRow key={account.id}>
          <AccountIcon $color={account.color ?? '#3182F6'}>
            {account.icon ?? '💳'}
          </AccountIcon>
          <AccountInfo>
            <AccountNameRow>
              <AccountName>{account.name}</AccountName>
              <OwnerTag $color={
                account.ownerMemberId
                  ? members?.find((m) => m.id === account.ownerMemberId)?.color ?? '#3182F6'
                  : '#5C5F66'
              }>
                {getOwnerName(account.ownerMemberId)}
              </OwnerTag>
            </AccountNameRow>
            <AccountMeta>
              {ACCOUNT_TYPES.find((t) => t.value === account.type)?.label}
              {account.institution && ` · ${account.institution}`}
            </AccountMeta>
          </AccountInfo>
          <Actions>
            <SmallButton onClick={() => setEditingAccount(account)}>편집</SmallButton>
            <SmallButton onClick={() => handleArchive(account)}>숨기기</SmallButton>
          </Actions>
        </AccountRow>
      ))}

      {archivedAccounts.length > 0 && (
        <>
          <ToggleArchived onClick={() => setShowArchived(!showArchived)}>
            숨긴 계좌 {archivedAccounts.length}개 {showArchived ? '접기 ▲' : '보기 ▼'}
          </ToggleArchived>
          {showArchived &&
            archivedAccounts.map((account) => (
              <AccountRow key={account.id} $archived>
                <AccountIcon $color={account.color ?? '#5C5F66'}>
                  {account.icon ?? '💳'}
                </AccountIcon>
                <AccountInfo>
                  <AccountName $archived>{account.name}</AccountName>
                </AccountInfo>
                <SmallButton onClick={() => handleArchive(account)}>복원</SmallButton>
              </AccountRow>
            ))}
        </>
      )}

      {(showAddModal || editingAccount) && (
        <AccountFormModal
          account={editingAccount}
          householdId={householdId!}
          memberId={member?.id}
          members={members ?? []}
          onClose={() => {
            setShowAddModal(false);
            setEditingAccount(null);
          }}
          onSaved={async () => {
            await mutateAccounts();
            setShowAddModal(false);
            setEditingAccount(null);
          }}
        />
      )}
    </Container>
  );
}

// ── Account Form Modal ──────────────────────

function AccountFormModal({
  account,
  householdId,
  memberId,
  members,
  onClose,
  onSaved,
}: {
  account: Account | null;
  householdId: string;
  memberId: string | undefined;
  members: HouseholdMember[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'cash');
  const [institution, setInstitution] = useState(account?.institution ?? '');
  const [color, setColor] = useState(account?.color ?? PRESET_COLORS[1]!);
  const [ownerMemberId, setOwnerMemberId] = useState<string | null>(
    account?.ownerMemberId ?? memberId ?? null,
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (account) {
        await updateAccount(account.id, { name, type, institution: institution || null, color, ownerMemberId });
      } else {
        await createAccount({
          householdId,
          name,
          type,
          institution: institution || undefined,
          color,
          ownerMemberId,
          createdBy: memberId,
        });
      }
      onSaved();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{account ? '계좌 편집' : '계좌 추가'}</ModalTitle>
        <Form onSubmit={handleSubmit}>
          <Input
            id="accountName"
            label="이름"
            placeholder="KB 급여통장"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Label>유형</Label>
          <TypeGrid>
            {ACCOUNT_TYPES.map((t) => (
              <TypeChip
                key={t.value}
                type="button"
                $active={type === t.value}
                onClick={() => setType(t.value)}
              >
                {t.label}
              </TypeChip>
            ))}
          </TypeGrid>
          <Label>소유자</Label>
          <TypeGrid>
            {members.map((m) => (
              <TypeChip
                key={m.id}
                type="button"
                $active={ownerMemberId === m.id}
                onClick={() => setOwnerMemberId(m.id)}
              >
                {m.displayName}
              </TypeChip>
            ))}
            <TypeChip
              type="button"
              $active={ownerMemberId === null}
              onClick={() => setOwnerMemberId(null)}
            >
              공동
            </TypeChip>
          </TypeGrid>
          <Input
            id="institution"
            label="금융기관 (선택)"
            placeholder="KB, 삼성증권"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
          <Label>색상</Label>
          <ColorGrid>
            {PRESET_COLORS.map((c) => (
              <ColorChip
                key={c}
                type="button"
                $color={c}
                $active={color === c}
                onClick={() => setColor(c)}
              />
            ))}
          </ColorGrid>
          <Button type="submit" size="lg" fullWidth disabled={submitting || !name.trim()}>
            {submitting ? '저장 중…' : '저장'}
          </Button>
        </Form>
      </Modal>
    </Backdrop>
  );
}

// ── Styles ────────────────────────────────────

const Container = styled.div`
  padding: 24px 14px;
`;

const BackLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 16px;
  display: inline-block;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
`;

const AccountRow = styled.div<{ $archived?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: 6px;
  opacity: ${({ $archived }) => ($archived ? 0.5 : 1)};
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

const AccountName = styled.span<{ $archived?: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, $archived }) => ($archived ? theme.colors.text3 : theme.colors.text)};
  display: block;
`;

const AccountMeta = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
`;

const SmallButton = styled.button`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text3};
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgElev2};
  }
`;

const ToggleArchived = styled.button`
  width: 100%;
  padding: 12px;
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
  text-align: center;
  margin: 8px 0;
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  width: 100%;
  max-width: 420px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']} ${({ theme }) => theme.radius['2xl']} 0 0;
  padding: 24px 20px 40px;
  max-height: 85vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 20px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text2};
`;

const TypeGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const TypeChip = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.pill};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ theme, $active }) => ($active ? theme.colors.accent : theme.colors.bgChip)};
  color: ${({ theme, $active }) => ($active ? '#fff' : theme.colors.text2)};
  transition: background 0.15s;
`;

const ColorGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ColorChip = styled.button<{ $color: string; $active: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 2px solid ${({ $active, theme }) => ($active ? '#fff' : theme.colors.border)};
  transition: border-color 0.15s;
`;
