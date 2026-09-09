"use client";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const base =
  "w-full bg-raised border border-line rounded-2xl px-4 text-[15px] text-text " +
  "placeholder:text-faint transition-colors focus:border-red/60 focus:bg-surface";

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[13px] font-medium text-muted">{children}</span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </span>
  );
}

export function Input({
  label, error, hint, className, ...rest
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <Label hint={hint}>{label}</Label>}
      <input {...rest} className={cn(base, "h-12", error && "border-red", className)} />
      {error && <span className="mt-1.5 block text-[12px] text-red-hot">{error}</span>}
    </label>
  );
}

export function Textarea({
  label, error, className, ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <textarea {...rest} className={cn(base, "py-3 min-h-[88px] resize-none", error && "border-red", className)} />
      {error && <span className="mt-1.5 block text-[12px] text-red-hot">{error}</span>}
    </label>
  );
}

export function Select({
  label, error, className, children, ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <select {...rest} className={cn(base, "h-12 appearance-none", error && "border-red", className)}>
        {children}
      </select>
      {error && <span className="mt-1.5 block text-[12px] text-red-hot">{error}</span>}
    </label>
  );
}
