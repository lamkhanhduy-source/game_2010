"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SetupNotice from "@/components/layout/SetupNotice";
import HostGame from "@/components/modes/HostGame";
import Button, { buttonClass } from "@/components/ui/Button";
import { useGameData } from "@/hooks/useGameData";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createSession, fetchSessionById } from "@/lib/services/sessions";
import { errorMessage } from "@/lib/utils";
import type { GameSession } from "@/lib/types";

/** Khóa lưu id phòng để Host tải lại trang vẫn quay về phòng cũ */
const STORAGE_KEY = "quiz2010.hostSession";

/**
 * /host — MÀN HÌNH TRÌNH CHIẾU (Host).
 * 1) Hiện màn hình "Tạo phòng". 2) Bấm tạo → ghi 1 hàng vào game_sessions, sinh mã phòng.
 * 3) Giao cho <HostGame/> điều khiển. Tải lại trang sẽ khôi phục phòng đang mở.
 */
export default function HostPage() {
  const { questions, settings, loading, error } = useGameData();
  const [session, setSession] = useState<GameSession | null>(null);
  const [resuming, setResuming] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Khôi phục phòng cũ (nếu còn mở)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setResuming(false);
      return;
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setResuming(false);
      return;
    }
    fetchSessionById(saved)
      .then((s) => {
        if (s && s.is_active && s.phase !== "finished") setSession(s);
        else window.localStorage.removeItem(STORAGE_KEY);
      })
      .catch(() => window.localStorage.removeItem(STORAGE_KEY))
      .finally(() => setResuming(false));
  }, []);

  const create = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const s = await createSession({
        questions,
        timeLimit: settings.default_time_limit,
        iconStyle: settings.icon_style,
      });
      window.localStorage.setItem(STORAGE_KEY, s.id);
      setSession(s);
    } catch (err) {
      setCreateError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  return (
    <>
      <SiteHeader title="Màn hình Host" />
      <main className="pb-10">
        <SetupNotice variant="required" />

        {isSupabaseConfigured && (loading || resuming) && (
          <p className="py-20 text-center font-semibold text-purple-700">Đang tải… 🎁</p>
        )}
        {isSupabaseConfigured && error && <p className="mx-auto max-w-md rounded-xl bg-red-50 p-4 text-red-700">⚠️ {error}</p>}

        {isSupabaseConfigured && !loading && !resuming && !error && !session && (
          <div className="glass mx-auto max-w-lg rounded-3xl p-8 text-center">
            <div className="text-5xl">📺</div>
            <h1 className="mt-2 font-display text-4xl font-bold text-gradient-rose">Tạo phòng trình chiếu</h1>
            <p className="mt-3 text-purple-900/80">
              <b>{questions.length}</b> câu hỏi · <b>{settings.default_time_limit}s</b>/câu ·{" "}
              {settings.icon_style === "gift" ? "🎁 Hộp quà" : "🌹 Bông hồng"}
            </p>
            <p className="mt-1 text-sm text-purple-700/80">Chiếu màn hình này lên máy chiếu; người chơi vào bằng điện thoại.</p>

            {questions.length === 0 ? (
              <Link href="/admin/questions" className={buttonClass("primary", "lg", "mt-6")}>
                Thêm câu hỏi trước
              </Link>
            ) : (
              <Button size="lg" variant="gold" className="mt-6" onClick={() => void create()} disabled={creating}>
                {creating ? "Đang tạo…" : "🚀 Tạo phòng"}
              </Button>
            )}
            {createError && <p className="mt-4 text-sm text-red-600">⚠️ {createError}</p>}
          </div>
        )}

        {isSupabaseConfigured && session && (
          <HostGame initialSession={session} questions={questions} settings={settings} onClose={handleClose} />
        )}
      </main>
    </>
  );
}
