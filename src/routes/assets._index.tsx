import styled from '@emotion/styled';

export function meta() {
  return [{ title: '자산 · 우리 가계' }];
}

export default function AssetsPage() {
  return (
    <Container>
      <Title>자산</Title>
      <Placeholder>Spec 05에서 구현 예정</Placeholder>
    </Container>
  );
}

const Container = styled.div`
  padding: 24px 14px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  margin-bottom: 16px;
`;

const Placeholder = styled.p`
  color: ${({ theme }) => theme.colors.text3};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
`;
