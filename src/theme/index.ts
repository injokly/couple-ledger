import { colors } from './colors';
import { typography } from './typography';

export const space = {
  0: '0',
  1: '2px',
  2: '4px',
  3: '6px',
  4: '8px',
  5: '10px',
  6: '12px',
  7: '14px',
  8: '16px',
  9: '18px',
  10: '20px',
  11: '22px',
  12: '24px',
  14: '28px',
  16: '32px',
  20: '40px',
} as const;

export const radius = {
  sm: '8px',
  md: '11px',
  lg: '14px',
  xl: '18px',
  '2xl': '22px',
  pill: '100px',
  full: '9999px',
} as const;

export const shadow = {
  fab: '0 8px 24px rgba(49,130,246,0.45), 0 2px 4px rgba(0,0,0,0.2)',
  btn: '0 4px 16px rgba(49,130,246,0.3)',
  modal: '0 20px 60px rgba(0,0,0,0.5)',
} as const;

export const theme = {
  colors,
  typography,
  space,
  radius,
  shadow,
} as const;

export type AppTheme = typeof theme;

// Emotion theme type 확장
declare module '@emotion/react' {
  export interface Theme extends AppTheme {}
}

export { colors, typography };
