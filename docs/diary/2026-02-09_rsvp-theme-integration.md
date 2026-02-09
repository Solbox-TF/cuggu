# 2026-02-09 | RSVP 폼 테마 연동

> 브랜치: feat/ai-theme-generation
> 상태: 구현 대기

---

## 배경

AI 테마 생성 파이프라인이 동작하지만, RSVP 폼이 `rose-600` 하드코딩이라 테마와 겉돌게 됨.
RSVP 전용 필드 4개를 SerializableTheme에 추가하고, 기존 테마 속성(`headingClass`, `labelClass`, `iconColor`)을 재활용하여 모든 UI를 테마에 연동.

### 현재 하드코딩 현황 (RSVPForm.tsx)

| 요소 | 현재 클래스 | 문제 |
|------|------------|------|
| 입력 필드 focus | `focus:ring-rose-500` | rose 고정 |
| 선택 버튼 (active) | `bg-rose-600 text-white` | rose 고정 |
| 미선택 버튼 | `bg-stone-100 text-stone-600 hover:bg-stone-200` | stone 고정 |
| 제출 버튼 | `bg-rose-600 hover:bg-rose-700 text-white` | rose 고정 |
| 라벨 | `text-sm font-medium text-stone-700` | stone 고정 |
| 필수 표시 (*) | `text-rose-500` | rose 고정 |
| 섹션 제목 | `text-lg font-medium text-stone-800` | stone 고정 |

### 유지하는 것 (변경 불필요)

| 요소 | 이유 |
|------|------|
| 에러 메시지 `text-red-500` | 범용 UX 색상 |
| 성공 아이콘 `bg-green-100`/`text-green-600` | 범용 UX 색상 |
| 길찾기 버튼 | 카카오/네이버/티맵 브랜드색 + SVG 아이콘 |
| 갤러리 라이트박스 | 다크 오버레이 범용 |
| 지도 에러 상태 | 중립 stone 색상 |

---

## 변경 사항

### 1. 타입 추가 — `lib/templates/types.ts`

SerializableTheme에 D-Day 달력 필드 뒤, cover 앞에 추가:

```typescript
// ── RSVP 폼 ──
rsvpInputClass?: string;      // 입력 필드 border + focus ring
rsvpActiveClass?: string;     // 선택된 참석 버튼
rsvpInactiveClass?: string;   // 미선택 참석 버튼
rsvpSubmitClass?: string;     // 제출 버튼
```

**예시값** (classic 테마):
```
rsvpInputClass:    "border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
rsvpActiveClass:   "bg-amber-600 text-white"
rsvpInactiveClass: "bg-amber-50 text-amber-800 hover:bg-amber-100"
rsvpSubmitClass:   "bg-amber-600 hover:bg-amber-700 text-white"
```

### 2. Zod 스키마 — `schemas/theme.ts`

동일 위치에 optional string 4개:

```typescript
// RSVP 폼
rsvpInputClass: z.string().optional(),
rsvpActiveClass: z.string().optional(),
rsvpInactiveClass: z.string().optional(),
rsvpSubmitClass: z.string().optional(),
```

### 3. 빌트인 테마 6개 — `lib/templates/themes.ts`

각 테마의 D-Day 필드 뒤에 RSVP 블록 추가. 테마 accent 색상 기반:

| 테마 | accent | rsvpActiveClass | rsvpSubmitClass |
|------|--------|-----------------|-----------------|
| classic | amber | `bg-amber-600 text-white` | `bg-amber-600 hover:bg-amber-700 text-white` |
| modern | emerald | `bg-emerald-600 text-white` | `bg-emerald-600 hover:bg-emerald-700 text-white` |
| minimal | stone/zinc | `bg-zinc-900 text-white` | `bg-zinc-900 hover:bg-zinc-800 text-white` |
| floral | rose | `bg-rose-500 text-white` | `bg-rose-500 hover:bg-rose-600 text-white` |
| elegant | amber/slate | `bg-amber-500 text-white` | `bg-amber-600 hover:bg-amber-700 text-white` |
| natural | emerald | `bg-emerald-500 text-white` | `bg-emerald-500 hover:bg-emerald-600 text-white` |

**전체 필드값:**

```typescript
// classic
rsvpInputClass: 'border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent',
rsvpActiveClass: 'bg-amber-600 text-white',
rsvpInactiveClass: 'bg-amber-50 text-amber-800 hover:bg-amber-100',
rsvpSubmitClass: 'bg-amber-600 hover:bg-amber-700 text-white',

// modern
rsvpInputClass: 'border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
rsvpActiveClass: 'bg-emerald-600 text-white',
rsvpInactiveClass: 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
rsvpSubmitClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',

// minimal
rsvpInputClass: 'border-stone-300 focus:ring-1 focus:ring-stone-900 focus:border-transparent',
rsvpActiveClass: 'bg-zinc-900 text-white',
rsvpInactiveClass: 'bg-stone-100 text-stone-500 hover:bg-stone-200',
rsvpSubmitClass: 'bg-zinc-900 hover:bg-zinc-800 text-white',

// floral
rsvpInputClass: 'border-rose-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent',
rsvpActiveClass: 'bg-rose-500 text-white',
rsvpInactiveClass: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
rsvpSubmitClass: 'bg-rose-500 hover:bg-rose-600 text-white',

// elegant
rsvpInputClass: 'border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent',
rsvpActiveClass: 'bg-amber-500 text-white',
rsvpInactiveClass: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
rsvpSubmitClass: 'bg-amber-600 hover:bg-amber-700 text-white',

// natural
rsvpInputClass: 'border-emerald-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent',
rsvpActiveClass: 'bg-emerald-500 text-white',
rsvpInactiveClass: 'bg-stone-100 text-stone-600 hover:bg-stone-200',
rsvpSubmitClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
```

### 4. 컴포넌트 연동

#### 4-1. `components/templates/sections/RsvpSectionWrapper.tsx`

이미 `theme` prop 받고 있음. RSVPSection에 전달만 추가:

```diff
- <RSVPSection invitationId={data.id} fields={data.settings.rsvpFields} />
+ <RSVPSection invitationId={data.id} fields={data.settings.rsvpFields} theme={theme} />
```

#### 4-2. `components/rsvp/RSVPSection.tsx`

`theme?: SerializableTheme` prop 추가, 제목/설명에 기존 테마 필드 재활용:

```typescript
import type { SerializableTheme } from "@/lib/templates/types";

interface RSVPSectionProps {
  invitationId: string;
  fields?: RSVPFormFields;
  theme?: SerializableTheme;
  className?: string;
}

export function RSVPSection({ invitationId, fields, theme, className = "" }: RSVPSectionProps) {
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <h2 className={theme?.headingClass ?? "text-lg font-medium text-stone-800 mb-2"}>
          참석 여부
        </h2>
        <p className={theme?.labelClass ?? "text-sm text-stone-500"}>
          참석 여부를 알려주시면 감사하겠습니다
        </p>
      </div>
      <RSVPForm invitationId={invitationId} fields={fields} theme={theme} />
    </div>
  );
}
```

**주의**: `headingClass`를 RSVP 제목에 쓰면 `mb-8 md:mb-12` 같은 마진이 포함될 수 있음.
→ RSVP 제목은 아래 `mb-6`이 div에 있으므로 큰 문제 없음. 필요하면 `mb` 제거 로직 추가 가능하지만 오버엔지니어링.

#### 4-3. `components/rsvp/RSVPForm.tsx`

`theme?: SerializableTheme` prop 추가. 치환 맵:

| 현재 하드코딩 | 테마 적용 | fallback |
|--------------|----------|----------|
| `border-stone-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent` | `theme?.rsvpInputClass` | 현재값 유지 |
| `bg-rose-600 text-white` (선택 버튼) | `theme?.rsvpActiveClass` | `"bg-rose-600 text-white"` |
| `bg-stone-100 text-stone-600 hover:bg-stone-200` (미선택) | `theme?.rsvpInactiveClass` | `"bg-stone-100 text-stone-600 hover:bg-stone-200"` |
| `bg-rose-600 hover:bg-rose-700 text-white` (제출) | `theme?.rsvpSubmitClass` | `"bg-rose-600 hover:bg-rose-700 text-white"` |
| `text-sm font-medium text-stone-700` (라벨) | `theme?.labelClass` | 현재값 유지 |
| `text-rose-500` (필수 *) | `theme?.iconColor` | `"text-rose-500"` |

**변경 안 하는 것:**
- `text-red-500` (에러) — 범용 UX
- `bg-green-100`/`text-green-600` (성공 아이콘) — 범용 UX
- `text-stone-900`/`text-stone-500` (성공 메시지) — 테마 적용 시 오히려 성공 상태가 무너질 수 있음. 유지.

**구현 패턴:**

```typescript
// 상수로 정의 (렌더 밖)
const DEFAULT_INPUT = "border-stone-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent";
const DEFAULT_ACTIVE = "bg-rose-600 text-white";
const DEFAULT_INACTIVE = "bg-stone-100 text-stone-600 hover:bg-stone-200";
const DEFAULT_SUBMIT = "bg-rose-600 hover:bg-rose-700 text-white";
const DEFAULT_LABEL = "text-sm font-medium text-stone-700";
const DEFAULT_REQUIRED = "text-rose-500";

// 컴포넌트 내부
const inputClass = theme?.rsvpInputClass ?? DEFAULT_INPUT;
const activeClass = theme?.rsvpActiveClass ?? DEFAULT_ACTIVE;
const inactiveClass = theme?.rsvpInactiveClass ?? DEFAULT_INACTIVE;
const submitClass = theme?.rsvpSubmitClass ?? DEFAULT_SUBMIT;
const labelCls = theme?.labelClass ?? DEFAULT_LABEL;
const requiredCls = theme?.iconColor ?? DEFAULT_REQUIRED;
```

### 5. AI 프롬프트 — `lib/ai/theme-prompt.ts`

#### DESIGN RULES 끝에 추가:

```
10. ALWAYS provide D-Day calendar fields (calendarAccentColor, calendarTodayColor, countdownNumberClass, etc.) using your accent color
11. ALWAYS provide RSVP form fields (rsvpInputClass, rsvpActiveClass, rsvpInactiveClass, rsvpSubmitClass) using your accent color
```

#### KEY FIELDS EXPLAINED에 추가:

```
- rsvpInputClass: form input styling (border + focus ring). Example: "border-rose-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
- rsvpActiveClass: selected attendance button. Example: "bg-rose-600 text-white"
- rsvpInactiveClass: unselected attendance button. Example: "bg-rose-50 text-rose-700 hover:bg-rose-100"
- rsvpSubmitClass: submit button. Example: "bg-rose-600 hover:bg-rose-700 text-white"
```

**예시 테마 자동 반영**: `JSON.stringify(classicTheme)` / `JSON.stringify(floralTheme)`를 사용 중이므로 빌트인 테마에 필드 추가하면 AI 프롬프트 예시에 자동 포함됨.

### 6. Safelist

**변경 불필요**. 기존 safelist이 이미 모든 클래스 커버:
- `focus:ring-{color}-{shade}` → expandedClasses
- `hover:bg-{color}-{shade}` → expandedClasses
- `focus:border-transparent` → common utilities
- `focus:ring-1`, `focus:ring-2` → common utilities

---

## 작업 순서

1. `types.ts` + `schemas/theme.ts` — 타입 기반 작업 (동시)
2. `themes.ts` — 6개 빌트인 테마에 RSVP 4필드 추가
3. `RsvpSectionWrapper.tsx` → `RSVPSection.tsx` → `RSVPForm.tsx` — 컴포넌트 연동
4. `theme-prompt.ts` — AI 프롬프트 업데이트
5. `npx tsc --noEmit` — 타입 체크

## 검증 체크리스트

- [ ] 빌트인 테마 6개 전환 시 RSVP 폼 색상이 테마 accent와 일치
- [ ] `POST /api/ai/theme` 호출 → 생성된 테마에 rsvp 4필드 포함
- [ ] RSVP 필드 없는 기존 저장 테마에서 fallback(rose-600) 정상 동작
- [ ] TypeScript 빌드 에러 없음 (`npx tsc --noEmit`)

## 영향 범위

| 파일 | 변경 내용 |
|------|----------|
| `lib/templates/types.ts` | 필드 4개 추가 |
| `schemas/theme.ts` | Zod 필드 4개 추가 |
| `lib/templates/themes.ts` | 6개 테마에 RSVP 블록 추가 |
| `components/templates/sections/RsvpSectionWrapper.tsx` | theme prop 전달 |
| `components/rsvp/RSVPSection.tsx` | theme prop + 헤딩/라벨 연동 |
| `components/rsvp/RSVPForm.tsx` | theme prop + 폼 요소 전체 연동 |
| `lib/ai/theme-prompt.ts` | DESIGN RULES + KEY FIELDS 추가 |

## 리스크

- **낮음**: optional 필드 + fallback이라 기존 저장 테마 깨짐 없음
- **낮음**: safelist 변경 없음
- **낮음**: DB 마이그레이션 없음 (customTheme은 JSON 필드)
