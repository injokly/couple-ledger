/**
 * 인증 가드.
 * 비인증 사용자를 /auth/signin으로 리다이렉트.
 */

import { Navigate } from 'react-router';

import { useAuthStore } from '@/stores/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const userId = useAuthStore((s) => s.userId);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) return null;
  if (!userId) return <Navigate to="/auth/signin" replace />;

  return <>{children}</>;
}
