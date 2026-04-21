import styled from '@emotion/styled';
import { useState } from 'react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/Button';
import { createInvite } from '@/features/auth/api';
import { useHouseholdMembers, useInvites } from '@/features/auth/hooks';
import { useAuthStore } from '@/stores/auth';

export function meta() {
  return [{ title: '가정 멤버 관리 · 우리 가계' }];
}

export default function HouseholdSettingsPage() {
  const member = useAuthStore((s) => s.member);
  const householdId = member?.householdId;
  const isOwner = member?.role === 'owner';

  const { data: members } = useHouseholdMembers(householdId);
  const { data: invites, mutate: mutateInvites } = useInvites(householdId);

  const [inviteLink, setInviteLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreateInvite() {
    if (!householdId) return;
    setCreating(true);
    try {
      const invite = await createInvite(householdId);
      const link = `${window.location.origin}/auth/signup?invite=${invite.token}`;
      setInviteLink(link);
      await mutateInvites();
    } catch {
      // 에러는 조용히 처리 — owner가 아닌 경우 RLS가 막음
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeInvites = (invites ?? []).filter(
    (inv) => new Date(inv.expiresAt) > new Date() && inv.useCount < inv.maxUses,
  );

  return (
    <Container>
      <BackLink to="/settings">← 설정</BackLink>
      <PageTitle>가정 멤버</PageTitle>

      <Section>
        <SectionTitle>멤버 ({members?.length ?? 0}명)</SectionTitle>
        {members?.map((m) => (
          <MemberRow key={m.id}>
            <Dot $color={m.color ?? '#3182F6'} />
            <MemberName>{m.displayName}</MemberName>
            <MemberRole>{m.role === 'owner' ? '관리자' : '멤버'}</MemberRole>
          </MemberRow>
        ))}
      </Section>

      {isOwner && (
        <Section>
          <SectionTitle>초대 링크</SectionTitle>
          <HelpText>링크는 24시간 후 만료되며, 1회만 사용 가능합니다.</HelpText>

          {inviteLink ? (
            <InviteBox>
              <InviteLinkText>{inviteLink}</InviteLinkText>
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? '복사됨!' : '복사'}
              </Button>
            </InviteBox>
          ) : (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleCreateInvite}
              disabled={creating}
            >
              {creating ? '생성 중…' : '초대 링크 생성'}
            </Button>
          )}

          {activeInvites.length > 0 && (
            <ActiveInvites>
              <SmallLabel>활성 초대 {activeInvites.length}개</SmallLabel>
            </ActiveInvites>
          )}
        </Section>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 24px 14px;
`;

const BackLink = styled(Link)`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 16px;
  display: inline-block;
`;

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: ${({ theme }) => theme.typography.letterSpacing.tighter};
  margin-bottom: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text2};
  margin-bottom: 12px;
`;

const HelpText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
  margin-bottom: 12px;
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: 4px;
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const MemberName = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  flex: 1;
`;

const MemberRole = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.base};
  color: ${({ theme }) => theme.colors.text3};
`;

const InviteBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.bgElev};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

const InviteLinkText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text2};
  word-break: break-all;
  flex: 1;
`;

const ActiveInvites = styled.div`
  margin-top: 12px;
`;

const SmallLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text4};
`;
