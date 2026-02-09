# AI 테마 라이브러리 — DB 저장 + 히스토리 관리

> 날짜: 2026-02-09
> 브랜치: `feat/ai-theme-generation`

## 배경

AI 테마 생성 기능(Claude API + tool_use)은 코드 레벨에서 완성. 하지만 현재 `invitations.extendedData.customTheme`에 단일 JSON으로 저장되어, 새로 생성하면 이전 테마가 유실됨. 1크레딧 들여 만든 테마가 날아가는 건 문제.

## 목표

- 생성된 AI 테마를 `aiThemes` 테이블에 영구 저장
- 에디터 TemplateTab 내 "내 테마 라이브러리"에서 이전 테마 불러오기/적용
- safelist 검증 실패해도 저장 (크레딧 소모한 결과물이므로)
- Claude API 토큰 사용량/비용 기록
- 관리자 페이지에서 전체 히스토리 + 비용 모니터링

## 크레딧 모델

| 동작 | 크레딧 |
|------|--------|
| 신규 생성 | 1 크레딧 |
| 라이브러리에서 적용 (재사용) | 무료 |
| 변경/재생성 | 1 크레딧 |

---

## 1. DB 스키마

### `aiThemes` 테이블 (`db/schema.ts`)

```typescript
export const aiThemeStatusEnum = pgEnum('ai_theme_status', ['completed', 'safelist_failed']);

export const aiThemes = pgTable('ai_themes', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  invitationId: varchar('invitation_id', { length: 128 }).references(() => invitations.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  theme: jsonb('theme').notNull(),
  status: aiThemeStatusEnum('status').default('completed').notNull(),
  failReason: text('fail_reason'),
  creditsUsed: integer('credits_used').default(1).notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  cost: real('cost'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('ai_themes_user_id_idx').on(table.userId),
  index('ai_themes_invitation_id_idx').on(table.invitationId),
]);
```

### 컬럼 설명

| 컬럼 | 설명 |
|------|------|
| `status` | `completed` = 정상, `safelist_failed` = safelist 검증 실패 |
| `failReason` | safelist 위반 클래스 목록 (실패 시에만 기록) |
| `inputTokens` / `outputTokens` | Claude API `response.usage` 값 |
| `cost` | USD 비용 (Sonnet 4.5: input $3/M, output $15/M) |
| `invitationId` | nullable — 어떤 청첩장에서 생성했는지 |

### 저장 기준

- **Zod 파싱 성공 + safelist 통과** → `status='completed'`, 프리뷰에도 적용
- **Zod 파싱 성공 + safelist 실패** → `status='safelist_failed'` + `failReason` 기록, 프리뷰 적용 안 함
- **Zod 파싱 실패** → 구조적 결함, 저장하지 않음

---

## 2. 마이그레이션 SQL

파일: `db/migrations/0004_ai_themes.sql` (사용자가 직접 실행)

```sql
CREATE TYPE "ai_theme_status" AS ENUM ('completed', 'safelist_failed');

CREATE TABLE "ai_themes" (
  "id" varchar(128) PRIMARY KEY NOT NULL,
  "user_id" varchar(128) NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "invitation_id" varchar(128) REFERENCES "invitations"("id") ON DELETE CASCADE,
  "prompt" text NOT NULL,
  "theme" jsonb NOT NULL,
  "status" "ai_theme_status" DEFAULT 'completed' NOT NULL,
  "fail_reason" text,
  "credits_used" integer DEFAULT 1 NOT NULL,
  "input_tokens" integer,
  "output_tokens" integer,
  "cost" real,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "ai_themes_user_id_idx" ON "ai_themes" ("user_id");
CREATE INDEX "ai_themes_invitation_id_idx" ON "ai_themes" ("invitation_id");
```

---

## 3. 생성 파이프라인 변경

### `lib/ai/theme-generation.ts`

반환값에 토큰 사용량 포함:

```typescript
interface ThemeGenerationResult {
  theme: SerializableTheme;
  usage: { inputTokens: number; outputTokens: number };
}

export async function generateTheme(userPrompt: string): Promise<ThemeGenerationResult>
```

- `response.usage.input_tokens`, `response.usage.output_tokens` 추출
- safelist 검증은 API route에서 처리 (저장 후 검증하기 위해)

---

## 4. API 변경

### `app/api/ai/theme/route.ts`

**POST (생성)** — 기존 흐름 + DB 저장:

```
1. Auth + Rate limit + Credit 체크/차감
2. Claude API 호출 → Zod 파싱
3. DB insert (aiThemes) — safelist 검증 전에 저장
4. safelist 검증
   - 통과 → status='completed', customTheme 적용
   - 실패 → status='safelist_failed', failReason 기록
5. 응답: { themeId, theme, status, failReason?, remainingCredits }
```

- `invitationId`를 request body에서 받음
- 비용 계산: `(inputTokens * 3 + outputTokens * 15) / 1_000_000`

**GET (목록)** — 신규:

```
GET /api/ai/theme?invitationId=xxx
→ { themes: [{ id, prompt, status, failReason, createdAt }] }
```

- 최신순, 최대 20개
- theme JSON은 목록에서 제외 (선택 시 별도 로드)
- auth 필수

**DELETE** — 신규:

```
DELETE /api/ai/theme?id=xxx
```

- 소유자 검증 후 삭제

---

## 5. UI — 내 테마 라이브러리

### `components/editor/tabs/TemplateTab.tsx`

AI 테마 생성기 아래에 "내 테마 라이브러리" 섹션 추가:

```
┌─────────────────────────────────────┐
│ 📚 내 테마 라이브러리               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ "라벤더색 로맨틱한 봄 웨딩"     │ │
│ │ 2분 전  ·  ✅  ·  [적용] [삭제]│ │
│ ├─────────────────────────────────┤ │
│ │ "골드 포인트 고급스러운 느낌"   │ │
│ │ 1시간 전  ·  ⚠️  ·  [적용] [삭제]│
│ └─────────────────────────────────┘ │
│                                     │
│ (빈 상태: 아직 생성된 테마 없음)    │
└─────────────────────────────────────┘
```

- 에디터 마운트 시 GET으로 목록 fetch
- `completed` 테마: 바로 적용 가능
- `safelist_failed` 테마: 경고 배지 + "일부 스타일 미적용 가능" 안내, 적용은 가능
- "적용" → `updateInvitation({ templateId: 'custom', customTheme: theme })` (무료)
- "삭제" → DELETE API 호출 → 목록 갱신
- 현재 적용 중인 테마는 체크 표시로 구분

---

## 6. 기존 호환성

- `extendedData.customTheme` — 현재 적용 중인 테마 (자동저장 대상)
- `aiThemes` 테이블 — 히스토리/라이브러리 (전체 기록)
- 빌트인 템플릿 선택 시 `customTheme: undefined` (기존 동작 유지)

---

## 7. 관리자 페이지

### `app/admin/ai-themes/page.tsx` (신규)

기존 `app/admin/users/page.tsx` 패턴 사용:

- 전체 유저 AI 테마 생성 히스토리
- 테이블 컬럼: 유저(이메일), 프롬프트, 상태, 토큰(in/out), 비용($), 생성일
- 필터: 상태별 (completed / safelist_failed)
- 페이지네이션

### `app/api/admin/ai-themes/route.ts` (신규)

- GET: admin 전용, 페이지네이션/필터
- user join으로 이메일/이름 표시
- 통계 포함: 총 생성 수, 총 비용, 실패율

### `app/api/admin/stats/route.ts` (수정)

기존 AI stats에 테마 통계 추가:
- 총 테마 생성 수, 이번 달 생성 수
- 총 비용, 이번 달 비용
- safelist 실패율

---

## 수정 파일 목록

| 파일 | 변경 |
|------|------|
| `db/schema.ts` | `aiThemes` 테이블 + `aiThemeStatusEnum` 추가 |
| `db/migrations/0004_ai_themes.sql` | **신규** — 마이그레이션 SQL |
| `lib/ai/theme-generation.ts` | 반환값에 usage 추가, safelist 검증 분리 |
| `app/api/ai/theme/route.ts` | POST에 DB insert + usage/cost 저장, GET/DELETE 핸들러 추가 |
| `components/editor/tabs/TemplateTab.tsx` | 내 테마 라이브러리 섹션 추가 |
| `app/admin/ai-themes/page.tsx` | **신규** — 관리자 테마 히스토리 페이지 |
| `app/api/admin/ai-themes/route.ts` | **신규** — 관리자 API |
| `app/api/admin/stats/route.ts` | 테마 생성 통계 추가 |

## 검증 체크리스트

- [ ] `0004_ai_themes.sql` 실행 → 테이블 생성 확인
- [ ] AI 테마 생성 → `aiThemes` row에 tokens/cost 기록
- [ ] safelist 실패 시에도 DB 저장 + failReason 기록
- [ ] 라이브러리 목록 표시 + 적용(무료) 동작
- [ ] safelist_failed 테마에 경고 표시 + 적용 시 안내
- [ ] 삭제 동작
- [ ] 관리자 페이지 목록 + 통계 표시
- [ ] `pnpm build` 정상
