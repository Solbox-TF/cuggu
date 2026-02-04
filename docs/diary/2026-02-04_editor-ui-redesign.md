# 청첩장 편집기 UI 디자인 개선

**날짜**: 2026-02-04
**브랜치**: feature/invitation-editor
**커밋**: 5f88f87

## 작업 내용

기존 청첩장 편집기의 디자인이 별로여서 Figma 스타일의 모던한 UI로 전면 개선.

### 변경된 컴포넌트
- **Sidebar**: 넓은 메뉴 → 축소형 아이콘 사이드바 (64px)
- **TopBar**: 이모지 로고 → 텍스트 로고, 일관된 버튼
- **PreviewPanel**: 간단한 박스 → 실제 iPhone/Galaxy 프레임
- **EditorPanel**: 회색 배경 → 깔끔한 화이트
- **모든 탭**: border 중심 → 그라데이션 + shadow

### 기술적 구현
```typescript
// 주요 스타일 패턴
- 배경: bg-gradient-to-br from-white to-pink-50/20
- Input: border-pink-200/50 + backdrop-blur
- 카드: bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg
- 액센트: pink-500 → rose-500 그라데이션
```

## 왜 했는지

1. **사용자 피드백**: "디자인이 너무 별로다"
2. **경쟁사 분석**: 웨딩 플랫폼들이 모두 고급스러운 UI
3. **브랜드 아이덴티티**: 프리미엄 느낌 필요 (유료 전환율 목표 20%)

## 논의/고민

### 테마 선택
- 처음엔 violet 컬러로 시작 → 분홍으로 변경 (웨딩에 더 어울림)
- 다크 사이드바 vs 라이트 사이드바 → 연한 분홍 배경 선택 (부드러운 느낌)

### Border vs Shadow
- 선이 그어진 느낌 불만 → border 전부 제거
- shadow + 그라데이션으로 depth 표현
- 더 현대적이고 부드러운 느낌

### 폰 프레임
- 처음엔 간단한 노치만 → 사용자가 "별로"라고 함
- iPhone 14/15 Pro 스타일로 디테일 추가:
  - Dynamic Island
  - 측면 버튼들 (음소거/볼륨/전원)
  - 하단 스피커 그릴 + 충전 포트
- Galaxy도 추가 요청 → 펀치홀 카메라 스타일로 구현

### Input 디자인
- 기존: 평범한 border input
- 개선: 그라데이션 배경 + 부드러운 border + focus 효과
- padding 증가 (py-2→py-3) + rounded-xl

## 결정된 내용

### 디자인 시스템
```typescript
// 컬러 팔레트
- Primary: pink-500 ~ rose-500
- Background: white ~ pink-50/20
- Border: pink-200/50 (투명도)
- Shadow: shadow-lg shadow-pink-100/50

// 타이포그래피
- 제목: text-xl font-bold
- 라벨: text-xs font-semibold text-slate-700
- 본문: text-sm

// 간격
- 카드 내부: p-6 space-y-4
- 그리드: gap-4
- 섹션: space-y-6
```

### 폰 프레임 스펙
- **고정 크기**: 375x812px (iPhone 14 Pro 실제 크기)
- **내부 스크롤**: overflow-y-auto
- **모델 선택**: iPhone / Galaxy 토글

## 어려웠던 점

### 1. 파일 수정 반복 실패
- replace_all 사용 시 이전 수정이 남아있어서 문자열 못 찾음
- 해결: 파일 읽고 → 정확한 문자열 확인 → 수정

### 2. 스타일 일관성 유지
- 17개 파일, 수십 개 input/button
- 해결: 패턴 정의 후 일괄 변경

### 3. 그라데이션 성능
- backdrop-blur가 많으면 느려질 수 있음
- 현재는 괜찮지만 모니터링 필요

## 발견/배운 점

### Tailwind 그라데이션 조합
```css
/* 부드러운 배경 효과 */
bg-gradient-to-br from-white to-pink-50/20

/* 유리 효과 */
bg-white/80 backdrop-blur-sm

/* 컬러 shadow */
shadow-lg shadow-pink-100/50
```

### 디테일의 힘
- Dynamic Island 위치 10px만 조정해도 느낌 완전히 다름
- 버튼 padding 1px 차이로 고급스러움 결정
- 그라데이션 각도 (to-br vs to-r) 중요

## 성능 고려

### 최적화된 부분
- `backdrop-blur-sm` (md 아닌 sm 사용)
- 그라데이션 opacity 낮게 (/20, /30)
- transition-all duration-200 (짧게)

### 아직 안 한 것
- 폰 프레임 컴포넌트 분리 (현재 인라인)
- 반응형 (모바일에서 편집기 접근 시)

## 남은 것

### 기능
- [ ] 실제 템플릿 추가 (현재 Classic 1개만)
- [ ] 갤러리 이미지 업로드 구현
- [ ] AI 사진 생성 연동
- [ ] 저장 로직 (현재 Zustand만)

### 디자인
- [ ] 다크모드 지원 (선택사항)
- [ ] 애니메이션 효과 추가
- [ ] 로딩 상태 UI
- [ ] 에러 상태 표시

### 성능
- [ ] 폰 프레임 컴포넌트 분리
- [ ] 이미지 lazy loading
- [ ] Preview debounce

## 다음 액션

1. **템플릿 구현** (우선순위 높음)
   - Modern, Vintage, Floral, Minimal 템플릿 디자인
   - 각 템플릿별 컴포넌트 작성

2. **저장 기능**
   - API 연동 (PUT /api/invitations/[id])
   - Auto-save (debounce 2초)
   - 저장 실패 시 로컬스토리지 백업

3. **이미지 업로드**
   - Cloudflare R2 연동
   - 이미지 리사이징
   - 드래그 앤 드롭 정렬

## 서랍메모

### 나중에 고려할 것
- 테마 시스템 (관리자 메뉴에서 pink/violet/blue 선택)
- 커스텀 폰트 업로드
- 실시간 협업 편집 (여러 명이 동시 편집)

### 참고 링크
- [Tailwind Gradient Generator](https://tailwindcss.com/docs/gradient-color-stops)
- [iPhone 15 Pro Dimensions](https://www.apple.com/iphone-15-pro/specs/)

## 내 질문 평가

### 좋았던 질문
- "디자인이 너무 별로야" → 명확한 피드백, 개선 방향 제시
- "선이 그어져 있는 디자인이다" → 구체적인 문제점 지적
- "input도 멋지게 바꿔봐" → 전체적인 개선 요청

### 아쉬웠던 점
- 초반에 violet/pink 선택을 명확히 안 함 → 중간에 변경
- 폰 프레임 요구사항을 처음부터 구체적으로 안 함

### 개선할 점
- 다음엔 디자인 방향성을 먼저 정하고 시작
- 레퍼런스 이미지 있으면 더 빠름

## 난이도
⭐⭐⭐☆☆ (중간)

- UI 작업이라 복잡도는 낮음
- 하지만 17개 파일 수정하면서 일관성 유지 필요
- 디테일 조정에 시간 많이 씀

## 예상 시간 vs 실제 시간
- 예상: 1시간
- 실제: 2시간
- 차이 이유: 디테일 조정 + 파일 수정 반복

---

**다음 작업**: 템플릿 구현 시작
