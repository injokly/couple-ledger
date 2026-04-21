/**
 * Auth & Household API.
 * Supabase Auth + household_members + household_invites 쿼리.
 */

import type { HouseholdMember } from '@/types/app';

import { supabase } from '@/lib/supabase';

// ── 인증 ────────────────────────────────────

interface SignUpInput {
  email: string;
  password: string;
  displayName: string;
  inviteToken?: string;
}

export async function signUp({ email, password, displayName, inviteToken }: SignUpInput) {
  const metadata: Record<string, string> = { display_name: displayName };
  if (inviteToken) metadata.invite_token = inviteToken;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });

  if (error) throw error;
  return data;
}

interface SignInInput {
  email: string;
  password: string;
}

export async function signIn({ email, password }: SignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── 현재 멤버 조회 ────────────────────────────

function toHouseholdMember(row: Record<string, unknown>): HouseholdMember {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    userId: row.user_id as string,
    displayName: row.display_name as string,
    role: row.role as HouseholdMember['role'],
    color: (row.color as string) ?? null,
    joinedAt: row.joined_at as string,
  };
}

export async function fetchCurrentMember(): Promise<HouseholdMember | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', session.user.id)
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return toHouseholdMember(data);
}

// ── 가정 멤버 목록 ────────────────────────────

export async function fetchHouseholdMembers(
  householdId: string,
): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', householdId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(toHouseholdMember);
}

// ── 초대 링크 ────────────────────────────────

export interface HouseholdInvite {
  id: string;
  householdId: string;
  token: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  createdAt: string;
}

export async function createInvite(householdId: string): Promise<HouseholdInvite> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다');

  // created_by는 member.id 필요
  const { data: member } = await supabase
    .from('household_members')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('household_id', householdId)
    .single();

  const { data, error } = await supabase
    .from('household_invites')
    .insert({
      household_id: householdId,
      token,
      expires_at: expiresAt,
      max_uses: 1,
      created_by: member?.id ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id as string,
    householdId: data.household_id as string,
    token: data.token as string,
    expiresAt: data.expires_at as string,
    maxUses: data.max_uses as number,
    useCount: data.use_count as number,
    createdAt: data.created_at as string,
  };
}

export async function fetchInvites(householdId: string): Promise<HouseholdInvite[]> {
  const { data, error } = await supabase
    .from('household_invites')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    householdId: row.household_id as string,
    token: row.token as string,
    expiresAt: row.expires_at as string,
    maxUses: row.max_uses as number,
    useCount: row.use_count as number,
    createdAt: row.created_at as string,
  }));
}
