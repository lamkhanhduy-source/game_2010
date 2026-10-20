"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GiftGrid from "@/components/game/GiftGrid";
import QuestionModal from "@/components/game/QuestionModal";
import FinishScreen from "@/components/game/FinishScreen";
import Button from "@/components/ui/Button";
import { useSessionRealtime } from "@/hooks/useSessionRealtime";
import { useRoomChannel } from "@/hooks/useRoomChannel";
import { OPEN_EFFECT_MS } from "@/lib/constants";
import { patchSession } from "@/lib/services/sessions";
import { errorMessage } from "@/lib/utils";
import type { GameSession, GameSettings, Question } from "@/lib/types";

/**
 * CHẾ ĐỘ HOST (màn hình trình chiếu) — HOST LÀ NGUỒN SỰ THẬT.
 *
 *  Host bấm ô ──▶ UPDATE game_sessions (phase = "question") ──Realtime──▶ mọi Player thấy thử thách
 *  Host bấm "Hoàn thành" ──▶ UPDATE (phase = "reveal")  → mọi thiết bị cùng ăn mừng
 *  Host bấm "Tiếp tục" / "Bỏ qua" ──▶ UPDATE (phase = "board") hoặc "finished" nếu đã mở hết
 *  Đồng hồ: mọi thiết bị dùng chung mốc question_started_at nên đếm ngược khớp nhau.
 */
export default function HostGame({
  initialSession,
  questions,
  settings,
  onClose,
}: {
  initialSession: GameSession;
  questions: Question[];
  settings: GameSettings;
  onClose: () => void;
}) {
  const { session: live, applySession } = useSessionRealtime(initialSession);
  const session = live ?? initialSession;

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Giá trị mới nhất cho callback bất đồng bộ (tránh dùng state cũ)
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const questionById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const order = session.question_order;
  const currentQuestion = session.current_question_id ? questionById.get(session.current_question_id) : undefined;
  const currentIndex = session.current_question_id ? order.indexOf(session.current_question_id) : -1;

  const { players } = useRoomChannel({ code: session.room_code, role: "host" });

  /** Chạy 1 thao tác ghi DB, hiển thị lỗi nếu có */
  const run = useCallback(
    async (fn: () => Promise<GameSession>) => {
      setBusy(true);
      setError(null);
      try {
        applySession(await fn());
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setBusy(false);
      }
    },
    [applySession]
  );

  // ---------- 1) Host chọn 1 ô ----------
  const pick = (index: number) => {
    const s = sessionRef.current;
    const qid = s.question_order[index];
    const q = qid ? questionById.get(qid) : undefined;
    if (!q || s.phase !== "board" || s.opened_ids.includes(qid) || busy) return;
    void run(() =>
      patchSession(s.id, {
        current_question_id: qid,
        phase: "question",
        opened_ids: [...s.opened_ids, qid],
        // Mốc đếm ngược nằm sau hiệu ứng mở quà → mọi thiết bị đồng hồ khớp nhau
        question_started_at: new Date(Date.now() + OPEN_EFFECT_MS).toISOString(),
        time_limit: q.time_limit ?? settings.default_time_limit,
      })
    );
  };

  // ---------- 2) Hoàn thành → mọi thiết bị ăn mừng ----------
  const complete = () => {
    const s = sessionRef.current;
    if (s.phase !== "question") return;
    void run(() => patchSession(s.id, { phase: "reveal" }));
  };

  // ---------- 3) Sang ô tiếp theo (cũng dùng cho "Bỏ qua") ----------
  const next = () => {
    const s = sessionRef.current;
    const allOpened = s.opened_ids.length >= s.question_order.length;
    void run(() =>
      patchSession(s.id, {
        phase: allOpened ? "finished" : "board",
        current_question_id: null,
        question_started_at: null,
      })
    );
  };

  // ---------- 4) Đóng phòng ----------
  const closeRoom = async () => {
    if (!window.confirm("Đóng phòng? Người chơi sẽ không thể tiếp tục.")) return;
    try {
      await patchSession(session.id, { is_active: false, phase: "finished" });
    } catch {
      /* đóng ở phía client dù lỗi mạng */
    }
    onClose();
  };

  const openedIndexes = useMemo(() => {
    const set = new Set<number>();
    order.forEach((id, i) => session.opened_ids.includes(id) && set.add(i));
    return set;
  }, [order, session.opened_ids]);

  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${session.room_code}` : "";

  // ====================== GIAO DIỆN ======================
  if (session.phase === "finished") {
    return (
      <FinishScreen
        title="Kết thúc trò chơi!"
        actions={
          <Button size="lg" onClick={() => void closeRoom()}>
            Đóng phòng
          </Button>
        }
      >
        <p className="text-purple-800">
          Đã mở hết <b>{order.length}</b> hộp quà. Cảm ơn mọi người đã tham gia! 🌹
        </p>
      </FinishScreen>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
      {/* Mã phòng + hướng dẫn tham gia */}
      <div className="glass mb-6 flex flex-col items-center justify-between gap-4 rounded-3xl p-5 sm:flex-row">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-purple-700">Mở trang tham gia và nhập mã phòng</p>
          <p className="break-all text-sm text-purple-900/70">{joinUrl}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">Mã phòng</p>
          <p className="shimmer-gold rounded-2xl px-6 py-1 font-mono text-5xl font-extrabold tracking-[0.25em] text-amber-950 sm:text-6xl">
            {session.room_code}
          </p>
        </div>
        <Button variant="soft" size="sm" onClick={() => void closeRoom()}>
          Đóng phòng
        </Button>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">⚠️ {error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <h1 className="mb-5 text-center font-display text-4xl font-bold text-gradient-rose sm:text-5xl">
            {session.phase === "board" ? "Mời chọn một ô may mắn" : "Đang thực hiện thử thách…"}
          </h1>
          <GiftGrid
            total={order.length}
            openedIndexes={openedIndexes}
            iconStyle={session.icon_style}
            onPick={session.phase === "board" ? pick : undefined}
            activeIndex={currentIndex >= 0 ? currentIndex : null}
          />
        </div>

        {/* Cột phải: tiến độ + người xem */}
        <aside className="space-y-4">
          <div className="glass rounded-3xl p-4 text-center">
            <p className="text-sm font-semibold text-purple-700">Đã mở</p>
            <p className="font-display text-5xl font-bold text-rose-600">
              {session.opened_ids.length}
              <span className="text-2xl text-purple-400"> / {order.length}</span>
            </p>
          </div>
          <div className="glass rounded-3xl p-4">
            <h3 className="mb-2 font-bold text-purple-900">👥 Đang xem ({players.length})</h3>
            {players.length === 0 ? (
              <p className="text-sm text-purple-700/70">Chưa có ai vào phòng.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {players.map((n) => (
                  <span key={n} className="rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-rose-700">
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Thẻ thử thách trên màn hình chiếu */}
      {currentQuestion && (session.phase === "question" || session.phase === "reveal") && (
        <QuestionModal
          key={currentQuestion.id}
          question={currentQuestion}
          boxNumber={currentIndex + 1}
          iconStyle={session.icon_style}
          role="host"
          startedAt={session.question_started_at ? Date.parse(session.question_started_at) : null}
          duration={session.time_limit}
          status={session.phase === "reveal" ? "done" : "running"}
          footer={
            session.phase === "question" ? (
              <>
                <Button size="lg" variant="gold" onClick={complete} disabled={busy}>
                  ✅ Hoàn thành
                </Button>
                <Button size="lg" variant="soft" onClick={next} disabled={busy}>
                  ⏭️ Bỏ qua
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={next} disabled={busy}>
                Tiếp tục ➜
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
