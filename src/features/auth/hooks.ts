/**
 * Auth & Household SWR 훅.
 */

import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import useSWR, { mutate } from 'swr';

import {
  fetchCurrentMember,
  fetchHouseholdMembers,
  fetchInvites,
  signIn,
  signOut,
  signUp,
} from './api';

import type { HouseholdMember } from '@/types/app';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';


// ── 세션 리스너 + 멤버 동기화 ─────────────────

export function useAuthListener() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        const member = await fetchCurrentMember();
        if (mounted) setAuth(session.user.id, member);
      } else {
        clear();
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        clear();
        return;
      }
      const member = await fetchCurrentMember();
      if (mounted) setAuth(session.user.id, member);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setAuth, clear]);
}

// ── 인증 액션 ────────────────────────────────

export function useSignUp() {
  const navigate = useNavigate();

  return useCallback(
    async (input: { email: string; password: string; displayName: string; inviteToken?: string }) => {
      await signUp(input);
      // handle_new_user 트리거가 household+member 생성
      // onAuthStateChange가 스토어 업데이트
      navigate('/', { replace: true });
    },
    [navigate],
  );
}

export function useSignIn() {
  const navigate = useNavigate();

  return useCallback(
    async (input: { email: string; password: string }) => {
      await signIn(input);
      navigate('/', { replace: true });
    },
    [navigate],
  );
}

export function useSignOut() {
  const navigate = useNavigate();

  return useCallback(async () => {
    await signOut();
    // SWR 캐시 전체 클리어
    await mutate(() => true, undefined, { revalidate: false });
    navigate('/auth/signin', { replace: true });
  }, [navigate]);
}

// ── 가정 멤버 ────────────────────────────────

export function useHouseholdMembers(householdId: string | undefined) {
  return useSWR<HouseholdMember[]>(
    householdId ? ['household-members', householdId] : null,
    () => fetchHouseholdMembers(householdId!),
  );
}

// ── 초대 ────────────────────────────────────

export function useInvites(householdId: string | undefined) {
  return useSWR(
    householdId ? ['invites', householdId] : null,
    () => fetchInvites(householdId!),
  );
}
