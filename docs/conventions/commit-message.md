# Commit Message

Conventional Commits 기반, 한국어 허용.

## 포맷

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

| type | 용도 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 (동작 변경 없음) |
| `perf` | 성능 개선 |
| `test` | 테스트 추가/수정 |
| `docs` | 문서 변경 |
| `style` | 포맷팅, 세미콜론 (코드 동작 영향 없음) |
| `chore` | 빌드, 의존성, 설정 |
| `db` | 마이그레이션 추가 |

## Scopes (프로젝트별)

- `auth`, `household`, `accounts`, `categories`, `transactions`, `snapshots`, `holdings`, `goals`, `home`, `assets`, `settings`, `quick-input`, `chart`, `budget`, `report`, `ai`

## 예시

```
feat(transactions): 빠른입력 모달에 커스텀 numpad 추가

- 시스템 키보드 대신 4x3 numpad 고정 배치
- 10초 입력 플로우 검증 (실제 측정 8.2초)
- tabular-nums로 숫자 정렬

Closes #12
```

```
db(snapshots): asset_snapshots 테이블 마이그레이션

- account_id + snapshot_date UNIQUE 제약
- balance, currency, exchange_rate 컬럼
- 월말 기준 기본값 트리거 추가

Refs: specs/phase-1/05-asset-snapshots.md
```

```
fix(home): 순자산 차트 음수 스냅샷 렌더링 깨짐 수정

대출이 예적금보다 많은 경우 순자산이 음수가 되는데,
SVG path의 Y 좌표 계산에서 음수 처리가 빠져 있었음.
```

## 규칙

- Subject 줄은 **50자 이하**, 마침표 없음
- 명령형 ("추가한다" → "추가"), 과거형 금지
- Body는 "왜" 중심, "무엇"은 최소화
- Breaking change는 `!` 표시: `feat(auth)!: household_id 필수화`

## 브랜치 명명

```
feat/transactions-quick-input
fix/home-negative-networth
db/asset-snapshots-migration
```
