/**
 * ÂM THANH — tạo trực tiếp bằng Web Audio API nên KHÔNG cần file mp3.
 * (Muốn dùng file riêng: thay thân hàm bằng `new Audio("/sounds/xxx.mp3").play()`.)
 *
 * Phiên bản "sống động":
 *  - Có hiệu ứng vang (reverb) + bộ nén (compressor) nên tiếng đầy, không bị rè khi nhiều nốt chồng nhau.
 *  - "Chuông" (bell) gồm nhiều họa âm → nghe như chuông/marimba lấp lánh thay vì tiếng bíp đơn.
 *  - Tiếng "vút" (noise sweep), "bốp" (pop), trống kick/hi-hat cho phần mở quà và kết thúc.
 *
 * Lưu ý: trình duyệt chỉ cho phát tiếng sau khi người dùng chạm/click ít nhất một lần.
 * Các hàm xuất ra (playOpen, playCorrect, playWrong, playTick, playFinale, setSoundEnabled)
 * giữ nguyên tên → không phải sửa nơi gọi. Thêm mới: playSelect (tiếng bấm nút), playTimeUp (hết giờ).
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

interface Engine {
  ac: AudioContext;
  /** Đường tiếng trực tiếp */
  dry: GainNode;
  /** Đường gửi sang bộ vang (reverb) */
  wet: GainNode;
  /** Bộ đệm nhiễu trắng dùng chung cho tiếng vút / trống */
  noise: AudioBuffer;
}

let engine: Engine | null = null;
let enabled = true;

/** Bật/tắt toàn bộ âm thanh (đọc từ game_settings.sound_enabled). */
export function setSoundEnabled(value: boolean): void {
  enabled = value;
}

/** Tạo "phòng vang": nhiễu giảm dần theo thời gian → dùng cho ConvolverNode. */
function makeImpulse(ac: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(2, length, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
  }
  return buffer;
}

/** Tạo (lần đầu) và trả về hệ thống âm thanh; null nếu đang tắt tiếng / trình duyệt không hỗ trợ. */
function getEngine(): Engine | null {
  if (typeof window === "undefined" || !enabled) return null;

  if (!engine) {
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return null;
    const ac = new AC();

    // Chuỗi: (dry + reverb) → master → compressor → loa
    const master = ac.createGain();
    master.gain.value = 0.95;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 24;
    comp.ratio.value = 6;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    master.connect(comp);
    comp.connect(ac.destination);

    const dry = ac.createGain();
    dry.connect(master);

    const reverb = ac.createConvolver();
    reverb.buffer = makeImpulse(ac, 1.8, 2.6);
    const wet = ac.createGain();
    wet.gain.value = 0.4; // độ vang tổng
    wet.connect(reverb);
    reverb.connect(master);

    const noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

    engine = { ac, dry, wet, noise };
  }

  if (engine.ac.state === "suspended") void engine.ac.resume();
  return engine;
}

/* ====================================================================
   NHẠC CỤ CƠ BẢN
   ==================================================================== */

interface ToneOpts {
  freq: number;
  /** Giây, tính từ bây giờ */
  start?: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  /** Trượt tần số tới giá trị này (hiệu ứng "tụt/vút") */
  glideTo?: number;
  /** Mức gửi sang reverb 0–1 */
  wet?: number;
  /** Cắt tiếng cao bằng lowpass (Hz) → âm ấm hơn */
  filter?: number;
  /** Rung nhẹ cao độ (như tiếng kèn) */
  vibrato?: boolean;
}

/** Phát 1 nốt với envelope mượt (tăng nhanh – tắt dần), có thể trượt tần số, lọc, rung, vang. */
function tone(o: ToneOpts): void {
  const e = getEngine();
  if (!e) return;
  const t0 = e.ac.currentTime + (o.start ?? 0);
  const attack = o.attack ?? 0.01;

  const osc = e.ac.createOscillator();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(o.glideTo, t0 + o.dur);

  if (o.vibrato) {
    const lfo = e.ac.createOscillator();
    const depth = e.ac.createGain();
    lfo.frequency.value = 6;
    depth.gain.value = 18; // cent
    lfo.connect(depth);
    depth.connect(osc.detune);
    lfo.start(t0);
    lfo.stop(t0 + o.dur + 0.05);
  }

  const gain = e.ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(o.vol ?? 0.15, 0.0002), t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  let last: AudioNode = osc;
  if (o.filter) {
    const f = e.ac.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.filter;
    osc.connect(f);
    last = f;
  }
  last.connect(gain);
  gain.connect(e.dry);
  if (o.wet) {
    const send = e.ac.createGain();
    send.gain.value = o.wet;
    gain.connect(send);
    send.connect(e.wet);
  }

  osc.start(t0);
  osc.stop(t0 + o.dur + 0.05);
}

/** Chuông/marimba: nốt gốc + các họa âm tắt nhanh hơn → nghe lấp lánh, có độ ngân. */
function bell(freq: number, start: number, dur = 0.9, vol = 0.12): void {
  tone({ freq, start, dur, vol, wet: 0.65, attack: 0.004 });
  tone({ freq: freq * 2, start, dur: dur * 0.6, vol: vol * 0.45, wet: 0.65, attack: 0.004 });
  tone({ freq: freq * 3.01, start, dur: dur * 0.35, vol: vol * 0.2, wet: 0.65, attack: 0.004 });
  tone({ freq: freq * 4.2, start, dur: dur * 0.2, vol: vol * 0.1, wet: 0.65, attack: 0.004 });
}

/** Tiếng "ting" nhẹ (ít họa âm hơn bell) dùng cho mưa sao lấp lánh. */
function ping(freq: number, start: number, vol = 0.045): void {
  tone({ freq, start, dur: 0.55, vol, wet: 0.8, attack: 0.003 });
  tone({ freq: freq * 2, start, dur: 0.25, vol: vol * 0.4, wet: 0.8, attack: 0.003 });
}

interface NoiseOpts {
  start?: number;
  dur: number;
  vol?: number;
  type?: BiquadFilterType;
  from: number;
  /** Quét tần số lọc tới giá trị này (tiếng "vút") */
  to?: number;
  q?: number;
  wet?: number;
}

/** Nhiễu có lọc: dùng làm tiếng vút, tiếng "bốp", hi-hat. */
function noise(o: NoiseOpts): void {
  const e = getEngine();
  if (!e) return;
  const t0 = e.ac.currentTime + (o.start ?? 0);

  const src = e.ac.createBufferSource();
  src.buffer = e.noise;
  src.loop = true;

  const filter = e.ac.createBiquadFilter();
  filter.type = o.type ?? "bandpass";
  filter.Q.value = o.q ?? 1;
  filter.frequency.setValueAtTime(o.from, t0);
  if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);

  const gain = e.ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(o.vol ?? 0.1, t0 + o.dur * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(e.dry);
  if (o.wet) {
    const send = e.ac.createGain();
    send.gain.value = o.wet;
    gain.connect(send);
    send.connect(e.wet);
  }

  src.start(t0);
  src.stop(t0 + o.dur + 0.05);
}

/** Trống kick: tần số tụt nhanh từ cao xuống thấp. */
function kick(start: number, vol = 0.28): void {
  tone({ freq: 150, start, dur: 0.18, vol, glideTo: 45, attack: 0.002 });
}

/** Mưa sao: nhiều tiếng "ting" cao ngẫu nhiên (âm giai ngũ cung) trong một khoảng thời gian. */
const SPARKLE_NOTES = [1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637];
function sparkle(start: number, count: number, span: number, vol = 0.045): void {
  for (let i = 0; i < count; i++) {
    const f = SPARKLE_NOTES[Math.floor(Math.random() * SPARKLE_NOTES.length)];
    ping(f, start + Math.random() * span, vol);
  }
}

/* ====================================================================
   ÂM THANH CỦA TRÒ CHƠI (tên hàm giữ nguyên)
   ==================================================================== */

/**
 * Mở quà / nở hoa (~2,5 giây, khớp OpenEffect): dồn nén (vút lên + lắc "tạch tạch")
 * → NỔ ở giây thứ 1,0 → chuông đi lên + mưa sao lấp lánh.
 */
export function playOpen(): void {
  // 0 → 1,0s: hồi hộp tăng dần
  noise({ dur: 1.0, vol: 0.12, type: "bandpass", from: 200, to: 3000, q: 1.2, wet: 0.2 });
  tone({ freq: 220, dur: 1.0, type: "sawtooth", vol: 0.05, filter: 1200, glideTo: 880, attack: 0.3, wet: 0.2 });
  [0.5, 0.62, 0.74, 0.84, 0.92].forEach((t) => tone({ freq: 900, start: t, dur: 0.04, type: "triangle", vol: 0.07, glideTo: 600 }));

  // 1,0s: nổ
  const t = 1.0;
  tone({ freq: 200, start: t, dur: 0.28, vol: 0.32, glideTo: 50, attack: 0.002 });
  noise({ start: t, dur: 0.5, vol: 0.14, type: "highpass", from: 2500, wet: 0.5 });
  [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => bell(f, t + 0.02 + i * 0.07, 1.0, 0.13));
  sparkle(t + 0.3, 14, 0.8);
}

/** Hết giờ: 4 tiếng chuông đi xuống + một tiếng gong trầm, nhẹ nhàng (không gắt). */
export function playTimeUp(): void {
  [880, 698.46, 587.33, 440].forEach((f, i) => bell(f, i * 0.16, 0.9, 0.13));
  tone({ freq: 110, start: 0.5, dur: 0.9, vol: 0.2, filter: 400, wet: 0.4, attack: 0.02 });
}

/** Hoàn thành thử thách (~2 giây): chuông đi lên + hợp âm ngân + mưa sao lấp lánh. */
export function playCorrect(): void {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    bell(f, i * 0.09, 1.2, 0.16);
    tone({ freq: f, start: i * 0.09, dur: 0.5, type: "triangle", vol: 0.07, wet: 0.3 });
  });
  bell(1567.98, 0.42, 1.4, 0.13);
  bell(2093, 0.5, 1.4, 0.1);
  // Hợp âm C trưởng ngân (ấm, có lọc)
  [523.25, 659.25, 783.99].forEach((f) =>
    tone({ freq: f, start: 0.36, dur: 1.0, type: "sawtooth", vol: 0.04, filter: 1800, wet: 0.5, attack: 0.03 })
  );
  noise({ start: 0.35, dur: 0.6, vol: 0.05, type: "highpass", from: 5000, wet: 0.4 }); // lấp lánh
  sparkle(0.5, 12, 1.0);
}

/** (Dự phòng, hiện chưa dùng) "wom-wom-womp" vui nhộn, không gắt. */
export function playWrong(): void {
  tone({ freq: 392, start: 0, dur: 0.28, type: "sawtooth", vol: 0.1, filter: 900, glideTo: 370, wet: 0.1 });
  tone({ freq: 349.23, start: 0.3, dur: 0.3, type: "sawtooth", vol: 0.1, filter: 800, glideTo: 330, wet: 0.1 });
  tone({ freq: 261.63, start: 0.62, dur: 0.7, type: "sawtooth", vol: 0.11, filter: 700, glideTo: 185, wet: 0.1, vibrato: true });
}

/** Tiếng "tích" như mõ gỗ mỗi giây trong những giây cuối. */
export function playTick(): void {
  tone({ freq: 1500, dur: 0.05, vol: 0.12, glideTo: 900, attack: 0.002 });
  noise({ dur: 0.03, vol: 0.06, type: "highpass", from: 4000 });
}

/** Tiếng "pốp" nhỏ khi bấm nút. */
export function playSelect(): void {
  tone({ freq: 660, dur: 0.12, type: "triangle", vol: 0.12, glideTo: 990, attack: 0.004, wet: 0.2 });
  noise({ dur: 0.04, vol: 0.04, type: "highpass", from: 3500 });
}

/**
 * Kết thúc trò chơi (~4,5 giây, khớp pháo hoa 4 giây): giai điệu chúc mừng bằng chuông
 * + bè trầm + trống kick/hi-hat + hợp âm lớn cuối bài và mưa sao.
 */
export function playFinale(): void {
  const b = 0.19; // độ dài 1 phách "móc đơn" (giây) — giảm số này để nhạc nhanh hơn

  // Giai điệu: [tần số, vị trí (phách), độ dài (phách)]
  const melody: Array<[number, number, number]> = [
    [523.25, 0, 1], [659.25, 1, 1], [783.99, 2, 1], [1046.5, 3, 1],
    [783.99, 4, 1], [1046.5, 5, 1], [1318.51, 6, 3],
    [1174.66, 9, 1], [1046.5, 10, 1], [987.77, 11, 1], [1046.5, 12, 2],
    [880, 14, 1], [987.77, 15, 1], [1046.5, 16, 1], [1318.51, 17, 1], [1567.98, 18, 3],
  ];
  melody.forEach(([f, beat, len]) => {
    bell(f, beat * b, Math.max(0.6, len * b * 2.5), 0.12);
    tone({ freq: f, start: beat * b, dur: Math.max(0.25, len * b), type: "triangle", vol: 0.06, wet: 0.25 });
  });

  // Bè trầm: C – G – A – F – G – C
  [[130.81, 0], [98, 4], [110, 8], [87.31, 12], [98, 16], [130.81, 21]].forEach(([f, beat]) =>
    tone({ freq: f, start: beat * b, dur: 0.55, vol: 0.2, filter: 600, attack: 0.01 })
  );

  // Nhịp: kick mỗi 4 phách, hi-hat mỗi phách lẻ
  for (let beat = 0; beat <= 20; beat += 4) kick(beat * b);
  for (let beat = 1; beat <= 19; beat += 2) noise({ start: beat * b, dur: 0.05, vol: 0.05, type: "highpass", from: 7000 });

  // Hợp âm kết + mưa sao
  const end = 21 * b;
  [1046.5, 1318.51, 1567.98, 2093].forEach((f, i) => bell(f, end + i * 0.03, 1.8, 0.14));
  [523.25, 659.25, 783.99].forEach((f) =>
    tone({ freq: f, start: end, dur: 1.6, type: "sawtooth", vol: 0.045, filter: 2000, wet: 0.55, attack: 0.04 })
  );
  kick(end, 0.32);
  noise({ start: end, dur: 0.9, vol: 0.08, type: "highpass", from: 5000, wet: 0.5 });
  sparkle(end, 16, 1.4);
}
