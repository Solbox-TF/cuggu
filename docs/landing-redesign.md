# Cuggu 랜딩 페이지 리디자인 계획

## 목표
- **전환율 극대화**: AI 사진 생성 결과를 즉시 보여주고 가입 유도
- **Before/After 갤러리**: 증명사진 → AI 화보 변환 예시
- **감성적/로맨틱 스타일**: 웨딩 분위기, 부드러운 색감

---

## 새 페이지 구조 (8섹션)

```
1. HeroImpact        - 첫 인상: 변환 결과 즉시 노출 + 꽃잎 애니메이션
2. BeforeAfterGallery - 와우 모먼트: 다중 Before/After 슬라이더
3. ProblemSolution   - 비용 비교: 50-200만원 vs 9,900원
4. HowItWorks        - 3단계 프로세스
5. SecurityTrust     - 보안 차별화 (피싱 1,189% 증가 대응)
6. SocialProof       - 후기/통계
7. Pricing           - 가격 (기존 개선)
8. FinalCTA          - 마지막 전환 유도
```

---

## 컴포넌트 계획

### 재사용할 기존 컴포넌트

| 컴포넌트 | 경로 | 용도 |
|---------|------|-----|
| `ScrollFade` | `components/animations/ScrollFade.tsx` | 모든 섹션 fade-in |
| `FallingPetals` | `components/animations/FallingPetals.tsx` | Hero 배경 (수정 필요) |
| `BeforeAfter` | `components/landing-c/BeforeAfter.tsx` | 슬라이더 로직 참고 |
| `Pricing` | `components/marketing/Pricing.tsx` | 개선하여 유지 |

### 새로 만들 컴포넌트

| 컴포넌트 | 경로 | 설명 |
|---------|------|-----|
| `HeroImpact` | `components/landing/HeroImpact.tsx` | 증명사진→화보 변환 시각화 |
| `BeforeAfterGallery` | `components/landing/BeforeAfterGallery.tsx` | 탭 기반 다중 슬라이더 |
| `ProblemSolution` | `components/landing/ProblemSolution.tsx` | 비용/시간 비교 테이블 |
| `HowItWorks` | `components/landing/HowItWorks.tsx` | 3단계 가이드 |
| `SecurityTrust` | `components/landing/SecurityTrust.tsx` | 보안 기능 소개 |
| `SocialProof` | `components/landing/SocialProof.tsx` | 후기/통계 |
| `FinalCTA` | `components/landing/FinalCTA.tsx` | 마지막 CTA |

---

## 디자인 시스템

### 색상 팔레트 (감성적/로맨틱)

```css
/* globals.css에 추가 */
--romantic-blush: 350 100% 96%;     /* #FFF5F7 */
--romantic-rose: 350 80% 65%;       /* #E88A9E */
--romantic-gold: 42 75% 55%;        /* #D4AF37 */
--romantic-cream: 40 50% 96%;       /* #FFF8E7 */
```

### 그라데이션

- Hero: `from-rose-50 via-pink-50 to-white`
- CTA: `from-rose-500 to-pink-500`
- Security: `from-slate-900 to-slate-800` (다크)

---

## 섹션별 상세

### 1. HeroImpact

```
┌─────────────────────────────────────────────────┐
│  [꽃잎 애니메이션 배경]                           │
│                                                 │
│     증명사진 한 장으로                            │
│     웨딩 화보가 완성됩니다                        │
│                                                 │
│  ┌──────────┐  ────▶  ┌──────────┐             │
│  │ 증명사진  │  2-3분   │ AI 웨딩   │             │
│  │  (작게)   │         │ 화보 4장  │             │
│  └──────────┘         └──────────┘             │
│                                                 │
│  [무료로 시작하기]  [AI 사진 샘플 보기]            │
│                                                 │
│  ✓ 신용카드 없이 시작  ✓ AI 사진 2회 무료        │
└─────────────────────────────────────────────────┘
```

- 헤드라인: "증명사진 한 장으로 웨딩 화보가 완성됩니다"
- 배경: FallingPetals (opacity 낮춤, Hero 영역에만 제한)
- Primary CTA: "무료로 시작하기"
- Secondary CTA: "AI 사진 샘플 보기" (→ BeforeAfterGallery 스크롤)

### 2. BeforeAfterGallery

```
┌─────────────────────────────────────────────────┐
│         Before & After                          │
│   AI가 만드는 놀라운 변화를 직접 확인하세요        │
│                                                 │
│   [클래식]  [모던]  [빈티지]  ← 스타일 탭         │
│                                                 │
│   ┌─────────────────────────────────┐           │
│   │    [드래그 슬라이더]              │           │
│   │    Before (증명사진) | After     │           │
│   └─────────────────────────────────┘           │
│                                                 │
│   생성 시간: 2분 32초  |  만족도: 98%             │
│                                                 │
│        [이런 사진 만들기]                         │
└─────────────────────────────────────────────────┘
```

- 스타일 탭: [클래식] [모던] [빈티지]
- 기존 BeforeAfter 슬라이더 로직 재사용
- 탭 전환 시 AnimatePresence로 부드러운 전환

### 3. ProblemSolution

**Part 1 - 문제 제기**
```
┌─────────────────────────────────────────────────┐
│     웨딩 화보 촬영, 얼마나 드셨나요?              │
│                                                 │
│   ┌────────┐  ┌────────┐  ┌────────┐           │
│   │  💸    │  │  ⏰    │  │  😰    │           │
│   │50-200만│  │ 반나절  │  │ 촬영   │           │
│   │  원    │  │  소요   │  │ 부담   │           │
│   └────────┘  └────────┘  └────────┘           │
└─────────────────────────────────────────────────┘
```

**Part 2 - 해결책**
```
┌──────────────────────────────────────┐
│  기존 웨딩 촬영      vs    Cuggu      │
├──────────────────────────────────────┤
│  50-200만원               9,900원    │
│  4-6시간                  2-3분      │
│  예약 필수                즉시 생성   │
│  재촬영 어려움            무제한 생성  │
└──────────────────────────────────────┘
```

### 4. HowItWorks

3단계 프로세스:
1. **사진 업로드** (30초) - 증명사진 또는 정면 사진 1장
2. **스타일 선택** (1분) - 클래식/모던/빈티지 중 선택
3. **AI 생성 & 공유** (2-3분) - 4장 생성, 카카오톡 공유

### 5. SecurityTrust

```
┌─────────────────────────────────────────────────┐
│  배경: 다크 (slate-900)                          │
│                                                 │
│        🔒 안전한 청첩장                          │
│    피싱 청첩장 피해가 1,189% 증가했습니다         │
│                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ 암호화   │ │ 90일    │ │ 비밀번호 │       │
│   │ URL     │ │ 자동삭제 │ │ 보호    │       │
│   └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────┘
```

- 다크 배경으로 신뢰감/보안 느낌
- 아이콘: Shield, Lock, Clock (lucide-react)

### 6. SocialProof

```
┌─────────────────────────────────────────────────┐
│   "이미 1,234쌍의 커플이 선택했습니다"            │
│                                                 │
│   ┌──────────────────┐  ┌──────────────────┐    │
│   │ ★★★★★           │  │ ★★★★★           │    │
│   │ "증명사진만으로   │  │ "2분만에 웨딩    │    │
│   │  이런 퀄리티가?" │  │  화보가 나왔어요"│    │
│   └──────────────────┘  └──────────────────┘    │
│                                                 │
│   4.8/5.0 만족도  |  2,500+ 청첩장 생성         │
└─────────────────────────────────────────────────┘
```

### 7. Pricing (기존 개선)

- "웨딩 촬영 50-200만원 vs Cuggu 9,900원" 비교 강조
- "일회성 구매, 구독 없음" 배지
- 기존 카드 구조 유지

### 8. FinalCTA

```
┌─────────────────────────────────────────────────┐
│  배경: 그라데이션 (rose-500 → pink-500)          │
│                                                 │
│     지금 시작하면                                │
│     AI 사진 생성 2회 무료                        │
│                                                 │
│     [무료로 청첩장 만들기] (큰 버튼, 흰색)        │
│                                                 │
│     💳 신용카드 등록 없이 바로 시작              │
└─────────────────────────────────────────────────┘
```

---

## CTA 배치 전략

| 섹션 | CTA 텍스트 | 스타일 |
|------|-----------|--------|
| Hero | "무료로 시작하기" | 가장 큼, rose-600 |
| BeforeAfter | "이런 사진 만들기" | 중간, outline |
| ProblemSolution | "지금 바로 시작하기" | 중간, rose-600 |
| HowItWorks | "무료로 시작하기" | 중간, rose-600 |
| Pricing | "무료로 시작하기" / "구매하기" | 플랜별 |
| FinalCTA | "무료로 청첩장 만들기" | 가장 큼, 흰색 |

---

## 구현 순서

### Phase 1: 핵심 (전환 영향 큼)
1. `components/landing/` 폴더 생성
2. `HeroImpact.tsx` 구현
3. `BeforeAfterGallery.tsx` 구현
4. `FinalCTA.tsx` 구현

### Phase 2: 가치 제안
5. `ProblemSolution.tsx` 구현
6. `HowItWorks.tsx` 구현
7. `Pricing.tsx` 개선

### Phase 3: 신뢰 구축
8. `SecurityTrust.tsx` 구현
9. `SocialProof.tsx` 구현

### Phase 4: 통합 & 마무리
10. `app/(marketing)/page.tsx` 업데이트
11. `globals.css` 색상 변수 추가
12. 이미지 에셋 정리

---

## 수정할 파일

| 파일 | 작업 |
|-----|-----|
| `app/(marketing)/page.tsx` | 새 섹션들로 교체 |
| `app/globals.css` | 로맨틱 색상 변수 추가 |
| `components/marketing/Pricing.tsx` | 비교 강조 추가 |
| `components/animations/FallingPetals.tsx` | Hero 영역 제한 옵션 추가 |

---

## 검증 방법

1. `npm run dev` 후 http://localhost:3000 확인
2. 반응형 테스트: 모바일/태블릿/데스크톱
3. 스크롤 애니메이션 동작 확인
4. Before/After 슬라이더 드래그 & 터치 확인
5. CTA 버튼 연결 확인
6. Lighthouse 성능 점수 확인 (목표: 90+)

---

## 주의사항

- **이미지 에셋**: 현재 unsplash 플레이스홀더 → 실제 AI 생성 결과물 필요
- **FallingPetals 성능**: 모바일에서 꽃잎 개수 줄이기 (10→5)
- **A/B 테스트**: 기존 landing-a/b/c 페이지 유지 (비교용)
