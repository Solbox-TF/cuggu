## 목표

**결제 Phase 1 구현 시작.** 설계는 끝났으니 코드만 치면 됨.
병렬로 PortOne/스마트스토어 계정 준비 (심사 리드타임 때문에 빨리).

---

## 사전 준비 (코드 작업 전, 10분)

코드 치기 전에 외부 서비스 셋업부터. 심사에 시간 걸리는 건 먼저 신청.

| # | 작업 | 예상 시간 |
| --- | --- | --- |
| 0-1 | **PortOne 계정 생성** — 가입 + 테스트 채널 생성 + 네이버페이 채널 연결 | 10분 |
| 0-2 | **환경변수 세팅** — `.env.local`에 `PORTONE_API_SECRET`, `NEXT_PUBLIC_PORTONE_STORE_ID`, `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` | 5분 |
| 0-3 | **(가능하면) 스마트스토어 셀러 등록 신청** — 심사 3~5일 걸리니 빨리 | 15분 |

---

## 1단계: 결제 백엔드 (오전)

설계 문서: `docs/payment-flow-design.md`

| # | 작업 | Beads | 예상 |
| --- | --- | --- | --- |
| 1-1 | **DB 마이그레이션** — paymentMethodEnum TOSS→NAVER_PAY, paymentChannelEnum 추가, paymentKey→paymentId, channel 컬럼 | `cuggu-ae6` | 30분 |
| 1-2 | **schemas/payment.ts 리팩터** — Toss 스키마 170줄 제거, PortOnePaymentResponseSchema 추가, enum 업데이트 | `cuggu-p7b` | 30분 |
| 1-3 | **lib/payments/portone.ts** — verifyPayment() PortOne V2 API 클라이언트 | `cuggu-0jo` | 20분 |
| 1-4 | **lib/payments/grant.ts** — grantPaymentRewards() atomic transaction (`lib/ai/credits.ts` 패턴) | `cuggu-0jo` | 30분 |
| 1-5 | **POST /api/payments/create** — 주문 생성 (PENDING 레코드) | `cuggu-atb` | 30분 |
| 1-6 | **POST /api/payments/complete** — PortOne 검증 + 보상 지급 | `cuggu-atb` | 30분 |

**오전 목표: 백엔드 API 완성 (1-1 ~ 1-6)**

---

## 2단계: 결제 프론트엔드 (오후)

| # | 작업 | Beads | 예상 |
| --- | --- | --- | --- |
| 2-1 | **CheckoutButton** — PortOne V2 SDK + requestPayment() + 네이버페이 bypass | `cuggu-005` | 40분 |
| 2-2 | **결제 성공 페이지** — `/payments/success` (complete API 호출 + 결과 표시) | `cuggu-005` | 20분 |
| 2-3 | **결제 실패 페이지** — `/payments/fail` (에러 표시 + 재시도) | `cuggu-005` | 10분 |
| 2-4 | **기존 버튼 연결** — settings, TemplateTab, DashboardNav → CheckoutButton | `cuggu-03e` | 20분 |
| 2-5 | **어드민 라벨 업데이트** — PaymentTable, history API, admin API | `cuggu-03e` | 15분 |

**오후 목표: 프론트엔드 완성 + E2E 테스트 (PortOne 테스트 모드)**

---

## 3단계: 검증 (저녁, 시간 되면)

| # | 작업 |
| --- | --- |
| 3-1 | PortOne 테스트 모드 전체 플로우 (3개 상품 각각) |
| 3-2 | 이중 지급 방지 테스트 (같은 paymentId로 complete 2회) |
| 3-3 | 금액 변조 테스트 |
| 3-4 | 크레딧/프리미엄 전환 확인 |

---

## 금지 사항

- **AI 앨범 v2** (`cuggu-3ff`) — 결제 끝날 때까지 보류
- **스마트스토어 코드** (Phase 2) — Phase 1 먼저
- **새 설계 문서** — 이미 있음, 코드만 치기
- **리팩터링 욕구** — 결제 관련 파일만 터치

---

## 참고 파일

- 설계: `docs/payment-flow-design.md`
- 크레딧 패턴: `lib/ai/credits.ts` (atomic increment + audit trail)
- 기존 결제 스키마: `schemas/payment.ts`, `db/schema.ts`
- 기존 결제 API: `app/api/payments/history/route.ts`
- 버튼 위치: `app/dashboard/settings/page.tsx:190`, `components/editor/tabs/TemplateTab.tsx:599`, `components/layout/DashboardNav.tsx:110`