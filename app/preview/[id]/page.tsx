import { notFound } from 'next/navigation';
import { db } from '@/db';
import { invitations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { dbRecordToInvitation } from '@/lib/invitation-utils';
import { PreviewClient } from './PreviewClient';

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.id, id),
    with: { template: true },
  });

  if (!invitation || invitation.status === 'DELETED') {
    notFound();
  }

  // DRAFT → 본인만 접근 가능
  if (invitation.status === 'DRAFT') {
    const session = await auth();
    const isOwner = session?.user?.id === invitation.userId;
    if (!isOwner) {
      notFound();
    }
  }

  // DB row → Invitation 타입 변환 (조회수 증가 없음, 비밀번호 게이트 없음)
  const data = dbRecordToInvitation(invitation);

  return <PreviewClient data={data} />;
}
