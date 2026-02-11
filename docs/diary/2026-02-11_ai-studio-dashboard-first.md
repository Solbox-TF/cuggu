# AI 포토 스튜디오: 대시보드-퍼스트 리디자인

> **날짜**: 2026-02-11
> **배경**: editor-ux-review 팀 분석에서 AI Studio 분리 합의 후, 진입 순서 재검토
> **결론**: AI 포토 스튜디오를 대시보드 독립 메뉴로 승격. 청첩장 없이도 접근 가능하게.

---

## 문제 제기

editor-ux-review 문서의 제안:
```
Setup Wizard (청첩장 생성) → AI Studio CTA → Customize
```

**의문**: 청첩장을 먼저 만들고 넘어가는 순서가 맞는가? AI가 핵심 차별점이면 후크를 앞에 놓아야 하지 않나?

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| `/dashboard/ai-photos` | **이미 존재** — 독립 페이지, 전용 컴포넌트 |
| `DashboardNav` | **이미 메뉴 있음** — "AI 사진 생성" (Sparkles 아이콘, 3번째) |
| "청첩장에 적용하기" 버튼 | **TODO** — `alert()` only (`page.tsx:155-160`) |
| 에디터 GalleryTab | AIPhotoSection 임베딩 (3단계 중첩, 접힌 상태) |
| AI 크레딧 | 사이드바 하단에 표시 + 구매 버튼 |

**핵심**: 인프라는 이미 대시보드-독립 구조. 연결만 안 되어있을 뿐.

### 대시보드 vs 에디터 컴포넌트 격차

| 항목 | 대시보드 `/dashboard/ai-photos` | 에디터 `AIPhotoGenerator` |
|------|------|------|
| API | 동기 POST `/api/ai/generate` | **SSE 스트리밍** `/api/ai/generate/stream` |
| 선택 | 싱글 (역할당 1장) | **멀티 (토글)** |
| 모델 | dev 모드에서만 | **항상 (고급 설정 아코디언)** |
| 생성 중 UI | `GenerationProgress` (스피너) | **`AIStreamingGallery` (실시간 4슬롯)** |
| 결과 UI | `ResultGallery` (줌 없음) | **`AIResultGallery` (줌 모달 + 멀티셀렉트)** |
| 청첩장 연결 | `alert()` TODO | `onAddToGallery` 직접 연결 |

에디터용 컴포넌트가 이미 더 좋음. 대시보드 페이지가 열등한 상태.

---

## 분석: 왜 대시보드-퍼스트가 맞는가

### 1. 후크는 앞에 와야 함

AI 사진이 Cuggu의 핵심 차별점. 유저가 플랫폼을 평가하는 순간("이거 다른 곳이랑 뭐가 달라?")에 보여줘야 전환됨. 청첩장 폼 10분 채운 뒤에 보여주면 늦음.

비유: 시그니처 디저트가 있는 레스토랑이 풀코스 먹은 뒤에야 디저트 메뉴를 보여주는 격.

### 2. 전환 퍼널

```
대시보드-퍼스트:
  가입 → AI 체험 (0 friction) → "이거 쓸만하네" → 청첩장 생성 → 크레딧 소진 → 결제

문서 제안 (순차):
  가입 → 폼 작성 (지루함) → AI 발견 → "아 이런것도 되네" → ... 이미 이탈했을 수 있음
```

### 3. 크레딧 수익화 정합성

크레딧 팔려면: 체험 → 만족 → 추가 구매. 폼 작성이라는 마찰을 체험 앞에 놓으면 크레딧 전환율이 떨어짐.

### 4. 모바일 접근성

에디터에서 GalleryTab은 8개 탭 중 5번째 — 모바일 가로 스크롤로 안 보임. 대시보드 메뉴는 항상 보임.

### 5. "청첩장에 적용" 흐름은 단순한 기술 문제

- 청첩장 0개 → "새 청첩장 만들기" 유도
- 청첩장 1개 (99%) → 자동 적용
- 청첩장 2개+ → 선택 모달

이건 UX 아키텍처를 좌우할 정도의 제약이 아님.

---

## 구현 플랜

### Step 1: AI Studio 페이지 리라이트

**파일**: `app/dashboard/ai-photos/page.tsx`

현재 페이지를 에디터 `AIPhotoGenerator`의 패턴으로 업그레이드:

1. **동기 POST → SSE 스트리밍**: `/api/ai/generate/stream` 사용
   - 에디터의 `AIPhotoGenerator`에 이미 구현된 스트리밍 로직 재사용
   - 4개 슬롯이 실시간으로 채워지는 UI

2. **싱글 → 멀티 선택**: 역할당 여러 장 선택 가능
   - `onToggleImage` 패턴 (`AIResultGallery` 방식)

3. **모델 선택**: 고급 설정 아코디언으로 모든 유저에게 노출
   - `/api/ai/models`에서 활성 모델 fetch

4. **컴포넌트 공유 위치 이동**:
   - `AIStreamingGallery` → `components/ai/AIStreamingGallery.tsx`
   - `AIResultGallery` → `components/ai/AIResultGallery.tsx`
   - `ImageModal` → `components/ai/ImageModal.tsx`

### Step 2: "청첩장에 적용하기" 구현

**파일**: `app/dashboard/ai-photos/page.tsx` (handleApplyToInvitation)

```
유저가 사진 선택 후 "청첩장에 적용하기" 클릭:
├─ 청첩장 0개 → "새 청첩장을 먼저 만들어주세요" + 생성 버튼
├─ 청첩장 1개 (99%) → 자동으로 해당 청첩장 갤러리에 추가 → 에디터 이동
└─ 청첩장 2개+ → 선택 드롭다운/모달 → 선택 후 적용
```

- GET `/api/invitations` → 유저 청첩장 목록
- PUT `/api/invitations/[id]` → gallery.images 배열에 선택 사진 URL 추가
- `router.push(/editor/[id]?tab=gallery)` → 에디터로 이동

### Step 3: 에디터 GalleryTab에서 AI 제거

**파일**: `components/editor/tabs/GalleryTab.tsx`

`<AIPhotoSection>` 제거 → CTA 카드로 교체:
```
┌─────────────────────────────────────┐
│  ✨ AI 웨딩 사진                      │
│  증명 사진으로 웨딩 화보를 만들어보세요  │
│  [AI 포토 스튜디오 열기 →]             │
└─────────────────────────────────────┘
```

일반 사진 업로드 기능은 그대로 유지.

**삭제 대상**:
- `components/editor/tabs/gallery/AIPhotoSection.tsx`
- `components/editor/tabs/gallery/AIPhotoGenerator.tsx`
- (스트리밍/결과/모달 컴포넌트는 공유 위치로 이동 후 원본 삭제)

### Step 4: DashboardNav 네이밍

**파일**: `components/layout/DashboardNav.tsx`

- "AI 사진 생성" → "AI 포토 스튜디오"
- 순서 유지 (3번째 — 청첩장 바로 다음)

---

## 파일 변경 요약

| 파일 | 작업 | 설명 |
|------|------|------|
| `app/dashboard/ai-photos/page.tsx` | **리라이트** | SSE 스트리밍 + 멀티셀렉트 + 적용하기 구현 |
| `app/dashboard/ai-photos/components/GenerationProgress.tsx` | **삭제** | AIStreamingGallery로 대체 |
| `app/dashboard/ai-photos/components/ResultGallery.tsx` | **삭제** | AIResultGallery로 대체 |
| `components/ai/AIStreamingGallery.tsx` | **이동** | editor/tabs/gallery/ → 공유 위치 |
| `components/ai/AIResultGallery.tsx` | **이동** | editor/tabs/gallery/ → 공유 위치 |
| `components/ai/ImageModal.tsx` | **이동** | editor/tabs/gallery/ → 공유 위치 |
| `components/editor/tabs/GalleryTab.tsx` | **수정** | AIPhotoSection → CTA 카드 |
| `components/editor/tabs/gallery/AIPhotoSection.tsx` | **삭제** | 더 이상 불필요 |
| `components/editor/tabs/gallery/AIPhotoGenerator.tsx` | **삭제** | 대시보드로 통합 |
| `components/layout/DashboardNav.tsx` | **수정** | 메뉴명 변경 |

**백엔드/DB 변경: 없음**. 기존 API 그대로 사용.

---

## editor-ux-review 문서 수정 필요

기존 문서(editor-ux-review)의 "AI Studio" 섹션 업데이트:
- "에디터 흐름에서의 위치" 다이어그램 → 대시보드 독립으로 변경
- Step A/B 로드맵에서 AI Studio를 에디터 종속이 아닌 대시보드 독립으로 재배치
- GalleryTab은 CTA 링크만 유지

---

## 검증

1. 대시보드 → AI 포토 스튜디오 진입 → 청첩장 없이 사진 생성 (SSE 스트리밍 확인)
2. 사진 멀티 선택 → "청첩장에 적용하기" → 0/1/2+ 케이스 각각 동작
3. 에디터 GalleryTab → CTA 카드 클릭 → AI 스튜디오로 이동
4. 적용된 사진이 에디터 갤러리에 정상 표시 확인
5. 기존 일반 사진 업로드 기능 정상 동작 확인
