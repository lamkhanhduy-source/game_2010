import { redirect } from "next/navigation";

/** /admin → chuyển thẳng tới trang quản lý câu hỏi. */
export default function AdminIndexPage() {
  redirect("/admin/questions");
}
