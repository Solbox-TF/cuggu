'use client';

import { useMemo } from 'react';
import { X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveTheme } from '@/lib/templates/get-template';
import { BaseTemplate } from '@/components/templates/BaseTemplate';

interface MobilePreviewOverlayProps {
  invitation: any;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 모바일 미리보기 전체화면 오버레이
 */
export function MobilePreviewOverlay({ invitation, isOpen, onClose }: MobilePreviewOverlayProps) {
  const previewData = useMemo(() => ({
    id: invitation.id || 'preview',
    userId: invitation.userId || 'user',
    templateId: invitation.templateId || 'classic',
    groom: {
      name: invitation.groom?.name || '신랑',
      fatherName: invitation.groom?.fatherName,
      motherName: invitation.groom?.motherName,
      isDeceased: invitation.groom?.isDeceased,
      relation: invitation.groom?.relation,
      displayMode: invitation.groom?.displayMode,
      phone: invitation.groom?.phone,
      account: invitation.groom?.account,
      parentAccounts: invitation.groom?.parentAccounts || { father: [], mother: [] },
    },
    bride: {
      name: invitation.bride?.name || '신부',
      fatherName: invitation.bride?.fatherName,
      motherName: invitation.bride?.motherName,
      isDeceased: invitation.bride?.isDeceased,
      relation: invitation.bride?.relation,
      displayMode: invitation.bride?.displayMode,
      phone: invitation.bride?.phone,
      account: invitation.bride?.account,
      parentAccounts: invitation.bride?.parentAccounts || { father: [], mother: [] },
    },
    wedding: {
      date: invitation.wedding?.date || new Date().toISOString(),
      venue: {
        name: invitation.wedding?.venue?.name || '예식장',
        address: invitation.wedding?.venue?.address || '주소를 입력하세요',
        hall: invitation.wedding?.venue?.hall,
        tel: invitation.wedding?.venue?.tel,
        lat: invitation.wedding?.venue?.lat,
        lng: invitation.wedding?.venue?.lng,
        transportation: invitation.wedding?.venue?.transportation,
      },
    },
    content: {
      greeting: invitation.content?.greeting || '',
      notice: invitation.content?.notice,
    },
    gallery: {
      coverImage: invitation.gallery?.coverImage,
      images: invitation.gallery?.images || [],
    },
    settings: {
      showParents: invitation.settings?.showParents ?? true,
      showAccounts: invitation.settings?.showAccounts ?? true,
      showMap: invitation.settings?.showMap ?? true,
      enableRsvp: invitation.settings?.enableRsvp ?? true,
      sectionOrder: invitation.settings?.sectionOrder,
      ...invitation.settings,
    },
    extendedData: invitation.extendedData,
    customTheme: invitation.customTheme,

    isPasswordProtected: invitation.isPasswordProtected || false,
    status: 'DRAFT' as const,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [
    invitation.id, invitation.userId, invitation.templateId,
    invitation.groom, invitation.bride, invitation.wedding,
    invitation.content, invitation.gallery, invitation.settings,
    invitation.extendedData, invitation.customTheme,
    invitation.isPasswordProtected,
  ]);

  const theme = resolveTheme(invitation.templateId || 'classic', invitation.customTheme);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-white flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* 상단 바 */}
          <div className="h-12 flex items-center justify-between px-4 border-b border-stone-200 flex-shrink-0">
            <span className="text-sm font-medium text-stone-900">미리보기</span>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-stone-500 hover:text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 미리보기 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            <BaseTemplate data={previewData} theme={theme} isPreview />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * 모바일 미리보기 FAB (Floating Action Button)
 */
export function MobilePreviewFAB({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 h-11 bg-pink-500 text-white rounded-full shadow-lg shadow-pink-500/25 flex items-center gap-2 active:bg-pink-600 transition-colors"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="미리보기"
    >
      <Eye className="w-4 h-4" />
      <span className="text-sm font-medium">미리보기</span>
    </button>
  );
}
