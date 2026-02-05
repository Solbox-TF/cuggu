# UI/UX 가이드라인

Cuggu의 디자인 시스템 및 UI/UX 가이드라인입니다.

---

## 디자인 원칙

### 1. 심플함 (Simplicity)
- 불필요한 요소 제거
- 핵심 기능에 집중
- 직관적인 네비게이션

### 2. 감성적 (Emotional)
- 결혼이라는 특별한 순간에 어울리는 톤
- 따뜻하고 로맨틱한 느낌
- 사용자의 감정적 연결 유도

### 3. 접근성 (Accessibility)
- 모바일 우선 (Mobile First)
- 모든 연령대 사용 가능
- 충분한 터치 영역

---

## 컬러 시스템

### Primary Colors

| 이름 | HEX | 용도 |
|------|-----|------|
| Primary | #E8B4B8 | 메인 액센트, CTA |
| Primary Dark | #D4949A | 호버 상태 |
| Primary Light | #F5D5D8 | 배경 강조 |

### Neutral Colors

| 이름 | HEX | 용도 |
|------|-----|------|
| Gray 900 | #1A1A1A | 본문 텍스트 |
| Gray 700 | #4A4A4A | 보조 텍스트 |
| Gray 500 | #8A8A8A | 비활성 텍스트 |
| Gray 300 | #D4D4D4 | 테두리 |
| Gray 100 | #F5F5F5 | 배경 |
| White | #FFFFFF | 카드 배경 |

### Semantic Colors

| 이름 | HEX | 용도 |
|------|-----|------|
| Success | #4CAF50 | 성공 메시지 |
| Warning | #FF9800 | 경고 메시지 |
| Error | #F44336 | 에러 메시지 |
| Info | #2196F3 | 정보 메시지 |

---

## 타이포그래피

### 폰트 패밀리

```css
/* 본문 */
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;

/* 장식용 (청첩장 내) */
font-family: 'Noto Serif KR', serif;
```

### 폰트 사이즈

| 레벨 | 크기 | 용도 |
|------|------|------|
| H1 | 32px / 2rem | 페이지 제목 |
| H2 | 24px / 1.5rem | 섹션 제목 |
| H3 | 20px / 1.25rem | 서브 제목 |
| Body | 16px / 1rem | 본문 |
| Small | 14px / 0.875rem | 보조 텍스트 |
| XSmall | 12px / 0.75rem | 캡션 |

---

## 간격 시스템

Tailwind CSS 기본 스페이싱 사용

| 단위 | 값 | 용도 |
|------|-----|------|
| 1 | 4px | 미세 간격 |
| 2 | 8px | 요소 내부 간격 |
| 4 | 16px | 요소 간 간격 |
| 6 | 24px | 섹션 내부 간격 |
| 8 | 32px | 섹션 간 간격 |

---

## 컴포넌트

### 버튼

```tsx
// Primary Button
<button className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition">
  저장하기
</button>

// Secondary Button
<button className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary-light transition">
  취소
</button>

// Ghost Button
<button className="text-gray-700 px-6 py-3 hover:bg-gray-100 rounded-lg transition">
  더보기
</button>
```

**버튼 상태**
- Default: 기본 상태
- Hover: 호버 시 색상 변경
- Active: 클릭 시 눌림 효과
- Disabled: 비활성화 (opacity: 0.5)
- Loading: 로딩 스피너 표시

### 입력 필드

```tsx
<input
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary-light outline-none transition"
  placeholder="이름을 입력하세요"
/>
```

### 카드

```tsx
<div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
  {/* 카드 내용 */}
</div>
```

---

## 반응형 브레이크포인트

| 이름 | 너비 | 용도 |
|------|------|------|
| sm | 640px | 큰 모바일 |
| md | 768px | 태블릿 |
| lg | 1024px | 작은 데스크탑 |
| xl | 1280px | 데스크탑 |

```tsx
// 모바일 우선 접근
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 애니메이션

### Framer Motion 기본 설정

```tsx
// 페이지 전환
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

// 카드 호버
const cardVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 }
};
```

### 애니메이션 원칙
- 300ms 이하의 빠른 피드백
- 과도한 애니메이션 지양
- 의미 있는 전환만 사용

---

## 아이콘

- **라이브러리**: Lucide React
- **크기**: 16px (small), 20px (default), 24px (large)
- **색상**: 텍스트 색상과 동일하게

```tsx
import { Heart, Calendar, MapPin } from 'lucide-react';

<Heart className="w-5 h-5 text-primary" />
```

---

## 접근성 체크리스트

- [ ] 색상 대비 4.5:1 이상
- [ ] 터치 영역 최소 44x44px
- [ ] 키보드 네비게이션 지원
- [ ] alt 텍스트 제공
- [ ] 폼 레이블 연결
- [ ] 에러 메시지 명확
