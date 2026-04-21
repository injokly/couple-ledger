# Spec P2-01 — 반복 거래 자동화

## 목표

매월 월급, 월세 같은 반복 거래를 자동 생성하거나, 홈에서 원탭 확인으로 기록.

## 선행

- Phase 1 전체 완료
- `recurring_templates` 테이블은 MVP에서 생성되어 있음

## 구현

### pg_cron 스케줄 (Supabase)

```sql
create extension if not exists pg_cron with schema extensions;

-- 매일 오전 9시, next_run_date 도래한 템플릿 체크
select cron.schedule(
  'process-recurring-transactions',
  '0 9 * * *',
  $$
  insert into transactions (
    household_id, type, amount, currency,
    account_id, to_account_id, category_id,
    transaction_date, memo,
    recurring_template_id, created_by
  )
  select
    rt.household_id, rt.type, rt.amount, rt.currency,
    rt.account_id, rt.to_account_id, rt.category_id,
    rt.next_run_date, '[자동] ' || rt.name,
    rt.id,
    (select id from household_members where household_id = rt.household_id and role = 'owner' limit 1)
  from recurring_templates rt
  where rt.is_active = true
    and rt.next_run_date <= current_date
    and rt.auto_create = true;

  -- next_run_date 갱신
  update recurring_templates
  set next_run_date = calculate_next_run_date(frequency, interval, day_of_month, day_of_week, next_run_date)
  where is_active = true and next_run_date <= current_date;
  $$
);
```

### `auto_create` 플래그

템플릿마다 선택:
- `auto_create = true` → 자동 생성
- `auto_create = false` → 홈에 "월급 받으셨나요? [기록]" 카드만

월급은 auto, 월세는 명시적 확인 선호 가능 — 사용자 선택.

### 관리 화면

`/settings/recurring`
- 템플릿 목록: 이름, 금액, 주기, 다음 실행일
- 추가/편집/삭제
- "다음 실행 스킵" (한 달 건너뛰기)

## 수용 기준

- [ ] pg_cron 등록 성공 & 매일 9시 실행
- [ ] `auto_create=true` 템플릿은 정시 자동 거래 생성
- [ ] 생성된 거래 memo prefix: "[자동]"
- [ ] `next_run_date` 정확히 다음 주기로 갱신
- [ ] `auto_create=false` 템플릿은 홈 카드로 알림
- [ ] 알림 카드 "기록하기" 탭 → 빠른입력 모달 (필드 미리 채움) 열기
- [ ] 한 달 스킵 기능 동작
- [ ] 비활성화(`is_active=false`) 템플릿은 처리 안 됨
- [ ] 자동 생성 거래도 수동 생성과 동일하게 수정·삭제 가능
