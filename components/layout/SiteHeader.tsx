import Link from "next/link";
import type { ReactNode } from "react";

/**
 * THANH TIÊU ĐỀ — logo bấm để về trang chủ, có chỗ chèn nội dung bên phải (điểm số, nút...).
 */
export default function SiteHeader({ right, title }: { right?: ReactNode; title?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2 text-rose-600 transition hover:scale-[1.02]">
        <span className="text-2xl" aria-hidden>
          🌹
        </span>
        <span className="font-display text-2xl font-bold leading-none sm:text-3xl">Hộp quà 20/10</span>
      </Link>
      {title && <span className="hidden text-sm font-semibold text-purple-700 sm:inline">{title}</span>}
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
