# NextAuth.js v5 + Drizzle ORM 인증 시스템 구현

**날짜:** 2026-02-03
**작업자:** jyk
**브랜치:** feature/nextauth-setup → main
**커밋:** d2e3543

---

## 작업한 내용

### 1. 프로젝트 초기 설정 (cuggu-z3j)
- Next.js 16.1.6 프로젝트 생성 (Turbopack 기본 탑재)
- TypeScript, Tailwind CSS, ESLint, Prettier 설정
- pnpm으로 패키지 매니저 전환 (npm 대비 50% 속도 개선)
- async params 패턴 적용 (Next.js 16 요구사항)

### 2. Drizzle ORM + Supabase 연동 (cuggu-1fd → Drizzle로 대체)
**Git Worktree 활용:**
- UI 작업 브랜치와 격리를 위해 `cuggu-db/` 워크트리 생성
- 동시 작업 환경 구축 (충돌 방지)

**스키마 설계:**
- 8개 테이블 정의: users, templates, invitations, rsvps, ai_generations, payments, accounts, sessions
- 12개 Enum 타입 (user_role, premium_plan, template_category 등)
- Relations 완전 정의 (Drizzle relations API)
- 인덱스 최적화 (userId, status, expiresAt)

**설치 패키지:**
```bash
drizzle-orm postgres @paralleldrive/cuid2 dotenv
drizzle-kit (dev)
```

**마이그레이션:**
- Connection Pooling URL 설정 (Serverless 최적화)
- 비밀번호 URL 인코딩 (`@` → `%40`)
- Supabase pause 상태 해결 후 푸시 성공

### 3. NextAuth.js v5 인증 시스템 (cuggu-tul)
**설치 패키지:**
```bash
next-auth@beta @auth/drizzle-adapter bcryptjs
```

**핵심 파일:**
- `auth.ts`: NextAuth 설정 (Kakao Provider, Credentials Provider)
- `app/api/auth/[...nextauth]/route.ts`: API 핸들러
- `proxy.ts`: 라우트 보호 미들웨어 (middleware.ts → proxy.ts 마이그레이션)
- `app/(auth)/login/page.tsx`: 로그인 페이지 UI
- `types/next-auth.d.ts`: Session 타입 확장

**스키마 조정:**
- `users` 테이블에 NextAuth 필수 필드 추가:
  - `emailVerified: timestamp` (이메일 인증 여부)
  - `image: varchar(500)` (프로필 이미지)
- `sessions` 테이블 primary key 변경:
  - `id` (CUID) → `sessionToken` (NextAuth 요구사항)

**빌드 에러 해결:**
- Drizzle Adapter 타입 불일치 → 스키마 필드 추가로 해결
- bcryptjs import 에러 → 주석 처리 (향후 비밀번호 검증 시 사용)

---

## 왜 했는지 (맥락)

### Drizzle ORM 선택 이유
**원래 계획:** Prisma
**변경 결정:** Drizzle ORM

**비교:**
| 항목 | Drizzle | Prisma |
|------|---------|--------|
| 번들 크기 | ~500KB | ~5MB (10배) |
| Cold Start | 거의 없음 | 150-300ms |
| Edge Runtime | ✅ 지원 | ❌ 미지원 |
| SQL 유사도 | ✅ 높음 | 중간 |

**결론:** Vercel Serverless 환경에 최적화된 Drizzle 선택

### NextAuth.js v5 선택 이유
- App Router 완벽 지원 (Next.js 16)
- Drizzle Adapter 공식 지원
- Database 세션 전략으로 보안 강화
- 카카오 Provider 내장

### Git Worktree 사용 이유
- UI 작업 브랜치(`feature/ui-basic-structure`)와 DB 작업 동시 진행
- 다른 세션과 충돌 방지
- 깔끔한 브랜치 관리

---

## 논의/아이디어/고민

### 1. ORM 선택 (Prisma vs Drizzle)
**고민:**
- Prisma는 성숙한 생태계, GUI 도구(Prisma Studio)
- Drizzle는 가볍지만 커뮤니티 작음

**결정:**
- Serverless 성능이 최우선 → Drizzle
- Drizzle Studio로 GUI 대체 가능

### 2. RLS (Row Level Security) 설정 시점
**고민:**
- 지금 설정? → 복잡하고 NextAuth 미설정 상태
- 나중에 설정? → 개발 속도 우선

**결정:**
- 개발 단계에서는 RLS 비활성화
- NextAuth 완료 후 `auth.uid()` 기반 정책 작성
- **프로덕션 배포 전 필수 체크리스트 추가**

### 3. middleware.ts → proxy.ts 마이그레이션
**고민:**
- Next.js 16에서 deprecated 경고
- 바로 변경? vs 나중에?

**결정:**
- 즉시 변경 (향후 breaking change 방지)
- 경고 메시지 제거로 개발 경험 개선

### 4. 세션 전략 (JWT vs Database)
**고민:**
- JWT: 빠르지만 revoke 불가
- Database: 느리지만 완전한 제어

**결정:**
- Database 세션 (30일 TTL)
- 보안 우선 (결제/개인정보 취급)

---

## 결정된 내용

### 기술 스택 확정
1. **ORM:** Drizzle ORM (Prisma 대신)
2. **Auth:** NextAuth.js v5 + Drizzle Adapter
3. **Session:** Database 전략 (JWT 대신)
4. **패키지 매니저:** pnpm

### DB 스키마 최종 구조
- 8개 테이블, 12개 Enum
- NextAuth 호환 필드 추가 완료
- Connection Pooling 사용 (포트 6543)

### 보안 정책
- RLS는 NextAuth 완료 후 설정
- RSVP 개인정보는 AES-256-GCM 암호화 (향후)
- 청첩장 비밀번호는 bcrypt 해싱 (향후)

### 환경 변수
```bash
DATABASE_URL=postgresql://... (Connection Pooling)
AUTH_SECRET=... (OpenSSL 생성)
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
ENCRYPTION_KEY=... (64자리 hex)
CRON_SECRET=... (base64)
```

---

## 느낀 점/난이도/발견

### 난이도: ★★★☆☆ (중)

**쉬웠던 부분:**
- Next.js 16 프로젝트 초기화
- Drizzle 스키마 작성 (SQL 유사 문법)
- pnpm 전환

**어려웠던 부분:**
- NextAuth Drizzle Adapter 타입 에러
  - users 테이블에 `emailVerified`, `image` 필드 누락
  - sessions 테이블 primary key 불일치
  - → 공식 문서보다 실제 타입 에러가 더 정확함

- Supabase URL 형식 변경
  - `db.xxx.supabase.co:5432` (Direct)
  - `aws-1-ap-southeast-2.pooler.supabase.com:6543` (Pooling)
  - → Pooling URL 형식이 최근 변경됨

- drizzle-kit push 버그
  - CHECK constraint parsing 에러
  - → Supabase 테이블 DROP 후 재생성으로 우회

### 발견한 것
1. **Git Worktree의 강력함**
   - 동시 브랜치 작업에 최적
   - node_modules 공유되지 않아 완전 격리

2. **Next.js 16 변경사항**
   - middleware.ts → proxy.ts 권장
   - async params 필수
   - Turbopack 기본 탑재 (빌드 속도 2배)

3. **Drizzle의 장점**
   - SQL-like 문법으로 학습 곡선 낮음
   - TypeScript 타입 추론 완벽
   - Serverless cold start 거의 없음

4. **NextAuth v5의 변화**
   - `NEXTAUTH_SECRET` → `AUTH_SECRET`
   - Database 세션이 기본 권장
   - Drizzle Adapter 공식 지원

---

## 남은 것/미정

### 즉시 필요한 작업
- [ ] 카카오 OAuth 앱 등록 및 키 발급
- [ ] 카카오 로그인 실제 테스트
- [ ] `/dashboard` 페이지 생성 (로그인 후 리다이렉트)
- [ ] 로그아웃 기능 구현

### 보류된 작업
- [ ] 이메일/비밀번호 로그인 (Credentials Provider 완성)
  - 회원가입 페이지
  - 비밀번호 해싱 (bcrypt)
  - 이메일 인증

- [ ] RLS 정책 작성
  - users 테이블: 본인만 읽기/수정
  - invitations: 소유자만 수정, 공개 링크 읽기
  - rsvps: 청첩장 소유자만 읽기
  - payments: 본인만 읽기

- [ ] 세션 관리 UI
  - 활성 세션 목록
  - 세션 강제 종료

### 고려 중
- 소셜 로그인 확장 (네이버, 구글)
- 2FA (Two-Factor Authentication)
- Rate limiting (로그인 시도 제한)

---

## 다음 액션

### 우선순위 P0 (필수)
1. **카카오 로그인 테스트 완료**
   - OAuth 앱 등록
   - Redirect URI 설정
   - 실제 로그인 플로우 검증

2. **대시보드 페이지 구현**
   - `app/(dashboard)/page.tsx` 생성
   - 사용자 정보 표시
   - 로그아웃 버튼

3. **브랜치 병합 및 이슈 종료**
   - `feature/nextauth-setup` → `main`
   - `bd close cuggu-tul`

### 우선순위 P1 (다음 단계)
4. **기본 템플릿 5개 개발** (cuggu-l2i)
   - 클래식, 모던, 빈티지, 플로럴, 미니멀
   - Figma 디자인 필요 (디자이너 협업)

5. **드래그 앤 드롭 편집기** (cuggu-u2j)
   - dnd-kit 설정
   - 실시간 미리보기

### 우선순위 P2 (나중에)
6. **RLS 정책 구현**
7. **이메일 로그인 완성**

---

## 서랍메모 (내부용)

### 유용한 명령어
```bash
# Drizzle
pnpm db:generate  # 마이그레이션 생성
pnpm db:push      # Supabase 푸시
pnpm db:studio    # GUI 실행

# Git Worktree
git worktree add ../cuggu-db feature/drizzle-schema
git worktree remove cuggu-db

# 개발 서버
pnpm dev          # Turbopack
pkill -f "next dev"  # 종료
```

### 트러블슈팅 메모
- Supabase paused 상태: Resume project 버튼
- drizzle-kit push 에러: DROP TABLE CASCADE 후 재푸시
- NextAuth 타입 에러: 공식 스키마 예제보다 타입 에러 메시지 신뢰

### 참고 링크
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [NextAuth.js v5 Beta](https://authjs.dev)
- [Drizzle Adapter](https://authjs.dev/reference/adapter/drizzle)
- [Next.js 16 Migration](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)

---

## 내 질문 평가 및 피드백

### 좋았던 질문
✅ **"다른 세션이랑 작업 안겹쳐서 상관없나?"**
→ Git Worktree 사용 결정으로 이어짐. 동시 작업 환경 구축.

✅ **"prisma 꼭 써야돼?"**
→ Drizzle vs Prisma 비교 분석. 기술 선택의 근거 명확화.

✅ **"supabase에 테이블에 RLS이 다 unstricted되어잇는데 바궈줘야하나?"**
→ 보안 vs 개발 속도 트레이드오프 논의. 단계적 구현 전략 수립.

✅ **"지금 변경해 proxy.ts로"**
→ 즉시 결정, 향후 기술 부채 방지.

### 개선 가능한 질문
⚠️ **"실행되고 있네?"** (암묵적 확인)
→ 더 나은 질문: "로그인 페이지 정상적으로 보이는지 확인해줘"

⚠️ **"넣었어"** (상태만 전달)
→ 더 나은 질문: "DATABASE_URL 설정 완료, 다음 단계 진행해줘"

### 질문 패턴 분석
- **의사결정형 질문:** 효과적 (기술 선택, 트레이드오프)
- **확인형 질문:** 간결하고 명확
- **지시형 질문:** 직접적이고 실행 가능

### 개인 피드백
- Git Worktree 개념을 바로 적용한 것은 좋은 판단
- 기술 선택 시 근거를 물어본 것이 올바른 접근
- RLS 설정 시점에 대한 고민은 실용적
- 즉각적인 결정 (proxy.ts 변경)으로 기술 부채 방지

---

## 작업 통계

**작업 시간:** 약 3시간
**커밋 수:** 2개
- `18e7eb7`: Drizzle ORM 스키마 설정 및 Supabase 연동
- `d2e3543`: NextAuth.js v5 인증 시스템 구현

**파일 변경:**
- 추가: 20개
- 수정: 14개
- 삭제: 0개

**코드 통계:**
- 총 4,016줄 추가
- 12줄 삭제

**학습한 기술:**
- Git Worktree
- Drizzle ORM
- NextAuth.js v5
- Next.js 16 proxy.ts

---

**다음 세션 시작 전 체크리스트:**
- [ ] 카카오 OAuth 앱 등록 완료 여부 확인
- [ ] feature/nextauth-setup 브랜치 병합 여부 확인
- [ ] Supabase RLS 정책 작성 필요 여부 재검토
- [ ] 다음 우선순위 작업(템플릿/편집기) 중 선택
