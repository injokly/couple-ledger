import styled from '@emotion/styled';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSignUp } from '@/features/auth/hooks';

export function meta() {
  return [{ title: '회원가입 · 우리 가계' }];
}

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') ?? undefined;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSignUp = useSignUp();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다');
      return;
    }

    setSubmitting(true);
    try {
      await handleSignUp({ email, password, displayName, inviteToken });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
      setSubmitting(false);
    }
  }

  return (
    <Container>
      <Header>
        <Title>우리 가계</Title>
        <Subtitle>
          {inviteToken ? '초대를 받으셨군요! 가입 후 합류합니다.' : '새 가계를 시작하세요'}
        </Subtitle>
      </Header>

      <Form onSubmit={onSubmit}>
        <Input
          id="displayName"
          type="text"
          label="이름"
          placeholder="홈에서 표시될 이름"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="name"
          required
        />
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
          autoComplete="new-password"
          minLength={8}
          required
        />
        {error && <ErrorBanner>{error}</ErrorBanner>}
        <Button type="submit" size="lg" fullWidth disabled={submitting}>
          {submitting ? '가입 중…' : inviteToken ? '가입하고 합류하기' : '가입하기'}
        </Button>
      </Form>

      <Footer>
        이미 계정이 있으신가요? <StyledLink to="/auth/signin">로그인</StyledLink>
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
