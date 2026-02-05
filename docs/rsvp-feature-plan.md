# RSVP 관리 기능 구현 계획

## 개요

청첩장 소유자가 RSVP 응답을 관리하고, 게스트가 공개 청첩장에서 RSVP를 제출할 수 있는 기능 구현.

## 현황

**완료됨:**
- DB 스키마 (`db/schema.ts`): rsvps 테이블, attendance/meal enum
- Zod 스키마 (`schemas/rsvp.ts`): 요청/응답/통계 스키마, 마스킹 유틸
- Settings에 `enableRsvp: true` 옵션 존재

**미구현:**
- RSVP 제출 API
- RSVP 목록 조회 API
- 관리 페이지
- 게스트 제출 폼

---

## 구현 순서

### 1단계: API 엔드포인트

#### 1-1. RSVP 제출/조회 API
**파일**: `app/api/invitations/[id]/rsvp/route.ts`

| Method | 용도 | 인증 |
|--------|------|------|
| POST | 게스트 RSVP 제출 | 불필요 |
| GET | 소유자용 목록+통계 | 필요 |

**POST 로직:**
1. 청첩장 존재 + PUBLISHED 상태 + enableRsvp 확인
2. `SubmitRSVPRequestSchema` 검증
3. `db.insert(rsvps)` 저장
4. 응답: `{ success: true, data: { id, submittedAt } }`

**GET 로직:**
1. `auth()` 세션 + 소유권 확인
2. RSVP 목록 조회 + 통계 계산
3. 전화번호/이메일 마스킹 후 응답

#### 1-2. RSVP 삭제 API
**파일**: `app/api/invitations/[id]/rsvp/[rsvpId]/route.ts`

| Method | 용도 |
|--------|------|
| DELETE | 소유자용 RSVP 삭제 |

---

### 2단계: 관리 페이지

#### 2-1. 네비게이션 추가
**파일**: `components/layout/DashboardNav.tsx`

```tsx
// navItems 배열에 추가 (설정 위)
{
  title: "RSVP 관리",
  href: "/dashboard/rsvp",
  icon: Users,
}
```

#### 2-2. RSVP 관리 페이지
**파일**: `app/dashboard/rsvp/page.tsx`

**UI 구조:**
```
헤더: "RSVP 관리"
├── 청첩장 선택 드롭다운 (1개면 자동 선택)
├── 통계 카드 (4개 그리드)
│   ├── 참석 (count + 총 인원)
│   ├── 불참
│   ├── 미정
│   └── 식사 현황
├── RSVP 테이블
│   | 이름 | 전화 | 참석 | 인원 | 식사 | 메시지 | 제출일 | 삭제 |
└── 빈 상태: "아직 RSVP 응답이 없습니다"
```

**컴포넌트:**
- `components/rsvp/RSVPTable.tsx` - 테이블 컴포넌트

---

### 3단계: 게스트 제출 폼

#### 3-1. 섹션 정의 추가
**파일**: `schemas/invitation.ts`

```tsx
// REORDERABLE_SECTIONS에 'rsvp' 추가
export const REORDERABLE_SECTIONS = [
  'greeting', 'parents', 'ceremony', 'gallery', 'accounts', 'rsvp'
] as const;

// SECTION_LABELS에 추가
export const SECTION_LABELS: Record<SectionId, string> = {
  // ... 기존
  rsvp: '참석 여부',
};
```

#### 3-2. RSVPForm 컴포넌트
**파일**: `components/rsvp/RSVPForm.tsx`

**폼 필드:**
- 이름 (필수)
- 전화번호 (선택)
- 참석 여부 (라디오: 참석/불참/미정)
- 동행 인원 (1-10, 참석 시만)
- 식사 옵션 (드롭다운, 참석 시만)
- 축하 메시지 (선택)

#### 3-3. RSVPSection 래퍼
**파일**: `components/rsvp/RSVPSection.tsx`

- 섹션 타이틀 + RSVPForm
- 제출 완료 시 감사 메시지

#### 3-4. 템플릿 수정 (4개)
**파일들:**
- `components/templates/ClassicTemplate.tsx`
- `components/templates/ModernTemplate.tsx`
- `components/templates/MinimalTemplate.tsx`
- `components/templates/FloralTemplate.tsx`

각 템플릿의 `sections` 객체에 rsvp 섹션 추가:
```tsx
rsvp: () => {
  if (!data.settings.enableRsvp) return null;
  return <RSVPSection invitationId={data.id} />;
}
```

---

## 파일 변경 목록

### 신규 파일 (6개)
| 파일 | 설명 |
|------|------|
| `app/api/invitations/[id]/rsvp/route.ts` | 제출(POST), 조회(GET) API |
| `app/api/invitations/[id]/rsvp/[rsvpId]/route.ts` | 삭제(DELETE) API |
| `app/dashboard/rsvp/page.tsx` | 관리 페이지 |
| `components/rsvp/RSVPForm.tsx` | 게스트 제출 폼 |
| `components/rsvp/RSVPSection.tsx` | 템플릿용 섹션 래퍼 |
| `components/rsvp/RSVPTable.tsx` | 관리용 테이블 |

### 수정 파일 (6개)
| 파일 | 변경 |
|------|------|
| `components/layout/DashboardNav.tsx` | RSVP 메뉴 추가 |
| `schemas/invitation.ts` | REORDERABLE_SECTIONS에 'rsvp' 추가 |
| `components/templates/ClassicTemplate.tsx` | rsvp 섹션 추가 |
| `components/templates/ModernTemplate.tsx` | rsvp 섹션 추가 |
| `components/templates/MinimalTemplate.tsx` | rsvp 섹션 추가 |
| `components/templates/FloralTemplate.tsx` | rsvp 섹션 추가 |

---

## 재사용할 기존 코드

| 파일 | 재사용 항목 |
|------|-------------|
| `schemas/rsvp.ts` | `SubmitRSVPRequestSchema`, `RSVPStatsResponseSchema`, `maskPhoneNumber()`, `maskEmail()` |
| `components/admin/StatsCard.tsx` | 통계 카드 UI |
| `components/ui/ConfirmDialog.tsx` | 삭제 확인 다이얼로그 |
| `hooks/useConfirm.ts` | 확인 다이얼로그 훅 |

---

## 검증 방법

1. **API 테스트**
   - RSVP 제출: `curl -X POST /api/invitations/{id}/rsvp -d '...'`
   - RSVP 조회: 대시보드에서 목록 확인

2. **관리 페이지**
   - `/dashboard/rsvp` 접속
   - 청첩장 선택 → 통계 표시 → 테이블 표시

3. **게스트 폼**
   - `/inv/{id}` 접속
   - RSVP 섹션에서 폼 제출
   - 성공 메시지 확인

4. **E2E**
   - 게스트가 폼 제출 → 소유자가 관리 페이지에서 확인 → 삭제

---

## 고려사항

- **중복 제출**: MVP에서는 허용. 필요시 전화번호 기준 upsert 추가
- **개인정보**: API 응답에서 마스킹 처리 (평문 저장)
- **기존 청첩장**: `sanitizeSectionOrder()`가 자동으로 'rsvp' 섹션 끝에 추가
