import styled from '@emotion/styled';

export function meta() {
  return [{ title: '거래 상세 · 우리 가계' }];
}

export default function TransactionDetailPage() {
  return (
    <Container>
      <Placeholder>거래 상세 — Spec 07에서 구현 예정</Placeholder>
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
