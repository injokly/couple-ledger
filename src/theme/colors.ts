// 디자인 토큰 — 자세한 설명은 docs/04-design-system.md 참조
// 한국 주식 컨벤션: 상승=빨강, 하락=파랑

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

  // 시맨틱 (한국 주식 컨벤션)
  up: '#EB4D3D',
  upSoft: 'rgba(235, 77, 61, 0.14)',
  down: '#3182F6',
  downSoft: 'rgba(49, 130, 246, 0.14)',

  // 액션
  accent: '#3182F6',

  // 상태
  success: '#1CB572',
  successSoft: 'rgba(28, 181, 114, 0.14)',
  warn: '#F5A623',
  warnSoft: 'rgba(245, 166, 35, 0.14)',
  danger: '#EB4D3D',
  dangerSoft: 'rgba(235, 77, 61, 0.14)',

  // AI / Phase 3
  ai: '#A487F0',
  aiSoft: 'rgba(164, 135, 240, 0.14)',

  // 사용자 식별
  userA: '#EB4D3D',
  userB: '#3182F6',
} as const;

export type Colors = typeof colors;
