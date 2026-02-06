# AI 이미지 생성 프로세스

> 작성일: 2026-02-05

## 전체 흐름 (Sequence Diagram)

```mermaid
sequenceDiagram
    participant C as Client<br/>(AIPhotoGenerator)
    participant API as API Route<br/>(/api/ai/generate/stream)
    participant Redis as Upstash Redis
    participant Azure as Azure Face API
    participant S3 as AWS S3
    participant DB as PostgreSQL
    participant R as Replicate API

    C->>+API: POST FormData {image, style, role}

    Note over API: 1. 인증 확인

    API->>Redis: Rate Limit 체크
    Redis-->>API: OK (10분당 5회)

    Note over API: 2. 파일 검증<br/>(MIME, 크기, Magic Number)

    API->>Azure: 얼굴 감지 요청
    Azure-->>API: faceCount: 1 ✓

    API->>DB: 크레딧 차감 (aiCredits - 1)

    API->>S3: 원본 이미지 업로드
    S3-->>API: originalUrl

    API-->>C: SSE: status "AI 사진 생성 시작..."

    loop 4회 순차 생성
        API->>+R: predictions.create()
        Note over R: 20-40초 대기<br/>(Polling)
        R-->>-API: output URL
        API->>S3: 생성 이미지 복사
        S3-->>API: s3Url
        API-->>C: SSE: image {index, url, progress}
    end

    API->>DB: INSERT aiGenerations<br/>(COMPLETED)

    API-->>-C: SSE: done {id, urls, credits}

    C->>C: AIResultGallery 표시
```

## 컴포넌트 구조

```mermaid
flowchart TB
    subgraph Client ["클라이언트"]
        A[AIPhotoSection.tsx] --> B[AIPhotoGenerator.tsx]
        B --> |생성 완료| C[AIResultGallery.tsx]
        C --> |선택| D[갤러리에 추가]
    end

    subgraph API ["API Routes"]
        E[/api/ai/generate/stream]
        F[/api/user/credits]
        G[/api/ai/generations]
    end

    subgraph Core ["Core Libraries"]
        H[lib/ai/replicate.ts]
        I[lib/ai/credits.ts]
        J[lib/ai/s3.ts]
        K[lib/ai/face-detection.ts]
    end

    subgraph External ["External Services"]
        L[(PostgreSQL)]
        M[(Redis)]
        N[Replicate API]
        O[Azure Face API]
        P[AWS S3]
    end

    B --> |POST| E
    A --> |GET| F
    E --> H
    E --> I
    E --> J
    E --> K

    H --> N
    I --> L
    J --> P
    K --> O
    E --> M
```

## 상태 전이

```mermaid
stateDiagram-v2
    [*] --> IDLE: 컴포넌트 마운트

    IDLE --> UPLOADING: 이미지 선택
    UPLOADING --> READY: 업로드 완료

    READY --> VALIDATING: 생성 버튼 클릭
    VALIDATING --> FACE_DETECTING: 파일 검증 통과
    VALIDATING --> ERROR: 파일 검증 실패

    FACE_DETECTING --> GENERATING: 얼굴 1명 감지
    FACE_DETECTING --> ERROR: 얼굴 감지 실패

    GENERATING --> STREAMING: Replicate 호출

    state STREAMING {
        [*] --> IMG_1
        IMG_1 --> IMG_2: 1/4 완료
        IMG_2 --> IMG_3: 2/4 완료
        IMG_3 --> IMG_4: 3/4 완료
        IMG_4 --> [*]: 4/4 완료
    }

    STREAMING --> COMPLETED: 모든 이미지 생성
    STREAMING --> ERROR: 생성 실패 (환불)

    COMPLETED --> IDLE: 재생성 클릭
    ERROR --> IDLE: 다시 시도
```

## 데이터 흐름

```mermaid
flowchart LR
    subgraph Input
        A[증명사진<br/>JPG/PNG]
        B[스타일 선택<br/>CLASSIC/MODERN/...]
        C[역할<br/>GROOM/BRIDE]
    end

    subgraph Processing
        D[파일 검증]
        E[얼굴 감지]
        F[크레딧 차감]
        G[S3 원본 저장]
        H[Replicate 생성]
        I[S3 결과 복사]
    end

    subgraph Output
        J[생성 이미지 4장]
        K[DB 기록]
        L[남은 크레딧]
    end

    A --> D
    B --> H
    C --> H
    D --> E
    E --> F
    F --> G
    G --> H
    H --> |x4| I
    I --> J
    I --> K
    F --> L
```

## 에러 처리 플로우

```mermaid
flowchart TD
    A[요청 시작] --> B{인증됨?}
    B -->|No| Z1[401 Unauthorized]
    B -->|Yes| C{Rate Limit?}

    C -->|초과| Z2[429 Too Many Requests]
    C -->|OK| D{파일 유효?}

    D -->|No| Z3[400 Invalid File]
    D -->|Yes| E{얼굴 감지?}

    E -->|0명 or 2명+| Z4[400 Face Detection Failed]
    E -->|1명| F{크레딧 충분?}

    F -->|No| Z5[402 Payment Required]
    F -->|Yes| G[크레딧 차감]

    G --> H{S3 업로드?}
    H -->|실패| I[환불] --> Z6[500 S3 Error]
    H -->|성공| J{Replicate?}

    J -->|실패| K[환불] --> Z7[500 AI Generation Failed]
    J -->|성공| L[완료]

    style Z1 fill:#f66
    style Z2 fill:#f66
    style Z3 fill:#f66
    style Z4 fill:#f66
    style Z5 fill:#f66
    style Z6 fill:#f66
    style Z7 fill:#f66
    style L fill:#6f6
```

## S3 저장 구조

```
cuugu-ai-photos/ (S3 버킷)
├── ai-originals/
│   └── {userId}/          # 원본 이미지
│       └── {cuid2}.jpg
├── ai-generated/
│   └── {userId}/          # AI 생성 결과
│       └── {cuid2}.png
└── gallery/
    └── {userId}/          # 갤러리 직접 업로드
        └── {cuid2}.webp
```

## 핵심 파일

| 레이어 | 파일 | 역할 |
|--------|------|------|
| **컴포넌트** | `components/editor/tabs/gallery/AIPhotoSection.tsx` | 갤러리 AI 섹션 진입점 |
| | `components/editor/tabs/gallery/AIPhotoGenerator.tsx` | 생성 UI + SSE 처리 |
| | `components/editor/tabs/gallery/AIResultGallery.tsx` | 결과 선택 UI |
| **API** | `app/api/ai/generate/stream/route.ts` | SSE 스트리밍 엔드포인트 |
| | `app/api/user/credits/route.ts` | 크레딧 조회 |
| **라이브러리** | `lib/ai/replicate.ts` | Replicate API 호출 |
| | `lib/ai/models.ts` | AI 모델 정의 |
| | `lib/ai/credits.ts` | 크레딧 관리 |
| | `lib/ai/s3.ts` | S3 업로드/복사 |
| | `lib/ai/face-detection.ts` | Azure Face API |
| **스키마** | `db/schema.ts` | aiGenerations 테이블 |

## 주요 설정값

```typescript
// lib/ai/config.ts
AI_CONFIG = {
  MAX_FILE_SIZE: 10MB,
  BATCH_SIZE: 4,              // 한 번에 4장 생성
  RATE_LIMIT_REQUESTS: 5,     // 10분당 5회
  RATE_LIMIT_WINDOW: 600,     // 10분
}

// 모델별 비용 (USD)
FLUX_PRO:    $0.04/img  → 4장 = $0.16
FLUX_DEV:    $0.025/img → 4장 = $0.10
PHOTOMAKER:  $0.0095/img → 4장 = $0.038
```

## 요약

| 항목 | 내용 |
|------|------|
| **호출 방식** | SSE 스트리밍 (실시간 진행상황) |
| **Replicate 방식** | Polling (replicate.wait) - 동기 대기 |
| **생성 순서** | 순차 (병렬 불가) |
| **총 처리 시간** | 80-160초 (4장) |
| **저장소** | S3 + CloudFront |
| **크레딧** | 1 생성 = 1 크레딧 |
| **Rate Limit** | 10분당 5회 (Redis) |
