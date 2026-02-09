"use client";

import { useEffect, useState } from "react";

type AppSetting = {
  key: string;
  value: unknown;
  category: string;
  label: string;
  description: string | null;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // 기본 설정 정의 (DB에 없으면 이 기본값으로 표시)
  const defaults: AppSetting[] = [
    {
      key: "registration_enabled",
      value: false,
      category: "auth",
      label: "신규 회원가입 허용",
      description:
        "OFF 시 기존 가입된 유저만 로그인 가능. 신규 OAuth 로그인 차단.",
    },
  ];

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        // DB 설정과 기본값 병합
        const merged = defaults.map((def) => {
          const found = (data.data as AppSetting[]).find(
            (s) => s.key === def.key
          );
          return found ?? def;
        });
        setSettings(merged);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSetting = async (setting: AppSetting) => {
    const newValue = !setting.value;
    setSaving(setting.key);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: setting.key,
          value: newValue,
          category: setting.category,
          label: setting.label,
          description: setting.description,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) =>
          prev.map((s) =>
            s.key === setting.key ? { ...s, value: newValue } : s
          )
        );
      } else {
        alert(data.error || "설정 변경 실패");
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">설정</h1>
        <p className="mt-1 text-stone-500">서비스 전반 설정을 관리합니다</p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-stone-500">
            로딩 중...
          </div>
        ) : (
          settings.map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between p-5"
            >
              <div>
                <p className="font-medium text-stone-900">{setting.label}</p>
                {setting.description && (
                  <p className="mt-1 text-sm text-stone-500">
                    {setting.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleSetting(setting)}
                disabled={saving === setting.key}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 ${
                  setting.value ? "bg-stone-900" : "bg-stone-300"
                } ${saving === setting.key ? "opacity-50" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    setting.value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
