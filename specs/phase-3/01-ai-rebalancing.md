# Spec P3-01 — AI 리밸런싱 제안

목업 참조: `docs/mockups/rebalancing.html`

## 목표

Claude API를 활용해 현재 포트폴리오를 분석하고, 타겟 배분 대비 편차 + 거시 지표 고려한 리밸런싱 제안 생성.

## 선행

- Phase 2 전체 완료 (특히 시세 연동, 예산)
- Claude API 키 확보 + Supabase 비밀 저장소

## DB 신규

```sql
create table rebalancing_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  asset_class text not null,     -- 'stock_kr', 'stock_us', 'bond', 'cash', 'real_estate', 'pension'
  target_pct numeric(5,2) not null check (target_pct between 0 and 100),
  tolerance_pct numeric(5,2) default 5.0,
  updated_at timestamptz not null default now(),
  unique (household_id, asset_class)
);

-- 전체 합 100% 되는지 주기적 체크는 애플리케이션 레벨

create table rebalancing_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  generated_at timestamptz not null default now(),
  drift_score numeric(4,2),       -- 0~10
  recommendations jsonb,           -- action array
  rationale text,                  -- LLM rationale
  user_action text,                -- 'executed' | 'dismissed' | 'partial' | null
  created_by uuid references household_members(id)
);
```

## Edge Function

`supabase/functions/generate-rebalancing/index.ts`

### 흐름

1. 사용자 트리거 (버튼 탭) or 월 1회 자동 (매월 10일)
2. 현재 포트폴리오 데이터 수집:
   - 각 자산 클래스별 현재 가치 (holdings + snapshots)
   - 타겟 배분 (`rebalancing_rules`)
   - 편차 계산
3. 거시 데이터 수집:
   - KOSPI, S&P 500 최근 30일 추이
   - USD/KRW 환율
   - 기준금리
4. Claude API 호출 (`claude-sonnet-4-5`):
   ```
   role: "system",
   content: "당신은 한국 가계 재무 어드바이저입니다. 보수적이고 장기 투자 관점에서 조언하세요. 
            구체적 매매 추천은 '세금/수수료 고려 필요' 전제로 제시하세요."
   
   role: "user",
   content: JSON.stringify({
     portfolio: [...],
     targets: [...],
     drift: [...],
     market_context: {...}
   })
   ```
5. structured JSON 응답 강제 (tool use):
   ```json
   {
     "drift_score": 7.4,
     "actions": [
       { "type": "sell", "symbol": "005930", "quantity": 3, "amount_krw": 215400, "reason": "..." },
       ...
     ],
     "rationale": "최근 3개월 국내 주식이 +12.4% 상승하며...",
     "confidence": 0.8
   }
   ```
6. `rebalancing_log` 에 저장
7. 클라이언트에 반환

### 프롬프트 엔지니어링 팁

- `temperature: 0.3` (일관성 우선)
- 한국어로 응답 지시
- PII 제거 (거래 내역이 아닌 집계만 전달)
- 금액 대신 % 비중으로 전달하고 환산은 클라이언트에서

## 화면

`/rebalancing` — 목업 참조.

핵심 섹션:
1. Hero (편차 요약 + drift score)
2. 포트폴리오 편차 시각화
3. 추천 조정안 (actions)
4. 조정 후 예상 (시뮬레이션)
5. AI 분석 근거 (rationale)
6. 시장 지표 (context)

## 실행 UI

- "실행하기 · 3건" 버튼 → 체크박스로 개별 선택 UI
- 선택한 것만 `user_action = 'partial'` 로 로그
- 주문 실제 체결은 앱 범위 외 (증권사 앱으로 이동 안내)
- 실행 후 해당 거래 기록 프롬프트 (QuickInput 미리 채움)

## 캐싱

같은 날 같은 포트폴리오 상태라면 LLM 재호출 X.

## 수용 기준

- [ ] 타겟 배분 규칙 CRUD (합계 100% 검증)
- [ ] 편차 계산 정확
- [ ] Claude API 호출 성공 (structured output)
- [ ] API 키 클라이언트 노출 없음 (Edge Function만)
- [ ] PII (계좌번호, 이름 등) 프롬프트에 포함 안 됨
- [ ] 응답 파싱 실패 시 에러 UI (재시도 가능)
- [ ] 같은 날 재요청 시 캐시 반환
- [ ] 조정안 체크박스로 부분 실행 가능
- [ ] 실행 후 로그 업데이트 (`user_action`)
- [ ] "나중에" 선택 시 `user_action = 'dismissed'`
- [ ] 다음 리밸런싱 제안 시 "76일 전 조정" 같은 컨텍스트 반영
- [ ] 매월 10일 자동 생성 (옵션 on/off)

## 리스크 & 주의사항

- **법적 책임**: "투자 권유가 아닌 참고용" 고지 필수
- LLM 환각 가능성: 시장 외 외부 이벤트 언급은 금지 (프롬프트로 제약)
- 토큰 사용량 모니터링 (월 한도 설정)
