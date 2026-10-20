import type { NextConfig } from "next";

/**
 * Cấu hình Next.js.
 * Không cần cấu hình gì đặc biệt để deploy lên Vercel:
 * - Tất cả trang đều là Client Component gọi Supabase ở runtime
 *   nên build sẽ KHÔNG lỗi kể cả khi chưa khai báo biến môi trường.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
