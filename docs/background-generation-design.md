# 백그라운드 AI 생성 + 상태 API

## Context

두 가지 문제:
1. **이미지 수 불일치**: "5개 생성" 요청했는데 8개가 생성됨. SINGLE 모드에서 `styles × roles` 곱으로 계산되어 4스타일 × 2역할 = 8장. BATCH 모드도 마찬가지로 job API가 `totalImages`를 무시하고 `styles × roles` 태스크를 생성.
2. **생성이 UI를 블로킹**: 클라이언트가 SSE 연결을 순차적으로 열어서 모든 task를 직접 오케스트레이션. 생성 중 UI 이동 불가, 브라우저 닫으면 생성 중단, 재개 불가.

### 현재 흐름

```
위자드에서 "촬영 시작" → POST /api/ai/jobs (job 생성 + 크레딧 예약)
→ tasks 배열은 클라이언트에만 반환 (DB 미저장)
→ 클라이언트가 for loop으로 각 task마다 POST /api/ai/generate/stream (SSE)
→ 각 SSE 응답 대기 (20~60초/장)
→ 전부 끝나면 PATCH /api/ai/jobs/[id] { action: 'complete' }
```

## 변경 사항

### 1. Job 생성 시 tasks를 DB에 영속화

**파일**: `db/schema.ts`, `app/api/ai/jobs/route.ts`, `types/ai.ts`

`aiGenerationJobs` 테이블에 `tasks` JSONB 컬럼 추가:

```typescript
// db/schema.ts — aiGenerationJobs에 추가
tasks: jsonb('tasks').default([]).$type<JobTaskRecord[]>(),
```

```typescript
// types/ai.ts
export interface JobTaskRecord {
  index: number;
  style: AIStyle;
  role: PersonRole;
  referencePhotoId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  generationId?: string;  // 완료 시 aiGenerations.id
  error?: string;         // 실패 시 에러 메시지
}
```

Job 생성 API에서 tasks를 DB에 저장:

```typescript
// app/api/ai/jobs/route.ts — 기존 tasks 배열을 DB에도 저장
const taskRecords = tasks.map(t => ({ ...t, status: 'PENDING' as const }));

await db.insert(aiGenerationJobs).values({
  ...existing,
  tasks: taskRecords,  // 추가
});
```

**DB 마이그레이션**: `ALTER TABLE ai_generation_jobs ADD COLUMN tasks jsonb DEFAULT '[]'::jsonb;`

### 2. 단일 Task 처리 API

**새 파일**: `app/api/ai/jobs/[id]/process-next/route.ts`

다음 PENDING task를 찾아서 1건 처리하고 결과를 반환한다.

```
POST /api/ai/jobs/[id]/process-next

Response (처리 완료):
{
  done: false,
  task: { index, style, role, status: 'COMPLETED', generationId },
  generation: { id, generatedUrls, style, role }
}

Response (남은 task 없음):
{ done: true }
```

처리 로직 (기존 `generate/stream/route.ts`에서 추출):
1. Job 조회 → 다음 PENDING task 찾기
2. task.status = 'PROCESSING'으로 DB 업데이트
3. 참조 사진 URL 조회
4. `generateWeddingPhotos()` 호출 (SSE 아닌 동기 버전)
5. Replicate면 S3 복사
6. `aiGenerations` INSERT
7. task.status = 'COMPLETED', job.completedImages++ DB 업데이트
8. 결과 반환

실패 시: task.status = 'FAILED', job.failedImages++ 업데이트, 다음 task로 진행 가능.

**재사용 코드**:
- `lib/ai/generate.ts` → `generateWeddingPhotos()` (동기 버전, 이미 존재)
- `lib/ai/s3.ts` → `copyToS3()`
- `lib/ai/credits.ts` → 크레딧은 job 생성 시 이미 예약됨, 개별 task에서 차감 불필요

### 3. Job 상태 조회 API 개선

**파일**: `app/api/ai/jobs/[id]/route.ts` (기존 GET 개선)

현재도 GET이 있지만, tasks 정보와 생성된 이미지 URL을 포함하도록 보강:

```
GET /api/ai/jobs/[id]

Response:
{
  job: { id, status, totalImages, completedImages, failedImages },
  tasks: [{ index, style, role, status, generationId }],
  generations: [{ id, style, role, generatedUrls, status }]
}
```

변경 최소화: 기존 GET 응답에 `tasks` 필드가 자연스럽게 포함됨 (JSONB 컬럼이니까 `...job`으로 이미 노출).

### 4. useAIGeneration 훅 리팩토링

**파일**: `hooks/useAIGeneration.ts`

현재 (블로킹):
```
for task in tasks:
  await fetch('/api/ai/generate/stream')  // 20~60초 대기
```

변경 후 (백그라운드 폴링):
```
// 1. Job 생성 후 즉시 process-next 호출 시작
processLoop():
  result = await fetch('/api/ai/jobs/{id}/process-next')
  if (!result.done) updateState(result) → processLoop()  // 재귀
  else completeJob()

// 2. 별도 폴링으로 UI 업데이트 (process-next 실패/중단 대비)
poll():
  status = await fetch('/api/ai/jobs/{id}')
  updateUI(status)
```

핵심 변경:
- `generateBatch()` → Job 생성 + process loop 시작 후 **즉시 리턴** (비블로킹)
- process loop은 백그라운드 Promise로 실행
- 상태는 기존 `GenerationState`에 업데이트 (UI 반영)
- `cancel()` → AbortController로 현재 process-next 요청 중단 + job 완료 처리

### 5. 앨범 페이지 진입 시 진행 중 Job 감지

**파일**: `app/dashboard/ai-photos/[albumId]/page.tsx`, `hooks/useAIGeneration.ts`

페이지 로드 시:
1. `GET /api/ai/jobs?albumId={id}&status=PROCESSING` 으로 진행 중인 Job 확인
2. 있으면 BatchGenerationView 표시 + process loop 재개

필요한 API: 앨범별 진행 중 Job 조회 (기존 Job API에 필터 추가하거나, albums API 응답에 포함)

방법 A — 앨범 API에 activeJob 포함:
```typescript
// GET /api/ai/albums/[id] 응답에 추가
activeJob?: { id, status, totalImages, completedImages, tasks, generations }
```

방법 B — 별도 엔드포인트:
```
GET /api/ai/jobs?albumId={id}&status=PENDING,PROCESSING
```

→ **방법 A 추천**: 앨범 진입 시 1 request로 모든 정보 확인

### 6. 이미지 수 계산 수정

**파일**: `app/api/ai/jobs/route.ts`, `app/dashboard/ai-photos/components/GenerationWizard.tsx`

**문제**: Job API가 `totalImages` 파라미터를 무시하고 `styles × roles` 태스크를 항상 생성.

BATCH 모드:
- 사용자가 선택한 `totalImages`(5, 10, 20)만큼만 태스크 생성
- styles × roles 조합에서 totalImages개를 라운드로빈으로 분배
  ```
  예: totalImages=5, styles=[A,B,C], roles=[GROOM,BRIDE]
  → tasks: A/GROOM, A/BRIDE, B/GROOM, B/BRIDE, C/GROOM (5개)
  ```

SINGLE 모드:
- styles × roles = 전체 조합 (현재 동작 유지)
- 단, 위자드 UI에서 총 이미지 수를 명확히 표시:
  ```
  "4 스타일 × 2 역할(신랑, 신부) = 8장 · 8 크레딧"
  ```

**Job API 수정** (`app/api/ai/jobs/route.ts`):
```typescript
// 현재: styles × roles 전부 생성
// 변경: totalImages로 제한
const allCombinations = styles.flatMap(style =>
  roles.map(role => ({ style, role, referencePhotoId: refPhotoByRole.get(role)! }))
);

// BATCH: totalImages개만 라운드로빈 선택
// SINGLE: 전체 사용
const selectedTasks = mode === 'BATCH'
  ? allCombinations.slice(0, totalImages)  // 또는 라운드로빈
  : allCombinations;
```

## 범위 밖

- **서버사이드 백그라운드 워커 (Bull/Redis)**: 서버리스 환경에서는 과도한 인프라. 클라이언트 드리븐 + DB 영속화로 충분
- **WebSocket 실시간 업데이트**: 폴링으로 대체 (3~5초 간격)
- **중복 process-next 호출 방지 (동시성)**: 단일 사용자 시나리오에서는 task status 체크로 충분

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `db/schema.ts` | `aiGenerationJobs`에 `tasks` JSONB 추가 |
| `types/ai.ts` | `JobTaskRecord` 인터페이스 추가 |
| `app/api/ai/jobs/route.ts` | tasks를 DB에 저장 + BATCH 모드 totalImages 제한 |
| `app/api/ai/jobs/[id]/route.ts` | GET 응답 보강 (이미 tasks 포함됨) |
| `app/api/ai/jobs/[id]/process-next/route.ts` | **새 파일** — 단일 task 처리 API |
| `app/api/ai/albums/[id]/route.ts` | GET에 activeJob 포함 |
| `hooks/useAIGeneration.ts` | 비블로킹 process loop + 페이지 복귀 시 재개 |
| `app/dashboard/ai-photos/[albumId]/page.tsx` | 진행 중 Job 감지 + 재개 |
| `app/dashboard/ai-photos/components/AlbumDashboard.tsx` | 재개 로직 연결 |
| `app/dashboard/ai-photos/components/GenerationWizard.tsx` | SINGLE 모드 이미지 수 표시 개선 |

## 검증

1. BATCH 모드 5장 선택 → 정확히 5개 task 생성되는지 확인
2. SINGLE 모드 → "N 스타일 × M 역할 = K장" 명확히 표시되는지 확인
3. 생성 시작 후 UI가 블로킹되지 않는지 확인
4. 생성 중 페이지 이동 후 복귀 → 진행 상황 표시 + 자동 재개
5. 생성 중 새로고침 → 진행 중 Job 감지 + process loop 재개
6. 중지 버튼 → 현재 task 완료 후 중단, 미사용 크레딧 환불
7. GET /api/ai/jobs/[id] → tasks + generations 정상 반환
