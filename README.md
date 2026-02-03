# Cuggu - AI 웨딩 청첩장 플랫폼

AI로 만드는 특별한 모바일 청첩장 서비스

## 🚀 시작하기

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 빌드

```bash
npm run build
npm start
```

### 코드 품질

```bash
npm run lint        # ESLint 검사
npm run format      # Prettier 포맷팅
```

## 📁 프로젝트 구조

```
cuggu/
├── app/                # Next.js App Router
│   ├── layout.tsx     # 루트 레이아웃 (async params 패턴 적용)
│   ├── page.tsx       # 홈 페이지
│   └── globals.css    # 글로벌 스타일 (Tailwind)
├── components/         # 재사용 가능한 컴포넌트
├── lib/               # 유틸리티 함수
├── db/                # Drizzle ORM 스키마 & 마이그레이션
└── public/            # 정적 파일
```

## 🛠 기술 스택

- **Next.js 16** - App Router + Turbopack
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 CSS
- **React 19** - 최신 React 기능
- **Drizzle ORM** - 타입 안전 DB (Serverless 최적화)
- **pnpm** - 빠른 패키지 매니저

## 📋 다음 단계

1. ✅ 프로젝트 초기 설정
2. ⏳ 데이터베이스 설정 (Supabase + Drizzle ORM)
3. ⏳ 인증 시스템 (NextAuth.js)
4. ⏳ 청첩장 템플릿 개발

## 📖 개발 문서

- [전체 구현 계획](./CLAUDE.md)
- [기술 스택 상세](./tech.md)
- [에이전트 가이드](./AGENTS.md)

## 🔗 링크

- [Next.js 문서](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
