'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvitationEditor } from '@/stores/invitation-editor';
import { TAB_IDS } from '@/lib/editor/tabs';

// 모바일 전용 탭 (static import)
import { MobileGreetingTab } from './tabs/MobileGreetingTab';
import { MobileRsvpTab } from './tabs/MobileRsvpTab';
import { MobileGuestbookTab } from './tabs/MobileGuestbookTab';

// 데스크톱 탭 fallback (dynamic import — 모바일 번들 최적화)
const TemplateTab = dynamic(() => import('@/components/editor/tabs/TemplateTab').then(m => ({ default: m.TemplateTab })), { ssr: false });
const BasicInfoTab = dynamic(() => import('@/components/editor/tabs/BasicInfoTab').then(m => ({ default: m.BasicInfoTab })), { ssr: false });
const VenueTab = dynamic(() => import('@/components/editor/tabs/VenueTab').then(m => ({ default: m.VenueTab })), { ssr: false });
const GalleryTab = dynamic(() => import('@/components/editor/tabs/GalleryTab').then(m => ({ default: m.GalleryTab })), { ssr: false });
const AccountTab = dynamic(() => import('@/components/editor/tabs/AccountTab').then(m => ({ default: m.AccountTab })), { ssr: false });
const EndingTab = dynamic(() => import('@/components/editor/tabs/EndingTab').then(m => ({ default: m.EndingTab })), { ssr: false });
const SettingsTab = dynamic(() => import('@/components/editor/tabs/SettingsTab').then(m => ({ default: m.SettingsTab })), { ssr: false });

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  template: TemplateTab,
  basic: BasicInfoTab,
  venue: VenueTab,
  greeting: MobileGreetingTab,
  gallery: GalleryTab,
  account: AccountTab,
  rsvp: MobileRsvpTab,
  guestbook: MobileGuestbookTab,
  ending: EndingTab,
  settings: SettingsTab,
};

/**
 * 모바일 에디터 메인 영역
 *
 * activeTab에 따라 탭 렌더링 + 좌/우 슬라이드 전환 애니메이션.
 */
export function MobileEditorShell() {
  const activeTab = useInvitationEditor((s) => s.activeTab);
  const prevTabIndexRef = useRef(TAB_IDS.indexOf(activeTab));

  const currentIndex = TAB_IDS.indexOf(activeTab);
  const direction = currentIndex >= prevTabIndexRef.current ? 1 : -1;
  prevTabIndexRef.current = currentIndex;

  const TabComponent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-stone-100/60 pb-20">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={activeTab}
            custom={direction}
            initial={{ x: `${direction * 30}%`, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: `${-direction * 30}%`, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="px-4 py-4"
          >
            {TabComponent ? <TabComponent /> : (
              <div className="text-center text-stone-400 py-12">
                탭을 선택하세요
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
