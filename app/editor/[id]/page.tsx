'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { TopBar } from '@/components/editor/TopBar';
import { SectionPanel } from '@/components/editor/SectionPanel';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { PreviewPanel } from '@/components/editor/PreviewPanel';
import { OnboardingWizard, type OnboardingData } from '@/components/editor/OnboardingWizard';

/**
 * Figma 스타일 청첩장 편집기
 *
 * 레이아웃:
 * - 상단: TopBar (로고, 저장 상태, 액션 버튼)
 * - 좌측: Sidebar (탭 메뉴)
 * - 중앙: EditorPanel (편집 폼)
 * - 우측: PreviewPanel (실시간 미리보기)
 */

// 신규 초대장 (플레이스홀더 그대로) 여부 판별
function isNewWithDefaults(inv: Record<string, any>): boolean {
  const hasDefaultGroom = !inv.groom?.name || inv.groom.name === '신랑';
  const hasDefaultBride = !inv.bride?.name || inv.bride.name === '신부';
  const hasDefaultVenue = !inv.wedding?.venue?.name || inv.wedding.venue.name === '예식장';
  return hasDefaultGroom && hasDefaultBride && hasDefaultVenue;
}

export default function InvitationEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const forceOnboarding = searchParams.get('onboarding') === '1';

  const {
    invitation,
    setInvitation,
    updateInvitation,
    setActiveTab,
    activeTab,
    isSaving,
    lastSaved,
    reset,
  } = useInvitationEditor();

  const [showOnboarding, setShowOnboarding] = useState(false);

  // 청첩장 데이터 로드
  useEffect(() => {
    async function loadInvitation() {
      try {
        const response = await fetch(`/api/invitations/${id}`);

        if (!response.ok) {
          throw new Error('청첩장을 불러올 수 없습니다.');
        }

        const result = await response.json();

        if (result.success && result.data) {
          console.log('[Editor] loaded invitation:', result.data);
          console.log('[Editor] templateId:', result.data.templateId);
          console.log('[Editor] venue:', result.data.wedding?.venue);
          setInvitation(result.data);

          // 온보딩 위자드 표시 판별
          const ext = (result.data.extendedData as Record<string, unknown>) || {};
          if (forceOnboarding || (!ext.onboardingCompleted && isNewWithDefaults(result.data))) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error('청첩장 로드 실패:', error);

        // API 없을 때 기본값으로 초기화 (임시)
        setInvitation({
          id: id,
          userId: 'temp-user',
          templateId: 'classic',
          groom: {},
          bride: {},
          wedding: {},
          content: {},
          gallery: { images: [] },
          settings: {},
          status: 'DRAFT',
          viewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setShowOnboarding(true);
      }
    }

    if (id) {
      loadInvitation();
    }

    // 컴포넌트 언마운트 시 store 초기화
    return () => {
      reset();
    };
  }, [id, setInvitation, reset, forceOnboarding]);

  // 온보딩 완료
  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
    const ext = (invitation.extendedData as Record<string, unknown>) || {};

    updateInvitation({
      templateId: data.templateId,
      groom: { ...invitation.groom, name: data.groomName },
      bride: { ...invitation.bride, name: data.brideName },
      wedding: {
        ...invitation.wedding,
        date: data.weddingDate,
        venue: {
          ...invitation.wedding?.venue,
          name: data.venueName,
        },
      },
      extendedData: { ...ext, onboardingCompleted: true },
    });

    setShowOnboarding(false);
    setActiveTab('template');
  }, [invitation, updateInvitation, setActiveTab]);

  // 온보딩 건너뛰기
  const handleOnboardingSkip = useCallback(() => {
    const ext = (invitation.extendedData as Record<string, unknown>) || {};

    updateInvitation({
      extendedData: { ...ext, onboardingCompleted: true },
    });

    setShowOnboarding(false);
  }, [invitation, updateInvitation]);

  // 로딩 중
  if (!invitation.id) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">청첩장을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 상단 메뉴바 */}
      <TopBar
        invitation={invitation}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onUpdateInvitation={updateInvitation}
      />

      {/* 3-패널 레이아웃 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측: 섹션 패널 */}
        <SectionPanel activeTab={activeTab} invitation={invitation} />

        {/* 중앙: 편집 영역 */}
        <EditorPanel activeTab={activeTab} invitation={invitation} />

        {/* 우측: 실시간 미리보기 */}
        <PreviewPanel invitation={invitation} />
      </div>

      {/* 온보딩 위자드 */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  );
}
