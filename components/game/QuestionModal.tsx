"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import OpenEffect from "./OpenEffect";
import CountdownRing from "./CountdownRing";
import { useCountdown, useTickSound } from "@/hooks/useCountdown";
import { fireCelebration } from "@/lib/effects/confetti";
import { playCorrect, playTimeUp } from "@/lib/effects/sound";
import { TIMEUP_MESSAGES, WISHES } from "@/lib/constants";
import { cn, pickRandom } from "@/lib/utils";
import type { IconStyle, Question } from "@/lib/types";

export type QuestionRole = "solo" | "host" | "player";

interface QuestionModalProps {
  question: Question;
  /** Số thứ tự ô (bắt đầu từ 1) */
  boxNumber: number;
  iconStyle: IconStyle;
  role: QuestionRole;
  /** Mốc bắt đầu đếm ngược (ms epoch). Có thể ở tương lai để chừa chỗ cho hiệu ứng mở quà. */
  startedAt: number | null;
  /** Tổng số giây của thử thách */
  duration: number;
  /** running = đang làm (đồng hồ chạy) · done = đã hoàn thành (ăn mừng, đồng hồ dừng) */
  status: "running" | "done";
  /** Bỏ qua hiệu ứng mở quà (vào phòng giữa chừng) */
  skipOpening?: boolean;
  /** Dòng trạng thái nhỏ dưới thử thách */
  statusText?: string;
  /** Khu vực nút bấm cuối (Hoàn thành, Bỏ qua, Tiếp tục…) */
  footer?: ReactNode;
}

/** Vị trí các ngôi sao lấp lánh quanh thẻ */
const TWINKLES = [
  { top: "-18px", left: "6%", d: 0 },
  { top: "-22px", left: "52%", d: 0.7 },
  { top: "-16px", right: "7%", d: 1.3 },
  { bottom: "-20px", left: "14%", d: 0.4 },
  { bottom: "-24px", right: "30%", d: 1.0 },
  { top: "38%", left: "-20px", d: 1.6 },
  { top: "55%", right: "-20px", d: 0.2 },
];

/**
 * THẺ THỬ THÁCH — gồm 2 giai đoạn:
 *  1) "opening": chạy <OpenEffect/> (mở quà / nở hoa).
 *  2) "ready"  : hiện thẻ có viền vàng–hồng xoay, câu hỏi hiện từng chữ, đồng hồ đếm ngược.
 * Khi status chuyển sang "done": phát âm thanh, bắn pháo hoa + cánh hoa, hiện lời chúc 20/10.
 * Khi hết giờ mà chưa hoàn thành: thẻ rung nhẹ + tiếng chuông + lời động viên.
 * Component được mount lại cho mỗi ô (cha truyền key) nên hiệu ứng chạy lại đúng lúc.
 */
export default function QuestionModal(props: QuestionModalProps) {
  const { question, boxNumber, iconStyle, role, startedAt, duration, status, skipOpening, statusText, footer } = props;

  const [stage, setStage] = useState<"opening" | "ready">(skipOpening ? "ready" : "opening");
  const done = status === "done";

  // ---------- Đếm ngược (logic nằm trong hooks/useCountdown.ts) ----------
  const { remaining, expired } = useCountdown({ startedAt, duration, running: !done });
  useTickSound(remaining, stage === "ready" && !done && role !== "player"); // điện thoại người chơi không tick
  const timeUp = expired && !done;
  const danger = !done && !timeUp && remaining > 0 && Math.ceil(remaining) <= 5;

  // Lời chúc / lời động viên chọn ngẫu nhiên 1 lần cho mỗi ô
  const wish = useMemo(() => pickRandom(WISHES), [question.id]);
  const timeUpMsg = useMemo(() => pickRandom(TIMEUP_MESSAGES), [question.id]);
  const words = useMemo(() => question.question_text.split(/\s+/).filter(Boolean), [question.question_text]);

  // ---------- HIỆU ỨNG KHI HOÀN THÀNH / HẾT GIỜ (mỗi loại chỉ chạy 1 lần) ----------
  const firedRef = useRef({ done: false, timeUp: false });
  useEffect(() => {
    if (done && !firedRef.current.done) {
      firedRef.current.done = true;
      playCorrect(); // âm thanh chúc mừng
      fireCelebration(); // pháo hoa + cánh hoa hồng
    }
  }, [done]);
  useEffect(() => {
    if (timeUp && !firedRef.current.timeUp) {
      firedRef.current.timeUp = true;
      playTimeUp();
    }
  }, [timeUp]);

  const big = role === "host"; // màn hình máy chiếu: chữ to hơn

  return (
    <>
      <AnimatePresence>
        {stage === "opening" && <OpenEffect style={iconStyle} onDone={() => setStage("ready")} />}
      </AnimatePresence>

      {stage === "ready" && (
        <motion.div
          className="fixed inset-0 z-40 overflow-y-auto"
          style={{ background: "radial-gradient(circle at 50% 28%, rgba(192,38,211,0.6), rgba(46,16,101,0.95) 75%)", perspective: 1200 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Quầng sáng trôi chậm ở nền */}
          <motion.div
            aria-hidden
            className="pointer-events-none fixed -left-24 top-10 h-80 w-80 rounded-full bg-pink-500/40 blur-3xl"
            animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none fixed -right-24 bottom-10 h-96 w-96 rounded-full bg-amber-400/30 blur-3xl"
            animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
            <motion.div
              className={cn("relative w-full", big ? "max-w-5xl" : "max-w-3xl")}
              initial={{ scale: 0.5, rotateX: -60, y: 80, opacity: 0 }}
              animate={
                timeUp
                  ? { x: [0, -10, 10, -8, 8, -4, 4, 0], scale: 1, rotateX: 0, y: 0, opacity: 1 }
                  : { x: 0, scale: 1, rotateX: 0, y: 0, opacity: 1 }
              }
              transition={timeUp ? { duration: 0.5 } : { type: "spring", stiffness: 170, damping: 17 }}
            >
              {/* Ngôi sao lấp lánh quanh thẻ */}
              {TWINKLES.map((t, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute z-10 text-2xl text-amber-300"
                  style={{ top: t.top, bottom: t.bottom, left: t.left, right: (t as { right?: string }).right, textShadow: "0 0 12px rgba(253,224,71,0.95)" }}
                  animate={{ scale: [0.5, 1.3, 0.5], opacity: [0.3, 1, 0.3], rotate: [0, 90, 180] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: t.d }}
                >
                  ✦
                </motion.span>
              ))}

              {/* Viền chuyển sắc xoay + thẻ trắng bên trong */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-[2rem] p-[4px] transition-shadow",
                  danger || timeUp ? "shadow-[0_0_70px_rgba(239,68,68,0.6)]" : "shadow-[0_0_60px_rgba(251,191,36,0.5)]"
                )}
              >
                <span aria-hidden className="border-spin" />
                <div className="relative rounded-[calc(2rem-4px)] bg-white/97 p-5 sm:p-9" style={{ backgroundColor: "rgba(255,255,255,0.97)" }}>
                  {/* Đầu thẻ: nhãn + đồng hồ */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="shimmer-gold rounded-full px-3 py-1 text-sm font-extrabold text-amber-950">
                        {iconStyle === "gift" ? "🎁 Hộp quà" : "🌹 Bông hồng"} số {boxNumber}
                      </span>
                      <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-sm font-bold text-fuchsia-700">🎯 Thử thách</span>
                    </div>
                    <CountdownRing remaining={remaining} total={duration} size={big ? 96 : 68} />
                  </div>

                  {/* Nội dung: hiện từng chữ (mờ → rõ, trồi lên) */}
                  <h2
                    className={cn(
                      "mt-6 font-extrabold leading-snug text-purple-950",
                      big ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"
                    )}
                  >
                    {words.map((w, i) => (
                      <Fragment key={i}>
                        <motion.span
                          className="inline-block"
                          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{ delay: 0.25 + i * 0.045, duration: 0.45 }}
                        >
                          {w}
                        </motion.span>{" "}
                      </Fragment>
                    ))}
                  </h2>

                  {question.hint && (
                    <motion.p
                      className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + words.length * 0.045 }}
                    >
                      💡 {question.hint}
                    </motion.p>
                  )}

                  {!done && !timeUp && statusText && <p className="mt-4 text-center text-sm font-semibold text-purple-700">{statusText}</p>}

                  <AnimatePresence mode="wait">
                    {/* ---------- HOÀN THÀNH ---------- */}
                    {done && (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 14 }}
                        className="shine relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-r from-pink-100 via-amber-100 to-fuchsia-100 p-5 text-center"
                      >
                        <motion.div
                          className="text-5xl"
                          animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                        >
                          🌹
                        </motion.div>
                        <p className="mt-1 text-xl font-extrabold text-rose-600">🎉 Xuất sắc! Hoàn thành thử thách!</p>
                        <p className="mt-2 font-display text-2xl leading-snug text-rose-700 sm:text-3xl">{wish}</p>
                      </motion.div>
                    )}

                    {/* ---------- HẾT GIỜ ---------- */}
                    {timeUp && (
                      <motion.div
                        key="timeup"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 rounded-3xl bg-purple-50 p-5 text-center"
                      >
                        <p className="text-xl font-extrabold text-purple-800">⏰ Hết giờ rồi!</p>
                        <p className="mt-1 text-purple-700">{timeUpMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {footer && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{footer}</div>}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  );
}
