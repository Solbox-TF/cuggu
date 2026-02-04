# Zod 사용 가이드

> **중요**: 모든 외부 데이터(API 요청, 폼 입력)는 반드시 Zod로 검증해야 합니다.

## 목차

1. [기본 원칙](#기본-원칙)
2. [API Routes에서 사용](#api-routes에서-사용)
3. [React Hook Form과 연동](#react-hook-form과-연동)
4. [스키마 작성 규칙](#스키마-작성-규칙)
5. [예시 코드](#예시-코드)

---

## 기본 원칙

### 왜 Zod를 사용하는가?

1. **런타임 타입 안전성**: TypeScript는 컴파일 타임에만 타입을 체크하지만, Zod는 런타임에도 검증
2. **보안**: 악의적인 입력 차단, SQL Injection/XSS 방지
3. **명확한 에러 메시지**: 사용자에게 정확한 피드백 제공
4. **타입 추론**: Zod 스키마에서 TypeScript 타입 자동 생성

### 필수 검증 대상

- ✅ API 요청 body (POST, PATCH, PUT)
- ✅ 쿼리 파라미터 (GET)
- ✅ 폼 입력 데이터
- ✅ 외부 API 응답
- ❌ 내부 함수 간 데이터 전달 (TypeScript 타입만으로 충분)

---

## API Routes에서 사용

### 1. 기본 패턴

```typescript
// app/api/invitations/route.ts
import { NextRequest } from 'next/server';
import {
  withErrorHandler,
  validateRequest,
  successResponse,
} from '@/lib/api-utils';
import { CreateInvitationRequestSchema } from '@/schemas';

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 1. Zod 검증 (자동으로 에러 처리됨)
  const data = await validateRequest(req, CreateInvitationRequestSchema);

  // 2. 비즈니스 로직
  const invitation = await createInvitation(data);

  // 3. 성공 응답
  return successResponse(invitation, '청첩장이 생성되었습니다', 201);
});
```

### 2. 쿼리 파라미터 검증

```typescript
// GET /api/invitations?page=1&pageSize=20
import { validateQuery } from '@/lib/api-utils';
import { PaginationQuerySchema } from '@/schemas';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const query = validateQuery(req, PaginationQuerySchema);
  // query는 타입 안전: { page: number, pageSize: number, sortBy?: string, sortOrder: 'asc' | 'desc' }

  const invitations = await getInvitations(query);
  return successResponse(invitations);
});
```

### 3. URL 파라미터 검증

```typescript
// PATCH /api/invitations/[id]
import { validateParams } from '@/lib/api-utils';
import { IdParamSchema } from '@/schemas';

export const PATCH = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id } = validateParams(params, IdParamSchema);
    // id는 CUID2 형식으로 검증됨

    const data = await validateRequest(req, UpdateInvitationRequestSchema);
    // ...
  }
);
```

### 4. 에러 처리

`withErrorHandler`가 자동으로 처리하므로 별도 try-catch 불필요:

```typescript
// ❌ 잘못된 방법
export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const data = CreateInvitationRequestSchema.parse(body);
    // ...
  } catch (error) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
};

// ✅ 올바른 방법
export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await validateRequest(req, CreateInvitationRequestSchema);
  // 검증 실패 시 자동으로 400 에러 반환
  // ...
});
```

### 5. 커스텀 에러 던지기

```typescript
import { NotFoundError, ForbiddenError } from '@/lib/api-utils';

export const DELETE = withErrorHandler(async (req: NextRequest, { params }) => {
  const invitation = await findInvitation(params.id);

  if (!invitation) {
    throw new NotFoundError('청첩장을 찾을 수 없습니다');
  }

  if (invitation.userId !== session.user.id) {
    throw new ForbiddenError('삭제 권한이 없습니다');
  }

  // ...
});
```

---

## React Hook Form과 연동

### 1. 기본 사용법

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateInvitationRequestSchema } from '@/schemas';
import type { CreateInvitationRequest } from '@/schemas';

export function InvitationForm() {
  const form = useForm<CreateInvitationRequest>({
    resolver: zodResolver(CreateInvitationRequestSchema),
    defaultValues: {
      groomName: '',
      brideName: '',
      guestCount: 1,
    },
  });

  const onSubmit = async (data: CreateInvitationRequest) => {
    // data는 이미 검증된 상태
    const response = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('groomName')} />
      {form.formState.errors.groomName && (
        <p className="text-red-500">{form.formState.errors.groomName.message}</p>
      )}

      <button type="submit" disabled={form.formState.isSubmitting}>
        생성
      </button>
    </form>
  );
}
```

### 2. 서버 응답 검증

```typescript
import { InvitationResponseSchema } from '@/schemas';

const response = await fetch('/api/invitations/123');
const rawData = await response.json();

// 응답 검증 (타입 안전성 확보)
const invitation = InvitationResponseSchema.parse(rawData.data);
// invitation은 타입 안전: InvitationResponse
```

---

## 스키마 작성 규칙

### 1. 파일 구조

```
schemas/
├── common.ts         # 공통 스키마 (API 응답, 페이지네이션)
├── user.ts           # User, Login, Signup
├── invitation.ts     # Invitation, Template
├── rsvp.ts           # RSVP
├── ai.ts             # AI 생성
├── payment.ts        # 결제
└── index.ts          # 전체 export
```

### 2. 스키마 네이밍 컨벤션

- **Request**: `{Action}{Resource}RequestSchema` (예: `CreateInvitationRequestSchema`)
- **Response**: `{Resource}ResponseSchema` (예: `InvitationResponseSchema`)
- **Base Model**: `{Resource}Schema` (예: `InvitationSchema`)
- **Enum**: `{Name}Schema` (예: `AttendanceStatusSchema`)

### 3. 에러 메시지는 한글로

```typescript
export const LoginRequestSchema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'), // ✅
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'), // ✅
});

// ❌ 영어 메시지는 피하기
export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});
```

### 4. 타입 추론 활용

```typescript
// 스키마 정의
export const UserSchema = z.object({
  id: z.string().cuid2(),
  email: z.string().email(),
  name: z.string().nullable(),
});

// 타입 자동 생성
export type User = z.infer<typeof UserSchema>;
// User = { id: string; email: string; name: string | null; }
```

---

## 예시 코드

### 전체 플로우 예시

```typescript
// ==================== schemas/invitation.ts ====================
import { z } from 'zod';

export const CreateInvitationRequestSchema = z.object({
  groomName: z.string().min(1, '신랑 이름을 입력하세요'),
  brideName: z.string().min(1, '신부 이름을 입력하세요'),
  weddingDate: z.coerce.date().refine((date) => date > new Date(), {
    message: '결혼식 날짜는 미래여야 합니다',
  }),
});

export type CreateInvitationRequest = z.infer<typeof CreateInvitationRequestSchema>;

// ==================== app/api/invitations/route.ts ====================
import { NextRequest } from 'next/server';
import { withErrorHandler, validateRequest, successResponse } from '@/lib/api-utils';
import { CreateInvitationRequestSchema } from '@/schemas';
import { db } from '@/db';

export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await validateRequest(req, CreateInvitationRequestSchema);

  const invitation = await db.insert(invitations).values({
    ...data,
    userId: 'user-123',
  });

  return successResponse(invitation, '청첩장이 생성되었습니다', 201);
});

// ==================== components/InvitationForm.tsx ====================
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateInvitationRequestSchema, CreateInvitationRequest } from '@/schemas';

export function InvitationForm() {
  const form = useForm<CreateInvitationRequest>({
    resolver: zodResolver(CreateInvitationRequestSchema),
  });

  const onSubmit = async (data: CreateInvitationRequest) => {
    const response = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert('청첩장이 생성되었습니다!');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('groomName')} placeholder="신랑 이름" />
      {form.formState.errors.groomName?.message}

      <button type="submit">생성</button>
    </form>
  );
}
```

---

## 주의사항

1. **항상 `validateRequest`, `validateQuery`, `validateParams` 사용**
   - 직접 `schema.parse()`를 호출하지 말고, 유틸 함수 사용

2. **withErrorHandler로 감싸기**
   - 모든 API route는 `withErrorHandler`로 감싸야 에러가 자동 처리됨

3. **타입 추론 활용**
   - `z.infer<typeof Schema>`로 타입 자동 생성

4. **서버 응답도 검증**
   - 외부 API 응답은 반드시 Zod로 검증

5. **성능 고려**
   - 대량 데이터는 검증 비용이 높으므로, 필요한 필드만 검증

---

## 참고 자료

- [Zod 공식 문서](https://zod.dev)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [drizzle-zod](https://orm.drizzle.team/docs/zod)
