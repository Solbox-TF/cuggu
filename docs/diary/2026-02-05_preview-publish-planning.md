# 공개 청첩장 미리보기 + 발행 기능 설계

**날짜**: 2026-02-05
**작업자**: JYK
**상태**: 설계 완료, 구현 대기

---

## 발견한 문제

### 1. 미리보기 페이지 없음 (404)
- TopBar, PreviewPanel의 "새 탭에서 보기" 버튼이 `/inv/${id}`를 열지만 해당 라우트가 없음
- 편집기 내 PreviewPanel은 동작하지만, 핸드폰에서 실제 모습 확인 불가

### 2. 확장 데이터가 DB에 저장되지 않음
- PUT API가 기본 필드만 저장 (groomName, brideName, weddingDate, venueName, venueAddress, introMessage, galleryImages)
- 부모님 이름, 계좌, 예식장 상세, 설정값 등이 Zustand에만 있고 DB에 안 들어감
- 새로고침하면 확장 데이터 소실

### 3. 발행 기능 없음
- DRAFT/PUBLISHED 상태 전환 UI 없음
- 편집 → 저장 → ??? → 공유 에서 발행 단계가 빠져 있음

---

## 설계 결정

### 확장 데이터 저장: JSONB 컬럼 1개 추가

**선택지 분석 (backend-architect + backend-risk-guard 에이전트 분석):**

| 기준 | JSONB 1개 | 개별 컬럼 20개+ | 하이브리드 |
|------|-----------|----------------|-----------|
| 마이그레이션 빈도 | 1회, 이후 불필요 | 필드 추가마다 | 기준 모호 |
| Zod 스키마 매핑 | 1:1 자연스러움 | flat↔nested 변환 | 2패턴 혼재 |
| 1인 운영 부담 | **가장 낮음** | 가장 높음 | 중간 |
| DB 레벨 제약 | 불가 (Zod에 의존) | 가능 | 일부 가능 |
| 다중 계좌 표현 | 자연스러움 | 별도 테이블 필요 | 가능 |

**결정: JSONB 1개** — 이유:
1. 확장 필드에 WHERE 검색 없음 (단건 CRUD만) → 개별 컬럼 이점 활용 안 됨
2. 마이그레이션 최소화가 1인 개발에서 핵심
3. Zod 스키마와 1:1 매핑으로 변환 코드 단순
4. PostgreSQL JSONB는 invalid JSON 자체를 거부 + Zod safeParse로 이중 방어

**JSON 포맷 에러 우려 대응:**
- PostgreSQL JSONB 컬럼은 유효한 JSON만 저장 가능 (DB 레벨 검증)
- 모든 필드 optional 정의 → 스키마 변경 시 하위 호환
- 읽기 시 `safeParse()` + fallback `{}` → 기존 데이터 깨져도 앱 안 죽음
- 덮어쓰기 방지: PUT에서 `기존 읽기 → deep merge → 저장` 패턴

### 공개 페이지 접근 제어: 로그인 체크

| 상태 | 본인 로그인 | 비로그인/타인 |
|------|------------|-------------|
| PUBLISHED | 공개 (조회수 증가) | 공개 (조회수 증가) |
| DRAFT | **미리보기 가능** | "준비 중인 청첩장입니다" |
| EXPIRED | "만료된 청첩장입니다" | "만료된 청첩장입니다" |
| DELETED | 404 | 404 |

- 핸드폰에서 카카오 로그인하면 자기 DRAFT 바로 확인 가능
- 토큰 방식도 검토했으나 로그인 체크가 더 단순하고 안전

### 공개 페이지 아키텍처: Server Component + Client Island

- **Server Component** (`page.tsx`): generateMetadata (OG 태그), DB fetch, 상태 분기, 로그인 체크
- **Client Component** (`InvitationView.tsx`): 템플릿 선택 + 렌더링 (framer-motion, useState 필요)
- **Client Component** (`PasswordGate.tsx`): 비밀번호 보호 폼

---

## 구현 계획

### Phase 0: DB 스키마 확장

**invitations 테이블에 `extended_data JSONB DEFAULT '{}'` 컬럼 추가**

기존 컬럼 유지 (groomName 등은 NOT NULL 제약 + 대시보드 리스트 조회에 사용). 확장 데이터만 JSONB:

```typescript
// extendedData 구조 (모든 필드 optional)
{
  groom?: {
    fatherName?: string,
    motherName?: string,
    isDeceased?: { father?: boolean, mother?: boolean },
    phone?: string,
    relation?: string,       // "장남", "차남" 등
    account?: { bank: string, accountNumber: string, accountHolder: string },
    parentAccounts?: {
      father: { bank: string, accountNumber: string, accountHolder: string }[],
      mother: { bank: string, accountNumber: string, accountHolder: string }[]
    }
  },
  bride?: { /* groom과 동일 구조 */ },
  venue?: {
    hall?: string,           // "2층 그랜드홀"
    lat?: number,
    lng?: number,
    tel?: string,
    transportation?: string  // 교통편 안내
  },
  content?: {
    notice?: string          // 안내사항
  },
  gallery?: {
    coverImage?: string      // 커버 이미지 URL
  },
  settings?: {
    showParents?: boolean,   // default true
    showAccounts?: boolean,  // default true
    showMap?: boolean,       // default true
    enableRsvp?: boolean,    // default true
    backgroundColor?: string,
    fontFamily?: string
  }
}
```

**수정 파일:**
- `db/schema.ts` — extendedData jsonb 컬럼 추가
- `schemas/invitation.ts` — ExtendedDataSchema Zod 스키마 추가, UpdateInvitationSchema에 포함
- `app/api/invitations/[id]/route.ts` — PUT에서 extendedData deep merge 저장, GET에서 반환

**마이그레이션:**
```sql
ALTER TABLE invitations ADD COLUMN extended_data jsonb DEFAULT '{}';
```

### Phase 1: DB↔Invitation 변환 유틸

**새 파일:** `lib/invitation-utils.ts`

DB flat 구조 + extendedData JSONB → 프론트엔드 nested Invitation 타입 변환 중앙화.

```
dbRecordToInvitation(row) → Invitation
  - row.groomName + row.extendedData.groom → groom: { name, fatherName, ... }
  - row.venueName + row.extendedData.venue → wedding.venue: { name, hall, ... }
  - row.introMessage + row.extendedData.content → content: { greeting, notice }
  - row.extendedData.settings → settings: { showParents, ... }
  - 빈 필드에 기본값 채움

invitationToDbUpdate(data) → { groomName, ..., extendedData: {...} }
  - nested Invitation → flat DB 컬럼 + extendedData 분리
  - 현재 PUT API의 수동 매핑 코드를 이 함수로 대체
```

### Phase 2: 공개 청첩장 페이지

**새 파일들:**
- `app/inv/[id]/page.tsx` — Server Component
- `app/inv/[id]/InvitationView.tsx` — Client Component (템플릿 렌더링)
- `app/inv/[id]/PasswordGate.tsx` — Client Component (비밀번호 게이트)

**page.tsx 동작:**
1. `generateMetadata()` — PUBLISHED일 때 OG 태그 생성
   - title: `{신랑} ♥ {신부} 결혼합니다`
   - description: 인사말 앞 100자
   - image: 갤러리 첫 사진 또는 AI 사진
2. DB에서 invitation fetch (`with: { template: true }`)
3. 상태 분기:
   - DELETED → `notFound()`
   - EXPIRED → 만료 안내 페이지
   - DRAFT → `auth()` 체크 → 본인이면 렌더링, 아니면 준비 중 안내
   - PUBLISHED → 비밀번호 체크 → 렌더링 + 조회수 증가
4. `dbRecordToInvitation()` 변환 후 `<InvitationView data={...} />` 렌더

**InvitationView.tsx:**
- templateId로 템플릿 컴포넌트 선택 (Classic/Modern/Minimal/Floral)
- `<TemplateComponent data={invitation} />` 렌더

**PasswordGate.tsx:**
- 비밀번호 입력 폼
- `POST /api/invitations/[id]/verify` 호출
- 성공 시 쿠키 설정 + 페이지 리로드

### Phase 3: 발행 + UI 개선

**3-1. Toast 컴포넌트** (`components/ui/Toast.tsx` NEW)
- Context 기반 `ToastProvider` + `useToast()` hook
- Framer Motion 애니메이션 (기존 의존성)
- success / error / info 3가지 타입, 3초 자동 닫힘

**3-2. 발행하기 기능** (`components/editor/TopBar.tsx` MODIFY)
- "공유" 버튼 → 상태에 따라 "발행하기" / "발행됨" 분기
- 발행 전 필수 필드 검증:
  - 신랑 이름 (기본값 "신랑"이 아닌지)
  - 신부 이름
  - 예식 날짜
  - 예식장 이름
- 검증 실패 시: 누락 항목 토스트 안내
- 성공 시: PUT API `{ status: 'PUBLISHED' }` → 토스트 + URL 복사

**3-3. PreviewPanel URL** (`components/editor/PreviewPanel.tsx` MODIFY)
- "새 탭에서 보기" URL: `/inv/${id}` (로그인 상태면 DRAFT도 볼 수 있으므로 별도 처리 불필요)

**3-4. Editor Layout** (`app/editor/[id]/layout.tsx` MODIFY)
- `ToastProvider` 래핑

---

## 전체 수정 파일 목록

| 파일 | 작업 | Phase |
|------|------|-------|
| `db/schema.ts` | MODIFY - extendedData jsonb 추가 | 0 |
| `schemas/invitation.ts` | MODIFY - ExtendedDataSchema 추가 | 0 |
| `app/api/invitations/[id]/route.ts` | MODIFY - extendedData 저장/반환 + deep merge | 0 |
| `lib/invitation-utils.ts` | NEW - DB↔Invitation 변환 | 1 |
| `app/inv/[id]/page.tsx` | NEW - 공개 페이지 (Server Component) | 2 |
| `app/inv/[id]/InvitationView.tsx` | NEW - 템플릿 렌더링 (Client) | 2 |
| `app/inv/[id]/PasswordGate.tsx` | NEW - 비밀번호 게이트 (Client) | 2 |
| `components/ui/Toast.tsx` | NEW - 토스트 컴포넌트 | 3 |
| `components/editor/TopBar.tsx` | MODIFY - 발행 버튼 추가 | 3 |
| `components/editor/PreviewPanel.tsx` | MODIFY - URL 수정 | 3 |
| `app/editor/[id]/layout.tsx` | MODIFY - ToastProvider 래핑 | 3 |

---

## 구현 순서

```
Phase 0: DB 스키마 + API 수정 (extendedData)
  ↓
Phase 1: lib/invitation-utils.ts (변환 유틸)
  ↓
Phase 2: app/inv/[id]/ 전체 (공개 페이지)
  ↓
Phase 3: Toast + TopBar 발행 + PreviewPanel URL 수정
```

---

## 스코프 밖 (별도 작업)

- **결제 연동 (Toss Payments)**: 프리미엄 구매, AI 크레딧 충전 — 발행과는 별개
- **RSVP 게스트 폼**: 공개 페이지에 RSVP 제출 UI 추가
- **카카오톡 공유 버튼**: 공유 SDK 연동
- **발행 취소 (비공개 전환)**: PUBLISHED → DRAFT 역전환 — 사용자 피드백 후 결정
- **nanoid URL**: `/inv/[id]` 대신 `/inv/[nanoid]` — Phase 2 보안 강화

---

## 검증 방법

1. `drizzle-kit generate` → 마이그레이션 SQL 확인 → `drizzle-kit migrate`
2. 편집기에서 부모님 이름/계좌 입력 → 저장 → 새로고침 → 데이터 유지 확인
3. "새 탭에서 보기" → `/inv/{id}` → 본인 로그인 시 DRAFT 렌더링 확인
4. 비로그인 상태에서 DRAFT 접근 → "준비 중" 표시 확인
5. "발행하기" → 필수 필드 검증 → 성공 시 토스트 + URL 복사
6. 비로그인 `/inv/{id}` → PUBLISHED 렌더링 확인
7. OG 메타태그 확인 (`curl -I` 또는 개발자 도구)
8. `npm run build` 성공

---

## 참고할 코드

- `components/editor/PreviewPanel.tsx` — previewData 기본값 처리 로직 참고
- `components/editor/Sidebar.tsx` — getTabStatus() 검증 로직 재사용 가능
- `app/api/invitations/[id]/verify/route.ts` — 비밀번호 검증 + 쿠키 설정 패턴
- `components/templates/ClassicTemplate.tsx` — 템플릿 props 인터페이스 (data: Invitation)

---

## 위험 요소

1. **기존 컬럼과 extendedData 중복**: groomName은 개별 컬럼, groom.fatherName은 JSONB. 기존 컬럼을 source of truth로 유지하고 extendedData에는 "기존 컬럼에 없는 필드만" 넣는 규칙을 코드에서 강제
2. **templateId 해석**: DB의 templateId가 'classic' 같은 문자열인지, templates 테이블의 cuid2 ID인지에 따라 template.category 조인 필요할 수 있음
3. **OG 태그 캐싱**: 카카오톡은 OG 태그를 캐싱함. 발행 후 수정하면 공유 미리보기가 안 바뀔 수 있음 → 캐시 초기화 API 필요할 수 있음 (별도 작업)
