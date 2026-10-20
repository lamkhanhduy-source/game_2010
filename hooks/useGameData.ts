"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { setSoundEnabled } from "@/lib/effects/sound";
import { fetchQuestionsOrDemo } from "@/lib/services/questions";
import { fetchSettings } from "@/lib/services/settings";
import { errorMessage } from "@/lib/utils";
import type { GameSettings, Question } from "@/lib/types";

interface GameData {
  questions: Question[];
  settings: GameSettings;
  /** true = chưa cấu hình Supabase, đang dùng câu hỏi mẫu */
  demo: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Tải câu hỏi + cấu hình trò chơi từ Supabase khi trang mở.
 * Cũng áp dụng luôn cấu hình bật/tắt âm thanh.
 */
export function useGameData(): GameData & { reload: () => Promise<void> } {
  const [state, setState] = useState<GameData>({
    questions: [],
    settings: DEFAULT_SETTINGS,
    demo: false,
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [{ questions, demo }, settings] = await Promise.all([fetchQuestionsOrDemo(), fetchSettings()]);
      setSoundEnabled(settings.sound_enabled);
      setState({ questions, settings, demo, loading: false, error: null });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...state, reload };
}
