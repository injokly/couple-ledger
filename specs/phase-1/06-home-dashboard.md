# Spec 06 — 홈 대시보드

목업 참조: `docs/mockups/home.html`

## 목표

앱 실행 시 0.3초 안에 "우리 얼마 있지?"에 답한다.

## 의존성

- `03-transactions.md` (이번 달 흐름)
- `05-asset-snapshots.md` (순자산 추이)

## 섹션 구성 (위→아래)

### 1. 헤더
- 왼쪽: "우리 가계 ∨" (household 스위처 placeholder)
- 오른쪽: 알림 아이콘, 검색 아이콘
- 인사말: "안녕하세요, 인조님 👋"
- 오늘 날짜: "2026년 4월 21일 · 화요일"
- 부부 아바타 (우측)

### 2. 순자산 카드
- 라벨: "총 순자산"
- 큰 숫자: 34px, extrabold, `tabular-nums`
- 전월 대비: `+2.4%` 뱃지 (up 컬러) + `+7,580,200원 · 전월 대비`
- **차트**: 최근 6개월 순자산 스냅샷 라인차트 (Recharts)
  - 흰색 선, 빨간색 현재 포인트
  - 하단 축 라벨: 11월~4월
- 기간 탭: `1M | 6M | 1Y | ALL` (기본 6M)

### 3. 이번 달 흐름 카드
- 제목: "이번 달 흐름", 부제 "4월 · 21일 기준"
- 3행: 수입 / 지출 / 저축
  - 수입: `+12,400,000원`
  - 지출: `−4,850,000원`
  - 저축: `7,550,000원` (빨간색 up)
- 저축률 프로그레스 바:
  - 빨간 fill, 진행률 60.9%
  - 하단: `저축률 60.9%` | `목표 50.0%`

### 4. 월말 스냅샷 알림 (조건부)
- 조건: 현재가 월 1~3일이고, 지난달 스냅샷이 없을 때
- 파란색 gradient 카드, `📸` 아이콘
- "4월 자산 스냅샷을 남겨주세요 · 매월 말 잔액을 기록하면 추이가 정확해져요"
- 탭 → `/assets/snapshot/new`

### 5. 자산 구성 카드
- 제목: "자산 구성", 부제 "4개 카테고리"
- 카테고리별 행 (부동산/주식·펀드/현금·예금/연금·기타):
  - 아이콘 타일 + 금액 + 비중 %
  - 전월 대비 변화율 뱃지 (있을 때)
- 하단 "자산 전체보기" 버튼 → `/assets`

**중요**: 데모에 있던 "최근 거래" 섹션은 **삭제**. 사용자 피드백 반영.

## 데이터 쿼리

```ts
// features/home/hooks.ts
export function useHomeData() {
  const netWorth = useNetWorthSeries('6M');
  const thisMonthFlow = useMonthlyFlow(currentMonth);
  const latestSnapshot = useLatestSnapshot();
  const assetBreakdown = useAssetBreakdown(latestSnapshot);
  const snapshotReminder = useSnapshotReminder();
  
  return {
    netWorth, thisMonthFlow, latestSnapshot, assetBreakdown, snapshotReminder
  };
}
```

### `useMonthlyFlow` 쿼리

```sql
-- 이번 달 수입/지출 합계
select
  sum(case when type = 'income' then amount else 0 end) as income,
  sum(case when type = 'expense' then amount else 0 end) as expense
from transactions
where household_id = $1
  and transaction_date >= date_trunc('month', current_date)
  and transaction_date < date_trunc('month', current_date) + interval '1 month'
  and type in ('income', 'expense');
```

### `useAssetBreakdown`

최신 스냅샷들을 계좌 타입별로 그룹핑:
- `cash`, `savings` → 현금·예금
- `investment` → 주식·펀드
- `real_estate` → 부동산
- `pension`, `other` → 연금·기타
- `loan` → 순자산에만 반영, 구성표엔 제외 (또는 별도 표시)

### 저축 목표치

Phase 1은 **하드코딩 50%**. `households.settings.saving_target_pct` 같은 필드는 Phase 2에서 추가.

## 로딩 상태

- 순자산 카드: 스켈레톤 (큰 숫자 회색 박스)
- 차트: 점선 placeholder
- 흐름 카드: 스켈레톤
- 스냅샷 알림: 조건부 로딩 중엔 숨김

## 에러 상태

- 순자산 쿼리 실패: "잠시 후 다시 시도해주세요" + 재시도 버튼
- 부분 실패: 가능한 것만 렌더, 나머지 에러 배너

## 수용 기준

- [ ] 앱 진입 시 순자산 카드 1초 이내 렌더
- [ ] 6M 차트 포인트 6개 정확히 표시 (스냅샷 기반)
- [ ] 기간 탭(`1M/6M/1Y/ALL`) 전환 동작
- [ ] 이번 달 흐름 수입/지출 합계 정확
- [ ] 저축률 = (수입 - 지출) / 수입 * 100 정확
- [ ] 저축률 바 색상: 50% 이상이면 up(빨강), 미만이면 회색
- [ ] 스냅샷 알림 카드: 조건 만족 시만 표시
- [ ] 자산 구성 카테고리별 합계 + 비중 % 정확
- [ ] 모든 금액 `tabular-nums` 정렬
- [ ] 375px 뷰포트 정상 표시
- [ ] 하단 탭바와 콘텐츠 겹치지 않음 (bottom padding)
- [ ] 새로고침 (pull-to-refresh) 동작
- [ ] optimistic 업데이트: 거래 추가 시 흐름 카드 즉시 반영

## 개방 질문

1. 차트 라이브러리 — Recharts vs 직접 SVG?  
   → **Recharts 기본. 커스터마이즈 한계 있으면 Phase 2에서 d3 or Visx 검토.**
2. 대출이 순자산 구성에 포함되는가?  
   → **순자산 총액엔 음수 반영(차감). 자산 구성 도넛엔 미포함(음수라 비중 계산 왜곡).**

## 테스트

- 유닛: 자산 그룹핑 로직 (타입 → 카테고리 매핑)
- 유닛: 저축률 계산 (수입 0일 때 0 반환 등 엣지)
- 통합: 여러 스냅샷 있는 household에서 `getNetWorthSeries` 정확도
- E2E: 거래 추가 → 홈 흐름 카드 업데이트 확인
