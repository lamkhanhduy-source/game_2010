import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import PetalsBackground from "@/components/layout/PetalsBackground";

export const metadata: Metadata = {
  title: "Hộp quà 20/10 — Thử thách tri ân Phụ nữ Việt Nam",
  description:
    "Trò chơi tương tác nhân ngày Phụ nữ Việt Nam 20/10: mở hộp quà, nở bông hồng, nhận thử thách và đón pháo hoa chúc mừng.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fde2ef",
};

/**
 * LAYOUT GỐC — bao quanh mọi trang.
 * - Nạp phông chữ Google (Be Vietnam Pro + Dancing Script, có tiếng Việt) bằng thẻ <link>
 *   (không dùng next/font/google để build không phụ thuộc mạng).
 * - Đặt nền cánh hoa rơi ở dưới cùng; nội dung nằm trên (z-10).
 * - suppressHydrationWarning: một số tiện ích trình duyệt tự thêm class/thuộc tính vào <html>/<body>
 *   trước khi React nạp → bỏ cảnh báo hydration vô hại đó (chỉ áp dụng cho chính 2 thẻ này).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Dancing+Script:wght@600;700&display=swap"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <PetalsBackground />
        <div className="relative z-10 min-h-dvh">{children}</div>
      </body>
    </html>
  );
}
