# 가족 구조 지원 — 에디터 구현 계획

> 관련 요구사항: `docs/family-structure-requirements.md`

## 요약

한국 청첩장의 다양한 가족 형태(양부모, 한부모, 고인, 조부모, 대리호주, 본인만)를 에디터에서 지원.
Phase 1~3 전체 구현.

## 선행 버그 수정 (Critical)

**현재 GET API가 raw DB row를 반환**하고 있어서, 에디터에서 `invitation.groom.fatherName` 등이 로드 시 `undefined`.
- GET 응답에 `dbRecordToInvitation()` 적용 필요
- PUT 핸들러도 `invitationToDbUpdate()` 사용하도록 리팩토링 필요 (현재 인라인 로직이 groom/bride 확장 필드를 extendedData로 분리하지 않음)

---

## 수정 파일 목록

| 순서 | 파일 | 변경 내용 |
|------|------|-----------|
| 1 | `schemas/invitation.ts` | `FamilyDisplayModeSchema` 추가, PersonSchema/ExtendedPersonSchema에 새 필드 추가, UpdateInvitationSchema 확장 |
| 2 | `lib/utils/family-display.ts` | **신규** — `formatFamilyName()`, 안내 메시지, 계좌 라벨 헬퍼 |
| 3 | `components/editor/TabHeader.tsx` | **신규** — 탭 제목 + 저장 상태 표시 공통 컴포넌트 |
| 4 | `lib/invitation-utils.ts` | `dbRecordToInvitation()`에 새 필드 매핑 추가 |
| 5 | `app/api/invitations/[id]/route.ts` | GET: `dbRecordToInvitation()` 적용, PUT: `invitationToDbUpdate()` 사용으로 리팩토링 |
| 6 | `components/editor/tabs/BasicInfoTab.tsx` | 가족 표기 모드 UI 전면 재작성 + TabHeader 적용 |
| 7 | `components/editor/PreviewPanel.tsx` | previewData에 새 필드 매핑 추가 |
| 8 | `components/templates/ClassicTemplate.tsx` | `formatFamilyName()` 적용 |
| 9 | `components/templates/ModernTemplate.tsx` | 동일 |
| 10 | `components/templates/MinimalTemplate.tsx` | 동일 |
| 11 | `components/templates/FloralTemplate.tsx` | 동일 |
| 12 | `components/editor/tabs/AccountTab.tsx` | familyDisplayMode에 따른 부모 계좌 조건부 표시 + TabHeader 적용 |
| 13 | `components/editor/tabs/*.tsx` (나머지 탭들) | TabHeader 적용 (기존 하드코딩 헤더 교체) |

---

## Step 1: 스키마 변경 (`schemas/invitation.ts`)

### 1a. FamilyDisplayMode 타입 추가

```typescript
export const FamilyDisplayModeSchema = z.enum([
  'full_names',      // 부모님 실명 (기본)
  'single_parent',   // 한 분만 표기
  'anonymous',       // 부·모 표기
  'grandparents',    // 조부모님
  'guardian',        // 대리 호주 (삼촌/이모 등)
  'self_only',       // 본인만
]);
```

### 1b. PersonSchema에 필드 추가

```typescript
// 기존 필드 유지 + 아래 추가
familyDisplayMode: FamilyDisplayModeSchema.default('full_names'),
singleParentType: z.enum(['father', 'mother']).optional(),
grandparentName: z.string().optional(),     // 조부
grandmotherName: z.string().optional(),     // 조모
guardianTitle: z.string().optional(),       // "백부", "삼촌" 등
guardianName: z.string().optional(),
guardianSpouseTitle: z.string().optional(), // "백모" 등
guardianSpouseName: z.string().optional(),
guardianRelation: z.string().optional(),    // "조카", "손자" 등
```

### 1c. ExtendedPersonSchema에 동일 필드 추가

`.partial()`이므로 전부 optional.

### 1d. UpdateInvitationSchema 확장

PersonSchema의 전체 필드를 받을 수 있도록 수정 (현재는 CreateInvitationSchema 기반이라 name/fatherName/motherName/phone만 허용).

---

## Step 2: TabHeader 공통 컴포넌트 (`components/editor/TabHeader.tsx`)

**신규 파일**. 모든 탭에서 재사용하는 헤더 컴포넌트.

### 현재 패턴 (각 탭에 하드코딩)
```tsx
<div>
  <h2 className="text-xl font-bold text-slate-900 mb-1">기본 정보</h2>
  <p className="text-sm text-slate-500">신랑과 신부의 정보를 입력하세요</p>
</div>
```

### 새 컴포넌트
```tsx
import { Loader2, Check } from 'lucide-react';
import { useInvitationEditor } from '@/stores/invitation-editor';

interface TabHeaderProps {
  title: string;
  description: string;
}

export function TabHeader({ title, description }: TabHeaderProps) {
  const { isSaving, lastSaved, hasUnsavedChanges } = useInvitationEditor();

  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {/* 저장 상태 인디케이터 */}
      <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
        {isSaving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>저장 중...</span>
          </>
        ) : lastSaved && !hasUnsavedChanges ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600">저장됨</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
```

### 적용 범위
모든 7개 탭의 하드코딩 헤더를 `<TabHeader>` 로 교체:
- `BasicInfoTab` → `<TabHeader title="기본 정보" description="신랑과 신부의 정보를 입력하세요" />`
- `VenueTab` → `<TabHeader title="예식 정보" description="예식 날짜, 시간, 장소를 입력하세요" />`
- `GreetingTab` → `<TabHeader title="인사말" description="..." />`
- `GalleryTab`, `AccountTab`, `SettingsTab`, `TemplateTab` 동일

---

## Step 3: formatFamilyName 유틸 생성 (`lib/utils/family-display.ts`)

**핵심 함수**: 모든 템플릿에서 공통 사용

```
formatFamilyName(person) → string
```

| 모드 | 입력 | 출력 |
|------|------|------|
| full_names | 아버지: 홍판서, 어머니: 김씨, 관계: 장남 | `홍판서·김씨의 장남 홍길동` |
| full_names | 아버지: 故 홍판서, 어머니: 김씨 | `故 홍판서·김씨의 장남 홍길동` |
| full_names | 양부모 故 | `故 홍판서·故 김씨의 자 홍길동` |
| single_parent | 어머니: 김씨 | `김씨의 장남 홍길동` |
| anonymous | — | `부·모의 장남 홍길동` |
| grandparents | 조부: 홍대감, 조모: 박씨 | `조부 홍대감·조모 박씨의 손자 홍길동` |
| guardian | 백부 홍판서·백모 김씨 | `백부 홍판서·백모 김씨의 조카 홍길동` |
| self_only | — | `홍길동` |

**추가 헬퍼**:
- `getFamilyModeGuidance(mode, isDeceased)` — 에디터 안내 메시지
- `getParentAccountLabel(person, parent)` — 계좌 섹션에서 부모 라벨 (null이면 숨김)

---

## Step 4: 데이터 흐름 수정 (`lib/invitation-utils.ts`)

`dbRecordToInvitation()` groom/bride 매핑에 새 필드 추가:

```typescript
groom: {
  ...기존 필드,
  familyDisplayMode: ext.groom?.familyDisplayMode || 'full_names',
  singleParentType: ext.groom?.singleParentType,
  grandparentName: ext.groom?.grandparentName,
  grandmotherName: ext.groom?.grandmotherName,
  guardianTitle: ext.groom?.guardianTitle,
  guardianName: ext.groom?.guardianName,
  guardianSpouseTitle: ext.groom?.guardianSpouseTitle,
  guardianSpouseName: ext.groom?.guardianSpouseName,
  guardianRelation: ext.groom?.guardianRelation,
}
```

`invitationToDbUpdate()`는 변경 불필요 — 기존 spread 패턴이 새 필드를 자동으로 extendedData로 분리.

---

## Step 5: API 수정 (`app/api/invitations/[id]/route.ts`)

### GET 핸들러
```typescript
import { dbRecordToInvitation } from '@/lib/invitation-utils';

// line 46 변경
return NextResponse.json({
  success: true,
  data: dbRecordToInvitation(invitation as any),
});
```

### PUT 핸들러
기존 인라인 필드 매핑(line 111-184)을 `invitationToDbUpdate()` 사용으로 교체.
extendedData deep merge 로직은 유지하되, `invitationToDbUpdate()`가 생성한 extendedData와 기존 DB의 extendedData를 merge.

---

## Step 6: BasicInfoTab 재작성 (`components/editor/tabs/BasicInfoTab.tsx`)

### UI 구조 (신랑/신부 각각)

```
┌─ 신랑 ─────────────────────────────────────┐
│ [이름 *]  [연락처]                           │
│                                              │
│ ─ 가족 표기 방식 ──────────────────────────   │
│ (●) 부모님 실명 표기                          │
│ ( ) 한 분만 표기                              │
│ ( ) 부·모 표기                                │
│ ( ) 조부모님                                  │
│ ( ) 대리 호주                                 │
│ ( ) 본인 이름만                               │
│                                              │
│ [안내 메시지 - amber 배경]                    │
│                                              │
│ ─ 모드별 조건부 필드 ──────────────────────   │
│ (full_names)                                 │
│   [아버지: ________] [☐ 故]                  │
│   [어머니: ________] [☐ 故]                  │
│                                              │
│ (single_parent)                              │
│   ( ) 아버지만  ( ) 어머니만                  │
│   [선택한 분: ________] [☐ 故]               │
│                                              │
│ (grandparents)                               │
│   [조부: ________]  [조모: ________]         │
│                                              │
│ (guardian)                                   │
│   [호칭: ____] [이름: ____]                  │
│   [배우자 호칭: ____] [배우자 이름: ____]    │
│   [관계: ____ (예: 조카)]                    │
│                                              │
│ [관계 select: 장남/차남/삼남/막내]            │
│ (self_only, grandparents, guardian에서는 숨김) │
└──────────────────────────────────────────────┘
```

### 구현 방식
- `FamilyModeSelector` 서브 컴포넌트 (라디오 버튼 그룹)
- `ParentNameWithDeceased` 서브 컴포넌트 (이름 + 故 체크박스)
- `PersonSection` 래퍼로 모드별 조건부 렌더링
- `isDeceased` 중첩 객체 업데이트 핸들러

### 민감한 문구
- "한부모 가족" → "한 분만 표기"
- "부·모 표기" → "실명을 공개하지 않음"
- 양부모 故 시 → "본인 이름만 표기를 권장합니다"

---

## Step 7: PreviewPanel 매핑 (`components/editor/PreviewPanel.tsx`)

`previewData` useMemo의 groom/bride에 새 필드 추가:

```typescript
familyDisplayMode: invitation.groom?.familyDisplayMode || 'full_names',
singleParentType: invitation.groom?.singleParentType,
grandparentName: invitation.groom?.grandparentName,
// ... 나머지 필드
```

---

## Step 8: 템플릿 4개 수정

모든 템플릿에서 동일한 패턴 교체:

**Before** (4개 파일 공통):
```tsx
{data.groom.relation
  ? `${data.groom.fatherName}·${data.groom.motherName}의 ${data.groom.relation}`
  : "신랑"}
```

**After**:
```tsx
import { formatFamilyName } from '@/lib/utils/family-display';
// ...
{formatFamilyName(data.groom)}
```

각 파일에서 groom/bride 두 곳씩 교체.

계좌 섹션: `getParentAccountLabel()`로 부모 라벨 조건부 표시 + self_only/grandparents/guardian 모드에서 부모 계좌 숨김.

---

## Step 9: AccountTab 수정 (`components/editor/tabs/AccountTab.tsx`)

`familyDisplayMode`에 따라:
- `self_only` → 부모님 계좌 섹션 숨김
- `single_parent` → 해당 부모만 표시
- `grandparents`, `guardian` → 부모 계좌 숨김

---

## 하위 호환성

- `familyDisplayMode` 기본값 `'full_names'` → 기존 청첩장 영향 없음
- 새 필드 전부 optional → DB 마이그레이션 불필요 (기존 extendedData JSONB에 저장)
- `formatFamilyName()`이 `full_names` + 양부모일 때 기존 템플릿과 동일 출력

---

## 검증 방법

1. **에디터 테스트**: 각 모드 선택 → 필드 입력 → 미리보기에서 실시간 반영 확인
2. **저장/로드 테스트**: 모드 설정 후 페이지 새로고침 → 데이터 유지 확인 (GET/PUT 수정 검증)
3. **하위 호환성**: 기존 청첩장 열기 → familyDisplayMode 없이도 정상 렌더링
4. **시나리오 테스트**:
   - 양부모 (기본) → `홍판서·김씨의 장남 홍길동`
   - 아버지 故 → `故 홍판서·김씨의 장남 홍길동`
   - 양부모 故 → `故 홍판서·故 김씨의 자 홍길동`
   - 한 분만 (어머니) → `김씨의 장남 홍길동`
   - 부·모 → `부·모의 장남 홍길동`
   - 조부모 → `조부 홍대감·조모 박씨의 손자 홍길동`
   - 대리 호주 → `백부 홍판서·백모 김씨의 조카 홍길동`
   - 본인만 → `홍길동`
5. **4개 템플릿 모두** 동일하게 동작하는지 확인
6. **계좌 탭**: self_only 모드에서 부모 계좌 숨겨지는지 확인
7. **TabHeader 저장 상태**: 필드 수정 → "저장 중..." 표시 → 2초 후 "저장됨" 체크 표시 → 모든 7개 탭에서 동작 확인
