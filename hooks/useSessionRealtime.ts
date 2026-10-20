"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSessionById, subscribeSession } from "@/lib/services/sessions";
import type { GameSession } from "@/lib/types";

/**
 * ĐỒNG BỘ THỜI GIAN THỰC TRẠNG THÁI PHÒNG CHƠI
 * ------------------------------------------------------------------
 * - Đăng ký Supabase Realtime (postgres_changes) cho đúng 1 hàng game_sessions.
 * - Mỗi lần kết nối (lại) thành công sẽ fetch lại 1 lần để không bỏ sót thay đổi.
 * - Chỉ nhận bản ghi MỚI HƠN (so updated_at) để tránh "lùi trạng thái" do tin đến trễ.
 * - `applySession` cho Host áp dụng ngay kết quả ghi DB của chính mình (không chờ echo).
 */
export function useSessionRealtime(initial: GameSession | null): {
  session: GameSession | null;
  applySession: (s: GameSession) => void;
} {
  const [session, setSession] = useState<GameSession | null>(initial);
  const sessionId = initial?.id ?? null;

  const applySession = useCallback((next: GameSession) => {
    setSession((prev) => {
      if (prev && prev.id === next.id && new Date(prev.updated_at) > new Date(next.updated_at)) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const unsubscribe = subscribeSession(sessionId, applySession, () => {
      void fetchSessionById(sessionId)
        .then((s) => s && applySession(s))
        .catch(() => undefined);
    });
    return unsubscribe;
  }, [sessionId, applySession]);

  return { session, applySession };
}
