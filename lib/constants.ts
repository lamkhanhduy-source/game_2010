import type { GameSettings } from "./types";

/** Giá trị mặc định khi chưa có dòng cấu hình trong DB (hoặc chưa cấu hình Supabase). */
export const DEFAULT_SETTINGS: GameSettings = {
  id: 1,
  default_time_limit: 15,
  default_mode: "solo",
  icon_style: "gift",
  sound_enabled: true,
};

/** Các mốc thời gian gợi ý (giây) trong trang Cài đặt và form câu hỏi. */
export const TIME_PRESETS = [10, 15, 30];

/**
 * Tổng thời lượng hiệu ứng mở quà / nở hoa (ms) trước khi hiện thử thách.
 * Đồng hồ đếm ngược chỉ bắt đầu SAU khoảng này. Các mốc bên trong nằm ở components/game/OpenEffect.tsx.
 */
export const OPEN_EFFECT_MS = 1900;

/** Số giây cuối: đồng hồ đổi sang màu cảnh báo + phát tiếng tick. */
export const WARNING_SECONDS = 5;

/** Lời chúc 20/10 hiện ra khi hoàn thành thử thách. */
export const WISHES: string[] = [
  "Chúc mừng 20/10! Chúc những người phụ nữ tuyệt vời luôn rạng rỡ như đóa hồng mùa thu.",
  "Phụ nữ không chỉ là một nửa thế giới — họ là người thắp sáng cả thế giới. Chúc mừng 20/10!",
  "Cảm ơn những người phụ nữ đã âm thầm yêu thương, hy sinh và truyền cảm hứng mỗi ngày.",
  "Chúc bạn một ngày 20/10 ngập tràn hoa, nụ cười và những điều ngọt ngào nhất!",
  "Mỗi người phụ nữ là một bông hoa độc nhất. Chúc bạn luôn tự tin tỏa sáng theo cách riêng!",
  "Chúc các bạn nữ luôn khỏe mạnh, xinh đẹp, thành công và được yêu thương thật nhiều!",
  "Sức mạnh của người phụ nữ nằm ở sự dịu dàng và lòng kiên cường. Chúc mừng ngày của bạn!",
  "Gửi muôn vàn lời tri ân đến mẹ, bà, chị em và cô giáo — những người làm cuộc sống thêm tươi đẹp!",
];

/** Lời nhắn khi hết giờ (vui vẻ, không trách móc). */
export const TIMEUP_MESSAGES: string[] = [
  "Hết giờ rồi, nhưng dũng cảm tham gia là đã tuyệt vời lắm rồi!",
  "Tiếc quá! Mở thêm một món quà khác nào.",
  "Đồng hồ đã dừng — cả lớp cùng vỗ tay động viên nhé!",
];
