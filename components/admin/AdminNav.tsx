"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/questions", label: "📝 Câu hỏi" },
  { href: "/admin/settings", label: "⚙️ Cài đặt trò chơi" },
];

/** Thanh tab điều hướng trong khu vực quản trị. */
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="mx-auto mb-6 flex max-w-5xl gap-2 px-4 sm:px-6">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "rounded-2xl px-4 py-2 text-sm font-semibold transition",
            pathname === t.href ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow" : "bg-white/70 text-rose-700 hover:bg-white"
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
