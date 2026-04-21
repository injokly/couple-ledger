/**
 * 홈 대시보드 (/).
 *
 * ⚠️ 이 파일은 placeholder입니다.
 * 실제 구현: specs/phase-1/06-home-dashboard.md 참조.
 */

import styled from '@emotion/styled';

export function meta() {
  return [
    { title: '우리 가계' },
    { name: 'description', content: '부부 공유 자산관리' },
  ];
}

export default function HomePage() {
  return (
    <Container>
      <Title>우리 가계</Title>
      <Message>
        이 화면은 아직 구현되지 않았습니다.
        <br />
        <code>specs/phase-1/06-home-dashboard.md</code> 를 참조하여 구현하세요.
      </Message>
    </Container>
  );
}

const Container = styled.main`
  max-width: 420px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: 100vh;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin-bottom: 16px;
`;

const Message = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text3};
  line-height: 1.6;

  code {
    font-family: ${({ theme }) => theme.typography.fontFamily.mono};
    background: ${({ theme }) => theme.colors.bgElev};
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
  }
`;
