"use client";

import { useEffect, useState, type CSSProperties } from "react";

/**
 * NỀN TRANG TRÍ: cánh hoa rơi nhẹ, trái tim bay lên, đám mây trôi,
 * kim tuyến vàng lấp lánh và các mảng sáng hồng/tím/vàng trôi chậm.
 * - Dùng CSS animation (nhẹ hơn JS) — định nghĩa trong app/globals.css.
 * - Vị trí/kích thước/thời gian được random MỘT LẦN sau khi mount
 *   (tránh lệch HTML giữa server và client — hydration mismatch).
 */

interface Item {
  id: number;
  style: CSSProperties;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function makeItems(count: number, make: () => Record<string, string>): Item[] {
  return Array.from({ length: count }, (_, id) => ({ id, style: make() as CSSProperties }));
}

export default function PetalsBackground() {
  const [petals, setPetals] = useState<Item[]>([]);
  const [hearts, setHearts] = useState<Item[]>([]);
  const [clouds, setClouds] = useState<Item[]>([]);
  const [glitters, setGlitters] = useState<Item[]>([]);
  const [auroras, setAuroras] = useState<Item[]>([]);

  useEffect(() => {
    // Ít hơn trên màn hình nhỏ để máy yếu vẫn mượt
    const small = window.innerWidth < 640;

    setPetals(
      makeItems(small ? 12 : 22, () => ({
        "--x": `${rand(0, 100)}%`,
        "--size": `${rand(10, 22)}px`,
        "--dur": `${rand(9, 18)}s`,
        "--delay": `${rand(-18, 0)}s`, // delay âm → hoa đã "đang rơi" ngay khi tải trang
        "--drift": `${rand(-120, 160)}px`,
      }))
    );
    setHearts(
      makeItems(small ? 4 : 8, () => ({
        "--x": `${rand(3, 97)}%`,
        "--size": `${rand(14, 28)}px`,
        "--dur": `${rand(12, 22)}s`,
        "--delay": `${rand(-20, 0)}s`,
        "--drift": `${rand(-60, 60)}px`,
      }))
    );
    setClouds(
      makeItems(3, () => ({
        "--y": `${rand(4, 55)}%`,
        "--size": `${rand(140, 260)}px`,
        "--dur": `${rand(60, 110)}s`,
        "--delay": `${rand(-90, 0)}s`,
      }))
    );

    setGlitters(
      makeItems(small ? 14 : 30, () => ({
        "--x": `${rand(0, 98)}%`,
        "--y": `${rand(0, 96)}%`,
        "--size": `${rand(6, 16)}px`,
        "--dur": `${rand(2.4, 5)}s`,
        "--delay": `${rand(-5, 0)}s`,
      }))
    );
    const blobColors = ["#f9a8d4", "#c4b5fd", "#fde68a"];
    setAuroras(
      blobColors.map((c, id) => ({
        id,
        style: {
          "--x": `${[-10, 60, 25][id]}%`,
          "--y": `${[5, 10, 60][id]}%`,
          "--size": `${rand(320, 460)}px`,
          "--dur": `${rand(14, 22)}s`,
          "--c": c,
        } as CSSProperties,
      }))
    );
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {auroras.map((a) => (
        <span key={`a${a.id}`} className="aurora" style={a.style} />
      ))}
      {clouds.map((c) => (
        <span key={`c${c.id}`} className="cloud" style={c.style} />
      ))}
      {petals.map((p) => (
        <span key={`p${p.id}`} className="petal" style={p.style} />
      ))}
      {glitters.map((g) => (
        <span key={`g${g.id}`} className="glitter" style={g.style} />
      ))}
      {hearts.map((h) => (
        <span key={`h${h.id}`} className="floating-heart" style={h.style}>
          {h.id % 2 === 0 ? "💗" : "💜"}
        </span>
      ))}
    </div>
  );
}
