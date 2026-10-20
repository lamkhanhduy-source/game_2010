"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import BoxIcon from "./BoxIcon";
import { fireOpenBurst } from "@/lib/effects/confetti";
import { playOpen } from "@/lib/effects/sound";
import { OPEN_EFFECT_MS } from "@/lib/constants";
import type { IconStyle } from "@/lib/types";

/**
 * HIỆU ỨNG MỞ QUÀ / NỞ HOA TOÀN MÀN HÌNH  ←  nơi gọi hiệu ứng "hoành tráng" (Framer Motion)
 *
 * Dòng thời gian (khớp âm thanh playOpen trong lib/effects/sound.ts):
 *   0,00s  "enter" : nền tím huyền ảo hiện ra, hộp quà bật lên từ dưới với lò xo
 *   0,45s  "shake" : hộp rung lắc dồn nén, ánh sáng vàng phình to dần
 *   1,00s  "burst" : BÙM — chớp trắng, 3 vòng sóng xung kích, tia sáng xoay, nắp bật tung / hoa nở,
 *                    sao + cánh hoa + bụi vàng bắn tỏa ra, pháo giấy (fireOpenBurst)
 *   1,90s  xong    : gọi onDone → hiện thẻ thử thách
 */

type Stage = "enter" | "shake" | "burst";
const SHAKE_AT = 450;
const BURST_AT = 1000;

const GLYPHS = ["✨", "🌸", "💖", "⭐", "🌹"];

export default function OpenEffect({ style, onDone }: { style: IconStyle; onDone: () => void }) {
  const [stage, setStage] = useState<Stage>("enter");

  // Giữ onDone mới nhất mà không reset bộ đếm thời gian mỗi lần cha render lại
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  // Chỉ phát tiếng 1 lần (React StrictMode ở chế độ dev chạy effect 2 lần)
  const soundRef = useRef(false);

  useEffect(() => {
    if (!soundRef.current) {
      soundRef.current = true;
      playOpen();
    }
    const t1 = setTimeout(() => setStage("shake"), SHAKE_AT);
    const t2 = setTimeout(() => {
      setStage("burst");
      fireOpenBurst();
    }, BURST_AT);
    const t3 = setTimeout(() => doneRef.current(), OPEN_EFFECT_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Dữ liệu ngẫu nhiên tạo 1 lần (component này chỉ mount sau khi người dùng bấm → không lệch hydration)
  const sparks = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        angle: (i / 22) * Math.PI * 2 + Math.random() * 0.3,
        dist: 150 + Math.random() * 230,
        glyph: GLYPHS[i % GLYPHS.length],
        size: 18 + Math.random() * 22,
        rot: (Math.random() - 0.5) * 720,
      })),
    []
  );
  const dust = useMemo(
    () =>
      Array.from({ length: 36 }, () => ({
        angle: Math.random() * Math.PI * 2,
        dist: 80 + Math.random() * 330,
        size: 3 + Math.random() * 7,
        delay: Math.random() * 0.15,
      })),
    []
  );

  const burst = stage === "burst";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(circle at 50% 50%, rgba(168,85,247,0.6), rgba(46,16,101,0.95) 72%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Tia sáng vàng xoay */}
      <motion.div
        className="absolute h-[150vmax] w-[150vmax]"
        style={{
          background: "repeating-conic-gradient(from 0deg, rgba(253,224,71,0.42) 0deg 6deg, transparent 6deg 20deg)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 36%)",
          maskImage: "radial-gradient(circle, black 0%, transparent 36%)",
        }}
        initial={{ opacity: 0, rotate: 0, scale: 0.3 }}
        animate={burst ? { opacity: 1, rotate: 100, scale: 1 } : { opacity: 0.15, rotate: 20, scale: 0.5 }}
        transition={{ duration: burst ? 0.9 : 0.6, ease: "easeOut" }}
      />

      {/* Quầng sáng vàng — phình dần khi rung, bùng ra khi nổ */}
      <motion.div
        className="absolute h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(253,230,138,0.95), rgba(253,230,138,0) 70%)" }}
        animate={
          burst
            ? { scale: [1.2, 3.2], opacity: [1, 0] }
            : stage === "shake"
              ? { scale: [0.8, 1.25], opacity: 0.75 }
              : { scale: 0.6, opacity: 0.3 }
        }
        transition={{ duration: burst ? 0.9 : 0.55, ease: "easeOut" }}
      />

      {/* 3 vòng sóng xung kích */}
      {burst &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute h-40 w-40 rounded-full border-4 border-amber-200"
            style={{ boxShadow: "0 0 30px rgba(253,230,138,0.85), inset 0 0 20px rgba(253,230,138,0.5)" }}
            initial={{ scale: 0.2, opacity: 0.95 }}
            animate={{ scale: 5 + i * 1.6, opacity: 0 }}
            transition={{ duration: 1, delay: i * 0.12, ease: "easeOut" }}
          />
        ))}

      {/* Hộp quà / bông hồng */}
      <motion.div
        className="relative h-52 w-52 sm:h-64 sm:w-64"
        initial={{ scale: 0.2, y: 80, rotate: -10, opacity: 0 }}
        animate={
          stage === "enter"
            ? { scale: 1, y: 0, rotate: 0, opacity: 1 }
            : stage === "shake"
              ? { scale: [1, 1.08, 1.04, 1.1, 1.06], rotate: [0, -7, 7, -9, 9, -5, 5, 0], y: 0, opacity: 1 }
              : { scale: 1.45, y: -10, rotate: 0, opacity: 1 }
        }
        transition={
          stage === "enter"
            ? { type: "spring", stiffness: 160, damping: 12 }
            : stage === "shake"
              ? { duration: 0.55 }
              : { type: "spring", stiffness: 220, damping: 10 }
        }
      >
        <BoxIcon style={style} state={burst ? "opening" : "closed"} />
      </motion.div>

      {/* Dòng chữ chờ đợi */}
      <motion.p
        className="absolute bottom-[14%] font-display text-3xl font-bold text-amber-100 sm:text-4xl"
        style={{ textShadow: "0 0 18px rgba(253,224,71,0.9)" }}
        animate={{ opacity: burst ? 0 : [0.6, 1, 0.6], scale: burst ? 1.4 : 1 }}
        transition={burst ? { duration: 0.25 } : { duration: 1, repeat: Infinity }}
      >
        ✨ Đang mở quà… ✨
      </motion.p>

      {/* Sao / cánh hoa / trái tim bắn tỏa ra */}
      {burst &&
        sparks.map((s, i) => (
          <motion.span
            key={`s${i}`}
            className="absolute"
            style={{ fontSize: s.size }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.3, rotate: 0 }}
            animate={{
              x: Math.cos(s.angle) * s.dist,
              y: Math.sin(s.angle) * s.dist,
              opacity: [1, 1, 0],
              scale: [0.3, 1.3, 0.9],
              rotate: s.rot,
            }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          >
            {s.glyph}
          </motion.span>
        ))}

      {/* Bụi vàng */}
      {burst &&
        dust.map((d, i) => (
          <motion.span
            key={`d${i}`}
            className="absolute rounded-full"
            style={{
              width: d.size,
              height: d.size,
              background: "radial-gradient(circle, #fff7cc, #f6d26b 60%, rgba(246,210,107,0))",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(d.angle) * d.dist, y: Math.sin(d.angle) * d.dist, opacity: [1, 0.9, 0], scale: [1, 1.4, 0.4] }}
            transition={{ duration: 1.0, delay: d.delay, ease: "easeOut" }}
          />
        ))}

      {/* Chớp trắng */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: burst ? [0.95, 0] : 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />
    </motion.div>
  );
}
