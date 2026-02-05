# 코드 컨벤션

Cuggu 프로젝트의 코딩 스타일 가이드입니다.

---

## 기본 원칙

1. **기존 패턴 따르기**: 새 코드는 주변 코드 스타일과 일관되게
2. **가독성 우선**: 코드 길이보다 이해하기 쉬운 코드
3. **불필요한 복잡도 금지**: 꼭 필요한 추상화만
4. **타입 안전성**: TypeScript 엄격 모드 사용

---

## TypeScript

### 타입 정의
```typescript
// ✅ Good - 명시적 타입 정의
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad - any 사용
const user: any = { ... };
```

### 타입 위치
- 공유 타입: `types/` 폴더
- 컴포넌트 전용 타입: 해당 파일 내 정의

### Zod 스키마
```typescript
// schemas/invitation.ts
import { z } from 'zod';

export const createInvitationSchema = z.object({
  groomName: z.string().min(1, '신랑 이름을 입력해주세요'),
  brideName: z.string().min(1, '신부 이름을 입력해주세요'),
  weddingDate: z.string().datetime(),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
```

---

## React / Next.js

### 컴포넌트 구조
```typescript
// ✅ Good - 함수형 컴포넌트
export function InvitationCard({ invitation }: Props) {
  return (
    <div className="...">
      ...
    </div>
  );
}

// ❌ Bad - 화살표 함수로 export
export const InvitationCard = ({ invitation }: Props) => {
  ...
};
```

### 서버 컴포넌트 vs 클라이언트 컴포넌트
```typescript
// 서버 컴포넌트 (기본) - 데이터 페칭에 사용
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const data = await fetchData();
  return <Dashboard data={data} />;
}

// 클라이언트 컴포넌트 - 상호작용에 사용
// components/InteractiveButton.tsx
'use client';

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Hooks 규칙
```typescript
// ✅ Good - 커스텀 훅
function useInvitation(id: string) {
  const [data, setData] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvitation(id).then(setData).finally(() => setLoading(false));
  }, [id]);

  return { data, loading };
}
```

---

## Tailwind CSS

### 클래스 순서
```tsx
// ✅ Good - 레이아웃 → 스페이싱 → 스타일링 → 상태
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:shadow-md">

// ❌ Bad - 무작위 순서
<div className="hover:shadow-md bg-white p-4 flex shadow rounded-lg items-center gap-4">
```

### 반응형
```tsx
// 모바일 우선 접근
<div className="text-sm md:text-base lg:text-lg">
```

---

## API Routes

### 응답 형식
```typescript
// ✅ Good - 일관된 응답 구조
return NextResponse.json({
  data: invitation
});

return NextResponse.json({
  error: { code: 'NOT_FOUND', message: '청첩장을 찾을 수 없습니다' }
}, { status: 404 });
```

### 에러 핸들링
```typescript
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다' }},
        { status: 401 }
      );
    }

    // ... 비즈니스 로직

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' }},
      { status: 500 }
    );
  }
}
```

---

## 파일 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 필요 페이지 그룹
│   ├── api/               # API Routes
│   └── layout.tsx
├── components/
│   ├── ui/                # 기본 UI 컴포넌트
│   ├── editor/            # 편집기 컴포넌트
│   └── shared/            # 공유 컴포넌트
├── lib/                   # 유틸리티
├── stores/                # Zustand 스토어
├── schemas/               # Zod 스키마
├── types/                 # TypeScript 타입
└── db/                    # Drizzle 스키마 & 쿼리
```

---

## Git 커밋

### 커밋 메시지 형식
```
<type>: <subject>

<body> (선택)
```

### Type
- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `style`: 포맷팅
- `docs`: 문서
- `test`: 테스트
- `chore`: 빌드/설정

### 예시
```
feat: AI 이미지 생성 기능 추가

- Replicate API 연동
- Flux Pro/Dev 모델 지원
- 생성 상태 폴링 구현
```

---

## 금지 사항

- `any` 타입 사용 금지 (불가피한 경우 주석 필수)
- `console.log` 프로덕션 코드에 남기기 금지
- 민감 정보 하드코딩 금지
- 주석 없는 복잡한 로직 금지
