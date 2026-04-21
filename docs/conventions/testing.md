# Testing

## 원칙

**테스트는 가치 있는 곳에만.** 커버리지 목표 없음.

| 영역 | 테스트 수준 |
|---|---|
| 금액 계산, 날짜 처리 유틸 | 유닛 테스트 필수 |
| Supabase 쿼리 함수 | 통합 테스트 (local Supabase) |
| 커스텀 훅 | 로직 있으면 테스트 |
| UI 컴포넌트 | 인터랙션 있는 것만 (버튼, 폼) |
| 순수 표시 컴포넌트 | 테스트 생략 |
| 핵심 플로우 (빠른입력, 스냅샷) | E2E 필수 |

## 도구

- 유닛/통합: Vitest + Testing Library
- E2E: Playwright

## 파일 배치

```
src/features/transactions/
├── api.ts
├── api.test.ts              # 같은 폴더에 .test.ts
├── hooks/
│   ├── useTransactions.ts
│   └── useTransactions.test.ts
```

E2E는 별도 루트:
```
tests/e2e/
├── quick-input.spec.ts
├── monthly-snapshot.spec.ts
```

## 작성 패턴

### 유틸 (Vitest)

```ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('양수를 콤마 포맷으로 변환한다', () => {
    expect(formatCurrency(12500)).toBe('12,500원');
  });
  
  it('음수는 U+2212 마이너스를 사용한다', () => {
    expect(formatCurrency(-12500)).toBe('−12,500원');
  });
  
  it('0은 "0원"', () => {
    expect(formatCurrency(0)).toBe('0원');
  });
});
```

### Supabase 쿼리

`pnpm supabase start` 로 로컬 DB 띄운 상태에서 실행:

```ts
import { beforeEach, describe, it, expect } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createTransaction } from './api';

describe('createTransaction', () => {
  beforeEach(async () => {
    await supabase.from('transactions').delete().neq('id', '');
  });
  
  it('지출 거래를 생성한다', async () => {
    const result = await createTransaction({
      type: 'expense',
      amount: 12500,
      categoryId: 'cat-food',
      accountId: 'acc-main',
    });
    
    expect(result.id).toBeDefined();
    expect(result.amount).toBe(12500);
  });
  
  it('이체 거래는 to_account_id 필수', async () => {
    await expect(
      createTransaction({
        type: 'transfer',
        amount: 100000,
        accountId: 'acc-main',
        // to_account_id 누락
      } as any)
    ).rejects.toThrow();
  });
});
```

### E2E (Playwright)

```ts
import { test, expect } from '@playwright/test';

test('지출 1건 입력이 10초 이내 완료', async ({ page }) => {
  await page.goto('/');
  
  const start = Date.now();
  
  await page.getByRole('button', { name: '+' }).click();
  await page.getByText('1').click();
  await page.getByText('2').click();
  await page.getByText('5').click();
  await page.getByText('00').click();
  await page.getByRole('button', { name: '식비' }).click();
  await page.getByRole('button', { name: /저장하기/ }).click();
  
  await expect(page.getByText('−12,500원')).toBeVisible();
  
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(10000);
});
```

## Mocking

- Supabase: 통합 테스트에선 로컬 DB 사용, 모킹 지양
- 네트워크: MSW (Phase 2+ 에서 필요해지면)
- 시간: `vi.useFakeTimers()` 로 date 제어

## CI 명령어

```bash
pnpm test           # 전체 유닛/통합
pnpm test:watch     # 개발 중
pnpm test:e2e       # Playwright
pnpm test:ci        # CI 용 (빠지는 것 없이)
```
