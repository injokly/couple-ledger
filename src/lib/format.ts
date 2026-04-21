/**
 * 금액, 날짜, 퍼센트 포맷 유틸.
 * UX 원칙: docs/03-ux-principles.md "구체 UX 결정들" 참조.
 */

/**
 * 음수는 U+2212 (MINUS SIGN) 사용. 하이픈이 아님.
 * 예: formatCurrency(-12500) === '−12,500원'
 */
export function formatCurrency(amount: number, currency = 'KRW'): string {
  if (currency !== 'KRW') {
    // Phase 1 범위 외
    return `${amount.toLocaleString('en-US')} ${currency}`;
  }

  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString('ko-KR');

  if (amount < 0) return `−${formatted}원`;
  return `${formatted}원`;
}

/**
 * 부호 포함 포맷 (수입 등).
 * formatCurrencyWithSign(6500000, 'income') === '+6,500,000원'
 */
export function formatCurrencyWithSign(
  amount: number,
  type: 'income' | 'expense' | 'transfer',
): string {
  const base = formatCurrency(Math.abs(amount));
  if (type === 'income') return `+${base}`;
  if (type === 'expense') return `−${base}`;
  return base;
}

/**
 * 압축 포맷 (큰 숫자).
 * formatCompact(12400000) === '12.4M'
 * formatCompact(324580200) === '3.25억'
 */
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '−' : '';

  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(2)}억`;
  if (abs >= 10_000_000) return `${sign}${(abs / 10_000_000).toFixed(1)}천만`;
  if (abs >= 10_000) return `${sign}${(abs / 10_000).toFixed(1)}만`;
  return `${sign}${abs.toLocaleString('ko-KR')}`;
}

/**
 * 퍼센트 포맷.
 */
export function formatPercent(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

/**
 * 상대 날짜 표시.
 * 오늘 / 어제 / 이번 주 (금요일) / 이번 달 (4월 15일) / 그 외
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (isSameDay(d, now)) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return days[d.getDay()]!;
  }
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * 시간 포함 (거래 목록에서).
 */
export function formatRelativeDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = formatRelativeDate(d);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${datePart} ${hh}:${mm}`;
}
