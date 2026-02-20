'use client';

import { useInvitationEditor } from '@/stores/invitation-editor';
import { Check, AlertCircle, Minus } from 'lucide-react';
import { EDITOR_TABS, type EditorTab, type TabGroup } from '@/lib/editor/tabs';

interface SectionPanelProps {
  activeTab: string;
  invitation: any;
}

const GROUP_LABELS: Partial<Record<TabGroup, string>> = {
  required: '필수',
  optional: '선택',
};

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`
        relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out cursor-pointer
        ${checked ? 'bg-pink-400' : 'bg-stone-300'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
          transform transition duration-200 ease-in-out
          ${checked ? 'translate-x-4' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export function SectionPanel({ activeTab, invitation }: SectionPanelProps) {
  const { setActiveTab, toggleSection, getEnabledSections, validationResult } = useInvitationEditor();
  const enabledSections = getEnabledSections();

  const getTabStatus = (tabId: string) => {
    return validationResult.tabStatus[tabId] || 'optional';
  };

  const grouped = {
    template: EDITOR_TABS.filter((t) => t.group === 'template'),
    required: EDITOR_TABS.filter((t) => t.group === 'required'),
    optional: EDITOR_TABS.filter((t) => t.group === 'optional'),
    settings: EDITOR_TABS.filter((t) => t.group === 'settings'),
  };

  const renderTab = (tab: EditorTab) => {
    const isActive = activeTab === tab.id;
    const status = getTabStatus(tab.id);
    const isCompleted = status === 'completed';
    const hasError = status === 'incomplete' && tab.required;
    const isEnabled = !tab.toggleable || (tab.id === 'guestbook' ? enabledSections[tab.id] === true : enabledSections[tab.id] !== false);
    const Icon = tab.icon;

    return (
      <div
        key={tab.id}
        className={`
          relative transition-all
          ${isActive ? 'bg-white border-l-2 border-pink-400' : 'border-l-2 border-transparent hover:bg-stone-100'}
        `}
      >
        <button
          onClick={() => setActiveTab(tab.id)}
          className="w-full text-left flex items-start gap-3 px-4 py-3"
        >
          <div className="relative flex-shrink-0 mt-0.5">
            <Icon className={`w-5 h-5 ${isActive ? 'text-pink-500' : 'text-stone-500'}`} />
            {hasError && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-2 h-2 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${isActive ? 'text-stone-900' : 'text-stone-700'} flex items-center gap-1.5`}>
              {tab.label}
              {tab.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-md leading-none">
                  {tab.badge}
                </span>
              )}
              {tab.group !== 'settings' && (
                isEnabled
                  ? <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"><Check className="w-2 h-2 text-white" strokeWidth={3} /></span>
                  : <span className="w-3.5 h-3.5 bg-stone-300 rounded-full flex items-center justify-center flex-shrink-0"><Minus className="w-2 h-2 text-white" strokeWidth={3} /></span>
              )}
            </div>
            <div className="text-xs text-stone-400 mt-0.5 leading-tight">
              {tab.description}
            </div>
          </div>
        </button>

        {/* 토글은 각 탭 내부에서 직접 제어 */}
      </div>
    );
  };

  const renderGroup = (group: TabGroup, tabs: EditorTab[]) => {
    if (tabs.length === 0) return null;
    const label = GROUP_LABELS[group];

    return (
      <div key={group} className="py-1">
        {label && (
          <div className="px-4 py-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            {label}
          </div>
        )}
        {tabs.map(renderTab)}
      </div>
    );
  };

  return (
    <aside className="w-[220px] bg-stone-50 border-r border-stone-200 flex-shrink-0 flex flex-col overflow-y-auto">
      {renderGroup('template', grouped.template)}

      <div className="border-t border-stone-200" />
      {renderGroup('required', grouped.required)}

      <div className="border-t border-stone-200" />
      {renderGroup('optional', grouped.optional)}

      <div className="flex-1" />
      <div className="border-t border-stone-200" />
      {renderGroup('settings', grouped.settings)}
    </aside>
  );
}
