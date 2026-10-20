import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * THÔNG BÁO CẤU HÌNH SUPABASE
 * - variant "demo"     : banner nhỏ — đang chạy bằng câu hỏi mẫu (chế độ chơi cá nhân).
 * - variant "required" : khối chặn — tính năng này BẮT BUỘC có database (Admin, Host, Join).
 *   Trả về null nếu Supabase đã được cấu hình.
 */
export default function SetupNotice({ variant }: { variant: "demo" | "required" }) {
  if (isSupabaseConfigured) return null;

  if (variant === "demo") {
    return (
      <div className="mx-auto mb-4 max-w-3xl rounded-2xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-sm text-amber-900">
        <b>Chế độ DEMO:</b> chưa kết nối Supabase nên đang dùng bộ câu hỏi mẫu. Xem hướng dẫn cấu hình trong README để
        dùng câu hỏi của riêng bạn.
      </div>
    );
  }

  return (
    <div className="glass mx-auto max-w-xl rounded-3xl p-6 text-center">
      <div className="text-4xl">🔌</div>
      <h2 className="mt-2 text-xl font-bold text-rose-700">Chưa kết nối Supabase</h2>
      <p className="mt-2 text-sm text-purple-900/80">
        Tính năng này cần cơ sở dữ liệu. Tạo file <code className="rounded bg-rose-100 px-1">.env.local</code> với{" "}
        <code className="rounded bg-rose-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> và{" "}
        <code className="rounded bg-rose-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, chạy file{" "}
        <code className="rounded bg-rose-100 px-1">supabase/schema.sql</code>, rồi khởi động lại{" "}
        <code className="rounded bg-rose-100 px-1">npm run dev</code>.
      </p>
    </div>
  );
}
