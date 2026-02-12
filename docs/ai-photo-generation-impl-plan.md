# AI 사진 생성 프로세스 전면 개편 — 구현 계획

> 설계 문서: `docs/ai-photo-generation-redesign.md`
> 작성일: 2026-02-12
> 브랜치: `feat/ai-album-v2`

---

## Context

현재 AI 사진 생성은 **1크레딧=2장, 단건 생성만 가능, 매번 사진 재업로드** 구조로, 묶음 촬영 수요를 충족하지 못하고 크레딧 비용도 불투명하다. 이번 개편으로:
- 생성 모드 2가지 (묶음/개별) 도입
- 1크레딧=1장으로 단순화
- 참조 사진 한 번 등록 후 재사용
- 크레딧 확인 단계 필수
- 무료 크레딧 2→5개 증가

---

## Phase 0: DB 스키마 + 상수 변경 (기반)

모든 후속 작업의 전제 조건.

### 0-1. BATCH_SIZE 변경
**파일**: `lib/ai/constants.ts:15`
- `BATCH_SIZE: 2` → `BATCH_SIZE: 1`

### 0-2. AIStreamingGallery 하드코딩 버그 수정
**파일**: `components/ai/AIStreamingGallery.tsx`
- 60행: `{completedCount}/4` → `{completedCount}/{images.length}`
- 122행: `(completedCount / 4) * 100` → `(completedCount / images.length) * 100`

### 0-3. DB 스키마 변경
**파일**: `db/schema.ts`

**(a) 기존 테이블 수정:**
- `users.aiCredits` default: `2` → `5`
- `aiGenerations`에 `jobId` FK 추가

**(b) 신규 enum 3개:**
- `aiJobModeEnum`: `SINGLE`, `BATCH`
- `aiJobStatusEnum`: `PENDING`, `PROCESSING`, `COMPLETED`, `PARTIAL`, `FAILED`, `CANCELLED`
- `aiCreditTxTypeEnum`: `DEDUCT`, `REFUND`, `PURCHASE`, `BONUS`

**(c) 신규 테이블 3개:**

| 테이블 | 핵심 컬럼 | 인덱스 |
|--------|----------|--------|
| `ai_reference_photos` | userId, role, originalUrl, faceDetected, isActive | (userId, role) |
| `ai_generation_jobs` | userId, albumId, mode, config:jsonb, totalImages, completedImages, failedImages, creditsReserved, creditsUsed, status | (userId, status) |
| `ai_credit_transactions` | userId, type, amount, balanceAfter, referenceType, referenceId, description | (userId) |

**(d) Relations 추가** — usersRelations, aiGenerationsRelations 확장

**(e) 타입 추가:**
- `types/ai.ts`에 `JobConfig` 인터페이스
- `schemas/ai.ts`에 Job, ReferencePhoto Zod 스키마

### 0-4. 마이그레이션
```bash
npx drizzle-kit generate && npx drizzle-kit push
```

### 0-5. 결제 스키마 검토
**파일**: `schemas/payment.ts:268-281`
- `CREDITS_GRANTED` / `PAYMENT_AMOUNTS` — 1크레딧=1장 기준으로 코멘트 업데이트. 값 자체는 비즈니스 결정에 따라 추후 조정.

### 검증
- `npx tsc --noEmit` 타입 에러 없음
- 기존 단건 생성 (BATCH_SIZE=1) 동작 확인
- AIStreamingGallery 진행률 표시 `1/1` 정상

---

## Phase 1: 참조 사진 API (Phase 0과 병렬 가능)

매번 사진 업로드 반복을 제거. 한 번 등록 후 재사용.

### 1-1. 참조 사진 API
**신규 파일**: `app/api/ai/reference-photos/route.ts`
- POST: FormData(image, role) → 얼굴 감지(`lib/ai/face-detection.ts`) → S3 업로드(`lib/ai/s3.ts`) → DB 저장
- GET: 유저의 참조 사진 목록 (role별 active 포함)

**신규 파일**: `app/api/ai/reference-photos/[id]/route.ts`
- DELETE: isActive=false 처리

### 1-2. 참조 사진 Zod 스키마
**파일**: `schemas/ai.ts` — `CreateReferencePhotoSchema`, `ReferencePhotoSchema` 추가

### 검증
- POST 업로드 → 얼굴 감지 성공/실패 피드백
- GET 조회 → role별 필터링 동작
- DELETE → isActive=false 확인

---

## Phase 2: 크레딧 시스템 확장 (Phase 0과 병렬 가능)

크레딧 선예약/환불 + 거래 이력 추가.

### 2-1. 크레딧 서비스 함수 추가
**파일**: `lib/ai/credits.ts`

기존 `deductCredits`, `refundCredits` 유지 (하위 호환). 신규 함수 추가:

```typescript
reserveCredits(userId, amount, jobId) → balanceAfter
  // deductCredits + ai_credit_transactions INSERT (type: DEDUCT)
  // db.transaction() 사용 필수

releaseCredits(userId, amount, jobId) → balanceAfter
  // refundCredits + ai_credit_transactions INSERT (type: REFUND)

getCreditHistory(userId, limit?) → CreditTransaction[]
```

### 2-2. 크레딧 API 확장
**파일**: `app/api/user/credits/route.ts` 확장 또는 `app/api/ai/credits/route.ts` 신규
- GET → `{ balance, transactions[] }`

### 검증
- `reserveCredits(userId, 5, jobId)` → users.aiCredits 5 감소 + tx 기록
- `releaseCredits(userId, 2, jobId)` → 2 증가 + tx 기록
- GET /api/ai/credits → 잔액 + 이력

---

## Phase 3: Job 기반 생성 시스템 (Phase 0+1+2 완료 후)

묶음 촬영의 핵심 인프라.

### 3-1. Job API
**신규 파일**: `app/api/ai/jobs/route.ts`

```
POST /api/ai/jobs
  body: { albumId, mode, styles[], roles[], modelId, totalImages, referencePhotoIds[] }
  처리:
    1. 참조 사진 존재 확인
    2. 크레딧 계산 (totalImages × 1)
    3. reserveCredits (선예약)
    4. Job 레코드 생성 (PENDING)
    5. 태스크 리스트 계산 (스타일×역할 조합)
  응답: { jobId, creditsReserved, tasks[] }
```

**신규 파일**: `app/api/ai/jobs/[id]/route.ts`
- GET: Job 상태 + 하위 generations

### 3-2. 스트리밍 API 확장
**파일**: `app/api/ai/generate/stream/route.ts`

변경점 (하위 호환 유지):
- FormData 파라미터 추가: `jobId?`, `referencePhotoId?`
- `referencePhotoId` 있으면 DB에서 URL 조회 → 얼굴 감지 스킵 (이미 검증됨)
- `jobId` 있으면 크레딧 차감 스킵 (이미 선예약됨)
- `jobId` 있으면 생성 완료 시 `ai_generation_jobs.completedImages++`
- `done` 이벤트에 `jobProgress: { completed, total }` 추가

### 3-3. Job 완료 처리
**파일**: `app/api/ai/jobs/[id]/route.ts`에 PATCH 또는 별도 로직

프론트엔드가 모든 태스크 실행 후:
- Job 상태 업데이트: COMPLETED / PARTIAL / FAILED
- 미사용 크레딧 환불: `releaseCredits(userId, creditsReserved - creditsUsed, jobId)`

### 검증
- Job 생성 → 크레딧 선예약 확인
- 5장 묶음: 3성공 2실패 → completedImages=3, failedImages=2, 2크레딧 환불
- jobId 없이 기존 단건 생성 → 기존과 동일하게 동작

---

## Phase 4: 프론트엔드 생성 플로우 (Phase 3 완료 후)

### 4-1. useAIGeneration 훅 추출
**신규 파일**: `hooks/useAIGeneration.ts`

`AlbumDashboard.tsx:278-373`의 SSE 스트리밍 로직을 훅으로 추출:

```typescript
export function useAIGeneration(options) {
  return {
    state: { isGenerating, currentIndex, totalImages, completedUrls, statusMessage, error, jobId },
    generateSingle: (referencePhotoId, style, role) => Promise<void>,
    generateBatch: (jobId, tasks[]) => Promise<void>,  // 순차 SSE N번 호출
    cancel: () => void,
  };
}
```

### 4-2. GenerationWizard + 스텝 컴포넌트
**신규 파일들** (모두 `app/dashboard/ai-photos/components/`):

| 파일 | 역할 |
|------|------|
| `GenerationWizard.tsx` | 4스텝 관리 + AnimatePresence 슬라이드 |
| `ModeSelectStep.tsx` | 묶음/개별 모드 카드 선택 |
| `StyleConfigStep.tsx` | 모드별 스타일/장수 설정 |
| `CreditConfirmStep.tsx` | 크레딧 확인 (P0 필수) — 비용, 잔여, 안내문구 |

### 4-3. StyleSelector 멀티셀렉트
**파일**: `app/dashboard/ai-photos/components/StyleSelector.tsx`
- props에 `multiSelect?: boolean`, `selectedStyles?: AIStyle[]`, `onStylesChange?` 추가
- 하위 호환: `multiSelect` 없으면 기존 단일 선택 유지

### 4-4. BatchGenerationView + FloatingBar
**신규 파일들**:
- `BatchGenerationView.tsx` — 동적 그리드, sticky 프로그레스 바, 예상 시간
- `GenerationFloatingBar.tsx` — 최소화 시 하단 플로팅 바
- `ResultReveal.tsx` — 결과 카드 리빌 애니메이션 (Framer Motion)

### 4-5. CreditDisplay
**신규 파일**: `CreditDisplay.tsx`
- 잔여 크레딧 + 이번 소모 예정 표시
- 부족 시 경고 + 충전 CTA

### 4-6. AlbumDashboard 리팩터링
**파일**: `app/dashboard/ai-photos/components/AlbumDashboard.tsx`
- 추출: handleGenerate → useAIGeneration 훅
- 추출: 추가 촬영 섹션 (680-778행) → GenerationWizard
- 추출: RoleState → 훅 내부로 이동
- 잔여: 앨범 헤더, 그룹/태그, 큐레이션, 생성 기록, 레거시
- 목표: 900줄 → ~500줄

### 4-7. AlbumOnboarding 확장
**파일**: `app/dashboard/ai-photos/components/AlbumOnboarding.tsx`
- 참조 사진 업로드 단계 추가
- 이미 등록된 참조 사진 있으면 스킵

### 검증
- 개별 촬영: 스타일 1개 → 확인 → 1장 생성 → 앨범 자동 저장
- 묶음 촬영 5장: 모드 선택 → 장수 → 확인 → 5장 순차 생성 → 프로그레스 정확
- 묶음 촬영 중 최소화 → 플로팅 바 표시 → 확대 복원
- 기존 큐레이션/그룹/태그 정상 동작

---

## 의존관계 그래프

```
Phase 0 (스키마+상수) ─┬─ Phase 1 (참조 사진) ──┐
                      └─ Phase 2 (크레딧)  ─────┤
                                               v
                              Phase 3 (Job 시스템) → Phase 4 (프론트엔드)
```

Phase 0-2는 병렬 가능. Phase 3부터 순차.

---

## 파일 변경 요약

### 수정 (14개)
| 파일 | 변경 |
|------|------|
| `lib/ai/constants.ts` | BATCH_SIZE 2→1 |
| `components/ai/AIStreamingGallery.tsx` | /4 하드코딩 → images.length |
| `db/schema.ts` | 테이블 3개, enum 3개, FK, relations, default |
| `lib/ai/credits.ts` | reserveCredits, releaseCredits, getCreditHistory |
| `lib/ai/generate.ts` | generateBatchPhotos 함수 |
| `app/api/ai/generate/stream/route.ts` | jobId, referencePhotoId 파라미터 |
| `app/dashboard/ai-photos/components/AlbumDashboard.tsx` | 생성 로직 추출, Wizard 통합 |
| `app/dashboard/ai-photos/components/StyleSelector.tsx` | multiSelect |
| `app/dashboard/ai-photos/components/AlbumOnboarding.tsx` | 참조 사진 |
| `app/dashboard/ai-photos/[albumId]/page.tsx` | Wizard 연동 |
| `schemas/ai.ts` | Job, ReferencePhoto Zod |
| `schemas/payment.ts` | 코멘트 업데이트 |
| `types/ai.ts` | JobConfig 등 타입 |
| `app/api/user/credits/route.ts` | 이력 포함 확장 |

### 신규 (14개)
| 파일 | 용도 |
|------|------|
| `app/api/ai/reference-photos/route.ts` | 참조 사진 POST/GET |
| `app/api/ai/reference-photos/[id]/route.ts` | 참조 사진 DELETE |
| `app/api/ai/jobs/route.ts` | Job 생성 |
| `app/api/ai/jobs/[id]/route.ts` | Job 상태 조회 |
| `hooks/useAIGeneration.ts` | SSE + 배치 통합 훅 |
| `GenerationWizard.tsx` | 4스텝 플로우 |
| `ModeSelectStep.tsx` | 모드 선택 |
| `StyleConfigStep.tsx` | 스타일/장수 |
| `CreditConfirmStep.tsx` | 크레딧 확인 |
| `BatchGenerationView.tsx` | 대량 프로그레스 |
| `GenerationFloatingBar.tsx` | 플로팅 바 |
| `ResultReveal.tsx` | 결과 애니메이션 |
| `CreditDisplay.tsx` | 크레딧 표시 |
| `stores/generation-progress.ts` | Zustand 진행 상태 (선택) |

(components/ = `app/dashboard/ai-photos/components/`)

---

## Beads 이슈 매핑

| Phase | Issue ID | 제목 |
|-------|----------|------|
| 에픽 | `cuggu-3ff` | AI 사진 생성 프로세스 전면 개편 |
| 0 | `cuggu-4al` | BATCH_SIZE 2→1 + Gallery 하드코딩 수정 |
| 0 | `cuggu-w70` | DB 스키마 — 3 enum + 3 테이블 + FK |
| 0 | `cuggu-wci` | Drizzle 마이그레이션 (blocked by w70) |
| 0 | `cuggu-gsr` | 결제 스키마 코멘트 업데이트 |
| 1 | `cuggu-bi8` | 참조 사진 Zod 스키마 (blocked by w70) |
| 1 | `cuggu-4a1` | 참조 사진 API (blocked by wci, bi8) |
| 2 | `cuggu-au9` | 크레딧 서비스 확장 (blocked by wci) |
| 2 | `cuggu-m0a` | 크레딧 API (blocked by au9) |
| 3 | `cuggu-9sz` | Job API (blocked by 4a1, au9) |
| 3 | `cuggu-4gl` | 스트리밍 API 확장 (blocked by 9sz) |
| 3 | `cuggu-c8k` | Job 완료 처리 (blocked by 9sz) |
| 4 | `cuggu-2cq` | useAIGeneration 훅 (blocked by 4gl) |
| 4 | `cuggu-8ou` | StyleSelector 멀티셀렉트 (blocked by w70) |
| 4 | `cuggu-tmw` | GenerationWizard (blocked by 2cq, 8ou) |
| 4 | `cuggu-5wo` | BatchGenerationView (blocked by 2cq) |
| 4 | `cuggu-sl7` | AlbumDashboard 리팩터링 (blocked by tmw, 5wo) |
| 4 | `cuggu-k5p` | AlbumOnboarding 참조 사진 (blocked by 4a1) |

---

## 리스크 & 주의사항

1. **기존 데이터 보존**: aiGenerations.generatedUrls는 기존 2개씩 → 프론트에서 `.length` 동적 대응
2. **기존 유저 크레딧**: default 변경은 신규만 적용. 기존 유저 보너스는 별도 SQL
3. **하위 호환**: stream API를 jobId 없이 호출하는 에디터 AIPhotoGenerator.tsx 등 기존 경로 유지
4. **묶음 생성 이탈**: 클라이언트 닫으면 남은 생성 중단 → Job PARTIAL 처리, 미사용 크레딧 환불
5. **미완료 Job 정리**: 프론트 이탈 시 PROCESSING 상태로 남은 Job → 수동/배치 정리 필요 (Phase 2)
