# Spec 03 — 거래 (Transactions)

## 목표

수입/지출/이체 거래를 생성·조회·수정·삭제할 수 있다.

## 의존성

- `02-accounts-categories.md` 완료 (accounts, categories 존재)

## DB 요구사항

마이그레이션: `supabase/migrations/005_transactions.sql`

`docs/02-data-model.md` 의 `transactions` 테이블 참조. 핵심 제약:

```sql
check (
  (type = 'transfer' and to_account_id is not null and category_id is null) or
  (type in ('income','expense') and to_account_id is null and category_id is not null)
)
```

## API 함수

```ts
// src/features/transactions/api.ts
export async function createTransaction(input: CreateTransactionInput): Promise<Transaction>;
export async function updateTransaction(id: string, updates: UpdateTransactionInput): Promise<Transaction>;
export async function deleteTransaction(id: string): Promise<void>;
export async function listTransactions(options: ListOptions): Promise<Transaction[]>;
export async function getTransaction(id: string): Promise<Transaction | null>;
```

### ListOptions

```ts
interface ListOptions {
  householdId: string;
  from?: Date;            // 기본: 이번 달 1일
  to?: Date;              // 기본: 오늘
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  accountId?: string;
  tags?: string[];        // 배열 겹침 검색
  search?: string;        // 메모 텍스트 검색
  limit?: number;         // 기본 50
  cursor?: string;        // 페이지네이션
}
```

## 훅

```ts
// features/transactions/hooks/
export function useTransactions(options?: Partial<ListOptions>): SWRResponse<Transaction[]>;
export function useTransaction(id: string | undefined): SWRResponse<Transaction | null>;
export function useCreateTransaction(): { mutate, isLoading, error };
export function useUpdateTransaction(): { mutate, isLoading, error };
export function useDeleteTransaction(): { mutate, isLoading, error };
```

**핵심**: 모든 mutation은 SWR optimistic update 필수.

```ts
export function useCreateTransaction() {
  const { mutate } = useSWRConfig();
  
  return {
    mutate: async (input: CreateTransactionInput) => {
      // 1. Optimistic update — 즉시 리스트에 추가
      const tempId = `temp-${Date.now()}`;
      const optimistic = { ...input, id: tempId, createdAt: new Date() };
      mutate(key => matchesTransactionList(key), (data: Transaction[] = []) => [optimistic, ...data], false);
      
      // 2. 실제 서버 호출
      try {
        const real = await createTransaction(input);
        // 3. temp 제거 + 실제 데이터 반영
        mutate(key => matchesTransactionList(key));
        return real;
      } catch (e) {
        // 4. 실패 시 롤백
        mutate(key => matchesTransactionList(key));
        throw e;
      }
    }
  };
}
```

## 수용 기준

- [ ] `createTransaction` 성공 시 `id`, `createdAt`, `createdBy` 반환
- [ ] `type='transfer'` 인데 `to_account_id` 누락 → DB CHECK 제약 에러
- [ ] `type='expense'` 인데 `category_id` 누락 → DB CHECK 제약 에러
- [ ] `amount <= 0` → CHECK 제약 에러
- [ ] optimistic update: 저장 버튼 클릭 → 리스트 즉시 반영 (50ms 이내)
- [ ] 저장 실패 시 토스트 + 리스트 롤백
- [ ] 수정 시 `updated_at` 자동 갱신 (DB 트리거)
- [ ] `created_by` 는 항상 현재 세션의 `household_member.id`
- [ ] 삭제는 soft delete 아닌 실제 삭제 (거래는 간단 모델)
- [ ] 다른 household의 거래 조회/수정/삭제 불가 (RLS)
- [ ] 태그 배열 GIN 인덱스로 검색 동작
- [ ] 메모 텍스트 검색 (ILIKE %...%)

## 개방 질문

1. 거래 편집 이력(audit log) 필요? → **Phase 1은 skip, Phase 2 이후 검토.**
2. 다중 통화 거래 (해외여행 달러 지출 등)? → **Phase 1은 KRW only. `currency` 컬럼은 존재하되 기본값만 사용.**
3. 반복 거래 참조(`recurring_template_id`) 컬럼은 Phase 1에 만들까? → **만들되 NULL 허용. Phase 2에서 채움.**

## 테스트

- 유닛: `matchesTransactionList` 헬퍼 (캐시 키 매칭)
- 통합: CHECK 제약 위반 케이스 각 조합
- 통합: RLS — 다른 household 거래 접근 불가
- E2E: 거래 생성 → 리스트 반영 → 수정 → 삭제
