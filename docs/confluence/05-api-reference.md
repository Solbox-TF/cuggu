# API Reference

Cuggu API 엔드포인트 문서입니다.

**Base URL**: `https://cuggu.com/api` (Production)
**인증**: NextAuth.js 세션 기반

---

## 인증 (Auth)

NextAuth.js가 관리하는 인증 엔드포인트입니다.

### 로그인 페이지
```
GET /api/auth/signin
```

### 카카오 로그인
```
GET /api/auth/signin/kakao
```

### 로그아웃
```
POST /api/auth/signout
```

### 현재 세션
```
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "홍길동",
    "email": "user@example.com",
    "image": "https://..."
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

---

## 청첩장 (Invitations)

### 청첩장 목록 조회
```
GET /api/invitations
```

**Response:**
```json
{
  "invitations": [
    {
      "id": "uuid",
      "groomName": "김철수",
      "brideName": "이영희",
      "weddingDate": "2024-05-01T12:00:00Z",
      "status": "draft",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 청첩장 상세 조회
```
GET /api/invitations/:id
```

### 청첩장 생성
```
POST /api/invitations
```

**Request Body:**
```json
{
  "groomName": "김철수",
  "brideName": "이영희",
  "weddingDate": "2024-05-01T12:00:00Z",
  "venueName": "더파티움",
  "venueAddress": "서울시 강남구..."
}
```

### 청첩장 수정
```
PATCH /api/invitations/:id
```

### 청첩장 삭제
```
DELETE /api/invitations/:id
```

---

## AI 이미지 생성

### 이미지 생성 요청
```
POST /api/ai/generate
```

**Request Body:**
```json
{
  "invitationId": "uuid",
  "model": "flux-pro",
  "prompt": "아름다운 벚꽃 배경의 웨딩 사진",
  "style": "romantic"
}
```

**모델 옵션:**
| 모델 | 설명 | 생성 시간 |
|------|------|----------|
| `flux-pro` | 최고 품질 | ~30초 |
| `flux-dev` | 빠른 생성 | ~10초 |
| `photomaker` | 얼굴 합성 | ~45초 |

**Response:**
```json
{
  "generationId": "uuid",
  "status": "processing"
}
```

### 생성 상태 확인
```
GET /api/ai/generate/:generationId
```

**Response (완료 시):**
```json
{
  "id": "uuid",
  "status": "completed",
  "resultUrl": "https://cdn.cuggu.com/ai/...",
  "completedAt": "2024-01-01T00:01:00Z"
}
```

---

## 이미지 업로드

### Presigned URL 발급
```
POST /api/upload/presign
```

**Request Body:**
```json
{
  "filename": "photo.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "fileUrl": "https://cdn.cuggu.com/uploads/..."
}
```

### 업로드 완료 확인
```
POST /api/upload/confirm
```

---

## RSVP

### 참석 여부 제출 (비회원)
```
POST /api/rsvp/:invitationId
```

**Request Body:**
```json
{
  "guestName": "박지민",
  "attendance": "attending",
  "guestCount": 2,
  "meal": true,
  "message": "결혼 축하드립니다!"
}
```

### RSVP 목록 조회 (청첩장 소유자)
```
GET /api/invitations/:id/rsvps
```

---

## 에러 응답

모든 API는 일관된 에러 형식을 사용합니다.

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다."
  }
}
```

**에러 코드:**
| 코드 | HTTP | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 인증 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 입력값 오류 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

---

## Rate Limiting

| 엔드포인트 | 제한 |
|------------|------|
| AI 생성 | 10회/시간/사용자 |
| 이미지 업로드 | 50회/시간/사용자 |
| 일반 API | 100회/분/IP |
