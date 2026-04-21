export const typography = {
  fontFamily: {
    base: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  fontSize: {
    xs: '10px',
    sm: '11px',
    base: '13px',
    md: '14px',
    lg: '15px',
    xl: '17px',
    '2xl': '22px',
    '3xl': '26px',
    '4xl': '34px',
    '5xl': '48px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  letterSpacing: {
    tight: '-0.03em',
    tighter: '-0.04em',
    tightest: '-0.05em',
  },
  lineHeight: {
    tight: 1.1,
    base: 1.5,
    loose: 1.6,
  },
} as const;

export type Typography = typeof typography;
