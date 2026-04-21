/**
 * 인증 가드.
 * 비인증 사용자를 /auth/signin으로 리다이렉트.
 */

import styled from '@emotion/styled';
import { Navigate } from 'react-router';

import { useAuthStore } from '@/stores/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const userId = useAuthStore((s) => s.userId);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <LoadingWrap>
        <LoadingText>로딩 중…</LoadingText>
      </LoadingWrap>
    );
  }

  if (!userId) return <Navigate to="/auth/signin" replace />;

  return <>{children}</>;
}

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #000;
`;

const LoadingText = styled.span`
  color: #5c5f66;
  font-size: 14px;
`;
