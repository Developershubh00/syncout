import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "@/components/AuthForms";
export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };
export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="mx-auto max-w-[420px] px-4 pt-10">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight">Set a new password</h1>
      {token ? (
        <div className="mt-6"><ResetForm token={token} /></div>
      ) : (
        <p className="mt-3 text-[13.5px] text-muted">This link is incomplete. <Link href="/forgot" className="text-text underline">Ask for a new one</Link>.</p>
      )}
    </div>
  );
}
