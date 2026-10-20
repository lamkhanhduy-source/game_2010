"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SiteHeader from "@/components/layout/SiteHeader";
import { buttonClass } from "@/components/ui/Button";
import { useGameData } from "@/hooks/useGameData";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * TRANG CHỦ — giới thiệu + lối vào các chế độ.
 * Nút chính thay đổi theo "Chế độ chơi mặc định" trong Cài đặt (solo → /play, host → /host).
 */
export default function HomePage() {
  const { settings, loading } = useGameData();
  const hostDefault = settings.default_mode === "host";

  return (
    <>
      <SiteHeader
        right={
          <Link href="/admin" className={buttonClass("ghost", "sm")}>
            ⚙️ Quản trị
          </Link>
        }
      />

      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-20 pt-6 text-center sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="glass w-full rounded-[2rem] p-8 sm:p-12"
        >
          <motion.div
            className="text-7xl sm:text-8xl"
            animate={{ rotate: [-6, 6, -6], y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          >
            🎁
          </motion.div>

          <p className="mt-4 text-sm font-bold uppercase tracking-[0.3em] text-purple-600">Chào mừng ngày</p>
          <h1 className="font-display text-5xl font-bold leading-tight text-gradient-rose sm:text-7xl">Phụ nữ Việt Nam 20/10</h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-purple-900/80">
            Mở hộp quà may mắn, nở bông hồng rực rỡ, nhận thử thách bất ngờ và cùng nhau hoàn thành để đón pháo hoa cùng những lời chúc ngọt ngào nhất! 🌹
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
            <Link href={hostDefault ? "/host" : "/play"} className={buttonClass("gold", "lg")}>
              {loading ? "Bắt đầu chơi" : hostDefault ? "📺 Tổ chức trình chiếu (Host)" : "🎮 Chơi cá nhân"}
            </Link>
            <Link href={hostDefault ? "/play" : "/host"} className={buttonClass("soft", "lg")}>
              {hostDefault ? "🎮 Chơi cá nhân" : "📺 Tổ chức trình chiếu (Host)"}
            </Link>
          </div>

          <Link href="/join" className={buttonClass("primary", "lg", "mt-3 w-full sm:w-auto")}>
            📱 Tham gia phòng bằng mã
          </Link>

          {!isSupabaseConfigured && (
            <p className="mx-auto mt-6 max-w-md rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900">
              Chưa kết nối Supabase: chế độ <b>Chơi cá nhân</b> chạy với câu hỏi mẫu. Host / Tham gia / Quản trị cần database
              (xem README).
            </p>
          )}
        </motion.div>

        <ul className="mt-8 grid w-full gap-3 text-left sm:grid-cols-3">
          {[
            ["🎁", "Chọn ô may mắn", "Mỗi hộp quà hoặc bông hồng giấu một thử thách bất ngờ."],
            ["⏱️", "Đếm ngược hồi hộp", "Hoàn thành yêu cầu trước khi đồng hồ về 0."],
            ["🎆", "Pháo hoa chúc mừng", "Làm xong rồi! Pháo hoa nở rộ cùng lời chúc 20/10."],
          ].map(([icon, title, desc]) => (
            <li key={title} className="glass rounded-2xl p-4">
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-1 font-bold text-rose-700">{title}</h3>
              <p className="text-sm text-purple-900/75">{desc}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
