"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { fireFinale } from "@/lib/effects/confetti";
import { playFinale } from "@/lib/effects/sound";

/**
 * MÀN HÌNH KẾT THÚC — pháo hoa liên tiếp + lời chúc 20/10.
 * `children`: điểm số / bảng xếp hạng; `actions`: các nút (Chơi lại, Về trang chủ…).
 */
export default function FinishScreen({
  title = "Hoàn thành tất cả hộp quà!",
  children,
  actions,
}: {
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  useEffect(() => {
    playFinale();
    fireFinale();
  }, []);

  return (
    <motion.div
      className="glass mx-auto w-full max-w-xl rounded-3xl p-6 text-center sm:p-10"
      initial={{ scale: 0.8, opacity: 0, y: 30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 16 }}
    >
      <div className="text-6xl">🎉</div>
      <h2 className="mt-2 font-display text-4xl font-bold text-gradient-rose sm:text-5xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-purple-900/80">
        Chúc mừng ngày Phụ nữ Việt Nam 20/10! Chúc những người phụ nữ luôn xinh đẹp, hạnh phúc và được yêu thương mỗi
        ngày. 🌹
      </p>
      {children && <div className="mt-6">{children}</div>}
      {actions && <div className="mt-7 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </motion.div>
  );
}
