import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * KẾT NỐI SUPABASE
 * ------------------------------------------------------------------
 * - Đọc URL + anon key từ biến môi trường NEXT_PUBLIC_* (có mặt cả ở trình duyệt).
 * - Tạo client "lười" (lazy): chỉ khởi tạo khi gọi getSupabase() ở runtime.
 *   => Build trên Vercel KHÔNG lỗi kể cả khi chưa khai báo biến môi trường.
 * - Dùng singleton để cả app chỉ có một kết nối Realtime/WebSocket.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true nếu đã khai báo đủ biến môi trường. Dùng để hiện cảnh báo / chế độ demo. */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("your-project-ref")
);

let client: SupabaseClient | null = null;

/** Lấy Supabase client (tạo lần đầu khi cần). Ném lỗi rõ ràng nếu thiếu cấu hình. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Chưa cấu hình Supabase. Hãy điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local."
    );
  }
  if (!client) {
    client = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: { persistSession: false }, // không dùng đăng nhập
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}
