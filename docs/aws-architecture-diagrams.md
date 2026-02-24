# Cuggu AWS 마이그레이션 아키텍처 다이어그램

> 최종 업데이트: 2026-02-24

---

## 1. AS-IS: 현재 아키텍처 (Vercel + Supabase)

```mermaid
---
title: "AS-IS: 현재 아키텍처 (Vercel + Supabase)"
---
graph TD
    User["👤 사용자 (모바일)"]

    subgraph Vercel["☁️ Vercel"]
        Edge["Vercel Edge Network<br/>CDN + Edge Functions"]
        SSR["Serverless Functions<br/>SSR 페이지<br/>/editor, /inv, /admin, /m"]
        API["Serverless Functions<br/>36개 API Routes<br/>/api/ai, /api/invitations, /api/admin"]
        Static["Vercel CDN<br/>정적 파일<br/>JS / CSS / IMG"]
        Cron["Vercel Cron<br/>매일 03:00 KST<br/>만료 청첩장 정리"]
    end

    subgraph DB["🗄️ 데이터"]
        Supabase["Supabase PostgreSQL<br/>15 tables · 16 enums"]
        Redis["Upstash Redis<br/>Rate Limit · AI 생성 제한"]
    end

    subgraph Storage["📦 AWS (이미 사용중)"]
        S3["S3 cuggu-images<br/>갤러리 · AI 사진 · 참조 사진"]
        CF_IMG["CloudFront<br/>이미지 CDN"]
    end

    subgraph ExtAPI["🔌 외부 API"]
        Replicate["Replicate<br/>Flux Pro · Flux Dev<br/>PhotoMaker"]
        OpenAI["OpenAI<br/>GPT Image · DALL-E 3"]
        Gemini["Gemini<br/>Flash Image"]
        Anthropic["Anthropic Claude<br/>테마 생성"]
        Azure["Azure Face API<br/>얼굴 감지"]
        Kakao["Kakao Map API<br/>주소 검색"]
    end

    User --> Edge
    Edge --> SSR
    Edge --> API
    Edge --> Static

    SSR --> Supabase
    API --> Supabase
    API --> Redis
    API --> S3
    S3 --> CF_IMG
    Cron --> Supabase
    Cron --> S3

    API --> Replicate
    API --> OpenAI
    API --> Gemini
    API --> Anthropic
    API --> Azure
    SSR --> Kakao

    style Vercel fill:#000,color:#fff,stroke:#333
    style DB fill:#3ECF8E,color:#fff,stroke:#2a9d6a
    style Storage fill:#FF9900,color:#fff,stroke:#c77a00
    style ExtAPI fill:#6366F1,color:#fff,stroke:#4f46e5
```

---

## 2. TO-BE: AWS 아키텍처 (SST + Lambda)

```mermaid
---
title: "TO-BE: AWS 아키텍처 (SST + Lambda)"
---
graph TD
    User["👤 사용자 (모바일)"]

    subgraph DNS["🌐 DNS & CDN"]
        Route53["Route 53<br/>cuggu.com"]
        CloudFront["CloudFront<br/>CDN + 라우팅<br/>ACM SSL 인증서"]
    end

    subgraph Compute["⚡ 컴퓨팅 (Lambda)"]
        CFFunc["CloudFront Function<br/>Middleware<br/>인증 · 리다이렉트"]
        Lambda["Lambda (OpenNext)<br/>SSR + 36개 API Routes<br/>1024MB · 60s timeout<br/>Response Streaming (SSE)"]
        LambdaImg["Lambda<br/>Image Optimization<br/>이미지 리사이징"]
    end

    subgraph VPC["🔒 VPC (ap-northeast-2)"]
        subgraph PrivA["Private Subnet A (2a)"]
            RDSProxy["RDS Proxy<br/>커넥션 풀링"]
            RDS["RDS PostgreSQL 16<br/>db.t4g.micro<br/>15 tables · 16 enums"]
        end
        subgraph PrivB["Private Subnet B (2c)"]
            RDSStandby["RDS Standby<br/>(Multi-AZ 대비)"]
        end
        subgraph PubA["Public Subnet A"]
            NAT["NAT Gateway"]
        end
    end

    subgraph Cache["🔴 캐시 (유지)"]
        Redis["Upstash Redis<br/>Rate Limit · AI 생성 제한<br/>REST API → 변경 없음"]
    end

    subgraph Storage["📦 스토리지 (유지)"]
        S3Static["S3 Bucket<br/>정적 파일<br/>_next/static"]
        S3Images["S3 cuggu-images<br/>갤러리 · AI 사진 · 참조 사진"]
        CF_IMG["CloudFront<br/>이미지 CDN"]
    end

    subgraph Scheduler["⏰ 스케줄러"]
        EventBridge["EventBridge<br/>cron(0 18 * * ? *)<br/>= 매일 03:00 KST"]
        CronLambda["Lambda (cleanup)<br/>만료 청첩장 정리<br/>S3 배치 삭제<br/>5분 timeout"]
    end

    subgraph Monitor["📊 모니터링"]
        CW["CloudWatch<br/>Logs · Metrics · Alarms"]
        SNS["SNS → 알림<br/>이메일 / 슬랙"]
    end

    subgraph ExtAPI["🔌 외부 API (변경 없음)"]
        Replicate["Replicate<br/>Flux Pro · Flux Dev · PhotoMaker"]
        OpenAI["OpenAI<br/>GPT Image · DALL-E 3"]
        Gemini["Gemini<br/>Flash Image"]
        Anthropic["Anthropic Claude<br/>테마 생성"]
        Azure["Azure Face API<br/>얼굴 감지"]
        Kakao["Kakao Map API<br/>주소 검색"]
    end

    User --> Route53
    Route53 --> CloudFront
    CloudFront --> CFFunc
    CloudFront --> Lambda
    CloudFront --> S3Static
    CloudFront --> LambdaImg

    Lambda --> RDSProxy
    RDSProxy --> RDS
    RDS -.->|Multi-AZ| RDSStandby
    Lambda --> NAT
    NAT -->|인터넷| Redis
    NAT -->|인터넷| ExtAPI

    Lambda --> Redis
    Lambda --> S3Images
    S3Images --> CF_IMG

    Lambda --> Replicate
    Lambda --> OpenAI
    Lambda --> Gemini
    Lambda --> Anthropic
    Lambda --> Azure
    Lambda --> Kakao

    EventBridge --> CronLambda
    CronLambda --> RDSProxy
    CronLambda --> S3Images

    Lambda -.->|로그| CW
    CronLambda -.->|로그| CW
    CW -.->|알람| SNS

    style DNS fill:#146EB4,color:#fff,stroke:#0d5a9e
    style Compute fill:#FF9900,color:#fff,stroke:#c77a00
    style VPC fill:#1a1a2e,color:#fff,stroke:#333
    style Cache fill:#DC382C,color:#fff,stroke:#a32a21
    style Storage fill:#3F8624,color:#fff,stroke:#2d6119
    style Scheduler fill:#8B5CF6,color:#fff,stroke:#6d3fd4
    style Monitor fill:#E11D48,color:#fff,stroke:#b3163a
    style ExtAPI fill:#6366F1,color:#fff,stroke:#4f46e5
```

---

## 3. 요청 흐름: AI 사진 배치 생성 (SSE)

```mermaid
---
title: "요청 흐름: AI 사진 배치 생성 (SSE)"
---
sequenceDiagram
    actor User as 사용자
    participant CF as CloudFront
    participant LB as Lambda (API)
    participant RP as RDS Proxy
    participant DB as RDS PostgreSQL
    participant RD as Upstash Redis
    participant S3 as S3
    participant AI as Replicate/OpenAI/Gemini

    User->>CF: POST /api/ai/generate (배치 요청)
    CF->>LB: Lambda 호출

    LB->>RD: Rate Limit 체크
    RD-->>LB: OK

    LB->>RP: 크레딧 확인 & 예약
    RP->>DB: SELECT ai_credits / INSERT tx
    DB-->>RP: 크레딧 OK
    RP-->>LB: 예약 완료

    LB->>RP: Job 생성 (status: processing)
    RP->>DB: INSERT ai_generation_jobs
    DB-->>RP: OK
    RP-->>LB: job_id

    User->>CF: GET /api/ai/generate/stream?jobId=xxx (SSE)
    CF->>LB: Lambda Response Streaming

    loop 각 이미지 생성
        LB->>AI: 이미지 생성 요청
        AI-->>LB: 생성 완료 (URL)
        LB->>S3: 이미지 저장
        S3-->>LB: OK
        LB->>RP: generation 레코드 저장
        RP->>DB: INSERT ai_generations
        LB-->>User: SSE event: {progress, imageUrl}
    end

    LB->>RP: 크레딧 차감 확정
    RP->>DB: UPDATE ai_credits / INSERT tx
    LB->>RP: Job 완료 (status: completed)
    RP->>DB: UPDATE ai_generation_jobs
    LB-->>User: SSE event: {done}
```

---

## 4. 배포 파이프라인

```mermaid
---
title: "배포 파이프라인"
---
graph LR
    Dev["개발자<br/>git push"]
    GH["GitHub<br/>main branch"]
    SST["SST CLI<br/>npx sst deploy"]
    CFN["CloudFormation<br/>스택 생성/업데이트"]

    subgraph AWS["AWS ap-northeast-2"]
        Build["next build<br/>+ OpenNext 변환"]
        ECR["Lambda 함수<br/>배포"]
        S3D["S3 정적 파일<br/>업로드"]
        CFD["CloudFront<br/>캐시 무효화"]
        R53["Route 53<br/>DNS 업데이트"]
    end

    Dev --> GH
    GH --> SST
    SST --> CFN
    CFN --> Build
    Build --> ECR
    Build --> S3D
    ECR --> CFD
    S3D --> CFD
    CFD --> R53

    style AWS fill:#FF9900,color:#fff,stroke:#c77a00
```

---

## 5. 변경 요약

| 구분 | AS-IS | TO-BE | 변경 여부 |
|---|---|---|---|
| 컴퓨팅 | Vercel Serverless | Lambda (OpenNext) | 변경 |
| CDN | Vercel CDN | CloudFront | 변경 |
| DNS | Vercel 자동 | Route 53 + ACM | 변경 |
| DB | Supabase PostgreSQL | RDS PostgreSQL + RDS Proxy | 변경 |
| Cron | Vercel Cron | EventBridge + Lambda | 변경 |
| IaC | 없음 | SST (CloudFormation) | 신규 |
| 모니터링 | Vercel Dashboard | CloudWatch + SNS | 신규 |
| 캐시 | Upstash Redis | Upstash Redis | **유지** |
| 이미지 저장 | S3 + CloudFront | S3 + CloudFront | **유지** |
| 외부 API | 6개 프로바이더 | 6개 프로바이더 | **유지** |
| 앱 코드 | Next.js 16 | Next.js 16 | **유지** |

### 코드 변경 범위

```
신규:  sst.config.ts, functions/cleanup.ts
수정:  lib/ai/s3.ts (IAM Role 전환), .gitignore (.sst/ 추가)
삭제:  vercel.json
유지:  36개 API Routes, 15개 DB tables, 프론트엔드 전체
```
