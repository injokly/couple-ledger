# Spec 01 — 인증 & Household

## 목표

부부 둘 다 Supabase Auth로 가입하고, 하나의 household에 연결되어 데이터를 공유한다.

## 의존성

없음. 첫 번째 스펙.

## 사용자 시나리오

1. 강인조가 이메일로 가입 → 자동으로 household 생성 + owner 권한
2. 강인조가 "초대 링크" 생성 → 배우자에게 전달
3. 배우자가 링크로 가입 → 같은 household에 member로 조인
4. 둘 다 홈 대시보드에서 동일한 데이터 봄

## DB 요구사항

- `households` 테이블 (`supabase/migrations/001_households.sql`)
- `household_members` 테이블 (`002_members.sql`)
- `household_invites` 테이블 (이 스펙에서 추가)
  ```sql
  create table household_invites (
    id uuid primary key default gen_random_uuid(),
    household_id uuid not null references households(id) on delete cascade,
    token text not null unique,          -- URL-safe random
    expires_at timestamptz not null,
    max_uses int not null default 1,
    use_count int not null default 0,
    created_by uuid references household_members(id),
    created_at timestamptz not null default now()
  );
  ```
- `current_household_ids()` SQL 함수 (RLS 헬퍼)
- Supabase Auth 이메일/비밀번호 로그인 활성화 (대시보드에서)
- 회원가입 시 household 자동 생성 트리거:
  ```sql
  create or replace function handle_new_user()
  returns trigger
  language plpgsql
  security definer
  as $$
  declare
    new_household_id uuid;
  begin
    -- 초대 토큰 파라미터가 있으면 기존 household 조인
    -- 없으면 새 household 생성
    if new.raw_user_meta_data->>'invite_token' is not null then
      -- 토큰 검증 후 조인
      -- ...
    else
      insert into households (name) values ('우리 가계')
        returning id into new_household_id;
      insert into household_members (household_id, user_id, display_name, role)
        values (new_household_id, new.id, coalesce(new.raw_user_meta_data->>'display_name', '사용자'), 'owner');
      -- 기본 카테고리 시드 (02 스펙 참조)
      perform seed_default_categories(new_household_id);
    end if;
    return new;
  end;
  $$;

  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();
  ```

## 화면

### `/auth/signin` — 로그인
- 이메일 + 비밀번호 입력
- "계정이 없으신가요? 회원가입" 링크
- 디자인: `docs/04-design-system.md` 기본 폼 스타일

### `/auth/signup` — 회원가입
- 이메일, 비밀번호, 표시 이름
- URL 쿼리에 `?invite={token}` 있으면 해당 household에 조인
- 없으면 새 household 생성

### `/settings/household` — household 관리
- 현재 멤버 목록 (인조 · owner, 수진 · member)
- **초대 링크 생성** 버튼 → 24시간 유효, 1회 사용
- 링크 복사 버튼

## 컴포넌트/파일

```
src/features/auth/
├── api.ts                    # signUp, signIn, signOut
├── hooks/
│   ├── useSession.ts         # 현재 세션
│   └── useCurrentMember.ts   # household_members 조회
├── components/
│   ├── SignInForm.tsx
│   └── SignUpForm.tsx

src/features/household/
├── api.ts                    # createInvite, joinByInvite
├── hooks/
│   ├── useHousehold.ts
│   └── useHouseholdMembers.ts
└── components/
    ├── InviteCard.tsx
    └── MemberList.tsx

src/routes/
├── auth.signin.tsx
├── auth.signup.tsx
└── settings.household.tsx
```

## 수용 기준

- [ ] 새 이메일로 가입 시 household 자동 생성 + owner 권한 부여
- [ ] 기본 카테고리 10개가 시드됨 (식비, 교통, 주거, 공과금, 쇼핑, 여가, 의료, 교육, 경조사, 기타)
- [ ] 기본 수입 카테고리 5개 시드됨 (월급, 성과급, 이자/배당, 부수입, 기타)
- [ ] `current_household_ids()` 함수가 세션 사용자의 household들을 반환
- [ ] 초대 링크 생성 시 24시간 만료 타임스탬프 설정
- [ ] 유효 초대 링크로 가입 시 기존 household에 member로 조인
- [ ] 만료된 초대 링크는 409 에러
- [ ] 이미 사용된 초대 링크는 409 에러 (max_uses 확인)
- [ ] 로그아웃 후 보호된 라우트 접근 시 `/auth/signin` 리다이렉트
- [ ] 모바일 뷰포트(375px)에서 로그인 폼 정상 표시
- [ ] 비밀번호 최소 8자 검증 (클라이언트 + Supabase 설정)

## 개방 질문

1. 비밀번호 재설정 Phase 1에 포함? (Supabase 기본 기능이라 포함 권장)
2. 소셜 로그인 (Google, Apple) Phase 1에 포함?
3. 익명 로그인 후 이메일 연결? (Supabase 지원하지만 복잡도 증가)

→ 구현 전 확인 필요.

## 테스트

- 유닛: 초대 토큰 생성, 만료 검증
- 통합: `signUp` → household + member + 기본 카테고리 자동 생성 확인
- E2E: 회원가입 → 홈 진입 → 초대링크 생성 → 새 사용자 조인 → 같은 데이터 조회
