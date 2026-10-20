"use client";

import { useCallback, useEffect, useState } from "react";
import ImportExportBar from "@/components/admin/ImportExportBar";
import QuestionForm from "@/components/admin/QuestionForm";
import QuestionList from "@/components/admin/QuestionList";
import SetupNotice from "@/components/layout/SetupNotice";
import Button from "@/components/ui/Button";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createQuestion, deleteQuestion, fetchQuestions, updateQuestion } from "@/lib/services/questions";
import { fetchSettings } from "@/lib/services/settings";
import { errorMessage } from "@/lib/utils";
import type { Question, QuestionInput } from "@/lib/types";

/**
 * /admin/questions — QUẢN LÝ CÂU HỎI (CRUD + Import/Export).
 * Kết nối DB qua lib/services/questions.ts (Supabase JS Client).
 * `editing`: null = đóng form · "new" = thêm mới · Question = đang sửa câu đó.
 */
export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [defaultTime, setDefaultTime] = useState(DEFAULT_SETTINGS.default_time_limit);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Question | "new" | null>(null);

  /** Tải lại danh sách câu hỏi từ DB */
  const reload = useCallback(async () => {
    setError(null);
    try {
      setQuestions(await fetchQuestions());
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void reload();
    fetchSettings()
      .then((s) => setDefaultTime(s.default_time_limit))
      .catch(() => undefined);
  }, [reload]);

  // ---------- Thêm / Sửa ----------
  const save = async (input: QuestionInput) => {
    if (editing && editing !== "new") await updateQuestion(editing.id, input);
    else await createQuestion(input);
    setEditing(null);
    await reload();
  };

  // ---------- Xóa 1 câu ----------
  const remove = async (q: Question) => {
    if (!window.confirm(`Xóa câu hỏi:\n"${q.question_text}"?`)) return;
    try {
      await deleteQuestion(q.id);
      await reload();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!isSupabaseConfigured) return <SetupNotice variant="required" />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-4xl font-bold text-gradient-rose">Ngân hàng câu hỏi ({questions.length})</h1>
        <Button onClick={() => setEditing("new")}>➕ Thêm câu hỏi</Button>
      </div>

      <ImportExportBar questions={questions} onChanged={reload} />

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">⚠️ {error}</p>}
      {loading ? (
        <p className="py-10 text-center font-semibold text-purple-700">Đang tải…</p>
      ) : (
        <QuestionList questions={questions} defaultTime={defaultTime} onEdit={setEditing} onDelete={remove} />
      )}

      {editing && (
        <QuestionForm
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? undefined : editing}
          defaultTime={defaultTime}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
