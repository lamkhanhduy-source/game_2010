import { WARNING_SECONDS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * ĐỒNG HỒ ĐẾM NGƯỢC DẠNG VÒNG TRÒN
 * Vòng chuyển sắc hồng → tím, có quầng sáng; cạn dần theo `remaining / total`.
 * Còn ≤ 5 giây: đổi sang đỏ, quầng sáng đỏ và nhấp nháy.
 */
export default function CountdownRing({
  remaining,
  total,
  size = 64,
}: {
  remaining: number;
  total: number;
  size?: number;
}) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  const seconds = Math.ceil(remaining);
  const danger = seconds <= WARNING_SECONDS && remaining > 0;

  return (
    <div
      className={cn("relative shrink-0 rounded-full", danger && "animate-pulse")}
      style={{
        width: size,
        height: size,
        boxShadow: danger ? "0 0 26px rgba(239,68,68,0.7)" : "0 0 22px rgba(217,70,239,0.45)",
      }}
      role="timer"
      aria-label={`Còn ${seconds} giây`}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f472b6" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="ring-danger" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f87171" />
            <stop offset="1" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={radius} fill="white" stroke="#fce7f3" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={danger ? "url(#ring-danger)" : "url(#ring-grad)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-extrabold tabular-nums",
          danger ? "text-red-600" : "text-fuchsia-700"
        )}
        style={{ fontSize: size * 0.36 }}
      >
        {seconds}
      </span>
    </div>
  );
}
