"use client";

import GiftBox from "./GiftBox";
import type { IconStyle } from "@/lib/types";

interface GiftGridProps {
  /** Tổng số ô (= số câu hỏi) */
  total: number;
  /** Chỉ số các ô đã mở */
  openedIndexes: ReadonlySet<number>;
  iconStyle: IconStyle;
  /** Bấm vào ô. Bỏ trống → lưới chỉ để xem (màn hình Player) */
  onPick?: (index: number) => void;
  /** Ô đang là câu hỏi hiện tại */
  activeIndex?: number | null;
}

/**
 * LƯỚI HỘP QUÀ / BÔNG HỒNG — màn hình chính của trò chơi.
 * Responsive: 3 cột (điện thoại) → 4 (tablet dọc) → 5 → 6 (máy tính / máy chiếu).
 */
export default function GiftGrid({ total, openedIndexes, iconStyle, onPick, activeIndex }: GiftGridProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: total }, (_, i) => (
        <GiftBox
          key={i}
          index={i}
          number={i + 1}
          style={iconStyle}
          opened={openedIndexes.has(i)}
          active={activeIndex === i}
          onPick={onPick ? () => onPick(i) : undefined}
        />
      ))}
    </div>
  );
}
