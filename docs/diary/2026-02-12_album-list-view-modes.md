# 앨범 리스트 뷰 모드 + 생성 제한

> **Date**: 2026-02-12
> **Branch**: `feat/ai-album-v2`
> **Commit**: `a96feec`
> **Status**: Completed

---

## Summary

앨범 리스트 페이지에 카드/리스트/갤러리 3가지 뷰 모드를 추가하고, 앨범 최대 3개 생성 제한을 구현.

## Scope

| 영역 | 파일 | 변경 유형 |
|------|------|-----------|
| 앨범 리스트 | `app/dashboard/ai-photos/page.tsx` | 뷰 모드 3종 + 생성 제한 |

**변경량**: +194줄 -37줄 (1파일)

## 작업 내용

### 1. 뷰 모드 토글 UI

- `LayoutGrid` / `List` / `GalleryHorizontalEnd` 아이콘 버튼 그룹
- 헤더 우측에 크레딧 배지와 나란히 배치
- 선택 상태: `bg-stone-200 text-stone-900`, 비선택: `text-stone-400`

### 2. 뷰 모드별 레이아웃

| 모드 | 그리드 | 썸네일 | 표시 정보 |
|------|--------|--------|-----------|
| **카드** | 1/2/3열 | 128px 단일 이미지 | 이름, 사진 수 |
| **리스트** | 단일 열 | 64x48px 좌측 | 이름, snapType 뱃지, 사진 수, 상태, 생성일 |
| **갤러리** | 1/2열 | 192px, 최대 4장 그리드 | 이름, 사진 수 |

### 3. localStorage 영속화

- 키: `album-view-mode`
- `useState` 초기값에서 `localStorage.getItem()` 읽기
- `handleViewModeChange()`에서 상태 + localStorage 동시 업데이트

### 4. Album 인터페이스 확장

```typescript
interface Album {
  id: string;
  name: string;
  snapType: string | null;  // 추가
  status: string;           // 추가
  images: AlbumImage[];
  groups: AlbumGroup[];
  createdAt: string;        // 추가
}
```

### 5. 앨범 생성 제한

- `MAX_ALBUMS = 3` 상수
- `canCreateAlbum = albums.length < MAX_ALBUMS`
- 3개 미만: "새 앨범 만들기" 버튼 표시 (각 뷰 모드별)
- 3개 도달: 버튼 숨김 + 하단 안내 문구 `앨범은 최대 3개까지 만들 수 있습니다`

## Decisions

| 결정 | 근거 |
|------|------|
| 뷰 모드 상태를 localStorage에 저장 | 새로고침 후에도 사용자 선호 유지. 서버 저장은 과잉 |
| `ViewMode` 타입을 union literal로 정의 | 3가지 고정값, enum보다 가벼움 |
| MAX_ALBUMS를 파일 상수로 선언 | 환경변수나 DB 설정은 현 단계에서 불필요 |
| 갤러리 뷰에서 최대 4장 미리보기 | 2x2 그리드가 시각적으로 균형 잡힘 |

## Technical Notes

- `useState` 초기값 함수에서 `typeof window !== 'undefined'` 체크 — SSR 환경 대응
- 갤러리 뷰 그리드: 이미지 수에 따라 `grid-cols-1` / `grid-cols-2` / `grid-cols-2 grid-rows-2` 동적 전환
- 리스트 뷰: `truncate` + `min-w-0` + `flex-1`으로 긴 앨범 이름 오버플로 방지

## Open Items

- [ ] 뷰 모드 선택을 사용자 설정(DB)으로 올릴지 여부 — 현재는 localStorage로 충분
- [ ] MAX_ALBUMS 값을 플랜별로 분기할지 (무료 3개, 프리미엄 10개 등)
- [ ] 갤러리 뷰 이미지 lazy loading 적용
