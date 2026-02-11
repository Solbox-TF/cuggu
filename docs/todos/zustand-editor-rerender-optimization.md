# Zustand 에디터 스토어 리렌더링 최적화

> 등록일: 2026-02-11
> 우선순위: 중간 (성능 이슈 체감 시 착수)

## 배경

`stores/invitation-editor.ts` 하나의 스토어가 폼 데이터 + UI 상태 + 저장 로직을 모두 담당.
19개 컴포넌트 중 17개가 셀렉터 없이 전체 구독 → 어떤 필드가 바뀌어도 거의 전체 리렌더.

## 1단계: 셀렉터 도입 (우선)

난이도 낮음, 효과 큼. 기존 스토어 구조 변경 없이 소비 측만 수정.

### 1-A. 액션만 쓰는 컴포넌트

| 파일 | 현재 | 개선 |
|---|---|---|
| `Sidebar.tsx` | `const { setActiveTab } = useInvitationEditor()` | `useInvitationEditor(s => s.setActiveTab)` |
| `TabletTabStrip.tsx` | `const { setActiveTab, getEnabledSections } = ...` | 각각 셀렉터 |
| `StepNavigation.tsx` | `const { activeTab, setActiveTab, getEnabledSections } = ...` | `useShallow` |

### 1-B. 단일 필드 컴포넌트

| 파일 | 접근 필드 | 셀렉터 |
|---|---|---|
| `GreetingTab.tsx` | `invitation.content?.greeting` | `s => s.invitation.content?.greeting` |
| `MobileGreetingTab.tsx` | 동일 | 동일 |
| `MobileEditorShell.tsx` | 이미 셀렉터 사용 중 | 유지 |

### 1-C. 복합 필드 — `useShallow` 적용

```tsx
import { useShallow } from 'zustand/react/shallow';

// 예: editor/[id]/page.tsx
const { isSaving, lastSaved, saveError } = useInvitationEditor(
  useShallow((s) => ({
    isSaving: s.isSaving,
    lastSaved: s.lastSaved,
    saveError: s.saveError,
  }))
);
```

대상: `editor/[id]/page.tsx`, `MobileTopBar.tsx`, `SectionPanel.tsx`

## 2단계: 스토어 분리

현재 단일 스토어를 3개로 분리.

```
stores/
├── editor-form.ts      ← invitation, updateInvitation, toggleSection
├── editor-ui.ts        ← activeTab, setActiveTab, enabledSections, validation
└── editor-save.ts      ← isSaving, lastSaved, save(), retry
```

스토어 간 참조는 `getState()`로 구독 없이 처리:

```tsx
// editor-save.ts
import { useEditorForm } from './editor-form';

save: async () => {
  const invitation = useEditorForm.getState().invitation;
  // ...
}
```

## 3단계: 구조적 개선 (선택)

### immer 미들웨어

중첩 객체 불변성 자동 보장 → 셀렉터 변경 감지 정확도 향상.

```tsx
import { immer } from 'zustand/middleware/immer';

const useEditorForm = create<EditorFormStore>()(
  immer((set) => ({
    updateInvitation: (updater) => {
      set((state) => { Object.assign(state.invitation, updater); });
    },
  }))
);
```

### 모듈 스코프 타이머 제거

`autoSaveTimer`, `retryTimer`를 `subscribeWithSelector`로 외부 구독 방식으로 전환:

```tsx
useEditorForm.subscribe(
  (s) => s.invitation,
  debounce(() => useEditorSave.getState().save(), 2000),
  { equalityFn: shallow }
);
```

## 실행 순서 요약

| 단계 | 효과 | 난이도 | 착수 조건 |
|---|---|---|---|
| 1단계 셀렉터 | 즉시 체감 | 낮음 | 바로 가능 |
| 2단계 스토어 분리 | 구조적 개선 | 중간 | 에디터 복잡도 증가 시 |
| 3단계 immer + 타이머 | 안정성 | 중간 | 2단계와 함께 |
