# Cuggu 템플릿 디자인 스펙

## 공통 디자인 시스템

### 모바일 우선 설계
- 기준 화면: 375x812 (iPhone 13 Mini)
- 최소 지원: 360px
- 터치 영역: 최소 44x44px

### 색상 시스템
```
Primary (브랜드)
- Main: #FF6B9D (핑크)
- Light: #FFB3D4
- Dark: #E6006A

Neutral (배경/텍스트)
- White: #FFFFFF
- Gray-50: #F9FAFB
- Gray-100: #F3F4F6
- Gray-600: #4B5563
- Gray-900: #111827

Semantic
- Success: #10B981
- Error: #EF4444
- Warning: #F59E0B
```

### 타이포그래피 (공통)
```
폰트 패밀리
- 헤드라인: "Pretendard Variable", sans-serif
- 본문: "Pretendard Variable", sans-serif
- 특수(선택): "Noto Serif KR" (클래식/빈티지)

크기 (모바일)
- H1 (신랑신부명): 32px / 1.3 / -0.02em / 700
- H2 (섹션 제목): 24px / 1.4 / -0.01em / 600
- Body (본문): 16px / 1.6 / 0 / 400
- Caption (날짜/장소): 14px / 1.5 / 0 / 400
```

### 간격 시스템
```
- 4px   (XS) - 아이콘 여백
- 8px   (S)  - 텍스트 간격
- 16px  (M)  - 컴포넌트 내부
- 24px  (L)  - 섹션 간격
- 32px  (XL) - 큰 섹션 구분
- 48px  (XXL) - 헤더/푸터 분리
```

### 컴포넌트 구조 (공통)
```
모든 템플릿은 3단 구조:

1. Header (헤더)
   - 배경 이미지/색상
   - 신랑신부 이름
   - 결혼식 날짜 요약

2. Body (본문)
   - AI 사진 영역 (핵심)
   - 인사말
   - 날짜/시간/장소
   - 갤러리 (선택)
   - 오시는 길

3. Footer (푸터)
   - RSVP 버튼
   - 공유 버튼
   - 무료플랜: "Made with Cuggu" 로고
```

---

## 1. 클래식 템플릿 (Classic)

### 컨셉
전통적인 한국식 청첩장. 세리프 폰트, 우아한 장식, 단정한 레이아웃.

### 색상 팔레트
```
Primary
- Burgundy: #8B1C1C (진한 와인색)
- Gold: #D4AF37 (금색 강조)
- Cream: #FFF8E7 (배경)

Accent
- Beige: #E8DCC4
```

### 타이포그래피
```
- 신랑신부명: "Noto Serif KR" 36px / 700
- 날짜: "Noto Serif KR" 18px / 500
- 본문: "Pretendard Variable" 16px / 400
```

### 레이아웃 구조
```
Header (높이: 400px)
├─ 배경: Cream 그라데이션
├─ 상단 장식: 금색 라인 (1px)
├─ 신랑신부 이름 (세로 배치)
│  예: "김철수 ♥ 이영희"
└─ 날짜: "2026년 5월 10일 토요일 오후 2시"

AI 사진 영역 (16:9 비율)
├─ 크기: 343x193px (여백 16px)
├─ 테두리: 금색 2px
├─ 배경: White
└─ 위치: 헤더 직후

인사말 섹션
├─ 배경: White
├─ 여백: 32px
├─ 제목: "초대합니다" (Noto Serif 24px)
└─ 본문: 3-5줄 (Pretendard 16px)

날짜/장소 섹션
├─ 아이콘: 캘린더/장소 (Gold)
├─ 정보: 날짜/시간/주소/홀
└─ 지도 API 임베드

오시는 길
├─ 지하철/버스 정보
└─ 주차 안내

Footer (높이: 120px)
├─ RSVP 버튼: Burgundy 배경
├─ 공유: 카카오톡/링크 복사
└─ 로고: "Made with Cuggu" (Gray-400)
```

### 주요 특징
- 세리프 폰트로 격식 강조
- 금색 액센트로 고급스러움
- 세로 중심 레이아웃 (한국 전통)

---

## 2. 모던 템플릿 (Modern)

### 컨셉
미니멀하고 세련된 디자인. 대담한 타이포그래피, 여백 강조, 깔끔한 레이아웃.

### 색상 팔레트
```
Primary
- Black: #1A1A1A
- White: #FFFFFF
- Accent Pink: #FF6B9D (브랜드 컬러)

Neutral
- Gray-100: #F5F5F5 (배경)
```

### 타이포그래피
```
- 신랑신부명: "Pretendard Variable" 40px / 800 / -0.03em
- 날짜: "Pretendard Variable" 18px / 500
- 본문: "Pretendard Variable" 16px / 400
```

### 레이아웃 구조
```
Header (높이: 500px)
├─ 배경: White
├─ 신랑신부 이름 (가로 배치, 초대형)
│  예: "CHULSOO & YOUNGHEE"
├─ 구분선: Accent Pink 4px
└─ 날짜: "2026.05.10 SAT 2PM" (숫자 강조)

AI 사진 영역 (1:1 비율)
├─ 크기: 343x343px (정사각형)
├─ 테두리: 없음 (미니멀)
├─ 그림자: 0 4px 24px rgba(0,0,0,0.08)
└─ 위치: 헤더 직후, 중앙 정렬

인사말 섹션
├─ 배경: Gray-100
├─ 여백: 48px (넓은 여백)
├─ 제목: 생략 (미니멀)
└─ 본문: 2-3줄, 간결하게

날짜/장소 섹션
├─ 그리드 레이아웃 (2열)
│  ├─ 날짜 | 시간
│  └─ 장소 | 홀
├─ 아이콘: 없음 (텍스트만)
└─ 구분선: Gray-300 1px

Footer (높이: 100px)
├─ RSVP 버튼: Black 배경, White 텍스트
├─ 공유: 아이콘만 (텍스트 없음)
└─ 로고: 최소화
```

### 주요 특징
- 여백을 디자인 요소로 활용
- 타이포그래피가 주인공
- 불필요한 장식 제거

---

## 3. 빈티지 템플릿 (Vintage)

### 컨셉
복고풍 감성. 따뜻한 색감, 종이 텍스처, 손글씨 느낌.

### 색상 팔레트
```
Primary
- Sepia: #8B7355 (세피아 브라운)
- Cream: #FFF8DC (크림 배경)
- Terracotta: #D4A574 (테라코타)

Accent
- Olive: #9CAA8B (올리브 그린)
```

### 타이포그래피
```
- 신랑신부명: "Noto Serif KR" 34px / 600 (손글씨 느낌)
- 날짜: "Noto Serif KR" 16px / 500
- 본문: "Pretendard Variable" 15px / 400
```

### 레이아웃 구조
```
Header (높이: 450px)
├─ 배경: Cream + 종이 텍스처 오버레이
├─ 상단 장식: 빈티지 프레임 SVG
├─ 신랑신부 이름 (기울임체)
│  예: "철수 & 영희"
└─ 날짜: "May 10, 2026" (영문 스타일)

AI 사진 영역 (4:3 비율)
├─ 크기: 343x257px
├─ 테두리: Sepia 6px (두꺼운 프레임)
├─ 필터: Sepia 20% (흑백 느낌)
└─ 위치: 헤더 직후, 약간 회전 (-2deg)

인사말 섹션
├─ 배경: Cream
├─ 장식: 코너 장식 (빈티지 패턴)
├─ 제목: "우리 결혼합니다" (손글씨 폰트)
└─ 본문: 4-6줄 (따뜻한 톤)

날짜/장소 섹션
├─ 배경: Terracotta 카드 (패딩 24px)
├─ 아이콘: 빈티지 스타일 (라인 아트)
└─ 텍스트: Cream 색상

Footer (높이: 140px)
├─ 배경: Sepia
├─ RSVP 버튼: Terracotta 배경
├─ 공유: 빈티지 아이콘
└─ 하단 장식: 빈티지 프레임 반복
```

### 주요 특징
- 종이 텍스처로 아날로그 감성
- 손글씨 느낌의 타이포그래피
- 약간의 회전/기울임으로 자연스러움

---

## 4. 플로럴 템플릿 (Floral)

### 컨셉
꽃무늬 일러스트 중심. 부드러운 파스텔, 로맨틱한 분위기.

### 색상 팔레트
```
Primary
- Blush Pink: #FADDE1 (연핑크)
- Sage Green: #B4CDA5 (세이지 그린)
- Lavender: #E6E6FA (라벤더)

Accent
- Peach: #FFE5D9 (복숭아색)
- White: #FFFFFF
```

### 타이포그래피
```
- 신랑신부명: "Pretendard Variable" 32px / 600
- 날짜: "Pretendard Variable" 16px / 500
- 본문: "Pretendard Variable" 15px / 400
```

### 레이아웃 구조
```
Header (높이: 480px)
├─ 배경: Blush Pink 그라데이션 (상→하)
├─ 꽃 일러스트: 코너 장식 (SVG)
│  └─ 위치: 좌상단, 우하단 대칭
├─ 신랑신부 이름 (중앙)
└─ 날짜: 꽃 아이콘 양옆

AI 사진 영역 (3:4 비율, 세로)
├─ 크기: 257x343px (세로 사진)
├─ 테두리: 라운드 24px
├─ 꽃 장식: 사진 주변 산재
└─ 위치: 헤더 직후

인사말 섹션
├─ 배경: White
├─ 꽃 워터마크: Lavender 10% 투명도
├─ 제목: "초대의 말씀" + 꽃 아이콘
└─ 본문: 3-4줄

날짜/장소 섹션
├─ 배경: Peach 카드
├─ 라운드: 16px
├─ 아이콘: 꽃 스타일
└─ 섹션 구분: 꽃 라인 (1px)

갤러리 (옵션)
├─ 레이아웃: 2열 그리드
├─ 라운드: 12px
└─ 꽃 프레임 오버레이

Footer (높이: 160px)
├─ 배경: Sage Green
├─ 꽃 패턴: 반복 배경
├─ RSVP 버튼: White 배경
└─ 공유: 꽃 아이콘
```

### 주요 특징
- 꽃 일러스트가 모든 섹션에 등장
- 부드러운 라운드 처리
- 파스텔 색상으로 로맨틱

---

## 5. 미니멀 템플릿 (Minimal)

### 컨셉
극도로 심플한 흑백 디자인. 여백 강조, 타이포그래피만으로 구성.

### 색상 팔레트
```
Primary
- Black: #000000
- White: #FFFFFF
- Gray: #F0F0F0 (배경)

Accent
- 없음 (완전 무채색)
```

### 타이포그래피
```
- 신랑신부명: "Pretendard Variable" 44px / 700 / -0.04em
- 날짜: "Pretendard Variable" 20px / 300 (Light)
- 본문: "Pretendard Variable" 16px / 400
```

### 레이아웃 구조
```
Header (높이: 520px)
├─ 배경: White
├─ 신랑신부 이름 (초대형, 볼드)
│  예: "CHULSOO\n♥\nYOUNGHEE" (3줄)
├─ 날짜: 최소 정보만 "05.10.2026"
└─ 여백: 상하 80px

AI 사진 영역 (16:10 비율)
├─ 크기: 343x214px
├─ 테두리: Black 1px (얇은 프레임)
├─ 필터: Grayscale 100% (완전 흑백)
└─ 위치: 중앙, 상하 80px 여백

인사말 섹션
├─ 배경: White
├─ 여백: 64px (극도로 넓음)
├─ 제목: 없음
└─ 본문: 1-2줄만 (핵심만)

날짜/장소 섹션
├─ 배경: Gray (구분용)
├─ 레이아웃: 세로 나열 (간격 16px)
│  ├─ 날짜: 2026.05.10 SAT
│  ├─ 시간: 2:00 PM
│  ├─ 장소: 서울 그랜드 웨딩홀
│  └─ 주소: 서울시 강남구...
├─ 아이콘: 없음 (텍스트만)
└─ 폰트: Monospace (날짜/시간)

Footer (높이: 80px)
├─ 배경: Black
├─ RSVP 버튼: White 텍스트
├─ 공유: 최소화
└─ 로고: 없음 (완전 제거)
```

### 주요 특징
- 색상 사용 최소화 (흑백)
- 타이포그래피가 유일한 디자인 요소
- 극단적인 여백 활용

---

## AI 사진 영역 (공통 필수 사항)

### 배치 원칙
```
1. 위치: 헤더 직후 (스크롤 없이 보임)
2. 크기: 최소 300px 이상 (모바일)
3. 비율: 템플릿별 자유 (1:1, 16:9, 3:4 등)
4. 여백: 주변 콘텐츠와 최소 24px 간격
```

### 상태별 디자인
```
Empty (사진 없음)
├─ 배경: Gray-100
├─ 플레이스홀더: "AI 웨딩 사진 추가하기"
├─ 아이콘: 카메라 (Gray-400)
└─ 버튼: "AI 사진 생성" (Primary 색상)

Loading (생성 중)
├─ 스켈레톤 애니메이션
├─ 진행률: "생성 중... 30초 소요"
└─ 취소 버튼

Filled (사진 있음)
├─ 이미지: 템플릿 비율에 맞춤
├─ 호버: 반투명 오버레이 + "변경"
└─ 워터마크: 무료플랜 시 우하단
```

### 반응형
```
모바일 (< 640px)
- 너비: 100% (여백 16px)
- 높이: 비율 유지

태블릿 (640-1024px)
- 너비: 80%
- 최대: 600px

데스크톱 (> 1024px)
- 너비: 60%
- 최대: 800px
```

---

## 컴포넌트 분리 (Figma)

### 헤더 컴포넌트
```
Variants
├─ Classic: Cream 배경, 금색 라인
├─ Modern: White 배경, 대형 타이포
├─ Vintage: Cream + 텍스처, 프레임
├─ Floral: Blush Pink, 꽃 장식
└─ Minimal: White, 초대형 이름

Props
├─ groomName: string
├─ brideName: string
├─ weddingDate: string
└─ backgroundColor: color
```

### AI 사진 영역 컴포넌트
```
Variants
├─ Empty: 플레이스홀더
├─ Loading: 스켈레톤
└─ Filled: 이미지 표시

Props
├─ imageUrl: string
├─ aspectRatio: 1:1 | 16:9 | 3:4 | 16:10
├─ borderStyle: none | thin | thick | rounded
└─ hasWatermark: boolean
```

### 인사말 컴포넌트
```
Variants
├─ Classic: 세리프 폰트
├─ Modern: 짧은 본문
├─ Vintage: 손글씨 느낌
├─ Floral: 꽃 워터마크
└─ Minimal: 1-2줄만

Props
├─ title: string
├─ message: string
└─ alignment: center | left
```

### 날짜/장소 컴포넌트
```
Variants
├─ Classic: 아이콘 + 텍스트
├─ Modern: 그리드 레이아웃
├─ Vintage: 카드 스타일
├─ Floral: 꽃 아이콘
└─ Minimal: 텍스트만

Props
├─ date: string
├─ time: string
├─ venue: string
├─ address: string
└─ mapUrl: string
```

### Footer 컴포넌트
```
Variants
├─ Classic: Burgundy 버튼
├─ Modern: Black 버튼
├─ Vintage: Terracotta 버튼
├─ Floral: Sage Green 배경
└─ Minimal: Black 배경

Props
├─ hasLogo: boolean (무료/프리미엄)
└─ shareButtons: kakao | link
```

---

## 애니메이션 효과 (Framer Motion)

### 스크롤 애니메이션
```
헤더
- Fade In (opacity 0 → 1)
- Duration: 0.8s

AI 사진
- Slide Up (y: 40 → 0)
- Duration: 0.6s
- Delay: 0.2s

인사말
- Fade In
- Duration: 0.6s
- Delay: 0.4s

날짜/장소
- Slide Up
- Duration: 0.6s
- Delay: 0.6s
```

### 인터랙션
```
RSVP 버튼
- Hover: Scale 1.05
- Active: Scale 0.95
- Transition: Spring

공유 버튼
- Hover: Rotate 15deg
- Transition: 0.2s ease

AI 사진 영역
- Hover: Brightness 1.1
- Cursor: pointer
```

---

## Figma 파일 구조

```
Pages
├─ 📄 Cover (프로젝트 소개)
├─ 📄 Design System (색상/폰트/간격)
├─ 📄 Components (재사용 컴포넌트)
│   ├─ Header Variants
│   ├─ AI Photo Area Variants
│   ├─ Message Variants
│   ├─ Info Variants
│   └─ Footer Variants
├─ 📄 Template - Classic
├─ 📄 Template - Modern
├─ 📄 Template - Vintage
├─ 📄 Template - Floral
├─ 📄 Template - Minimal
└─ 📄 Responsive (모바일/태블릿/데스크톱)
```

### 네이밍 규칙
```
컴포넌트: [Type]/[Variant]
예: Header/Classic, AIPhoto/Empty

프레임: [Template] - [Section]
예: Classic - Header, Modern - Body

색상: [Template]/[Name]
예: Classic/Burgundy, Modern/Black

간격: spacing/[size]
예: spacing/m, spacing/xl
```

---

## 디자인 체크리스트

### 템플릿별 필수 요소
- [ ] 헤더 (신랑신부명, 날짜)
- [ ] AI 사진 영역 (빈 상태/로딩/채워짐)
- [ ] 인사말 섹션
- [ ] 날짜/시간/장소 정보
- [ ] 오시는 길 (지도 영역)
- [ ] RSVP 버튼
- [ ] 공유 버튼
- [ ] 무료플랜 로고

### 반응형 확인
- [ ] 모바일 (375px)
- [ ] 태블릿 (768px)
- [ ] 데스크톱 (1024px)

### 접근성
- [ ] 텍스트 대비 4.5:1 이상
- [ ] 터치 영역 44px 이상
- [ ] 폰트 크기 최소 14px

### 개발 전달
- [ ] 컴포넌트 Auto Layout 설정
- [ ] 색상/텍스트 스타일 등록
- [ ] Dev Mode 준비 완료
