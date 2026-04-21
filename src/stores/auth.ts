import { create } from 'zustand';

import type { HouseholdMember } from '@/types/app';

interface AuthState {
  userId: string | null;
  member: HouseholdMember | null;
  isLoading: boolean;
  setAuth: (userId: string | null, member: HouseholdMember | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  member: null,
  isLoading: true,

  setAuth: (userId, member) => set({ userId, member, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ userId: null, member: null, isLoading: false }),
}));
