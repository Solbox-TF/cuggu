# 2026-02-12 데일리 리뷰

## 어제 (2/11) 작업 요약

### 커밋 현황: 8건 / 52파일 변경 / +6,549줄 -777줄

---

### 1. 프리뷰 시스템 정리 (15:24)
**`fix: 프리뷰 zoom 정리 + 폰 프레임 z-index 수정`**

- PreviewPanel: auto-fit ResizeObserver 제거, 85%/100% 고정 줌
- PreviewClient: auto-fit 제거, 92% 수동 줌 + 직접 입력
- PreviewViewport/PhoneFrame: z-index 스택 정리 (콘텐츠 z-10, 카메라 z-20)
- FooterSection: ViralCTA 조건을 `isPreview` → `isPremium`으로 변경
- **파일 5개** 변경

### 2. 워터마크 게이트 구현 (15:25)
**`feat: 워터마크 게이트 (무료 플랜 FloatingBadge + isPremium 분기)`**

- FloatingBadge: 무료 사용자 하단 플로팅 Cuggu 배지
- Zustand `invitation-view` store: isPremium/ctaVisible 전역 상태
- PremiumToggle: 개발용 프리미엄 토글
- 발행 API: 필수 필드 서버사이드 검증 + extendedData merge 강화
- **파일 7개** 변경, +129줄

### 3. 프로젝트 문서 정리 (15:28)
**`docs: 프로젝트 문서 추가 (피치, AI 시스템, 리뷰, 세션 일지)`**

- `cuggu-pitch.md`, `ai-wedding-photo-system.md` 등 5개 문서
- 6관점 리뷰 문서 + 세션 일지
- **+1,678줄**

### 4. AI 공유 컴포넌트 리팩토링 (21:00)
**`refactor: AI 공유 컴포넌트 components/ai/로 이동`**

- AIStreamingGallery, AIResultGallery, ImageModal을 `editor/tabs/gallery/` → `components/ai/`
- 대시보드 AI Studio + 에디터 양쪽 재사용 가능하도록 구조 변경
- **파일 5개** 이동/수정

### 5. AI Studio 페이지 리라이트 (21:03)
**`feat: AI Studio 페이지 리라이트 (SSE 스트리밍 + 멀티셀렉트)`**

- 동기 POST → SSE 스트리밍 전환 (`/api/ai/generate/stream`)
- 싱글셀렉트 → 멀티셀렉트 (토글 방식)
- 모델 선택 상시 노출, PersonSection 컴포넌트 분리
- 구형 GenerationProgress, ModelSelector, ResultGallery 삭제 → 공유 컴포넌트로 대체
- **파일 4개** 변경, +362줄 -521줄 (순 감소)

### 6. AI 테마 생성 시스템 개선 (22:45)
**`refactor: AI 테마 생성 시스템 개선 (프롬프트 축소 + 페르소나 로테이션)`**

- 프롬프트 토큰 최적화
- 페르소나 로테이션 시스템 도입
- enum 보정 (sanitizeEnums) + 레이아웃 시드 생성
- **파일 4개** 변경, +296줄 -176줄

### 7. AI 포토 스튜디오 종합 리디자인 (22:45)
**`feat: AI 포토 스튜디오 종합 리디자인`**

- DB: aiGenerations에 `role`, `isFavorited`, `modelId` 컬럼 추가
- API: generations 필터/페이지네이션, 즐겨찾기 토글, 청첩장 적용 3개 엔드포인트
- UI: 탭 시스템 (생성/히스토리/즐겨찾기) + 컴포넌트 6개 신규
- ApplyToInvitationModal: 청첩장 선택 → galleryImages append
- Nav: "AI 사진 생성" → "AI 포토 스튜디오" 리브랜딩
- **파일 15개** 변경, +1,168줄 -125줄

### 8. 설계 문서 + 세션 일지 (22:46)
**`docs: AI 앨범 설계 문서 + 세션 일지 추가`**

- AI 앨범 설계, 테마 생성 시스템, 테마 품질 분석 등 8개 문서
- **+2,952줄**

---

## PM 관점 피드백

### 잘한 점
1. **수익화 기반 작업 시작**: 워터마크 게이트(FloatingBadge)로 무료/프리미엄 분기점 확보. 이게 있어야 유료 전환이 일어남.
2. **AI Studio → 프리미엄 경험 분리**: 에디터 내부에 묻혀있던 AI를 독립 페이지로 올림. 프리미엄 전환의 쇼케이스 역할.
3. **컴포넌트 재사용 구조화**: AI 공유 컴포넌트를 `components/ai/`로 분리해서 에디터+대시보드 양쪽에서 쓸 수 있게 함.

### 우려 사항
1. **문서 과잉 투자**: 하루 작업량의 ~40%가 문서 (+4,630줄). 설계 문서는 가치 있지만, 지금 단계에서 `ai-theme-generation-system.md` (1,183줄), `ai-theme-quality-analysis.md` (652줄)은 과다. **문서는 구현할 때 필요한 최소한만.**
2. **공개 청첩장 뷰(inv/[id])가 아직 미완**: 유저가 실제로 보는 최종 산출물인데, 여전히 P1 백로그에 남아있음. AI 내부 도구보다 **사용자가 받는 청첩장**이 먼저.
3. **AI 테마 작업 재개 논란**: 2/11 세션 시작 시 "AI 테마 작업 금지" 결정했는데, 저녁에 `theme-generation.ts` 리팩토링 + 품질 분석 문서 작성. 결정 → 실행 일관성 부족.
4. **결제 시스템 계속 미뤄짐**: 워터마크 게이트까지 만들어놓고 결제가 P3. 프리미엄 전환 버튼 누르면 뭐가 나오나?

### 핵심 질문
- **"누가 돈을 내고 프리미엄을 쓰나?"** → 결제 없이 워터마크 게이트만 있으면 사용자 이탈만 늘어남
- **베타 테스트 일정은?** → P2에 `cuggu-7to` (베타 테스트)가 있는데, 언제 시작할 건지 타임라인 없음

---

## 개발자 관점 피드백

### 아키텍처 & 구조
- **AI 공유 컴포넌트 분리**: 좋은 결정. `components/ai/`가 에디터와 대시보드 양쪽 의존성 해소.
- **SSE 스트리밍 전환**: 동기 POST → SSE는 UX 향상에 직결. 구현도 깔끔 (buffer 기반 파싱).
- **Zustand store 추가 (`invitation-view`)**: 최소한의 전역 상태 (isPremium, ctaVisible). 적절한 크기.

### 발견된 이슈 (우선순위순)

#### P0 - 즉시 수정
| 이슈 | 파일 | 설명 |
|------|------|------|
| **Apply 경쟁 조건** | `api/ai/generations/apply/route.ts` | 동시 apply 요청 시 galleryImages 유실 가능. fetch-modify-write 패턴에 트랜잭션 없음 |
| **스트리밍 데이터 미검증** | `dashboard/ai-photos/page.tsx` | SSE `data.type`, `data.url` 등 서버 응답을 검증 없이 사용. 서버 장애 시 클라이언트 크래시 |

#### P1 - 이번 주 내
| 이슈 | 파일 | 설명 |
|------|------|------|
| **이미지 URL 호스트 미검증** | `apply/route.ts` | `.url()` 형식만 체크. 외부 URL을 갤러리에 주입 가능 |
| **모달 키보드 핸들링 없음** | `ApplyToInvitationModal.tsx` | ESC 키 미지원, AbortController 미적용 |
| **타입 안전성 부족** | `page.tsx` | `historyGenerationsRef`, `favoritesGenerationsRef`가 `any[]` |
| **즐겨찾기 API Zod 미적용** | `generations/[id]/route.ts` | `typeof isFavorited !== 'boolean'` 수동 검증 → Zod 스키마로 교체 필요 |

#### P2 - 개선
| 이슈 | 파일 | 설명 |
|------|------|------|
| **Apply 갤러리 O(n²)** | `apply/route.ts` | `includes()` 선형 탐색. Set으로 교체 |
| **Enum fallback 무로깅** | `theme-generation.ts` | AI 출력 오류 시 silent fallback. 로깅 추가 필요 |
| **API 응답 형식 비일관** | 전체 route.ts | success/error 응답 구조 통일 필요 |
| **FloatingBadge 접근성** | `FloatingBadge.tsx` | `aria-label` 미설정, DOM에서 제거 대신 opacity 토글 |
| **Rate limiting 부재** | `apply/route.ts` | 배열 10개까지 허용인데 호출 빈도 제한 없음 |

### 코드 품질 종합
- **좋은 패턴**: Zod 검증 (apply API), SSE 버퍼 파싱, useRef로 불필요한 리렌더 방지
- **나쁜 패턴**: `any[]` 타입, silent catch, 수동 타입 체크 (Zod 대신)
- **일관성**: API 응답 형식이 파일마다 다름. `{ success, data }` vs `{ error }` 혼재

---

## 오늘 (2/12) 작업 계획

### 우선순위 기반 계획

#### 1단계: 어제 이슈 핫픽스 (오전)
- [ ] **Apply 경쟁 조건 수정** - 트랜잭션 추가 또는 atomic append
- [ ] **SSE 데이터 검증** - Zod 스키마로 스트리밍 이벤트 검증
- [ ] **이미지 URL 호스트 검증** - CloudFront/S3 도메인만 허용
- [ ] **즐겨찾기 API Zod 교체** - 수동 타입 체크 → Zod

#### 2단계: 공개 청첩장 뷰 (오후) - P1 핵심
**사용자가 실제로 보는 페이지가 없으면 서비스가 아님.**

beads 이슈:
- `cuggu-qyp` - 캐싱 레이어 (ISR/Redis)
- `cuggu-7m8` - RSVP 하객 폼
- `cuggu-s2k` - 방명록

이 중 **공개 뷰 자체의 완성도**가 먼저:
- [ ] `inv/[id]` 페이지 전체 흐름 점검 및 보완
- [ ] 섹션 렌더링 순서, 데이터 바인딩 확인
- [ ] OG 메타태그 + 카카오톡 미리보기 동작 확인

#### 3단계: 결제 연동 설계 (저녁, 시간 되면)
워터마크 게이트를 만들었으니, 프리미엄 전환 버튼 눌렀을 때 뭔가가 있어야 함:
- [ ] Toss Payments 연동 설계 (bd issue `cuggu-8vc`)
- [ ] 결제 → isPremium 전환 플로우 설계

### 보류
- AI 테마 관련 작업 전면 금지 (어제 결정 유지)
- 문서 작업 최소화 (구현 중 필요한 것만)
- 에디터 UX 개선 (Step B) - 공개 뷰 + 결제 이후

---

## 수치 요약

| 지표 | 값 |
|------|-----|
| 어제 커밋 | 8건 |
| 변경 파일 | 52개 |
| 코드 추가 | +6,549줄 |
| 코드 삭제 | -777줄 |
| 순 증가 | +5,772줄 |
| 코드 비율 | ~60% (문서 제외 ~3,400줄) |
| 문서 비율 | ~40% (~4,630줄) |
| 발견 이슈 | P0: 2개, P1: 4개, P2: 5개 |
| beads 열린 이슈 | 40개 |
| beads 완료 이슈 | 70개 (전체 111개 중 63%) |
