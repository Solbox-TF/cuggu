/**
 * 청첩장 발행 전 필수 필드 검증
 *
 * 검증 로직을 한 곳에 모아서 SectionPanel, TopBar, MobileTopBar에서 재사용
 */

export type TabStatus = 'completed' | 'incomplete' | 'optional';

export interface ValidationResult {
  isReady: boolean;
  missing: string[];
  tabStatus: Record<string, TabStatus>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateInvitation(invitation: any): ValidationResult {
  const missing: string[] = [];
  const tabStatus: Record<string, TabStatus> = {};

  // --- template ---
  tabStatus.template = invitation.templateId ? 'completed' : 'incomplete';

  // --- basic (required) ---
  if (!invitation.groom?.name) missing.push('신랑 이름');
  if (!invitation.bride?.name) missing.push('신부 이름');
  tabStatus.basic =
    invitation.groom?.name && invitation.bride?.name ? 'completed' : 'incomplete';

  // --- venue (required) ---
  if (!invitation.wedding?.date) missing.push('예식 날짜');
  if (!invitation.wedding?.venue?.name) missing.push('예식장 이름');
  tabStatus.venue =
    invitation.wedding?.date && invitation.wedding?.venue?.name
      ? 'completed'
      : 'incomplete';

  // --- optional tabs ---
  tabStatus.greeting = invitation.content?.greeting ? 'completed' : 'optional';

  tabStatus.gallery =
    invitation.gallery?.images?.length > 0 ? 'completed' : 'optional';

  const hasGroomAccount =
    invitation.groom?.account?.bank && invitation.groom?.account?.accountNumber;
  const hasBrideAccount =
    invitation.bride?.account?.bank && invitation.bride?.account?.accountNumber;
  tabStatus.account = hasGroomAccount || hasBrideAccount ? 'completed' : 'optional';

  tabStatus.rsvp =
    invitation.settings?.enableRsvp !== false ? 'completed' : 'optional';

  tabStatus.settings = 'optional';

  return {
    isReady: missing.length === 0,
    missing,
    tabStatus,
  };
}
