# 관리자 페이지 설계 문서

> 작성일: 2026-02-05

## 개요

가입 유저, 결제, AI 사용량 등 시스템 전반을 관리하는 Admin 페이지

---

## 구조

### 페이지 구조
```
app/admin/
├── layout.tsx           # Admin 레이아웃 + 권한 체크
├── page.tsx             # 대시보드 (전체 통계)
├── users/page.tsx       # 유저 목록/관리
└── payments/page.tsx    # 결제 내역
```

### API 구조
```
app/api/admin/
├── stats/route.ts       # GET: 전체 통계
├── users/route.ts       # GET: 목록, POST: 크레딧 부여/플랜 변경
└── payments/route.ts    # GET: 결제 내역
```

### 추가 파일
```
lib/auth/admin.ts        # Admin 권한 체크 헬퍼
schemas/admin.ts         # Admin API 스키마
components/admin/
├── AdminNav.tsx         # Admin 네비게이션
├── UserTable.tsx        # 유저 테이블
├── UserActionModal.tsx  # 크레딧/플랜 변경 모달
└── PaymentTable.tsx     # 결제 테이블
```

---

## 기능 상세

### 1. 대시보드 (`/admin`)

| 지표 | 설명 |
|------|------|
| 전체 유저 | 총 가입자 수 |
| 프리미엄 유저 | premiumPlan = PREMIUM |
| 이번 달 신규 | 당월 가입자 |
| AI 생성 수 | 총 aiGenerations |
| AI 비용 | 총 cost (USD) |
| 총 매출 | completed payments 합계 (KRW) |
| 청첩장 현황 | total/published/draft |

### 2. 유저 관리 (`/admin/users`)

**목록 기능:**
- 페이지네이션
- 검색 (이메일/이름)
- 플랜 필터 (FREE/PREMIUM)

**표시 정보:**
- email, name, role
- premiumPlan, aiCredits
- 청첩장 수, AI 생성 수
- 가입일

**관리 액션:**
- 크레딧 부여: +N 크레딧
- 프리미엄 설정: FREE ↔ PREMIUM 전환

### 3. 결제 내역 (`/admin/payments`)

**목록 기능:**
- 페이지네이션
- 필터: 상태, 타입, 날짜 범위, 유저 검색

**표시 정보:**
- 유저 (email)
- 타입 (PREMIUM_UPGRADE, AI_CREDITS 등)
- 결제수단, 금액, 부여 크레딧
- 상태, 일시

**요약:**
- 필터 결과 총액/건수 표시

---

## API 스펙

### GET `/api/admin/stats`

```typescript
// Response
{
  success: true,
  data: {
    users: {
      total: number,
      premium: number,
      newThisMonth: number
    },
    ai: {
      totalGenerations: number,
      totalCost: number,        // USD
      thisMonthGenerations: number,
      thisMonthCost: number
    },
    revenue: {
      totalAmount: number,      // KRW
      thisMonthAmount: number,
      completedPayments: number
    },
    invitations: {
      total: number,
      published: number,
      draft: number
    }
  }
}
```

### GET `/api/admin/users`

```typescript
// Query Parameters
{
  page?: number,        // default: 1
  pageSize?: number,    // default: 20, max: 100
  search?: string,      // 이메일/이름 검색
  plan?: 'FREE' | 'PREMIUM',
  sortBy?: 'createdAt' | 'aiCredits',
  sortOrder?: 'asc' | 'desc'
}

// Response
{
  success: true,
  data: {
    users: [{
      id: string,
      email: string,
      name: string | null,
      role: 'USER' | 'ADMIN',
      premiumPlan: 'FREE' | 'PREMIUM',
      aiCredits: number,
      createdAt: string,
      _count: {
        invitations: number,
        aiGenerations: number
      }
    }],
    pagination: {
      page: number,
      pageSize: number,
      total: number,
      totalPages: number
    }
  }
}
```

### POST `/api/admin/users`

```typescript
// Request Body (discriminated union)
{ action: 'grant_credits', userId: string, credits: number } |
{ action: 'set_premium', userId: string } |
{ action: 'set_free', userId: string }

// Response
{
  success: true,
  data: {
    userId: string,
    action: string,
    result: {
      newCredits?: number,
      newPlan?: 'FREE' | 'PREMIUM'
    }
  }
}
```

### GET `/api/admin/payments`

```typescript
// Query Parameters
{
  page?: number,
  pageSize?: number,
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
  type?: 'PREMIUM_UPGRADE' | 'AI_CREDITS' | 'AI_CREDITS_BUNDLE',
  userId?: string,
  startDate?: string,   // ISO date
  endDate?: string
}

// Response
{
  success: true,
  data: {
    payments: [{
      id: string,
      user: { id, email, name },
      type: string,
      method: string,
      amount: number,
      creditsGranted: number | null,
      status: string,
      orderId: string | null,
      createdAt: string
    }],
    pagination: { page, pageSize, total, totalPages },
    summary: {
      totalAmount: number,
      count: number
    }
  }
}
```

---

## 권한 시스템

### NextAuth 세션 확장

`types/next-auth.d.ts`:
```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: 'USER' | 'ADMIN';
    } & DefaultSession["user"];
  }
}
```

### Admin 권한 체크 헬퍼

`lib/auth/admin.ts`:
```typescript
export async function requireAdmin(): Promise<AdminUser> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new UnauthorizedError("로그인이 필요합니다");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, session.user.email),
    columns: { id: true, email: true, name: true, role: true },
  });

  if (!user) throw new UnauthorizedError("사용자 정보를 찾을 수 없습니다");
  if (user.role !== "ADMIN") throw new ForbiddenError("관리자 권한이 필요합니다");

  return user as AdminUser;
}
```

---

## 구현 순서

### Phase 1: 인프라 (선행 필수)
1. `types/next-auth.d.ts` - Session 타입에 role 추가
2. `auth.ts` - session callback에서 role 조회/포함
3. `lib/auth/admin.ts` - requireAdmin() 헬퍼

### Phase 2: API
4. `schemas/admin.ts` - 요청/응답 스키마
5. `app/api/admin/stats/route.ts`
6. `app/api/admin/users/route.ts`
7. `app/api/admin/payments/route.ts`

### Phase 3: 컴포넌트
8. `components/admin/AdminNav.tsx`
9. `components/admin/UserTable.tsx`
10. `components/admin/UserActionModal.tsx`
11. `components/admin/PaymentTable.tsx`

### Phase 4: 페이지
12. `app/admin/layout.tsx`
13. `app/admin/page.tsx`
14. `app/admin/users/page.tsx`
15. `app/admin/payments/page.tsx`

---

## 참조 파일

| 용도 | 경로 |
|------|------|
| DB 스키마 | `db/schema.ts` |
| NextAuth 설정 | `auth.ts` |
| 타입 확장 | `types/next-auth.d.ts` |
| API 유틸 | `lib/api-utils.ts` |
| 대시보드 레이아웃 참고 | `app/dashboard/layout.tsx` |
| 통계 API 참고 | `app/api/dashboard/stats/route.ts` |
| 기존 Admin 컴포넌트 | `components/admin/StatsCard.tsx` |

---

## 보안 고려사항

- 모든 Admin API는 `requireAdmin()` 호출 필수
- 민감 작업 로깅 권장 (크레딧 부여, 플랜 변경)
- Rate limiting 적용 권장
- Admin 계정은 DB에서 직접 `role = 'ADMIN'` 설정

---

## 향후 확장

- Admin 액션 히스토리 테이블
- 여러 Admin 레벨 (SUPER_ADMIN, ADMIN)
- 대시보드 그래프/차트
- 유저 상세 페이지
- 실시간 알림
