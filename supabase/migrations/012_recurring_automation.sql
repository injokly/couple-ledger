-- 012_recurring_automation.sql
-- Phase 2: 반복 거래 자동화 — calculate_next_run_date 함수 + pg_cron 스케줄

-- ── next_run_date 계산 함수 ──────────────────────────────
create or replace function calculate_next_run_date(
  p_frequency text,
  p_interval_n int,
  p_day_of_month int,
  p_day_of_week int,
  p_current_date date
)
returns date
language plpgsql
immutable
as $$
declare
  v_next date;
  v_last_day int;
begin
  case p_frequency
    when 'daily' then
      v_next := p_current_date + (p_interval_n || ' days')::interval;

    when 'weekly' then
      v_next := p_current_date + (p_interval_n * 7 || ' days')::interval;

    when 'monthly' then
      v_next := (p_current_date + (p_interval_n || ' months')::interval)::date;
      if p_day_of_month is not null then
        v_last_day := extract(day from (date_trunc('month', v_next) + interval '1 month' - interval '1 day'));
        v_next := date_trunc('month', v_next)::date + least(p_day_of_month, v_last_day) - 1;
      end if;

    when 'yearly' then
      v_next := (p_current_date + (p_interval_n || ' years')::interval)::date;
      if p_day_of_month is not null then
        v_last_day := extract(day from (date_trunc('month', v_next) + interval '1 month' - interval '1 day'));
        v_next := date_trunc('month', v_next)::date + least(p_day_of_month, v_last_day) - 1;
      end if;

    else
      raise exception 'Unknown frequency: %', p_frequency;
  end case;

  return v_next;
end;
$$;

-- ── pg_cron: 매일 오전 9시 (KST) auto_create 템플릿 처리 ─────
-- 주의: Supabase에서 pg_cron은 UTC 기준. KST 09:00 = UTC 00:00
-- Supabase 무료 플랜에서는 pg_cron 미지원일 수 있음 → 대안으로 Edge Function cron 사용

-- 자동 거래 생성 함수 (pg_cron 또는 Edge Function에서 호출)
create or replace function process_recurring_transactions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
begin
  -- auto_create=true 이고 next_run_date가 오늘 이전인 템플릿에서 거래 생성
  insert into transactions (
    household_id, type, amount, currency,
    account_id, to_account_id, category_id,
    transaction_date, memo,
    recurring_template_id, created_by
  )
  select
    rt.household_id, rt.type, rt.amount, rt.currency,
    rt.account_id, rt.to_account_id, rt.category_id,
    rt.next_run_date,
    '[자동] ' || rt.name,
    rt.id,
    rt.created_by
  from recurring_templates rt
  where rt.is_active = true
    and rt.auto_create = true
    and rt.next_run_date <= current_date;

  get diagnostics v_count = row_count;

  -- next_run_date 갱신
  update recurring_templates
  set next_run_date = calculate_next_run_date(
    frequency, interval_n, day_of_month, day_of_week, next_run_date
  )
  where is_active = true
    and auto_create = true
    and next_run_date <= current_date;

  return v_count;
end;
$$;

-- 한 달 스킵 함수
create or replace function skip_recurring_template(p_template_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update recurring_templates
  set next_run_date = calculate_next_run_date(
    frequency, interval_n, day_of_month, day_of_week, next_run_date
  )
  where id = p_template_id
    and is_active = true
    and household_id in (select current_household_ids());
end;
$$;
