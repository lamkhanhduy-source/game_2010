"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * DANH SÁCH NGƯỜI TRONG PHÒNG (Supabase Realtime Presence) — không cần bảng DB
 * ------------------------------------------------------------------
 * Mỗi Player khi vào phòng sẽ "báo danh" (track) tên của mình trên kênh `room-<mã phòng>`;
 * màn hình Host nhận danh sách và hiển thị ai đang có mặt.
 */
export function useRoomChannel(params: {
  code: string | null;
  role: "host" | "player";
  name?: string;
}): { players: string[] } {
  const { code, role, name } = params;
  const [players, setPlayers] = useState<string[]>([]);

  // Khóa presence riêng cho mỗi tab để 2 người trùng tên vẫn không đè nhau
  const presenceKey = useMemo(() => `${role}-${Math.random().toString(36).slice(2, 10)}`, [role]);

  useEffect(() => {
    if (!code) return;
    const supabase = getSupabase();
    const channel = supabase.channel(`room-${code}`, {
      config: { presence: { key: presenceKey } },
    });

    // Cập nhật danh sách người chơi khi có người vào/ra
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ role: string; name?: string }>();
      const names = Object.values(state)
        .flat()
        .filter((p) => p.role === "player")
        .map((p) => p.name || "Ẩn danh");
      setPlayers(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "vi")));
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") void channel.track({ role, name });
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [code, role, name, presenceKey]);

  return { players };
}
