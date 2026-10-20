import type { ReactNode } from "react";
import AdminGate from "@/components/admin/AdminGate";
import AdminNav from "@/components/admin/AdminNav";
import SiteHeader from "@/components/layout/SiteHeader";

/**
 * LAYOUT KHU VỰC QUẢN TRỊ (/admin/*): khóa PIN → tiêu đề → thanh tab → nội dung trang con.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <SiteHeader title="Quản trị" />
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">{children}</main>
    </AdminGate>
  );
}
