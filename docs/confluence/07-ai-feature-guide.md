# AI 기능 가이드

Cuggu의 핵심 차별화 기능인 AI 이미지 생성에 대한 상세 가이드입니다.

---

## 개요

Cuggu는 Replicate API를 통해 AI 이미지 생성 기능을 제공합니다.
사용자는 텍스트 프롬프트로 웨딩 테마의 이미지를 생성하거나, 자신의 사진을 기반으로 AI 합성 이미지를 만들 수 있습니다.

---

## 지원 모델

| 모델 | 용도 | 특징 | 예상 시간 |
|------|------|------|----------|
| **Flux Pro** | 고품질 이미지 생성 | 최고 품질, 디테일 우수 | ~30초 |
| **Flux Dev** | 빠른 프로토타입 | 빠른 생성, 적당한 품질 | ~10초 |
| **PhotoMaker** | 인물 합성 | 사용자 얼굴을 이미지에 합성 | ~45초 |

---

## 사용 흐름

### 1. 일반 이미지 생성 (Flux)

```
사용자 프롬프트 입력
        ↓
    스타일 선택
        ↓
    모델 선택 (Pro/Dev)
        ↓
    생성 요청
        ↓
    결과 확인 & 저장
```

### 2. 인물 합성 (PhotoMaker)

```
사용자 사진 업로드 (3-5장 권장)
        ↓
    원하는 스타일/배경 설명
        ↓
    PhotoMaker 생성 요청
        ↓
    합성 결과 확인
        ↓
    원하는 이미지 선택 & 저장
```

---

## 기술 구현

### 주요 파일
- `lib/ai/replicate.ts` - Replicate API 클라이언트
- `lib/ai/models.ts` - 모델 정의 및 파라미터
- `app/api/ai/generate/route.ts` - 생성 API 엔드포인트

### 코드 예시

```typescript
// lib/ai/replicate.ts
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateWithFlux(prompt: string, model: 'pro' | 'dev') {
  const modelId = model === 'pro'
    ? 'black-forest-labs/flux-pro'
    : 'black-forest-labs/flux-dev';

  const output = await replicate.run(modelId, {
    input: {
      prompt,
      aspect_ratio: '3:4', // 청첩장에 최적화
      output_format: 'webp',
      output_quality: 90,
    }
  });

  return output;
}
```

---

## 프롬프트 가이드

### 효과적인 프롬프트 작성

**좋은 프롬프트 예시:**
```
A romantic Korean wedding photo with cherry blossoms in spring,
soft natural lighting, elegant hanbok couple,
traditional Korean architecture in background,
high quality, professional photography style
```

**나쁜 프롬프트 예시:**
```
wedding photo
```

### 프롬프트 구성 요소

1. **주제**: 무엇을 생성할 것인가
2. **스타일**: 어떤 분위기/스타일인가
3. **배경**: 어떤 환경/장소인가
4. **품질 지시어**: high quality, detailed, professional 등

### 스타일 프리셋

| 스타일 | 설명 | 키워드 |
|--------|------|--------|
| Romantic | 로맨틱, 부드러운 | soft lighting, dreamy, pastel colors |
| Classic | 클래식, 우아한 | elegant, timeless, traditional |
| Modern | 모던, 세련된 | minimalist, clean, contemporary |
| Nature | 자연, 야외 | outdoor, garden, natural light |

---

## 제한 사항

### 사용량 제한
- 무료 사용자: 3회/일
- 유료 사용자: 50회/일
- 한 번에 1개 이미지만 생성 가능

### 콘텐츠 정책
- 부적절한 콘텐츠 생성 금지
- Replicate 이용 약관 준수
- 생성된 이미지는 개인 사용 목적으로만

### 기술적 제한
- 최대 이미지 크기: 1024x1024
- 지원 포맷: WebP, PNG, JPEG
- 타임아웃: 60초

---

## 에러 처리

| 에러 코드 | 원인 | 해결 방법 |
|-----------|------|-----------|
| `RATE_LIMIT` | 사용량 초과 | 잠시 후 재시도 |
| `CONTENT_POLICY` | 부적절한 프롬프트 | 프롬프트 수정 |
| `MODEL_ERROR` | 모델 오류 | 다른 모델 시도 |
| `TIMEOUT` | 생성 시간 초과 | 재시도 |

---

## 비용

| 모델 | 비용/생성 |
|------|-----------|
| Flux Pro | ~$0.05 |
| Flux Dev | ~$0.01 |
| PhotoMaker | ~$0.08 |

> 비용은 Replicate 가격 정책에 따라 변동될 수 있습니다.

---

## 향후 계획

- [ ] 배치 생성 기능 (여러 이미지 동시 생성)
- [ ] 이미지 편집 기능 (부분 수정)
- [ ] 스타일 학습 기능 (사용자 취향 반영)
- [ ] 비디오 생성 기능
