"use client";
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 pt-10 text-center">
      <p className="text-[16px] font-semibold">This admin screen failed to load</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-[13px] text-muted">{error.message || "Unknown error"} — if it mentions a missing table, open Overview and click Set up database.</p>
      <button onClick={reset} className="mt-4 h-10 rounded-xl bg-red px-4 text-[13.5px] font-semibold text-white">Try again</button>
    </div>
  );
}
