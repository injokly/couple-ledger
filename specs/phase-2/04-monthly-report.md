# Spec P2-04 — 월간 리포트

목업 참조: `docs/mockups/monthly-report.html`

## 목표

매월 1일 자동 생성되는 "지난달 정리" 페이지. 부부가 함께 보는 리추얼.

## 라우트

- `/report` — 이번 달 리포트
- `/report/:yyyy-mm` — 특정 월

## 섹션 구성

1. Hero: "지난달 모은 돈" + 달성 메시지
2. 전월 비교 (수입/지출/저축 바차트)
3. 예산 현황 (카테고리별 진행률)
4. 지출 구성 (100% stacked + 리스트)
5. 이번 달 인사이트 (규칙 기반 3건)
6. 목표 진행 (goal별 진행률)
7. 투자 성과 (시세 연동 기준)
8. 다음 달 미리보기 (공휴일, 반복거래, 과거 패턴)

자세한 UI는 목업 참조.

## 규칙 기반 인사이트 엔진

`features/report/insights.ts` 에 규칙 함수들:

```ts
type Insight = {
  severity: 'good' | 'warn' | 'info';
  title: string;
  description: string;
};

// 1. 저축률 연속 증가
export function detectSavingStreak(last3Months: MonthlyFlow[]): Insight | null {
  if (last3Months.length < 3) return null;
  const rates = last3Months.map(m => m.savingRate);
  if (rates[0] < rates[1] && rates[1] < rates[2]) {
    return {
      severity: 'good',
      title: '저축률이 3개월 연속 올랐어요',
      description: `${formatPct(rates[0])} → ${formatPct(rates[1])} → ${formatPct(rates[2])}`,
    };
  }
  return null;
}

// 2. 예산 초과 카테고리
export function detectBudgetOverruns(budgets: BudgetProgress[]): Insight | null {
  const over = budgets.filter(b => b.progress >= 1.0);
  if (!over.length) return null;
  const top = over.sort((a, b) => b.progress - a.progress)[0];
  return {
    severity: 'warn',
    title: `${top.categoryName}이 예산을 ${formatPctDiff(top.progress)} 초과했어요`,
    description: '...',
  };
}

// 3. 전월 대비 급감/급증 카테고리
export function detectCategorySpike(current: CategoryTotal[], prev: CategoryTotal[]): Insight | null {
  // 25% 이상 변화한 카테고리
}

// 4. 큰 거래
export function detectLargeTransaction(txs: Transaction[]): Insight | null {
  // 평균의 3배 이상
}
```

`generateInsights(monthData)` 에서 모든 규칙 돌리고 상위 3개 선택.

## 캐싱

```sql
create table report_snapshots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  report_month date not null,   -- first day of month
  data jsonb not null,           -- 전체 리포트 데이터
  generated_at timestamptz not null default now(),
  unique (household_id, report_month)
);
```

- 매월 1일 오전 8시 pg_cron으로 지난달 리포트 자동 생성
- 페이지 진입 시 캐시 먼저 조회, 없으면 실시간 계산

## 공유 기능

- 하단 "리포트 공유" 버튼 → 이미지/PDF 내보내기
- 내보내기는 `/report/:yyyy-mm/export` 에서 인쇄 친화 레이아웃 렌더

## 다음 달 미리보기 로직

```ts
function generateNextMonthPreview(currentMonth: Date, household: Household): PreviewItem[] {
  const items: PreviewItem[] = [];
  
  // 1. 공휴일/기념일 (ko-holidays 라이브러리 또는 하드코딩)
  const holidays = getKoreanHolidays(currentMonth);
  holidays.forEach(h => items.push({ type: 'holiday', ...h }));
  
  // 2. 반복 거래 예정
  const recurring = await getUpcomingRecurring(household.id, currentMonth);
  recurring.forEach(r => items.push({ type: 'recurring', ...r }));
  
  // 3. 과거 동월 통계
  const historicalAvg = await getHistoricalMonthStats(household.id, currentMonth.getMonth());
  items.push({ type: 'historical', ...historicalAvg });
  
  return items.slice(0, 3);
}
```

## 수용 기준

- [ ] 매월 1일 오전 8시 자동 리포트 생성 (이전 달 기준)
- [ ] 모든 섹션 렌더 (데이터 부족해도 스켈레톤)
- [ ] 인사이트 3건 이상 생성
- [ ] 전월 대비 차트 정확
- [ ] 다음 달 미리보기: 공휴일 + 반복거래 + 과거 패턴 3건 이상
- [ ] 캐시 있으면 1초 이내 렌더
- [ ] 과거 월 탐색 가능
- [ ] 내보내기 기능 (이미지 or PDF)
