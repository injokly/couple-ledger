import styled from '@emotion/styled';

export function meta() {
  return [{ title: '카테고리 관리 · 우리 가계' }];
}

export default function CategoriesSettingsPage() {
  return (
    <Container>
      <Placeholder>카테고리 관리 — Spec 02에서 구현 예정</Placeholder>
    </Container>
  );
}

const Container = styled.div`
  padding: 24px 14px;
`;

const Placeholder = styled.p`
  color: ${({ theme }) => theme.colors.text3};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
`;
