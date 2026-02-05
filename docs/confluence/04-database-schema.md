# 데이터베이스 스키마

PostgreSQL (Supabase) + Drizzle ORM 기반 데이터베이스 구조입니다.

스키마 파일: `db/schema.ts`

---

## ERD (Entity Relationship Diagram)

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   users     │       │   invitations   │       │    rsvps    │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │──1:N─▶│ id (PK)         │◀─1:N──│ id (PK)     │
│ email       │       │ user_id (FK)    │       │ invitation_id│
│ name        │       │ groom_name      │       │ guest_name  │
│ image       │       │ bride_name      │       │ attendance  │
│ created_at  │       │ wedding_date    │       │ guest_count │
└─────────────┘       │ venue_name      │       │ message     │
                      │ venue_address   │       │ created_at  │
                      │ template        │       └─────────────┘
                      │ status          │
                      │ created_at      │
                      └─────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ ai_generations  │  │    galleries    │  │ bank_accounts   │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id (PK)         │  │ id (PK)         │  │ id (PK)         │
│ invitation_id   │  │ invitation_id   │  │ invitation_id   │
│ prompt          │  │ image_url       │  │ holder_name     │
│ model           │  │ order           │  │ bank_name       │
│ status          │  │ created_at      │  │ account_number  │
│ result_url      │  └─────────────────┘  │ type (신랑/신부)│
│ created_at      │                       └─────────────────┘
└─────────────────┘

┌─────────────────┐
│    payments     │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ invitation_id   │
│ amount          │
│ status          │
│ payment_key     │
│ created_at      │
└─────────────────┘
```

---

## 테이블 상세

### users
사용자 정보 (NextAuth.js 관리)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| email | varchar | 이메일 (unique) |
| name | varchar | 이름 |
| image | varchar | 프로필 이미지 URL |
| created_at | timestamp | 생성일시 |
| updated_at | timestamp | 수정일시 |

### invitations
청첩장 메인 데이터

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| groom_name | varchar | 신랑 이름 |
| bride_name | varchar | 신부 이름 |
| wedding_date | timestamp | 결혼식 일시 |
| venue_name | varchar | 예식장 이름 |
| venue_address | varchar | 예식장 주소 |
| venue_lat | decimal | 위도 |
| venue_lng | decimal | 경도 |
| template | varchar | 템플릿 ID |
| status | enum | draft/published/archived |
| greeting | text | 인사말 |
| created_at | timestamp | 생성일시 |
| updated_at | timestamp | 수정일시 |

### rsvps
참석 여부 응답

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| invitation_id | uuid | FK → invitations |
| guest_name | varchar | 하객 이름 |
| attendance | enum | attending/not_attending/maybe |
| guest_count | integer | 참석 인원 |
| meal | boolean | 식사 여부 |
| message | text | 축하 메시지 |
| created_at | timestamp | 응답일시 |

### ai_generations
AI 이미지 생성 이력

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| invitation_id | uuid | FK → invitations |
| prompt | text | 생성 프롬프트 |
| model | varchar | 사용 모델 (flux-pro/flux-dev/photomaker) |
| status | enum | pending/processing/completed/failed |
| result_url | varchar | 생성된 이미지 URL |
| error | text | 에러 메시지 |
| created_at | timestamp | 요청일시 |
| completed_at | timestamp | 완료일시 |

### payments
결제 정보

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| user_id | uuid | FK → users |
| invitation_id | uuid | FK → invitations |
| amount | integer | 결제 금액 |
| status | enum | pending/completed/failed/refunded |
| payment_key | varchar | Toss 결제 키 |
| order_id | varchar | 주문 ID |
| created_at | timestamp | 결제일시 |

---

## 인덱스

```sql
-- 자주 조회되는 쿼리 최적화
CREATE INDEX idx_invitations_user_id ON invitations(user_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_rsvps_invitation_id ON rsvps(invitation_id);
CREATE INDEX idx_ai_generations_invitation_id ON ai_generations(invitation_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
```

---

## 마이그레이션

```bash
# 마이그레이션 생성
pnpm drizzle-kit generate

# 마이그레이션 실행
pnpm drizzle-kit push

# 스키마 확인
pnpm drizzle-kit studio
```
