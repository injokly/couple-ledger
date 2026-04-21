/**
 * 현재 인증된 household_member 조회 훅.
 * auth 스토어에서 직접 읽음.
 */

import type { HouseholdMember } from '@/types/app';

import { useAuthStore } from '@/stores/auth';


export function useCurrentMember(): {
  data: HouseholdMember | null;
  isLoading: boolean;
} {
  const member = useAuthStore((s) => s.member);
  const isLoading = useAuthStore((s) => s.isLoading);
  return { data: member, isLoading };
}
