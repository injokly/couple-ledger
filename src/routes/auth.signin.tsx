import styled from '@emotion/styled';
import { useState } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSignIn } from '@/features/auth/hooks';

export function meta() {
  return [{ title: '로그인 · 우리 가계' }];
}

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSignIn = useSignIn();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await handleSignIn({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다');
      setSubmitting(false);
    }
  }

  return (
    <Container>
      <Header>
        <Title>우리 가계</Title>
        <Subtitle>부부 공유 자산관리</Subtitle>
      </Header>

      <Form onSubmit={onSubmit}>
        <Input
          id="email"
          type="email"
          label="이메일"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          id="password"
          type="password"
          label="비밀번호"
          placeholder="8자 이상"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          minLength={8}
          required
        />
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? '로그인 중…' : '로그인'}
        </Button>
      </Form>

      <Footer>
        아직 계정이 없으신가요? <StyledLink to="/auth/signup">회원가입</StyledLink>
      </Footer>
    </Container>
  );
}

const Container = styled.div`
  max-width: 420px;
  margin: 0 auto;
  padding: 80px 24px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 48px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['3xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.extrabold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text3};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ErrorBanner = styled.div`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.dangerSoft};
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.typography.fontSize.base};
`;

const Footer = styled.p`
  margin-top: 24px;
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;
