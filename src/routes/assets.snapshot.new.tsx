import styled from '@emotion/styled';

export function meta() {
  return [{ title: '자산 스냅샷 · 우리 가계' }];
}

export default function SnapshotNewPage() {
  return (
    <Container>
      <Placeholder>자산 스냅샷 입력 — Spec 05에서 구현 예정</Placeholder>
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
