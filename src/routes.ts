import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

// React Router v7 Framework mode: 명시적 라우트 선언.

export default [
  layout('components/layout/AppLayout.tsx', [
    index('routes/_index.tsx'),
    route('transactions', 'routes/transactions._index.tsx'),
    route('transactions/:id', 'routes/transactions.$id.tsx'),
    route('assets', 'routes/assets._index.tsx'),
    route('assets/snapshot/new', 'routes/assets.snapshot.new.tsx'),
    route('settings', 'routes/settings._index.tsx'),
    route('settings/accounts', 'routes/settings.accounts.tsx'),
    route('settings/categories', 'routes/settings.categories.tsx'),
    route('settings/household', 'routes/settings.household.tsx'),
  ]),
  // 인증 라우트는 레이아웃(탭바) 밖
  route('auth/signin', 'routes/auth.signin.tsx'),
  route('auth/signup', 'routes/auth.signup.tsx'),
] satisfies RouteConfig;
