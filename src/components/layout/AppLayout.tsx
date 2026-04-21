/**
 * 하단 탭바 레이아웃.
 * 모든 메인 라우트에서 공통 사용.
 *
 * 실제 구현: specs/phase-1/06-home-dashboard.md 의 "5탭 구조" 참조.
 */

import styled from '@emotion/styled';
import { Outlet, Link, useLocation } from 'react-router';

import { AuthGuard } from '@/features/auth/components/AuthGuard';
import { QuickInputModal } from '@/features/transactions/components/QuickInputModal';
import { useQuickInputStore } from '@/stores/quickInput';

const TABS = [
  { path: '/', label: '홈', icon: '⌂' },
  { path: '/transactions', label: '거래', icon: '≡' },
  { path: '/assets', label: '자산', icon: '◐' },
  { path: '/settings', label: '설정', icon: '✦' },
] as const;

export function AppLayout() {
  const location = useLocation();
  const openQuickInput = useQuickInputStore((s) => s.open);

  return (
    <AuthGuard>
    <Container>
      <Content>
        <Outlet />
      </Content>

      <TabBar>
        <Tab to={TABS[0].path} $active={location.pathname === TABS[0].path}>
          <Icon>{TABS[0].icon}</Icon>
          <Label>{TABS[0].label}</Label>
        </Tab>
        <Tab to={TABS[1].path} $active={location.pathname.startsWith(TABS[1].path)}>
          <Icon>{TABS[1].icon}</Icon>
          <Label>{TABS[1].label}</Label>
        </Tab>

        <FabWrap>
          <Fab
            type="button"
            data-testid="fab-quick-input"
            aria-label="거래 기록"
            onClick={() => openQuickInput()}
          >
            +
          </Fab>
        </FabWrap>

        <Tab to={TABS[2].path} $active={location.pathname.startsWith(TABS[2].path)}>
          <Icon>{TABS[2].icon}</Icon>
          <Label>{TABS[2].label}</Label>
        </Tab>
        <Tab to={TABS[3].path} $active={location.pathname.startsWith(TABS[3].path)}>
          <Icon>{TABS[3].icon}</Icon>
          <Label>{TABS[3].label}</Label>
        </Tab>
      </TabBar>
      <QuickInputModal />
    </Container>
    </AuthGuard>
  );
}

const Container = styled.div`
  max-width: 420px;
  margin: 0 auto;
  min-height: 100vh;
  position: relative;
`;

const Content = styled.main`
  padding-bottom: 100px;
`;

const TabBar = styled.nav`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 420px;
  background: rgba(10, 11, 14, 0.92);
  backdrop-filter: blur(14px);
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 8px 0 22px;
  display: grid;
  grid-template-columns: 1fr 1fr 80px 1fr 1fr;
  align-items: center;
  z-index: 50;
`;

const Tab = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$active',
})<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: ${({ theme, $active }) => ($active ? theme.colors.text : theme.colors.text4)};
  padding: 6px 0;
  text-decoration: none;
`;

const Icon = styled.span`
  font-size: 18px;
  line-height: 1;
`;

const Label = styled.span`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const FabWrap = styled.div`
  display: flex;
  justify-content: center;
`;

const Fab = styled.button`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 300;
  line-height: 0;
  padding-bottom: 4px;
  margin-top: -26px;
  box-shadow: ${({ theme }) => theme.shadow.fab};
  transition: transform 0.15s;

  &:hover {
    transform: translateY(-2px);
  }
`;
