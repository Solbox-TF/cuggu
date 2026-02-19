"use client";

import { motion } from "framer-motion";
import { User, Sparkles, CreditCard } from "lucide-react";

const TABS = [
  { id: "account", label: "계정", icon: User },
  { id: "credits", label: "크레딧", icon: Sparkles },
  { id: "payments", label: "결제", icon: CreditCard },
] as const;

export type SettingsTab = (typeof TABS)[number]["id"];

interface SettingsTabBarProps {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

export function SettingsTabBar({ activeTab, onChange }: SettingsTabBarProps) {
  return (
    <div className="flex border-b border-stone-200">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors
              ${isActive ? "text-rose-600" : "text-stone-500 hover:text-stone-700"}
            `}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="settings-tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
