# 청첩장 만들기 페이지 구현 계획 (Figma 스타일)

> 작성일: 2026-02-04
> 업데이트: 2026-02-04 (Figma 스타일 편집기로 변경)
>
> 청첩장 생성부터 공유까지 전체 플로우 설계 - 실시간 미리보기 통합 편집기

## 목차

1. [현재 상태 분석](#현재-상태-분석)
2. [설계 철학: Figma 스타일](#설계-철학-figma-스타일)
3. [레이아웃 구조](#레이아웃-구조)
4. [구현 계획](#구현-계획)
5. [파일 구조](#파일-구조)
6. [API 명세](#api-명세)

---

## 현재 상태 분석

### ✅ 이미 구현된 것

1. **ClassicTemplate.tsx** (322줄)
   - 완성된 Classic 템플릿 컴포넌트
   - Framer Motion 애니메이션
   - 반응형 디자인 (모바일 우선)

2. **schemas/invitation.ts** (467줄)
   - 상세한 청첩장 스키마
   - PersonSchema (신랑/신부 정보)
   - VenueSchema (예식장 정보)
   - GallerySchema (갤러리)
   - SettingsSchema (설정)
   - CreateInvitationSchema (생성 시 필수 필드)
   - UpdateInvitationSchema (수정 시)

3. **lib/utils/date.ts**
   - 날짜 포맷팅 유틸
   - `formatWeddingDate()`, `formatWeddingTime()`, `formatWeddingDateTime()`

4. **app/templates/preview/page.tsx**
   - 템플릿 미리보기 페이지 (개발용)

### ❌ 필요한 것

1. Figma 스타일 통합 편집기
2. 실시간 미리보기 패널
3. 청첩장 CRUD API
4. 청첩장 목록 페이지
5. 공개 청첩장 페이지 (/inv/[id])

---

## 설계 철학: Figma 스타일

### 왜 Figma 스타일인가?

**멀티 스텝 방식의 문제점:**
- 뒤로 가기 불편
- 전체 파악 어려움
- 수정할 때마다 단계 이동 필요
- 미리보기가 마지막에만 가능

**Figma 스타일의 장점:**
- ✅ 한눈에 전체 파악
- ✅ 자유로운 편집 순서
- ✅ **실시간 미리보기** (입력 즉시 반영)
- ✅ 전문적이고 현대적인 UX
- ✅ 수정 시 매우 편리

### 핵심 원칙

1. **한 화면에 모든 것**
   - 좌측: 탭 메뉴
   - 중앙: 편집 폼
   - 우측: 실시간 미리보기

2. **즉각적인 피드백**
   - 텍스트 입력 → 즉시 미리보기 반영
   - 템플릿 변경 → 즉시 렌더링
   - 색상/폰트 변경 → 즉시 적용

3. **자동 저장**
   - 2초 debounce
   - 저장 상태 표시
   - 오류 시 로컬 스토리지 백업

---

## 레이아웃 구조

### 전체 구조

```
┌───────────────────────────────────────────────────────────────┐
│ [🎨 Cuggu] 홍길동♥김영희 청첩장    [💾 저장됨] [👁️] [🔗공유] │ ← TopBar
├─────┬────────────────────────────────┬──────────────────────┤
│ 📋  │                                │                      │
│템플릿│                                │    📱 미리보기       │
│     │       편집 영역                 │   ┌──────────┐      │
│ 👫  │                                │   │          │      │
│정보 │  [신랑 이름: 홍길동]            │   │   실시간  │      │
│     │  [신부 이름: 김영희]            │   │   렌더링  │      │
│ 💒  │  [아버지: 홍판서]               │   │          │      │
│예식 │  [어머니: 김씨]                 │   │   ✨     │      │
│     │                                │   │  홍길동♥  │      │
│ 💬  │                                │   │  김영희   │      │
│인사 │                                │   │          │      │
│     │                                │   │ 2026.06  │      │
│ 🖼️  │                                │   │          │      │
│갤러리│                                │   └──────────┘      │
│     │                                │                      │
│ 💰  │                                │  [줌: 100%] [📱💻]  │
│계좌 │                                │  [새 탭에서 보기]    │
│     │                                │                      │
│ ⚙️  │                                │                      │
│설정 │                                │                      │
└─────┴────────────────────────────────┴──────────────────────┘
```

### 1. 상단 메뉴바 (TopBar)

```tsx
┌──────────────────────────────────────────────────────┐
│ [🎨 Cuggu]  홍길동♥김영희 청첩장                      │
│                                                      │
│         [💾 저장됨] [👁️ 미리보기] [🔗 공유]          │
│         [← 목록으로]                                  │
└──────────────────────────────────────────────────────┘
```

**구현:**
```tsx
// components/editor/TopBar.tsx
export function TopBar({ invitation, onSave, isSaving, lastSaved }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* 좌측: 로고 + 제목 */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-xl font-bold text-pink-500">
          🎨 Cuggu
        </Link>
        <div className="text-sm">
          <input
            type="text"
            value={`${invitation.groomName || '신랑'}♥${invitation.brideName || '신부'} 청첩장`}
            className="font-medium text-gray-900 bg-transparent border-none outline-none"
            readOnly
          />
        </div>
      </div>

      {/* 우측: 액션 버튼 */}
      <div className="flex items-center gap-3">
        {/* 저장 상태 */}
        <div className="text-sm text-gray-500">
          {isSaving ? (
            <span className="flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              저장 중...
            </span>
          ) : lastSaved ? (
            <span>💾 저장됨 ({formatTimeAgo(lastSaved)})</span>
          ) : null}
        </div>

        {/* 미리보기 */}
        <button
          onClick={() => window.open(`/inv/${invitation.id}`, '_blank')}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          👁️ 미리보기
        </button>

        {/* 공유 */}
        <button
          onClick={() => handleShare(invitation.id)}
          className="px-4 py-2 text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 rounded-lg"
        >
          🔗 공유
        </button>

        {/* 목록으로 */}
        <Link
          href="/dashboard/invitations"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          ← 목록으로
        </Link>
      </div>
    </header>
  );
}
```

### 2. 좌측 사이드바 (Sidebar)

```tsx
┌─────────────────┐
│ 📋 템플릿 선택   │ ← 탭
├─────────────────┤
│ 👫 기본 정보  ✓ │ ← 완료 표시
├─────────────────┤
│ 💒 예식 정보  ● │ ← 활성 탭
├─────────────────┤
│ 💬 인사말       │
├─────────────────┤
│ 🖼️ 갤러리       │
├─────────────────┤
│ 💰 계좌 정보  🔴│ ← 미입력 (빨간 점)
├─────────────────┤
│ ⚙️ 설정         │
└─────────────────┘
```

**구현:**
```tsx
// components/editor/Sidebar.tsx
const tabs = [
  { id: 'template', label: '템플릿 선택', icon: '📋' },
  { id: 'basic', label: '기본 정보', icon: '👫', required: true },
  { id: 'venue', label: '예식 정보', icon: '💒', required: true },
  { id: 'greeting', label: '인사말', icon: '💬' },
  { id: 'gallery', label: '갤러리', icon: '🖼️' },
  { id: 'account', label: '계좌 정보', icon: '💰' },
  { id: 'settings', label: '설정', icon: '⚙️' },
];

export function Sidebar({ activeTab, onTabChange, invitation, validation }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <nav className="p-2">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const isCompleted = validation[tab.id]?.completed;
          const hasError = validation[tab.id]?.hasError;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                ${isActive
                  ? 'bg-pink-50 text-pink-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="flex-1">{tab.label}</span>

              {/* 상태 표시 */}
              {isCompleted && <span className="text-green-500">✓</span>}
              {hasError && tab.required && <span className="text-red-500">●</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
```

### 3. 중앙 편집 영역 (EditorPanel)

선택된 탭에 따라 폼 표시:

```tsx
// components/editor/EditorPanel.tsx
export function EditorPanel({ activeTab, invitation, onChange }) {
  const renderTab = () => {
    switch (activeTab) {
      case 'template':
        return <TemplateTab value={invitation.templateId} onChange={onChange} />;
      case 'basic':
        return <BasicInfoTab data={invitation} onChange={onChange} />;
      case 'venue':
        return <VenueTab data={invitation.wedding} onChange={onChange} />;
      case 'greeting':
        return <GreetingTab value={invitation.content?.greeting} onChange={onChange} />;
      case 'gallery':
        return <GalleryTab images={invitation.gallery?.images} onChange={onChange} />;
      case 'account':
        return <AccountTab data={invitation} onChange={onChange} />;
      case 'settings':
        return <SettingsTab data={invitation.settings} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {renderTab()}
      </div>
    </div>
  );
}
```

**각 탭 예시:**

#### 템플릿 선택 탭
```tsx
// components/editor/tabs/TemplateTab.tsx
export function TemplateTab({ value, onChange }) {
  const templates = [
    { id: 'classic', name: 'Classic', category: 'CLASSIC', tier: 'FREE', thumbnail: '/templates/classic.png' },
    { id: 'modern', name: 'Modern', category: 'MODERN', tier: 'FREE', thumbnail: '/templates/modern.png' },
    { id: 'vintage', name: 'Vintage', category: 'VINTAGE', tier: 'PREMIUM', thumbnail: '/templates/vintage.png' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">템플릿 선택</h2>
        <p className="text-gray-600">청첩장 스타일을 선택하세요</p>
      </div>

      {/* 무료 템플릿 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">무료 템플릿</h3>
        <div className="grid grid-cols-2 gap-4">
          {templates.filter(t => t.tier === 'FREE').map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={value === template.id}
              onClick={() => onChange({ templateId: template.id })}
            />
          ))}
        </div>
      </div>

      {/* 프리미엄 템플릿 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">프리미엄 템플릿 🔒</h3>
        <div className="grid grid-cols-2 gap-4">
          {templates.filter(t => t.tier === 'PREMIUM').map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={value === template.id}
              onClick={() => onChange({ templateId: template.id })}
              isPremium
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### 기본 정보 탭
```tsx
// components/editor/tabs/BasicInfoTab.tsx
export function BasicInfoTab({ data, onChange }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">기본 정보</h2>
        <p className="text-gray-600">신랑과 신부의 정보를 입력하세요</p>
      </div>

      {/* 신랑 정보 */}
      <div className="bg-white rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">신랑 정보</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이름 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.groom?.name || ''}
            onChange={(e) => onChange({
              groom: { ...data.groom, name: e.target.value }
            })}
            placeholder="홍길동"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              아버지
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.groom?.fatherName || ''}
                onChange={(e) => onChange({
                  groom: { ...data.groom, fatherName: e.target.value }
                })}
                placeholder="홍판서"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={data.groom?.isDeceased?.father}
                  onChange={(e) => onChange({
                    groom: {
                      ...data.groom,
                      isDeceased: { ...data.groom?.isDeceased, father: e.target.checked }
                    }
                  })}
                  className="rounded"
                />
                故
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              어머니
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={data.groom?.motherName || ''}
                onChange={(e) => onChange({
                  groom: { ...data.groom, motherName: e.target.value }
                })}
                placeholder="김씨"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
              />
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={data.groom?.isDeceased?.mother}
                  onChange={(e) => onChange({
                    groom: {
                      ...data.groom,
                      isDeceased: { ...data.groom?.isDeceased, mother: e.target.checked }
                    }
                  })}
                  className="rounded"
                />
                故
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              관계
            </label>
            <select
              value={data.groom?.relation || ''}
              onChange={(e) => onChange({
                groom: { ...data.groom, relation: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">선택</option>
              <option value="장남">장남</option>
              <option value="차남">차남</option>
              <option value="삼남">삼남</option>
              <option value="막내">막내</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              연락처 (선택)
            </label>
            <input
              type="tel"
              value={data.groom?.phone || ''}
              onChange={(e) => onChange({
                groom: { ...data.groom, phone: e.target.value }
              })}
              placeholder="010-1234-5678"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 신부 정보 (동일 구조) */}
      <div className="bg-white rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">신부 정보</h3>
        {/* ... 신랑과 동일한 폼 구조 ... */}
      </div>
    </div>
  );
}
```

### 4. 우측 미리보기 (PreviewPanel)

```tsx
// components/editor/PreviewPanel.tsx
'use client';

import { useState, useMemo } from 'react';
import { ClassicTemplate } from '@/components/templates/ClassicTemplate';
import { ZoomIn, ZoomOut, Smartphone, Monitor, ExternalLink } from 'lucide-react';

export function PreviewPanel({ invitation }) {
  const [zoom, setZoom] = useState(100);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');

  // 미리보기용 데이터 변환 (기본값 채우기)
  const previewData = useMemo(() => {
    return {
      id: invitation.id || 'preview',
      userId: invitation.userId || 'user',
      templateId: invitation.templateId || 'classic',

      groom: invitation.groom || { name: '신랑' },
      bride: invitation.bride || { name: '신부' },

      wedding: invitation.wedding || {
        date: new Date().toISOString(),
        venue: {
          name: '예식장',
          address: '주소를 입력하세요'
        },
      },

      content: invitation.content || { greeting: '' },
      gallery: invitation.gallery || { images: [] },
      settings: invitation.settings || {},

      status: 'DRAFT',
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Invitation;
  }, [invitation]);

  // 템플릿 선택
  const TemplateComponent = getTemplateComponent(invitation.templateId);

  return (
    <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* 컨트롤 */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">실시간 미리보기</span>

          {/* 디바이스 전환 */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded transition-colors ${
                device === 'mobile'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="모바일 뷰"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded transition-colors ${
                device === 'desktop'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-200'
              }`}
              title="데스크톱 뷰"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 줌 조절 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(50, zoom - 25))}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={zoom <= 50}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="50"
            max="150"
            step="25"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />

          <button
            onClick={() => setZoom(Math.min(150, zoom + 25))}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={zoom >= 150}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="text-sm text-gray-600 w-12 text-right">
            {zoom}%
          </span>
        </div>
      </div>

      {/* 미리보기 영역 */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div
          className={`mx-auto bg-white shadow-lg transition-all origin-top ${
            device === 'mobile' ? 'max-w-[375px]' : 'max-w-full'
          }`}
          style={{
            transform: `scale(${zoom / 100})`,
            marginBottom: zoom < 100 ? '0' : `${(zoom - 100) * 5}px`,
          }}
        >
          {/* 템플릿 렌더링 */}
          <TemplateComponent data={previewData} isPreview />
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => window.open(`/inv/${invitation.id}`, '_blank')}
          disabled={!invitation.id}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          새 탭에서 전체 보기
        </button>
      </div>
    </aside>
  );
}

// 템플릿 컴포넌트 매핑
function getTemplateComponent(templateId: string) {
  switch (templateId) {
    case 'classic':
      return ClassicTemplate;
    case 'modern':
      return ModernTemplate;
    case 'vintage':
      return VintageTemplate;
    case 'floral':
      return FloralTemplate;
    case 'minimal':
      return MinimalTemplate;
    default:
      return ClassicTemplate;
  }
}
```

---

## 구현 계획

### Phase 1: 기반 구축 (2-3일)

#### Day 1: API 구현
- [ ] POST /api/invitations (생성)
- [ ] GET /api/invitations (목록)
- [ ] GET /api/invitations/[id] (단건 조회)
- [ ] PUT /api/invitations/[id] (수정)
- [ ] DELETE /api/invitations/[id] (삭제)
- [ ] 테스트 데이터 생성

#### Day 2: 목록 페이지
- [ ] InvitationList 컴포넌트
- [ ] InvitationCard 컴포넌트
- [ ] EmptyState 컴포넌트
- [ ] Pagination 컴포넌트
- [ ] API 연동

#### Day 3: 상태 관리
- [ ] Zustand store 설정
- [ ] 자동 저장 로직 (debounce)
- [ ] 검증 로직

### Phase 2: 편집기 UI (3-4일)

#### Day 1: 레이아웃
- [ ] EditorLayout (전체 구조)
- [ ] TopBar 컴포넌트
- [ ] Sidebar 컴포넌트
- [ ] PreviewPanel 기본 구조

#### Day 2-3: 편집 탭들
- [ ] TemplateTab (템플릿 선택)
- [ ] BasicInfoTab (기본 정보)
- [ ] VenueTab (예식 정보)
- [ ] GreetingTab (인사말)
- [ ] GalleryTab (갤러리)
- [ ] AccountTab (계좌 정보)
- [ ] SettingsTab (설정)

#### Day 4: 실시간 미리보기
- [ ] 템플릿 렌더링 로직
- [ ] 줌 컨트롤
- [ ] 디바이스 전환
- [ ] 최적화 (useMemo, useCallback)

### Phase 3: 통합 & 공개 페이지 (2일)

#### Day 1: 통합 테스트
- [ ] API 연동
- [ ] 자동 저장 테스트
- [ ] 검증 테스트
- [ ] 버그 수정

#### Day 2: 공개 페이지
- [ ] /inv/[id] 페이지
- [ ] 비밀번호 보호
- [ ] 조회수 증가
- [ ] 공유 기능

---

## 파일 구조

```
app/
├── dashboard/
│   ├── layout.tsx                      # DashboardNav 있는 기본 layout
│   └── invitations/
│       ├── page.tsx                    # 목록 페이지
│       └── [id]/
│           └── edit/
│               ├── layout.tsx          # ⭐ Figma 스타일 layout
│               └── page.tsx            # 편집기 페이지
│
├── inv/[id]/
│   └── page.tsx                        # 공개 청첩장
│
├── api/
│   └── invitations/
│       ├── route.ts                    # POST (생성), GET (목록)
│       └── [id]/
│           ├── route.ts                # GET, PUT, DELETE
│           └── verify/
│               └── route.ts            # POST (비밀번호 검증)

components/
├── editor/
│   ├── TopBar.tsx                      # 상단 메뉴바
│   ├── Sidebar.tsx                     # 좌측 탭 메뉴
│   ├── EditorPanel.tsx                 # 중앙 편집 영역
│   ├── PreviewPanel.tsx                # 우측 미리보기
│   └── tabs/
│       ├── TemplateTab.tsx             # 템플릿 선택
│       ├── BasicInfoTab.tsx            # 기본 정보
│       ├── VenueTab.tsx                # 예식 정보
│       ├── GreetingTab.tsx             # 인사말
│       ├── GalleryTab.tsx              # 갤러리
│       ├── AccountTab.tsx              # 계좌 정보
│       └── SettingsTab.tsx             # 설정
│
├── invitations/
│   ├── InvitationList.tsx              # 목록
│   ├── InvitationCard.tsx              # 카드
│   ├── CreateButton.tsx                # 생성 버튼
│   ├── PasswordProtection.tsx          # 비밀번호 입력
│   └── ShareButtons.tsx                # 공유 버튼
│
└── templates/
    ├── ClassicTemplate.tsx             # ✅ Classic
    ├── ModernTemplate.tsx              # Modern
    ├── VintageTemplate.tsx             # Vintage
    ├── FloralTemplate.tsx              # Floral
    └── MinimalTemplate.tsx             # Minimal

stores/
└── invitation-editor.ts                # Zustand store

lib/
├── validation/
│   └── invitation.ts                   # 검증 로직
└── api/
    └── invitations.ts                  # 클라이언트 API 함수
```

---

## 상태 관리 (Zustand)

```tsx
// stores/invitation-editor.ts
import { create } from 'zustand';
import { debounce } from 'lodash';

interface InvitationEditorStore {
  // 상태
  invitation: Partial<Invitation>;
  activeTab: string;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  validation: Record<string, { completed: boolean; hasError: boolean }>;

  // 액션
  setInvitation: (data: Partial<Invitation>) => void;
  updateInvitation: (data: Partial<Invitation>) => void;
  setActiveTab: (tab: string) => void;
  save: () => Promise<void>;
  reset: () => void;
}

export const useInvitationEditor = create<InvitationEditorStore>((set, get) => ({
  // 초기 상태
  invitation: {},
  activeTab: 'template',
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  validation: {},

  // 전체 교체
  setInvitation: (data) => {
    set({ invitation: data, hasUnsavedChanges: false });
  },

  // 부분 업데이트 (자동 저장 트리거)
  updateInvitation: (data) => {
    const updated = { ...get().invitation, ...data };
    set({ invitation: updated, hasUnsavedChanges: true });

    // 자동 저장 (2초 debounce)
    debouncedSave();
  },

  // 탭 전환
  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  // 저장
  save: async () => {
    const { invitation } = get();
    set({ isSaving: true });

    try {
      const response = await fetch(`/api/invitations/${invitation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitation),
      });

      if (response.ok) {
        set({
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          isSaving: false,
        });
      }
    } catch (error) {
      console.error('저장 실패:', error);
      // 로컬 스토리지에 백업
      localStorage.setItem(`invitation_${invitation.id}_backup`, JSON.stringify(invitation));
    } finally {
      set({ isSaving: false });
    }
  },

  // 초기화
  reset: () => {
    set({
      invitation: {},
      activeTab: 'template',
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      validation: {},
    });
  },
}));

// 자동 저장 (2초 debounce)
const debouncedSave = debounce(() => {
  useInvitationEditor.getState().save();
}, 2000);
```

---

## API 명세

### 1. 청첩장 생성

```
POST /api/invitations

Request Body:
{
  "templateId": "classic",
  "groom": {
    "name": "홍길동",
    "fatherName": "홍판서",
    "motherName": "김씨",
    "relation": "장남"
  },
  "bride": {
    "name": "김영희",
    "fatherName": "김판서",
    "motherName": "이씨",
    "relation": "장녀"
  },
  "wedding": {
    "date": "2026-06-15T14:00:00Z",
    "venue": {
      "name": "서울웨딩홀",
      "hall": "3층 그랜드홀",
      "address": "서울시 강남구 테헤란로 123"
    }
  },
  "content": {
    "greeting": "평생을 함께할 반려자를 만났습니다..."
  }
}

Response (201 Created):
{
  "success": true,
  "data": {
    "id": "abc123def4",
    "url": "/inv/abc123def4"
  }
}
```

### 2. 청첩장 수정 (자동 저장용)

```
PUT /api/invitations/[id]

Request Body:
{
  "groom": {
    "name": "홍길동2"
  }
}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "abc123def4",
    "updatedAt": "2026-01-21T10:00:00Z"
  }
}
```

### 3. 청첩장 목록

```
GET /api/invitations?page=1&pageSize=10

Response (200 OK):
{
  "success": true,
  "data": {
    "invitations": [...],
    "total": 10,
    "page": 1,
    "totalPages": 1
  }
}
```

---

## 반응형 처리

### 데스크톱 (1280px 이상) - 권장
```
[TopBar: 56px]
[Sidebar: 256px | Editor: flex-1 | Preview: 384px]
```

### 태블릿 (768px - 1279px)
```
[TopBar: 56px]
[Sidebar: 256px | Editor: flex-1]
(Preview는 토글 버튼으로 모달)
```

### 모바일 (767px 이하)
```
[TopBar with hamburger]
[Editor only]
(Sidebar는 drawer, Preview는 버튼 클릭 시 전체 화면)
```

**구현:**
```tsx
// app/dashboard/invitations/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export default function EditorPage() {
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Sidebar />
      <EditorPanel />

      {/* 데스크톱: 항상 표시 */}
      {isDesktop && <PreviewPanel />}

      {/* 태블릿/모바일: 토글 버튼 */}
      {!isDesktop && (
        <button onClick={() => setShowPreview(true)}>
          📱 미리보기
        </button>
      )}

      {/* 미리보기 모달 (태블릿/모바일) */}
      {!isDesktop && showPreview && (
        <PreviewModal onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}
```

---

## UX 플로우

### 생성 플로우

```
[대시보드]
  ↓
[내 청첩장 목록]
  ↓ [+ 새로 만들기] 클릭
  ↓
[Figma 스타일 편집기]
  ├─ 좌측: 템플릿 선택 탭 (첫 방문)
  ├─ 중앙: 템플릿 카드들
  └─ 우측: 미리보기 (빈 템플릿)
  ↓ Classic 템플릿 선택
  ↓
[자동 저장됨]
  ├─ 좌측: 기본 정보 탭으로 자동 전환
  ├─ 중앙: 신랑/신부 정보 입력 폼
  └─ 우측: 실시간 반영 (홍길동 입력 → 즉시 표시)
  ↓ 정보 입력
  ↓
[자동 저장 (2초마다)]
  ↓ 예식 정보 탭 클릭
  ↓
[예식 정보 입력]
  └─ 우측: 날짜/장소 실시간 반영
  ↓
[완성]
  ↓ 상단 [공유] 클릭
  ↓
[공유 모달]
  ├─ 링크 복사: https://cuggu.com/inv/abc123def4
  ├─ 카카오톡 공유
  └─ QR 코드 다운로드
```

### 수정 플로우

```
[청첩장 목록]
  ↓ [수정] 버튼 클릭
  ↓
[Figma 스타일 편집기] (기존 데이터 로드)
  ├─ 좌측: 탭 메뉴 (완료된 탭은 ✓ 표시)
  ├─ 중앙: 기존 데이터 표시
  └─ 우측: 현재 상태 미리보기
  ↓ 원하는 탭 선택
  ↓
[즉시 수정 가능]
  └─ 타이핑하면 우측 미리보기 즉시 반영
  ↓
[자동 저장됨] (2초 debounce)
  ↓ 상단 "저장됨" 표시
```

---

## 다음 단계

### Phase 1 완료 후
- [ ] RSVP 기능 추가
- [ ] 갤러리 이미지 업로드
- [ ] 계좌 정보 관리
- [ ] 지도 API 연동

### Phase 2 (확장)
- [ ] 나머지 템플릿 개발 (Modern, Vintage, Floral, Minimal)
- [ ] 통계 대시보드
- [ ] AI 사진 생성 연동
- [ ] 테마 커스터마이징 (색상/폰트)

### Phase 3 (출시 전)
- [ ] 결제 시스템 연동
- [ ] 이미지 최적화 (Cloudflare)
- [ ] 성능 최적화
- [ ] 베타 테스트
