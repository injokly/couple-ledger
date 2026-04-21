# Spec 04 — 빠른입력 모달 ⭐

**MVP의 성패를 결정하는 화면.** 이 스펙은 다른 것보다 더 꼼꼼히 읽을 것.

목업 참조: `docs/mockups/quick-input.html`

## 목표

부부가 지출을 기록하는 데 **7~10초 이내** 끝나는 바텀시트 모달.

## 의존성

- `03-transactions.md` (createTransaction API)
- `02-accounts-categories.md` (카테고리/계좌)

## 트리거

- 하단 탭바의 중앙 FAB (`+` 버튼)
- 단축키: `N` (PC)
- 홈 화면 "빠른 기록" 카드 (없으면 안 만들어도 됨)

**라우트가 아니다.** Zustand로 오버레이 상태 관리:

```ts
// src/stores/quickInput.ts
interface QuickInputState {
  isOpen: boolean;
  initialType?: 'expense' | 'income' | 'transfer';
  open: (initialType?) => void;
  close: () => void;
}
```

## UI 구조 (위→아래)

1. **드래그 핸들** (40px × 4px, gray)
2. **헤더**: `✕` 닫기 / "거래 기록" / 날짜 칩 "오늘 · 4/21"
3. **타입 토글**: 지출 / 수입 / 이체 (기본 지출 활성)
4. **금액 표시**: 48px 큰 숫자 + "원" + 깜빡이는 커서
   - 힌트: "이번 달 식비 총 487,300원 · 예산의 65%" (카테고리 선택 후에만 표시)
5. **메모 입력**: 한 줄, placeholder "메모 추가 (선택)"
6. **카테고리 가로 스크롤 칩**:
   - 최근 사용 빈도 상위 7개 + "더보기"
   - 선택된 것은 흰 테두리 강조
   - 지출이면 expense 카테고리, 수입이면 income 카테고리
7. **계좌 선택 행**: `계좌 > KB 급여통장 ›` (한 줄, 탭하면 시트)
8. **숫자 패드** (4×3 그리드, 각 키 52px 높이):
   ```
   1  2  3
   4  5  6
   7  8  9
   00 0  ⌫
   ```
9. **저장 버튼** (파란 full-width, 56px)
   - 금액 0일 때 disabled
   - 버튼 안에 금액 재표시: "저장하기 · 12,500원"
10. **힌트**: "길게 누르면 연속 입력"

## 핵심 UX 동작

### 10초 타이머 테스트

E2E 테스트에서 실제 측정:

```ts
test('지출 기록 10초 이내', async ({ page }) => {
  await page.goto('/');
  const start = Date.now();
  await page.getByTestId('fab-quick-input').tap();
  await page.getByRole('button', { name: '1' }).tap();
  await page.getByRole('button', { name: '2' }).tap();
  await page.getByRole('button', { name: '5' }).tap();
  await page.getByRole('button', { name: '00' }).tap();
  await page.getByRole('button', { name: '식비' }).tap();
  await page.getByRole('button', { name: /저장하기/ }).tap();
  await expect(page.getByText('−12,500원')).toBeVisible();
  expect(Date.now() - start).toBeLessThan(10000);
});
```

### 자동 입력 최적화

| 필드 | 기본값 로직 |
|---|---|
| 거래 타입 | 지출 (가장 빈도 높음) |
| 날짜 | 오늘 |
| 계좌 | 마지막으로 사용한 계좌 (`localStorage`) |
| 카테고리 | 사용자가 명시적으로 선택해야 함 (기본값 강제 없음) |
| 메모 | 비어있음 |

### 연속 입력 모드

저장 버튼을 **길게 누르면**:
- 저장 후 모달 유지
- 금액 0으로 리셋
- 메모 클리어
- 카테고리·계좌 유지 (같은 걸로 여러 건 입력 가정)
- 토스트: "저장됨 · 계속 입력"

### 이체 타입일 때 변형

- 카테고리 영역 → "받는 계좌" 선택 UI로 대체
- 메모, 계좌는 동일
- `to_account_id` 필수

### 숫자 패드 동작

- 1~9: 해당 숫자 추가
- 0: 첫 입력이 0이면 무시, 아니면 추가
- 00: 두 개의 0 추가 (첫 입력에선 무시)
- ⌫: 마지막 한 자리 삭제
- 최대 자릿수: 11 (999억까지)
- **시스템 키보드는 절대 뜨지 않게**: 모든 입력은 이 패드로만

## 컴포넌트 구조

```
src/features/transactions/components/
├── QuickInputModal.tsx          # 메인 컨테이너
├── QuickInputHeader.tsx         # 닫기 버튼 + 날짜 칩
├── TypeToggle.tsx               # 지출/수입/이체
├── AmountDisplay.tsx            # 큰 숫자 + 커서
├── CategoryStrip.tsx            # 가로 스크롤 칩
├── AccountRow.tsx               # 계좌 선택
├── NumericPad.tsx               # ⭐ 재사용 가능한 4×3 패드
└── SaveButton.tsx
```

`NumericPad`는 향후 자산 스냅샷 입력에서도 재사용. `features/transactions/` 아래에 두되 나중에 `components/ui/` 로 올려도 OK.

## 애니메이션

- 열기: `translateY(100%) → 0` with `cubic-bezier(0.32, 0.72, 0, 1)` 0.35s
- 닫기: 역방향 0.25s
- 배경: `opacity 0 → 1` 0.3s ease-out
- 숫자 입력 시 금액 표시: 약간의 스케일 바운스 (0.98 → 1.0, 80ms)

## 접근성

- 모달 열렸을 때 포커스를 금액 영역에 (시각적으로만, 실제 input은 없음)
- `Esc` 키로 닫기
- `Tab` 순서: 닫기 → 타입 토글 → 카테고리 → 계좌 → 숫자 패드 → 저장
- 터치 타겟 모두 44×44 이상

## 수용 기준

- [ ] FAB 탭 → 0.35초 이내 모달 완전히 올라옴
- [ ] 시스템 키보드가 절대 뜨지 않음 (메모 입력 제외)
- [ ] 지출 타입 기본 선택, 계좌는 마지막 사용한 것
- [ ] 숫자 패드로 금액 입력, ⌫ 작동
- [ ] 카테고리 선택 시 금액 아래 힌트 표시 (이번 달 해당 카테고리 합계)
- [ ] 저장 버튼 비활성화 상태: 금액 0 또는 카테고리 미선택 (지출/수입)
- [ ] 저장 성공 시 토스트 "기록됨" + 모달 닫힘 + 홈 차트/리스트 즉시 반영 (optimistic)
- [ ] 저장 실패 시 토스트 에러 + 모달 유지 (재시도 가능)
- [ ] 길게 누르기로 연속 입력 모드 진입
- [ ] 이체 타입: 카테고리 자리에 "받는 계좌" UI 대체
- [ ] 이체 시 같은 계좌 선택 불가
- [ ] `Esc` 키, 백드롭 클릭으로 닫기
- [ ] 입력 중 뒤로가기 제스처(모바일) 시 "저장하지 않고 닫으시겠어요?" 확인 (단, 금액 입력이 있을 때만)
- [ ] 375px 뷰포트 기준 모든 UI 정상 표시
- [ ] **E2E 테스트에서 10초 이내 저장 완료 검증**

## 개방 질문

1. "연속 입력 모드" 실제로 필요한가? 복잡도 있음.  
   → **우선 MVP에 포함. 사용 안 되면 Phase 2에서 제거.**
2. 카테고리 가로 스크롤 vs 그리드?  
   → **가로 스크롤 (한 손 조작 용이).**
3. 이체 시 금액이 양 계좌 모두에 반영? (transactions 테이블엔 한 row만)  
   → **한 row. UI에선 "출발 계좌에서 차감, 도착 계좌에 입금"으로 해석.**

## 테스트

- 유닛: NumericPad 상태 관리 (0 처리, ⌫, 최대 자릿수)
- 유닛: 금액 포맷 (숫자 → "12,500원")
- 통합: 카테고리 선택 시 힌트 API 호출 및 결과 표시
- E2E: **10초 플로우 스톱워치 테스트 필수**
- E2E: 연속 입력 3건, 각각 저장 성공
- E2E: 이체 플로우
