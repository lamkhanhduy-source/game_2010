"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Button from "@/components/ui/Button";

const SESSION_KEY = "quiz2010.adminOk";

/**
 * KHÓA NHẸ CHO TRANG QUẢN TRỊ
 * - Nếu đặt NEXT_PUBLIC_ADMIN_PIN: yêu cầu nhập đúng PIN (nhớ trong phiên tab hiện tại).
 * - Nếu để trống: cho vào luôn.
 * ⚠️ Biến NEXT_PUBLIC_* nằm trong mã gửi về trình duyệt → đây chỉ là rào chắn nhẹ cho buổi
 *    sinh hoạt, KHÔNG phải bảo mật thật. Xem mục "Bảo mật" trong README để nâng cấp.
 */
const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN ?? "";

export default function AdminGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "open">("checking");
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (!PIN) return setStatus("open");
    setStatus(window.sessionStorage.getItem(SESSION_KEY) === "1" ? "open" : "locked");
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (input === PIN) {
      window.sessionStorage.setItem(SESSION_KEY, "1");
      setStatus("open");
    } else {
      setWrong(true);
    }
  };

  if (status === "checking") return null;
  if (status === "open") return <>{children}</>;

  return (
    <form onSubmit={submit} className="glass mx-auto mt-20 max-w-sm space-y-4 rounded-3xl p-8 text-center">
      <div className="text-5xl">🔒</div>
      <h1 className="text-xl font-bold text-rose-700">Khu vực quản trị</h1>
      <input
        type="password"
        inputMode="numeric"
        autoFocus
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setWrong(false);
        }}
        placeholder="Nhập mã PIN"
        className="w-full rounded-2xl border-2 border-pink-200 bg-white px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-rose-400"
      />
      {wrong && <p className="text-sm text-red-600">Sai mã PIN, thử lại nhé.</p>}
      <Button type="submit" className="w-full">
        Vào quản trị
      </Button>
    </form>
  );
}
