# AI 테마 라이브러리 — 구현 로그

> 날짜: 2026-02-09
> 브랜치: `feat/ai-theme-generation`
> 설계 문서: `docs/diary/2026-02-09_ai-theme-library.md`

---

## 작업한 내용

설계 문서 기반으로 AI 테마 라이브러리 전체 구현. 5개 서브태스크를 의존성 순서대로 처리.

### 1. DB 스키마 (`cuggu-hay`)
- `aiThemeStatusEnum` ('completed' | 'safelist_failed') 추가
- `aiThemes` 테이블 — userId, invitationId, prompt, theme(jsonb), status, failReason, inputTokens, outputTokens, cost
- Drizzle relations: users → aiThemes (many), invitations → aiThemes (many)
- 수동 마이그레이션 SQL `0004_ai_themes.sql`

### 2. 생성 파이프라인 (`cuggu-cle`)
- `generateTheme()` 반환값을 `ThemeGenerationResult`로 변경 — `{ theme, usage: { inputTokens, outputTokens } }`
- safelist 검증을 함수에서 제거 → API route로 이동 (저장 후 검증 패턴)
- `checkThemeClasses()` 신규 — throw 안 하고 `{ valid, violations }` 반환

### 3. API route (`cuggu-7b9`)
- **POST**: 기존 흐름 + DB insert (safelist 전에 저장) + usage/cost 기록
  - safelist 통과 → `completed`, 실패 → `safelist_failed` + failReason
  - Zod 파싱 실패(구조적 결함)만 크레딧 환불 + 저장 안 함
  - 비용 계산: `(input * 3 + output * 15) / 1M`
  - 응답에 themeId, status, failReason 추가
- **GET**: `?invitationId=xxx` → 최신순 20개, theme JSON 포함
- **DELETE**: `?id=xxx` → 소유자 검증 후 삭제

### 4. TemplateTab UI (`cuggu-8wd`)
- AI 생성기 바로 아래에 "내 테마 라이브러리" 섹션 추가
- 에디터 마운트 시 GET fetch, invitationId 기반 필터
- 각 테마: 프롬프트 표시, 상대 시간, 상태 배지
- `safelist_failed` 테마: 경고 아이콘 + "일부 스타일 미적용" 안내
- 적용 버튼 (무료 — `updateInvitation`) / 삭제 버튼
- 현재 적용 중인 테마 체크 표시 (JSON.stringify 비교)
- 생성 시 invitationId 전달, 완료 후 라이브러리 자동 갱신

### 5. 관리자 페이지 (`cuggu-ny0`)
- `app/admin/ai-themes/page.tsx` — 테마 히스토리 테이블 (유저/프롬프트/상태/토큰/비용/생성일)
- `app/api/admin/ai-themes/route.ts` — 페이지네이션, 상태 필터, 통계 (총 생성 수/비용/실패율)
- `AdminNav`에 "AI 테마" 항목 추가
- `stats/route.ts`에 aiThemes 통계 쿼리 추가
- `AdminStatsResponse` 타입에 `aiThemes` 섹션 추가

---

## 왜 했는지 (맥락)

AI 테마 생성은 이미 작동하지만, `extendedData.customTheme`에 단일 JSON으로만 저장되어 있었음. 새로 생성하면 이전 테마가 덮어씌워져 유실됨. 1크레딧(= 유료)짜리 결과물이 날아가면 유저 경험상 문제.

또한 Claude API 호출 비용을 추적할 방법이 없어서, 운영 비용 모니터링이 불가능했음.

---

## 결정된 내용

| 결정 | 이유 |
|------|------|
| safelist 실패해도 DB 저장 | 크레딧 소모한 결과물 — 유저가 다시 볼 수 있어야 함 |
| safelist 검증을 API route로 이동 | "저장 후 검증" 패턴 — 검증 전에 insert해야 실패해도 보존 |
| `checkThemeClasses()` 분리 | 기존 `validateThemeClasses()`는 throw, 새 함수는 결과 반환 — 기존 호출처 영향 없음 |
| GET에서 theme JSON 포함 | 설계에선 "목록에서 제외, 선택 시 별도 로드"였지만 20개 제한이면 페이로드 괜찮고 별도 API 불필요 |
| 현재 적용 테마 판별을 JSON.stringify 비교 | themeId를 invitation에 저장하는 방법도 있지만, 기존 `customTheme` 구조를 변경하지 않기 위해 |
| Toast `warning` → `info` | 기존 Toast 컴포넌트에 warning 타입이 없어서 info로 대체 |

---

## 발견/난이도

- **난이도**: 중. 설계 문서가 상세해서 구현 자체는 직선적. DB → API → UI → Admin 순서로 자연스럽게 흐름.
- **발견**: 기존 `validateThemeClasses()`가 throw하는 방식이라 safelist 검증을 "통과/실패" 분기로 쓰려면 try-catch를 써야 했음. `checkThemeClasses()` 추가가 더 깔끔.
- tailwind.config.ts에 이미 변경이 있어서 확인했는데 safelist 관련 수정이 이전 작업에서 들어간 것.

---

## 남은 것

- [ ] `0004_ai_themes.sql` Supabase에 실행 (수동 마이그레이션)
- [ ] E2E 테스트: 생성 → DB 저장 → 라이브러리 표시 → 적용 → 삭제
- [ ] safelist_failed 테마 적용 시 실제로 어떤 스타일이 빠지는지 확인
- [ ] Toast에 `warning` 타입 추가 고려 (현재 info로 대체)
- [ ] 테마 라이브러리를 invitationId 기반이 아닌 userId 기반으로도 조회할지 (다른 청첩장에서 만든 테마 재사용)

---

## 다음 액션

1. Supabase에 마이그레이션 실행
2. 개발 서버에서 테마 생성 → 라이브러리 동작 확인
3. 관리자 페이지 접속 후 통계 카드 확인

---

## 수정 파일 (11개)

| 파일 | 변경 |
|------|------|
| `db/schema.ts` | +39 — aiThemeStatusEnum, aiThemes 테이블, relations |
| `db/migrations/0004_ai_themes.sql` | **신규** — 마이그레이션 SQL |
| `lib/ai/theme-generation.ts` | +25/-20 — ThemeGenerationResult, usage 반환, safelist 제거 |
| `lib/templates/safelist.ts` | +36 — checkThemeClasses() 추가, validateThemeClasses() 리팩토링 |
| `app/api/ai/theme/route.ts` | +124/-14 — POST DB insert, GET/DELETE 핸들러 |
| `components/editor/tabs/TemplateTab.tsx` | +198/-6 — 테마 라이브러리 UI 전체 |
| `app/admin/ai-themes/page.tsx` | **신규** — 관리자 테마 히스토리 페이지 |
| `app/api/admin/ai-themes/route.ts` | **신규** — 관리자 API |
| `app/api/admin/stats/route.ts` | +20 — aiThemes 통계 쿼리 추가 |
| `schemas/admin.ts` | +7 — AdminStatsResponse.aiThemes 타입 |
| `components/admin/AdminNav.tsx` | +3 — AI 테마 네비 항목 |
