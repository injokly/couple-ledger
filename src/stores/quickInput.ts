import { create } from 'zustand';

import type { TransactionType } from '@/types/app';

/**
 * 빠른입력 모달 상태.
 *
 * 모달 자체는 라우트가 아니며, 오버레이로 렌더된다.
 * 구현 스펙: specs/phase-1/04-quick-input.md
 */
interface QuickInputState {
  isOpen: boolean;
  initialType: TransactionType;
  /** 연속 입력 모드 (저장 후 모달 유지) */
  continuousMode: boolean;

  open: (initialType?: TransactionType) => void;
  close: () => void;
  setContinuousMode: (on: boolean) => void;
}

export const useQuickInputStore = create<QuickInputState>((set) => ({
  isOpen: false,
  initialType: 'expense',
  continuousMode: false,

  open: (initialType = 'expense') => set({ isOpen: true, initialType }),
  close: () => set({ isOpen: false, continuousMode: false }),
  setContinuousMode: (on) => set({ continuousMode: on }),
}));
