"use client";

import { useEffect, useRef, useState } from "react";
import { WARNING_SECONDS } from "@/lib/constants";
import { playTick } from "@/lib/effects/sound";

/**
 * ĐẾM NGƯỢC THỜI GIAN TRẢ LỜI  ←  NƠI XỬ LÝ LOGIC ĐẾM NGƯỢC
 * ------------------------------------------------------------------
 * Đồng hồ KHÔNG đếm "trừ dần từng giây" mà luôn tính từ một mốc tuyệt đối:
 *     còn lại = duration − (bây giờ − startedAt)
 * Nhờ vậy:
 *  - Chế độ Host–Player: mọi thiết bị dùng chung mốc `question_started_at` lưu trong DB
 *    nên đồng hồ khớp nhau (kể cả người vào muộn / tải lại trang).
 *  - Nếu startedAt nằm ở tương lai (dành chỗ cho hiệu ứng mở quà) thì đồng hồ đứng yên
 *    ở giá trị đầy cho đến khi tới mốc đó.
 *
 * @param startedAt  mốc bắt đầu (ms epoch) hoặc null nếu chưa bắt đầu
 * @param duration   tổng số giây
 * @param running    true = đang đếm; false = dừng (đã trả lời / đã lộ đáp án)
 * @param onExpire   gọi đúng 1 lần khi về 0
 */
export function useCountdown(params: {
  startedAt: number | null;
  duration: number;
  running: boolean;
  onExpire?: () => void;
}): { remaining: number; expired: boolean } {
  const { startedAt, duration, running, onExpire } = params;
  // Giá trị khởi tạo tính theo mốc thời gian (người vào muộn thấy đúng số giây còn lại)
  const [remaining, setRemaining] = useState(() =>
    startedAt === null ? duration : Math.min(duration, Math.max(0, duration - (Date.now() - startedAt) / 1000))
  );

  // Giữ onExpire mới nhất mà không làm effect chạy lại
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (startedAt === null) {
      setRemaining(duration);
      return;
    }
    // Đã dừng (đã trả lời / đã công bố đáp án) → giữ nguyên số giây còn lại, không reset vòng tròn
    if (!running) return;

    let fired = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const left = Math.min(duration, Math.max(0, duration - elapsed));
      setRemaining(left);
      if (left <= 0 && !fired) {
        fired = true;
        if (timer) clearInterval(timer);
        expireRef.current?.();
      }
    };

    tick();
    timer = setInterval(tick, 100);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [startedAt, duration, running]);

  return { remaining, expired: running && startedAt !== null && remaining <= 0 };
}

/** Phát tiếng "tích" mỗi giây trong những giây cuối của đồng hồ. */
export function useTickSound(remaining: number, active: boolean): void {
  const lastSecond = useRef(-1);
  useEffect(() => {
    if (!active) {
      lastSecond.current = -1;
      return;
    }
    const sec = Math.ceil(remaining);
    if (sec > 0 && sec <= WARNING_SECONDS && sec !== lastSecond.current) {
      lastSecond.current = sec;
      playTick();
    }
  }, [remaining, active]);
}
