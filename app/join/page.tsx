"use client";

import { useEffect, useState, type FormEvent } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SetupNotice from "@/components/layout/SetupNotice";
import PlayerGame from "@/components/modes/PlayerGame";
import Button from "@/components/ui/Button";
import { useGameData } from "@/hooks/useGameData";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchSessionByCode } from "@/lib/services/sessions";
import { errorMessage } from "@/lib/utils";
import type { GameSession } from "@/lib/types";

/** Lưu tên + mã phòng để tải lại trang vẫn vào lại được phòng */
const STORAGE_KEY = "quiz2010.player";

/**
 * /join — NGƯỜI CHƠI VÀO PHÒNG bằng mã (hoặc quét link có ?code=XXXXX).
 * Nhập tên + mã → tìm phòng trong game_sessions → vào <PlayerGame/>.
 */
export default function JoinPage() {
  const { questions, loading: loadingData, error: dataError } = useGameData();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [session, setSession] = useState<GameSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Điền sẵn mã từ ?code=... hoặc từ lần vào trước
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("code");
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as { code?: string; name?: string } | null;
      if (saved?.name) setName(saved.name);
      setCode((fromUrl ?? saved?.code ?? "").toUpperCase());
    } catch {
      if (fromUrl) setCode(fromUrl.toUpperCase());
    }
  }, []);

  const join = async (e: FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return setError("Hãy nhập tên của bạn.");
    if (!code.trim()) return setError("Hãy nhập mã phòng.");
    setBusy(true);
    setError(null);
    try {
      const s = await fetchSessionByCode(code);
      if (!s) {
        setError("Không tìm thấy phòng đang mở với mã này.");
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: s.room_code, name: cleanName }));
      setName(cleanName);
      setSession(s);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SiteHeader title="Tham gia phòng" />
      <main className="pb-10">
        <SetupNotice variant="required" />

        {isSupabaseConfigured && !session && (
          <form onSubmit={join} className="glass mx-auto max-w-md space-y-4 rounded-3xl p-8">
            <div className="text-center">
              <div className="text-5xl">📱</div>
              <h1 className="mt-2 font-display text-4xl font-bold text-gradient-rose">Vào phòng chơi</h1>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-purple-800">Mã phòng</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={8}
                inputMode="text"
                autoCapitalize="characters"
                placeholder="VD: K7M2X"
                className="mt-1 w-full rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-rose-700 outline-none focus:border-rose-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-purple-800">Tên của bạn</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder="VD: Minh Anh"
                className="mt-1 w-full rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-lg text-purple-950 outline-none focus:border-rose-400"
              />
            </label>

            {(error || dataError) && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">⚠️ {error ?? dataError}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={busy || loadingData}>
              {busy ? "Đang vào…" : "Vào phòng 🎉"}
            </Button>
          </form>
        )}

        {isSupabaseConfigured && session && <PlayerGame initialSession={session} questions={questions} name={name} />}
      </main>
    </>
  );
}
