# 배포 가이드

Cuggu 프로젝트의 배포 프로세스입니다.

---

## 배포 환경

| 환경 | URL | 용도 |
|------|-----|------|
| Production | cuggu.com | 실 서비스 |
| Staging | staging.cuggu.com | QA/테스트 |
| Preview | *.vercel.app | PR 미리보기 |

---

## 배포 플랫폼

- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Storage**: AWS S3 + CloudFront
- **Cache**: Upstash Redis

---

## 배포 플로우

```
main 브랜치 push
       ↓
   Vercel 빌드
       ↓
   테스트 실행
       ↓
   프로덕션 배포
       ↓
   헬스체크
```

### PR 플로우
```
feature 브랜치 → PR 생성
       ↓
   자동 Preview 배포
       ↓
   코드 리뷰
       ↓
   main 머지
       ↓
   프로덕션 자동 배포
```

---

## 배포 명령어

### Vercel CLI

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 수동 배포 (긴급 시)

```bash
# 1. 빌드 확인
pnpm build

# 2. 프로덕션 배포
vercel --prod

# 3. 배포 확인
vercel ls
```

---

## 환경 변수

### 필수 환경 변수

```bash
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://cuggu.com
NEXTAUTH_SECRET=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...

# AWS
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_CLOUDFRONT_URL=...

# AI
REPLICATE_API_TOKEN=...

# Cache
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Payment (예정)
TOSS_CLIENT_KEY=...
TOSS_SECRET_KEY=...
```

### 환경 변수 설정 (Vercel)

```bash
# 단일 변수 설정
vercel env add DATABASE_URL production

# .env 파일에서 일괄 설정
vercel env pull .env.local
```

---

## 데이터베이스 마이그레이션

### 배포 전 마이그레이션

```bash
# 1. 마이그레이션 파일 생성
pnpm drizzle-kit generate

# 2. 로컬에서 테스트
pnpm drizzle-kit push

# 3. 프로덕션 적용
DATABASE_URL=<prod_url> pnpm drizzle-kit push
```

### 주의사항
- 스키마 변경은 반드시 배포 전에 마이그레이션
- 파괴적 변경(컬럼 삭제 등)은 2단계로 진행
  1. 먼저 코드에서 해당 컬럼 사용 제거
  2. 다음 배포에서 스키마에서 컬럼 제거

---

## 롤백

### Vercel 롤백

```bash
# 배포 목록 확인
vercel ls

# 특정 배포로 롤백
vercel rollback <deployment-url>
```

### 긴급 롤백 (대시보드)

1. Vercel Dashboard 접속
2. Deployments 탭
3. 이전 배포 선택
4. "Promote to Production" 클릭

---

## 모니터링

### 헬스체크 엔드포인트

```
GET /api/health
```

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### 로그 확인

```bash
# Vercel 로그
vercel logs

# 실시간 로그
vercel logs --follow
```

### 알림 설정

- Vercel: 배포 실패 시 Slack 알림
- Supabase: DB 에러 알림
- Upstash: 레이트 리밋 알림

---

## 체크리스트

### 배포 전
- [ ] 로컬 빌드 성공 확인 (`pnpm build`)
- [ ] 테스트 통과 확인
- [ ] 환경 변수 확인
- [ ] DB 마이그레이션 필요 여부 확인
- [ ] 영향 범위 확인

### 배포 후
- [ ] 헬스체크 확인
- [ ] 주요 기능 스모크 테스트
- [ ] 에러 로그 모니터링
- [ ] 성능 메트릭 확인

---

## 트러블슈팅

### 빌드 실패
```bash
# 캐시 클리어 후 재빌드
vercel --force
```

### 환경 변수 오류
```bash
# 환경 변수 확인
vercel env ls
```

### 504 Gateway Timeout
- API Route 타임아웃 (기본 10초)
- Vercel Pro에서 최대 300초까지 가능
- 긴 작업은 백그라운드 처리로 전환
