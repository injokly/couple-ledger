# Spec P2-05 — 목표 시뮬레이션

## 목표

"몇 년 뒤 얼마가 되는가"에 답하는 차트.

## DB

`goals` 테이블은 MVP에 존재. Phase 2에서 추가 컬럼:

```sql
alter table goals add column monthly_contribution numeric(15,2);
alter table goals add column expected_return_pct numeric(5,2) default 3.0; -- 연 수익률
alter table goals add column simulation_type text default 'simple'; -- 'simple' | 'monte_carlo'
```

## 계산 로직

### Simple (복리)

```ts
function simulateSimple(
  initial: number,
  monthlyContribution: number,
  annualReturnPct: number,
  months: number
): number[] {
  const monthlyRate = Math.pow(1 + annualReturnPct / 100, 1/12) - 1;
  const series: number[] = [initial];
  let current = initial;
  
  for (let i = 1; i <= months; i++) {
    current = current * (1 + monthlyRate) + monthlyContribution;
    series.push(current);
  }
  
  return series;
}
```

### Monte Carlo (Phase 2 후반)

- 1000회 시뮬레이션, 수익률 정규분포 가정 (평균 3%, 표준편차 12%)
- P10, P50, P90 백분위 밴드 표시

## 화면

### `/goals` — 목표 리스트
- 각 목표 카드: 이름, 현재/목표 금액, 진행률, 예상 달성일

### `/goals/:id` — 목표 상세

```
🏡 내 집 마련
─────────────────────
현재        2억 1,040만원
목표        5억원
진행률      42.1%
남은 금액   2억 8,960만원
매월 기여    150만원
예상 수익률  연 3.0% [설정]

━━━━━━━━━━━━━━━━━━━━━━
 [ 시뮬레이션 차트 ]
 (4년 후 예상 도달)
━━━━━━━━━━━━━━━━━━━━━━

시나리오:
 ∙ 현 페이스 유지: 2029년 3월 (46개월 후)
 ∙ 월 기여 +50만: 2028년 8월 (39개월 단축)
 ∙ 수익률 +2%p: 2029년 1월 (45개월 단축)
```

### What-if 슬라이더

- 매월 기여액 슬라이더 (기본값 ±50%)
- 수익률 슬라이더 (1%~10%)
- 실시간으로 차트 재계산 및 ETA 업데이트

## 자동 추적

목표는 `linked_account_ids` 배열로 계좌 연결:
- `ARRAY[acc-adeq-savings, acc-toss-stock]` 같은 식
- 진행률 = 연결 계좌들의 최신 스냅샷 합계
- 매월 스냅샷 업데이트 시 진행률 자동 갱신

## 수용 기준

- [ ] 목표 CRUD
- [ ] 진행률 자동 계산 (연결 계좌 스냅샷 합)
- [ ] 시뮬레이션 차트 렌더 (Recharts)
- [ ] ETA 계산 정확 (복리 적용)
- [ ] What-if 슬라이더 실시간 반응 (debounce 100ms)
- [ ] 3가지 시나리오 비교 (현 페이스, 기여 증가, 수익률 증가)
- [ ] 이미 달성한 목표는 "달성!" 뱃지
- [ ] 연결 계좌가 아카이브되면 경고 표시
