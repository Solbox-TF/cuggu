# Cuggu AWS + R2 하이브리드 마이그레이션 실행 계획

> 최종 업데이트: 2026-02-24
> 전략: 개발망 Vercel 유지 / 상용 AWS(컴퓨팅/DB) + Cloudflare R2(이미지)

---

## 개요

```
현재 (AS-IS)                          목표 (TO-BE)
──────────────────                    ──────────────────
Vercel Functions (36 API)  →  [상용] Lambda via OpenNext
                              [개발] Vercel 유지
Vercel CDN                 →  [상용] CloudFront (앱)
                              [개발] Vercel CDN 유지
Supabase PostgreSQL (15T)  →  [상용] RDS PostgreSQL + RDS Proxy
                              [개발] Supabase 유지
AWS S3 + CloudFront (IMG)  →  [상용] Cloudflare R2 + Cloudflare CDN
                              [개발] R2 공용 또는 S3 유지
Upstash Redis              →  Upstash Redis (유지, 환경별 인스턴스)
Vercel Cron                →  [상용] EventBridge + Lambda
                              [개발] Vercel Cron 유지
vercel.json                →  [상용] sst.config.ts (IaC)
                              [개발] vercel.json 유지
SSE Streaming (/api/ai/)   →  [상용] Lambda Response Streaming
                              [개발] Vercel Streaming (기존)
```

**예상 총 소요**: 7~9일 (여유 포함)
**예상 다운타임**: 0 (DNS 전환 방식)

### 환경 분리 전략

```
┌─────────────────────────────────────────────────────┐
│  develop branch → Vercel (자동 배포)                  │
│    DB: Supabase                                      │
│    이미지: R2 (dev 버킷) 또는 S3 유지                  │
│    Redis: Upstash (dev 인스턴스)                      │
│    용도: 개발, PR 프리뷰, QA                          │
├─────────────────────────────────────────────────────┤
│  main branch → AWS SST (수동/CI 배포)                 │
│    DB: RDS PostgreSQL + RDS Proxy                    │
│    이미지: Cloudflare R2 + Cloudflare CDN             │
│    Redis: Upstash (prod 인스턴스)                     │
│    용도: 프로덕션                                     │
└─────────────────────────────────────────────────────┘
```

### 2026-02-12 이후 변경사항

```
보안: 인증 로직 proxy.ts 통합, middleware.ts 삭제
보안: 14건 보안 이슈 수정 (RSVP 암호화, 입력 검증, 헤더 보안 등)
DB:  15 테이블 유지 (변경 없음)
API: 36+ 라우트 (변경 확인 필요)
AI:  멀티 프로바이더 유지 (Replicate + OpenAI + Gemini)
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
- SST가 CloudFormation, Lambda, CloudFront, Route53 등을 생성하므로 넓은 권한 필요
- 프로덕션에서는 전용 IAM 사용자 생성 권장

### 0-2. Cloudflare 계정 & Wrangler 설정

```bash
# Wrangler CLI 설치
pnpm add -g wrangler

# Cloudflare 인증
wrangler login
# → 브라우저에서 OAuth 인증

# 계정 확인
wrangler whoami
```

**Cloudflare에서 준비할 것**:
- R2 구독 활성화 (Dashboard → R2 → Get Started)
- API 토큰 생성 (R2 읽기/쓰기 권한) — Lambda에서 R2 접근용
- 커스텀 도메인용 DNS 설정 준비 (img.cuggu.com)

### 0-3. SST CLI 설치

```bash
# SST v3 설치 (Ion)
curl -fsSL https://sst.dev/install | bash

# 또는 npx로 실행 (설치 없이)
npx sst version
```

### 0-4. 현재 상태 백업

```bash
# Supabase DB 전체 백업
pg_dump --no-owner --no-acl \
  -h db.xxx.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f cuggu_backup_$(date +%Y%m%d).dump

# S3 이미지 목록 기록 (R2 마이그레이션 검증용)
aws s3 ls s3://cuggu-images --recursive --summarize > s3_inventory.txt

# 현재 환경변수 목록 기록
vercel env ls > vercel_env_backup.txt

# Git 태그로 현재 상태 마킹
git tag pre-aws-migration
git push origin pre-aws-migration
```

### 0-5. 체크리스트

```
[ ] AWS 계정 생성 & IAM 설정
[ ] AWS CLI 설치 & 인증
[ ] Cloudflare 계정 생성 & R2 구독 활성화
[ ] Wrangler CLI 설치 & 인증
[ ] Cloudflare API 토큰 생성 (R2 읽기/쓰기)
[ ] SST CLI 설치
[ ] Supabase DB 백업 완료
[ ] S3 이미지 인벤토리 기록
[ ] 환경변수 목록 정리
[ ] Git 태그 생성 (pre-aws-migration)
[ ] 도메인 현재 DNS 설정 기록 (TTL 등)
```

---

## Phase 1: RDS PostgreSQL 설정 (Day 1)

> 상용 DB 마이그레이션. 개발 DB는 Supabase 유지.

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
[ ] Drizzle 마이그레이션 상태 확인
```

---

## Phase 2: Cloudflare R2 설정 & 이미지 마이그레이션 (Day 1~2)

> Phase 1과 병렬 진행 가능.

### 2-1. R2 버킷 생성

```bash
# R2 버킷 생성
wrangler r2 bucket create cuggu-images

# 확인
wrangler r2 bucket list
```

### 2-2. 커스텀 도메인 설정 (img.cuggu.com)

Cloudflare Dashboard에서:

```
1. 도메인을 Cloudflare DNS에 추가 (cuggu.com)
   - 또는 img.cuggu.com 서브도메인만 Cloudflare로 위임

2. R2 → Settings → Custom Domains
   - 도메인 추가: img.cuggu.com
   - Cloudflare가 자동으로 SSL 발급

3. DNS 레코드 자동 생성 확인
   img.cuggu.com → CNAME → xxx.r2.dev (Cloudflare 관리)
```

### 2-3. CORS 설정

```bash
# R2 CORS 정책 설정
wrangler r2 bucket cors put cuggu-images --rules '[
  {
    "allowedOrigins": [
      "https://cuggu.com",
      "https://*.vercel.app"
    ],
    "allowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]'
```

### 2-4. R2 API 토큰 생성

Cloudflare Dashboard → R2 → Manage R2 API Tokens:

```
토큰명: cuggu-lambda-r2
권한: Object Read & Write
버킷: cuggu-images (특정 버킷만)

→ 발급되는 값:
  - Account ID (R2 엔드포인트용)
  - Access Key ID
  - Secret Access Key
  - Endpoint: https://{account-id}.r2.cloudflarestorage.com
```

### 2-5. S3 → R2 데이터 마이그레이션

**방법 A: Sippy (Cloudflare 자동 마이그레이션, 추천)**

```
R2 Dashboard → cuggu-images → Settings → Sippy
  - Source: Amazon S3
  - Bucket: cuggu-images
  - Region: ap-northeast-2
  - Credentials: AWS Access Key/Secret

Sippy 동작:
  1. R2에 없는 객체 요청 시 → S3에서 자동 복사
  2. 점진적으로 모든 객체가 R2로 이동
  3. 마이그레이션 완료 후 Sippy 비활성화
```

**방법 B: rclone 일괄 복사**

```bash
# rclone 설치
brew install rclone

# S3 리모트 설정
rclone config
  # name: s3-cuggu
  # type: s3
  # provider: AWS
  # region: ap-northeast-2
  # access_key_id: xxx
  # secret_access_key: xxx

# R2 리모트 설정
rclone config
  # name: r2-cuggu
  # type: s3
  # provider: Cloudflare
  # endpoint: https://{account-id}.r2.cloudflarestorage.com
  # access_key_id: xxx (R2 토큰)
  # secret_access_key: xxx (R2 토큰)

# 동기화 (드라이런 먼저)
rclone sync s3-cuggu:cuggu-images r2-cuggu:cuggu-images --dry-run --progress

# 실제 복사
rclone sync s3-cuggu:cuggu-images r2-cuggu:cuggu-images --progress --transfers 32
```

### 2-6. 이미지 검증

```bash
# S3 객체 수
aws s3 ls s3://cuggu-images --recursive --summarize | tail -2

# R2 객체 수
wrangler r2 object list cuggu-images --prefix "" | wc -l

# 샘플 이미지 접근 테스트
curl -I https://img.cuggu.com/gallery/test-image.webp
# → 200 OK, cf-r2-bucket 헤더 확인
```

### 2-7. 체크리스트

```
[ ] R2 버킷 생성 (cuggu-images)
[ ] 커스텀 도메인 설정 (img.cuggu.com)
[ ] SSL 인증서 자동 발급 확인
[ ] CORS 설정 (cuggu.com, *.vercel.app)
[ ] R2 API 토큰 생성 (Access Key/Secret)
[ ] S3 → R2 데이터 복사 완료
[ ] 객체 수 일치 검증
[ ] 샘플 이미지 HTTP 접근 테스트
[ ] Cloudflare CDN 캐시 동작 확인
```

---

## Phase 3: SST 프로젝트 설정 & 코드 변경 (Day 2~3)

### 3-1. SST 초기화

```bash
# 프로젝트 루트에서
npx sst init
```

### 3-2. sst.config.ts 작성

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
    // ── Next.js 앱 (Lambda + CloudFront) ──
    const site = new sst.aws.Nextjs("CugguWeb", {
      // 도메인 설정 (앱 전용, 이미지는 Cloudflare)
      domain: {
        name: "cuggu.com",
        dns: sst.aws.dns(),  // Route 53
      },

      // 환경변수 (하이브리드 기준)
      environment: {
        // DB — RDS
        DATABASE_URL: "postgresql://...@cuggu-db-proxy.xxx.rds.amazonaws.com:5432/cuggu",

        // Auth
        NEXTAUTH_URL: "https://cuggu.com",
        NEXTAUTH_SECRET: "...",
        KAKAO_CLIENT_ID: "...",
        KAKAO_CLIENT_SECRET: "...",

        // 이미지 — Cloudflare R2 (S3 호환 API)
        R2_ENDPOINT: "https://{account-id}.r2.cloudflarestorage.com",
        R2_ACCESS_KEY_ID: "...",
        R2_SECRET_ACCESS_KEY: "...",
        R2_BUCKET_NAME: "cuggu-images",
        IMAGE_DOMAIN: "img.cuggu.com",
        NEXT_PUBLIC_IMAGE_DOMAIN: "img.cuggu.com",

        // Redis (Upstash 유지 — prod 인스턴스)
        UPSTASH_REDIS_REST_URL: "...",
        UPSTASH_REDIS_REST_TOKEN: "...",

        // AI — 3개 프로바이더
        REPLICATE_API_TOKEN: "...",
        OPENAI_API_KEY: "...",
        GOOGLE_AI_API_KEY: "...",
        ANTHROPIC_API_KEY: "...",

        // Azure Face API
        AZURE_FACE_API_KEY: "...",
        AZURE_FACE_ENDPOINT: "...",

        // Encryption
        ENCRYPTION_KEY: "...",

        // Kakao Map
        NEXT_PUBLIC_KAKAO_MAP_API_KEY: "...",
      },

      // Lambda 설정
      server: {
        memory: "1024 MB",
        timeout: "60 seconds",  // SSE 스트리밍 (배치 생성)
      },

      // VPC 연결 (RDS 접근용)
      vpc: {
        // SST가 자동 생성하거나 기존 VPC 참조
      },
    });

    // ── Cron: 만료 청첩장 정리 ──
    new sst.aws.Cron("CleanupCron", {
      schedule: "cron(0 18 * * ? *)",  // 매일 18:00 UTC = 03:00 KST
      function: {
        handler: "functions/cleanup.handler",
        timeout: "5 minutes",
        environment: {
          DATABASE_URL: "postgresql://...",
          R2_ENDPOINT: "...",
          R2_ACCESS_KEY_ID: "...",
          R2_SECRET_ACCESS_KEY: "...",
          R2_BUCKET_NAME: "cuggu-images",
        },
      },
    });

    return { url: site.url };
  },
});
```

### 3-3. S3Client → R2 전환 (코드 변경)

R2는 S3 호환 API이므로 `@aws-sdk/client-s3` 코드를 거의 그대로 사용.

```typescript
// ── 변경 전: lib/ai/s3.ts ──
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.S3_BUCKET_NAME!;
const IMAGE_BASE_URL = `https://${process.env.CLOUDFRONT_DOMAIN}`;

// ── 변경 후: lib/storage/client.ts ──
const s3 = new S3Client({
  region: "auto",  // R2는 "auto"
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;
const IMAGE_BASE_URL = `https://${process.env.IMAGE_DOMAIN}`;

// PutObjectCommand, GetObjectCommand, DeleteObjectsCommand
// → 전부 그대로 사용 (S3 호환)
```

**환경변수 분기 (개발/상용 겸용)**:

```typescript
// lib/storage/client.ts — 환경에 따라 S3 또는 R2 사용
const isR2 = !!process.env.R2_ENDPOINT;

const s3 = new S3Client(
  isR2
    ? {
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      }
    : {
        region: process.env.AWS_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      }
);

const BUCKET = process.env.R2_BUCKET_NAME || process.env.S3_BUCKET_NAME!;
const IMAGE_BASE_URL = `https://${process.env.IMAGE_DOMAIN || process.env.CLOUDFRONT_DOMAIN}`;
```

이렇게 하면:
- **상용 (AWS Lambda)**: `R2_ENDPOINT` 있음 → R2 사용
- **개발 (Vercel)**: `R2_ENDPOINT` 없음 → 기존 S3 사용 (또는 R2 dev 버킷)

### 3-4. Next.js Image 도메인 설정

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_IMAGE_DOMAIN || 'xxx.cloudfront.net',
      },
      // 개발 환경 호환
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
    ],
  },
};
```

### 3-5. DB URL 이미지 도메인 일괄 업데이트

기존 DB에 저장된 이미지 URL의 도메인을 변경:

```sql
-- 상용 DB (RDS)에서 실행
-- 1. ai_generations 테이블
UPDATE ai_generations
SET image_url = REPLACE(image_url, 'xxx.cloudfront.net', 'img.cuggu.com')
WHERE image_url LIKE '%xxx.cloudfront.net%';

-- 2. invitations 테이블 (갤러리 이미지 URL이 JSONB에 포함)
-- → extendedData 내부의 이미지 URL도 변경 필요
-- → 앱 코드에서 IMAGE_BASE_URL을 동적으로 사용하면 불필요

-- 3. ai_albums 테이블 (images JSONB)
-- → 동일하게 동적 처리 권장
```

**권장**: DB에 전체 URL 대신 경로만 저장하고, `IMAGE_BASE_URL`을 앱에서 조합하도록 리팩터링. 이미 이렇게 되어 있으면 DB 업데이트 불필요.

### 3-6. Cron 함수 분리

```
functions/
└── cleanup.ts    ← Vercel Cron → EventBridge Lambda로 이전
```

```typescript
// functions/cleanup.ts
// R2용 S3Client 사용 (S3 호환)
export async function handler() {
  // 1. 만료 청첩장 EXPIRED + 30일 → DELETED 처리
  // 2. DELETED + 30일 → 하드 삭제 (DB 레코드)
  // 3. R2 이미지 배치 삭제 (DeleteObjectsCommand, S3 호환)
  // 4. 관련 AI 생성 데이터 정리
}
```

### 3-7. .gitignore 업데이트

```
# SST
.sst/
```

### 3-8. 체크리스트

```
[ ] sst init 실행
[ ] sst.config.ts 작성 (R2 환경변수 포함)
[ ] lib/storage/client.ts 생성 (S3/R2 겸용 클라이언트)
[ ] 기존 S3 import를 새 storage client로 교체
[ ] next.config.ts 이미지 도메인 업데이트
[ ] Cron 함수 분리 (functions/cleanup.ts)
[ ] .gitignore에 .sst/ 추가
[ ] .env.example 업데이트
[ ] 개발 환경에서 기존 S3로 동작 확인 (회귀 테스트)
```

---

## Phase 4: 스테이징 배포 & 테스트 (Day 4~5)

### 4-1. 스테이징 배포

```bash
# 스테이징 환경 배포 (별도 CloudFormation 스택)
npx sst deploy --stage staging

# 출력 예시:
# ✓ Deployed:
#   CugguWeb: https://d1234567.cloudfront.net
#   CleanupCron: arn:aws:lambda:...
```

### 4-2. 기능 테스트 체크리스트

```
인증:
[ ] 카카오 로그인 성공
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

이미지 (R2 + Cloudflare CDN):
[ ] 갤러리 이미지 업로드 → R2 저장 확인
[ ] 이미지 URL이 img.cuggu.com 도메인인지 확인
[ ] Cloudflare CDN 캐시 HIT 확인 (cf-cache-status 헤더)
[ ] 이미지 삭제 → R2에서 삭제 확인
[ ] OG 이미지 생성 & 서빙
[ ] 엔딩 사진 업로드 & 서빙

AI 사진 생성:
[ ] 참조 사진 업로드 → R2 저장 + Azure Face API
[ ] 단일 생성 (SINGLE 모드) → R2 저장
[ ] 배치 생성 (BATCH 모드 + SSE 스트리밍) → R2 저장
[ ] 크레딧 예약 → 차감 → 환불 흐름
[ ] 3개 프로바이더 동작 (Replicate, OpenAI, Gemini)
[ ] 앨범 생성/관리/적용 → 이미지 R2에서 로딩
[ ] 레이트 리밋 동작 (Upstash Redis)

AI 테마:
[ ] AI 테마 생성 (Anthropic)
[ ] 테마 적용

RSVP:
[ ] RSVP 폼 제출
[ ] RSVP 목록 조회 & 통계

Admin:
[ ] AI 모델 설정 관리
[ ] 앱 설정 관리
[ ] 사용자/통계 조회

Cron:
[ ] Lambda 콘솔에서 수동 트리거
[ ] 만료 청첩장 정리 동작
[ ] R2 배치 삭제 동작 (DeleteObjectsCommand)

성능:
[ ] Cold start 시간 측정 (첫 요청)
[ ] SSR 페이지 응답 시간 (warm)
[ ] API 응답 시간 (warm)
[ ] SSE 스트리밍 안정성 (배치 생성 5장 이상)
[ ] R2 이미지 로딩 속도 (Cloudflare CDN)
[ ] R2 이미지 업로드 속도 (Lambda → R2)
```

### 4-3. 성능 기준

| 항목 | 허용 기준 | 비고 |
|---|---|---|
| Cold Start | < 3초 | Provisioned Concurrency로 완화 가능 |
| SSR 페이지 | < 1초 (warm) | CloudFront 캐시 활용 |
| API 응답 | < 500ms (warm) | RDS Proxy 경유 |
| R2 이미지 업로드 | < 2초 | Lambda(서울) → R2(자동 리전) |
| R2 이미지 로딩 | < 300ms | Cloudflare CDN 글로벌 캐시 |

### 4-4. 문제 발생 시 대응

| 문제 | 원인 | 해결 |
|---|---|---|
| DB 연결 실패 | VPC/보안그룹 | Lambda → RDS 5432 인바운드 확인 |
| R2 업로드 실패 | 인증/엔드포인트 | R2 API 토큰 & endpoint URL 확인 |
| R2 이미지 403 | CORS/퍼블릭 설정 | 커스텀 도메인 + CORS 재확인 |
| R2 업로드 느림 | 리전 거리 | R2 자동 리전 → 확인 (보통 가까운 곳 선택) |
| 타임아웃 | Lambda 제한 | SSE: 60초+, 일반 API: 30초 |
| 세션 유지 안 됨 | NEXTAUTH_URL 불일치 | 스테이징 URL로 설정 |
| SSE 끊김 | Lambda Response Streaming | OpenNext streaming 설정 확인 |
| 크레딧 불일치 | DB 커넥션 풀 | RDS Proxy 모니터링 |
| Next.js Image 에러 | 도메인 미등록 | next.config.ts remotePatterns 확인 |

### 4-5. 체크리스트

```
[ ] 스테이징 배포 성공
[ ] 기능 테스트 전체 통과
[ ] R2 이미지 업로드/서빙 정상
[ ] 성능 기준 충족
[ ] 에러 로그 확인 (CloudWatch + Cloudflare Analytics)
[ ] 문제 발견 시 수정 & 재배포
```

---

## Phase 5: 도메인 & SSL & 프로덕션 전환 (Day 6)

### 5-1. DNS 설계

```
도메인 분리:
  cuggu.com        → Route 53 → CloudFront (AWS)     ← 앱
  img.cuggu.com    → Cloudflare DNS → R2              ← 이미지

방법 A (권장): cuggu.com 자체는 Route 53에서 관리
  - cuggu.com / www  → CloudFront (SST 자동)
  - img              → Cloudflare에 CNAME 위임

방법 B: Cloudflare DNS에서 전체 관리
  - cuggu.com / www  → CNAME → CloudFront 배포 (Proxy OFF)
  - img              → R2 커스텀 도메인 (Proxy ON)
```

### 5-2. ACM 인증서 (AWS)

```
SST가 자동 처리. 수동 시:
  - 리전: us-east-1 (CloudFront용 필수)
  - 도메인: cuggu.com, www.cuggu.com
  - 검증: DNS 검증
  - img.cuggu.com은 Cloudflare에서 SSL 자동 관리 → ACM 불필요
```

### 5-3. 프로덕션 배포

```bash
# 프로덕션 환경변수 최종 확인 후 배포
npx sst deploy --stage production
```

### 5-4. DNS 전환 (무중단)

```
1. TTL 낮추기 (사전, 최소 24시간 전)
   현재 TTL → 60초로 변경

2. img.cuggu.com DNS 전환
   → Cloudflare R2 커스텀 도메인 (Phase 2에서 이미 완료)

3. cuggu.com DNS 전환
   → A/CNAME 레코드를 CloudFront 배포로 변경

4. 확인
   curl -I https://cuggu.com
   # → CloudFront 응답 헤더 (x-amz-cf-id)
   curl -I https://img.cuggu.com/gallery/test.webp
   # → Cloudflare 응답 헤더 (cf-cache-status)

5. Vercel 유지 (개발 환경으로 계속 사용)
   - 프로덕션 도메인만 해제
   - develop 브랜치 자동 배포는 계속
```

### 5-5. OAuth 콜백 URL 업데이트

```
카카오 개발자 콘솔:
  - Redirect URI 추가: https://cuggu.com/api/auth/callback/kakao
  - 기존 Vercel URL 유지 (개발 환경용)

네이버 개발자 콘솔:
  - Callback URL 추가: https://cuggu.com/api/auth/callback/naver
  - 기존 Vercel URL 유지
```

### 5-6. 체크리스트

```
[ ] DNS 설계 확정 (Route 53 vs Cloudflare 전체 관리)
[ ] ACM 인증서 발급 확인 (SST 자동)
[ ] 프로덕션 배포 완료
[ ] DNS TTL 사전 단축 (60초)
[ ] img.cuggu.com → R2 연결 확인
[ ] cuggu.com → CloudFront 연결 확인
[ ] HTTPS 접속 확인 (두 도메인 모두)
[ ] 카카오/네이버 OAuth 콜백 URL 업데이트
[ ] NEXTAUTH_URL=https://cuggu.com 확인
```

---

## Phase 6: 모니터링 & 안정화 (Day 6~8)

### 6-1. AWS CloudWatch 알람

```
Lambda:
  - Error count > 5 (5분) → 알림
  - Duration > 10초 (평균) → 알림
  - Throttles > 0 → 알림

RDS:
  - CPU > 80% (5분) → 알림
  - FreeStorageSpace < 2GB → 알림
  - DatabaseConnections > 80 → 알림

CloudFront (앱):
  - 5xx Error Rate > 1% → 알림
  - 4xx Error Rate > 10% → 알림
```

### 6-2. Cloudflare Analytics (이미지)

```
Cloudflare Dashboard → Analytics:
  - R2 요청 수 / 대역폭
  - CDN 캐시 히트율 (목표: 80%+)
  - 에러율

R2 → Metrics:
  - 저장 용량 추이
  - Class A/B 작업 수 (비용 예측)
```

### 6-3. 로그 확인

```bash
# Lambda 로그
aws logs tail /aws/lambda/cuggu-CugguWeb --follow

# 에러만 필터
aws logs filter-log-events \
  --log-group-name /aws/lambda/cuggu-CugguWeb \
  --filter-pattern "ERROR"

# R2 에러는 Cloudflare Dashboard에서 확인
```

### 6-4. Cold Start 최적화 (필요 시)

```typescript
// sst.config.ts — Provisioned Concurrency
server: {
  memory: "1024 MB",
  timeout: "60 seconds",
  provisioned: 1,  // 최소 1개 warm 유지 ($10~20/월 추가)
},
```

### 6-5. 비용 모니터링

```
AWS Cost Explorer:
  - 일일 비용 알림 (Budget: $3/일 초과 시)
  - 태그: sst:app=cuggu, sst:stage=production

Cloudflare R2:
  - 무료 티어: 10GB 스토리지, 1000만 Class A(쓰기), 1000만 Class B(읽기)/월
  - 초과 시: 스토리지 $0.015/GB, Class A $4.50/100만, Class B $0.36/100만
  - 이그레스: 항상 $0
```

### 6-6. 체크리스트

```
[ ] CloudWatch 알람 설정 (Lambda, RDS, CloudFront)
[ ] Cloudflare Analytics 확인 (R2, CDN)
[ ] 로그 모니터링 정상
[ ] Cold Start 측정 & 필요 시 Provisioned Concurrency
[ ] 비용 알림 설정 (AWS + Cloudflare)
[ ] 48시간 안정성 확인
```

---

## Phase 7: 정리 & 개발환경 안정화 (Day 8+)

### 7-1. Vercel 설정 (개발 전용으로 전환)

```
Vercel 프로젝트:
  - 프로덕션 도메인 해제 (cuggu.com → 제거)
  - develop 브랜치 → 자동 배포 유지
  - PR 프리뷰 배포 유지
  - 환경변수: Supabase DB + S3 (또는 R2 dev 버킷) 유지
```

### 7-2. 개발/상용 환경변수 정리

```
개발 (Vercel .env):
  DATABASE_URL          → Supabase (유지)
  AWS_ACCESS_KEY_ID     → 기존 S3용 (유지) 또는 R2 dev 버킷
  AWS_SECRET_ACCESS_KEY → 기존 S3용 (유지) 또는 R2 dev 버킷
  S3_BUCKET_NAME        → cuggu-images-dev
  CLOUDFRONT_DOMAIN     → xxx.cloudfront.net (기존)
  NEXTAUTH_URL          → https://cuggu-dev.vercel.app

상용 (SST 환경변수):
  DATABASE_URL          → RDS Proxy 엔드포인트
  R2_ENDPOINT           → Cloudflare R2
  R2_ACCESS_KEY_ID      → R2 토큰
  R2_SECRET_ACCESS_KEY  → R2 토큰
  R2_BUCKET_NAME        → cuggu-images
  IMAGE_DOMAIN          → img.cuggu.com
  NEXTAUTH_URL          → https://cuggu.com
```

### 7-3. Supabase (개발 DB 유지)

```
Supabase 프로젝트:
  - 삭제 금지 → 개발 DB로 계속 사용
  - Drizzle 마이그레이션은 양쪽에 적용:
    1. 개발: Supabase에 `pnpm db:push`
    2. 상용: RDS에 `pnpm db:push` (DATABASE_URL 변경 후)
```

### 7-4. S3 정리

```
S3 → R2 마이그레이션 완료 확인 (최소 2주 후):
  - Sippy 사용 시: 비활성화
  - S3 버킷 비우기 또는 Lifecycle Rule로 자동 삭제
  - CloudFront 이미지 배포 삭제
  - S3 버킷은 당분간 유지 (롤백 대비)
  - 1개월 후 완전 삭제 검토
```

### 7-5. 코드 정리

```
삭제 가능:
  - vercel.json의 cron 설정 → 개발 환경에서 불필요하면 제거
    (단, 개발 환경 Cron이 필요하면 유지)

업데이트:
  - .env.example → 하이브리드 환경변수 반영
  - README → 배포 방법 업데이트 (개발: Vercel, 상용: SST)

유지:
  - vercel.json (개발 환경 설정)
  - 기존 S3 코드 (lib/storage/client.ts에서 분기 처리)
```

### 7-6. 체크리스트

```
[ ] Vercel 프로덕션 도메인 해제
[ ] Vercel 개발 환경 동작 확인
[ ] 개발/상용 환경변수 정리 완료
[ ] Supabase 개발 DB 유지 확인
[ ] S3 Sippy 비활성화 (해당 시)
[ ] .env.example 업데이트
[ ] 개발 환경에서 전체 기능 동작 확인
```

---

## 롤백 계획

### 즉시 롤백 — 앱 (DNS 전환 후 48시간 이내)

```
1. cuggu.com DNS를 Vercel로 복구 (60초 TTL이므로 빠름)
2. 카카오/네이버 OAuth 콜백 URL 복구
3. Vercel이 Supabase를 바라보고 있으므로 즉시 동작
4. RDS에 쌓인 데이터 → Supabase로 동기화 필요
```

### 즉시 롤백 — 이미지 (R2 문제 시)

```
1. lib/storage/client.ts에서 R2_ENDPOINT 환경변수 제거
   → 자동으로 S3 fallback
2. IMAGE_DOMAIN을 CloudFront 도메인으로 복구
3. S3 데이터가 살아있으므로 즉시 동작
```

### 데이터 동기화 (롤백 시)

```
앱 롤백:
  1. RDS에서 pg_dump (전환 이후 데이터)
  2. Supabase에 pg_restore
  3. 충돌 데이터 수동 확인

이미지 롤백:
  1. R2 → S3 역방향 동기화 (rclone)
  2. 또는 Sippy가 살아있으면 자동 fallback
```

---

## 비용 예측 (하이브리드)

### 초기 (트래픽 적은 경우)

| 서비스 | 월 비용 (추정) | 비고 |
|---|---|---|
| Lambda | $1~5 | 요청 수 따라 |
| CloudFront (앱) | $1~3 | 앱 트래픽만 |
| RDS db.t4g.micro | $15 | 프리티어 12개월 후 |
| RDS Proxy | $10 | |
| **R2 스토리지** | **$0~1** | **10GB 무료, 이후 $0.015/GB** |
| **R2 이그레스** | **$0** | **항상 무료** |
| **Cloudflare CDN** | **$0** | **기본 포함** |
| Upstash Redis | $0 | Free tier |
| Route 53 | $0.50 | |
| Vercel (개발) | $0 | Free/Hobby |
| **합계** | **$28~35/월** | |

### 성장 시 (MAU 1만+)

| 서비스 | 월 비용 (추정) | 비고 |
|---|---|---|
| Lambda | $10~30 | |
| CloudFront (앱) | $3~10 | 앱 트래픽만 (이미지 제외) |
| RDS db.t4g.small | $30 | |
| RDS Proxy | $15 | |
| **R2 스토리지 (50GB)** | **$0.60** | **$0.015/GB × (50-10)** |
| **R2 이그레스 (100GB)** | **$0** | **항상 무료** |
| **Cloudflare CDN** | **$0** | **기본 포함** |
| Upstash Redis | $0~10 | |
| Route 53 | $0.50 | |
| Provisioned Concurrency | $10~20 | 선택 |
| **합계** | **$69~116/월** | |

### 순수 AWS 대비 절감 효과

| 항목 | 순수 AWS | 하이브리드 | 절감 |
|---|---|---|---|
| 초기 | $35~70/월 | $28~35/월 | **-$7~35** |
| 성장 (MAU 1만) | $76~131/월 | $69~116/월 | **-$7~15** |
| 이미지 트래픽 비용 | **증가에 비례** | **항상 $0** | **스케일할수록 유리** |

---

## 타임라인 요약

```
Day 0       사전 준비
            ├── AWS 계정/IAM 설정
            ├── Cloudflare 계정/R2 구독/Wrangler
            ├── SST CLI 설치
            └── Supabase/S3 백업

Day 1       DB + R2 셋업 (병렬)
            ├── [AWS] VPC/RDS/RDS Proxy 생성 & 데이터 이전
            └── [CF]  R2 버킷/도메인/CORS 설정 & S3→R2 복사

Day 2       R2 검증 + SST 설정
            ├── R2 이미지 검증
            ├── sst.config.ts 작성
            └── S3→R2 코드 전환 (lib/storage/client.ts)

Day 3       SST + 코드 변경 완료
            ├── Cron 함수 분리
            ├── next.config.ts 업데이트
            └── 개발 환경 회귀 테스트

Day 4~5     스테이징 배포 & 테스트
            ├── 기능 테스트 (전체)
            ├── R2 이미지 업로드/서빙 테스트
            ├── 성능 측정
            └── 버그 수정

Day 6       프로덕션 전환
            ├── 도메인/SSL 설정
            ├── DNS 전환 (cuggu.com → CF, img.cuggu.com → R2)
            └── OAuth 콜백 업데이트

Day 6~8     모니터링 & 안정화
            ├── CloudWatch 알람 (AWS)
            ├── Cloudflare Analytics (R2/CDN)
            ├── Cold Start 최적화
            └── 비용 모니터링

Day 8+      정리
            ├── Vercel → 개발 전용 전환
            ├── S3 정리 (2주+ 후)
            └── 문서/환경변수 정리
```

---

## 코드 변경 요약

```
신규 파일:
  + sst.config.ts                  (AWS 인프라 정의)
  + lib/storage/client.ts          (S3/R2 겸용 스토리지 클라이언트)
  + functions/cleanup.ts           (Cron — EventBridge Lambda)

수정 파일:
  ~ lib/ai/s3.ts                   (→ lib/storage/client.ts import로 교체)
  ~ next.config.ts                 (이미지 도메인 추가)
  ~ .gitignore                     (.sst/ 추가)
  ~ .env.example                   (R2 환경변수 추가)

유지 (개발 환경 호환):
  ~ vercel.json                    (개발 환경용 유지)

변경 없음:
  - app/ 전체 (36+ API Routes, SSR, SSE)
  - components/ 전체
  - db/schema.ts (15 tables, 16 enums)
  - lib/ai/providers/ (Replicate, OpenAI, Gemini)
  - lib/ai/credits.ts (크레딧 로직)
  - hooks/, stores/, schemas/, types/
```

### 환경변수 전체 목록 (하이브리드 기준)

```
상용 전용 (SST):
  DATABASE_URL              — RDS Proxy 엔드포인트
  R2_ENDPOINT               — https://{account-id}.r2.cloudflarestorage.com
  R2_ACCESS_KEY_ID          — Cloudflare R2 API 토큰
  R2_SECRET_ACCESS_KEY      — Cloudflare R2 API 시크릿
  R2_BUCKET_NAME            — cuggu-images
  IMAGE_DOMAIN              — img.cuggu.com
  NEXT_PUBLIC_IMAGE_DOMAIN  — img.cuggu.com

개발 전용 (Vercel):
  DATABASE_URL              — Supabase 연결 문자열
  AWS_ACCESS_KEY_ID         — S3용 (기존)
  AWS_SECRET_ACCESS_KEY     — S3용 (기존)
  S3_BUCKET_NAME            — cuggu-images (기존 S3)
  CLOUDFRONT_DOMAIN         — xxx.cloudfront.net (기존)

공통:
  NEXTAUTH_URL              — 환경별 URL
  NEXTAUTH_SECRET           — JWT 시크릿
  KAKAO_CLIENT_ID           — 카카오 OAuth
  KAKAO_CLIENT_SECRET
  UPSTASH_REDIS_REST_URL    — 환경별 인스턴스
  UPSTASH_REDIS_REST_TOKEN
  REPLICATE_API_TOKEN       — AI 생성
  OPENAI_API_KEY            — GPT Image
  GOOGLE_AI_API_KEY         — Gemini
  ANTHROPIC_API_KEY         — 테마 생성
  AZURE_FACE_API_KEY        — 얼굴 감지
  AZURE_FACE_ENDPOINT
  ENCRYPTION_KEY            — RSVP 암호화
  NEXT_PUBLIC_KAKAO_MAP_API_KEY
```
