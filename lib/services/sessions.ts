import { getSupabase } from "../supabase";
import { generateRoomCode, shuffle } from "../utils";
import type { GameSession, IconStyle, Question } from "../types";

/**
 * DỊCH VỤ PHÒNG CHƠI (Host ↔ Player) — bảng `game_sessions` + Supabase Realtime.
 *
 * Luồng đồng bộ:
 *   Host  ──patchSession()──▶  UPDATE game_sessions
 *                                   │  (Supabase Realtime: postgres_changes)
 *   Player ◀──subscribeSession()────┘  nhận hàng mới và vẽ lại giao diện
 */

const TABLE = "game_sessions";

/** Tạo phòng mới: xáo trộn thứ tự câu hỏi (mỗi hộp quà ↔ 1 câu) và sinh mã phòng không trùng. */
export async function createSession(params: {
  questions: Question[];
  timeLimit: number;
  iconStyle: IconStyle;
}): Promise<GameSession> {
  const order = shuffle(params.questions.map((q) => q.id));

  // Thử tối đa 5 lần phòng khi mã phòng ngẫu nhiên bị trùng (lỗi unique 23505)
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await getSupabase()
      .from(TABLE)
      .insert({
        room_code: generateRoomCode(),
        question_order: order,
        time_limit: params.timeLimit,
        icon_style: params.iconStyle,
      })
      .select()
      .single();
    if (!error) return data as GameSession;
    if (error.code !== "23505") throw error;
  }
  throw new Error("Không tạo được mã phòng duy nhất, vui lòng thử lại.");
}

/** Tìm phòng đang mở theo mã phòng (không phân biệt hoa/thường). */
export async function fetchSessionByCode(code: string): Promise<GameSession | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .eq("room_code", code.trim().toUpperCase())
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as GameSession | null) ?? null;
}

/** Đọc lại một phòng theo id (dùng để đồng bộ lại sau khi mất/nối lại mạng). */
export async function fetchSessionById(id: string): Promise<GameSession | null> {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as GameSession | null) ?? null;
}

/** Host cập nhật trạng thái phòng → mọi Player nhận được ngay qua Realtime. */
export async function patchSession(id: string, patch: Partial<Omit<GameSession, "id" | "updated_at">>): Promise<GameSession> {
  const { data, error } = await getSupabase().from(TABLE).update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as GameSession;
}

/**
 * Đăng ký nhận thay đổi của 1 phòng qua Realtime.
 * @param onChange     gọi mỗi khi hàng game_sessions của phòng này thay đổi
 * @param onSubscribed gọi khi (kết nối lại) thành công → nơi gọi nên fetch lại để không sót cập nhật
 * @returns hàm hủy đăng ký
 */
export function subscribeSession(
  id: string,
  onChange: (session: GameSession) => void,
  onSubscribed?: () => void
): () => void {
  const supabase = getSupabase();
  const channel = supabase
    .channel(`session-${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE, filter: `id=eq.${id}` },
      (payload) => {
        if (payload.eventType === "DELETE") return;
        onChange(payload.new as GameSession);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") onSubscribed?.();
    });

  return () => {
    void supabase.removeChannel(channel);
  };
}
