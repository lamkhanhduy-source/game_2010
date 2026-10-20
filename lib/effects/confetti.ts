import confetti from "canvas-confetti";

/**
 * HIỆU ỨNG PHÁO HOA / CÁNH HOA / BỤI VÀNG (canvas-confetti)
 * Mọi hàm chỉ được gọi từ sự kiện của người dùng (trình duyệt), không gọi khi render server.
 *
 *  - fireOpenBurst()  : nổ bụi vàng + cánh hoa đúng khoảnh khắc hộp quà bung nắp (OpenEffect)
 *  - fireFireworks()  : chuỗi pháo hoa nhiều màu nổ ngẫu nhiên trên màn hình
 *  - fireCelebration(): khi HOÀN THÀNH thử thách — nổ giữa + 2 súng bắn cánh hoa + pháo hoa
 *  - fireFinale()     : màn kết thúc — pháo hoa dày ~4,5 giây + mưa cánh hoa từ trên xuống
 */

const COLORS = ["#ff6fa5", "#e11d48", "#c084fc", "#fbbf24", "#fde68a", "#ffffff"];
const GOLD = ["#fff7cc", "#fde58a", "#f6d26b", "#efbf3a", "#d9a21b"];
const FIREWORK_PALETTES: string[][] = [
  GOLD,
  ["#ff6fa5", "#ffd1e3", "#ffffff"],
  ["#c084fc", "#e9d5ff", "#ffffff"],
  ["#fb7185", "#e11d48", "#fde68a"],
  ["#fde68a", "#ff6fa5", "#c084fc"],
];

const base = { disableForReducedMotion: true, zIndex: 200 } as const;
const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** Hình cánh hoa / trái tim vẽ từ emoji — tạo 1 lần rồi dùng lại. */
let petalShapes: confetti.Shape[] | null = null;
function getPetalShapes(): confetti.Shape[] {
  if (!petalShapes) {
    petalShapes = ["🌸", "🌹", "💖", "✨"].map((text) => confetti.shapeFromText({ text, scalar: 2 }));
  }
  return petalShapes;
}

/** Nổ bụi vàng + cánh hoa từ giữa màn hình khi hộp quà bung nắp. */
export function fireOpenBurst(): void {
  confetti({
    ...base,
    particleCount: 90,
    spread: 360,
    startVelocity: 38,
    gravity: 0.8,
    ticks: 150,
    scalar: 1.2,
    colors: GOLD,
    shapes: ["star", "circle"],
    origin: { x: 0.5, y: 0.5 },
  });
  confetti({
    ...base,
    particleCount: 36,
    spread: 360,
    startVelocity: 22,
    ticks: 170,
    scalar: 2,
    colors: COLORS,
    shapes: getPetalShapes(),
    origin: { x: 0.5, y: 0.5 },
  });
}

/** Pháo hoa nổ ngẫu nhiên nhiều màu trong `durationMs` mili giây. */
export function fireFireworks(durationMs = 2600): void {
  const end = Date.now() + durationMs;
  const launch = () => {
    const colors = FIREWORK_PALETTES[Math.floor(Math.random() * FIREWORK_PALETTES.length)];
    confetti({
      ...base,
      particleCount: 70,
      spread: 360,
      startVelocity: 30,
      ticks: 85,
      gravity: 0.9,
      decay: 0.92,
      scalar: 1.1,
      colors,
      shapes: ["circle", "star"],
      origin: { x: rand(0.12, 0.88), y: rand(0.08, 0.45) },
    });
    if (Date.now() < end) setTimeout(launch, 220 + Math.random() * 180);
  };
  launch();
}

/** Hoàn thành thử thách: nổ lớn ở giữa + cánh hoa từ hai bên + pháo hoa. */
export function fireCelebration(): void {
  confetti({
    ...base,
    particleCount: 120,
    spread: 110,
    startVelocity: 48,
    colors: COLORS,
    shapes: ["circle", "square", "star"],
    origin: { x: 0.5, y: 0.58 },
  });

  const end = Date.now() + 1400;
  const frame = () => {
    const shapes = getPetalShapes();
    confetti({ ...base, particleCount: 3, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: COLORS, shapes, scalar: 2, ticks: 240 });
    confetti({ ...base, particleCount: 3, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: COLORS, shapes, scalar: 2, ticks: 240 });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();

  setTimeout(() => fireFireworks(2200), 250);
}

/** Màn kết thúc: pháo hoa dày + mưa cánh hoa từ trên xuống. */
export function fireFinale(): void {
  fireFireworks(4600);

  const end = Date.now() + 4200;
  const rain = () => {
    confetti({
      ...base,
      particleCount: 7,
      spread: 100,
      origin: { x: Math.random(), y: -0.1 },
      gravity: 0.45,
      colors: COLORS,
      shapes: getPetalShapes(),
      scalar: 2,
      ticks: 320,
    });
    if (Date.now() < end) setTimeout(rain, 240);
  };
  rain();
}
