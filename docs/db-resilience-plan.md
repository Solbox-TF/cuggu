# DB 연결 실패 시 페이지 안정성 확보

## 배경

Supabase DB 연결 타임아웃 발생 시 페이지가 104초간 멈춘 후 500 에러.
`connect_timeout: 10`은 TCP 핸드셰이크만 커버하고, PgBouncer pooler가 TCP는 바로 수락한 뒤 내부에서 대기 → postgres.js는 쿼리 응답을 무한 대기.
error.tsx도 loading.tsx도 없어서 사용자는 아무것도 못 보고 멈춤.

## 변경 사항

### 1. 쿼리 타임아웃 래퍼 추가 (`db/index.ts`)

`Promise.race`로 쿼리에 8초 제한. postgres.js `statement_timeout` 서버 사이드 안전망 추가.

### 2. error.tsx 추가 (2개)

- `app/error.tsx` - 루트 에러 바운더리 (전체 앱 안전망)
- `app/inv/[id]/error.tsx` - 공개 청첩장 에러 바운더리 (하객용, 최우선)

### 3. `invitation-cache.ts` DB 호출에 타임아웃 적용

`getInvitationCached`, `getInvitationMetaCached` 내 DB 쿼리를 `withTimeout`으로 감싸기.

### 4. `withErrorHandler`에 DB 타임아웃 감지 추가 (`lib/api-utils.ts`)

`DatabaseTimeoutError` → 503 응답. 클라이언트 페이지에 빠른 에러 전달.

### 5. 대시보드 클라이언트 에러 UI (`app/dashboard/page.tsx`)

`console.error`만 하던 걸 에러 메시지 + 다시 시도 버튼으로 변경.

## 수정 파일

| 파일 | 작업 |
|------|------|
| `db/index.ts` | `withTimeout`, `DatabaseTimeoutError` + `statement_timeout` |
| `lib/api-utils.ts` | `withErrorHandler`에 `DatabaseTimeoutError` 처리 |
| `app/error.tsx` | 신규 - 루트 에러 바운더리 |
| `app/inv/[id]/error.tsx` | 신규 - 공개 청첩장 에러 바운더리 |
| `lib/invitation-cache.ts` | DB 쿼리에 `withTimeout` 적용 |
| `app/dashboard/page.tsx` | 에러 상태 UI 추가 |

## 의도적으로 안 하는 것

- 자동 리트라이 (장애 시 악화), loading.tsx (이미 클라이언트 스피너 있음), Circuit breaker (과도한 복잡도), Stale cache 서빙 (TTL 5분 후 무의미)
