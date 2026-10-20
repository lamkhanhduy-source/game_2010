-- =====================================================================
--  HỘP QUÀ 20/10 (dạng THỬ THÁCH) — SCHEMA SUPABASE (PostgreSQL)
--  Cách dùng: Supabase Dashboard → SQL Editor → New query → dán toàn bộ → Run.
--  Chạy lại nhiều lần được (idempotent) và TỰ NÂNG CẤP database cũ của bản trắc nghiệm
--  (không xóa dữ liệu; các cột options / correct_option / points cũ chỉ còn nằm đó, không dùng nữa).
-- =====================================================================

create extension if not exists "pgcrypto";   -- để dùng gen_random_uuid()

-- ---------------------------------------------------------------------
-- 0. Hàm tự cập nhật cột updated_at mỗi khi row bị sửa
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------
-- 1. BẢNG questions — ngân hàng câu hỏi / thử thách
-- ---------------------------------------------------------------------
create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  question_text  text    not null,           -- nội dung câu hỏi / yêu cầu
  time_limit     int,                        -- giây; NULL = dùng thời gian mặc định trong game_settings
  hint           text,                       -- lưu ý / gợi ý (không bắt buộc)
  created_at     timestamptz not null default now(),

  constraint questions_time_range check (time_limit is null or time_limit between 3 and 600)
);

create index if not exists questions_created_at_idx on public.questions (created_at);

-- ---- Nâng cấp từ bản trắc nghiệm cũ (bỏ ràng buộc + cho phép để trống các cột cũ) ----
alter table public.questions drop constraint if exists questions_options_is_4;
alter table public.questions drop constraint if exists questions_correct_range;
alter table public.questions drop constraint if exists questions_points_range;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'questions' and column_name = 'options') then
    alter table public.questions alter column options drop not null;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'questions' and column_name = 'correct_option') then
    alter table public.questions alter column correct_option drop not null;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. BẢNG game_settings — cấu hình chung (luôn chỉ có 1 dòng id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.game_settings (
  id                 int primary key default 1,
  default_time_limit int     not null default 15,        -- giây / câu
  default_mode       text    not null default 'solo',    -- 'solo' | 'host'
  icon_style         text    not null default 'gift',    -- 'gift' | 'rose'
  sound_enabled      boolean not null default true,
  updated_at         timestamptz not null default now(),

  constraint game_settings_single_row check (id = 1),
  constraint game_settings_mode  check (default_mode in ('solo', 'host')),
  constraint game_settings_icon  check (icon_style in ('gift', 'rose')),
  constraint game_settings_time  check (default_time_limit between 3 and 600)
);

insert into public.game_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_game_settings_updated on public.game_settings;
create trigger trg_game_settings_updated
  before update on public.game_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. BẢNG game_sessions — phòng chơi "Trình chiếu chung" (Host ↔ Player)
--    Host ghi, Player đọc. Mọi thay đổi được đẩy tức thì qua Realtime.
--    phase: board (chọn ô) | question (đang làm thử thách) | reveal (đã hoàn thành) | finished
-- ---------------------------------------------------------------------
create table if not exists public.game_sessions (
  id                  uuid primary key default gen_random_uuid(),
  room_code           text    not null unique,            -- mã phòng ngắn để Player nhập
  current_question_id uuid references public.questions(id) on delete set null,
  is_active           boolean not null default true,      -- false = phòng đã đóng
  phase               text    not null default 'board',
  question_order      jsonb   not null default '[]'::jsonb, -- thứ tự id câu hỏi tương ứng từng hộp quà
  opened_ids          jsonb   not null default '[]'::jsonb, -- các câu đã mở
  question_started_at timestamptz,                        -- mốc bắt đầu đếm ngược (đồng bộ đồng hồ)
  time_limit          int     not null default 15,
  icon_style          text    not null default 'gift',
  updated_at          timestamptz not null default now(),

  constraint game_sessions_phase check (phase in ('board', 'question', 'reveal', 'finished'))
);

create index if not exists game_sessions_room_idx on public.game_sessions (room_code);

drop trigger if exists trg_game_sessions_updated on public.game_sessions;
create trigger trg_game_sessions_updated
  before update on public.game_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. BẬT REALTIME cho các bảng cần đồng bộ giữa các thiết bị
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_sessions') then
    alter publication supabase_realtime add table public.game_sessions;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'questions') then
    alter publication supabase_realtime add table public.questions;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--    Ứng dụng dùng khóa "anon" ngay trên trình duyệt (không có đăng nhập),
--    nên policy bên dưới mở quyền đọc/ghi cho anon — phù hợp một buổi sinh hoạt
--    / giao lưu nội bộ. Nếu cần chặt hơn, xem mục "Bảo mật" trong README.md.
-- ---------------------------------------------------------------------
alter table public.questions     enable row level security;
alter table public.game_settings enable row level security;
alter table public.game_sessions enable row level security;

drop policy if exists "questions_all"     on public.questions;
drop policy if exists "game_settings_all" on public.game_settings;
drop policy if exists "game_sessions_all" on public.game_sessions;

create policy "questions_all"     on public.questions     for all to anon, authenticated using (true) with check (true);
create policy "game_settings_all" on public.game_settings for all to anon, authenticated using (true) with check (true);
create policy "game_sessions_all" on public.game_sessions for all to anon, authenticated using (true) with check (true);
