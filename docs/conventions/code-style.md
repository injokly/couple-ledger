# Code Style

## TypeScript

- `strict: true` (tsconfig 전체)
- `any` 금지. `unknown` 사용 후 좁히기
- 함수 반환 타입 명시 (특히 export)
- enum 대신 union literal type 사용:
  ```ts
  // ❌
  enum Status { Pending, Active, Done }
  
  // ✅
  type Status = 'pending' | 'active' | 'done'
  ```
- Supabase generated 타입을 기반으로 엔티티 타입 확장

## 네이밍

- 파일: `kebab-case.tsx` (`quick-input-modal.tsx`)
- 컴포넌트: `PascalCase`
- 훅: `useCamelCase`
- 상수: `UPPER_SNAKE_CASE` (진짜 불변일 때만)
- 타입: `PascalCase`, 접미사 없음 (`Transaction`, 아니면 `TransactionRow`)
- 한국어 변수명 금지 (주석은 한국어 OK)

## React

- 함수 컴포넌트만. class 컴포넌트 금지
- Props 인터페이스는 `${ComponentName}Props`
- 기본 export 하나만 (named export는 유틸/훅)
- `React.FC` 쓰지 말 것 (children 자동 추론 이슈)
- Hooks는 최상단에 모아서 선언 → 계산 → 렌더링 순

```tsx
// 좋은 예
export function TransactionRow({ transaction }: TransactionRowProps) {
  // 1. Hooks
  const { data: category } = useCategory(transaction.categoryId);
  const formatted = useMemo(() => formatCurrency(transaction.amount), [transaction.amount]);
  
  // 2. 파생값
  const isExpense = transaction.type === 'expense';
  
  // 3. 핸들러
  const handleEdit = () => { /* ... */ };
  
  // 4. 렌더
  return <Row>...</Row>;
}
```

## Emotion

- `styled` 우선 사용, 복잡한 동적 스타일만 `css` prop
- Theme 접근: `({ theme }) => theme.colors.up`
- 인라인 스타일 금지 (불가피할 때만)

```tsx
// ✅
const Amount = styled.span<{ isExpense: boolean }>`
  color: ${({ theme, isExpense }) => isExpense ? theme.colors.text : theme.colors.up};
  font-variant-numeric: tabular-nums;
`;

// ❌
<span style={{ color: isExpense ? '#FFF' : '#EB4D3D' }}>
```

## 주석

- **왜** 를 적어라. **무엇** 을 적지 마라 (코드가 이미 무엇을 함)
- TODO는 GitHub Issue 번호 필수: `// TODO(#123): ...`
- 한국어 주석 OK

## 에러 처리

- Supabase 에러는 사용자 친화적 메시지로 변환
- Sentry/로깅은 Phase 1 범위 밖 (console.error 허용)
- 에러 바운더리는 라우트 경계에만

## Import 순서

```ts
// 1. React
import { useState } from 'react';
// 2. 외부 라이브러리
import { styled } from '@emotion/styled';
import useSWR from 'swr';
// 3. 내부 절대 경로
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
// 4. 같은 feature 내부
import { useTransactions } from './hooks';
// 5. 타입
import type { Transaction } from '@/types/app';
```

ESLint `eslint-plugin-import` 로 자동화.

## 금지

- `console.log` (`console.error` 만 허용, 프로덕션엔 제거)
- `// @ts-ignore` (`// @ts-expect-error` 와 설명 주석은 OK)
- `JSON.parse` 결과를 바로 타입 단언
- `== null` 아닌 경우 `===` 만 사용
- 3중 이상 중첩 삼항 연산자
- 같은 파일에서 default export + named export 혼용 (컴포넌트 파일 제외)

## 파일 크기 가이드

- 컴포넌트 파일: 200줄 이하 권장, 300줄 넘으면 분리 검토
- 훅 파일: 100줄 이하
- 유틸: 한 파일에 관련된 함수만, 80줄 이하

## 예시 폴더 레이아웃

```
features/transactions/
├── components/
│   ├── TransactionRow.tsx
│   ├── QuickInputModal.tsx
│   ├── NumericPad.tsx           # 빠른입력 전용이면 여기
│   └── index.ts                 # barrel export (필요할 때만)
├── hooks/
│   ├── useTransactions.ts
│   ├── useCreateTransaction.ts
│   └── useUpdateTransaction.ts
├── api.ts                       # Supabase 쿼리 함수 모음
├── types.ts                     # 이 feature 내부 타입
└── utils.ts                     # 금액 포맷 등 (재사용 시 /lib 으로)
```
