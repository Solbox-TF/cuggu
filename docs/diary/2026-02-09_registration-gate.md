# 신규 회원가입 차단 (Registration Gate)

> 날짜: 2026-02-09
> 브랜치: `feat/ai-theme-generation`

---

## 배경

OAuth 로그인(카카오/네이버)으로 누구나 가입 가능한 상태. 운영 전 단계에서 무분별한 가입과 AI 크레딧(기본 2회) 남용을 방지하기 위해 어드민이 회원가입을 on/off 할 수 있는 기능이 필요.

---

## 현재 인증 구조

```
사용자 → 카카오/네이버 OAuth → NextAuth signIn
  → DrizzleAdapter가 자동으로 users + accounts 레코드 생성
  → JWT 세션 발급 → /dashboard 리다이렉트
```

- **NextAuth v5** (beta.30), JWT 세션, DrizzleAdapter
- `signIn` 콜백 없음 → 누구든 OAuth 로그인하면 자동 가입
- 역할: `USER | ADMIN` (DB enum)
- 에러 페이지: `pages.error = "/error"` 설정되어 있지만 실제 페이지 없음

### 관련 파일

| 파일 | 역할 |
|------|------|
| `auth.ts` | NextAuth 설정 (providers, callbacks) |
| `db/schema.ts` | users, accounts, appSettings 테이블 |
| `lib/auth/admin.ts` | `requireAdmin()`, `isAdmin()` 헬퍼 |
| `app/(auth)/login/page.tsx` | 로그인 페이지 (카카오/네이버 버튼) |
| `components/admin/AdminNav.tsx` | 어드민 사이드바 네비게이션 |

---

## 설계

### 핵심 아이디어

NextAuth `signIn` 콜백에서 **신규 유저**(DB에 계정 없는 유저)의 로그인을 차단. 기존 유저는 설정과 무관하게 항상 통과.

### 설정 저장

이미 존재하는 `appSettings` 테이블(key-value) 활용:

```typescript
// db/schema.ts — 이미 존재
export const appSettings = pgTable('app_settings', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: jsonb('value').notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

- 키: `registration_enabled`
- 값: `true` / `false`
- 카테고리: `auth`
- **기본값: `false`** (키가 없으면 차단 상태로 동작)

### 인증 흐름 (변경 후)

```
사용자 → OAuth 로그인
  → signIn 콜백 실행
    → accounts 테이블에서 provider+providerAccountId 조회
    → 존재함 (기존 유저) → ✅ 통과
    → 존재 안함 (신규)
      → appSettings에서 registration_enabled 조회
      → true → ✅ 통과 (가입 허용)
      → false → ❌ 차단, /login?error=RegistrationClosed 리다이렉트
```

---

## 변경 파일

### 1. `lib/settings.ts` (신규)

```typescript
// 범용 설정 헬퍼
async function getAppSetting<T>(key: string, defaultValue: T): Promise<T>
async function setAppSetting(key: string, value: unknown, meta: { category, label, description? }): Promise<void>

// 편의 함수
async function isRegistrationEnabled(): Promise<boolean>  // 기본값 false
```

### 2. `auth.ts`

`signIn` 콜백 추가:

```typescript
callbacks: {
  async signIn({ user, account }) {
    if (!account) return true; // credentials는 통과

    // 기존 계정 확인
    const existing = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, account.provider),
        eq(accounts.providerAccountId, account.providerAccountId),
      ),
    });

    if (existing) return true; // 기존 유저 → 통과

    // 신규 유저 → 가입 허용 여부 확인
    const allowed = await isRegistrationEnabled();
    if (!allowed) {
      return '/login?error=RegistrationClosed';
    }
    return true;
  },
  // ... 기존 jwt, session 콜백
}
```

### 3. `app/(auth)/login/page.tsx`

- `searchParams`에서 `error=RegistrationClosed` 감지
- 빨간 배너로 "현재 신규 가입이 중단되었습니다" 표시

### 4. `app/api/admin/settings/route.ts` (신규)

| 메서드 | 기능 |
|--------|------|
| `GET` | 전체 또는 카테고리별 설정 조회 |
| `PATCH` | 설정값 변경 (upsert) |

- `requireAdmin()` 권한 체크

### 5. `app/admin/settings/page.tsx` (신규)

- 어드민 설정 페이지
- "회원가입 허용" 토글 스위치
- 향후 다른 설정(사이트 점검 모드 등)도 추가 가능한 구조

### 6. `components/admin/AdminNav.tsx`

- `Settings` 아이콘으로 "설정" 메뉴 항목 추가

---

## DB

별도 마이그레이션 불필요. `appSettings` 테이블 이미 존재. `registration_enabled` 키가 없으면 기본값 `false`로 동작하므로 **배포 즉시 신규 가입 차단**.

---

## 검증

1. 어드민 설정에서 "회원가입 허용" OFF 확인
2. 시크릿/다른 브라우저에서 카카오 로그인 시도 → 차단 메시지 확인
3. 어드민 설정에서 ON 전환 → 로그인 시도 → 정상 가입 확인
4. 기존 유저로 로그인 → 설정과 무관하게 정상 동작 확인
