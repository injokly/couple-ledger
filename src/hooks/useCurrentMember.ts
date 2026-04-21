/**
 * 현재 인증된 household_member 조회 훅.
 *
 * ⚠️ Placeholder. 실제 구현은 specs/phase-1/01-auth-household.md 완료 후.
 */

import useSWR from 'swr';

import { supabase } from '@/lib/supabase';

import type { HouseholdMember } from '@/types/app';

export function useCurrentMember() {
  return useSWR<HouseholdMember | null>(
    'current-member',
    async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return null;

      const { data, error } = await supabase
        .from('household_members')
        .select('*')
        .eq('user_id', session.session.user.id)
        .single();

      if (error) throw error;
      return data as unknown as HouseholdMember;
    },
  );
}
