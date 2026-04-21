# 04. Design System

Toss 스타일 다크 톤 기반. Emotion으로 theme 객체 export.

## Color Tokens

```ts
// src/theme/colors.ts
export const colors = {
  // 배경
  bg: '#000000',
  bgElev: '#18191C',
  bgElev2: '#212226',
  bgChip: '#2A2B2F',

  // 텍스트
  text: '#FFFFFF',
  text2: '#D4D6DA',
  text3: '#8B8E95',
  text4: '#5C5F66',

  // 경계
  border: '#2B2D31',
  borderSoft: '#1F2024',

  // 시맨틱 (한국 주식 컨벤션: 상승=빨강)
  up: '#EB4D3D',           // 상승, 수입, 증가
  upSoft: 'rgba(235, 77, 61, 0.14)',
  down: '#3182F6',         // 하락, 지출 강조시
  downSoft: 'rgba(49, 130, 246, 0.14)',

  // 액션
  accent: '#3182F6',       // 기본 액션, 버튼, 링크

  // 상태
  success: '#1CB572',      // 성공, 예산 OK
  warn: '#F5A623',         // 경고, 예산 임박
  danger: '#EB4D3D',       // 위험, 예산 초과 (up과 동일 색상)

  // AI / Phase 3
  ai: '#A487F0',
  aiSoft: 'rgba(164, 135, 240, 0.14)',

  // 사용자 식별 (부부 아바타)
  userA: '#EB4D3D',        // 강인조 (owner)
  userB: '#3182F6',        // 배우자
} as const;
```

## Typography

```ts
// src/theme/typography.ts
export const typography = {
  fontFamily: {
    base: "'Pretendard', -apple-system, sans-serif",
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
    '4xl': '34px',       // 홈 순자산
    '5xl': '48px',       // 빠른입력 금액
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
    tightest: '-0.05em',   // 큰 숫자용
  },
  lineHeight: {
    tight: 1.1,
    base: 1.5,
    loose: 1.6,
  },
} as const;
```

### 숫자 렌더링

숫자 표시할 땐 반드시:
```css
font-variant-numeric: tabular-nums;
```

`8`과 `1`의 폭이 달라서 정렬 깨진다.

## Spacing Scale

```ts
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
```

## Radius

```ts
export const radius = {
  sm: '8px',
  md: '11px',     // 작은 타일 (카테고리 아이콘)
  lg: '14px',     // 버튼, 작은 카드
  xl: '18px',     // 중간 카드
  '2xl': '22px',  // 기본 카드
  pill: '100px',
  full: '9999px',
} as const;
```

## Shadow

```ts
export const shadow = {
  fab: '0 8px 24px rgba(49,130,246,0.45), 0 2px 4px rgba(0,0,0,0.2)',
  btn: '0 4px 16px rgba(49,130,246,0.3)',
  modal: '0 20px 60px rgba(0,0,0,0.5)',
} as const;
```

## 핵심 컴포넌트 사양

### Card
- `background: colors.bgElev`
- `border-radius: radius['2xl']` (22px)
- `padding: 22px`
- `margin: 0 14px 10px` (화면 가장자리에서 14px)

### Button Primary
```css
height: 56px;
background: colors.accent;
color: #FFFFFF;
border-radius: radius.lg;  /* 14px */
font-size: 16px;
font-weight: 700;
letter-spacing: -0.03em;
box-shadow: shadow.btn;
```

### Input (Numeric Pad Key)
```css
height: 52px;
border-radius: 10px;
font-size: 26px;
font-weight: 500;
font-variant-numeric: tabular-nums;
```
- 기본 투명 배경
- Hover: `colors.bgElev`
- Active: `colors.bgChip`
- 테두리 없음

### Chip / Pill
```css
padding: 6px 10px;          /* 또는 9px 14px (카테고리) */
border-radius: radius.pill;
background: colors.bgElev;
font-size: 12px;
font-weight: 600;
letter-spacing: -0.02em;
```

### Percentage Badge
```css
padding: 4px 9px;
border-radius: radius.pill;
font-size: 12px;
font-weight: 700;
letter-spacing: -0.02em;
font-variant-numeric: tabular-nums;

/* 상승 */
background: colors.upSoft;
color: colors.up;

/* 하락 */
background: colors.downSoft;
color: colors.down;
```

## 카테고리 이모지 & 색상 팔레트

기본 카테고리별 이모지와 타일 배경색:

| 카테고리 | 이모지 | 타일 배경 |
|---|---|---|
| 식비 | 🍜 | `rgba(58, 30, 30, 1)` |
| 교통 | 🚕 | `rgba(45, 35, 20, 1)` |
| 주거 | 🏠 | `rgba(30, 58, 44, 1)` |
| 공과금 | 💡 | `rgba(45, 35, 58, 1)` |
| 쇼핑 | 🛒 | `rgba(30, 43, 58, 1)` |
| 여가 | 🎬 | `rgba(45, 30, 58, 1)` |
| 의료 | 💊 | `rgba(58, 30, 43, 1)` |
| 교육 | 📚 | `rgba(30, 45, 58, 1)` |
| 경조사 | 🎁 | `rgba(58, 43, 30, 1)` |
| 기타 | 📦 | `rgba(42, 43, 47, 1)` |

## 자산 카테고리 타일 색상

| 카테고리 | 이모지 | 배경 |
|---|---|---|
| 부동산 | 🏠 | `#1E3A2C` |
| 주식·펀드 | 📈 | `#3A1E1E` |
| 현금·예금 | 💰 | `#1E2B3A` |
| 연금·기타 | 🪙 | `#2D1E3A` |

## Motion

- 기본 전환: `transition: all 0.15s;`
- 모달 슬라이드업: `cubic-bezier(0.32, 0.72, 0, 1)` 0.35s
- 페이드인 (backdrop): 0.3s ease-out
- 호버 반응: 0.15s, scale 변경은 피하고 배경 변경 사용
- 애니메이션 > 400ms 금지 (10초 규칙 위반)

## 아이콘

- SVG 인라인 (24×24 뷰박스, `stroke-width: 2`, `fill: none`)
- `stroke-linecap: round`, `stroke-linejoin: round`
- 아이콘 크기: 탭바 22px, 메타 18px, 큰 버튼 24px
- 이모지는 UI 아이콘 대체로 쓰지 말 것 (카테고리 전용)
