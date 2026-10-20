"use client";

import { motion } from "framer-motion";
import BoxIcon from "./BoxIcon";
import { cn } from "@/lib/utils";
import type { IconStyle } from "@/lib/types";

interface GiftBoxProps {
  /** Số thứ tự hiển thị (bắt đầu từ 1) */
  number: number;
  style: IconStyle;
  /** Đã được mở → khóa, làm mờ, hiện dấu ✓ (tránh chọn lại) */
  opened: boolean;
  /** Đang là ô hiện tại */
  active?: boolean;
  /** undefined = chỉ xem (không bấm được) */
  onPick?: () => void;
  /** Vị trí trong lưới, dùng để so le hiệu ứng */
  index: number;
}

/**
 * MỘT Ô TRÊN LƯỚI — hộp quà hoặc bông hồng.
 * Hiệu ứng: xuất hiện lần lượt (stagger), nhún nhẹ liên tục, vệt sáng ánh kim quét ngang,
 * sao lấp lánh ở góc, phát sáng vàng + lắc khi rê chuột/chạm.
 */
export default function GiftBox({ number, style, opened, active, onPick, index }: GiftBoxProps) {
  const clickable = Boolean(onPick) && !opened;
  const delay = `${(index % 7) * 0.6}s`;

  return (
    <motion.button
      type="button"
      disabled={!clickable}
      onClick={onPick}
      aria-label={opened ? `Ô số ${number} đã mở` : `Mở ô số ${number}`}
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: opened ? 0.55 : 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 180, damping: 14, delay: Math.min(index * 0.04, 0.8) }}
      whileHover={clickable ? { scale: 1.1, rotate: [0, -4, 4, 0], transition: { duration: 0.4 } } : undefined}
      whileTap={clickable ? { scale: 0.93 } : undefined}
      style={{ ["--d" as string]: delay }}
      className={cn(
        "group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-3xl p-2 transition-shadow",
        opened ? "bg-white/40" : "glass shine hover:shadow-[0_0_38px_rgba(251,191,36,0.75)]",
        active && "ring-4 ring-gold-400",
        clickable ? "cursor-pointer" : "cursor-default"
      )}
    >
      {/* Biểu tượng — nhún nhẹ liên tục khi còn đóng để thu hút */}
      <motion.div
        className="h-[78%] w-[78%]"
        animate={clickable ? { y: [0, -5, 0] } : { y: 0 }}
        transition={clickable ? { duration: 2.4, repeat: Infinity, delay: (index % 6) * 0.25, ease: "easeInOut" } : undefined}
      >
        <BoxIcon style={style} state={opened ? "opened" : "closed"} />
      </motion.div>

      {/* Sao lấp lánh ở hai góc (chỉ ô chưa mở) */}
      {!opened && (
        <>
          <span aria-hidden className="twinkle-star right-3 top-8" style={{ ["--d" as string]: delay }}>
            ✦
          </span>
          <span aria-hidden className="twinkle-star bottom-3 left-3 text-[11px]" style={{ ["--d" as string]: `${(index % 5) * 0.5 + 0.9}s` }}>
            ✦
          </span>
        </>
      )}

      {/* Số thứ tự */}
      <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold-200 to-gold-400 px-1.5 text-xs font-bold text-amber-900 shadow">
        {number}
      </span>

      {/* Dấu đã mở */}
      {opened && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow">
          ✓
        </span>
      )}
    </motion.button>
  );
}
