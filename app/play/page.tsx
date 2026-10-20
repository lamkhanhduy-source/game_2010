"use client";

import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SetupNotice from "@/components/layout/SetupNotice";
import SoloGame from "@/components/modes/SoloGame";
import { buttonClass } from "@/components/ui/Button";
import { useGameData } from "@/hooks/useGameData";

/**
 * /play — CHẾ ĐỘ CHƠI CÁ NHÂN.
 * Tải câu hỏi + cấu hình rồi giao cho <SoloGame/>. Chưa cấu hình Supabase → dùng câu hỏi mẫu (DEMO).
 */
export default function PlayPage() {
  const { questions, settings, demo, loading, error, reload } = useGameData();

  return (
    <>
      <SiteHeader />
      <main className="pb-10">
        {demo && <SetupNotice variant="demo" />}

        {loading && <p className="py-20 text-center font-semibold text-purple-700">Đang chuẩn bị quà… 🎁</p>}

        {error && (
          <div className="glass mx-auto max-w-md rounded-3xl p-6 text-center">
            <p className="font-semibold text-red-600">Không tải được dữ liệu</p>
            <p className="mt-1 text-sm text-purple-900/80">{error}</p>
            <button onClick={() => void reload()} className={buttonClass("primary", "md", "mt-4")}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && questions.length === 0 && (
          <div className="glass mx-auto max-w-md rounded-3xl p-6 text-center">
            <div className="text-4xl">📭</div>
            <p className="mt-2 font-semibold text-purple-900">Chưa có câu hỏi nào.</p>
            <Link href="/admin/questions" className={buttonClass("primary", "md", "mt-4")}>
              Thêm câu hỏi
            </Link>
          </div>
        )}

        {!loading && !error && questions.length > 0 && <SoloGame questions={questions} settings={settings} />}
      </main>
    </>
  );
}
