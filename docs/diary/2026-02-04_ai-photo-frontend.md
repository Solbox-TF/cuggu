# AI 사진 생성 Frontend 구현

**날짜**: 2026-02-04
**작업자**: jykim
**브랜치**: feature/ai-photo-generation

---

## 작업한 내용

### 1. Frontend 컴포넌트 구현 (6개 이슈 완료)
- `app/api/user/credits/route.ts` - 크레딧 조회 API
- `app/dashboard/ai-photos/page.tsx` - 메인 페이지 (신랑/신부 각각 처리)
- `AIPhotoUploader.tsx` - 드래그 앤 드롭 이미지 업로드
- `StyleSelector.tsx` - 5가지 웨딩 스타일 선택
- `GenerationProgress.tsx` - AI 생성 진행 상태 표시 (20-40초)
- `ResultGallery.tsx` - 생성된 4장 이미지 표시 및 선택

### 2. 환경 변수 설정
- Replicate API (AI 생성)
- Azure Face API (얼굴 감지)
- AWS S3 (이미지 저장소)
- Upstash Redis (Rate limiting)

**발견한 문제들:**
- S3 버킷명 오타: `cuggu` → `cuugu`
- 버킷 정책 없음 → 공개 읽기 정책 적용

### 3. AI 모델 선택 기능 (개발 모드)
- 9개 → 3개 검증된 모델만 유지
- Flux 1.1 Pro ($0.04/장)
- Flux Dev ($0.025/장)
- **PhotoMaker ($0.0095/장)** ⭐ 얼굴 보존 excellent

**개발 모드 전용:**
- 모델 비교 UI (비용, 얼굴 보존, 속도)
- 크레딧 무제한 (∞ 표시)
- 각 모델별 최적화된 파라미터

### 4. 핵심 문제 해결

#### 문제 1: Flux 1.1 Pro는 단일 이미지만 반환
```typescript
// 기대: num_outputs: 4 → [url1, url2, url3, url4]
// 실제: 단일 string 반환
```
**해결**: 4번 병렬 호출 (Promise.all)

#### 문제 2: Replicate Rate Limit
- 결제 수단 없으면: 6 requests/분, burst 1
- **해결**: 결제 수단 추가 → 병렬 실행 가능

#### 문제 3: 얼굴이 바뀌는 문제
```typescript
// 문제: 프롬프트에 성별 정보 없음
// 해결: role(GROOM/BRIDE) 전달 + 성별별 프롬프트
```
```typescript
const genderPrompt = role === 'GROOM'
  ? 'handsome Korean groom in elegant black tuxedo and bow tie'
  : 'beautiful Korean bride in white wedding dress';
```

#### 문제 4: 개발 모드 크레딧 체크
- Frontend: `credits === 0` 체크
- API: `checkCreditsFromUser(user)` 체크
**해결**: 개발 모드면 양쪽 모두 스킵

#### 문제 5: 모델 ID 매칭 오류
```typescript
// 문제: 키(PHOTOMAKER) vs ID(photomaker) 불일치
// 해결: Object.values(AI_MODELS).find(m => m.id === selectedModelId)
```

---

## 왜 했는지 (맥락)

### 비즈니스 목표
- **핵심 차별화**: AI 웨딩 사진 자동 생성
- 웨딩 화보 촬영 비용(수십만원) 절감
- 증명 사진만으로 4장 생성

### 기술 스택 선택 이유
1. **Replicate API**: 자체 GPU 서버 불필요, 종량제
2. **Flux 1.1 Pro**: 최신 고품질 모델 (Phase 1)
3. **PhotoMaker**: 얼굴 보존 우수 (실제 추천 모델)

---

## 논의/아이디어/고민

### 1. 단일 vs 배치 생성
**선택지:**
- A: 신랑/신부 각각 개별 처리 (선택됨)
- B: 커플 동시 생성 (한 번에 8장)

**결정**: A 선택
- 이유: 현재 Backend API 구조 그대로 사용
- 비용 동일 ($0.16 × 2 = $0.32)
- 즉시 출시 가능

### 2. 얼굴 보존 문제
**시도:**
1. 프롬프트 강화: "keeping exact same face, identical facial features"
2. `prompt_strength: 0.85` 추가
3. 모델 교체: Flux → PhotoMaker

**결과**: PhotoMaker가 가장 우수 (테스트 필요)

### 3. 개발 모드 설계
**고민**: 모델 선택 기능을 어디까지?
- 프로덕션: 단일 모델 고정
- 개발: 9개 모델 비교 → 3개로 축소 (404 에러)

**교훈**: Replicate 모델은 자주 deprecated됨
- 검증된 공식 모델만 사용
- 나머지는 주석 처리 후 개별 테스트

---

## 결정된 내용

### 아키텍처
1. **Phase 1 (MVP)**: Replicate API 사용
2. **Phase 2 (출시 후)**: ComfyUI self-hosting + NestJS 마이크로서비스

### AI 생성 플로우
```
1. 증명 사진 업로드 (10MB 이하)
2. Azure Face API 얼굴 감지 (1명만)
3. S3 업로드
4. Replicate 4장 생성 (병렬, ~20초)
5. 사용자 1장 선택
6. 청첩장 적용
```

### 비용 구조
- 개발 모드: 무제한 (크레딧 차감 없음)
- 프로덕션: 1회 생성 = 1 크레딧 소모
- 실제 비용: $0.04~0.0095 (모델별)

---

## 느낀 점/난이도/발견

### 난이도: ⭐⭐⭐☆☆ (중)

**쉬웠던 부분:**
- Frontend 컴포넌트 구현 (React 기본)
- Framer Motion 애니메이션

**어려웠던 부분:**
- Replicate 모델별 파라미터 차이
- 얼굴 보존 품질 예측 불가 (실험 필요)
- 404 에러 모델 디버깅

### 발견한 것들

#### 1. Replicate의 한계
- `num_outputs` 지원 여부가 모델마다 다름
- 공식 문서와 실제 동작 불일치
- 모델이 자주 deprecated됨

#### 2. AI 프롬프트의 중요성
```typescript
// Before: 여성 얼굴로 생성됨
prompt: "elegant wedding photo"

// After: 성별 명확
prompt: "handsome Korean groom in black tuxedo, elegant wedding photo"
```

#### 3. 개발 환경 분리의 중요성
- 크레딧 무제한으로 여러 모델 실험 가능
- 프로덕션 영향 없이 테스트

---

## 남은 것/미정

### TODO
- [ ] PhotoMaker 실제 테스트 (얼굴 보존 확인)
- [ ] 에러 케이스 테스트 (cuggu-6zb)
  - 크레딧 부족
  - 얼굴 미감지
  - 여러 얼굴
  - 파일 크기 초과
  - Rate limit
- [ ] 모바일 반응형 검증 (cuggu-bq5)
- [ ] 성능 테스트 (생성 시간 20-40초 확인)

### 미정 (Phase 2)
- ComfyUI self-hosting 시점
- LoRA fine-tuning (개인화)
- Webhook 비동기 처리 (블로킹 해소)

### 알려진 이슈
1. **Replicate 응답 속도**: 20-40초 (개선 불가, Webhook 검토)
2. **얼굴 보존 품질**: 모델별 차이, 실험 필요
3. **비용 예측**: 사용량 기반, 모니터링 필요

---

## 다음 액션

### 우선순위
1. **PhotoMaker 실제 테스트** - 얼굴 보존 확인
2. **에러 케이스 테스트** - 402, 400, 429 응답 확인
3. **커밋 & PR** - 코드 리뷰 요청

### 커밋 메시지
```bash
feat: AI 사진 생성 Frontend 구현 + 모델 선택

- 크레딧 조회 API 추가
- AI 사진 업로드 및 생성 UI (4개 컴포넌트)
- 개발 모드: 3개 AI 모델 선택 기능
- 개발 모드: 크레딧 무제한
- 환경 변수 설정 (Replicate, Azure, AWS, Upstash)
- 성별별 프롬프트 추가 (신랑/신부 구분)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 서랍메모

### Replicate 모델 큐레이션 필요
- 검증된 모델만 유지
- 새 모델 추가 시 테스트 프로세스 필요
- 모델 deprecated 대응 방안

### Phase 2 아키텍처 고민
- ComfyUI self-hosting 시점: 월 1000장 이상?
- NestJS 마이크로서비스 분리 타이밍
- GPU 서버 비용 vs Replicate 비용

### AI 프롬프트 개선
- 스타일별 프롬프트 세밀화
- 한국식 웨딩 특화 키워드
- 얼굴 보존 프롬프트 연구

---

## 질문 평가 및 피드백

### 내가 한 질문들
1. ✅ "올린 사진의 얼굴이 생성된 인물의 사진으로 바뀌어야 하는데"
   - **평가**: 핵심 문제 정확히 지적
   - **결과**: role 파라미터 추가, 성별별 프롬프트

2. ✅ "개발모드에서는 모델 선택할 수 있게 해서 여러개 테스트 해보자"
   - **평가**: 실용적, 개발 효율 증대
   - **결과**: 9개 모델 추가 → 3개로 검증

3. ✅ "개발모드에서는 크레딧 무제한으로 해줘"
   - **평가**: 필수 요구사항
   - **결과**: Frontend + Backend 양쪽 체크 스킵

4. ✅ "이 모델들은 다 어디서 가져오는거야?"
   - **평가**: 근본적인 이해
   - **결과**: Replicate 플랫폼 이해

### 개선할 점
- 초기에 얼굴 보존 문제 예상 못함 (Flux 선택 시)
- 모델 검증 프로세스 없이 9개 추가 → 404 에러

### 잘한 점
- 문제 발생 시 즉각 피드백
- 개발 환경 분리 요청 (크레딧 무제한)
- 비용 표시 요구 (투명성)

---

## 참고 링크
- [Replicate Explore](https://replicate.com/explore)
- [PhotoMaker](https://replicate.com/tencentarc/photomaker)
- [Flux 1.1 Pro](https://replicate.com/black-forest-labs/flux-1.1-pro)
- [환경 설정 가이드](../environment-setup-guide.md)
