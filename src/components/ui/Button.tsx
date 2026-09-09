"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  full?: boolean;
};

const variants = {
  primary: "bg-red text-white active:bg-red-hot disabled:bg-red/40",
  gold: "bg-gold text-ink active:brightness-95 disabled:bg-gold/40",
  outline: "border border-line bg-transparent text-text active:bg-raised",
  ghost: "bg-raised text-text active:bg-line",
  danger: "border border-red/40 text-red-hot bg-red/10 active:bg-red/20",
};

const sizes = {
  sm: "h-9 px-3.5 text-[13px] rounded-xl",
  md: "h-11 px-4 text-sm rounded-2xl",
  lg: "h-14 px-6 text-[15px] rounded-2xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  full,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold",
        "transition-transform duration-150 active:scale-[0.975] disabled:active:scale-100",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        sizes[size],
        full && "w-full",
        className
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
