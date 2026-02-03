# 데이터베이스 스키마 설계 (Drizzle ORM)

> 완전한 Drizzle ORM 스키마 설계 문서
>
> **작성일**: 2026-02-03
> **상태**: ✅ 설계 완료, 구현 대기 중

## 목차

- [현재 상태](#현재-상태)
- [Drizzle 선택 이유](#drizzle-선택-이유)
- [핵심 모델](#핵심-모델-8개)
- [Enum 타입](#enum-타입)
- [보안 구현](#보안-구현)
- [구현 단계](#구현-단계)
- [검증 방법](#검증-방법)

---

## 현재 상태

❌ **Drizzle 미설치**, db/schema.ts 파일 없음
✅ **완전한 스키마 설계 완료**

---

## Drizzle 선택 이유

| 항목 | Drizzle ORM | Prisma |
|------|-------------|---------|
| 번들 크기 | ~500KB | ~5MB (10배 차이) |
| Cold Start | 거의 없음 | 150-300ms |
| Edge Runtime | ✅ 지원 | ❌ 미지원 |
| 타입 안전성 | ✅ 완벽 | ✅ 완벽 |
| SQL 유사도 | ✅ 높음 | 중간 |
| Serverless | ✅ 최적화 | 보통 |

**결론**: Vercel Serverless 환경에 최적화된 Drizzle 사용

---

## 완전한 스키마 설계 완료

### 핵심 모델 (8개)

#### 1. User (사용자)

```typescript
// db/schema.ts
import { pgTable, varchar, boolean, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const premiumPlanEnum = pgEnum('premium_plan', ['FREE', 'PREMIUM']);

export const users = pgTable('users', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  role: userRoleEnum('role').default('USER').notNull(),
  premiumPlan: premiumPlanEnum('premium_plan').default('FREE').notNull(),
  aiCredits: integer('ai_credits').default(2).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**필드 설명:**
- `id`: CUID2 (Collision-resistant Unique ID)
- `email`: 고유한 이메일 주소
- `role`: USER 또는 ADMIN
- `premiumPlan`: 무료 또는 프리미엄
- `aiCredits`: AI 사진 생성 크레딧 (기본 2회)

---

#### 2. Invitation (청첩장)

```typescript
export const invitationStatusEnum = pgEnum('invitation_status',
  ['DRAFT', 'PUBLISHED', 'EXPIRED', 'DELETED']
);

export const invitations = pgTable('invitations', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  templateId: varchar('template_id', { length: 128 })
    .notNull()
    .references(() => templates.id),

  // Wedding Info
  groomName: varchar('groom_name', { length: 255 }).notNull(),
  brideName: varchar('bride_name', { length: 255 }).notNull(),
  weddingDate: timestamp('wedding_date').notNull(),
  venueName: varchar('venue_name', { length: 255 }).notNull(),
  venueAddress: varchar('venue_address', { length: 500 }),

  // Content
  introMessage: text('intro_message'),
  galleryImages: text('gallery_images').array(),
  aiPhotoUrl: varchar('ai_photo_url', { length: 500 }),

  // Security
  isPasswordProtected: boolean('is_password_protected').default(false).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),

  // Analytics
  viewCount: integer('view_count').default(0).notNull(),
  status: invitationStatusEnum('status').default('DRAFT').notNull(),
  expiresAt: timestamp('expires_at'), // weddingDate + 90일

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('invitations_user_id_idx').on(table.userId),
  statusExpiresIdx: index('invitations_status_expires_idx').on(table.status, table.expiresAt),
}));
```

**필드 설명:**
- `galleryImages`: 갤러리 사진 URL 배열
- `aiPhotoUrl`: AI 생성 대표 사진
- `isPasswordProtected`: 비밀번호 보호 여부
- `passwordHash`: bcrypt 해시된 비밀번호
- `viewCount`: 조회수
- `expiresAt`: 자동 삭제 날짜 (결혼식 + 90일)

**인덱스:**
- `userId`: 사용자별 청첩장 조회
- `status, expiresAt`: 만료된 청첩장 정리용

---

#### 3. RSVP (참석 응답)

```typescript
export const attendanceStatusEnum = pgEnum('attendance_status',
  ['ATTENDING', 'NOT_ATTENDING', 'MAYBE']
);
export const mealOptionEnum = pgEnum('meal_option',
  ['ADULT', 'CHILD', 'VEGETARIAN', 'NONE']
);

export const rsvps = pgTable('rsvps', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  invitationId: varchar('invitation_id', { length: 128 })
    .notNull()
    .references(() => invitations.id, { onDelete: 'cascade' }),

  // Guest Info (암호화 필요)
  guestName: varchar('guest_name', { length: 255 }).notNull(),
  guestPhone: varchar('guest_phone', { length: 500 }), // 암호화됨
  guestEmail: varchar('guest_email', { length: 500 }), // 암호화됨

  // Attendance
  attendance: attendanceStatusEnum('attendance').notNull(),
  guestCount: integer('guest_count').default(1).notNull(),
  mealOption: mealOptionEnum('meal_option'),
  message: text('message'),

  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (table) => ({
  invitationIdIdx: index('rsvps_invitation_id_idx').on(table.invitationId),
}));
```

**보안 주의:**
- `guestPhone`, `guestEmail`은 **AES-256-GCM 암호화 필수**
- 애플리케이션 레벨에서 암호화/복호화 처리 (`lib/crypto.ts`)

---

#### 4. AIGeneration (AI 생성 이력)

```typescript
export const aiStyleEnum = pgEnum('ai_style',
  ['CLASSIC', 'MODERN', 'VINTAGE', 'ROMANTIC', 'CINEMATIC']
);
export const aiGenerationStatusEnum = pgEnum('ai_generation_status',
  ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
);

export const aiGenerations = pgTable('ai_generations', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  originalUrl: varchar('original_url', { length: 500 }).notNull(),
  style: aiStyleEnum('style').notNull(),
  generatedUrls: text('generated_urls').array(), // 4장
  selectedUrl: varchar('selected_url', { length: 500 }),
  status: aiGenerationStatusEnum('status').default('PENDING').notNull(),
  creditsUsed: integer('credits_used').default(1).notNull(),
  cost: real('cost').notNull(), // USD
  replicateId: varchar('replicate_id', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  userStatusIdx: index('ai_generations_user_status_idx').on(table.userId, table.status),
}));
```

**필드 설명:**
- `originalUrl`: 원본 증명 사진 URL
- `generatedUrls`: 배치 생성된 4장의 URL
- `selectedUrl`: 사용자가 선택한 최종 사진
- `status`: PENDING → PROCESSING → COMPLETED/FAILED
- `replicateId`: Replicate API prediction ID

---

#### 5. Payment (결제)

```typescript
export const paymentTypeEnum = pgEnum('payment_type',
  ['PREMIUM_UPGRADE', 'AI_CREDITS', 'AI_CREDITS_BUNDLE']
);
export const paymentStatusEnum = pgEnum('payment_status',
  ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']
);
export const paymentMethodEnum = pgEnum('payment_method',
  ['TOSS', 'KAKAO_PAY', 'CARD']
);

export const payments = pgTable('payments', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  type: paymentTypeEnum('type').notNull(),
  method: paymentMethodEnum('method').notNull(),
  amount: integer('amount').notNull(), // KRW
  creditsGranted: integer('credits_granted'),
  status: paymentStatusEnum('status').default('PENDING').notNull(),
  orderId: varchar('order_id', { length: 255 }).unique(),
  paymentKey: varchar('payment_key', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userStatusIdx: index('payments_user_status_idx').on(table.userId, table.status),
}));
```

---

#### 6. Template (템플릿)

```typescript
export const templateCategoryEnum = pgEnum('template_category',
  ['CLASSIC', 'MODERN', 'VINTAGE', 'FLORAL', 'MINIMAL']
);
export const templateTierEnum = pgEnum('template_tier',
  ['FREE', 'PREMIUM']
);

export const templates = pgTable('templates', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),

  name: varchar('name', { length: 255 }).notNull(),
  category: templateCategoryEnum('category').notNull(),
  tier: templateTierEnum('tier').default('FREE').notNull(),
  thumbnail: varchar('thumbnail', { length: 500 }).notNull(),
  config: json('config').notNull(), // 레이아웃 설정
  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tierActiveIdx: index('templates_tier_active_idx').on(table.tier, table.isActive),
}));
```

**JSON config 예시:**
```json
{
  "layout": "centered",
  "colors": {
    "primary": "#8B7355",
    "secondary": "#F5F5DC"
  },
  "fonts": {
    "heading": "Nanum Myeongjo",
    "body": "Nanum Gothic"
  },
  "sections": ["intro", "details", "gallery", "rsvp", "map"]
}
```

---

#### 7-8. NextAuth.js 모델

```typescript
export const accounts = pgTable('accounts', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => ({
  providerAccountIdx: unique('accounts_provider_account_idx')
    .on(table.provider, table.providerAccountId),
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
}));

export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: varchar('user_id', { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
}));
```

---

## Relations (Drizzle)

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  invitations: many(invitations),
  aiGenerations: many(aiGenerations),
  payments: many(payments),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  user: one(users, {
    fields: [invitations.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [invitations.templateId],
    references: [templates.id],
  }),
  rsvps: many(rsvps),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  invitation: one(invitations, {
    fields: [rsvps.invitationId],
    references: [invitations.id],
  }),
}));

// ... 나머지 relations
```

---

## 보안 구현

### 1. RSVP 개인정보 암호화

**AES-256-GCM 알고리즘 사용**

```typescript
// lib/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(encrypted: string): string {
  const buffer = Buffer.from(encrypted, 'base64');
  const iv = buffer.subarray(0, 16);
  const authTag = buffer.subarray(16, 32);
  const data = buffer.subarray(32);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(data) + decipher.final('utf8');
}
```

**사용 예시:**
```typescript
import { db } from '@/db';
import { rsvps } from '@/db/schema';
import { encrypt } from '@/lib/crypto';

// 저장 시
const encryptedPhone = encrypt(guestPhone);
await db.insert(rsvps).values({
  invitationId,
  guestName,
  guestPhone: encryptedPhone,
  attendance: 'ATTENDING',
});

// 조회 시
const rsvp = await db.query.rsvps.findFirst({
  where: eq(rsvps.id, id),
});
const decryptedPhone = decrypt(rsvp.guestPhone!);
```

---

### 2. 청첩장 비밀번호

**bcrypt 해싱 (10 rounds)**

```typescript
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// 비밀번호 생성
const passwordHash = await bcrypt.hash(password, 10);
await db.update(invitations)
  .set({
    isPasswordProtected: true,
    passwordHash,
  })
  .where(eq(invitations.id, id));

// 비밀번호 검증
const invitation = await db.query.invitations.findFirst({
  where: eq(invitations.id, id),
});
const isValid = await bcrypt.compare(inputPassword, invitation.passwordHash!);

if (!isValid) {
  return new Response('Invalid password', { status: 401 });
}
```

---

## 구현 단계

### 1. Drizzle ORM 설치

```bash
pnpm add drizzle-orm postgres @paralleldrive/cuid2
pnpm add -D drizzle-kit
```

---

### 2. 환경 변수 추가

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@host:5432/cuggu"

# ENCRYPTION_KEY 생성 (64자리 hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 생성된 키를 .env.local에 추가
ENCRYPTION_KEY="여기에_생성된_64자리_hex_붙여넣기"

# CRON_SECRET 생성
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

CRON_SECRET="여기에_생성된_base64_붙여넣기"
```

**.env.example에도 추가:**
```bash
DATABASE_URL="postgresql://..."
ENCRYPTION_KEY=""
CRON_SECRET=""
```

---

### 3. Drizzle Config 생성

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

---

### 4. DB 클라이언트 설정

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Serverless 최적화
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
```

---

### 5. 마이그레이션 실행

```bash
# 마이그레이션 파일 생성
pnpm drizzle-kit generate

# 마이그레이션 실행
pnpm drizzle-kit push

# Drizzle Studio 실행 (GUI)
pnpm drizzle-kit studio
```

**package.json에 스크립트 추가:**
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx db/seed.ts"
  }
}
```

---

### 6. 자동 만료 처리 (Vercel Cron)

```typescript
// app/api/cron/cleanup/route.ts
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { and, eq, lt } from 'drizzle-orm';

export async function GET(request: Request) {
  // Vercel Cron 인증
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 만료된 청첩장 삭제 (90일 지난 것)
  const deleted = await db.delete(invitations)
    .where(
      and(
        eq(invitations.status, 'PUBLISHED'),
        lt(invitations.expiresAt, new Date())
      )
    )
    .returning({ id: invitations.id });

  return Response.json({ deleted: deleted.length });
}
```

**Vercel Cron 설정 (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 핵심 파일

### Critical Files

1. **`/db/schema.ts`**
   - 전체 데이터 구조 정의
   - Drizzle ORM 스키마

2. **`/db/index.ts`**
   - Drizzle 클라이언트 인스턴스
   - Serverless 최적화

3. **`/drizzle.config.ts`**
   - Drizzle Kit 설정
   - 마이그레이션 경로

4. **`/lib/crypto.ts`**
   - RSVP 암호화/복호화 유틸리티
   - AES-256-GCM 알고리즘

5. **`/.env.local`**
   - DATABASE_URL
   - ENCRYPTION_KEY
   - CRON_SECRET

6. **`/app/api/cron/cleanup/route.ts`**
   - 자동 만료 처리 Cron Job
   - Vercel Cron 사용

---

## 검증 방법

### 1. 마이그레이션 성공 확인

```bash
pnpm db:generate
pnpm db:push
```

**예상 출력:**
```
✓ Generated migrations
✓ Pushed schema to database
```

---

### 2. Drizzle Studio로 데이터 확인

```bash
pnpm db:studio
# https://local.drizzle.studio 열림
```

**확인 사항:**
- 모든 테이블 생성 확인
- 관계 확인 (users → invitations 등)
- Enum 값 확인

---

### 3. 테스트 데이터 생성

```typescript
// db/seed.ts
import { db } from './index';
import { users, templates, invitations } from './schema';

async function main() {
  // User 생성
  const [user] = await db.insert(users).values({
    email: 'test@example.com',
    name: '테스트',
    aiCredits: 2,
  }).returning();

  console.log('Created user:', user);

  // Template 생성
  const [template] = await db.insert(templates).values({
    name: '클래식 템플릿',
    category: 'CLASSIC',
    tier: 'FREE',
    thumbnail: 'https://example.com/classic.png',
    config: {
      layout: 'centered',
      colors: { primary: '#8B7355' },
    },
  }).returning();

  console.log('Created template:', template);

  // Invitation 생성
  const [invitation] = await db.insert(invitations).values({
    userId: user.id,
    templateId: template.id,
    groomName: '홍길동',
    brideName: '김영희',
    weddingDate: new Date('2026-06-01'),
    venueName: '서울 웨딩홀',
    status: 'PUBLISHED',
  }).returning();

  console.log('Created invitation:', invitation);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
```

**실행:**
```bash
pnpm db:seed
```

---

### 4. 관계 확인

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const userWithInvitations = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: {
    invitations: true,
    aiGenerations: true,
    payments: true,
  },
});

console.log(userWithInvitations);
```

---

## 다음 단계

1. ✅ 완전한 스키마 설계 완료
2. ⏳ Drizzle ORM 설치
3. ⏳ db/schema.ts 파일 생성
4. ⏳ Supabase 연동
5. ⏳ 마이그레이션 실행
6. ⏳ 보안 라이브러리 설치 (bcryptjs)
7. ⏳ 암호화 유틸리티 구현

---

## 참고 자료

- [Drizzle ORM 공식 문서](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit 문서](https://orm.drizzle.team/kit-docs/overview)
- [Supabase 연동 가이드](https://orm.drizzle.team/docs/get-started-postgresql#supabase)
- [NextAuth.js Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
- [Node.js Crypto API](https://nodejs.org/api/crypto.html)
