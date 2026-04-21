import styled from '@emotion/styled';
import { useState } from 'react';
import { Link } from 'react-router';

import type { Category } from '@/types/app';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  checkCategoryTransactionCount,
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/features/categories/api';
import { useCategories } from '@/features/categories/hooks';
import { useAuthStore } from '@/stores/auth';


export function meta() {
  return [{ title: '카테고리 관리 · 우리 가계' }];
}

export default function CategoriesSettingsPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const { data: categories, mutate: mutateCategories } = useCategories(
    householdId,
    activeTab,
    true,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const activeCategories = (categories ?? []).filter((c) => !c.isArchived);
  const archivedCategories = (categories ?? []).filter((c) => c.isArchived);

  async function handleDelete(cat: Category) {
    setDeleteError('');
    if (cat.isDefault) {
      setDeleteError('기본 카테고리는 삭제할 수 없습니다. 아카이브하세요.');
      return;
    }
    const count = await checkCategoryTransactionCount(cat.id);
    if (count > 0) {
      setDeleteError(`${count}건의 거래가 연결되어 있어 삭제할 수 없습니다.`);
      return;
    }
    await deleteCategory(cat.id);
    await mutateCategories();
  }

  async function handleArchive(cat: Category) {
    await updateCategory(cat.id, { isArchived: !cat.isArchived });
    await mutateCategories();
  }

  return (
    <Container>
      <BackLink to="/settings">← 설정</BackLink>
      <Header>
        <PageTitle>카테고리 관리</PageTitle>
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          + 추가
        </Button>
      </Header>

      <Tabs>
        <Tab $active={activeTab === 'expense'} onClick={() => setActiveTab('expense')}>
          지출
        </Tab>
        <Tab $active={activeTab === 'income'} onClick={() => setActiveTab('income')}>
          수입
        </Tab>
      </Tabs>

      {deleteError && <ErrorBanner>{deleteError}</ErrorBanner>}

      {activeCategories.map((cat) => (
        <CategoryRow key={cat.id}>
          <IconTile>{cat.icon ?? '📦'}</IconTile>
          <CatName>{cat.name}</CatName>
          {cat.isDefault && <DefaultBadge>기본</DefaultBadge>}
          <Actions>
            <SmallButton onClick={() => setEditingCategory(cat)}>편집</SmallButton>
            <SmallButton onClick={() => handleArchive(cat)}>숨기기</SmallButton>
            {!cat.isDefault && <SmallButton onClick={() => handleDelete(cat)}>삭제</SmallButton>}
          </Actions>
        </CategoryRow>
      ))}

      {archivedCategories.length > 0 && (
        <ArchivedSection>
          <ArchivedTitle>숨긴 카테고리 ({archivedCategories.length})</ArchivedTitle>
          {archivedCategories.map((cat) => (
            <CategoryRow key={cat.id} $archived>
              <IconTile>{cat.icon ?? '📦'}</IconTile>
              <CatName $archived>{cat.name}</CatName>
              <SmallButton onClick={() => handleArchive(cat)}>복원</SmallButton>
            </CategoryRow>
          ))}
        </ArchivedSection>
      )}

      {(showAddModal || editingCategory) && (
        <CategoryFormModal
          category={editingCategory}
          type={activeTab}
          householdId={householdId!}
          onClose={() => {
            setShowAddModal(false);
            setEditingCategory(null);
          }}
          onSaved={async () => {
            await mutateCategories();
            setShowAddModal(false);
            setEditingCategory(null);
          }}
        />
      )}
    </Container>
  );
}

function CategoryFormModal({
  category,
  type,
  householdId,
  onClose,
  onSaved,
}: {
  category: Category | null;
  type: 'income' | 'expense';
  householdId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? '');
  const [icon, setIcon] = useState(category?.icon ?? '📦');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (category) {
        await updateCategory(category.id, { name, icon });
      } else {
        await createCategory({ householdId, name, type, icon });
      }
      onSaved();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <Backdrop onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{category ? '카테고리 편집' : '카테고리 추가'}</ModalTitle>
        <Form onSubmit={handleSubmit}>
          <Input
            id="catName"
            label="이름"
            placeholder="카테고리명"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="catIcon"
            label="아이콘 (이모지)"
            placeholder="🍜"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
          <Button type="submit" size="lg" fullWidth disabled={submitting || !name.trim()}>
            {submitting ? '저장 중…' : '저장'}
          </Button>
        </Form>
      </Modal>
    </Backdrop>
  );
}

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

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: 4px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  background: ${({ theme, $active }) => ($active ? theme.colors.accent : 'transparent')};
  color: ${({ theme, $active }) => ($active ? '#fff' : theme.colors.text3)};
  transition: background 0.15s;
`;

const ErrorBanner = styled.div`
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.dangerSoft};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  margin-bottom: 12px;
`;

const CategoryRow = styled.div<{ $archived?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: 4px;
  opacity: ${({ $archived }) => ($archived ? 0.5 : 1)};
`;

const IconTile = styled.span`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
`;

const CatName = styled.span<{ $archived?: boolean }>`
  flex: 1;
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme, $archived }) => ($archived ? theme.colors.text3 : theme.colors.text)};
`;

const DefaultBadge = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text3};
  background: ${({ theme }) => theme.colors.bgChip};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
`;

const Actions = styled.div`
  display: flex;
  gap: 2px;
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

const ArchivedSection = styled.div`
  margin-top: 16px;
`;

const ArchivedTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text4};
  margin-bottom: 8px;
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
