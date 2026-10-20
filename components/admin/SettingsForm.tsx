"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { TIME_PRESETS } from "@/lib/constants";
import { saveSettings } from "@/lib/services/settings";
import { setSoundEnabled } from "@/lib/effects/sound";
import { cn, errorMessage } from "@/lib/utils";
import type { GameMode, GameSettings, IconStyle } from "@/lib/types";

/** Thẻ lựa chọn dạng nút (radio trực quan) */
function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border-2 px-4 py-3 text-left text-sm font-semibold transition",
        active ? "border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200" : "border-pink-200 bg-white text-purple-900 hover:border-rose-300"
      )}
    >
      {children}
    </button>
  );
}

/**
 * FORM CẤU HÌNH TRÒ CHƠI — lưu vào bảng game_settings (dòng id = 1).
 *  - Thời gian đếm ngược mặc định (10s / 15s / 30s hoặc tùy chỉnh)
 *  - Chế độ chơi mặc định: Cá nhân hoặc Trình chiếu chung (Host–Player)
 *  - Biểu tượng: hộp quà hoặc bông hồng · Bật/tắt âm thanh
 */
export default function SettingsForm({ initial }: { initial: GameSettings }) {
  const [time, setTime] = useState(initial.default_time_limit);
  const [mode, setMode] = useState<GameMode>(initial.default_mode);
  const [icon, setIcon] = useState<IconStyle>(initial.icon_style);
  const [sound, setSound] = useState(initial.sound_enabled);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!Number.isFinite(time) || time < 3 || time > 600) {
      return setStatus({ kind: "err", text: "Thời gian phải từ 3 đến 600 giây." });
    }
    setSaving(true);
    setStatus(null);
    try {
      await saveSettings({ id: 1, default_time_limit: Math.round(time), default_mode: mode, icon_style: icon, sound_enabled: sound });
      setSoundEnabled(sound);
      setStatus({ kind: "ok", text: "Đã lưu cấu hình." });
    } catch (err) {
      setStatus({ kind: "err", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass space-y-6 rounded-3xl p-6">
      <section>
        <h3 className="font-bold text-purple-900">⏱️ Thời gian đếm ngược mỗi câu</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {TIME_PRESETS.map((s) => (
            <Choice key={s} active={time === s} onClick={() => setTime(s)}>
              {s} giây
            </Choice>
          ))}
          <label className="flex items-center gap-2 rounded-2xl border-2 border-pink-200 bg-white px-3 py-2 text-sm font-semibold text-purple-900">
            Tùy chỉnh
            <input
              type="number"
              min={3}
              max={600}
              value={time}
              onChange={(e) => setTime(Number(e.target.value))}
              className="w-20 rounded-lg border border-pink-200 px-2 py-1 text-center outline-none focus:border-rose-400"
            />
            giây
          </label>
        </div>
        <p className="mt-1 text-xs text-purple-700/80">Câu hỏi có đặt thời gian riêng sẽ ưu tiên thời gian riêng.</p>
      </section>

      <section>
        <h3 className="font-bold text-purple-900">🎮 Chế độ chơi mặc định</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Choice active={mode === "solo"} onClick={() => setMode("solo")}>
            🎮 Cá nhân
            <span className="block text-xs font-normal text-purple-700/80">Chơi trên 1 thiết bị, không cần phòng.</span>
          </Choice>
          <Choice active={mode === "host"} onClick={() => setMode("host")}>
            📺 Trình chiếu chung (Host–Player)
            <span className="block text-xs font-normal text-purple-700/80">Chiếu màn hình lớn, mọi người trả lời bằng điện thoại.</span>
          </Choice>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-purple-900">🎁 Biểu tượng câu hỏi</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Choice active={icon === "gift"} onClick={() => setIcon("gift")}>
            🎁 Hộp quà may mắn
          </Choice>
          <Choice active={icon === "rose"} onClick={() => setIcon("rose")}>
            🌹 Bông hồng rực rỡ
          </Choice>
        </div>
      </section>

      <section>
        <label className="flex cursor-pointer items-center gap-3 font-semibold text-purple-900">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} className="h-5 w-5 accent-rose-500" />
          🔔 Bật âm thanh (mở quà, đếm ngược, chúc mừng)
        </label>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? "Đang lưu…" : "💾 Lưu cấu hình"}
        </Button>
        {status && <span className={status.kind === "ok" ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-red-600"}>{status.kind === "ok" ? "✅" : "⚠️"} {status.text}</span>}
      </div>
    </div>
  );
}
