import { test, expect } from '@playwright/test';

/**
 * 10초 규칙 검증 테스트.
 *
 * MVP의 핵심 UX 약속: 거래 1건 기록이 앱 실행부터 저장 완료까지 10초 이내.
 * 이 테스트가 실패하면 빠른입력 모달 UX를 재검토해야 한다.
 *
 * 스펙: specs/phase-1/04-quick-input.md
 */

test.describe('10초 규칙 — 빠른입력', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: 로그인 상태 셋업 (지금은 placeholder)
    await page.goto('/');
  });

  test('지출 1건 기록이 10초 이내 완료된다', async ({ page }) => {
    const start = Date.now();

    // 1. FAB 탭
    await page.getByTestId('fab-quick-input').tap();

    // 2. 금액 입력 (12,500원)
    await page.getByRole('button', { name: '1', exact: true }).tap();
    await page.getByRole('button', { name: '2', exact: true }).tap();
    await page.getByRole('button', { name: '5', exact: true }).tap();
    await page.getByRole('button', { name: '00', exact: true }).tap();

    // 3. 카테고리 선택 (식비)
    await page.getByRole('button', { name: '식비' }).tap();

    // 4. 저장
    await page.getByRole('button', { name: /저장하기/ }).tap();

    // 5. 리스트 반영 확인 (optimistic)
    await expect(page.getByText('−12,500원').first()).toBeVisible({ timeout: 3000 });

    const elapsed = Date.now() - start;
    console.log(`10초 규칙 측정: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(10000);
  });
});
