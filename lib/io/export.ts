import Papa from "papaparse";
import type { Question } from "../types";

/**
 * XUẤT CÂU HỎI RA FILE
 * File xuất ra dùng đúng định dạng của chức năng Import
 * → có thể xuất, chỉnh sửa rồi nhập lại.
 */

/** JSON dễ đọc. */
export function questionsToJson(questions: Question[]): string {
  const data = questions.map((q) => ({
    question_text: q.question_text,
    time_limit: q.time_limit,
    hint: q.hint,
  }));
  return JSON.stringify(data, null, 2);
}

/** CSV có BOM UTF-8 để Excel hiển thị đúng tiếng Việt. */
export function questionsToCsv(questions: Question[]): string {
  const rows = questions.map((q) => ({
    question_text: q.question_text,
    time_limit: q.time_limit ?? "",
    hint: q.hint ?? "",
  }));
  return "﻿" + Papa.unparse(rows, { columns: ["question_text", "time_limit", "hint"] });
}
