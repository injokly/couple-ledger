export interface SimulationResult {
  series: number[];
  etaMonths: number | null;
}

export function simulateSimple(
  initial: number,
  monthlyContribution: number,
  annualReturnPct: number,
  targetAmount: number,
  maxMonths = 600,
): SimulationResult {
  const monthlyRate = Math.pow(1 + annualReturnPct / 100, 1 / 12) - 1;
  const series: number[] = [initial];
  let current = initial;
  let etaMonths: number | null = null;

  for (let i = 1; i <= maxMonths; i++) {
    current = current * (1 + monthlyRate) + monthlyContribution;
    series.push(current);
    if (current >= targetAmount && etaMonths === null) {
      etaMonths = i;
    }
  }

  // 차트용으로 필요한 만큼만 자르기 (ETA + 12개월 또는 최대 120개월)
  const trimLength = etaMonths ? Math.min(etaMonths + 12, maxMonths) : Math.min(120, maxMonths);
  return {
    series: series.slice(0, trimLength + 1),
    etaMonths,
  };
}

export interface ScenarioResult {
  label: string;
  etaMonths: number | null;
  etaDate: string | null;
}

export function generateScenarios(
  initial: number,
  monthlyContribution: number,
  annualReturnPct: number,
  targetAmount: number,
): ScenarioResult[] {
  const now = new Date();

  function etaToDate(months: number | null): string | null {
    if (months === null) return null;
    const d = new Date(now.getFullYear(), now.getMonth() + months, 1);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
  }

  const base = simulateSimple(initial, monthlyContribution, annualReturnPct, targetAmount);
  const moreSaving = simulateSimple(initial, monthlyContribution * 1.33, annualReturnPct, targetAmount);
  const higherReturn = simulateSimple(initial, monthlyContribution, annualReturnPct + 2, targetAmount);

  return [
    {
      label: '현 페이스 유지',
      etaMonths: base.etaMonths,
      etaDate: etaToDate(base.etaMonths),
    },
    {
      label: `월 기여 +${Math.round(monthlyContribution * 0.33).toLocaleString()}원`,
      etaMonths: moreSaving.etaMonths,
      etaDate: etaToDate(moreSaving.etaMonths),
    },
    {
      label: `수익률 +2%p (연 ${(annualReturnPct + 2).toFixed(1)}%)`,
      etaMonths: higherReturn.etaMonths,
      etaDate: etaToDate(higherReturn.etaMonths),
    },
  ];
}
