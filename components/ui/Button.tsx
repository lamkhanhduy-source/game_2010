import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * NÚT BẤM DÙNG CHUNG
 * `buttonClass()` trả về chuỗi class để dùng được cả cho <button> lẫn <Link>.
 */

export type ButtonVariant = "primary" | "gold" | "soft" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-lg shadow-rose-300/60 hover:brightness-110",
  gold: "shimmer-gold text-amber-950 shadow-lg shadow-amber-300/60 hover:brightness-105",
  soft: "bg-white/80 text-rose-700 border border-rose-200 hover:bg-rose-50",
  ghost: "bg-transparent text-rose-700 hover:bg-rose-100/70",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-xl",
  md: "px-5 py-2.5 text-base rounded-2xl",
  lg: "px-7 py-3.5 text-lg rounded-2xl",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 select-none",
    VARIANTS[variant],
    SIZES[size],
    extra
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export default function Button({ variant = "primary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}
