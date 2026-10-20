"use client";

import { motion } from "framer-motion";
import type { IconStyle } from "@/lib/types";

/**
 * BIỂU TƯỢNG HỘP QUÀ / BÔNG HỒNG (SVG tự vẽ, không cần ảnh)
 *
 * state:
 *  - "closed"  : hộp quà đóng nắp / nụ hồng chúm chím
 *  - "opening" : nắp hộp bật tung / hoa nở bung  ← hiệu ứng Framer Motion
 *  - "opened"  : đã mở (nắp lệch sang bên / hoa nở) — dùng cho ô đã chọn
 */
export type BoxState = "closed" | "opening" | "opened";

export default function BoxIcon({ style, state = "closed" }: { style: IconStyle; state?: BoxState }) {
  return style === "gift" ? <Gift state={state} /> : <Rose state={state} />;
}

const spring = { type: "spring", stiffness: 140, damping: 12 } as const;

/* ------------------------------ HỘP QUÀ ------------------------------ */
function Gift({ state }: { state: BoxState }) {
  const lid =
    state === "opening"
      ? { y: -34, x: -6, rotate: -18 }
      : state === "opened"
        ? { y: -12, x: -8, rotate: -10 }
        : { y: 0, x: 0, rotate: 0 };

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-md" role="img" aria-label="Hộp quà">
      <defs>
        <linearGradient id="gift-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9ec4" />
          <stop offset="1" stopColor="#e8458b" />
        </linearGradient>
        <linearGradient id="gift-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff7fb0" />
          <stop offset="1" stopColor="#d6327a" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde58a" />
          <stop offset="1" stopColor="#e0a920" />
        </linearGradient>
      </defs>

      {/* Ánh sáng lóe ra khi mở */}
      <motion.circle
        cx="60"
        cy="60"
        r="34"
        fill="#fff3b0"
        initial={false}
        animate={{ opacity: state === "opening" ? 0.9 : 0, scale: state === "opening" ? 1.5 : 0.5 }}
        transition={{ duration: 0.5 }}
      />

      {/* Thân hộp */}
      <rect x="22" y="56" width="76" height="52" rx="8" fill="url(#gift-body)" />
      <rect x="54" y="56" width="12" height="52" fill="url(#gold)" />

      {/* Nắp + nơ — nhóm này bật lên khi mở */}
      <motion.g initial={false} animate={lid} transition={spring}>
        <rect x="16" y="40" width="88" height="20" rx="6" fill="url(#gift-lid)" />
        <rect x="54" y="40" width="12" height="20" fill="url(#gold)" />
        <path d="M60 40 C38 8, 12 28, 44 42 Z" fill="url(#gold)" />
        <path d="M60 40 C82 8, 108 28, 76 42 Z" fill="url(#gold)" />
        <circle cx="60" cy="41" r="6.5" fill="#f2c13c" stroke="#d9a21b" strokeWidth="1.5" />
      </motion.g>
    </svg>
  );
}

/* ------------------------------ BÔNG HỒNG ------------------------------ */
function Rose({ state }: { state: BoxState }) {
  const bloomed = state !== "closed";
  // 5 cánh ngoài + 5 cánh giữa, mỗi lớp xoay đều quanh tâm hoa (60, 46)
  const outer = [0, 72, 144, 216, 288];
  const mid = [36, 108, 180, 252, 324];

  return (
    <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-md" role="img" aria-label="Bông hồng">
      <defs>
        <radialGradient id="petal-outer" cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ff6b8f" />
          <stop offset="1" stopColor="#c8102e" />
        </radialGradient>
        <radialGradient id="petal-mid" cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor="#ff8fab" />
          <stop offset="1" stopColor="#e11d48" />
        </radialGradient>
      </defs>

      {/* Thân + lá */}
      <path d="M60 66 C58 84, 62 100, 60 116" stroke="#3f9b5a" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="74" cy="92" rx="13" ry="6" transform="rotate(-30 74 92)" fill="#4cb06a" />
      <ellipse cx="46" cy="100" rx="13" ry="6" transform="rotate(28 46 100)" fill="#3f9b5a" />

      {/* Nụ hồng (khi chưa nở) */}
      <motion.g initial={false} animate={{ opacity: bloomed ? 0 : 1, scale: bloomed ? 1.6 : 1 }} transition={{ duration: 0.35 }}>
        <path d="M60 22 C44 30, 44 58, 60 68 C76 58, 76 30, 60 22 Z" fill="url(#petal-outer)" />
        <path d="M60 28 C52 36, 52 56, 60 64 C68 56, 68 36, 60 28 Z" fill="url(#petal-mid)" />
        <path d="M48 62 C54 70, 66 70, 72 62 C70 72, 50 72, 48 62 Z" fill="#3f9b5a" />
      </motion.g>

      {/* Hoa nở bung */}
      <motion.g
        initial={false}
        animate={{ opacity: bloomed ? 1 : 0, scale: bloomed ? 1 : 0.3, rotate: bloomed ? 0 : -40 }}
        transition={spring}
      >
        {outer.map((deg) => (
          <g key={`o${deg}`} transform={`rotate(${deg} 60 46)`}>
            <ellipse cx="60" cy="24" rx="15" ry="22" fill="url(#petal-outer)" />
          </g>
        ))}
        {mid.map((deg) => (
          <g key={`m${deg}`} transform={`rotate(${deg} 60 46)`}>
            <ellipse cx="60" cy="30" rx="11" ry="16" fill="url(#petal-mid)" />
          </g>
        ))}
        <circle cx="60" cy="46" r="11" fill="#ff5c85" />
        <path d="M54 46 C54 40, 66 40, 66 46 C66 51, 57 52, 56 47" stroke="#a30f2d" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="46" r="3" fill="#fbd34d" />
      </motion.g>
    </svg>
  );
}
