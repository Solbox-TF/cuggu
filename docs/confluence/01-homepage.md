# Cuggu - 모바일 청첩장 플랫폼

## 프로젝트 소개

Cuggu는 한국 시장을 타겟으로 한 **모바일 청첩장 플랫폼**입니다.
**AI 사진 생성**을 핵심 차별화 포인트로, 커플들에게 특별한 청첩장 경험을 제공합니다.

---

## 빠른 링크

| 카테고리 | 링크 |
|---------|------|
| 온보딩 가이드 | [신규 입사자 가이드](/wiki/onboarding) |
| 기술 문서 | [아키텍처 개요](/wiki/architecture) |
| API 문서 | [API Reference](/wiki/api-reference) |
| 디자인 시스템 | [UI/UX 가이드라인](/wiki/design-system) |
| 회의록 | [회의록 모음](/wiki/meetings) |

---

## 프로젝트 현황

### 완료된 기능
- 카카오 로그인 인증
- 청첩장 CRUD
- 탭 기반 폼 편집기
- AI 사진 생성 (Flux Pro/Dev, PhotoMaker)
- 갤러리 관리
- 계좌 정보 관리
- 대시보드
- 클래식 템플릿

### 진행 중 / 예정
- 공개 청첩장 뷰 (`inv/[id]/`)
- Toss 결제 연동
- RSVP 게스트 폼
- 추가 템플릿 개발
- 카카오톡 공유 기능

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Framer Motion, Zustand |
| Backend | Next.js API Routes, NextAuth.js v5 |
| Database | PostgreSQL (Supabase) + Drizzle ORM |
| Storage | AWS S3 + CloudFront |
| AI | Replicate API (Flux Pro/Dev, PhotoMaker) |
| Cache | Upstash Redis |

---

## 팀 & 연락처

| 역할 | 담당자 | 연락처 |
|------|--------|--------|
| PM | - | - |
| 개발 | - | - |
| 디자인 | - | - |

---

## 최근 공지

> 이 섹션에 중요 공지사항을 업데이트하세요.

- **2024-XX-XX**: 프로젝트 킥오프
- **2024-XX-XX**: v1.0 출시 예정

---

## 문서 구조

```
📁 Cuggu
├── 📄 대문 (현재 페이지)
├── 📁 온보딩
│   ├── 신규 입사자 가이드
│   ├── 개발 환경 설정
│   └── 코드 컨벤션
├── 📁 기술 문서
│   ├── 아키텍처 개요
│   ├── 데이터베이스 스키마
│   ├── API Reference
│   └── AI 기능 가이드
├── 📁 기획/디자인
│   ├── 제품 요구사항
│   ├── 와이어프레임
│   └── UI/UX 가이드라인
├── 📁 운영
│   ├── 배포 가이드
│   ├── 모니터링
│   └── 장애 대응
└── 📁 회의록
    └── 주간 회의
```
