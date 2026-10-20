import type { QuestionInput } from "../types";

/**
 * NHẬP CÂU HỎI TỪ FILE (JSON / CSV / Excel .xlsx)
 * ------------------------------------------------------------------
 * Cả 3 định dạng đều được đưa về "danh sách dòng thô" rồi chạy chung hàm
 * `normalizeRows()` để kiểm tra dữ liệu trước khi ghi DB.
 *
 * Cột (CSV / Excel — dòng đầu là tiêu đề):
 *   question_text | time_limit (giây, bỏ trống = mặc định) | hint (lưu ý, tùy chọn)
 *
 * JSON: mảng các object { "question_text": "...", "time_limit": 30, "hint": "..." }
 *       hoặc mảng chuỗi thuần ["Hát một bài về mẹ", "Tặng hoa cho bạn bên cạnh"].
 *
 * Các cột thừa (option_a, correct_option, points ... của bản trắc nghiệm cũ) được bỏ qua,
 * nên file cũ vẫn nhập được — chỉ lấy phần nội dung câu hỏi.
 */

export interface ImportResult {
  valid: QuestionInput[];
  errors: string[];
}

type RawRow = Record<string, unknown>;

/** Chuẩn hóa tên cột: "Time Limit" → "time_limit" */
function normalizeKeys(row: RawRow): RawRow {
  const out: RawRow = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.trim().toLowerCase().replace(/[\s-]+/g, "_")] = v;
  }
  return out;
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function toOptionalInt(v: unknown): number | null | "invalid" {
  const s = str(v);
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : "invalid";
}

/**
 * Kiểm tra + chuẩn hóa danh sách dòng thô.
 * @param label   Từ dùng khi báo lỗi: "dòng" (CSV/Excel) hoặc "mục" (JSON)
 * @param firstNo Số thứ tự hiển thị của phần tử đầu tiên (CSV/Excel bắt đầu từ 2 vì dòng 1 là tiêu đề)
 */
export function normalizeRows(rows: unknown[], opts: { label: string; firstNo: number }): ImportResult {
  const valid: QuestionInput[] = [];
  const errors: string[] = [];

  rows.forEach((item, i) => {
    const where = `${opts.label} ${i + opts.firstNo}`;

    // Phần tử là chuỗi thuần → coi là nội dung câu hỏi
    if (typeof item === "string") {
      const text = item.trim();
      if (text) valid.push({ question_text: text, time_limit: null, hint: null });
      return;
    }
    if (!item || typeof item !== "object") {
      errors.push(`${where}: định dạng không hợp lệ.`);
      return;
    }

    const row = normalizeKeys(item as RawRow);
    const text = str(row.question_text ?? row.question ?? row.cau_hoi ?? row.yeu_cau ?? row.text);
    if (!text) {
      // Bỏ qua dòng hoàn toàn trống, không báo lỗi
      if (Object.values(row).every((v) => str(v) === "")) return;
      errors.push(`${where}: thiếu nội dung câu hỏi.`);
      return;
    }

    const time = toOptionalInt(row.time_limit ?? row.time ?? row.thoi_gian);
    if (time === "invalid" || (time !== null && (time < 3 || time > 600))) {
      errors.push(`${where}: time_limit phải là số giây từ 3 đến 600 (hoặc để trống).`);
      return;
    }

    valid.push({
      question_text: text,
      time_limit: time,
      hint: str(row.hint ?? row.goi_y ?? row.luu_y) || null,
    });
  });

  return { valid, errors };
}

/** Đọc một File do người dùng chọn → ImportResult. Tự nhận định dạng theo đuôi file. */
export async function parseQuestionFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase();

  // ---------- JSON ----------
  if (name.endsWith(".json")) {
    const data: unknown = JSON.parse(await file.text());
    const list = Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { questions?: unknown }).questions)
        ? (data as { questions: unknown[] }).questions
        : null;
    if (!list) throw new Error('File JSON phải là một mảng câu hỏi (hoặc { "questions": [...] }).');
    return normalizeRows(list, { label: "mục", firstNo: 1 });
  }

  // ---------- CSV ----------
  if (name.endsWith(".csv")) {
    const Papa = (await import("papaparse")).default;
    const text = (await file.text()).replace(/^﻿/, ""); // bỏ BOM do Excel thêm vào
    const parsed = Papa.parse<RawRow>(text, { header: true, skipEmptyLines: true });
    return normalizeRows(parsed.data, { label: "dòng", firstNo: 2 });
  }

  // ---------- Excel (.xlsx) ----------
  if (name.endsWith(".xlsx")) {
    const readXlsxFile = (await import("read-excel-file")).default;
    const grid = await readXlsxFile(file); // mảng các dòng; dòng đầu là tiêu đề
    if (grid.length < 2) throw new Error("File Excel không có dữ liệu (cần dòng tiêu đề + ít nhất 1 dòng câu hỏi).");
    const header = grid[0].map((c) => str(c));
    const rows: RawRow[] = grid.slice(1).map((cells) => {
      const obj: RawRow = {};
      header.forEach((h, idx) => {
        if (h) obj[h] = cells[idx] ?? "";
      });
      return obj;
    });
    return normalizeRows(rows, { label: "dòng", firstNo: 2 });
  }

  throw new Error("Chỉ hỗ trợ file .json, .csv hoặc .xlsx.");
}
