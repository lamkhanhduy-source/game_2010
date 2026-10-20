"use client";

import { useEffect, useState } from "react";
import SettingsForm from "@/components/admin/SettingsForm";
import SetupNotice from "@/components/layout/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchSettings } from "@/lib/services/settings";
import { errorMessage } from "@/lib/utils";
import type { GameSettings } from "@/lib/types";

/** /admin/settings — CẤU HÌNH TRÒ CHƠI (thời gian đếm ngược, chế độ chơi, biểu tượng, âm thanh). */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    fetchSettings()
      .then(setSettings)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (!isSupabaseConfigured) return <SetupNotice variant="required" />;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-4xl font-bold text-gradient-rose">Cài đặt trò chơi</h1>
      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">⚠️ {error}</p>}
      {!settings && !error && <p className="py-10 text-center font-semibold text-purple-700">Đang tải…</p>}
      {settings && <SettingsForm initial={settings} />}
    </div>
  );
}
