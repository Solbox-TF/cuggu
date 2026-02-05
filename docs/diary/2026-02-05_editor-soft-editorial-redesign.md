# 2026-02-05 Editor "Soft Editorial" 리디자인

## 작업한 내용

에디터 전체 UI에서 "AI가 만든 것 같은" 효과를 제거하고, 깔끔한 에디토리얼 스타일로 리디자인했다.

**14개 파일 수정:**
- 구조 컴포넌트 4개: TopBar, Sidebar, EditorPanel, PreviewPanel
- 탭 컴포넌트 7개: BasicInfoTab, GreetingTab, GalleryTab, AccountTab, VenueTab, SettingsTab, TemplateTab
- UI 컴포넌트 2개: DatePicker, TimePicker
- 페이지 1개: editor/[id]/page.tsx

**제거한 것:**
- `bg-gradient-to-br from-white to-pink-50/20` (모든 인풋/배경)
- `backdrop-blur-sm` (모든 섹션 컨테이너)
- `shadow-lg shadow-pink-100/50` (모든 카드)
- CTA 카드 글로우 보더 (`absolute -inset-0.5 ... blur`)
- 그라데이션 + 섀도 + 블러 + 트랜지션 효과 중첩

**적용한 것:**
- 배경: `stone-50`, `bg-white`
- 카드: `bg-white border border-stone-200 rounded-xl` (보더 기반)
- 인풋: `bg-white border-stone-200 rounded-lg focus:ring-1 ring-pink-300`
- 텍스트: `slate-*` → `stone-*` (따뜻한 뉴트럴)
- 라벨: `text-xs font-semibold` → `text-sm font-medium text-stone-600`
- 악센트: pink-500 (버튼), pink-400 (사이드바 바), pink-300 (포커스 링)

## 왜 했는지

기존 에디터 UI가 6가지 "AI 디자인" 징후를 전부 가지고 있었다:
1. 그라데이션 남용 — 인풋, 사이드바, 탑바, 프리뷰 전부
2. backdrop-blur 남용 — 섹션마다
3. 핑크 그림자 — 모든 카드에 `shadow-pink-100/50`
4. 글로우 보더 — CTA에 blur overlay
5. 단조로운 핫핑크 — 계층 구분 없이 동일 사용
6. 효과 중첩 — 한 요소에 gradient+shadow+blur+transition 전부

레퍼런스 방향: Hince/탬버린즈 같은 "Soft Editorial" — 럭셔리 웨딩 스테이셔너리 + 에디토리얼 매거진

## 논의/아이디어/고민

### 색상 롤백 논의
첫 버전에서 rose 팔레트(더스티 로즈)로 갔더니 웨딩 감성이 너무 빠졌다는 피드백. "분홍 없어진 거 별로"라는 반응.

**결론:** 효과(그라데이션/블러/글로우)는 제거 유지, 악센트 색상만 rose → pink로 복원.
- `rose-400` 버튼 → `pink-500` (더 또렷한 핑크)
- `rose-400` 사이드바 → `pink-400` (부드러운 악센트)
- `rose-300` 포커스 → `pink-300`
- `rose-500` 선택 상태 → `pink-500`

### 핵심 교훈
> 문제는 "핑크"가 아니라 "효과 남용"이었다. 색상 자체는 브랜드 아이덴티티.

## 결정된 내용

| 결정 | 이유 |
|------|------|
| stone 팔레트 (slate 대신) | 웨딩 플랫폼에 맞는 따뜻한 뉴트럴 |
| 보더 기반 카드 (섀도 대신) | 깔끔함, 효과 중첩 방지 |
| pink-500 버튼 | 웨딩 감성 유지하면서 기존보다 한 톤 밝게 |
| rounded-lg 인풋 / rounded-xl 카드 | 라운드 계층 통일 |
| ring-1 (ring-2 대신) | 얇은 포커스 링 = 덜 거슬림 |
| 템플릿 미니 프리뷰 색상 유지 | 각 템플릿 고유 팔레트는 디자인 시스템과 독립 |

## 느낀 점/난이도/발견

- **난이도:** 낮음. CSS 클래스 치환 작업이라 로직 변경 없음. 다만 14개 파일에서 일관성 유지하는 게 핵심.
- **발견:** `replace_all`로 공통 토큰(인풋, 라벨, 섹션 컨테이너)을 일괄 교체하면 빠르지만, TemplateTab처럼 같은 파일에 "건드려야 할 rose"와 "유지해야 할 rose(미니 프리뷰)"가 섞여 있으면 선별 교체 필요.
- **TypeScript 에러:** 새 에러 0개 (기존 테스트 파일 에러 4개만 존재).

## 남은 것/미정

- [ ] 실제 브라우저에서 시각 검증 (에디터 페이지 전체)
- [ ] 모바일 반응형 확인 (클래스 변경만이라 깨질 가능성 낮음)
- [ ] 다크 모드 대응은 아직 없음 (현재 스코프 밖)
- [ ] 랜딩 페이지/대시보드 등 에디터 외 페이지는 미적용

## 다음 액션

1. 브라우저에서 에디터 열어서 전체 탭 순회 확인
2. DatePicker/TimePicker 드롭다운 열어서 선택 상태 확인
3. 토글 스위치 on/off 시각 확인
4. 만족하면 커밋

## 서랍메모

- 디자인 토큰을 Tailwind config나 CSS 변수로 중앙화하면 이런 일괄 교체가 훨씬 쉬워짐. 지금은 14개 파일에 하드코딩된 클래스를 일일이 바꿔야 했음.
- "AI 냄새 제거" 체크리스트: gradient 0개, blur 0개, glow border 0개, 색상 shadow 0개. 이 4개만 없으면 대부분 해결됨.

---

*mode: log*
