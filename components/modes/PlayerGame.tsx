"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GiftGrid from "@/components/game/GiftGrid";
import QuestionModal from "@/components/game/QuestionModal";
import FinishScreen from "@/components/game/FinishScreen";
import { buttonClass } from "@/components/ui/Button";
import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { useRoomChannel } from "@/hooks/useRoomChannel";
import { setSoundEnabled } from "@/lib/effects/sound";
import type { GameSession, Question } from "@/lib/types";

/**
 * CHẾ ĐỘ PLAYER (điện thoại người xem) — chỉ ĐỌC trạng thái phòng.
 *
 *  - Ô nào đã mở, thử thách hiện tại, đồng hồ đếm ngược và lúc "Hoàn thành" đều được
 *    đồng bộ tức thì từ bảng game_sessions qua Supabase Realtime.
 *  - Mặc định TẮT TIẾNG trên điện thoại (để cả lớp không phát tiếng chồng nhau);
 *    bấm nút 🔕/🔔 trên thanh trên cùng để bật.
 */
export default function PlayerGame({
  initialSession,
  questions,
  name,
}: {
  initialSession: GameSession;
  questions: Question[];
  name: string;
}) {
  const { session: live } = useSessionRealtime(initialSession);
  const session = live ?? initialSession;
  useRoomChannel({ code: session.room_code, role: "player", name });

  const [sound, setSound] = useState(false);
  useEffect(() => {
    setSoundEnabled(sound);
  }, [sound]);

  const questionById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const order = session.question_order;
  const question = session.current_question_id ? questionById.get(session.current_question_id) : undefined;
  const index = session.current_question_id ? order.indexOf(session.current_question_id) : -1;
  const done = session.phase === "reveal";

  const openedIndexes = useMemo(() => {
    const set = new Set<number>();
    order.forEach((id, i) => session.opened_ids.includes(id) && set.add(i));
    return set;
  }, [order, session.opened_ids]);

  // Vào phòng muộn (thử thách đã bắt đầu từ trước) → bỏ qua hiệu ứng mở quà
  const startedAt = session.question_started_at ? Date.parse(session.question_started_at) : null;
  const joinedLate = done || (startedAt !== null && Date.now() > startedAt + 1500);

  // ====================== GIAO DIỆN ======================
  if (!session.is_active) {
    return (
      <div className="glass mx-auto max-w-md rounded-3xl p-8 text-center">
        <div className="text-5xl">👋</div>
        <h2 className="mt-2 text-xl font-bold text-rose-700">Phòng đã đóng</h2>
        <p className="mt-1 text-purple-800">Cảm ơn bạn đã tham gia!</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-5")}>
          Về trang chủ
        </Link>
      </div>
    );
  }

  if (session.phase === "finished") {
    return (
      <FinishScreen
        title="Kết thúc trò chơi!"
        actions={
          <Link href="/" className={buttonClass("soft", "lg")}>
            Về trang chủ
          </Link>
        }
      >
        <p className="text-purple-800">Cảm ơn bạn đã cùng tham gia! Chúc mừng 20/10 🌹</p>
      </FinishScreen>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
      <div className="glass mx-auto mb-6 flex max-w-2xl items-center justify-between gap-3 rounded-2xl px-5 py-3">
        <span className="truncate font-semibold text-purple-800">
          {name} · phòng <b className="font-mono tracking-wider">{session.room_code}</b>
        </span>
        <button
          type="button"
          onClick={() => setSound((v) => !v)}
          className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-lg shadow"
          aria-label={sound ? "Tắt âm thanh" : "Bật âm thanh"}
        >
          {sound ? "🔔" : "🔕"}
        </button>
      </div>

      <h1 className="mb-6 text-center font-display text-4xl font-bold text-gradient-rose">
        {session.phase === "board" ? "Chờ Host chọn ô…" : "Thử thách đang diễn ra!"}
      </h1>

      {/* Lưới chỉ để xem (không có onPick) — ô nào Host đã mở sẽ tự đánh dấu */}
      <GiftGrid
        total={order.length}
        openedIndexes={openedIndexes}
        iconStyle={session.icon_style}
        activeIndex={index >= 0 ? index : null}
      />

      {question && (session.phase === "question" || session.phase === "reveal") && (
        <QuestionModal
          key={question.id}
          question={question}
          boxNumber={index + 1}
          iconStyle={session.icon_style}
          role="player"
          skipOpening={joinedLate}
          startedAt={startedAt}
          duration={session.time_limit}
          status={done ? "done" : "running"}
          statusText={done ? undefined : "👀 Cùng cổ vũ nào!"}
          footer={done ? <span className="text-sm font-semibold text-purple-700">Chờ Host chuyển sang ô tiếp theo…</span> : undefined}
        />
      )}
    </div>
  );
}
