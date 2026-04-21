# Spec 02 — 계좌 & 카테고리

## 목표

사용자가 자산 컨테이너(계좌, 부동산, 대출 등)와 거래 카테고리를 관리할 수 있다.

## 의존성

- `01-auth-household.md` 완료 (household 존재 전제)

## 사용자 시나리오

1. 설정 > 계좌 관리 → "계좌 추가" → KB 급여통장 추가
2. 설정 > 카테고리 관리 → "건강" 카테고리 추가 (기본 10개 외)
3. 계좌 아이콘 색상 커스터마이즈
4. 더 이상 쓰지 않는 계좌 아카이브 (삭제 아님)

## DB 요구사항

마이그레이션: `supabase/migrations/003_accounts.sql`, `004_categories.sql`

`docs/02-data-model.md` 의 `accounts`, `categories` 테이블 참조.

### 기본 카테고리 시드 함수

```sql
create or replace function seed_default_categories(p_household_id uuid)
returns void
language plpgsql
as $$
begin
  insert into categories (household_id, name, type, icon, display_order) values
    (p_household_id, '식비',     'expense', '🍜', 1),
    (p_household_id, '교통',     'expense', '🚕', 2),
    (p_household_id, '주거',     'expense', '🏠', 3),
    (p_household_id, '공과금',   'expense', '💡', 4),
    (p_household_id, '쇼핑',     'expense', '🛒', 5),
    (p_household_id, '여가',     'expense', '🎬', 6),
    (p_household_id, '의료',     'expense', '💊', 7),
    (p_household_id, '교육',     'expense', '📚', 8),
    (p_household_id, '경조사',   'expense', '🎁', 9),
    (p_household_id, '기타',     'expense', '📦', 10),
    (p_household_id, '월급',     'income',  '💼', 1),
    (p_household_id, '성과급',   'income',  '🎯', 2),
    (p_household_id, '이자/배당','income',  '💰', 3),
    (p_household_id, '부수입',   'income',  '✨', 4),
    (p_household_id, '기타',     'income',  '📥', 5);
end;
$$;
```

## 화면

### `/settings/accounts` — 계좌 목록

```
┌─────────────────────────────────┐
│  ← 계좌 관리              + 추가 │
├─────────────────────────────────┤
│  💳  KB 급여통장                │
│      현금  ·  KRW               │
├─────────────────────────────────┤
│  📈  토스증권                   │
│      투자  ·  KRW               │
├─────────────────────────────────┤
│  🏠  장안 힐스테이트            │
│      부동산  ·  KRW             │
├─────────────────────────────────┤
│  📋  아카이브된 계좌 보기       │
└─────────────────────────────────┘
```

### 계좌 추가/편집 모달
- 이름 (필수)
- 타입 선택: 현금·예금 / 투자 / 부동산 / 대출 / 연금 / 기타
- 금융기관 (선택)
- 통화 (기본 KRW)
- 아이콘, 색상 (선택, 프리셋 12개)

### `/settings/categories` — 카테고리 관리
- 수입/지출 탭 분리
- 드래그로 순서 변경 (`display_order`)
- 기본 카테고리는 이름 수정만 가능, 삭제 불가 (아카이브만)
- 사용자 추가 카테고리는 삭제 가능 (단, 거래 0건일 때만)

## 컴포넌트/파일

```
src/features/accounts/
├── api.ts                   # listAccounts, createAccount, updateAccount, archiveAccount
├── hooks/
│   └── useAccounts.ts
├── components/
│   ├── AccountList.tsx
│   ├── AccountRow.tsx
│   └── AccountFormModal.tsx
└── types.ts

src/features/categories/
├── api.ts
├── hooks/
│   └── useCategories.ts
├── components/
│   ├── CategoryList.tsx
│   ├── CategoryRow.tsx
│   └── CategoryFormModal.tsx
└── types.ts

src/routes/
├── settings.accounts.tsx
└── settings.categories.tsx
```

## 수용 기준

- [ ] 계좌 추가/편집/아카이브 가능
- [ ] 아카이브된 계좌는 기본 리스트에서 숨김, 토글로 볼 수 있음
- [ ] 거래가 있는 계좌는 완전 삭제 불가 (archive only)
- [ ] 카테고리 수입/지출 탭 분리
- [ ] 기본 카테고리 삭제 시도 → 에러 메시지 ("기본 카테고리는 삭제할 수 없어요. 아카이브하거나 이름을 변경하세요.")
- [ ] 사용자 추가 카테고리 & 거래 0건 → 삭제 가능
- [ ] 거래 있는 커스텀 카테고리 삭제 시도 → 에러 ("거래 N건이 연결되어 있어요")
- [ ] 카테고리 순서 드래그 변경 시 `display_order` 업데이트
- [ ] RLS: 다른 household의 계좌/카테고리 조회 불가
- [ ] 모바일 뷰포트 정상 표시

## 개방 질문

1. 대출 계좌의 음수 잔액 입력 방식 — `balance`를 음수로 저장 vs 별도 플래그?
   → **결정: 음수 저장. `type='loan'`에선 항상 음수로 해석.**
2. 커스텀 카테고리 개수 제한?
   → **제안: 수입/지출 각 30개 제한. 그 이상은 관리 난이도 급증.**

## 테스트

- 유닛: 카테고리 순서 재배치 로직
- 통합: 시드 함수 실행 → 15개 카테고리 생성 확인
- 통합: 거래 있는 카테고리 삭제 → 에러
- E2E: 계좌 추가 → 거래 기록 시 드롭다운에 나타남
