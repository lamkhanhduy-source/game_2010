"use client";

import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import { TIME_PRESETS } from "@/lib/constants";
import { cn, errorMessage } from "@/lib/utils";
import type { Question, QuestionInput } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border-2 border-pink-200 bg-white px-3 py-2 text-purple-950 outline-none focus:border-rose-400";

/**
 * FORM THÊM / SỬA CÂU HỎI (hiện dạng popup).
 * Gồm: nội dung câu hỏi / yêu cầu, thời gian riêng (tùy chọn), lưu ý (tùy chọn).
 * Không có đáp án — mỗi câu là một thử thách để người chơi thực hiện.
 */
export default function QuestionForm({
  initial,
  defaultTime,
  onSubmit,
  onCancel,
}: {
  initial?: Question;
  /** Thời gian mặc định (giây) để hiển thị gợi ý khi để trống */
  defaultTime: number;
  onSubmit: (input: QuestionInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial?.question_text ?? "");
  const [time, setTime] = useState(initial?.time_limit?.toString() ?? "");
  const [hint, setHint] = useState(initial?.hint ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const timeNum = time.trim() === "" ? null : Number(time);

    if (!text.trim()) return setError("Hãy nhập nội dung câu hỏi / yêu cầu.");
    if (timeNum !== null && (!Number.isFinite(timeNum) || timeNum < 3 || timeNum > 600)) return setError("Thời gian phải từ 3 đến 600 giây.");

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        question_text: text.trim(),
        time_limit: timeNum === null ? null : Math.round(timeNum),
        hint: hint.trim() || null,
      });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-purple-950/50 p-3 backdrop-blur-sm sm:items-center">
      <form onSubmit={submit} className="my-auto w-full max-w-2xl space-y-4 rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-rose-700">{initial ? "Sửa câu hỏi" : "Thêm câu hỏi mới"}</h2>

        <label className="block">
          <span className="text-sm font-semibold text-purple-800">Nội dung câu hỏi / yêu cầu</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="VD: Hát một đoạn bài hát về mẹ hoặc về người phụ nữ mà bạn yêu quý."
            className={`${inputCls} mt-1`}
          />
        </label>

        <div>
          <span className="text-sm font-semibold text-purple-800">Thời gian thực hiện (giây)</span>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={3}
              max={600}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder={`Mặc định (${defaultTime}s)`}
              className={`${inputCls} w-44`}
            />
            {TIME_PRESETS.concat(60).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTime(String(s))}
                className={cn(
                  "rounded-full border-2 px-3 py-1 text-sm font-semibold transition",
                  time === String(s) ? "border-rose-500 bg-rose-50 text-rose-700" : "border-pink-200 text-purple-800 hover:border-rose-300"
                )}
              >
                {s}s
              </button>
            ))}
            <button type="button" onClick={() => setTime("")} className="text-sm font-semibold text-purple-700 underline">
              Dùng mặc định
            </button>
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-purple-800">Lưu ý / gợi ý (không bắt buộc)</span>
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="VD: Nói to, rõ để cả lớp cùng nghe nhé!"
            className={`${inputCls} mt-1`}
          />
        </label>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">⚠️ {error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="soft" onClick={onCancel} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu câu hỏi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
