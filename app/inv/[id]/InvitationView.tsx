'use client';

import { useEffect } from 'react';
import type { Invitation } from '@/schemas/invitation';
import { getTemplateComponent } from '@/lib/templates/get-template';
import { BaseTemplate } from '@/components/templates/BaseTemplate';
import { ShareBar } from '@/components/invitation/ShareBar';
import { FloatingBadge } from '@/components/invitation/FloatingBadge';
import { PremiumToggle } from '@/components/dev/PremiumToggle';
import { useInvitationView } from '@/stores/invitation-view';

interface InvitationViewProps {
  data: Invitation;
  isPremium?: boolean;
}

/**
 * 공개 청첩장 뷰 (Client Component)
 *
 * 템플릿 컴포넌트가 useState, framer-motion을 사용하므로
 * Client Component로 분리
 */
export function InvitationView({ data, isPremium: isPremiumProp = false }: InvitationViewProps) {
  const { isPremium, setIsPremium } = useInvitationView();

  useEffect(() => {
    setIsPremium(isPremiumProp);
  }, [isPremiumProp, setIsPremium]);

  // 모바일 Safari 100vh 버그 대응: window.innerHeight 기반 CSS 변수 설정
  useEffect(() => {
    function setScreenHeight() {
      document.documentElement.style.setProperty('--screen-height', `${window.innerHeight}px`);
    }
    setScreenHeight();
    window.addEventListener('resize', setScreenHeight);
    return () => window.removeEventListener('resize', setScreenHeight);
  }, []);

  const isCustom = data.templateId === 'custom' && (data as any).customTheme;
  const TemplateComponent = getTemplateComponent(data.templateId);

  return (
    <main className="min-h-screen" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      <PremiumToggle />
      {isCustom ? (
        <BaseTemplate data={data} theme={(data as any).customTheme} />
      ) : (
        <TemplateComponent data={data} />
      )}
      {!isPremium && <FloatingBadge />}
      <ShareBar
        invitationId={data.id}
        groomName={data.groom.name}
        brideName={data.bride.name}
        imageUrl={data.gallery.images[0] || data.aiPhotoUrl || undefined}
        description={data.content.greeting?.slice(0, 100)}
      />
    </main>
  );
}
