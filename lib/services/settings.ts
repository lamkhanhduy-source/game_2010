import { getSupabase, isSupabaseConfigured } from "../supabase";
import { DEFAULT_SETTINGS } from "../constants";
import type { GameSettings } from "../types";

/**
 * DỊCH VỤ CẤU HÌNH TRÒ CHƠI — bảng `game_settings` (1 dòng duy nhất, id = 1).
 */

/** Đọc cấu hình; nếu chưa có Supabase / chưa có dòng nào → dùng mặc định. */
export async function fetchSettings(): Promise<GameSettings> {
  if (!isSupabaseConfigured) return DEFAULT_SETTINGS;
  const { data, error } = await getSupabase().from("game_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data ? ({ ...DEFAULT_SETTINGS, ...data } as GameSettings) : DEFAULT_SETTINGS;
}

/** Lưu cấu hình (upsert để lần đầu chưa có dòng vẫn chạy được). */
export async function saveSettings(settings: GameSettings): Promise<void> {
  const { error } = await getSupabase()
    .from("game_settings")
    .upsert({
      id: 1,
      default_time_limit: settings.default_time_limit,
      default_mode: settings.default_mode,
      icon_style: settings.icon_style,
      sound_enabled: settings.sound_enabled,
    });
  if (error) throw error;
}
