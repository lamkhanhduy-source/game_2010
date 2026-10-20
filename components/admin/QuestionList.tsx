import Button from "@/components/ui/Button";
import type { Question } from "@/lib/types";

/** DANH SÁCH CÂU HỎI — mỗi thẻ hiển thị nội dung, thời gian, lưu ý và nút Sửa / Xóa. */
export default function QuestionList({
  questions,
  defaultTime,
  onEdit,
  onDelete,
}: {
  questions: Question[];
  defaultTime: number;
  onEdit: (q: Question) => void;
  onDelete: (q: Question) => void;
}) {
  if (questions.length === 0) {
    return (
      <div className="glass rounded-3xl p-10 text-center">
        <div className="text-5xl">📭</div>
        <p className="mt-2 font-semibold text-purple-900">Chưa có câu hỏi nào.</p>
        <p className="text-sm text-purple-700/80">Thêm thủ công, nhập từ file hoặc nạp câu hỏi mẫu ở phía trên.</p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {questions.map((q, i) => (
        <li key={q.id} className="glass rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-purple-950">
              <span className="mr-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-400 px-2 text-sm font-bold text-amber-900">
                {i + 1}
              </span>
              {q.question_text}
            </p>
            <div className="flex shrink-0 gap-1">
              <Button size="sm" variant="soft" onClick={() => onEdit(q)}>
                Sửa
              </Button>
              <Button size="sm" variant="danger" onClick={() => onDelete(q)}>
                Xóa
              </Button>
            </div>
          </div>

          <p className="mt-2 text-xs text-purple-700/80">
            ⏱️ {q.time_limit ?? defaultTime}s{q.time_limit === null && " (mặc định)"}
            {q.hint && <> · 💡 {q.hint}</>}
          </p>
        </li>
      ))}
    </ol>
  );
}
