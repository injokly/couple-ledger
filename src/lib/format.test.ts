import { describe, expect, it } from 'vitest';

import { formatCompact, formatCurrency, formatCurrencyWithSign, formatPercent } from './format';

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

  it('큰 숫자도 정확히 포맷', () => {
    expect(formatCurrency(324580200)).toBe('324,580,200원');
  });

  it('소수점은 반올림', () => {
    expect(formatCurrency(12500.7)).toBe('12,501원');
  });
});

describe('formatCurrencyWithSign', () => {
  it('수입은 + 부호', () => {
    expect(formatCurrencyWithSign(6500000, 'income')).toBe('+6,500,000원');
  });

  it('지출은 − 부호', () => {
    expect(formatCurrencyWithSign(12500, 'expense')).toBe('−12,500원');
  });

  it('이체는 부호 없음', () => {
    expect(formatCurrencyWithSign(100000, 'transfer')).toBe('100,000원');
  });
});

describe('formatCompact', () => {
  it('천만 단위', () => {
    expect(formatCompact(12400000)).toBe('1.2천만');
  });

  it('억 단위', () => {
    expect(formatCompact(324580200)).toBe('3.25억');
  });

  it('만 단위', () => {
    expect(formatCompact(15000)).toBe('1.5만');
  });
});

describe('formatPercent', () => {
  it('양수는 + 부호', () => {
    expect(formatPercent(2.4)).toBe('+2.4%');
  });

  it('음수는 그대로', () => {
    expect(formatPercent(-1.2)).toBe('-1.2%');
  });
});
