'use client';

import type { Invitation } from '@/schemas/invitation';
import { getTemplateComponent } from '@/lib/templates/get-template';
import { ShareBar } from '@/components/invitation/ShareBar';

interface InvitationViewProps {
  data: Invitation;
}

/**
 * 공개 청첩장 뷰 (Client Component)
 *
 * 템플릿 컴포넌트가 useState, framer-motion을 사용하므로
 * Client Component로 분리
 */
export function InvitationView({ data }: InvitationViewProps) {
  const TemplateComponent = getTemplateComponent(data.templateId);

  return (
    <main className="min-h-screen pb-16">
      <TemplateComponent data={data} />
      <ShareBar
        invitationId={data.id}
        groomName={data.groom.name}
        brideName={data.bride.name}
        imageUrl={data.gallery.images[0] || data.aiPhotoUrl}
        description={data.content.greeting?.slice(0, 100)}
      />
    </main>
  );
}
