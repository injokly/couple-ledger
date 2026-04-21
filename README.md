# 우리 가계 (Couple Ledger)

부부를 위한 공유 자산관리 웹앱. 가계부·자산 추적·목표 시뮬레이션·리밸런싱 제안.

## 빠른 시작

```bash
# 사전 요구사항: Node.js 20+, pnpm 9+, Supabase CLI
pnpm install
cp .env.example .env.local          # Supabase 키 채우기
pnpm supabase start                 # 로컬 Supabase 실행
pnpm supabase db push               # 마이그레이션 적용
pnpm dev                            # http://localhost:5173
```

## 폴더 구조

```
couple-ledger/
├── CLAUDE.md              # Claude Code 진입점 (먼저 읽을 것)
├── docs/                  # 설계 문서
├── specs/                 # 작업 단위 명세 (Phase별)
├── supabase/              # DB 마이그레이션 & 함수
├── src/                   # 애플리케이션 코드
└── tests/                 # 테스트
```

## 로드맵

- **Phase 1 (MVP, 4~6주)**: 수동 입력 가계부, 순자산 추이, 월말 스냅샷
- **Phase 2 (3~4주)**: 예산, 시세 연동, 월간 리포트, 목표 시뮬레이션
- **Phase 3 (4주+)**: AI 리밸런싱, 거시 지표 연동

## 주요 문서

- `CLAUDE.md` — Claude Code 작업 지침
- `docs/00-overview.md` — 프로젝트 개요
- `docs/02-data-model.md` — DB 스키마
- `docs/05-phases.md` — 상세 로드맵
