# 🎁 Hộp quà 20/10 — Thử thách tri ân Phụ nữ Việt Nam

Next.js (App Router, React 19, TypeScript) · Tailwind CSS v4 · Framer Motion · canvas-confetti · Supabase (PostgreSQL + Realtime).

**Cách chơi:** mỗi hộp quà / bông hồng giấu một **câu hỏi hoặc yêu cầu** (VD: "Hát một đoạn bài hát về mẹ", "Gửi lời chúc 20/10 đến một bạn nữ"). Bấm vào ô → hiệu ứng mở quà hoành tráng → thẻ thử thách hiện ra với đồng hồ đếm ngược. Làm xong bấm **Hoàn thành** để đón pháo hoa và lời chúc. Không có đáp án A/B/C/D.

## Cấu trúc thư mục

```
app/
  layout.tsx, globals.css        Layout gốc + theme 20/10 + hiệu ứng CSS (viền xoay, ánh kim, kim tuyến)
  icon.svg, favicon.ico, apple-icon.png
  page.tsx                       Trang chủ
  play/page.tsx                  Chơi cá nhân
  host/page.tsx                  Màn hình trình chiếu (Host)
  join/page.tsx                  Người xem vào phòng bằng mã
  admin/                         Quản trị: layout (khóa PIN) · questions · settings
components/
  layout/    PetalsBackground (cánh hoa, tim, mây, kim tuyến, mảng sáng) · SiteHeader · SetupNotice
  ui/        Button
  game/      GiftGrid · GiftBox · BoxIcon (SVG quà/hồng) · OpenEffect (hiệu ứng mở quà)
             QuestionModal (thẻ thử thách + ăn mừng/hết giờ) · CountdownRing · FinishScreen
  modes/     SoloGame · HostGame · PlayerGame
  admin/     AdminGate · AdminNav · QuestionForm · QuestionList · ImportExportBar · SettingsForm
hooks/       useCountdown (logic đếm ngược) · useGameData · useSessionRealtime · useRoomChannel
lib/
  supabase.ts                    Kết nối Supabase (lazy, không lỗi build khi thiếu env)
  services/  questions · settings · sessions     (toàn bộ truy vấn DB)
  io/        parse (nhập JSON/CSV/Excel) · export
  effects/   confetti (pháo hoa) · sound (Web Audio, không cần file mp3)
  types.ts · constants.ts · utils.ts
supabase/schema.sql              Tạo bảng + Realtime + RLS (tự nâng cấp DB bản trắc nghiệm cũ)
public/templates/                File mẫu: JSON, CSV, Excel
```

## 1. Cài đặt

Yêu cầu Node.js ≥ 20.9.

```bash
npm install
```

## 2. Biến môi trường

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_ADMIN_PIN=2010        # tùy chọn, để trống = không khóa /admin
```

Lấy URL và anon key ở Supabase → **Project Settings → API**.

## 3. Tạo bảng trên Supabase

Supabase Dashboard → **SQL Editor → New query** → dán toàn bộ `supabase/schema.sql` → **Run**.

- `questions` (id, question_text, time_limit, hint, created_at)
- `game_sessions` (id, current_question_id, is_active, updated_at + room_code, phase, question_order, opened_ids, question_started_at, time_limit, icon_style)
- `game_settings` (1 dòng cấu hình chung)
- bật Realtime + policy RLS cho khóa anon.

> **Đã chạy schema bản trắc nghiệm trước đó?** Chạy lại file này — nó tự bỏ ràng buộc cũ (options / correct_option) mà **không xóa dữ liệu**. Nếu bỏ bước này, thêm câu hỏi sẽ báo lỗi vì cột `options` cũ còn bắt buộc.

## 4. Chạy thử

```bash
npm run dev      # http://localhost:3000
```

Chưa cấu hình Supabase vẫn chơi được **chế độ cá nhân** bằng 13 thử thách mẫu (chế độ DEMO). Host / Tham gia / Quản trị cần database.

Quy trình đề xuất: `/admin/questions` → **Nạp câu hỏi mẫu** (hoặc nhập file của bạn) → `/admin/settings` chọn thời gian, chế độ, biểu tượng → chơi.

## 5. Cách dùng

**Chơi cá nhân (`/play`)**: bấm ô → hộp rung lắc rồi nổ tung → thẻ thử thách có viền vàng–hồng xoay, nội dung hiện từng chữ, đồng hồ đếm ngược. **Hoàn thành** → pháo hoa + cánh hoa + lời chúc; **Bỏ qua** hoặc **hết giờ** → chuông nhẹ + lời động viên.

**Trình chiếu chung**:
1. Máy chiếu mở `/host` → **Tạo phòng** → hiện mã phòng 5 ký tự.
2. Người xem mở `/join` (hoặc `/join?code=MÃ`) trên điện thoại, nhập tên + mã.
3. Host bấm 1 ô → thử thách hiện trên mọi thiết bị, đồng hồ khớp nhau → Host bấm **Hoàn thành** (mọi người cùng ăn mừng) hoặc **Bỏ qua** → **Tiếp tục**.
4. Mở hết ô → màn kết thúc. Host tải lại trang vẫn quay lại phòng đang mở.

Điện thoại người xem mặc định **tắt tiếng** (tránh cả lớp phát tiếng chồng nhau); bấm 🔕/🔔 để bật.

### Định dạng file nhập

| Cột (CSV/Excel, dòng 1 là tiêu đề) | Ý nghĩa |
|---|---|
| `question_text` | Nội dung câu hỏi / yêu cầu |
| `time_limit` | Giây; bỏ trống = mặc định |
| `hint` | Lưu ý / gợi ý (tùy chọn) |

JSON: mảng `{ "question_text", "time_limit", "hint" }` hoặc mảng chuỗi thuần `["Hát một bài về mẹ", ...]`. File của bản trắc nghiệm cũ vẫn nhập được (các cột đáp án bị bỏ qua). File xuất ra nhập lại được.

## 6. Deploy lên Vercel

1. Đẩy mã lên GitHub (`.env.local` đã nằm trong `.gitignore`).
2. Vercel → **Add New → Project** → chọn repo. Framework tự nhận **Next.js**.
3. **Environment Variables**: thêm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (và `NEXT_PUBLIC_ADMIN_PIN` nếu dùng).
4. **Deploy**, rồi vào `/admin/questions` để nạp câu hỏi.
5. Đổi biến môi trường xong phải **Redeploy** (biến `NEXT_PUBLIC_*` được nhúng lúc build).

## 7. Lưu ý

- Ứng dụng dùng khóa **anon** ngay trên trình duyệt và policy RLS mở cho anon, phù hợp một buổi sinh hoạt / giao lưu. Mã PIN `/admin` chỉ là khóa nhẹ. Muốn chặt hơn: bật Supabase Auth cho admin và đổi policy ghi `questions` / `game_settings` thành `to authenticated`.
- Đồng hồ trong phòng dùng mốc thời gian của máy Host; máy lệch giờ nhiều có thể lệch vài giây.
- Âm thanh chỉ phát sau khi người dùng chạm/click lần đầu (quy định của trình duyệt). Phông chữ nạp từ Google Fonts.
