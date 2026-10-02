import type { Metadata } from "next";
import { ForgotForm } from "@/components/AuthForms";
export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };
export default function ForgotPage() {
  return (
    <div className="mx-auto max-w-[420px] px-4 pt-10">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight">Forgot your password?</h1>
      <p className="mb-6 mt-1.5 text-[13.5px] text-muted">Enter your email and we&apos;ll send a link to set a new one.</p>
      <ForgotForm />
    </div>
  );
}
