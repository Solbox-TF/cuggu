# 2026-02-24 작업 종합 리뷰

**리뷰 날짜**: 2026-02-24
**대상**: 커밋 3건 (+ 이전 세션 0단계 커밋 포함 총 6건), 보안/버그 수정 14건
**성격**: 보안 수정 + P0 버그 해소 집중 세션

---

## 1. 계획 vs 실행 — 달성도 분석

**계획 문서**: `docs/diary/2026-02-24_daily-plan.md`

| 단계 | 계획 | 커밋 | 판정 |
|------|------|------|------|
| **0단계** 보안 빠른 수정 4건 | xavw, cno3, 2ktn, bgbb | `df56ebd`, `11bd519`, `6f890f8`, `79f1fba` | **DONE** |
| **1-1** console.log PII 노출 | `cuggu-upic` P0 | `ff90e01` | **DONE** |
| **1-2** 에디터 fake 데이터 자동저장 | `cuggu-g9f5` P0 | `ff90e01` | **DONE** |
| **1-3** 얕은 병합 중첩 객체 유실 | `cuggu-1rt3` P0 | `ff90e01` | **DONE** |
| **1-4** Zustand 타이머 누수 | `cuggu-aktz` P0 | `ff90e01` | **DONE** |
| **1-5** 크레딧 차감 순서 불일치 | `cuggu-ej1t` P0 | `ff90e01` | **DONE** |
| **1-6** Job TOCTOU 레이스 컨디션 | `cuggu-ctcn` P0 | `ff90e01` | **DONE** |
| **2-1** ENCRYPTION_KEY 길이 오류 | `cuggu-n7tq` P0 | — | **OPS 잔여** |
| **2-2** JWT maxAge 30일→7일 | `cuggu-j7qf` P2 | `0cc7e52` | **DONE** |
| **2-3** middleware.ts 글로벌 인증 | `cuggu-9yyw` P2 | `0cc7e52` → `af4a914` | **DONE** |
| **2-4** pageSize 상한 검증 | `cuggu-l1v0` P2 | `0cc7e52` | **DONE** |

**목표 달성률: 100%** (코드 수정 기준)

계획에서 "0단계+1단계 확실히 끝내기, 2단계까지 가면 좋은 날"이라고 했고, 2단계까지 전부 완료. n7tq는 코드 수정 불필요 (ops 작업만 잔여).

### 2/20 리뷰 피드백 반영

2/20 리뷰 섹션 8에서 "P0 보류하고 P2 기능 먼저 한 우선순위 문제"로 지적된 P0 6건:

| 2/20 지적 | 2/24 처리 | 판정 |
|-----------|-----------|------|
| 에디터 fake 데이터 자동저장 (g9f5) | loadError 상태 + 에러 UI | **해소** |
| console.log PII 노출 (upic) | 디버그 로그 3줄 삭제 | **해소** |
| 크레딧 차감 순서 불일치 (ej1t) | stream 라우트 크레딧 선차감 | **해소** |
| Job TOCTOU 레이스 컨디션 (ctcn) | UPDATE RETURNING + CAS | **해소** |
| Zustand 타이머 누수 (aktz) | disposed 플래그 | **해소** |
| 얕은 병합 중첩 객체 유실 (1rt3) | deepMerge 구현 | **해소** |

**P0 부채 0건 달성.** 5일간 미수정이던 핵심 버그 전부 해소.

---

## 2. 수정별 세부 분석

### 0단계: 보안 빠른 수정 (이전 세션)

코드 1~10줄 수준의 즉시 처리 건. 판단 오류 여지 없는 명확한 수정들.

| 건 | 수정 내용 | 리스크 |
|----|----------|--------|
| xavw | `/api/example` 삭제 | 없음 — 사용처 없는 scaffolding |
| cno3 | Admin console.log PII 제거 | 없음 |
| 2ktn | test-internal 인증 추가 + IP 노출 제거 | 없음 |
| bgbb | LIKE 와일드카드 이스케이프 | 없음 — 기존 검색 동작 유지 |

### 1단계: P0 버그 6건 (`ff90e01`)

#### 1-1. console.log PII 제거 (upic)

**변경**: `app/editor/[id]/page.tsx:49-51` — `console.log` 3줄 삭제.
**리스크**: 없음. 디버그 전용 코드 제거.

#### 1-2. fake 데이터 자동저장 방지 (g9f5)

**변경**: catch 블록에서 `setInvitation(fakeData)` 제거 → `setLoadError()` + 에러 UI.
**스토어 추가**: `loadError: string | null`, `setLoadError()` 액션.

**평가**:
- 근본 원인(로드 실패 시 fake 데이터 삽입) 정확히 제거
- 에러 UI에 "다시 시도" 버튼 제공 (`window.location.reload()`)
- `loadError` 체크가 `!invitation.id` 체크보다 먼저 → 로딩 스피너 대신 에러 표시

**개선 여지**: `window.location.reload()`보다 `loadInvitation()` 재호출이 부드러운 UX. 하지만 P0 수정 범위에서는 적절한 판단.

#### 1-3. 얕은 병합 → deepMerge (1rt3)

**변경**: `stores/invitation-editor.ts` — `{ ...get().invitation, ...data }` → `deepMerge()`.

**deepMerge 구현 분석**:
```typescript
function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  // 배열 → 교체, 객체 → 재귀, 그 외 → 덮어쓰기
}
```

**평가**:
- 배열은 교체(merge 아님) — 올바른 판단. `gallery.images`에 개별 원소 merge하면 의도치 않은 동작
- `null`, `undefined` 분기 정확. `undefined`는 건너뛰고 `null`은 적용
- 외부 의존성(lodash) 없이 15줄로 구현 — 적절

**잠재 리스크**: `Date` 객체가 `typeof === 'object'`로 잡혀서 재귀 대상이 될 수 있음. 현재 invitation 스키마에서 Date는 ISO 문자열로 저장되므로 실제 문제 없지만, 엣지 케이스 주의.

#### 1-4. 타이머 누수 방지 (aktz)

**변경**: 모듈 스코프 `disposed` 플래그 추가. `reset()` 시 `disposed = true`, `setInvitation()` 시 `disposed = false`.

**평가**:
- `reset()` 직후 in-flight `save()`의 catch 핸들러가 새 retryTimer를 생성하는 시나리오를 정확히 차단
- `updateInvitation`에서도 disposed 체크 후 타이머 생성 — 방어적
- `setInvitation`에서 `disposed = false`로 재활성화 — 컴포넌트 재마운트 시 정상 동작

**잠재 리스크**: 모듈 스코프 변수가 싱글톤 — 에디터 인스턴스가 여러 개면 공유됨. 현재 앱 구조상 에디터는 단일 인스턴스이므로 문제없음.

#### 1-5. 크레딧 차감 순서 통일 (ej1t)

**변경**: `stream/route.ts` — 크레딧 차감을 S3 업로드 이전으로 이동.

**before**: S3 → 크레딧 차감 → AI (S3 실패 환불이 dead code)
**after**: 크레딧 차감 → S3 → AI (모든 실패 지점에서 환불 가능)

**평가**:
- `generate/route.ts`와 순서 일치 달성
- 파일 검증/얼굴 감지/S3 각 실패 지점에 환불 분기 추가 — 꼼꼼
- `creditsDeducted` 플래그 활용 일관적

**개선 여지**: 파일 검증 실패(MIME/크기/매직넘버) 시에도 환불하는데, 이건 크레딧 차감 전에 검증하면 환불 자체가 불필요. 하지만 순서 변경의 부작용으로 자연스럽게 발생한 것이고, 환불 로직이 정확하므로 기능 문제는 없음.

#### 1-6. TOCTOU 레이스 컨디션 해소 (ctcn)

**변경 2곳**:
1. `stream/route.ts` — Job 완료 체크: UPDATE+SELECT 분리 → UPDATE...RETURNING + CAS
2. `jobs/[id]/route.ts` — PATCH 핸들러: SELECT→환불→UPDATE → SELECT→CAS UPDATE→환불

**CAS 패턴 분석**:
```typescript
// 1. 원자적 카운터 증가 + 읽기
const [updatedJob] = await db.update(...).returning({...});

// 2. 완료 조건 확인 (RETURNING 값 기반)
if (completedImages + failedImages >= totalImages) {
  // 3. CAS: status='PROCESSING'인 경우만 성공
  const [claimed] = await db.update(...)
    .where(and(eq(id, jobId), eq(status, 'PROCESSING')))
    .returning({...});
  // 4. CAS 성공한 단 하나의 worker만 환불 실행
  if (claimed) await releaseCredits(...);
}
```

**평가**:
- SELECT 제거로 TOCTOU 갭 자체가 소멸
- CAS 패턴으로 이중 `releaseCredits` 원천 방지
- 성공 경로 + 실패 경로 모두 동일 패턴 적용 — 일관적
- PATCH 핸들러에서도 CAS + `sql\`status IN ('PENDING', 'PROCESSING')\`` — 동시 요청 방어

**잠재 리스크**: PostgreSQL `UPDATE...RETURNING`은 행 잠금을 잡으므로 동시 UPDATE 시 하나가 대기. 성능 영향은 무시할 수준 (배치 완료 시점에만 발생).

<details>
<summary><strong>Deep Dive: TOCTOU 레이스 컨디션 상세 분석</strong></summary>

##### 문제 시나리오

배치 AI 이미지 생성에서 여러 worker가 동시에 이미지를 생성하는 구조. 예: 4장 배치면 각 이미지가 독립적으로 완료됨.

기존 코드의 시간 흐름:

```
Worker A: UPDATE jobs SET completedImages = completedImages + 1  (3→4)
Worker A: SELECT * FROM jobs WHERE id = jobId                    (4/4 읽음)
                                                                  ← 여기서 Worker B 끼어듦
Worker B: UPDATE jobs SET completedImages = completedImages + 1  (4→5?!)
Worker B: SELECT * FROM jobs WHERE id = jobId                    (마찬가지로 완료 판정)

Worker A: completedImages + failedImages >= totalImages → true → releaseCredits() 호출
Worker B: completedImages + failedImages >= totalImages → true → releaseCredits() 또 호출
```

TOCTOU (Time-of-Check-to-Time-of-Use): UPDATE와 SELECT가 분리되어 있어서, 체크 시점과 실행 시점 사이에 상태가 바뀔 수 있음. 결과:

1. **`releaseCredits` 이중 호출** — 미사용 크레딧 환불이 2번 실행 → 유저에게 크레딧 초과 지급
2. **완료 상태 중복 기록** — 두 worker 모두 COMPLETED로 업데이트 시도

##### 수정 기법 1: UPDATE ... RETURNING (원자적 읽기)

```typescript
// Before: UPDATE 후 별도 SELECT (2번 DB 왕복, 사이에 gap)
await db.update(aiGenerationJobs).set({
  completedImages: sql`completedImages + 1`,
}).where(eq(aiGenerationJobs.id, jobId));

const updatedJob = await db.query.aiGenerationJobs.findFirst({ ... });

// After: UPDATE + SELECT가 하나의 원자적 연산
const [updatedJob] = await db.update(aiGenerationJobs).set({
  completedImages: sql`completedImages + 1`,
}).where(eq(aiGenerationJobs.id, jobId)).returning({
  completedImages: aiGenerationJobs.completedImages,
  failedImages: aiGenerationJobs.failedImages,
  totalImages: aiGenerationJobs.totalImages,
  userId: aiGenerationJobs.userId,
});
```

`RETURNING`은 UPDATE가 적용된 **직후의 행 상태**를 같은 쿼리 안에서 반환. 별도 SELECT 없이 정확한 값을 읽음.

##### 수정 기법 2: CAS (Compare-And-Swap) 패턴으로 완료 처리

```typescript
// Before: 완료 조건 충족하면 바로 UPDATE (누구든 다 통과)
if (updatedJob.status === 'PROCESSING' && ...) {
  await db.update(aiGenerationJobs).set({ status: finalStatus });
  // 크레딧 환불 — 여러 worker가 여기 도달 가능!
  await releaseCredits(userId, unusedCredits, jobId);
}

// After: WHERE 절에 status='PROCESSING' 조건 + RETURNING으로 "당첨자" 확인
const [claimed] = await db.update(aiGenerationJobs).set({
  status: finalStatus,
  completedAt: new Date(),
}).where(
  and(eq(aiGenerationJobs.id, jobId), eq(aiGenerationJobs.status, 'PROCESSING'))
).returning({ creditsReserved, creditsUsed, userId });

// claimed가 있는 worker만 (= 첫 번째로 UPDATE 성공한 놈만) 크레딧 환불
if (claimed) {
  const unusedCredits = claimed.creditsReserved - claimed.creditsUsed;
  if (unusedCredits > 0 && claimed.userId) {
    await releaseCredits(claimed.userId, unusedCredits, jobId);
  }
}
```

핵심: `WHERE status = 'PROCESSING'`이 DB 레벨 잠금 역할. 첫 번째 worker가 `PROCESSING → COMPLETED`로 바꾸면, 두 번째 worker의 UPDATE는 **매칭되는 행이 없어서 `RETURNING` 결과가 빈 배열**. `claimed`가 `undefined`이므로 `releaseCredits`를 호출하지 않음.

##### 실패 경로에도 동일 패턴 적용

성공 경로(`completedImages + 1`)뿐 아니라 **실패 경로(`failedImages + 1`)**에도 같은 RETURNING + CAS 패턴 적용. 실패 이미지로 총합이 채워져도 동일한 이중 환불 위험이 있었기 때문.

##### 변경 전/후 요약

| 항목 | Before | After |
|---|---|---|
| 완료 체크 | UPDATE + 별도 SELECT (gap 존재) | `UPDATE ... RETURNING` (원자적) |
| 완료 처리 | 조건 통과하면 누구나 실행 | CAS — `WHERE status='PROCESSING'` + `RETURNING`으로 단일 winner |
| 크레딧 환불 | 다중 호출 가능 | `claimed` 있을 때만 (1회 보장) |
| 적용 범위 | 성공 경로만 | 성공 + 실패 경로 모두 |

</details>

### 2단계: 보안 강화 (`0cc7e52`, `af4a914`)

#### 2-1. ENCRYPTION_KEY (n7tq)

**판정**: 코드 수정 불필요. `lib/crypto.ts:12`에서 32바이트 검증 이미 존재. 마이그레이션 스크립트도 존재 (`scripts/encrypt-existing-data.ts`).

**잔여 ops 작업**:
1. `openssl rand -hex 32`로 새 키 생성
2. `.env.local` + Vercel 환경변수 교체
3. `npx tsx scripts/encrypt-existing-data.ts` 실행

#### 2-2. JWT maxAge 축소 (j7qf)

**변경**: `auth.ts` — `maxAge: 30일 → 7일`, `updateAge: 24시간` 추가.

**평가**: 표준적인 보안 강화. updateAge로 활성 세션은 매일 토큰 갱신되어 role 변경 반영. 비활성 세션은 7일 후 만료.

#### 2-3. 글로벌 인증 레이어 (9yyw)

**변경**: 기존 `proxy.ts`에 인증/권한 로직 통합.

**추가된 보호**:
- 비공개 API 미인증 → 401
- `/api/admin` 비ADMIN → 403
- `/admin` 페이지 비ADMIN → `/` 리다이렉트
- 공개 API 화이트리스트 (`isPublicApi` 함수)
- `callbackUrl` 파라미터로 로그인 후 원래 경로 복귀

**공개 라우트 설계 평가**:

| 라우트 | 공개 판정 | 적절성 |
|--------|----------|--------|
| `/api/auth/*` | 공개 | **적절** — NextAuth 엔드포인트 |
| `/api/cron/*` | 공개 | **적절** — CRON_SECRET 자체 인증 |
| `/api/invitations/[id]/rsvp` | 공개 | **적절** — 하객 RSVP 제출 |
| `/api/invitations/[id]/guestbook` | 공개 | **적절** — 하객 방명록 |
| `/api/invitations/[id]/verify` | 공개 | **적절** — 비밀번호 확인 |
| `GET /api/invitations/[id]` | 공개 | **주의** — 공개 뷰 데이터. 메서드 체크로 GET만 허용 |

**개선 여지**: `GET /api/invitations/[id]`가 DRAFT 상태 초대장도 반환할 수 있음. 라우트 핸들러 자체에서 status 체크가 있는지 확인 필요 (2/20 리뷰 H9 방명록과 유사한 패턴).

#### 2-4. pageSize 상한 (l1v0)

**변경**: `invitations/route.ts` — `Math.min(50, Math.max(1, parseInt(...)))`.

**평가**: `ai/credits/route.ts`와 동일 패턴. Admin 라우트는 이미 Zod `.max(100)` 적용되어 있어 invitations만 수정하면 충분.

---

## 3. 코드 품질 평가

### 잘한 점

1. **최소 변경 원칙 준수** — P0 수정에 집중, 주변 코드 리팩터링 자제
2. **기존 패턴 일관 유지** — `Math.min(50, ...)` 패턴, CAS 패턴 등 기존 코드와 동일한 접근
3. **테스트 통과 유지** — 62 테스트 전부 통과, 기존 동작 변경 없음
4. **타입 안전성** — `tsc --noEmit` 에러 0건

### 개선 여지

1. **deepMerge Date 객체 엣지 케이스** — `Date instanceof Object === true`. 현재 문제없지만 방어 코드 고려
2. **stream 라우트 크레딧 환불 반복** — 파일 검증 실패 3곳에서 동일한 환불 코드 반복. 헬퍼 함수 추출 가능하지만 P0 수정 범위에서는 과도
3. **proxy.ts 공개 라우트 정규식** — `INVITATION_PUBLIC_SUB`와 `INVITATION_SINGLE` 정규식이 매 요청마다 실행. 성능 영향 무시할 수준이지만, 라우트가 늘어나면 Set 기반 lookup 고려

---

## 4. 보안 평가

### 해소된 위험

| 위험 | 등급 | 상태 |
|------|------|------|
| 인증 없는 API 노출 (example) | HIGH | **해소** (0단계) |
| console.log PII 노출 | HIGH | **해소** (0단계+1단계) |
| LIKE 인젝션 | MEDIUM | **해소** (0단계) |
| 내부 IP 노출 | MEDIUM | **해소** (0단계) |
| 크레딧 이중 환불 (TOCTOU) | HIGH | **해소** (1단계) |
| 크레딧 차감 실패 (순서 불일치) | HIGH | **해소** (1단계) |
| JWT 30일 장기 토큰 | MEDIUM | **해소** (2단계) |
| 페이지네이션 DoS | MEDIUM | **해소** (2단계) |
| 글로벌 인증 레이어 부재 | HIGH | **해소** (2단계) |

### 잔여 위험

| 위험 | 등급 | Beads | 비고 |
|------|------|-------|------|
| ENCRYPTION_KEY 길이 오류 | CRITICAL | `cuggu-n7tq` | ops 작업 잔여 |
| CSP unsafe-inline | HIGH | `cuggu-hxhz` | 카카오 SDK 의존성 조사 필요 |
| 프로덕션 시크릿 로테이션 | CRITICAL | `cuggu-ro6k` | ops 작업 |
| AI 프롬프트 인젝션 | MEDIUM | `cuggu-c006` | 영향도 낮음 |
| IP 스푸핑 rate limit 우회 | HIGH | 미등록 | 2/20 리뷰 지적, 미수정 |

---

## 5. 2/20 리뷰 즉시 조치 항목 진행 현황

2/20 리뷰 섹션 7에서 제시한 즉시 조치 10건 중 오늘 세션과 관련된 항목:

| # | 이슈 | 상태 | 비고 |
|---|------|------|------|
| 1 | useState → useEffect | 미착수 | 오늘 범위 아님 (2/20 코드 이슈) |
| 2 | 비속어 'ㅗ' 패턴 | 미착수 | |
| 3 | 방명록 PUBLISHED 체크 | 미착수 | |
| 4 | 커서 파라미터 검증 | 미착수 | |
| 5 | Moderation fail open | 미착수 | |
| 6 | 업로드 rate limit | 미착수 | |
| 7 | OG 이미지 1200x630 | 미착수 | |
| 8 | Drizzle $type | 미착수 | |
| 9 | 비속어+OG 테스트 | 미착수 | |
| 10 | 업로드 API 공통 추출 | 미착수 | |

**P0 버그 6건은 전부 해소**되었으나, 2/20 리뷰의 코드 품질/보안 즉시 조치 10건은 아직 미착수. 다음 세션에서 1~6번(30분 이내 항목) 우선 처리 권장.

---

## 6. 종합 평가

**계획 준수 점수: 95/100**

- 0~2단계 전부 완료 (100%)
- 보류 항목 100% 준수 — 새 기능, 리팩터링, 결제/UI 작업 안 함
- 2/20 리뷰 P0 지적 전부 해소
- n7tq ops 잔여 (-5점)

**감점 요인**:
- n7tq는 코드 수정이 불필요했기에 close했지만, 실제 ops 작업(키 교체 + 마이그레이션)은 미완료

**금일 세션의 핵심 성과**:
1. **P0 부채 해소** — 5일간 미수정이던 6건 전부 처리
2. **보안 레이어 추가** — proxy.ts 글로벌 인증으로 defense-in-depth 확보
3. **크레딧 시스템 안정화** — TOCTOU, 차감 순서, 이중 환불 모두 해소
4. **에디터 데이터 보호** — fake 데이터 자동저장 → 에러 UI, deepMerge로 데이터 유실 방지
5. **최소 변경 원칙** — 14건 수정에 코드 변경 +191/-110줄 (beads 제외). 불필요한 리팩터링 없음

**다음 세션 권장 우선순위**:
1. `cuggu-n7tq` ops 작업 (ENCRYPTION_KEY 교체)
2. 2/20 리뷰 즉시 조치 1~6번 (코드 품질/보안 퀵픽스)
3. 2/20 리뷰 즉시 조치 7~10번 (중규모 개선)
