# AI 앨범 v2 — 버그 수정 및 개선 설계서

> AI 앨범 v2 구현 완료 후 실사용 중 발견된 버그 5건 + UX 개선 사항 정리

---

## 1. 배치 생성 장수 불일치 (Bug)

### 증상
5장 생성 요청 → 8장 생성됨

### 원인
`app/api/ai/jobs/route.ts:120-130` — task 생성 시 `totalImages`를 무시하고 `styles.length × roles.length` 카테시안 곱으로 task 생성.

```
// 현재: styles × roles 전부 생성
for (const style of styles) {
  for (const role of roles) {
    tasks.push({ style, role, ... });
  }
}
// STUDIO(4 styles) × 2 roles = 8 tasks → totalImages(5) 무시
```

### 수정
- task 생성을 `totalImages` 기준으로 제한
- styles × roles 조합을 round-robin 배분 후 `totalImages`에서 자름

```typescript
const allCombinations = styles.flatMap(s => roles.map(r => ({ style: s, role: r })));
const limited = allCombinations.slice(0, totalImages);
const tasks = limited.map((combo, i) => ({
  index: i,
  style: combo.style,
  role: combo.role,
  referencePhotoId: refPhotoByRole.get(combo.role)!,
}));
```

### 수정 파일
- `app/api/ai/jobs/route.ts`

---

## 2. 크레딧 소진 시점 변경

### 현재 (선차감 → 환불)
```
Job 생성 → 전액 선차감(RESERVE) → 생성 실행 → 실패분 환불(REFUND)
```

### 변경 (완료 시 개별 차감)
```
Job 생성 → 잔액 체크만 → 이미지 1개 성공 → 1크레딧 차감 → 다음 이미지 ...
→ 크레딧 부족 시 나머지 중단
```

### 이유
- 실패 시 환불 로직의 복잡도 제거
- 사용자가 실제 받은 결과물에 대해서만 과금 → 직관적
- 페이지 이탈 시 미생성분 크레딧 손실 방지

### 수정 상세

**`app/api/ai/jobs/route.ts`**:
- `reserveCredits()` 호출 제거
- `checkCredits(user.id)` → `balance >= totalImages` 확인만 수행
- `creditsReserved` 필드는 `totalImages`로 세팅 (참고용)

**`app/api/ai/generate/stream/route.ts`**:
- 현재: `if (!jobId)` 일 때만 `deductCredits` (line 191-203)
- 변경: jobId 유무 관계없이 **항상** 생성 성공 후 `deductCredits(user.id, 1)`
- 생성 전 잔액 체크 → 부족 시 `{ type: 'error', error: 'Insufficient credits' }` SSE 전송

**`app/api/ai/jobs/[id]/route.ts`** (PATCH):
- `releaseCredits()` 호출 제거
- `unusedCredits` 계산 로직 제거

**`hooks/useAIGeneration.ts`** (generateBatch):
- SSE `error` 이벤트에서 `Insufficient credits` 감지 시 → 나머지 task 즉시 중단
- 현재: 개별 task 실패 시 계속 진행 → 크레딧 부족은 이후 전부 실패하므로 즉시 중단이 맞음

### 크레딧 플로우 (변경 후)

```
User: 10크레딧 보유, 5장 배치 요청

POST /api/ai/jobs
├─ checkCredits → balance(10) >= needed(5) ✓
├─ Job 생성 (creditsReserved: 5, creditsUsed: 0)
└─ tasks 5개 반환

Client: 순차 생성 시작
├─ Task 1 → 성공 → deductCredits(1) → balance: 9, creditsUsed: 1
├─ Task 2 → 성공 → deductCredits(1) → balance: 8, creditsUsed: 2
├─ Task 3 → 실패 → 차감 없음, failedImages++
├─ Task 4 → 성공 → deductCredits(1) → balance: 7, creditsUsed: 3
├─ Task 5 → 성공 → deductCredits(1) → balance: 6, creditsUsed: 4
└─ PATCH /api/ai/jobs/[id] → PARTIAL (1 failed)

결과: 10 → 6 크레딧 (4장 성공분만 차감)
```

### 수정 파일
- `app/api/ai/jobs/route.ts`
- `app/api/ai/generate/stream/route.ts`
- `app/api/ai/jobs/[id]/route.ts`
- `hooks/useAIGeneration.ts`

---

## 3. 생성 완료 시 앨범 기본 그룹에 자동 추가

### 현재
이미지가 `groupId` 없이 앨범에 추가됨 → "미분류"로 표시

### 변경
- 앨범 생성 시 기본 그룹 자동 생성
- 새 이미지는 기본 그룹에 자동 배정

### 수정 상세

**`app/api/ai/albums/route.ts`** (POST):
```typescript
groups: [{ id: createId(), name: '전체 사진', sortOrder: 0, isDefault: true }]
```

**`app/dashboard/ai-photos/components/AlbumDashboard.tsx`** (자동 큐레이션):
```typescript
const defaultGroup = groups.find(g => g.isDefault);
newImages.push({
  ...imageData,
  groupId: defaultGroup?.id,
});
```

### 수정 파일
- `app/api/ai/albums/route.ts`
- `app/dashboard/ai-photos/components/AlbumDashboard.tsx`

---

## 4. Background 생성 UX

### 4a. 상단 프로그레스 바

**현재**: `BatchGenerationView`(전체) 또는 `GenerationFloatingBar`(하단 최소화) 중 하나
**변경**: 생성 중일 때 **항상** 앨범 헤더 아래에 컴팩트 프로그레스 바 표시

```
┌──────────────────────────────────────┐
│  우리의 웨딩 앨범        스튜디오 스냅  │
│  12장 생성 · 6장 선택                 │
├──────────────────────────────────────┤
│  🔄 ████████░░░░  3/5장 생성 중       │  ← 신규
├──────────────────────────────────────┤
│  (나머지 앨범 콘텐츠)                  │
└──────────────────────────────────────┘
```

### 4b. 페이지 이탈 경고

- `beforeunload` 이벤트로 브라우저 이탈 시 경고
- "사진 생성이 진행 중입니다. 페이지를 떠나면 생성이 중단됩니다."

### 4c. 이탈 시 데이터 보호

**문제**: 페이지 이탈 시 이미 생성된 이미지가 앨범 `images` JSONB에 반영 안 됨

이미지 생명 주기:
```
생성 성공 → aiGenerations 테이블 저장 (✓ 안전)
         → S3 업로드 완료 (✓ 안전)
         → 앨범 images JSONB 추가 (✗ 페이지 이탈 시 누락)
         → Job 상태 업데이트 (✗ 페이지 이탈 시 PROCESSING 방치)
```

**수정 — 페이지 재방문 시 자동 복구**:

1. album 로드 시 orphan 이미지 감지 + 자동 동기화:
```typescript
// DB(aiGenerations)에는 있지만 album.images에 없는 사진 → 기본 그룹에 추가
const existingUrls = new Set(albumImages.map(img => img.url));
const orphans = album.generations.flatMap(gen =>
  (gen.generatedUrls ?? [])
    .filter(url => !existingUrls.has(url))
    .map(url => ({ url, generationId: gen.id, style: gen.style, role: gen.role }))
);
if (orphans.length > 0) { /* 기본 그룹에 추가 + PUT 저장 */ }
```

2. PROCESSING 상태의 stale Job → 자동 complete 처리

### 수정 파일
- `app/dashboard/ai-photos/components/AlbumDashboard.tsx`

---

## 5. 앨범 전체 사진 보기

### 현재
- AlbumCuration: 그룹 필터 "전체" 버튼으로 전체 보기 가능
- "생성된 사진" 섹션: 스타일별 그룹핑만 지원

### 변경
- "생성된 사진" 섹션에 "전체 보기" 토글 추가
- 토글 시 스타일 구분 없이 모든 사진을 flat 그리드로 표시

### 수정 파일
- `app/dashboard/ai-photos/components/AlbumDashboard.tsx`

---

## 수정 파일 요약

| 파일 | 이슈 | 변경 내용 |
|------|------|----------|
| `app/api/ai/jobs/route.ts` | #1, #2 | task 생성 루프 수정 + 크레딧 선차감 제거 |
| `app/api/ai/generate/stream/route.ts` | #2 | jobId 있어도 개별 크레딧 차감 |
| `app/api/ai/jobs/[id]/route.ts` | #2 | 환불 로직 제거 |
| `hooks/useAIGeneration.ts` | #2, #4 | 크레딧 부족 시 배치 중단 + beforeunload |
| `app/api/ai/albums/route.ts` | #3 | 앨범 생성 시 기본 그룹 |
| `AlbumDashboard.tsx` | #3, #4, #5 | 자동 그룹 배정 + 프로그레스 + orphan 복구 + 전체 보기 |

## 구현 순서

1. **#1 + #2** (배치 장수 버그 + 크레딧 시점) — 같은 파일, 함께 처리
2. **#3** (기본 그룹) — 독립적
3. **#4** (프로그레스 + 이탈 경고 + 데이터 보호) — UI
4. **#5** (전체 보기) — UI
