"use client";

import { useRef, useState, type ChangeEvent } from "react";
import Button from "@/components/ui/Button";
import { parseQuestionFile } from "@/lib/io/parse";
import { questionsToCsv, questionsToJson } from "@/lib/io/export";
import { deleteAllQuestions, insertQuestions, loadSampleInputs } from "@/lib/services/questions";
import { downloadTextFile, errorMessage } from "@/lib/utils";
import type { Question } from "@/lib/types";

/**
 * THANH CÔNG CỤ: Nhập (JSON/CSV/Excel) · Nạp câu hỏi mẫu · Xuất JSON/CSV · Xóa tất cả · Tải file mẫu.
 * Sau mỗi thao tác thay đổi dữ liệu sẽ gọi onChanged() để trang cha tải lại danh sách.
 */
export default function ImportExportBar({ questions, onChanged }: { questions: Question[]; onChanged: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string; details?: string[] } | null>(null);

  /** Bọc 1 thao tác: bật trạng thái bận, bắt lỗi, hiện thông báo */
  const run = async (fn: () => Promise<{ text: string; details?: string[] } | void>) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fn();
      if (res) setMessage({ kind: "ok", ...res });
    } catch (err) {
      setMessage({ kind: "err", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  // ---------- Nhập từ file ----------
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng 1 file
    if (!file) return;
    void run(async () => {
      const { valid, errors } = await parseQuestionFile(file);
      if (valid.length === 0) {
        return { text: "Không có câu hỏi hợp lệ nào để nhập.", details: errors };
      }
      if (errors.length > 0) {
        const ok = window.confirm(
          `Có ${errors.length} dòng lỗi sẽ bị bỏ qua:\n- ${errors.slice(0, 5).join("\n- ")}\n\nVẫn nhập ${valid.length} câu hợp lệ?`
        );
        if (!ok) return { text: "Đã hủy nhập.", details: errors };
      }
      const n = await insertQuestions(valid);
      await onChanged();
      return { text: `Đã nhập ${n} câu hỏi từ "${file.name}".`, details: errors };
    });
  };

  // ---------- Nạp câu hỏi mẫu ----------
  const addSamples = () =>
    run(async () => {
      const n = await insertQuestions(await loadSampleInputs());
      await onChanged();
      return { text: `Đã thêm ${n} câu hỏi mẫu.` };
    });

  // ---------- Xóa tất cả ----------
  const wipe = () => {
    if (questions.length === 0) return;
    if (!window.confirm(`Xóa TẤT CẢ ${questions.length} câu hỏi? Không thể hoàn tác.`)) return;
    void run(async () => {
      await deleteAllQuestions();
      await onChanged();
      return { text: "Đã xóa tất cả câu hỏi." };
    });
  };

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="glass space-y-3 rounded-3xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input ref={fileRef} type="file" accept=".json,.csv,.xlsx" className="hidden" onChange={onFile} />
        <Button size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          📥 Nhập file (JSON / CSV / Excel)
        </Button>
        <Button size="sm" variant="soft" onClick={() => void addSamples()} disabled={busy}>
          🎁 Nạp câu hỏi mẫu
        </Button>
        <Button
          size="sm"
          variant="soft"
          disabled={busy || questions.length === 0}
          onClick={() => downloadTextFile(`cau-hoi-${stamp}.json`, questionsToJson(questions), "application/json")}
        >
          ⬇️ Xuất JSON
        </Button>
        <Button
          size="sm"
          variant="soft"
          disabled={busy || questions.length === 0}
          onClick={() => downloadTextFile(`cau-hoi-${stamp}.csv`, questionsToCsv(questions), "text/csv;charset=utf-8")}
        >
          ⬇️ Xuất CSV
        </Button>
        <Button size="sm" variant="danger" onClick={wipe} disabled={busy || questions.length === 0}>
          🗑️ Xóa tất cả
        </Button>
      </div>

      <p className="text-xs text-purple-800/80">
        Tải file mẫu:{" "}
        <a className="font-semibold text-rose-600 underline" href="/templates/questions-template.xlsx" download>
          Excel
        </a>{" "}
        ·{" "}
        <a className="font-semibold text-rose-600 underline" href="/templates/questions-template.csv" download>
          CSV
        </a>{" "}
        ·{" "}
        <a className="font-semibold text-rose-600 underline" href="/templates/sample-questions.json" download>
          JSON
        </a>
      </p>

      {message && (
        <div className={message.kind === "ok" ? "rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800" : "rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"}>
          {message.kind === "ok" ? "✅" : "⚠️"} {message.text}
          {message.details && message.details.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer font-semibold">Xem {message.details.length} lỗi</summary>
              <ul className="mt-1 list-disc pl-5">
                {message.details.slice(0, 30).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
