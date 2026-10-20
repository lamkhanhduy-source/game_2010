import { getSupabase, isSupabaseConfigured } from "../supabase";
import { normalizeRows } from "../io/parse";
import type { Question, QuestionInput } from "../types";

/**
 * DỊCH VỤ CÂU HỎI — mọi thao tác CRUD với bảng `questions`.
 * Các hàm đều ném lỗi (throw) khi Supabase trả lỗi; nơi gọi chịu trách nhiệm hiển thị.
 */

const TABLE = "questions";

/** Lấy toàn bộ câu hỏi, cũ → mới (giữ đúng thứ tự khi import). */
export async function fetchQuestions(): Promise<Question[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Question[];
}

/** Thêm 1 câu hỏi. */
export async function createQuestion(input: QuestionInput): Promise<Question> {
  const { data, error } = await getSupabase().from(TABLE).insert(input).select().single();
  if (error) throw error;
  return data as Question;
}

/** Sửa 1 câu hỏi theo id. */
export async function updateQuestion(id: string, input: QuestionInput): Promise<Question> {
  const { data, error } = await getSupabase().from(TABLE).update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as Question;
}

/** Xóa 1 câu hỏi theo id. */
export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/** Xóa TẤT CẢ câu hỏi (Supabase bắt buộc có điều kiện lọc nên dùng `id is not null`). */
export async function deleteAllQuestions(): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().not("id", "is", null);
  if (error) throw error;
}

/**
 * Thêm hàng loạt (Import). Chia lô 100 dòng/lần.
 * Gán created_at tăng dần theo từng dòng để giữ đúng thứ tự trong file.
 */
export async function insertQuestions(inputs: QuestionInput[]): Promise<number> {
  const base = Date.now();
  const rows = inputs.map((q, i) => ({ ...q, created_at: new Date(base + i).toISOString() }));
  const CHUNK = 100;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await getSupabase().from(TABLE).insert(rows.slice(i, i + CHUNK));
    if (error) throw error;
  }
  return rows.length;
}

/** Đọc file câu hỏi mẫu trong /public/templates (dùng cho chế độ demo & nút "Nạp câu hỏi mẫu"). */
export async function loadSampleInputs(): Promise<QuestionInput[]> {
  const res = await fetch("/templates/sample-questions.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Không đọc được file câu hỏi mẫu.");
  const raw = (await res.json()) as unknown[];
  return normalizeRows(raw, { label: "mục", firstNo: 1 }).valid;
}

/**
 * Lấy câu hỏi để chơi. Nếu chưa cấu hình Supabase → trả về câu hỏi mẫu (chế độ DEMO)
 * để người dùng chạy thử ứng dụng ngay mà chưa cần database.
 */
export async function fetchQuestionsOrDemo(): Promise<{ questions: Question[]; demo: boolean }> {
  if (isSupabaseConfigured) {
    return { questions: await fetchQuestions(), demo: false };
  }
  const samples = await loadSampleInputs();
  const now = new Date().toISOString();
  const questions: Question[] = samples.map((s, i) => ({ ...s, id: `demo-${i}`, created_at: now }));
  return { questions, demo: true };
}
