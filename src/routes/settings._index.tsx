import styled from '@emotion/styled';
import { Link } from 'react-router';

import { useAuthStore } from '@/stores/auth';
import { useSignOut } from '@/features/auth/hooks';

export function meta() {
  return [{ title: '설정 · 우리 가계' }];
}

export default function SettingsPage() {
  const member = useAuthStore((s) => s.member);
  const handleSignOut = useSignOut();

  return (
    <Container>
      <PageTitle>설정</PageTitle>

      {member && (
        <ProfileCard>
          <ColorDot $color={member.color ?? '#3182F6'} />
          <ProfileInfo>
            <Name>{member.displayName}</Name>
            <Role>{member.role === 'owner' ? '관리자' : '멤버'}</Role>
          </ProfileInfo>
        </ProfileCard>
      )}

      <Section>
        <SectionTitle>가계 관리</SectionTitle>
        <MenuLink to="/settings/household">가정 멤버 관리</MenuLink>
        <MenuLink to="/settings/accounts">계좌 관리</MenuLink>
        <MenuLink to="/settings/categories">카테고리 관리</MenuLink>
      </Section>

      <LogoutButton type="button" onClick={handleSignOut}>
        로그아웃
      </LogoutButton>
    </Container>
  );
}

const Container = styled.div`
  padding: 24px 14px;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
  margin-bottom: 24px;
`;

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius['2xl']};
  margin-bottom: 24px;
`;

const ColorDot = styled.span<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Name = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
`;

const Role = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 8px;
  padding: 0 4px;
`;

const MenuLink = styled(Link)`
  display: block;
  padding: 14px 20px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  margin-bottom: 4px;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgElev2};
  }
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 14px;
  background: transparent;
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-top: 16px;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.dangerSoft};
  }
`;
