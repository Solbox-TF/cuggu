'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { EDITOR_TABS, type TabGroup } from '@/lib/editor/tabs';

interface TabletTabStripProps {
  activeTab: string;
  invitation: any;
}

const GROUP_ORDER: TabGroup[] = ['template', 'required', 'optional', 'settings'];

/**
 * 태블릿용 수평 탭 스트립
 *
 * SectionPanel 대신 상단에 수평 배치
 * 8개 탭 아이콘 + 라벨, 그룹 간 디바이더
 */
export function TabletTabStrip({ activeTab, invitation }: TabletTabStripProps) {
  const { setActiveTab, getEnabledSections } = useInvitationEditor();
  const enabledSections = getEnabledSections();

  return (
    <div className="h-11 bg-stone-50 border-b border-stone-200 flex items-center overflow-x-auto px-2 flex-shrink-0">
      {GROUP_ORDER.map((group, groupIndex) => {
        const tabs = EDITOR_TABS.filter((t) => t.group === group);

        return (
          <div key={group} className="flex items-center">
            {groupIndex > 0 && (
              <div className="w-px h-5 bg-stone-200 mx-1 flex-shrink-0" />
            )}
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md mx-0.5 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
