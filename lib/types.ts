/**
 * Các kiểu dữ liệu dùng chung toàn ứng dụng.
 * Khớp với các bảng trong supabase/schema.sql.
 *
 * Chế độ "THỬ THÁCH": mỗi ô chỉ chứa một câu hỏi / yêu cầu (VD: "Hát một bài về mẹ"),
 * KHÔNG có phương án A–D và không có đáp án đúng/sai.
 */

export type IconStyle = "gift" | "rose";
export type GameMode = "solo" | "host";

/**
 * Trạng thái phòng chơi:
 *  - board    : đang chọn ô
 *  - question : đang hiện thử thách + đếm ngược
 *  - reveal   : Host đã bấm "Hoàn thành" → ăn mừng (giữ tên cũ để tương thích DB đã tạo)
 *  - finished : đã mở hết các ô
 */
export type Phase = "board" | "question" | "reveal" | "finished";

/** Một câu hỏi / thử thách (bảng `questions`). */
export interface Question {
  id: string;
  /** Nội dung câu hỏi hoặc yêu cầu */
  question_text: string;
  /** Giây. null = dùng thời gian mặc định trong cài đặt */
  time_limit: number | null;
  /** Lưu ý / gợi ý (không bắt buộc) */
  hint: string | null;
  created_at: string;
}

/** Dữ liệu để tạo / sửa câu hỏi (không có id, created_at). */
export type QuestionInput = Omit<Question, "id" | "created_at">;

/** Cấu hình chung (bảng `game_settings`, luôn 1 dòng id = 1). */
export interface GameSettings {
  id: 1;
  default_time_limit: number;
  default_mode: GameMode;
  icon_style: IconStyle;
  sound_enabled: boolean;
}

/** Phòng chơi Host–Player (bảng `game_sessions`). */
export interface GameSession {
  id: string;
  room_code: string;
  current_question_id: string | null;
  is_active: boolean;
  phase: Phase;
  question_order: string[];
  opened_ids: string[];
  question_started_at: string | null;
  time_limit: number;
  icon_style: IconStyle;
  updated_at: string;
}
