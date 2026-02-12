# Cuggu AWS 마이그레이션 실행 계획 (SST + Lambda)

> 최종 업데이트: 2026-02-12
> 대상: Vercel + Supabase → SST/Lambda + RDS PostgreSQL

---

## 개요

```
현재 (AS-IS)                          목표 (TO-BE)
──────────────────                    ──────────────────
Vercel Functions (36 API)  →          Lambda (via OpenNext)
Vercel CDN                 →          CloudFront
Supabase PostgreSQL (15T)  →          RDS PostgreSQL + RDS Proxy
Upstash Redis              →          Upstash Redis (유지)
AWS S3 + CloudFront        →          AWS S3 + CloudFront (유지)
Vercel Cron                →          EventBridge + Lambda
vercel.json                →          sst.config.ts (IaC)
SSE Streaming (/api/ai/)   →          Lambda Response Streaming
```

**예상 총 소요**: 5~7일 (여유 포함)
**예상 다운타임**: 0 (DNS 전환 방식)

### 2026-02-09 이후 변경사항

```
DB:  7 테이블 → 15 테이블 (AI Job/크레딧/참조사진/테마/설정 추가)
API: ~22 라우트 → 36 라우트 (Job/참조사진/크레딧/스트림 엔드포인트)
AI:  Replicate 단일 → Replicate + OpenAI + Gemini (7개 모델)
새 기능: 배치 생성 (SSE), 크레딧 예약/환불, 참조 사진 재사용
외부 API: Azure Face API (참조 사진 얼굴 감지) 추가
```

---

## Phase 0: 사전 준비 (Day 0)

### 0-1. AWS 계정 & IAM 설정

```bash
# AWS CLI 설치 & 설정
brew install awscli
aws configure
  # AWS Access Key ID: [IAM 사용자 키]
  # Default region: ap-northeast-2
  # Default output: json
```

**IAM 정책 (SST용)**:
- `AdministratorAccess` 또는 SST 전용 최소 권한 정책
- SST가 CloudFormation, Lambda, S3, CloudFront, Route53 등을 생성하므로 넓은 권한 필요
- 프로덕션에서는 전용 IAM 사용자 생성 권장

### 0-2. SST CLI 설치

```bash
# SST v3 설치 (Ion)
curl -fsSL https://sst.dev/install | bash

# 또는 npx로 실행 (설치 없이)
npx sst version
```

### 0-3. 현재 상태 백업

```bash
# Supabase DB 전체 백업
pg_dump --no-owner --no-acl \
  -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f cuggu_backup_$(date +%Y%m%d).dump

# 현재 환경변수 목록 기록
vercel env ls > vercel_env_backup.txt

# Git 태그로 현재 상태 마킹
git tag pre-aws-migration
git push origin pre-aws-migration
```

### 0-4. 체크리스트

```
[ ] AWS 계정 생성 & IAM 설정
[ ] AWS CLI 설치 & 인증
[ ] SST CLI 설치
[ ] Supabase DB 백업 완료
[ ] 환경변수 목록 정리
[ ] Git 태그 생성 (pre-aws-migration)
[ ] 도메인 현재 DNS 설정 기록 (TTL 등)
```

---

## Phase 1: RDS PostgreSQL 설정 (Day 1)

### 1-1. VPC & 네트워크 구성

SST가 자동으로 처리할 수 있지만, DB는 수동 생성 권장 (데이터 영속성).

```
VPC: cuggu-vpc
├── Public Subnet A  (ap-northeast-2a)  — NAT Gateway
├── Public Subnet B  (ap-northeast-2c)
├── Private Subnet A (ap-northeast-2a)  — RDS, Lambda
└── Private Subnet B (ap-northeast-2c)  — RDS (Multi-AZ 대비)
```

### 1-2. RDS PostgreSQL 인스턴스 생성

```
인스턴스: cuggu-db
엔진: PostgreSQL 16
인스턴스 클래스: db.t4g.micro (프리티어) → 트래픽 증가 시 db.t4g.small
스토리지: 20GB gp3
Multi-AZ: OFF (초기, 비용 절감)
백업: 7일 자동 백업
암호화: ON (KMS)
VPC: cuggu-vpc / Private Subnet
보안 그룹: Lambda 에서만 접근 허용 (포트 5432)
```

### 1-3. RDS Proxy 설정

Lambda → RDS 직접 연결 시 커넥션 폭증 문제 방지.

```
RDS Proxy: cuggu-db-proxy
엔진: PostgreSQL
타겟: cuggu-db
IAM 인증: OFF (초기, 비밀번호 인증)
유휴 커넥션 타임아웃: 1800초
최대 커넥션 풀 크기: 100%
```

### 1-4. 데이터 마이그레이션

```bash
# 1. RDS에 데이터베이스 생성
psql -h cuggu-db-proxy.xxx.ap-northeast-2.rds.amazonaws.com \
  -U postgres -c "CREATE DATABASE cuggu;"

# 2. Supabase → RDS 데이터 이전
pg_restore --no-owner --no-acl \
  -h cuggu-db-proxy.xxx.ap-northeast-2.rds.amazonaws.com \
  -U postgres \
  -d cuggu \
  cuggu_backup_YYYYMMDD.dump

# 3. 데이터 검증 (전체 15개 테이블)
psql -h cuggu-db-proxy.xxx.rds.amazonaws.com \
  -U postgres -d cuggu -c "
  SELECT 'users' as tbl, count(*) FROM users
  UNION ALL SELECT 'invitations', count(*) FROM invitations
  UNION ALL SELECT 'rsvps', count(*) FROM rsvps
  UNION ALL SELECT 'ai_generations', count(*) FROM ai_generations
  UNION ALL SELECT 'ai_albums', count(*) FROM ai_albums
  UNION ALL SELECT 'ai_reference_photos', count(*) FROM ai_reference_photos
  UNION ALL SELECT 'ai_generation_jobs', count(*) FROM ai_generation_jobs
  UNION ALL SELECT 'ai_credit_transactions', count(*) FROM ai_credit_transactions
  UNION ALL SELECT 'ai_themes', count(*) FROM ai_themes
  UNION ALL SELECT 'payments', count(*) FROM payments
  UNION ALL SELECT 'ai_model_settings', count(*) FROM ai_model_settings
  UNION ALL SELECT 'app_settings', count(*) FROM app_settings
  ORDER BY 1;
"

# 4. 크레딧 정합성 검증
psql -h cuggu-db-proxy.xxx.rds.amazonaws.com \
  -U postgres -d cuggu -c "
  SELECT u.id, u.ai_credits,
    (SELECT balance_after FROM ai_credit_transactions
     WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) as last_tx_balance
  FROM users u WHERE u.ai_credits > 0;
"
```

### 1-5. 체크리스트

```
[ ] VPC & 서브넷 생성
[ ] 보안 그룹 설정 (Lambda → RDS 5432)
[ ] RDS PostgreSQL 16 인스턴스 생성
[ ] RDS Proxy 설정
[ ] 데이터 마이그레이션 완료
[ ] 15개 테이블 카운트 검증
[ ] 16개 enum 타입 생성 확인
[ ] JSONB 컬럼 데이터 무결성 확인 (aiAlbums.images, aiGenerationJobs.config 등)
[ ] 크레딧 잔액 정합성 확인
[ ] Drizzle 마이그레이션 상태 확인 (5개 마이그레이션)
```

---

## Phase 2: SST 프로젝트 설정 (Day 2)

### 2-1. SST 초기화

```bash
# 프로젝트 루트에서
npx sst init
```

### 2-2. sst.config.ts 작성

```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "cuggu",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: { region: "ap-northeast-2" },
      },
    };
  },
  async run() {
    // ── 기존 S3 버킷 참조 (이미 존재) ──
    const bucket = new sst.aws.Bucket("CugguImages", {
      // 기존 버킷 import 또는 새로 생성
    });

    // ── Next.js 앱 (Lambda + CloudFront) ──
    const site = new sst.aws.Nextjs("CugguWeb", {
      // 도메인 설정
      domain: {
        name: "cuggu.com",
        dns: sst.aws.dns(),  // Route 53
      },

      // 환경변수 (2026-02-12 기준 전체 목록)
      environment: {
        // DB
        DATABASE_URL: "postgresql://...",  // RDS Proxy 엔드포인트

        // Auth
        NEXTAUTH_URL: "https://cuggu.com",
        NEXTAUTH_SECRET: "...",
        KAKAO_CLIENT_ID: "...",
        KAKAO_CLIENT_SECRET: "...",
        NAVER_CLIENT_ID: "...",
        NAVER_CLIENT_SECRET: "...",

        // AWS (Lambda 내부이므로 IAM Role 사용 → 키 불필요)
        AWS_REGION: "ap-northeast-2",
        S3_BUCKET_NAME: "cuggu-images",
        CLOUDFRONT_DOMAIN: "xxx.cloudfront.net",
        // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY → IAM Role로 대체

        // Redis (Upstash 유지)
        UPSTASH_REDIS_REST_URL: "...",
        UPSTASH_REDIS_REST_TOKEN: "...",

        // AI — 3개 프로바이더
        REPLICATE_API_TOKEN: "...",       // Flux Pro/Dev, PhotoMaker
        OPENAI_API_KEY: "...",            // GPT Image, DALL-E 3
        GOOGLE_AI_API_KEY: "...",         // Gemini Flash Image
        ANTHROPIC_API_KEY: "...",         // AI 테마 생성

        // Azure Face API (참조 사진 얼굴 감지)
        AZURE_FACE_API_KEY: "...",
        AZURE_FACE_ENDPOINT: "...",

        // AI 설정
        REPLICATE_COST_PER_IMAGE: "0.04",

        // Encryption (RSVP 개인정보 암호화)
        ENCRYPTION_KEY: "...",

        // Kakao Map
        NEXT_PUBLIC_KAKAO_MAP_API_KEY: "...",
      },

      // Lambda 설정
      server: {
        memory: "1024 MB",      // 기본 1GB (이미지 처리 + 다중 AI API 호출)
        timeout: "60 seconds",  // SSE 스트리밍 고려 (배치 생성 시 수 분)
      },

      // VPC 연결 (RDS 접근용)
      vpc: {
        // SST가 자동 생성하거나 기존 VPC 참조
      },
    });

    // ── Cron: 만료 청첩장 정리 (매일 3AM KST = 18:00 UTC) ──
    new sst.aws.Cron("CleanupCron", {
      schedule: "cron(0 18 * * ? *)",  // 매일 18:00 UTC = 03:00 KST
      function: {
        handler: "functions/cleanup.handler",
        timeout: "5 minutes",
        environment: {
          DATABASE_URL: "postgresql://...",
          AWS_REGION: "ap-northeast-2",
          S3_BUCKET_NAME: "cuggu-images",
        },
      },
    });

    return { url: site.url };
  },
});
```

### 2-3. Cron 함수 분리

현재 `app/api/cron/cleanup/route.ts`의 로직을 독립 함수로 추출.

```
functions/
└── cleanup.ts    ← Vercel Cron → EventBridge Lambda로 이전
```

```typescript
// functions/cleanup.ts
// 기존 app/api/cron/cleanup/route.ts 에서 로직 추출
export async function handler() {
  // 1. 만료 청첩장 EXPIRED + 30일 → DELETED 처리
  // 2. DELETED + 30일 → 하드 삭제 (DB 레코드)
  // 3. S3 이미지 배치 삭제 (DeleteObjectsCommand, 1000개/배치)
  // 4. 관련 AI 생성 데이터 정리 (aiGenerations, aiAlbums)
}
```

### 2-4. S3 IAM 권한 전환 (선택사항)

현재 S3 접근에 Access Key/Secret Key 사용 중.
Lambda에서는 IAM Role로 전환 가능 (더 안전).

```typescript
// 변경 전 (lib/ai/s3.ts)
const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

// 변경 후 (Lambda에서는 IAM Role 자동 주입)
const s3 = new S3Client({
  region: env.AWS_REGION,
  // credentials 생략 → Lambda 실행 역할에서 자동 획득
});
```

SST에서 Lambda에 S3 권한 부여:
```typescript
// sst.config.ts 안에서
site.attachPermissions(["s3"]);
```

### 2-5. 체크리스트

```
[ ] sst init 실행
[ ] sst.config.ts 작성
[ ] 환경변수 설정
[ ] Cron 함수 분리 (functions/cleanup.ts)
[ ] S3 IAM Role 전환 검토
[ ] .gitignore에 .sst/ 추가
```

---

## Phase 3: 스테이징 배포 & 테스트 (Day 3~4)

### 3-1. 스테이징 배포

```bash
# 스테이징 환경 배포 (별도 CloudFormation 스택)
npx sst deploy --stage staging

# 출력 예시:
# ✓ Deployed:
#   CugguWeb: https://d1234567.cloudfront.net
#   CleanupCron: arn:aws:lambda:...
```

### 3-2. 기능 테스트 체크리스트

```
인증:
[ ] 카카오 로그인 성공
[ ] 네이버 로그인 성공
[ ] 세션 유지 확인
[ ] 로그아웃 동작

청첩장:
[ ] 청첩장 생성
[ ] 에디터 열기 & 편집
[ ] 자동 저장 동작
[ ] 미리보기 렌더링
[ ] 청첩장 삭제

공개 뷰:
[ ] /inv/[id] 페이지 렌더링
[ ] 비밀번호 보호 동작
[ ] 조회수 증가
[ ] 카카오톡 공유 (OG 태그)

AI 사진 생성 (v2):
[ ] 참조 사진 업로드 (/api/ai/reference-photos)
[ ] Azure Face API 얼굴 감지 동작
[ ] 단일 생성 (SINGLE 모드)
[ ] 배치 생성 (BATCH 모드 + SSE 스트리밍)
[ ] 크레딧 예약 → 차감 → 환불 흐름
[ ] 크레딧 잔액 & 거래 이력 조회 (/api/ai/credits)
[ ] Job 상태 추적 (/api/ai/jobs/[id])
[ ] 3개 프로바이더 동작 (Replicate, OpenAI, Gemini)
[ ] 앨범 생성/관리/적용
[ ] 레이트 리밋 동작 (Upstash Redis)

AI 테마:
[ ] AI 테마 생성 (Anthropic)
[ ] 테마 적용

RSVP:
[ ] RSVP 폼 제출
[ ] RSVP 목록 조회
[ ] RSVP 통계

갤러리:
[ ] 이미지 업로드 (S3)
[ ] 이미지 표시 (CloudFront)
[ ] 이미지 삭제

Admin:
[ ] AI 모델 설정 관리
[ ] 앱 설정 관리
[ ] 사용자/통계 조회

Cron:
[ ] 수동 트리거 테스트 (Lambda 콘솔에서)
[ ] 만료 청첩장 정리 동작
[ ] S3 배치 삭제 동작

성능:
[ ] Cold start 시간 측정 (첫 요청)
[ ] SSR 페이지 응답 시간
[ ] API 응답 시간
[ ] SSE 스트리밍 안정성 (배치 생성 5장 이상)
[ ] 이미지 로딩 속도 (CloudFront)
```

### 3-3. 성능 기준

| 항목 | 허용 기준 | 비고 |
|---|---|---|
| Cold Start | < 3초 | Provisioned Concurrency로 완화 가능 |
| SSR 페이지 | < 1초 (warm) | CloudFront 캐시 활용 |
| API 응답 | < 500ms (warm) | DB 쿼리 포함 |
| 이미지 로딩 | < 500ms | CloudFront CDN |

### 3-4. 문제 발생 시 대응

| 문제 | 원인 | 해결 |
|---|---|---|
| DB 연결 실패 | VPC/보안그룹 | Lambda → RDS 5432 인바운드 확인 |
| 타임아웃 | Lambda 제한 | SSE 스트리밍은 60초+ 필요, 일반 API는 30초 OK |
| 이미지 업로드 실패 | IAM 권한 | S3 PutObject/DeleteObjects 권한 확인 |
| 세션 유지 안 됨 | NEXTAUTH_URL 불일치 | 스테이징 URL로 설정 |
| Middleware 에러 | OpenNext 호환성 | CloudFront Function 로그 확인 |
| SSE 끊김 | Lambda Response Streaming | OpenNext 설정에서 streaming 활성화 확인 |
| 크레딧 불일치 | DB 커넥션 풀 고갈 | RDS Proxy 커넥션 모니터링, 트랜잭션 격리 수준 확인 |
| 얼굴 감지 실패 | Azure Face API 타임아웃 | 비동기 처리로 구현됨, Lambda 네트워크 확인 |
| 배치 생성 실패 | 동시 Lambda 호출 | Provisioned Concurrency 또는 동시성 제한 설정 |

### 3-5. 체크리스트

```
[ ] 스테이징 배포 성공
[ ] 기능 테스트 전체 통과
[ ] 성능 기준 충족
[ ] 에러 로그 확인 (CloudWatch)
[ ] 문제 발견 시 수정 & 재배포
```

---

## Phase 4: 도메인 & SSL 설정 (Day 5)

### 4-1. Route 53 호스팅 영역

```
도메인: cuggu.com (가정)
호스팅 영역 생성 → NS 레코드를 도메인 등록업체에 설정
```

### 4-2. ACM 인증서

```
SST가 자동으로 처리하지만, 수동 시:
  - 리전: us-east-1 (CloudFront용 필수)
  - 도메인: cuggu.com, *.cuggu.com
  - 검증: DNS 검증 (Route 53 자동)
```

### 4-3. 프로덕션 배포

```bash
# 프로덕션 환경변수 확인 후 배포
npx sst deploy --stage production
```

### 4-4. DNS 전환 (무중단)

```
1. TTL 낮추기 (사전)
   현재 TTL → 60초로 변경 (최소 24시간 전)

2. DNS 전환
   A/CNAME 레코드를 CloudFront 배포로 변경

3. 확인
   curl -I https://cuggu.com
   # → CloudFront 응답 헤더 확인

4. Vercel 유지 (롤백 대비)
   전환 후 48시간 동안 Vercel 프로젝트 유지
   문제 시 DNS만 Vercel로 복구
```

### 4-5. 카카오 OAuth 콜백 URL 업데이트

```
카카오 개발자 콘솔:
  - Redirect URI: https://cuggu.com/api/auth/callback/kakao
  - 기존 Vercel URL도 당분간 유지 (롤백 대비)

네이버 개발자 콘솔:
  - Callback URL: https://cuggu.com/api/auth/callback/naver
```

### 4-6. 체크리스트

```
[ ] Route 53 호스팅 영역 설정
[ ] ACM 인증서 발급 & 검증
[ ] 프로덕션 배포 완료
[ ] DNS TTL 사전 단축 (60초)
[ ] DNS 전환 (CloudFront로)
[ ] HTTPS 접속 확인
[ ] 카카오/네이버 OAuth 콜백 URL 업데이트
[ ] NEXTAUTH_URL 프로덕션 도메인으로 설정
```

---

## Phase 5: 모니터링 & 안정화 (Day 5~7)

### 5-1. CloudWatch 알람 설정

```
Lambda 알람:
  - Error count > 5 (5분간) → 알림
  - Duration > 10초 (평균) → 알림
  - Throttles > 0 → 알림

RDS 알람:
  - CPU > 80% (5분간) → 알림
  - FreeStorageSpace < 2GB → 알림
  - DatabaseConnections > 80 → 알림

CloudFront:
  - 5xx Error Rate > 1% → 알림
  - 4xx Error Rate > 10% → 알림
```

### 5-2. 로그 확인

```bash
# Lambda 로그 확인
aws logs tail /aws/lambda/cuggu-CugguWeb --follow

# 에러만 필터
aws logs filter-log-events \
  --log-group-name /aws/lambda/cuggu-CugguWeb \
  --filter-pattern "ERROR"
```

### 5-3. Cold Start 최적화 (필요 시)

```typescript
// sst.config.ts — Provisioned Concurrency 추가
const site = new sst.aws.Nextjs("CugguWeb", {
  // ...
  server: {
    memory: "1024 MB",
    timeout: "30 seconds",
    // Warm 인스턴스 유지
    provisioned: 1,  // 최소 1개 항상 warm
  },
});
```

### 5-4. 비용 모니터링

```
AWS Cost Explorer 설정:
  - 일일 비용 알림 (Budget: $5/일 초과 시)
  - 서비스별 비용 태그:
    - sst:app: cuggu
    - sst:stage: production
```

### 5-5. 체크리스트

```
[ ] CloudWatch 알람 설정
[ ] 로그 모니터링 확인
[ ] Cold Start 측정 & 최적화
[ ] 비용 알림 설정
[ ] 48시간 안정성 확인
```

---

## Phase 6: 정리 (Day 7+)

### 6-1. Vercel 정리

```
DNS 전환 후 안정 확인 (최소 1주일) 후:
  - Vercel 프로젝트 일시 중지 (삭제는 나중에)
  - Vercel 도메인 설정 제거
```

### 6-2. Supabase 정리

```
RDS 안정 확인 후:
  - Supabase 프로젝트 일시 중지 (Pause)
  - 최종 백업 생성
  - 1개월 후 완전 삭제 검토
```

### 6-3. 환경변수 정리

```
삭제:
  - vercel.json

업데이트:
  - .env.example에서 Vercel 전용 변수 제거
  - CRON_SECRET 제거 (EventBridge는 IAM으로 인증)

추가:
  - SST 관련 설정 문서화
```

### 6-4. 체크리스트

```
[ ] Vercel 프로젝트 일시 중지
[ ] Supabase 프로젝트 일시 중지
[ ] vercel.json 삭제
[ ] .env.example 업데이트
[ ] 팀 문서 업데이트 (배포 방법 등)
```

---

## 롤백 계획

### 즉시 롤백 (DNS 전환 후 48시간 이내)

```
1. DNS를 Vercel로 복구 (60초 TTL이므로 빠름)
2. 카카오/네이버 OAuth 콜백 URL 복구
3. Supabase DB 사용 재개 (데이터 동기화 주의)
```

### 데이터 동기화 (롤백 시)

```
롤백 시 RDS에 쌓인 데이터를 Supabase로 복구해야 함:

1. RDS에서 pg_dump (전환 이후 데이터)
2. Supabase에 pg_restore
3. 충돌 데이터 수동 확인

→ 전환 직후에는 양쪽 DB에 동시 쓰기를 고려할 수도 있지만
  복잡도가 높아 비추천. 빠른 안정 확인이 더 중요.
```

---

## 비용 예측

### 초기 (트래픽 적은 경우)

| 서비스 | 월 비용 (추정) |
|---|---|
| Lambda | $1~5 (요청 수 따라) |
| CloudFront | $1~3 |
| RDS db.t4g.micro | $15 (프리티어 후) |
| RDS Proxy | $10 |
| S3 | 기존과 동일 |
| Upstash Redis | $0 (Free tier) |
| Route 53 | $0.50 |
| **합계** | **$28~34/월** |

### 성장 시 (MAU 1만+)

| 서비스 | 월 비용 (추정) |
|---|---|
| Lambda | $10~30 |
| CloudFront | $5~15 |
| RDS db.t4g.small | $30 |
| RDS Proxy | $15 |
| S3 | $5~10 |
| Upstash Redis | $0~10 |
| Route 53 | $0.50 |
| Provisioned Concurrency | $10~20 |
| **합계** | **$76~131/월** |

---

## 타임라인 요약

```
Day 0     사전 준비
          ├── AWS 계정/IAM 설정
          ├── SST CLI 설치
          └── Supabase 백업

Day 1     DB 마이그레이션
          ├── VPC/네트워크 구성
          ├── RDS + RDS Proxy 생성
          └── 데이터 이전 & 검증

Day 2     SST 프로젝트 설정
          ├── sst.config.ts 작성
          ├── Cron 함수 분리
          └── S3 IAM Role 전환

Day 3~4   스테이징 배포 & 테스트
          ├── 기능 테스트 (전체)
          ├── 성능 측정
          └── 버그 수정

Day 5     프로덕션 전환
          ├── 도메인/SSL 설정
          ├── DNS 전환
          └── OAuth 콜백 업데이트

Day 5~7   모니터링 & 안정화
          ├── CloudWatch 알람
          ├── Cold Start 최적화
          └── 비용 모니터링

Day 7+    정리
          ├── Vercel 일시 중지
          ├── Supabase 일시 중지
          └── 문서 정리
```

---

## 코드 변경 요약

```
신규 파일:
  + sst.config.ts              (인프라 정의)
  + functions/cleanup.ts       (Cron 함수 — EventBridge Lambda)
  + .sst/                      (자동 생성, gitignore)

수정 파일:
  ~ lib/ai/s3.ts               (IAM Role 전환 — credentials 제거)
  ~ lib/ai/env.ts              (AWS_ACCESS_KEY_ID 등 optional로 변경)
  ~ .gitignore                 (.sst/ 추가)
  ~ .env.example               (환경변수 업데이트 — GOOGLE_AI_API_KEY 등)

삭제 파일:
  - vercel.json                (Vercel Cron 설정)

변경 없음 (36개 API 라우트 포함):
  - app/ 전체 (라우트, 페이지, API — SSR/SSE 포함)
  - components/ 전체 (GenerationWizard, BatchGenerationView 등)
  - db/schema.ts (Drizzle 스키마 — 15개 테이블, 16개 enum)
  - lib/ai/providers/ (Replicate, OpenAI, Gemini 프로바이더)
  - lib/ai/credits.ts (크레딧 예약/차감/환불 로직)
  - hooks/ (useAIGeneration 등)
  - stores/, schemas/, types/
```

### 환경변수 전체 목록 (2026-02-12 기준)

```
필수:
  DATABASE_URL              — RDS Proxy 엔드포인트
  NEXTAUTH_URL              — https://cuggu.com
  NEXTAUTH_SECRET           — JWT 시크릿
  KAKAO_CLIENT_ID           — 카카오 OAuth
  KAKAO_CLIENT_SECRET
  NAVER_CLIENT_ID           — 네이버 OAuth
  NAVER_CLIENT_SECRET
  AWS_REGION                — ap-northeast-2
  S3_BUCKET_NAME            — cuggu-images
  UPSTASH_REDIS_REST_URL    — 레이트 리밋
  UPSTASH_REDIS_REST_TOKEN
  REPLICATE_API_TOKEN       — AI 생성 (주력)
  AZURE_FACE_API_KEY        — 얼굴 감지
  AZURE_FACE_ENDPOINT
  ENCRYPTION_KEY            — RSVP 개인정보 암호화

선택 (있으면 해당 프로바이더 활성화):
  OPENAI_API_KEY            — GPT Image, DALL-E 3
  GOOGLE_AI_API_KEY         — Gemini Flash Image
  ANTHROPIC_API_KEY         — AI 테마 생성
  CLOUDFRONT_DOMAIN         — CDN 도메인 (없으면 S3 직접 URL)

Lambda에서 불필요 (IAM Role 대체):
  AWS_ACCESS_KEY_ID         — 삭제
  AWS_SECRET_ACCESS_KEY     — 삭제

Vercel 전용 (삭제):
  CRON_SECRET               — EventBridge는 IAM 인증

클라이언트 (NEXT_PUBLIC_):
  NEXT_PUBLIC_KAKAO_MAP_API_KEY
```
