-- 016_goals_simulation.sql
-- Phase 2: 목표 시뮬레이션 — goals 컬럼 추가

alter table goals add column if not exists monthly_contribution numeric(15,2);
alter table goals add column if not exists expected_return_pct numeric(5,2) default 3.0;
alter table goals add column if not exists simulation_type text default 'simple'
  check (simulation_type in ('simple', 'monte_carlo'));
