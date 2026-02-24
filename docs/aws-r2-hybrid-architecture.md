# Cuggu AWS + Cloudflare R2 하이브리드 아키텍처

> 최종 업데이트: 2026-02-24
> 전략: 컴퓨팅/DB는 AWS, 이미지 스토리지는 Cloudflare R2

---

## 왜 하이브리드인가?

```
AWS의 강점          →  컴퓨팅 (Lambda), DB (RDS PostgreSQL), 모니터링 (CloudWatch)
Cloudflare의 강점   →  이그레스 무료 (R2), 글로벌 CDN 기본 포함, Cold Start 없는 엣지

하이브리드 = 각자의 강점만 취합
```

| 항목 | 순수 AWS | 하이브리드 (AWS + R2) | 절감 |
|---|---|---|---|
| 이미지 저장 | S3 $0.023/GB | R2 $0.015/GB | -35% |
| 이미지 이그레스 | CloudFront $0.085~0.12/GB | **$0** | **-100%** |
| CDN (이미지) | CloudFront 별도 과금 | Cloudflare CDN **무료** | **-100%** |
| CDN (앱) | CloudFront (SST 포함) | CloudFront (SST 포함) | 동일 |
| 컴퓨팅/DB | Lambda + RDS | Lambda + RDS | 동일 |

청첩장 서비스는 이미지 서빙이 트래픽의 대부분 → R2 이그레스 무료의 효과가 큼.

---

## 1. 전체 아키텍처

```mermaid
---
title: "하이브리드 아키텍처: AWS (컴퓨팅/DB) + Cloudflare R2 (이미지)"
---
graph TD
    User["👤 사용자 (모바일)"]

    subgraph CF_Edge["🟠 Cloudflare (이미지 전용)"]
        CF_CDN["Cloudflare CDN<br/>img.cuggu.com<br/>글로벌 캐시 · 이그레스 무료"]
        R2["Cloudflare R2<br/>cuggu-images<br/>갤러리 · AI 사진 · 참조 사진<br/>OG 이미지 · 엔딩 사진"]
        CF_Transform["Cloudflare Images<br/>이미지 리사이징/최적화<br/>(선택사항)"]
    end

    subgraph AWS_Edge["🔶 AWS (앱 서빙)"]
        Route53["Route 53<br/>cuggu.com"]
        CloudFront["CloudFront<br/>앱 CDN + 라우팅<br/>ACM SSL"]
    end

    subgraph AWS_Compute["⚡ AWS Lambda"]
        CFFunc["CloudFront Function<br/>Middleware<br/>인증 · 리다이렉트"]
        Lambda["Lambda (OpenNext)<br/>SSR + API Routes<br/>1024MB · 60s timeout<br/>Response Streaming"]
        LambdaImg["Lambda<br/>Next.js Image Optimization"]
    end

    subgraph AWS_VPC["🔒 AWS VPC (ap-northeast-2)"]
        subgraph Private["Private Subnets"]
            RDSProxy["RDS Proxy<br/>커넥션 풀링"]
            RDS["RDS PostgreSQL 16<br/>db.t4g.micro<br/>15 tables · 16 enums"]
        end
        subgraph Public["Public Subnet"]
            NAT["NAT Gateway"]
        end
    end

    subgraph Cache["🔴 Upstash (유지)"]
        Redis["Upstash Redis<br/>Rate Limit · AI 생성 제한"]
    end

    subgraph Scheduler["⏰ AWS EventBridge"]
        EB["EventBridge<br/>매일 03:00 KST"]
        CronLambda["Lambda (cleanup)<br/>만료 청첩장 정리<br/>R2 배치 삭제"]
    end

    subgraph Monitor["📊 모니터링"]
        CW["CloudWatch<br/>Lambda · RDS"]
        CF_Analytics["Cloudflare Analytics<br/>R2 · CDN"]
    end

    subgraph ExtAPI["🔌 외부 API"]
        AI["Replicate · OpenAI · Gemini<br/>Anthropic · Azure Face · Kakao"]
    end

    %% 사용자 → 앱
    User -->|"cuggu.com"| Route53
    Route53 --> CloudFront
    CloudFront --> CFFunc
    CloudFront --> Lambda
    CloudFront --> LambdaImg

    %% 사용자 → 이미지 (별도 도메인)
    User -->|"img.cuggu.com"| CF_CDN
    CF_CDN --> R2
    CF_CDN -.-> CF_Transform

    %% Lambda → DB
    Lambda --> RDSProxy
    RDSProxy --> RDS

    %% Lambda → 외부 (NAT 경유)
    Lambda --> NAT
    NAT --> Redis
    NAT --> AI

    %% Lambda → R2 (S3 호환 API)
    Lambda -->|"S3 호환 API<br/>PutObject/DeleteObject"| R2

    %% Cron
    EB --> CronLambda
    CronLambda --> RDSProxy
    CronLambda -->|"S3 호환 API"| R2

    %% 모니터링
    Lambda -.-> CW
    CronLambda -.-> CW
    R2 -.-> CF_Analytics
    CF_CDN -.-> CF_Analytics

    style CF_Edge fill:#F38020,color:#fff,stroke:#d06a10
    style AWS_Edge fill:#146EB4,color:#fff,stroke:#0d5a9e
    style AWS_Compute fill:#FF9900,color:#fff,stroke:#c77a00
    style AWS_VPC fill:#1a1a2e,color:#fff,stroke:#333
    style Cache fill:#DC382C,color:#fff,stroke:#a32a21
    style Scheduler fill:#8B5CF6,color:#fff,stroke:#6d3fd4
    style Monitor fill:#E11D48,color:#fff,stroke:#b3163a
    style ExtAPI fill:#6366F1,color:#fff,stroke:#4f46e5
```

---

## 2. 도메인 & 트래픽 분리

```mermaid
---
title: "도메인 분리: 앱 vs 이미지"
---
graph LR
    subgraph DNS["DNS 설정"]
        D1["cuggu.com<br/>→ Route 53<br/>→ CloudFront (AWS)"]
        D2["img.cuggu.com<br/>→ Cloudflare DNS<br/>→ R2 + Cloudflare CDN"]
    end

    subgraph App["앱 트래픽 (AWS)"]
        A1["SSR 페이지"]
        A2["API Routes"]
        A3["정적 JS/CSS"]
    end

    subgraph Img["이미지 트래픽 (Cloudflare)"]
        I1["갤러리 사진"]
        I2["AI 생성 사진"]
        I3["참조 사진"]
        I4["OG 이미지"]
        I5["엔딩 사진"]
    end

    D1 --> App
    D2 --> Img

    style DNS fill:#333,color:#fff
    style App fill:#FF9900,color:#fff,stroke:#c77a00
    style Img fill:#F38020,color:#fff,stroke:#d06a10
```

### DNS 설정

```
cuggu.com        → CNAME → xxx.cloudfront.net (AWS)     ← 앱, SSR, API
img.cuggu.com    → CNAME → xxx.r2.dev (Cloudflare)      ← 모든 이미지
```

---

## 3. 이미지 업로드 & 서빙 흐름

```mermaid
---
title: "이미지 업로드 흐름 (Lambda → R2)"
---
sequenceDiagram
    actor User as 사용자
    participant CF as CloudFront
    participant LB as Lambda (API)
    participant R2 as Cloudflare R2
    participant CDN as Cloudflare CDN

    Note over User,CDN: 📤 이미지 업로드 (갤러리/AI 생성)

    User->>CF: POST /api/upload/gallery (이미지)
    CF->>LB: Lambda 호출

    LB->>LB: 이미지 검증 (크기, 타입)
    LB->>R2: PutObjectCommand (S3 호환 API)<br/>Bucket: cuggu-images<br/>Key: gallery/{userId}/{uuid}.webp
    R2-->>LB: OK (ETag)

    LB->>LB: DB에 이미지 URL 저장<br/>https://img.cuggu.com/gallery/...
    LB-->>User: { url: "https://img.cuggu.com/..." }

    Note over User,CDN: 📥 이미지 조회

    User->>CDN: GET img.cuggu.com/gallery/{userId}/{uuid}.webp
    alt 캐시 HIT
        CDN-->>User: 200 (캐시된 이미지, ~10ms)
    else 캐시 MISS
        CDN->>R2: GetObject
        R2-->>CDN: 이미지 데이터
        CDN->>CDN: 캐시 저장 (TTL 설정)
        CDN-->>User: 200 (이미지)
    end
```

---

## 4. AI 사진 배치 생성 (SSE + R2)

```mermaid
---
title: "AI 배치 생성 → R2 저장 → Cloudflare CDN 서빙"
---
sequenceDiagram
    actor User as 사용자
    participant CF as CloudFront (AWS)
    participant LB as Lambda
    participant DB as RDS (via Proxy)
    participant AI as Replicate/OpenAI/Gemini
    participant R2 as Cloudflare R2
    participant CDN as Cloudflare CDN

    User->>CF: POST /api/ai/generate (배치 5장)
    CF->>LB: Lambda 호출

    LB->>DB: 크레딧 예약 (5장분)
    LB->>DB: Job 생성 (processing)

    User->>CF: GET /api/ai/generate/stream?jobId=xxx (SSE)
    CF->>LB: Lambda Response Streaming

    loop 5장 생성
        LB->>AI: 이미지 생성 요청
        AI-->>LB: 생성 완료 (임시 URL)

        LB->>LB: 이미지 다운로드 (AI 임시 URL)
        LB->>R2: PutObjectCommand<br/>Key: ai/{userId}/{jobId}/{n}.webp
        R2-->>LB: OK

        LB->>DB: INSERT ai_generations<br/>(imageUrl: img.cuggu.com/ai/...)

        LB-->>User: SSE event: {<br/>  progress: n/5,<br/>  imageUrl: "https://img.cuggu.com/ai/..."<br/>}

        Note over User,CDN: 사용자 브라우저가 즉시 로드
        User->>CDN: GET img.cuggu.com/ai/{userId}/{jobId}/{n}.webp
        CDN->>R2: GetObject (첫 요청)
        CDN-->>User: 이미지 표시
    end

    LB->>DB: 크레딧 차감 확정
    LB->>DB: Job 완료 (completed)
    LB-->>User: SSE event: {done}
```

---

## 5. S3 → R2 마이그레이션 흐름

```mermaid
---
title: "기존 S3 이미지 → R2 마이그레이션"
---
graph TD
    subgraph Phase1["Phase 1: R2 설정"]
        R2Create["R2 버킷 생성<br/>cuggu-images"]
        Domain["커스텀 도메인 설정<br/>img.cuggu.com"]
        CORS["CORS 정책 설정<br/>cuggu.com 허용"]
    end

    subgraph Phase2["Phase 2: 데이터 이전"]
        Sync["S3 → R2 동기화<br/>rclone sync / Sippy"]
        Verify["이미지 카운트 검증<br/>S3 vs R2 비교"]
    end

    subgraph Phase3["Phase 3: 코드 전환"]
        Env["환경변수 변경<br/>S3_ENDPOINT → R2<br/>IMAGE_DOMAIN → img.cuggu.com"]
        Code["S3Client 엔드포인트 변경<br/>(S3 호환이라 코드 최소 변경)"]
        DB_Update["DB URL 일괄 업데이트<br/>cloudfront.net → img.cuggu.com"]
    end

    subgraph Phase4["Phase 4: 검증 & 정리"]
        Test["전체 이미지 로딩 테스트"]
        Cutover["DNS 전환 완료"]
        S3Delete["S3 버킷 정리<br/>(1개월 후)"]
    end

    Phase1 --> Phase2
    Phase2 --> Phase3
    Phase3 --> Phase4

    style Phase1 fill:#F38020,color:#fff,stroke:#d06a10
    style Phase2 fill:#FF9900,color:#fff,stroke:#c77a00
    style Phase3 fill:#6366F1,color:#fff,stroke:#4f46e5
    style Phase4 fill:#10B981,color:#fff,stroke:#059669
```

---

## 6. 코드 변경 범위

### S3Client → R2 전환 (최소 변경)

```mermaid
---
title: "코드 변경: S3 → R2"
---
graph LR
    subgraph Before["AS-IS (S3)"]
        B1["S3Client<br/>region: ap-northeast-2<br/>endpoint: (기본 AWS)"]
        B2["이미지 URL<br/>xxx.cloudfront.net/..."]
    end

    subgraph After["TO-BE (R2)"]
        A1["S3Client<br/>region: auto<br/>endpoint: xxx.r2.cloudflarestorage.com"]
        A2["이미지 URL<br/>img.cuggu.com/..."]
    end

    B1 -->|"endpoint 변경만"| A1
    B2 -->|"도메인 변경"| A2

    style Before fill:#FF9900,color:#fff,stroke:#c77a00
    style After fill:#F38020,color:#fff,stroke:#d06a10
```

### 변경 파일 목록

```
수정 (3~4개):
  ~ lib/ai/s3.ts            → endpoint를 R2로 변경, credentials 방식 변경
  ~ lib/ai/env.ts           → R2_ENDPOINT, R2_ACCESS_KEY_ID 등 추가
  ~ .env.example             → R2 관련 환경변수 추가
  ~ app/api/cron/cleanup     → DeleteObjects가 R2에서도 동일하게 동작

변경 없음:
  - PutObjectCommand, GetObjectCommand, DeleteObjectsCommand → S3 호환이라 그대로
  - 이미지 업로드 로직 전체 (갤러리, AI 생성, 참조 사진, OG)
  - 프론트엔드 이미지 렌더링 (URL 도메인만 환경변수로 처리)

삭제:
  - CloudFront 이미지 배포 (Cloudflare CDN으로 대체)
  - AWS_ACCESS_KEY_ID/SECRET (이미지용, Lambda IAM은 유지)
```

---

## 7. 비용 비교

### 월 예상 비용 (초기, 소량 트래픽)

| 항목 | 순수 AWS | AWS + R2 하이브리드 |
|---|---|---|
| Lambda | $5~20 | $5~20 |
| RDS + Proxy | $25~40 | $25~40 |
| CloudFront (앱) | $1~3 | $1~3 |
| ~~CloudFront (이미지)~~ | ~~$1~5~~ | **$0** (Cloudflare CDN 무료) |
| ~~S3 (스토리지)~~ | ~~$3~5~~ | **$1~3** (R2 저렴) |
| ~~S3 이그레스~~ | ~~$5~15~~ | **$0** (R2 이그레스 무료) |
| Upstash Redis | $0 | $0 |
| Route 53 | $0.50 | $0.50 |
| **합계** | **$41~88** | **$33~67** |
| **이미지 트래픽 증가 시** | **급격히 증가** | **거의 증가 없음** |

### 트래픽 증가 시 (MAU 1만+, 이미지 100GB 서빙/월)

| 항목 | 순수 AWS | AWS + R2 하이브리드 |
|---|---|---|
| 이미지 이그레스 | **$8.5~12** (100GB × $0.085~0.12) | **$0** |
| 이미지 스토리지 (50GB) | $1.15 | $0.75 |
| CDN 요청 | $2~5 | $0 |
| **이미지 관련 소계** | **$12~18** | **$0.75** |

---

## 8. 전체 인프라 매핑

```mermaid
---
title: "서비스별 인프라 매핑"
---
graph TB
    subgraph AWS["☁️ AWS (ap-northeast-2)"]
        direction TB
        AW1["Lambda — SSR + API (36 routes)"]
        AW2["RDS PostgreSQL — 15 tables"]
        AW3["RDS Proxy — 커넥션 풀링"]
        AW4["CloudFront — 앱 CDN (cuggu.com)"]
        AW5["Route 53 — DNS"]
        AW6["EventBridge — Cron"]
        AW7["CloudWatch — 모니터링"]
        AW8["ACM — SSL 인증서"]
    end

    subgraph Cloudflare["🟠 Cloudflare"]
        direction TB
        CF1["R2 — 이미지 스토리지"]
        CF2["CDN — 이미지 서빙 (img.cuggu.com)"]
        CF3["Analytics — R2/CDN 모니터링"]
    end

    subgraph Keep["♻️ 유지"]
        direction TB
        K1["Upstash Redis — Rate Limit"]
        K2["Replicate — AI 생성 (주력)"]
        K3["OpenAI — GPT Image, DALL-E 3"]
        K4["Gemini — Flash Image"]
        K5["Anthropic — 테마 생성"]
        K6["Azure — 얼굴 감지"]
        K7["Kakao — 지도/주소"]
    end

    subgraph Dev["🔧 개발 환경"]
        direction TB
        D1["Vercel — develop 브랜치 배포"]
        D2["Supabase — 개발 DB (유지)"]
    end

    style AWS fill:#FF9900,color:#fff,stroke:#c77a00
    style Cloudflare fill:#F38020,color:#fff,stroke:#d06a10
    style Keep fill:#6366F1,color:#fff,stroke:#4f46e5
    style Dev fill:#000,color:#fff,stroke:#333
```

---

## 9. 마이그레이션 타임라인

```mermaid
---
title: "마이그레이션 타임라인 (7~9일)"
---
gantt
    title AWS + R2 하이브리드 마이그레이션
    dateFormat  YYYY-MM-DD
    axisFormat  Day %e

    section Phase 0 사전준비
    AWS 계정/IAM 설정          :p0a, 2026-03-01, 1d
    SST/Wrangler CLI 설치      :p0b, 2026-03-01, 1d
    Supabase/S3 백업           :p0c, 2026-03-01, 1d

    section Phase 1 RDS
    VPC/서브넷 구성             :p1a, after p0a, 1d
    RDS + RDS Proxy 생성        :p1b, after p1a, 1d
    DB 데이터 이전 & 검증       :p1c, after p1b, 1d

    section Phase 2 R2
    R2 버킷 생성 & 도메인 설정   :p2a, after p0a, 1d
    S3 → R2 데이터 동기화       :p2b, after p2a, 1d
    이미지 검증                 :p2c, after p2b, 1d

    section Phase 3 SST + 코드
    sst.config.ts 작성          :p3a, after p1c, 1d
    S3 → R2 코드 전환           :p3b, after p2c, 1d
    스테이징 배포               :p3c, after p3a, 1d

    section Phase 4 테스트
    기능 테스트                 :p4a, after p3c, 2d
    성능 측정                   :p4b, after p3c, 2d

    section Phase 5 프로덕션
    도메인/SSL 설정             :p5a, after p4a, 1d
    DNS 전환                   :p5b, after p5a, 1d
    안정화 모니터링             :p5c, after p5b, 2d
```

---

## 10. 환경변수 (하이브리드 기준)

```
# ── AWS (컴퓨팅/DB) ──
DATABASE_URL=postgresql://...@cuggu-db-proxy.xxx.rds.amazonaws.com:5432/cuggu
AWS_REGION=ap-northeast-2

# ── Cloudflare R2 (이미지) ──
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=cuggu-images
IMAGE_DOMAIN=img.cuggu.com          # 이미지 URL 도메인
# 기존 S3_BUCKET_NAME, CLOUDFRONT_DOMAIN → 제거

# ── Auth ──
NEXTAUTH_URL=https://cuggu.com
NEXTAUTH_SECRET=xxx
KAKAO_CLIENT_ID=xxx
KAKAO_CLIENT_SECRET=xxx

# ── Redis (유지) ──
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# ── AI (유지) ──
REPLICATE_API_TOKEN=xxx
OPENAI_API_KEY=xxx
GOOGLE_AI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx

# ── Azure (유지) ──
AZURE_FACE_API_KEY=xxx
AZURE_FACE_ENDPOINT=xxx

# ── Encryption (유지) ──
ENCRYPTION_KEY=xxx

# ── Client (유지) ──
NEXT_PUBLIC_KAKAO_MAP_API_KEY=xxx
NEXT_PUBLIC_IMAGE_DOMAIN=img.cuggu.com
```
