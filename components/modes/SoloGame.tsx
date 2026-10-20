"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import GiftGrid from "@/components/game/GiftGrid";
import QuestionModal from "@/components/game/QuestionModal";
import FinishScreen from "@/components/game/FinishScreen";
import Button, { buttonClass } from "@/components/ui/Button";
import { OPEN_EFFECT_MS } from "@/lib/constants";
import { shuffle } from "@/lib/utils";
import type { GameSettings, Question } from "@/lib/types";

/**
 * CHẾ ĐỘ CÁ NHÂN (Solo) — toàn bộ trạng thái nằm trong trình duyệt, không ghi DB.
 *
 * Luồng: chọn ô → hiệu ứng mở quà → thẻ thử thách (đếm ngược)
 *        → bấm "Hoàn thành" (ăn mừng bằng pháo hoa) hoặc "Bỏ qua" / hết giờ
 *        → ô được đánh dấu đã mở → ... → màn hình kết thúc.
 */
interface Current {
  index: number;
  question: Question;
  startedAt: number;
  duration: number;
}

export default function SoloGame({ questions, settings }: { questions: Question[]; settings: GameSettings }) {
  // Mỗi ô ↔ 1 câu hỏi; xáo trộn khi bắt đầu để thứ tự khác nhau mỗi lần chơi
  const [order, setOrder] = useState<Question[]>(() => shuffle(questions));
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState<Current | null>(null);
  const [status, setStatus] = useState<"running" | "done">("running");
  const [doneCount, setDoneCount] = useState(0);

  const finished = opened.size === order.length && current === null;

  /** Người chơi bấm vào 1 ô */
  const pick = useCallback(
    (index: number) => {
      if (current || opened.has(index)) return; // đang có thử thách / ô đã mở → bỏ qua
      const question = order[index];
      setStatus("running");
      setOpened((prev) => new Set(prev).add(index)); // đánh dấu ngay để không chọn lại
      setCurrent({
        index,
        question,
        // Đồng hồ bắt đầu SAU hiệu ứng mở quà
        startedAt: Date.now() + OPEN_EFFECT_MS,
        duration: question.time_limit ?? settings.default_time_limit,
      });
    },
    [current, opened, order, settings.default_time_limit]
  );

  /** Bấm "Hoàn thành" → dừng đồng hồ + ăn mừng (hiệu ứng nằm trong QuestionModal) */
  const complete = () => {
    if (status === "done") return;
    setStatus("done");
    setDoneCount((c) => c + 1);
  };

  /** Đóng thẻ, quay lại lưới */
  const close = () => setCurrent(null);

  const restart = () => {
    setOrder(shuffle(questions));
    setOpened(new Set());
    setCurrent(null);
    setStatus("running");
    setDoneCount(0);
  };

  if (finished) {
    return (
      <FinishScreen
        actions={
          <>
            <Button onClick={restart} variant="primary" size="lg">
              🔄 Chơi lại
            </Button>
            <Link href="/" className={buttonClass("soft", "lg")}>
              Về trang chủ
            </Link>
          </>
        }
      >
        <p className="text-sm font-semibold text-purple-700">Thử thách đã hoàn thành</p>
        <p className="font-display text-6xl font-bold text-rose-600">
          {doneCount}
          <span className="text-2xl text-purple-400"> / {order.length}</span>
        </p>
      </FinishScreen>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      {/* Thanh tiến độ */}
      <div className="glass mx-auto mb-6 flex max-w-2xl items-center justify-between rounded-2xl px-5 py-3">
        <span className="font-semibold text-purple-800">
          Đã mở {opened.size}/{order.length}
        </span>
        <span className="rounded-full bg-gradient-to-r from-gold-200 to-gold-400 px-4 py-1 font-extrabold text-amber-900">
          ✅ {doneCount} thử thách
        </span>
      </div>

      <h1 className="mb-6 text-center font-display text-4xl font-bold text-gradient-rose sm:text-5xl">
        {settings.icon_style === "gift" ? "Chọn một hộp quà may mắn" : "Chọn một bông hồng rực rỡ"}
      </h1>

      <GiftGrid total={order.length} openedIndexes={opened} iconStyle={settings.icon_style} onPick={pick} activeIndex={current?.index} />

      {/* Thẻ thử thách: key = ô đang mở → mount mới (chạy lại hiệu ứng) cho mỗi ô */}
      {current && (
        <QuestionModal
          key={current.index}
          question={current.question}
          boxNumber={current.index + 1}
          iconStyle={settings.icon_style}
          role="solo"
          startedAt={current.startedAt}
          duration={current.duration}
          status={status}
          footer={
            status === "running" ? (
              <>
                <Button size="lg" variant="gold" onClick={complete}>
                  ✅ Hoàn thành
                </Button>
                <Button size="lg" variant="soft" onClick={close}>
                  ⏭️ Bỏ qua
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={close}>
                Tiếp tục ➜
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
