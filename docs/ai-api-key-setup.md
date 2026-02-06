# AI API 키 발급 가이드

## 환경 변수

`.env.local`에 추가:

```env
# OpenAI (gpt-image-1, dall-e-3)
OPENAI_API_KEY=sk-...

# Google AI (imagen-3)
GOOGLE_AI_API_KEY=AIza...
```

---

## OpenAI API 키

1. https://platform.openai.com 로그인
2. 좌측 메뉴 **API keys** (또는 https://platform.openai.com/api-keys)
3. **Create new secret key** 클릭
4. 이름: `cuggu-production` 등 입력
5. 생성된 `sk-...` 키 복사 → `OPENAI_API_KEY`에 설정

### 비용 설정

- **Settings > Billing** 에서 결제 수단 등록
- **Usage limits** 에서 월 한도 설정 권장 (예: $50)
- gpt-image-1: ~$0.04/장 (medium, 1024x1536)
- dall-e-3: ~$0.04/장 (standard, 1024x1792)

### 주의사항

- 키는 생성 직후 1회만 표시됨. 분실 시 재발급
- Organization이 여러 개면 Default org 확인

---

## Google AI API 키 (Gemini / Imagen)

1. https://aistudio.google.com/apikey 접속
2. **Create API key** 클릭
3. 프로젝트 선택 (또는 새 프로젝트 생성)
4. 생성된 `AIza...` 키 복사 → `GOOGLE_AI_API_KEY`에 설정

### 비용 설정

- https://console.cloud.google.com/billing 에서 결제 계정 연결
- **Budgets & alerts** 에서 예산 알림 설정 권장
- imagen-3: ~$0.04/장

### 주의사항

- Imagen 3는 일부 리전에서만 사용 가능 (미국 기준 정상 동작)
- 무료 티어: 분당 제한 있음 (RPM). 프로덕션은 유료 플랜 필요
- Google Cloud 프로젝트에 **Generative Language API** 활성화 필요할 수 있음

---

## 확인 방법

환경 변수 설정 후 dev 서버에서:

1. 에디터 > 갤러리 탭 > AI 사진 생성
2. 고급 설정에서 새 모델 선택 가능한지 확인
3. Admin 페이지 (`/admin/ai-models`)에서 모델 활성/비활성 관리
