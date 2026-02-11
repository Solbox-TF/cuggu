# 프리뷰 Zoom 정리 + 워터마크 게이트

> **Date**: 2026-02-11
> **Branch**: `feat/watermark-gate`
> **Commits**: `0af5b45`, `18143fa`, `616fb49`
> **Status**: Completed — 머지 대기

---

## Summary

에디터 PreviewPanel과 미리보기 페이지(PreviewClient)의 zoom 동작을 정리하고, 폰 프레임의 z-index 렌더링 버그를 수정. 워터마크 게이트(무료 플랜 FloatingBadge) 관련 코드도 함께 커밋.

## Scope

| 영역 | 파일 | 변경 유형 |
|------|------|-----------|
| 에디터 프리뷰 | `components/editor/PreviewPanel.tsx` | zoom 고정, 줌 UI 제거 |
| 미리보기 페이지 | `app/preview/[id]/PreviewClient.tsx` | 수동 zoom, input 추가 |
| 뷰포트 공용 | `components/preview/PreviewViewport.tsx` | z-index 레이어링 |
| 폰 프레임 | `components/ui/PhoneFrame.tsx` | 카메라 z-20 |
| 푸터 | `components/templates/FooterSection.tsx` | CTA 조건 단순화 |
| 워터마크 | `FloatingBadge`, `invitation-view store`, `PremiumToggle` | 신규 |
| API | `app/api/invitations/[id]/route.ts` | 발행 검증 강화 |
| 페이지 | `inv/[id]/page.tsx`, `preview/[id]/page.tsx` | isPremium 전달 |

## Decisions

| 결정 | 근거 |
|------|------|
| PreviewPanel: 85%/100% 고정, 줌 컨트롤 제거 | auto-fit이 어중간한 값(102%) 생성, 에디터는 빠른 확인 용도 |
| PreviewClient: 92% 기본, 수동 조절 유지 | 13인치 화면 기준 적절한 크기, 정밀 확인 필요 |
| auto-fit 완전 제거 | resize 시 사용자 입력값 덮어쓰는 문제 |
| z-index 레이어링 (베젤 < z-10 콘텐츠 < z-20 카메라) | DOM 순서 변경은 베젤이 콘텐츠를 덮는 부작용 발생 |
| ViralCTA 조건: `!isPremium`만 사용 | `!isPreview` 포함 시 미리보기 페이지에서도 숨겨짐 |

## Bug Fixes

- **phone 컨테이너 높이 이중 계산**: `h-[calc(100vh-3.5rem)]` + `pt-14` → 112px 손실 → `h-screen pt-14`로 수정
- **폰 프레임 카메라 가림**: `transform`이 생성한 스택 컨텍스트 내에서 `relative` 콘텐츠가 카메라 위로 렌더링 → z-index 분리
- **localStorage 캐시**: 기본값 변경(100→92) 시 기존 저장값이 우선 → 키 이름 변경으로 리셋

## Technical Notes

- `transform: scale()` → 새로운 stacking context 생성, 자식 요소 z-index 동작에 영향
- `overflow-hidden` + `relative`가 결합되면 예상치 못한 스택 컨텍스트 생성 가능
- PhoneFrame은 `absolute inset-0 -m-3`로 콘텐츠 영역 밖으로 12px 확장 — 부모 padding 충분해야 클리핑 안 됨

## Open Items

- [ ] Galaxy 폰 프레임 카메라 위치 다양화 (좌/우/중앙) — 현재 중앙 고정
- [ ] iPhone 노치 vs 다이나믹 아일랜드 모델 분기
- [ ] `.claude/` 디렉토리 `.gitignore` 추가

## Review Feedback

- 에디터 프리뷰(PreviewPanel) vs 미리보기 페이지(PreviewClient) 용어 혼동 주의
- z-index 문제는 DOM 순서 변경보다 레이어 분리가 안전한 접근
- CSS 높이 계산에서 padding + fixed height 조합은 이중 계산 실수 빈발 패턴
