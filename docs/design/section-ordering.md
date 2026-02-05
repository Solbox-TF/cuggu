# 청첩장 섹션 순서 변경 기능 설계

## 개요

청첩장 내 섹션(인사말, 가족정보, 예식정보, 갤러리, 계좌)의 표시 순서를 사용자가 변경할 수 있게 한다.

- **커버**: 항상 첫 번째 (고정)
- **푸터**: 항상 마지막 (고정)
- **재정렬 가능 섹션**: greeting, parents, ceremony, gallery, accounts

## 현재 구조

4개 템플릿(Classic, Modern, Floral, Minimal) 모두 동일한 섹션 순서가 하드코딩되어 있음:

```
1. Cover (이름, 날짜, 장소)
2. Greeting (인사말)
3. Parents (신랑/신부 가족정보) - showParents 설정으로 표시/숨김
4. Ceremony (예식정보 + 안내사항)
5. Gallery (갤러리) - 이미지 있을 때만 표시
6. Accounts (계좌번호) - showAccounts 설정으로 표시/숨김
7. Footer
```

## 스키마 변경

### `schemas/invitation.ts`

```typescript
// 재정렬 가능한 섹션 ID
export const REORDERABLE_SECTIONS = [
  'greeting',
  'parents',
  'ceremony',
  'gallery',
  'accounts',
] as const;

export type SectionId = typeof REORDERABLE_SECTIONS[number];

// 기본 순서 (하위 호환용)
export const DEFAULT_SECTION_ORDER: SectionId[] = [...REORDERABLE_SECTIONS];

// 섹션 레이블 (UI용)
export const SECTION_LABELS: Record<SectionId, string> = {
  greeting: '인사말',
  parents: '신랑/신부 정보',
  ceremony: '예식 정보',
  gallery: '갤러리',
  accounts: '계좌번호',
};

// 순서 데이터 정합성 보장
export function sanitizeSectionOrder(order: SectionId[] | undefined): SectionId[] {
  if (!order) return [...DEFAULT_SECTION_ORDER];

  const seen = new Set<string>();
  const valid = order.filter((id) => {
    if (seen.has(id) || !REORDERABLE_SECTIONS.includes(id)) return false;
    seen.add(id);
    return true;
  });

  // 누락된 섹션은 끝에 추가
  const missing = DEFAULT_SECTION_ORDER.filter((id) => !valid.includes(id));
  return [...valid, ...missing];
}

// SettingsSchema 확장
export const SettingsSchema = z.object({
  showParents: z.boolean().default(true),
  showAccounts: z.boolean().default(true),
  showMap: z.boolean().default(true),
  enableRsvp: z.boolean().default(true),
  backgroundColor: z.string().optional(),
  fontFamily: z.string().optional(),
  sectionOrder: z.array(z.string()).optional(),  // 추가
});
```

## DB 매핑 변경

### `lib/invitation-utils.ts`

`dbRecordToInvitation` 함수의 settings 객체에 1줄 추가:

```typescript
settings: {
  showParents: ext.settings?.showParents ?? true,
  showAccounts: ext.settings?.showAccounts ?? true,
  showMap: ext.settings?.showMap ?? true,
  enableRsvp: ext.settings?.enableRsvp ?? true,
  backgroundColor: ext.settings?.backgroundColor,
  fontFamily: ext.settings?.fontFamily,
  sectionOrder: ext.settings?.sectionOrder,  // 추가
},
```

**변경 불필요**:
- `invitationToDbUpdate`: `data.settings`를 통째로 `extendedData.settings`에 저장하므로 자동 처리
- API 라우트: extendedData deep merge로 자동 저장
- DB 마이그레이션: JSONB 필드이므로 불필요

## 에디터 UI

### `components/editor/tabs/SettingsTab.tsx`

비밀번호 카드와 자동 삭제 카드 사이에 "섹션 순서" 카드 추가.

```
┌──────────────────────────────────────┐
│ 섹션 순서                             │
│ 청첩장 섹션의 표시 순서를 변경하세요     │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 1. 인사말                  ▲ ▼ │  │
│  │ 2. 신랑/신부 정보    (숨김) ▲ ▼ │  │
│  │ 3. 예식 정보              ▲ ▼ │  │
│  │ 4. 갤러리      (사진 없음) ▲ ▼ │  │
│  │ 5. 계좌번호              ▲ ▼ │  │
│  └────────────────────────────────┘  │
│                                      │
│  [기본 순서로 되돌리기]                │
└──────────────────────────────────────┘
```

**UX 결정사항**:
- 비활성 섹션(숨김/비어있음)도 리스트에 표시 (회색 + 상태 노트)
- 이유: 나중에 활성화했을 때 사용자가 설정한 위치 유지
- 위/아래 화살표 버튼 사용 (DnD 라이브러리 불필요)

**핵심 함수**:

```typescript
const sectionOrder = invitation.settings?.sectionOrder ?? [...DEFAULT_SECTION_ORDER];

const isSectionActive = (id: SectionId): boolean => {
  if (id === 'parents') return invitation.settings?.showParents !== false;
  if (id === 'accounts') return invitation.settings?.showAccounts !== false;
  if (id === 'gallery') return (invitation.gallery?.images?.length ?? 0) > 0;
  return true;
};

const moveSection = (index: number, direction: 'up' | 'down') => {
  const newOrder = [...sectionOrder];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= newOrder.length) return;
  [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
  handleSettingsChange('sectionOrder', newOrder);
};

const resetOrder = () => {
  handleSettingsChange('sectionOrder', [...DEFAULT_SECTION_ORDER]);
};
```

## 템플릿 리팩토링

### 공통 패턴 (4개 템플릿 모두 적용)

각 섹션을 렌더 함수로 추출하고 `sectionOrder`로 동적 렌더링:

```typescript
import { Fragment } from 'react';
import {
  DEFAULT_SECTION_ORDER,
  sanitizeSectionOrder,
  type SectionId
} from '@/schemas/invitation';

export function ClassicTemplate({ data, isPreview = false }) {
  const sectionOrder = sanitizeSectionOrder(data.settings.sectionOrder as SectionId[] | undefined);

  const sections: Record<SectionId, () => React.ReactNode> = {
    greeting: () => (
      <section className="py-12 md:py-20 px-6">
        {/* 기존 인사말 JSX 그대로 */}
      </section>
    ),

    parents: () => {
      if (!data.settings.showParents) return null;
      return (
        <section className="py-12 md:py-16 px-6 bg-amber-50/30">
          {/* 기존 부모정보 JSX 그대로 */}
        </section>
      );
    },

    ceremony: () => (
      <section className="py-12 md:py-20 px-6">
        {/* 기존 예식정보 JSX 그대로 */}
      </section>
    ),

    gallery: () => {
      if (data.gallery.images.length === 0) return null;
      return (
        <section className="py-12 md:py-20 px-6 bg-amber-50/30">
          {/* 기존 갤러리 JSX 그대로 */}
        </section>
      );
    },

    accounts: () => {
      if (!data.settings.showAccounts) return null;
      const hasAccounts = /* 기존 조건 */;
      if (!hasAccounts) return null;
      return (
        <section className="py-12 md:py-20 px-6">
          {/* 기존 계좌 JSX 그대로 */}
        </section>
      );
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50">
      {/* 커버 - 항상 첫 번째 */}
      <section className="relative min-h-[70vh] ...">
        {/* 커버 JSX */}
      </section>

      {/* 동적 섹션 */}
      {sectionOrder.map((id) => (
        <Fragment key={id}>{sections[id]()}</Fragment>
      ))}

      {/* 푸터 - 항상 마지막 */}
      <footer className="py-8 md:py-12 ...">
        {/* 푸터 JSX */}
      </footer>
    </div>
  );
}
```

### 디바이더 처리

**Classic & Floral**: 섹션 간 디바이더 없음. 위 패턴 그대로.

**Modern**: 섹션 간 수평선 디바이더

```typescript
{/* 커버 직후 gradient 디바이더 - 고정 */}
<div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

{/* 동적 섹션 + 사이 디바이더 */}
{sectionOrder.reduce<React.ReactNode[]>((acc, id) => {
  const content = sections[id]();
  if (!content) return acc;
  if (acc.length > 0) {
    acc.push(<div key={`div-${id}`} className="h-px bg-zinc-200 mx-8 md:mx-12" />);
  }
  acc.push(<Fragment key={id}>{content}</Fragment>);
  return acc;
}, [])}
```

**Minimal**: 섹션 간 수직선 디바이더

```typescript
{/* 커버 직후 vertical line - 고정 */}
<div className="flex justify-center py-4">
  <div className="h-12 w-px bg-stone-200" />
</div>

{/* 동적 섹션 + 사이 디바이더 */}
{sectionOrder.reduce<React.ReactNode[]>((acc, id) => {
  const content = sections[id]();
  if (!content) return acc;
  if (acc.length > 0) {
    acc.push(
      <div key={`div-${id}`} className="flex justify-center py-4">
        <div className="h-12 w-px bg-stone-200" />
      </div>
    );
  }
  acc.push(<Fragment key={id}>{content}</Fragment>);
  return acc;
}, [])}
```

## 데이터 흐름

```
SettingsTab
  → handleSettingsChange('sectionOrder', [...])
  → Zustand store.updateInvitation({ settings: { ...prev, sectionOrder } })
  → 2초 debounce
  → PUT /api/invitations/[id]
  → invitationToDbUpdate: data.settings → extendedData.settings
  → DB: extendedData JSONB에 저장

읽기:
  → DB에서 조회
  → dbRecordToInvitation: ext.settings.sectionOrder → settings.sectionOrder
  → PreviewPanel: ...invitation.settings spread
  → 템플릿: sanitizeSectionOrder(data.settings.sectionOrder)
```

## 변경 파일 목록

| 파일 | 변경 내용 | 난이도 |
|------|----------|--------|
| `schemas/invitation.ts` | 상수, 타입, sanitize 함수, SettingsSchema 확장 | 낮음 |
| `lib/invitation-utils.ts` | sectionOrder 매핑 1줄 | 낮음 |
| `components/editor/tabs/SettingsTab.tsx` | 섹션 순서 편집 UI | 중간 |
| `components/templates/ClassicTemplate.tsx` | 동적 섹션 렌더링 | 중간 |
| `components/templates/ModernTemplate.tsx` | 동적 섹션 + 디바이더 | 중간 |
| `components/templates/FloralTemplate.tsx` | 동적 섹션 렌더링 | 중간 |
| `components/templates/MinimalTemplate.tsx` | 동적 섹션 + 디바이더 | 중간 |

**변경 불필요**:
- PreviewPanel (settings spread로 자동 전달)
- API 라우트 (extendedData deep merge)
- Zustand 스토어
- DB 마이그레이션

## 하위 호환

- 기존 청첩장: `sectionOrder`가 `undefined` → `sanitizeSectionOrder(undefined)` = 기본 순서
- `sanitizeSectionOrder` 함수가 누락/중복/잘못된 ID 모두 방어
- 새 섹션 추가 시: 기존 순서 끝에 자동 추가

## 향후 확장

Phase 2에서 `@dnd-kit` 추가 시:
- SettingsTab의 위/아래 버튼 → 드래그 앤 드롭으로 교체
- 데이터 모델(`sectionOrder: string[]`)은 동일
- 템플릿 렌더링 로직 변경 없음

## 검증 체크리스트

- [ ] 에디터에서 섹션 순서 변경 → 미리보기 즉시 반영
- [ ] 저장 후 새로고침 → 순서 유지
- [ ] 4개 템플릿 모두 순서 반영 확인
- [ ] 비활성 섹션(숨김/비어있음) 순서 변경 → 활성화 시 위치 유지
- [ ] 기존 청첩장 열기 → 기본 순서로 정상 표시
- [ ] `npm run build` 통과
